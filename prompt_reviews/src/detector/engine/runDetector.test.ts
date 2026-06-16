import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../../test-support/db.js";
import type { ConcernGraphBuildEdge, ConcernGraphBuildNode, ConcernGraphBuildResult } from "../graph/index.js";
import type {
  CommitFileRow,
  CommitRow,
  DiffBlockRow,
  VersionRow,
} from "../../repositories/index.js";
import {
  addComment,
  addTagging,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createDecision,
  createPlan,
  createPlanItem,
  createVersion,
  findClassificationMetadataByTarget,
  findConcernTagBySlug,
  findDetectorRunById,
  listCommentsByScopeStatus,
  listConcernGraphEdges,
  listConcernGraphNodes,
  listDecisionsByTarget,
  listDetectorFindingsByRun,
  listPlanItems,
  listPlansByTarget,
  listTaggingsByTarget,
  seedConcernTagsRepository,
  upsertClassificationMetadata,
} from "../../repositories/index.js";
import { runDetector } from "./runDetector.js";
import type { DetectorCommitInput } from "./types.js";

const goalsPath = "codex-rs/core/src/goals.rs";
const helperPath = "codex-rs/core/src/goal_helper.rs";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("detector runner", () => {
  it("persists detector run, graph nodes, graph edges, and diff-block findings", () => {
    const { version, commit, file, block } = seedReviewTarget({ path: goalsPath, line: 20 });
    const result = runDetector({
      db: database.db,
      run: runRequest("drun_persist", version),
      graph: graph(
        [
          node("goal-seed", { isSeed: true, path: goalsPath, symbol: "GoalRuntimeState", sourceKind: "ast_extractor", startLine: 20 }),
          node("goal-peer", { isSeed: true, path: helperPath, symbol: "prepare_goal_context", sourceKind: "ast_extractor" }),
        ],
        [
          edge("goal-seed-to-peer", {
            fromNodeKey: "goal-seed",
            toNodeKey: "goal-peer",
            sourceKind: "ast_extractor",
          }),
        ],
      ),
      commits: [commitInput(commit, [fileInput(file, [block])])],
    });

    expect(result.run).toMatchObject({ id: "drun_persist", status: "succeeded", error: null });
    expect(result.graphNodes.map((row) => row.nodeKey)).toEqual(["goal-peer", "goal-seed"]);
    expect(result.graphEdges.map((row) => row.edgeKey)).toEqual(["goal-seed-to-peer"]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      runId: "drun_persist",
      versionId: version.id,
      commitId: commit.id,
      commitFileId: file.id,
      diffBlockId: block.id,
      targetType: "diff_block",
      targetId: block.id,
      graphNodeKey: "goal-seed",
      path: goalsPath,
      side: "new",
      startLine: 20,
      endLine: 20,
      confidence: "high",
    });
    expect(result.findings[0]?.graphNodeId).toEqual(result.graphNodes.find((row) => row.nodeKey === "goal-seed")?.id);
    expect(findDetectorRunById(database.db, "drun_persist")?.summaryJson).toBe(
      JSON.stringify({ graphNodes: 2, graphEdges: 1, findings: 1 }),
    );
  });

  it("reruns the same run id by replacing stale findings and graph entries", () => {
    const version = seedVersion();
    const oldTarget = seedReviewTarget({ version, commitId: "cmt_old", fileId: "file_old", blockId: "blk_old", path: goalsPath, line: 11 });
    const newTarget = seedReviewTarget({
      version,
      commitId: "cmt_new",
      fileId: "file_new",
      blockId: "blk_new",
      path: helperPath,
      line: 41,
      ordinal: 2,
    });

    runDetector({
      db: database.db,
      run: runRequest("drun_rerun", version),
      graph: graph(
        [
          node("old-helper", { isSeed: true, path: goalsPath, symbol: "old_goal_helper", sourceKind: "ast_extractor", startLine: 11 }),
          node("stale-peer", { isSeed: true, path: "codex-rs/core/src/stale.rs", symbol: "stale_peer", sourceKind: "ast_extractor" }),
        ],
        [
          edge("old-to-stale", {
            fromNodeKey: "old-helper",
            toNodeKey: "stale-peer",
            sourceKind: "ast_extractor",
          }),
        ],
      ),
      commits: [commitInput(oldTarget.commit, [fileInput(oldTarget.file, [oldTarget.block])])],
    });

    const replacement = runDetector({
      db: database.db,
      run: runRequest("drun_rerun", version),
      graph: graph([
        node("new-helper", { isSeed: true, path: helperPath, symbol: "new_goal_helper", sourceKind: "ast_extractor", startLine: 41 }),
      ]),
      commits: [commitInput(newTarget.commit, [fileInput(newTarget.file, [newTarget.block])])],
    });

    expect(replacement.findings).toHaveLength(1);
    expect(replacement.findings[0]).toMatchObject({
      commitId: newTarget.commit.id,
      commitFileId: newTarget.file.id,
      diffBlockId: newTarget.block.id,
      graphNodeKey: "new-helper",
      confidence: "high",
    });
    expect(listDetectorFindingsByRun(database.db, "drun_rerun").map((row) => row.graphNodeKey)).toEqual([
      "new-helper",
    ]);
    expect(listConcernGraphNodes(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" }).map((row) => row.nodeKey)).toEqual([
      "new-helper",
    ]);
    expect(listConcernGraphEdges(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" })).toEqual([]);
  });

  it("does not delete or mutate review artifacts while persisting detector-owned state", () => {
    const { version, commit, file, block } = seedReviewTarget({ path: goalsPath, line: 30 });
    seedConcernTagsRepository(database.db);
    const tag = findConcernTagBySlug(database.db, "goal.initial-steering");
    if (tag === undefined) {
      throw new Error("Expected concern tag seed.");
    }

    addTagging(database.db, {
      id: "tgg_detector_guard",
      tagId: tag.id,
      targetType: "commit_file",
      targetId: file.id,
      kind: "primary",
      rationale: "Human classification should survive detector refresh.",
      createdByActorType: "human",
      createdAt: 101,
    });
    upsertClassificationMetadata(database.db, {
      id: "clf_detector_guard",
      targetType: "commit_file",
      targetId: file.id,
      summary: "Existing classification.",
      riskLevel: "medium",
      confidence: "high",
      updatedByActorType: "human",
      createdAt: 102,
      updatedAt: 103,
    });
    addComment(database.db, {
      id: "com_detector_guard",
      scope: "commit_file",
      commitFileId: file.id,
      body: "Existing review comment.",
      status: "open",
      authorActorType: "human",
      createdAt: 104,
    });
    createDecision(database.db, {
      id: "dec_detector_guard",
      scope: "commit_file",
      commitFileId: file.id,
      outcome: "accept_with_watch",
      rationale: "Existing decision.",
      proposedByActorType: "human",
      createdAt: 105,
    });
    const plan = createPlan(database.db, {
      id: "pln_detector_guard",
      scope: "commit_file",
      commitFileId: file.id,
      title: "Existing plan",
      summary: "Detector must not own this plan.",
      status: "accepted",
      proposedByActorType: "agent",
      createdAt: 106,
    });
    createPlanItem(database.db, {
      id: "pli_detector_guard",
      planId: plan.id,
      ordinal: 1,
      title: "Existing plan item",
      status: "todo",
      commitFileId: file.id,
      createdAt: 107,
    });

    const before = reviewArtifacts(file.id, plan.id);
    runDetector({
      db: database.db,
      run: runRequest("drun_artifacts", version),
      graph: graph([node("artifact-guard", { isSeed: true, path: goalsPath, symbol: "artifact_guard", sourceKind: "concern_map", startLine: 30 })]),
      commits: [commitInput(commit, [fileInput(file, [block])])],
    });

    expect(reviewArtifacts(file.id, plan.id)).toEqual(before);
  });

  it("flags a later commit that touches an expanded graph node discovered from an earlier source", () => {
    const version = seedVersion();
    const [sourceCommit, laterCommit] = seedCommits(version.id, [
      { id: "cmt_source", sha: "source-sha", ordinal: 1 },
      { id: "cmt_later", sha: "later-sha", ordinal: 2 },
    ]);
    const [laterFile] = bulkInsertCommitFiles(database.db, [
      {
        id: "file_later",
        commitId: laterCommit.id,
        oldPath: null,
        newPath: helperPath,
        changeType: "added",
      },
    ]);
    const [laterBlock] = bulkInsertDiffBlocks(database.db, [
      {
        id: "blk_later",
        commitFileId: laterFile.id,
        blockKey: "later-block",
        ordinal: 1,
        contentHash: "later-hash",
        oldStartLine: 42,
        oldEndLine: 42,
        newStartLine: 42,
        newEndLine: 42,
        patch: "@@ -42,1 +42,1 @@\n-old\n+new",
      },
    ]);

    const result = runDetector({
      db: database.db,
      run: runRequest("drun_sequential", version, { sourceRef: sourceCommit.sha }),
      graph: graph(
        [
          node("source-seed", { isSeed: true, path: goalsPath, symbol: "GoalRuntimeState", sourceKind: "ast_extractor", sourceRef: sourceCommit.sha, startLine: 12 }),
          node("expanded-helper", { isSeed: false, path: helperPath, symbol: "prepare_goal_summary", sourceKind: "graph_builder", sourceRef: sourceCommit.sha, startLine: 42 }),
        ],
        [
          edge("source-to-expanded-helper", {
            fromNodeKey: "source-seed",
            toNodeKey: "expanded-helper",
            sourceKind: "graph_builder",
            sourceRef: sourceCommit.sha,
          }),
        ],
      ),
      commits: [commitInput(laterCommit, [fileInput(laterFile, [laterBlock])])],
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      commitId: laterCommit.id,
      commitFileId: laterFile.id,
      diffBlockId: laterBlock.id,
      graphNodeKey: "expanded-helper",
      confidence: "medium",
      riskLevel: "medium",
    });
    expect(JSON.parse(result.findings[0]?.evidenceJson ?? "[]")).toMatchObject([
      {
        nodeKey: "expanded-helper",
        reason: "medium confidence because changed lines overlap a expanded goal-continuation graph node.",
      },
    ]);
  });
});

function seedVersion(values: Partial<VersionRow> = {}): VersionRow {
  const id = values.id ?? "ver_detector_runner";
  return createVersion(database.db, {
    id,
    repositoryId: values.repositoryId ?? "codex",
    label: values.label ?? id,
    baseSha: values.baseSha ?? `base-${id}`,
    targetSha: values.targetSha ?? `target-${id}`,
    status: values.status ?? "open",
  });
}

function seedReviewTarget(values: {
  version?: VersionRow;
  commitId?: string;
  fileId?: string;
  blockId?: string;
  path: string;
  line: number;
  ordinal?: number;
}): { version: VersionRow; commit: CommitRow; file: CommitFileRow; block: DiffBlockRow } {
  const version = values.version ?? seedVersion();
  const [commit] = seedCommits(version.id, [
    { id: values.commitId ?? "cmt_detector_runner", sha: `${values.commitId ?? "detector"}-sha`, ordinal: values.ordinal ?? 1 },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: values.fileId ?? "file_detector_runner",
      commitId: commit.id,
      oldPath: null,
      newPath: values.path,
      changeType: "added",
    },
  ]);
  const [block] = bulkInsertDiffBlocks(database.db, [
    {
      id: values.blockId ?? "blk_detector_runner",
      commitFileId: file.id,
      blockKey: `${values.blockId ?? "detector"}-block`,
      ordinal: 1,
      contentHash: `${values.blockId ?? "detector"}-hash`,
      oldStartLine: values.line,
      oldEndLine: values.line,
      newStartLine: values.line,
      newEndLine: values.line,
      patch: `@@ -${values.line},1 +${values.line},1 @@\n-old\n+new`,
    },
  ]);

  return { version, commit, file, block };
}

