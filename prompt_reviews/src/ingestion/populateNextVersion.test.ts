import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { comments } from "../db/schema.js";
import type { GitChangedFile } from "../git/changeFiles.js";
import type { GitCommit } from "../git/commitLog.js";
import type { GitClient } from "../git/gitClient.js";
import {
  createVersion,
  listCommitFilesMissingActiveDecision,
  listCommitFilesByCommit,
  listCommitsMissingActiveDecision,
  listCommitsByVersion,
  listConcernGraphNodes,
  listDetectorFindingsByRun,
  listDetectorRunsByVersion,
  listDiffBlocksByCommitFile,
} from "../repositories/index.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import { populateNextVersion } from "./populateNextVersion.js";

const baseSha = "1".repeat(40);
const targetSha = "2".repeat(40);
const explicitBaseSha = "3".repeat(40);
const explicitTargetSha = "4".repeat(40);
const firstCommitSha = "a".repeat(40);
const secondCommitSha = "b".repeat(40);

let database: TempPromptReviewsDatabase;
let repositoryPath: string;

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  repositoryPath = path.join(tmpdir(), `prompt-reviews-fixture-${randomUUID()}`);
  mkdirSync(repositoryPath, { recursive: true });
});

afterEach(() => {
  database.cleanup();
  rmSync(repositoryPath, { force: true, recursive: true });
});

