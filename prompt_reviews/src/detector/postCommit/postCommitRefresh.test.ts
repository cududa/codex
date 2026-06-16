import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createDetectorRun,
  createVersion,
  listConcernGraphEdges,
  listConcernGraphNodes,
  listDetectorFindingsByRun,
  replaceDetectorFindingsForRun,
  upsertConcernGraphNode,
} from "../../repositories/index.js";
import type { GitChangedFile } from "../../git/changeFiles.js";
import type { GitClient } from "../../git/gitClient.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../../test-support/db.js";
import { postCommitRefreshRunId, runPostCommitRefresh } from "./postCommitRefresh.js";

const commitSha = "abc1234567890abc1234567890abc1234567890";
const goalsPath = "codex-rs/core/src/goals.rs";

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("post-commit concern graph refresh", () => {
  it("expands graph nodes for changed files without creating findings", async () => {
    const result = await runPostCommitRefresh({
      db: database.db,
      gitClient: fakeGitClient({
        [goalsPath]: `pub fn maybe_start_goal_continuation_turn() {
  prepare_goal_summary();
}

fn prepare_goal_summary() {}
`,
      }),
      repositoryId: "codex-pinned",
    });

    const nodes = listConcernGraphNodes(database.db);

    expect(result).toMatchObject({
      commitSha,
      changedFileCount: 1,
      sourceFileCount: 1,
      findingCount: 0,
    });
    expect(nodes.some((node) => node.path === goalsPath && node.symbol === "maybe_start_goal_continuation_turn")).toBe(true);
    expect(nodes.some((node) => node.path === goalsPath && node.symbol === "prepare_goal_summary")).toBe(true);
    expect(listConcernGraphEdges(database.db).some((edge) => edge.sourceKind === "graph_builder")).toBe(true);
    expect(listDetectorFindingsByRun(database.db, result.runId)).toEqual([]);
  });

  it("is idempotent for the same commit and preserves unrelated detector data", async () => {
    const unrelated = seedUnrelatedFinding();
    const manualNode = upsertConcernGraphNode(database.db, {
      id: "cgn_manual_guard",
      concernSlug: "harness-prompts",
      nodeKey: "manual:guard",
      nodeKind: "file",
      path: "local/manual-guard.md",
      sourceKind: "manual",
      isSeed: true,
      metadataJson: JSON.stringify({ reason: "must survive local refresh" }),
    });
    const concernSeed = upsertConcernGraphNode(database.db, {
      id: "cgn_concern_seed_guard",
      concernSlug: "goal-continuation",
      nodeKey: "goal-continuation:file:seed-guard",
      nodeKind: "file",
      path: "codex-rs/core/src/goals.rs",
      sourceKind: "concern_map",
      isSeed: true,
      metadataJson: JSON.stringify({ reason: "seed rows should not churn" }),
      updatedAt: 42,
    });
    const gitClient = fakeGitClient({
      [goalsPath]: `pub fn maybe_start_goal_continuation_turn() {
  prepare_goal_summary();
}

fn prepare_goal_summary() {}
`,
    });

    const first = await runPostCommitRefresh({
      db: database.db,
      gitClient,
      repositoryId: "codex-pinned",
    });
    const firstNodeKeys = listConcernGraphNodes(database.db).map((node) => node.nodeKey);
    const firstEdgeKeys = listConcernGraphEdges(database.db).map((edge) => edge.edgeKey);
    const second = await runPostCommitRefresh({
      db: database.db,
      gitClient,
      repositoryId: "codex-pinned",
    });

    expect(second).toMatchObject({
      runId: first.runId,
      graphNodeCount: first.graphNodeCount,
      graphEdgeCount: first.graphEdgeCount,
      findingCount: 0,
    });
    expect(listConcernGraphNodes(database.db).map((node) => node.nodeKey)).toEqual(firstNodeKeys);
    expect(listConcernGraphEdges(database.db).map((edge) => edge.edgeKey)).toEqual(firstEdgeKeys);
    expect(listConcernGraphNodes(database.db).find((node) => node.nodeKey === manualNode.nodeKey)).toEqual(manualNode);
    expect(listConcernGraphNodes(database.db).find((node) => node.nodeKey === concernSeed.nodeKey)).toEqual(concernSeed);
    expect(listDetectorFindingsByRun(database.db, unrelated.runId).map((finding) => finding.findingKey)).toEqual([
      unrelated.findingKey,
    ]);
    expect(listDetectorFindingsByRun(database.db, postCommitRefreshRunId("codex-pinned", commitSha))).toEqual([]);
  });
});

