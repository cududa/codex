import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../../test-support/db.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createVersion,
  findDetectorRunById,
  listConcernGraphEdges,
  listConcernGraphNodes,
  listDetectorFindingsByRun,
  type CommitFileRow,
  type CommitRow,
  type DiffBlockRow,
  type VersionRow,
} from "../../repositories/index.js";
import type { ConcernGraphBuildEdge, ConcernGraphBuildNode, ConcernGraphBuildResult } from "../graph/index.js";
import { runDetector } from "./runDetector.js";
import type { DetectorCommitInput } from "./types.js";

const goalsPath = "codex-rs/core/src/goals.rs";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("detector runner graph replacement scopes", () => {
  it("deletes stale graph rows when an explicitly refreshed scope becomes empty", () => {
    const { version, commit, file, block } = seedReviewTarget({ line: 10 });

    runDetector({
      db: database.db,
      run: runRequest("drun_empty_scope", version),
      graph: graph(
        [
          node("stale-seed", { path: goalsPath, sourceKind: "ast_extractor", startLine: 10 }),
          node("stale-peer", { path: "codex-rs/core/src/stale.rs", sourceKind: "ast_extractor" }),
        ],
        [edge("stale-edge", { fromNodeKey: "stale-seed", toNodeKey: "stale-peer", sourceKind: "ast_extractor" })],
      ),
      commits: [commitInput(commit, [fileInput(file, [block])])],
    });

    expect(listConcernGraphNodes(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" }).map((row) => row.nodeKey)).toEqual([
      "stale-peer",
      "stale-seed",
    ]);
    expect(listConcernGraphEdges(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" }).map((row) => row.edgeKey)).toEqual([
      "stale-edge",
    ]);

    const result = runDetector({
      db: database.db,
      run: runRequest("drun_empty_scope", version),
      graph: graph([]),
      graphReplacementScopes: [{ concernSlug: "goal-continuation", sourceKind: "ast_extractor" }],
      commits: [],
    });

    expect(result.graphNodes).toEqual([]);
    expect(result.graphEdges).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(listDetectorFindingsByRun(database.db, "drun_empty_scope")).toEqual([]);
    expect(listConcernGraphNodes(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" })).toEqual([]);
    expect(listConcernGraphEdges(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" })).toEqual([]);
  });

  it("does not leave partial graph or finding writes after a failed root-database run", () => {
    const { version, commit, file, block } = seedReviewTarget({ line: 22 });

    expect(() =>
      runDetector({
        db: database.db,
        run: runRequest("drun_failed_transaction", version),
        graph: graph(
          [node("valid-seed", { path: goalsPath, sourceKind: "ast_extractor", startLine: 22 })],
          [
            edge("missing-target-edge", {
              fromNodeKey: "valid-seed",
              toNodeKey: "missing-node",
              sourceKind: "ast_extractor",
            }),
          ],
        ),
        commits: [commitInput(commit, [fileInput(file, [block])])],
      }),
    ).toThrow("Concern graph edge references missing node: missing-target-edge");

    expect(findDetectorRunById(database.db, "drun_failed_transaction")).toMatchObject({
      id: "drun_failed_transaction",
      status: "failed",
      error: "Concern graph edge references missing node: missing-target-edge",
    });
    expect(listConcernGraphNodes(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" })).toEqual([]);
    expect(listConcernGraphEdges(database.db, { concernSlug: "goal-continuation", sourceKind: "ast_extractor" })).toEqual([]);
    expect(listDetectorFindingsByRun(database.db, "drun_failed_transaction")).toEqual([]);
  });
});

function seedVersion(): VersionRow {
  return createVersion(database.db, {
    id: "ver_detector_scopes",
    repositoryId: "codex",
    label: "ver_detector_scopes",
    baseSha: "base-detector-scopes",
    targetSha: "target-detector-scopes",
    status: "open",
  });
}

function seedReviewTarget(values: { line: number }): {
  version: VersionRow;
  commit: CommitRow;
  file: CommitFileRow;
  block: DiffBlockRow;
} {
  const version = seedVersion();
  const [commit] = bulkInsertCommits(database.db, [
    {
      id: "cmt_detector_scopes",
      versionId: version.id,
      sha: "detector-scopes-sha",
      ordinal: 1,
      title: "Commit detector scopes",
    },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: "file_detector_scopes",
      commitId: commit.id,
      oldPath: null,
      newPath: goalsPath,
      changeType: "added",
    },
  ]);
  const [block] = bulkInsertDiffBlocks(database.db, [
    {
      id: "blk_detector_scopes",
      commitFileId: file.id,
      blockKey: "detector-scopes-block",
      ordinal: 1,
      contentHash: "detector-scopes-hash",
      oldStartLine: values.line,
      oldEndLine: values.line,
      newStartLine: values.line,
      newEndLine: values.line,
      patch: `@@ -${values.line},1 +${values.line},1 @@\n-old\n+new`,
    },
  ]);

  return { version, commit, file, block };
}

function runRequest(id: string, version: VersionRow): Parameters<typeof runDetector>[0]["run"] {
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
  };
}

function graph(nodes: ConcernGraphBuildNode[], edges: ConcernGraphBuildEdge[] = []): ConcernGraphBuildResult {
  return { nodes, edges };
}

function node(
  nodeKey: string,
  values: {
    path: string;
    sourceKind: ConcernGraphBuildNode["sourceKind"];
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
    symbol: nodeKey,
    sourceKind: values.sourceKind,
    isSeed: true,
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
  },
): ConcernGraphBuildEdge {
  return {
    concernSlug: "goal-continuation",
    edgeKey,
    edgeKind: "calls",
    fromNodeKey: values.fromNodeKey,
    toNodeKey: values.toNodeKey,
    sourceKind: values.sourceKind,
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