function seedCommits(
  versionId: string,
  rows: Array<{ id: string; sha: string; ordinal: number }>,
): CommitRow[] {
  return bulkInsertCommits(
    database.db,
    rows.map((row) => ({
      id: row.id,
      versionId,
      sha: row.sha,
      ordinal: row.ordinal,
      title: `Commit ${row.ordinal}`,
    })),
  );
}

function runRequest(
  id: string,
  version: VersionRow,
  values: Partial<Parameters<typeof runDetector>[0]["run"]> = {},
): Parameters<typeof runDetector>[0]["run"] {
  return {
    id,
    versionId: version.id,
    repositoryId: version.repositoryId,
    runKind: "test",
    concernMapVersion: 1,
    baseSha: version.baseSha,
    targetSha: version.targetSha,
    startedAt: 200,
    createdAt: 200,
    ...values,
  };
}

function graph(nodes: ConcernGraphBuildNode[], edges: ConcernGraphBuildEdge[] = []): ConcernGraphBuildResult {
  return { nodes, edges };
}

function node(
  nodeKey: string,
  values: {
    isSeed: boolean;
    path: string;
    sourceKind: ConcernGraphBuildNode["sourceKind"];
    symbol?: string;
    sourceRef?: string;
    startLine?: number;
  },
): ConcernGraphBuildNode {
  const range =
    values.startLine === undefined
      ? undefined
      : { startByte: 1, endByte: 2, startLine: values.startLine, endLine: values.startLine };
  return {
    concernSlug: "goal-continuation",
    nodeKey,
    nodeKind: "rust_symbol",
    path: values.path,
    symbol: values.symbol,
    sourceKind: values.sourceKind,
    sourceRef: values.sourceRef,
    isSeed: values.isSeed,
    isKnownMissing: false,
    metadata: range === undefined ? {} : { range },
  };
}