function fakeGitClient(files: Record<string, string>): GitClient {
  const changedFiles = Object.keys(files).map((filePath): GitChangedFile => ({
    oldPath: filePath,
    newPath: filePath,
    changeType: "modified",
    additions: 4,
    deletions: 0,
  }));

  return {
    resolveRef: async () => commitSha,
    listCommits: async () => [],
    listChangedFiles: async () => changedFiles,
    getCommitDiff: async () => "",
    getFileAtCommit: async (_commitSha, filePath) => files[filePath] ?? null,
  };
}

function seedUnrelatedFinding(): { runId: string; findingKey: string } {
  const version = createVersion(database.db, {
    id: "ver_unrelated",
    repositoryId: "codex-pinned",
    label: "unrelated",
    baseSha: "base",
    targetSha: "target",
  });
  const [commit] = bulkInsertCommits(database.db, [
    {
      id: "cmt_unrelated",
      versionId: version.id,
      sha: "def456",
      ordinal: 1,
      title: "Unrelated commit",
    },
  ]);
  if (commit === undefined) {
    throw new Error("Expected unrelated commit seed.");
  }
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: "cf_unrelated",
      commitId: commit.id,
      oldPath: goalsPath,
      newPath: goalsPath,
      changeType: "modified",
      additions: 1,
      deletions: 0,
    },
  ]);
  if (file === undefined) {
    throw new Error("Expected unrelated file seed.");
  }
  const [block] = bulkInsertDiffBlocks(database.db, [
    {
      id: "db_unrelated",
      commitFileId: file.id,
      blockKey: "unrelated-block",
      ordinal: 1,
      contentHash: "unrelated-hash",
      oldStartLine: 1,
      oldEndLine: 1,
      newStartLine: 1,
      newEndLine: 1,
      patch: "@@ -1 +1 @@",
    },
  ]);
  if (block === undefined) {
    throw new Error("Expected unrelated block seed.");
  }
  const run = createDetectorRun(database.db, {
    id: "drun_unrelated",
    versionId: version.id,
    repositoryId: "codex-pinned",
    runKind: "version_ingestion",
    status: "succeeded",
    concernMapVersion: 1,
    baseSha: version.baseSha,
    targetSha: version.targetSha,
    startedAt: 1,
    completedAt: 2,
    summaryJson: JSON.stringify({ findings: 1 }),
  });
  const [finding] = replaceDetectorFindingsForRun(database.db, run.id, [
    {
      id: "dfnd_unrelated",
      runId: run.id,
      versionId: version.id,
      commitId: commit.id,
      commitFileId: file.id,
      diffBlockId: block.id,
      findingKey: "unrelated-finding",
      concernSlug: "goal-continuation",
      targetType: "diff_block",
      targetId: block.id,
      path: goalsPath,
      side: "new",
      startLine: 1,
      endLine: 1,
      evidenceKind: "path",
      title: "Unrelated finding",
      summary: "Existing finding should remain.",
      rationale: "Local graph refresh should only clear its own run findings.",
      riskLevel: "low",
      confidence: "low",
      evidenceJson: "[]",
    },
  ]);
  if (finding === undefined) {
    throw new Error("Expected unrelated finding seed.");
  }
  return { runId: run.id, findingKey: finding.findingKey };
}