describe("populateNextVersion", () => {
  it("uses the most recent closed version target SHA as the default base", async () => {
    insertClosedVersion("ver_old", "closed-old", 100);
    insertClosedVersion("ver_new", baseSha, 200);
    const gitClient = makeGitClient({ commits: [] });

    const response = await populateNextVersion(
      database.db,
      { repositoryId: "codex", label: "default-base" },
      { gitClient, repositoryPath },
    );

    expect(response).toMatchObject({
      baseSha,
      targetSha,
      commitCount: 0,
      fileCount: 0,
      diffBlockCount: 0,
      created: true,
    });
    expect(gitClient.resolvedRefs).toEqual(["upstream/main", baseSha]);
  });

  it("requires an explicit base when no closed version exists", async () => {
    await expect(
      populateNextVersion(database.db, { repositoryId: "codex" }, { gitClient: makeGitClient(), repositoryPath }),
    ).rejects.toMatchObject({
      code: "base_required",
    });
  });

  it("populates an explicit interval with ordered commits, files, and diff blocks", async () => {
    writeFileSync(path.join(repositoryPath, "comments.json"), "[]", "utf8");
    const gitClient = makeGitClient();

    const response = await populateNextVersion(
      database.db,
      {
        repositoryId: "codex",
        baseRefOrSha: "feature-base",
        targetRef: "origin/feature",
        label: "explicit-interval",
      },
      { gitClient, repositoryPath },
    );

    expect(response).toMatchObject({
      baseSha: explicitBaseSha,
      targetSha: explicitTargetSha,
      commitCount: 2,
      fileCount: 6,
      diffBlockCount: 6,
      created: true,
    });
    expect(gitClient.resolvedRefs).toEqual(["origin/feature", "feature-base"]);

    const commits = listCommitsByVersion(database.db, response.version.id);
    expect(
      commits.map(({ sha, parentSha, ordinal, title, message, authorName, authorEmail, committedAt }) => ({
        sha,
        parentSha,
        ordinal,
        title,
        message,
        authorName,
        authorEmail,
        committedAt,
      })),
    ).toEqual([
      {
        sha: firstCommitSha,
        parentSha: explicitBaseSha,
        ordinal: 1,
        title: "First structured commit",
        message: "Body for first commit.",
        authorName: "Alice",
        authorEmail: "alice@example.test",
        committedAt: 1000,
      },
      {
        sha: secondCommitSha,
        parentSha: firstCommitSha,
        ordinal: 2,
        title: "Second structured commit",
        message: null,
        authorName: "Bob",
        authorEmail: "bob@example.test",
        committedAt: 1100,
      },
    ]);

    const files = commits.flatMap((commit) => listCommitFilesByCommit(database.db, commit.id));
    const fileFacts = files.map(({ oldPath, newPath, changeType, additions, deletions }) => ({
      oldPath,
      newPath,
      changeType,
      additions,
      deletions,
    }));
    expect(fileFacts).toHaveLength(6);
    expect(fileFacts).toEqual(expect.arrayContaining([
      { oldPath: null, newPath: "src/added.ts", changeType: "added", additions: 2, deletions: 0 },
      { oldPath: "src/source.ts", newPath: "src/copied.ts", changeType: "copied", additions: 1, deletions: 0 },
      { oldPath: "src/modified.ts", newPath: "src/modified.ts", changeType: "modified", additions: 2, deletions: 1 },
      { oldPath: "src/old-name.ts", newPath: "src/new-name.ts", changeType: "renamed", additions: 1, deletions: 1 },
      { oldPath: "src/deleted.ts", newPath: null, changeType: "deleted", additions: 0, deletions: 2 },
      { oldPath: "scripts/run.sh", newPath: "scripts/run.sh", changeType: "mode_changed", additions: 0, deletions: 0 },
    ]));

    const addedFile = files.find((file) => file.newPath === "src/added.ts");
    const modeFile = files.find((file) => file.newPath === "scripts/run.sh");
    if (addedFile === undefined || modeFile === undefined) {
      throw new Error("Expected imported file rows.");
    }

    const addedBlocks = listDiffBlocksByCommitFile(database.db, addedFile.id);
    expect(addedBlocks).toMatchObject([
      {
        blockKey: "hunk-0001",
        ordinal: 1,
        oldStartLine: null,
        oldEndLine: null,
        newStartLine: 1,
        newEndLine: 2,
        patch: "@@ -0,0 +1,2 @@\n+hello\n+world",
      },
    ]);
    expect(addedBlocks[0].contentHash).toMatch(/^[a-f0-9]{64}$/);

    const modeBlocks = listDiffBlocksByCommitFile(database.db, modeFile.id);
    expect(modeBlocks).toMatchObject([{ blockKey: "hunk-0001", ordinal: 1, oldStartLine: null, newStartLine: null }]);
    expect(findFiles(repositoryPath, ".prompt-review.md")).toEqual([]);
    expect(database.db.select().from(comments).all()).toEqual([]);
  });

  it("runs concern detection during ingestion with sequential graph growth", async () => {
    const gitClient = makeSequentialDetectorGitClient();

    const response = await populateNextVersion(
      database.db,
      {
        repositoryId: "codex",
        baseRefOrSha: "feature-base",
        targetRef: "origin/feature",
        label: "sequential-detector",
      },
      { gitClient, repositoryPath },
    );

    expect(response.detector).toMatchObject({
      runCount: 1,
      latestRunStatus: "succeeded",
    });
    expect(response.detector.findingCount).toBeGreaterThan(0);
    expect(response.version.progress).toMatchObject({
      totalCommits: 2,
      reviewedCommits: 0,
      totalFiles: 2,
      reviewedFiles: 0,
      remainingWorkCount: 4,
    });

    const commits = listCommitsByVersion(database.db, response.version.id);
    const runs = listDetectorRunsByVersion(database.db, response.version.id);
    const findings = listDetectorFindingsByRun(database.db, runs[0]?.id ?? "");
    const touchedCommitIds = new Set(findings.map((finding) => finding.commitId));

    expect(runs).toHaveLength(1);
    expect(findings).toHaveLength(response.detector.findingCount);
    expect(touchedCommitIds).toEqual(new Set([commits[1]?.id]));
    expect(findings.every((finding) => finding.targetType === "diff_block")).toBe(true);
    expect(findings.every((finding) => finding.path === "docs/goal-template.md")).toBe(true);
    expect(findings.every((finding) => finding.confidence === "high")).toBe(true);
    expect(findings.some((finding) => finding.marker === "create_goal")).toBe(true);
    expect(
      listConcernGraphNodes(database.db, { sourceKind: "text_scanner" }).some(
        (node) => node.path === "docs/goal-template.md" && node.marker === "create_goal",
      ),
    ).toBe(true);
    expect(listCommitsMissingActiveDecision(database.db, { versionId: response.version.id }).map((row) => row.id)).toEqual(
      commits.map((commit) => commit.id),
    );

    const secondCommit = commits[1];
    if (secondCommit === undefined) {
      throw new Error("Expected second ingested commit.");
    }
    expect(listCommitFilesMissingActiveDecision(database.db, { commitId: secondCommit.id })).toHaveLength(1);
  });

  it("returns the existing version on rerun instead of duplicating rows", async () => {
    const gitClient = makeGitClient();
    const params = {
      repositoryId: "codex",
      baseRefOrSha: "feature-base",
      targetRef: "origin/feature",
      label: "idempotent-interval",
    };

    const first = await populateNextVersion(database.db, params, { gitClient, repositoryPath });
    const second = await populateNextVersion(database.db, params, { gitClient, repositoryPath });

    expect(second).toMatchObject({
      version: { id: first.version.id },
      baseSha: first.baseSha,
      targetSha: first.targetSha,
      commitCount: first.commitCount,
      fileCount: first.fileCount,
      diffBlockCount: first.diffBlockCount,
      detector: first.detector,
      created: false,
    });
    expect(listCommitsByVersion(database.db, first.version.id).length).toBe(2);
    expect(listDetectorRunsByVersion(database.db, first.version.id)).toHaveLength(1);
    expect(gitClient.listCommitCalls).toBe(1);
  });
});

