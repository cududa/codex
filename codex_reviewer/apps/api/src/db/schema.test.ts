import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReviewEventTargetSchema } from "@prompt-reviews/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "./client.js";
import { migrateDatabase } from "./migrate.js";
import {
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewVersionIngests,
  reviewVersions,
} from "./schema/index.js";

const now = "2026-06-17T12:00:00.000Z";
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("review persistence schema", () => {
  it("migrates an empty database to the first-slice product records", async () => {
    const connection = await migratedConnection();

    const tables = await connection.client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );

    expect(tables.rows.map((row) => row.name)).toEqual([
      "commit_concern_areas",
      "diff_blocks",
      "review_commits",
      "review_events",
      "review_files",
      "review_version_ingests",
      "review_versions",
      "schema_migrations",
    ]);
  });

  it("stores review versions, commits, files, ordered concern areas, and diff blocks directly", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);

    await expect(connection.db.select().from(reviewVersions)).resolves.toEqual([
      {
        id: "version-1",
        label: "Upstream review",
        repositoryId: "openai/codex",
        baseRef: "local-main",
        targetRef: "upstream/main",
        baseSha: "1234567",
        targetSha: "abcdef1",
        createdAt: now,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewCommits)).resolves.toEqual([
      {
        id: "commit-1",
        versionId: "version-1",
        sha: "abcdef1",
        position: 0,
        title: "Adjust tool prompts",
        message: null,
        authorName: "OpenAI",
        committedAt: now,
        reviewMark: "FLAG",
        createdAt: now,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(commitConcernAreas)).resolves.toEqual([
      { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "permission-defaults", position: 1 },
    ]);
    await expect(connection.db.select().from(reviewFiles)).resolves.toEqual([
      {
        id: "file-1",
        commitId: "commit-1",
        position: 0,
        path: "codex-rs/core/src/prompt.rs",
        oldPath: null,
        changeKind: "modified",
        reviewMark: null,
        createdAt: now,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(diffBlocks)).resolves.toEqual([
      {
        id: "diff-1",
        fileId: "file-1",
        position: 0,
        heading: "prompt",
        oldStartLine: 1,
        oldEndLine: 1,
        newStartLine: 1,
        newEndLine: 1,
        patch: "@@ -1 +1 @@\n-old\n+new",
      },
    ]);
  });

  it("rejects review marks outside PASS, FLAG, and MODIFY", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewVersions).values({
      id: "version-1",
      label: "Upstream review",
      repositoryId: "openai/codex",
      baseSha: "1234567",
      targetSha: "abcdef1",
      createdAt: now,
    });

    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO review_commits
            (id, version_id, sha, position, title, review_mark, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["commit-1", "version-1", "abcdef1", 0, "Bad mark", "DONE", now],
      }),
    ).rejects.toThrow();
  });

  it("requires resolved SHAs and enforces one ingested version per resolved repository range", async () => {
    const connection = await migratedConnection();

    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO review_versions
            (id, label, repository_id, base_ref, target_ref, target_sha, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["version-missing-base", "Upstream review", "openai/codex", "local-main", "upstream/main", "abcdef1", now],
      }),
    ).rejects.toThrow();

    await insertCoreSlice(connection);
    await expect(
      connection.db.insert(reviewVersions).values({
        id: "version-duplicate",
        label: "Same resolved range",
        repositoryId: "openai/codex",
        baseRef: "other-base",
        targetRef: "other-target",
        baseSha: "1234567",
        targetSha: "abcdef1",
        createdAt: now,
      }),
    ).rejects.toThrow();
  });

  it("stores exactly one ingest metadata row per ingested review version", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);
    await connection.db.insert(reviewVersionIngests).values({
      versionId: "version-1",
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      baseSha: "1234567",
      targetSha: "abcdef1",
      concernMapVersion: "deterministic-concern-map-v1",
      source: "system-ingest",
      createdAt: now,
    });

    await expect(connection.db.select().from(reviewVersionIngests)).resolves.toEqual([
      {
        versionId: "version-1",
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        baseSha: "1234567",
        targetSha: "abcdef1",
        concernMapVersion: "deterministic-concern-map-v1",
        source: "system-ingest",
        createdAt: now,
      },
    ]);
    await expect(
      connection.db.insert(reviewVersionIngests).values({
        versionId: "version-1",
        repositoryId: "openai/codex",
        baseRefOrSha: "other-base",
        targetRefOrSha: "other-target",
        baseSha: "1234567",
        targetSha: "abcdef1",
        concernMapVersion: "deterministic-concern-map-v1",
        source: "system-ingest",
        createdAt: now,
      }),
    ).rejects.toThrow();
  });

  it("enforces ordered commit concern areas without file-level concern areas", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);

    await expect(
      connection.db.insert(commitConcernAreas).values({
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 1,
      }),
    ).rejects.toThrow();

    const fileColumns = await connection.client.execute("PRAGMA table_info(review_files)");
    expect(fileColumns.rows.map((row) => row.name)).not.toContain("concern_area_slug");
  });

  it("keeps the concern-area selection limit consistent with the contract", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);

    await connection.db.insert(commitConcernAreas).values({
      commitId: "commit-1",
      concernAreaSlug: "hidden-context",
      position: 2,
    });
    await expect(
      connection.db.insert(commitConcernAreas).values({
        commitId: "commit-1",
        concernAreaSlug: "message-roles",
        position: 3,
      }),
    ).rejects.toThrow();
  });

  it("stores review audit events as history rows", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewEvents).values({
      id: "event-1",
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "human",
      actorId: "human-1",
      actorDisplayName: "Cullen",
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
      payloadJson: JSON.stringify({
        target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
        previousReviewMark: "FLAG",
        newReviewMark: "PASS",
      }),
      createdAt: now,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([
      {
        id: "event-1",
        scopeType: "commit",
        scopeId: "commit-1",
        actorType: "human",
        actorId: "human-1",
        actorDisplayName: "Cullen",
        kind: "review_mark_changed",
        summary: "Commit review mark changed from FLAG to PASS.",
        payloadJson: JSON.stringify({
          target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
          previousReviewMark: "FLAG",
          newReviewMark: "PASS",
        }),
        createdAt: now,
      },
    ]);
  });

  it("enforces diff block line ranges", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);

    await expect(
      connection.db.insert(diffBlocks).values({
        id: "diff-2",
        fileId: "file-1",
        position: 1,
        oldStartLine: 8,
        oldEndLine: 4,
        patch: "@@ -8,4 +8,4 @@\n unchanged",
      }),
    ).rejects.toThrow();
  });
});

