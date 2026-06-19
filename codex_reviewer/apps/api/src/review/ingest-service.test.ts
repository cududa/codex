import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { asc } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";
import {
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewVersionIngests,
  reviewVersions,
} from "../db/schema/index.js";
import type { GitRangeReader } from "./git-range-reader.js";
import { createReviewIngestService, deterministicConcernMapVersion } from "./ingest-service.js";
import { createReviewReadStore } from "./read-store.js";

const now = "2026-06-17T12:00:00.000Z";
const baseSha = "1111111";
const targetSha = "9999999";
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("review ingest service", () => {
  it("creates the initialized durable review spine and normal read composition", async () => {
    const connection = await testConnection();
    const store = createStore(connection, fixtureGitRangeReader());

    const response = await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });

    expect(response.created).toBe(true);
    expect(response.version).toMatchObject({
      label: "openai/codex 1111111..9999999",
      repositoryId: "openai/codex",
      baseRef: "local-main",
      targetRef: "upstream/main",
      baseSha,
      targetSha,
      commitCount: 2,
      commits: [
        {
          sha: "2222222",
          position: 0,
          reviewMark: "FLAG",
          concernAreas: ["harness-prompts", "message-roles", "hidden-context"],
          files: [
            {
              path: "codex-rs/core/src/prompt.rs",
              position: 0,
              reviewMark: null,
              diffBlocks: [
                { position: 0, heading: "prompt one", oldStartLine: 1, oldEndLine: 2 },
                { position: 1, heading: "prompt two", oldStartLine: null, newStartLine: 10 },
              ],
            },
            {
              path: "codex-rs/core/src/sandbox.rs",
              position: 1,
              reviewMark: null,
              diffBlocks: [{ position: 0, heading: "sandbox" }],
            },
          ],
        },
        {
          sha: "3333333",
          position: 1,
          reviewMark: "PASS",
          concernAreas: [],
          files: [
            {
              path: "docs/readme.md",
              reviewMark: null,
            },
          ],
        },
      ],
    });

    await expect(connection.db.select().from(reviewVersions)).resolves.toMatchObject([
      {
        repositoryId: "openai/codex",
        baseRef: "local-main",
        targetRef: "upstream/main",
        baseSha,
        targetSha,
      },
    ]);
    await expect(connection.db.select().from(reviewVersionIngests)).resolves.toMatchObject([
      {
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        baseSha,
        targetSha,
        concernMapVersion: deterministicConcernMapVersion,
        source: "system-ingest",
      },
    ]);
    await expect(
      connection.db.select().from(reviewCommits).orderBy(asc(reviewCommits.position)),
    ).resolves.toMatchObject([
      { sha: "2222222", position: 0, reviewMark: "FLAG" },
      { sha: "3333333", position: 1, reviewMark: "PASS" },
    ]);
    const fileRows = await connection.db.select().from(reviewFiles);
    expect(fileRows.map((row) => ({ path: row.path, position: row.position, reviewMark: row.reviewMark }))).toEqual(
      expect.arrayContaining([
        { path: "codex-rs/core/src/prompt.rs", position: 0, reviewMark: null },
        { path: "codex-rs/core/src/sandbox.rs", position: 1, reviewMark: null },
        { path: "docs/readme.md", position: 0, reviewMark: null },
      ]),
    );
    await expect(
      connection.db.select().from(diffBlocks).orderBy(asc(diffBlocks.fileId), asc(diffBlocks.position)),
    ).resolves.toHaveLength(4);
  });

  it("is idempotent for repository and resolved SHA range", async () => {
    const connection = await testConnection();
    const reader = fixtureGitRangeReader();
    const store = createStore(connection, reader);

    const first = await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });
    const second = await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "base-alias",
      targetRefOrSha: "target-alias",
      label: "Should not rewrite",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });

    expect(second).toMatchObject({
      created: false,
      version: {
        id: first.version.id,
        label: "openai/codex 1111111..9999999",
        baseRef: "local-main",
        targetRef: "upstream/main",
      },
    });
    await expect(connection.db.select().from(reviewVersions)).resolves.toHaveLength(1);
    await expect(connection.db.select().from(reviewVersionIngests)).resolves.toHaveLength(1);
    await expect(connection.db.select().from(reviewCommits)).resolves.toHaveLength(2);
  });

  it("fails before creating rows when refs cannot resolve", async () => {
    const connection = await testConnection();
    const store = createStore(connection, fixtureGitRangeReader());

    await expect(
      store.ingestReviewVersion({
        repositoryId: "openai/codex",
        baseRefOrSha: "missing-base",
        targetRefOrSha: "upstream/main",
        source: "system-ingest",
        concernMapVersion: deterministicConcernMapVersion,
      }),
    ).rejects.toMatchObject({ code: "bad_request" });

    await expect(connection.db.select().from(reviewVersions)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewCommits)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewFiles)).resolves.toEqual([]);
    await expect(connection.db.select().from(diffBlocks)).resolves.toEqual([]);
  });

  it("does not write baseline events, detector evidence, or agent review rows", async () => {
    const connection = await testConnection();
    const store = createStore(connection, fixtureGitRangeReader());

    await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
    const tables = await connection.client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.rows.map((row) => row.name)).not.toContain("detector_runs");
    expect(tables.rows.map((row) => row.name)).not.toContain("detector_evidence");
    expect(tables.rows.map((row) => row.name)).not.toContain("agent_reviews");
  });

  it("rejects unsupported concern-map versions without partial rows", async () => {
    const connection = await testConnection();
    const store = createStore(connection, fixtureGitRangeReader());

    await expect(
      store.ingestReviewVersion({
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        source: "system-ingest",
        concernMapVersion: "other-version",
      }),
    ).rejects.toMatchObject({ code: "bad_request" });

    await expect(connection.db.select().from(reviewVersions)).resolves.toEqual([]);
  });

  it("keeps concern areas commit-scoped and review marks inside the canonical set", async () => {
    const connection = await testConnection();
    const store = createStore(connection, fixtureGitRangeReader());

    await store.ingestReviewVersion({
      repositoryId: "openai/codex",
      baseRefOrSha: "local-main",
      targetRefOrSha: "upstream/main",
      source: "system-ingest",
      concernMapVersion: deterministicConcernMapVersion,
    });

    const concernRows = await connection.db
      .select()
      .from(commitConcernAreas)
      .orderBy(asc(commitConcernAreas.position));
    expect(concernRows.map((row) => row.concernAreaSlug)).toEqual([
      "harness-prompts",
      "message-roles",
      "hidden-context",
    ]);
    expect(new Set(concernRows.map((row) => row.concernAreaSlug)).size).toBe(concernRows.length);

    const commitRows = await connection.db.select().from(reviewCommits);
    expect(commitRows.map((row) => row.reviewMark)).toEqual(["FLAG", "PASS"]);
    expect(commitRows.map((row) => row.reviewMark)).not.toContain("DONE");
    const fileRows = await connection.db.select().from(reviewFiles);
    expect(fileRows.map((row) => row.reviewMark)).toEqual([null, null, null]);

    const fileColumns = await connection.client.execute("PRAGMA table_info(review_files)");
    expect(fileColumns.rows.map((row) => row.name)).not.toContain("concern_area_slug");
  });
});

