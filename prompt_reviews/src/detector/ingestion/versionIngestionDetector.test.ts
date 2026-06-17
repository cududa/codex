import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GitClient } from "../../git/gitClient.js";
import {
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createVersion,
  listConcernGraphNodes,
  listDetectorFindingsByRun,
  listDetectorRunsByVersion,
} from "../../repositories/index.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../../test-support/db.js";
import { rerunVersionIngestionDetector, versionIngestionRunId } from "./versionIngestionDetector.js";

const docsPath = "docs/goal-template.md";
const firstCommitSha = "a".repeat(40);
const secondCommitSha = "b".repeat(40);

let database: TempPromptReviewsDatabase;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
});

afterEach(() => {
  database.cleanup();
});

describe("version ingestion detector rerun", () => {
  it("reruns an existing version with a stable run id and replaces stale graph and finding rows", async () => {
    const version = seedVersionWithSequentialGoalTemplateEdit();
    const runId = versionIngestionRunId(version.id);

    const first = await rerunVersionIngestionDetector({
      db: database.db,
      gitClient: makeGitClient(
        new Map([
          [`${firstCommitSha}:${docsPath}`, "create_goal /goal template\n"],
          [`${secondCommitSha}:${docsPath}`, "create_goal /goal template adjusted\n"],
        ]),
      ),
      repositoryId: "codex",
      versionId: version.id,
    });

    expect(first.run.id).toBe(runId);
    expect(listDetectorRunsByVersion(database.db, version.id).map((run) => run.id)).toEqual([runId]);
    expect(listDetectorFindingsByRun(database.db, runId).map((finding) => finding.path)).toEqual(
      expect.arrayContaining([docsPath]),
    );
    expect(listDetectorFindingsByRun(database.db, runId).length).toBeGreaterThan(0);
    expect(
      listConcernGraphNodes(database.db)
        .filter((node) => node.path === docsPath)
        .map((node) => node.marker),
    ).toContain("create_goal");

    const second = await rerunVersionIngestionDetector({
      db: database.db,
      gitClient: makeGitClient(
        new Map([
          [`${firstCommitSha}:${docsPath}`, "plain template text\n"],
          [`${secondCommitSha}:${docsPath}`, "plain template text adjusted\n"],
        ]),
      ),
      repositoryId: "codex",
      versionId: version.id,
    });

    expect(second.run.id).toBe(runId);
    expect(listDetectorRunsByVersion(database.db, version.id).map((run) => run.id)).toEqual([runId]);
    expect(listDetectorFindingsByRun(database.db, runId)).toEqual([]);
    expect(listConcernGraphNodes(database.db).filter((node) => node.path === docsPath)).toEqual([]);
  });
});

function seedVersionWithSequentialGoalTemplateEdit() {
  const version = createVersion(database.db, {
    id: "ver_version_ingestion_rerun",
    repositoryId: "codex",
    label: "version-ingestion-rerun",
    baseSha: "1".repeat(40),
    targetSha: "2".repeat(40),
  });
  const [firstCommit, secondCommit] = bulkInsertCommits(database.db, [
    {
      id: "cmt_goal_template_source",
      versionId: version.id,
      sha: firstCommitSha,
      parentSha: version.baseSha,
      ordinal: 1,
      title: "Add goal template",
    },
    {
      id: "cmt_goal_template_later",
      versionId: version.id,
      sha: secondCommitSha,
      parentSha: firstCommitSha,
      ordinal: 2,
      title: "Edit goal template",
    },
  ]);
  const [sourceFile, laterFile] = bulkInsertCommitFiles(database.db, [
    {
      id: "file_goal_template_source",
      commitId: firstCommit.id,
      oldPath: null,
      newPath: docsPath,
      changeType: "added",
      additions: 1,
      deletions: 0,
    },
    {
      id: "file_goal_template_later",
      commitId: secondCommit.id,
      oldPath: docsPath,
      newPath: docsPath,
      changeType: "modified",
      additions: 1,
      deletions: 1,
    },
  ]);

  bulkInsertDiffBlocks(database.db, [
    {
      id: "blk_goal_template_source",
      commitFileId: sourceFile.id,
      blockKey: "hunk-0001",
      ordinal: 1,
      contentHash: "source-hash",
      oldStartLine: null,
      oldEndLine: null,
      newStartLine: 1,
      newEndLine: 1,
      patch: "@@ -0,0 +1 @@\n+create_goal /goal template",
    },
    {
      id: "blk_goal_template_later",
      commitFileId: laterFile.id,
      blockKey: "hunk-0001",
      ordinal: 1,
      contentHash: "later-hash",
      oldStartLine: 1,
      oldEndLine: 1,
      newStartLine: 1,
      newEndLine: 1,
      patch: "@@ -1 +1 @@\n-create_goal /goal template\n+create_goal /goal template adjusted",
    },
  ]);

  return version;
}

function makeGitClient(fileContents: ReadonlyMap<string, string | null>): GitClient {
  return {
    async resolveRef(refOrSha) {
      return refOrSha;
    },
    async listCommits() {
      return [];
    },
    async listChangedFiles() {
      return [];
    },
    async getCommitDiff() {
      return "";
    },
    async getFileAtCommit(commitSha, filePath) {
      return fileContents.get(`${commitSha}:${filePath}`) ?? null;
    },
  };
}