function edge(
  edgeKey: string,
  values: {
    fromNodeKey: string;
    toNodeKey: string;
    sourceKind: ConcernGraphBuildEdge["sourceKind"];
    sourceRef?: string;
  },
): ConcernGraphBuildEdge {
  return {
    concernSlug: "goal-continuation",
    edgeKey,
    edgeKind: "calls",
    fromNodeKey: values.fromNodeKey,
    toNodeKey: values.toNodeKey,
    sourceKind: values.sourceKind,
    sourceRef: values.sourceRef,
    metadata: { reason: "test graph edge" },
  };
}

function commitInput(commit: CommitRow, files: DetectorCommitInput["files"]): DetectorCommitInput {
  return { commitId: commit.id, versionId: commit.versionId, files };
}

function fileInput(
  file: CommitFileRow,
  diffBlocks: DetectorCommitInput["files"][number]["diffBlocks"],
): DetectorCommitInput["files"][number] {
  return {
    commitFileId: file.id,
    oldPath: file.oldPath,
    newPath: file.newPath,
    diffBlocks,
  };
}

function reviewArtifacts(commitFileId: string, planId: string): unknown {
  return {
    comments: listCommentsByScopeStatus(database.db, { scope: "commit_file", targetId: commitFileId }),
    taggings: listTaggingsByTarget(database.db, { targetType: "commit_file", targetId: commitFileId }),
    classification: findClassificationMetadataByTarget(database.db, {
      targetType: "commit_file",
      targetId: commitFileId,
    }),
    decisions: listDecisionsByTarget(database.db, { scope: "commit_file", targetId: commitFileId }),
    plans: listPlansByTarget(database.db, { scope: "commit_file", targetId: commitFileId }),
    planItems: listPlanItems(database.db, planId),
  };
}
