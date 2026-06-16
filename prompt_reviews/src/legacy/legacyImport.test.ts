import path from "node:path";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkArchitecture } from "../../scripts/check-architecture.js";
import { createTempPromptReviewsDatabase, type TempPromptReviewsDatabase } from "../test-support/db.js";
import {
  addComment,
  bulkInsertCommitFiles,
  bulkInsertCommits,
  bulkInsertDiffBlocks,
  createVersion,
  listCommentsByScopeStatus,
  listDiffBlocksByCommitFile,
  type CommitFileRow,
  type CommitRow,
  type VersionRow,
} from "../repositories/index.js";
import { createServiceContext, type RootServiceContext } from "../services/serviceContext.js";
import { importLegacyCommentsJson } from "./commentsJsonImport.js";
import { exportMarkdownReport } from "./exportMarkdownReport.js";
import { parseLegacyMarkdownReview, summarizeLegacyMarkdownReview } from "./markdownImport.js";

let database: TempPromptReviewsDatabase;
let context: RootServiceContext;
let target: { version: VersionRow; commit: CommitRow; file: CommitFileRow };

const fixtureRoot = path.resolve("..");
const commentsJsonPath = path.join(fixtureRoot, "prompt_reviews/src/test-support/fixtures/legacy/comments.json");
const ambiguousCommentsJsonPath = path.join(
  fixtureRoot,
  "prompt_reviews/src/test-support/fixtures/legacy/comments-ambiguous.json",
);
const markdownPath = "prompt_reviews/src/test-support/fixtures/legacy/prompt_reviews/legacy123/continuation.prompt-review.md";

beforeEach(() => {
  database = createTempPromptReviewsDatabase({ migrate: true });
  context = createServiceContext({ db: database.db, now: () => 10_000 });
  target = seedReviewTarget();
});

afterEach(() => {
  database.cleanup();
});

describe("legacy import", () => {
  it("imports legacy comments JSON into structured comments", async () => {
    const report = await importLegacyCommentsJson(context, {
      projectRoot: fixtureRoot,
      commentsJsonPath,
      dryRun: false,
    });

    const [block] = listDiffBlocksByCommitFile(database.db, target.file.id);
    const comments = listCommentsByScopeStatus(database.db, { scope: "diff_block", targetId: block.id });
    expect(report.counts.comments).toBe(1);
    expect(comments).toEqual([
      {
        ...comments[0],
        scope: "diff_block",
        diffBlockId: block.id,
        anchorKind: "block",
        anchorDiffBlockId: block.id,
        body: "The wrapper rename weakens the trust-boundary cue.",
        status: "open",
        authorActorType: "agent",
        authorDisplayName: "Legacy agent",
      },
    ]);
  });

  it("does not mutate during dry runs", async () => {
    const report = await importLegacyCommentsJson(context, {
      projectRoot: fixtureRoot,
      commentsJsonPath,
      dryRun: true,
    });

    expect(report.dryRun).toBe(true);
    expect(report.counts.comments).toBe(1);
    expect(listCommentsByScopeStatus(database.db, { scope: "diff_block" })).toEqual([]);
  });

  it("is duplicate-safe across repeated imports", async () => {
    await importLegacyCommentsJson(context, { projectRoot: fixtureRoot, commentsJsonPath, dryRun: false });
    const second = await importLegacyCommentsJson(context, { projectRoot: fixtureRoot, commentsJsonPath, dryRun: false });

    const comments = listCommentsByScopeStatus(database.db, { scope: "diff_block" });
    expect(comments).toHaveLength(1);
    expect(second.counts.skippedDuplicates).toBe(1);
    expect(second.warnings.map((item) => item.code)).toContain("legacy_comment_duplicate");
  });

  it("imports ambiguous anchors at file scope with warnings", async () => {
    const report = await importLegacyCommentsJson(context, {
      projectRoot: fixtureRoot,
      commentsJsonPath: ambiguousCommentsJsonPath,
      dryRun: false,
    });

    expect(report.warnings.map((item) => item.code)).toContain("legacy_anchor_ambiguous");
    expect(listCommentsByScopeStatus(database.db, { scope: "commit_file", targetId: target.file.id })).toEqual([
      {
        ...listCommentsByScopeStatus(database.db, { scope: "commit_file", targetId: target.file.id })[0],
        body: "This phrase appears in more than one block.",
        anchorKind: "scope",
      },
    ]);
  });

  it("summarizes legacy markdown as best-effort DB matches and warnings", async () => {
    const markdown = parseLegacyMarkdownReview(markdownPath, readFixtureMarkdown());
    const summary = summarizeLegacyMarkdownReview(database.db, markdown);

    expect(summary).toEqual({
      warnings: [],
      matchedVersionId: target.version.id,
      matchedCommitId: target.commit.id,
      matchedCommitFileId: target.file.id,
      matchedDiffBlockIds: listDiffBlocksByCommitFile(database.db, target.file.id).map((block) => block.id),
    });

    const unmatched = summarizeLegacyMarkdownReview(database.db, { ...markdown, commit: "missing-sha" });
    expect(unmatched.warnings.map((item) => item.code)).toEqual(["legacy_markdown_missing_commit"]);
  });

  it("does not require legacy schema columns", () => {
    const tableNames = database.sqlite.prepare("select name from sqlite_master where type = 'table'").all() as {
      name: string;
    }[];
    const columns = tableNames.flatMap((table) =>
      (database.sqlite.prepare(`pragma table_info(${table.name})`).all() as { name: string }[]).map((column) => column.name),
    );

    expect(columns).not.toContain("reviewPath");
    expect(columns).not.toContain("review_path");
    expect(columns).not.toContain("markdown_path");
    expect(tableNames.map((table) => table.name)).not.toContain("bundles");
  });

  it("exports a read-only markdown projection without mutating state", () => {
    addComment(database.db, {
      scope: "commit_file",
      commitFileId: target.file.id,
      anchorKind: "scope",
      body: "Existing DB comment.",
      status: "open",
      authorActorType: "agent",
      authorDisplayName: "Agent",
      createdAt: 10_000,
    });
    const before = listCommentsByScopeStatus(database.db, { scope: "commit_file", targetId: target.file.id });

    const report = exportMarkdownReport(context, { versionId: target.version.id });
    const after = listCommentsByScopeStatus(database.db, { scope: "commit_file", targetId: target.file.id });

    expect(report).toContain("Read-only projection from the prompt review database");
    expect(report).toContain("use the app, API, or MCP tools instead");
    expect(report).toContain("Existing DB comment.");
    expect(after).toEqual(before);
  });

  it("keeps legacy artifact terms quarantined to allowed files", () => {
    const violations = checkArchitecture([
      { path: "src/legacy/example.ts", content: 'const path = "comments.json";' },
      { path: "scripts/import-legacy-review-data.ts", content: 'const path = "comments.json";' },
      { path: "src/services/example.ts", content: 'const path = "comments.json";' },
    ]);

    expect(violations).toEqual([
      {
        filePath: "src/services/example.ts",
        rule: "no-primary-legacy-review-artifacts",
        message: 'Primary workflow modules must not reference legacy generated artifact term "comments.json".',
      },
    ]);
  });
});