function insertClosedVersion(id: string, target: string, closedAt: number): void {
  createVersion(database.db, {
    id,
    repositoryId: "codex",
    label: id,
    baseSha: `${id}-base`,
    targetSha: target,
    status: "closed",
    closedAt,
  });
}

type FakeGitClient = GitClient & {
  resolvedRefs: string[];
  listCommitCalls: number;
};

function makeGitClient(options: { commits?: GitCommit[]; fileContents?: Map<string, string | null> } = {}): FakeGitClient {
  const resolvedRefs: string[] = [];
  const state = { listCommitCalls: 0 };
  const commits = options.commits ?? [
    {
      sha: firstCommitSha,
      parentSha: explicitBaseSha,
      subject: "First structured commit",
      body: "Body for first commit.",
      authorName: "Alice",
      authorEmail: "alice@example.test",
      committedAt: 1000,
    },
    {
      sha: secondCommitSha,
      parentSha: firstCommitSha,
      subject: "Second structured commit",
      body: null,
      authorName: "Bob",
      authorEmail: "bob@example.test",
      committedAt: 1100,
    },
  ];
  const refs = new Map([
    ["upstream/main", targetSha],
    [baseSha, baseSha],
    ["feature-base", explicitBaseSha],
    ["origin/feature", explicitTargetSha],
  ]);
  const changedFilesByCommit = new Map<string, GitChangedFile[]>([
    [
      firstCommitSha,
      [
        { oldPath: null, newPath: "src/added.ts", changeType: "added", additions: 2, deletions: 0 },
        { oldPath: "src/modified.ts", newPath: "src/modified.ts", changeType: "modified", additions: 2, deletions: 1 },
        { oldPath: "src/deleted.ts", newPath: null, changeType: "deleted", additions: 0, deletions: 2 },
      ],
    ],
    [
      secondCommitSha,
      [
        { oldPath: "src/old-name.ts", newPath: "src/new-name.ts", changeType: "renamed", additions: 1, deletions: 1 },
        { oldPath: "src/source.ts", newPath: "src/copied.ts", changeType: "copied", additions: 1, deletions: 0 },
        { oldPath: "scripts/run.sh", newPath: "scripts/run.sh", changeType: "mode_changed", additions: 0, deletions: 0 },
      ],
    ],
  ]);
  const diffsByCommit = new Map([
    [firstCommitSha, firstCommitDiff()],
    [secondCommitSha, secondCommitDiff()],
  ]);
  const fileContents = options.fileContents ?? new Map<string, string | null>();

  return {
    resolvedRefs,
    get listCommitCalls() {
      return state.listCommitCalls;
    },
    async resolveRef(refOrSha) {
      resolvedRefs.push(refOrSha);
      return refs.get(refOrSha) ?? refOrSha;
    },
    async listCommits() {
      state.listCommitCalls += 1;
      return commits;
    },
    async listChangedFiles(commitSha) {
      return changedFilesByCommit.get(commitSha) ?? [];
    },
    async getCommitDiff(commitSha) {
      return diffsByCommit.get(commitSha) ?? "";
    },
    async getFileAtCommit(commitSha, filePath) {
      return fileContents.get(`${commitSha}:${filePath}`) ?? null;
    },
  };
}

