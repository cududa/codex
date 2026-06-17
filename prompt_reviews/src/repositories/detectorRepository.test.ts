import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { classificationMetadata, taggings } from "../db/schema.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createDetectorRun,
  createVersion,
  deleteDetectorRunsByVersion,
  findConcernGraphNodeByKey,
  findDetectorRunById,
  listConcernGraphEdges,
  listConcernGraphNodes,
  listDetectorFindingsByRun,
  listDetectorFindingsByTarget,
  listDetectorFindingSummariesByVersion,
  listDetectorRunsByRepository,
  listDetectorRunsByVersion,
  replaceConcernGraphEdges,
  replaceConcernGraphNodes,
  replaceDetectorFindingsForRun,
  updateDetectorRun,
  upsertConcernGraphNode,
  type CommitFileRow,
  type CommitRow,
  type ConcernGraphNodeInsert,
  type DetectorRunRow,
  type DiffBlockRow,
  type VersionRow,
} from "./index.js";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("detector repositories", () => {
  it("round trips detector runs and updates lifecycle fields", () => {
    const version = seedVersion();
    const run = createDetectorRun(database.db, {
      id: "drun_one",
      versionId: version.id,
      repositoryId: "codex",
      runKind: "version_ingestion",
      status: "running",
      concernMapVersion: 1,
      baseSha: version.baseSha,
      targetSha: version.targetSha,
      startedAt: 100,
      createdAt: 100,
    });
    createDetectorRun(database.db, {
      id: "drun_two",
      versionId: version.id,
      repositoryId: "codex",
      runKind: "manual_refresh",
      status: "running",
      concernMapVersion: 1,
      startedAt: 101,
      createdAt: 101,
    });

    const completed = updateDetectorRun(database.db, run.id, {
      status: "succeeded",
      completedAt: 120,
      summaryJson: JSON.stringify({ findings: 2 }),
      updatedAt: 121,
    });

    expect(findDetectorRunById(database.db, run.id)).toEqual(completed);
    expect(completed).toMatchObject({ id: run.id, status: "succeeded", completedAt: 120, updatedAt: 121 });
    expect(listDetectorRunsByVersion(database.db, version.id).map((row) => row.id)).toEqual([
      "drun_two",
      "drun_one",
    ]);
    expect(listDetectorRunsByRepository(database.db, "codex").map((row) => row.id)).toEqual([
      "drun_two",
      "drun_one",
    ]);
  });

  it("replaces graph nodes and edges deterministically by concern and source", () => {
    const first = upsertConcernGraphNode(database.db, makeGraphNode("cgn_file", "file:client", "file", {
      path: "codex-rs/core/src/client.rs",
      sourceKind: "concern_map",
      isSeed: true,
    }));
    const updated = upsertConcernGraphNode(database.db, makeGraphNode("cgn_file_new_id", "file:client", "file", {
      path: "codex-rs/core/src/client_common.rs",
      sourceKind: "concern_map",
      isSeed: true,
      metadataJson: JSON.stringify({ reason: "refined" }),
    }));
    upsertConcernGraphNode(database.db, makeGraphNode("cgn_symbol", "symbol:build", "rust_symbol", {
      symbol: "build_responses_request",
      sourceKind: "concern_map",
      isSeed: true,
    }));
    upsertConcernGraphNode(database.db, makeGraphNode("cgn_ast", "ast:callee", "rust_symbol", {
      symbol: "Prompt::get_formatted_input",
      sourceKind: "ast_extractor",
    }));

    expect(first.id).toBe("cgn_file");
    expect(updated).toMatchObject({ id: "cgn_file", path: "codex-rs/core/src/client_common.rs" });
    expect(findConcernGraphNodeByKey(database.db, nodeKey("file:client"))).toEqual(updated);

    const replacedNodes = replaceConcernGraphNodes(database.db, {
      concernSlug: "harness-prompts",
      sourceKind: "concern_map",
      nodes: [
        makeGraphNode("cgn_file", "file:client", "file", {
          path: "codex-rs/core/src/client.rs",
          sourceKind: "concern_map",
          isSeed: true,
        }),
        makeGraphNode("cgn_symbol", "symbol:build", "rust_symbol", {
          symbol: "build_responses_request",
          sourceKind: "concern_map",
          isSeed: true,
        }),
      ],
    });

    expect(replacedNodes.map((row) => row.nodeKey)).toEqual([nodeKey("file:client"), nodeKey("symbol:build")]);
    expect(listConcernGraphNodes(database.db, { concernSlug: "harness-prompts" }).map((row) => row.nodeKey)).toEqual([
      nodeKey("ast:callee"),
      nodeKey("file:client"),
      nodeKey("symbol:build"),
    ]);

    const edge = replaceConcernGraphEdges(database.db, {
      concernSlug: "harness-prompts",
      sourceKind: "concern_map",
      edges: [
        {
          id: "cge_one",
          concernSlug: "harness-prompts",
          edgeKey: edgeKey("owns-symbol"),
          edgeKind: "owns_symbol",
          fromNodeId: replacedNodes[0].id,
          toNodeId: replacedNodes[1].id,
          sourceKind: "concern_map",
          metadataJson: JSON.stringify({ source: "seed" }),
        },
      ],
    });

    expect(edge).toHaveLength(1);
    expect(listConcernGraphEdges(database.db, { concernSlug: "harness-prompts" })).toEqual(edge);
    expect(
      replaceConcernGraphEdges(database.db, {
        concernSlug: "harness-prompts",
        sourceKind: "concern_map",
        edges: [],
      }),
    ).toEqual([]);
    expect(listConcernGraphEdges(database.db, { concernSlug: "harness-prompts" })).toEqual([]);
  });

  it("replaces findings per run, summarizes by version, and stays separate from classifications", () => {
    const { version, commit, file, block } = seedReviewTarget();
    const graphNode = upsertConcernGraphNode(database.db, makeGraphNode("cgn_goal", "file:goals", "file", {
      path: "codex-rs/core/src/goals.rs",
      sourceKind: "concern_map",
      isSeed: true,
    }));
    const run = seedRun(version);
    const firstFindings = replaceDetectorFindingsForRun(database.db, run.id, [
      {
        id: "dfnd_file",
        runId: run.id,
        versionId: version.id,
        commitId: commit.id,
        commitFileId: file.id,
        graphNodeId: graphNode.id,
        graphNodeKey: graphNode.nodeKey,
        findingKey: "file:goal-continuation",
        concernSlug: "goal-continuation",
        targetType: "commit_file",
        targetId: file.id,
        path: "codex-rs/core/src/goals.rs",
        side: "new",
        startLine: 40,
        endLine: 44,
        symbol: "maybe_start_goal_continuation_turn",
        evidenceKind: "symbol",
        title: "Goal continuation surface changed",
        summary: "A mapped continuation path changed.",
        rationale: "The changed symbol controls active-goal continuation.",
        riskLevel: "high",
        confidence: "medium",
        evidenceJson: JSON.stringify([{ nodeKey: graphNode.nodeKey, reason: "Seed path matched." }]),
      },
      {
        id: "dfnd_block",
        runId: run.id,
        versionId: version.id,
        commitId: commit.id,
        commitFileId: file.id,
        diffBlockId: block.id,
        graphNodeId: graphNode.id,
        graphNodeKey: graphNode.nodeKey,
        findingKey: "block:goal-continuation",
        concernSlug: "goal-continuation",
        targetType: "diff_block",
        targetId: block.id,
        path: "codex-rs/core/src/goals.rs",
        side: "new",
        startLine: 45,
        endLine: 47,
        marker: "Continue working toward the active thread goal.",
        evidenceKind: "marker",
        title: "Goal continuation diff block changed",
        summary: "A mapped continuation diff block changed.",
        rationale: "The diff block overlaps a seeded continuation prompt marker.",
        riskLevel: "medium",
        confidence: "high",
        evidenceJson: JSON.stringify([{ nodeKey: graphNode.nodeKey, reason: "Diff block overlaps seed path." }]),
      },
    ]);

    expect(firstFindings).toHaveLength(2);
    expect(listDetectorFindingsByRun(database.db, run.id).map((row) => row.findingKey)).toEqual([
      "block:goal-continuation",
      "file:goal-continuation",
    ]);
    expect(listDetectorFindingsByTarget(database.db, { targetType: "commit_file", targetId: file.id })).toHaveLength(1);
    expect(listDetectorFindingSummariesByVersion(database.db, version.id)).toEqual([
      {
        concernSlug: "goal-continuation",
        targetType: "commit_file",
        targetId: file.id,
        count: 1,
        highestRiskLevel: "high",
        highestConfidence: "medium",
        evidenceSummaries: ["A mapped continuation path changed."],
      },
      {
        concernSlug: "goal-continuation",
        targetType: "diff_block",
        targetId: block.id,
        count: 1,
        highestRiskLevel: "medium",
        highestConfidence: "high",
        evidenceSummaries: ["A mapped continuation diff block changed."],
      },
    ]);
    expect(database.db.select().from(taggings).all()).toEqual([]);
    expect(database.db.select().from(classificationMetadata).all()).toEqual([]);

    const replacement = replaceDetectorFindingsForRun(database.db, run.id, [
      {
        id: "dfnd_replacement",
        runId: run.id,
        versionId: version.id,
        commitId: commit.id,
        findingKey: "commit:goal-continuation",
        concernSlug: "goal-continuation",
        targetType: "commit",
        targetId: commit.id,
        evidenceKind: "path",
        title: "Goal continuation commit changed",
        summary: "A mapped continuation commit changed.",
        rationale: "The commit touches a mapped continuation path.",
        riskLevel: "low",
        confidence: "high",
      },
    ]);

    expect(replacement.map((row) => row.findingKey)).toEqual(["commit:goal-continuation"]);
    expect(listDetectorFindingsByRun(database.db, run.id).map((row) => row.findingKey)).toEqual([
      "commit:goal-continuation",
    ]);
  });

  it("deletes detector runs for a version without touching review artifacts", () => {
    const { version } = seedReviewTarget();
    const run = seedRun(version);
    replaceDetectorFindingsForRun(database.db, run.id, [
      {
        id: "dfnd_version",
        runId: run.id,
        versionId: version.id,
        findingKey: "version:harness-prompts",
        concernSlug: "harness-prompts",
        targetType: "version",
        targetId: version.id,
        evidenceKind: "path",
        title: "Harness prompt version finding",
        summary: "Version contains mapped prompt changes.",
        rationale: "The version includes a mapped harness prompt path.",
        riskLevel: "medium",
        confidence: "high",
      },
    ]);

    expect(deleteDetectorRunsByVersion(database.db, version.id).map((row) => row.id)).toEqual([run.id]);
    expect(listDetectorFindingsByRun(database.db, run.id)).toEqual([]);
  });
});