function seedReviewTarget(): { version: VersionRow; commit: CommitRow; file: CommitFileRow } {
  const version = createVersion(database.db, {
    id: "ver_legacy",
    repositoryId: "codex",
    label: "legacy import",
    baseSha: "base",
    targetSha: "abcdef1234567890",
  });
  const [commit] = bulkInsertCommits(database.db, [
    {
      id: "cmt_legacy",
      versionId: version.id,
      sha: "abcdef1234567890",
      ordinal: 1,
      title: "Fixture commit",
    },
  ]);
  const [file] = bulkInsertCommitFiles(database.db, [
    {
      id: "file_legacy",
      commitId: commit.id,
      oldPath: "codex-rs/core/templates/goals/continuation.md",
      newPath: "codex-rs/core/templates/goals/continuation.md",
      changeType: "modified",
    },
  ]);
  bulkInsertDiffBlocks(database.db, [
    {
      id: "blk_legacy_1",
      commitFileId: file.id,
      blockKey: "change-001",
      ordinal: 1,
      contentHash: "hash-1",
      oldStartLine: 1,
      oldEndLine: 1,
      newStartLine: 1,
      newEndLine: 1,
      patch: "- old objective wrapper\n+ new objective wrapper",
    },
    {
      id: "blk_legacy_2",
      commitFileId: file.id,
      blockKey: "change-002",
      ordinal: 2,
      contentHash: "hash-2",
      oldStartLine: 2,
      oldEndLine: 2,
      newStartLine: 2,
      newEndLine: 2,
      patch: "- duplicate phrase\n+ duplicate phrase",
    },
    {
      id: "blk_legacy_3",
      commitFileId: file.id,
      blockKey: "change-003",
      ordinal: 3,
      contentHash: "hash-3",
      oldStartLine: 3,
      oldEndLine: 3,
      newStartLine: 3,
      newEndLine: 3,
      patch: "- duplicate phrase\n+ duplicate phrase",
    },
  ]);
  return { version, commit, file };
}

function readFixtureMarkdown(): string {
  return readFileSync(path.join(fixtureRoot, markdownPath), "utf8");
}