function makeSequentialDetectorGitClient(): FakeGitClient {
  const fileContents = new Map<string, string | null>([
    [`${firstCommitSha}:docs/goal-template.md`, "create_goal /goal template\n"],
    [`${secondCommitSha}:docs/goal-template.md`, "create_goal /goal template adjusted\n"],
  ]);
  const gitClient = makeGitClient({
    commits: [
      {
        sha: firstCommitSha,
        parentSha: explicitBaseSha,
        subject: "Add goal template",
        body: null,
        authorName: "Alice",
        authorEmail: "alice@example.test",
        committedAt: 1000,
      },
      {
        sha: secondCommitSha,
        parentSha: firstCommitSha,
        subject: "Edit goal template",
        body: null,
        authorName: "Bob",
        authorEmail: "bob@example.test",
        committedAt: 1100,
      },
    ],
    fileContents,
  });

  return {
    ...gitClient,
    async listChangedFiles(commitSha) {
      if (commitSha === firstCommitSha) {
        return [{ oldPath: null, newPath: "docs/goal-template.md", changeType: "added", additions: 1, deletions: 0 }];
      }
      return [
        {
          oldPath: "docs/goal-template.md",
          newPath: "docs/goal-template.md",
          changeType: "modified",
          additions: 1,
          deletions: 1,
        },
      ];
    },
    async getCommitDiff(commitSha) {
      return commitSha === firstCommitSha ? firstSequentialDetectorDiff() : secondSequentialDetectorDiff();
    },
  };
}

function firstCommitDiff(): string {
  return [
    "diff --git a/src/added.ts b/src/added.ts",
    "new file mode 100644",
    "--- /dev/null",
    "+++ b/src/added.ts",
    "@@ -0,0 +1,2 @@",
    "+hello",
    "+world",
    "diff --git a/src/modified.ts b/src/modified.ts",
    "--- a/src/modified.ts",
    "+++ b/src/modified.ts",
    "@@ -1,2 +1,3 @@ function modified",
    " const keep = true;",
    "-oldCall();",
    "+newCall();",
    "+extraCall();",
    "diff --git a/src/deleted.ts b/src/deleted.ts",
    "deleted file mode 100644",
    "--- a/src/deleted.ts",
    "+++ /dev/null",
    "@@ -1,2 +0,0 @@",
    "-removeMe();",
    "-removeMeToo();",
  ].join("\n");
}

function secondCommitDiff(): string {
  return [
    "diff --git a/src/old-name.ts b/src/new-name.ts",
    "similarity index 70%",
    "rename from src/old-name.ts",
    "rename to src/new-name.ts",
    "--- a/src/old-name.ts",
    "+++ b/src/new-name.ts",
    "@@ -1 +1 @@",
    "-oldName();",
    "+newName();",
    "diff --git a/src/source.ts b/src/copied.ts",
    "similarity index 80%",
    "copy from src/source.ts",
    "copy to src/copied.ts",
    "--- a/src/source.ts",
    "+++ b/src/copied.ts",
    "@@ -1 +1,2 @@",
    " source();",
    "+copied();",
    "diff --git a/scripts/run.sh b/scripts/run.sh",
    "old mode 100644",
    "new mode 100755",
  ].join("\n");
}

function firstSequentialDetectorDiff(): string {
  return [
    "diff --git a/docs/goal-template.md b/docs/goal-template.md",
    "new file mode 100644",
    "--- /dev/null",
    "+++ b/docs/goal-template.md",
    "@@ -0,0 +1 @@",
    "+create_goal /goal template",
  ].join("\n");
}

function secondSequentialDetectorDiff(): string {
  return [
    "diff --git a/docs/goal-template.md b/docs/goal-template.md",
    "--- a/docs/goal-template.md",
    "+++ b/docs/goal-template.md",
    "@@ -1 +1 @@",
    "-create_goal /goal template",
    "+create_goal /goal template adjusted",
  ].join("\n");
}

function findFiles(directory: string, fileName: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findFiles(entryPath, fileName));
    } else if (entry.isFile() && entry.name === fileName) {
      found.push(entryPath);
    }
  }
  return found;
}