function seedVersion(values: Partial<VersionRow> = {}): VersionRow {
  const id = values.id ?? "ver_detector";
  return createVersion(database.db, {
    id,
    repositoryId: values.repositoryId ?? "codex",
    label: values.label ?? id,
    baseSha: values.baseSha ?? `base-${id}`,
    targetSha: values.targetSha ?? `target-${id}`,
    status: values.status ?? "open",
  });
}

function seedReviewTarget(): {
  version: VersionRow;
  commit: CommitRow;
  file: CommitFileRow;
  block: DiffBlockRow;
} {
  const version = seedVersion();
  const [commit] = bulkInsertCommits(database.db, [
    {
      id: "cmt_detector",
      versionId: version.id,
      sha: "detector-sha",
      ordinal: 1,
      title: "Change mapped concern surface",
    },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: "file_detector",
      commitId: commit.id,
      oldPath: "codex-rs/core/src/goals.rs",
      newPath: "codex-rs/core/src/goals.rs",
      changeType: "modified",
    },
  ]);
  const [block] = bulkInsertDiffBlocks(database.db, [
    {
      id: "blk_detector",
      commitFileId: file.id,
      blockKey: "goal-block",
      ordinal: 1,
      contentHash: "goal-hash",
      patch: "@@ goal patch",
    },
  ]);

  return { version, commit, file, block };
}

function seedRun(version: VersionRow): DetectorRunRow {
  return createDetectorRun(database.db, {
    id: "drun_detector",
    versionId: version.id,
    repositoryId: "codex",
    runKind: "version_ingestion",
    status: "running",
    concernMapVersion: 1,
  });
}

function nodeKey(suffix: string): string {
  return `harness-prompts:${suffix}`;
}

function edgeKey(suffix: string): string {
  return `harness-prompts:${suffix}`;
}

function makeGraphNode(
  id: string,
  keySuffix: string,
  nodeKind: ConcernGraphNodeInsert["nodeKind"],
  values: Partial<ConcernGraphNodeInsert>,
): ConcernGraphNodeInsert {
  return {
    id,
    concernSlug: "harness-prompts",
    nodeKey: nodeKey(keySuffix),
    nodeKind,
    sourceKind: "concern_map",
    ...values,
  };
}