async function migratedConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "review.db")}`);
  await migrateDatabase(connection.client);
  return connection;
}

async function insertCoreSlice(connection: ReviewDatabaseConnection): Promise<void> {
  await connection.db.insert(reviewVersions).values({
    id: "version-1",
    label: "Upstream review",
    repositoryId: "openai/codex",
    baseRef: "local-main",
    targetRef: "upstream/main",
    baseSha: "1234567",
    targetSha: "abcdef1",
    createdAt: now,
  });
  await connection.db.insert(reviewCommits).values({
    id: "commit-1",
    versionId: "version-1",
    sha: "abcdef1",
    position: 0,
    title: "Adjust tool prompts",
    authorName: "OpenAI",
    committedAt: now,
    reviewMark: "FLAG",
    createdAt: now,
  });
  await connection.db.insert(commitConcernAreas).values([
    { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
    { commitId: "commit-1", concernAreaSlug: "permission-defaults", position: 1 },
  ]);
  await connection.db.insert(reviewFiles).values({
    id: "file-1",
    commitId: "commit-1",
    position: 0,
    path: "codex-rs/core/src/prompt.rs",
    changeKind: "modified",
    createdAt: now,
  });
  await connection.db.insert(diffBlocks).values({
    id: "diff-1",
    fileId: "file-1",
    position: 0,
    heading: "prompt",
    oldStartLine: 1,
    oldEndLine: 1,
    newStartLine: 1,
    newEndLine: 1,
    patch: "@@ -1 +1 @@\n-old\n+new",
  });
}