async function testConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "review.db")}`);
  await migrateDatabase(connection.client);
  return connection;
}

function createStore(connection: ReviewDatabaseConnection, gitRangeReader: GitRangeReader) {
  return createReviewIngestService(connection.db, createReviewReadStore(connection.db), { gitRangeReader });
}

function fixtureGitRangeReader(): GitRangeReader {
  return {
    async resolveCommit(refOrSha) {
      return {
        "base-alias": baseSha,
        "local-main": baseSha,
        "target-alias": targetSha,
        "upstream/main": targetSha,
      }[refOrSha] ?? null;
    },

    async listCommits() {
      return [
        {
          sha: "2222222",
          title: "Adjust prompt role hidden compaction goal tool sandbox behavior",
          message: "Updates prompt text, message role boundaries, hidden context, goals, tools, and permissions.",
          authorName: "OpenAI",
          committedAt: now,
          files: [
            {
              path: "codex-rs/core/src/prompt.rs",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/codex-rs/core/src/prompt.rs b/codex-rs/core/src/prompt.rs",
                "--- a/codex-rs/core/src/prompt.rs",
                "+++ b/codex-rs/core/src/prompt.rs",
                "@@ -1,2 +1,2 @@ prompt one",
                "-old prompt",
                "+new prompt",
                "@@ -10,0 +10,2 @@ prompt two",
                "+new prompt line",
                "+new instruction line",
              ].join("\n"),
            },
            {
              path: "codex-rs/core/src/sandbox.rs",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/codex-rs/core/src/sandbox.rs b/codex-rs/core/src/sandbox.rs",
                "--- a/codex-rs/core/src/sandbox.rs",
                "+++ b/codex-rs/core/src/sandbox.rs",
                "@@ -4 +4 @@ sandbox",
                "-old sandbox",
                "+new sandbox",
              ].join("\n"),
            },
          ],
        },
        {
          sha: "3333333",
          title: "Update README",
          message: null,
          authorName: "OpenAI",
          committedAt: now,
          files: [
            {
              path: "docs/readme.md",
              oldPath: null,
              changeKind: "modified",
              patch: [
                "diff --git a/docs/readme.md b/docs/readme.md",
                "--- a/docs/readme.md",
                "+++ b/docs/readme.md",
                "@@ -1 +1 @@",
                "-old",
                "+new",
              ].join("\n"),
            },
          ],
        },
      ];
    },
  };
}
