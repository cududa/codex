import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { concernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewFiles,
  reviewVersions,
} from "../db/schema/index.js";
import { createAgentReviewStore } from "../review/agent-review-store.js";
import { createReviewIngestService, deterministicConcernMapVersion } from "../review/ingest-service.js";
import type { GitRangeReader } from "../review/git-range-reader.js";
import { createReviewReadStore } from "../review/read-store.js";
import { createReviewWriteStore } from "../review/write-store.js";
import { createApiApp } from "./app.js";
import type { ApiDependencies } from "./types.js";

const now = "2026-06-17T12:00:00.000Z";
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("createApiApp", () => {
  it("serves health through the shared response contract", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "codex-reviewer-api" });
  });

  it("returns metadata through the shared response contract", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/meta");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      appName: "Codex Reviewer",
      apiName: "codex-reviewer-api",
      contractsPackage: "@prompt-reviews/contracts",
      status: "ready",
      summary: "Reviews upstream Codex changes before accepting them locally.",
    });
  });

  it("rejects invalid query params through Hono and Zod", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/meta?view=everything");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_failed",
        message: "Invalid API payload.",
      },
    });
  });

  it("serves review bootstrap data from shared contracts", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/bootstrap");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      concernAreas,
      reviewMarks: reviewMarkDefinitions,
    });
  });

  it("serves persisted review versions through the read API", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      versions: [
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
          commitCount: 1,
          commits: [
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
              concernAreas: ["tool-affordances"],
              createdAt: now,
              updatedAt: null,
              agentReviews: [],
              files: [
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
                  agentReviews: [],
                  diffBlocks: [
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
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("returns one persisted review version by id", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions/version-1");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      version: {
        id: "version-1",
        commits: [{ id: "commit-1", files: [{ id: "file-1" }] }],
      },
    });
  });

  it("validates ingest requests and returns the ingest response contract", async () => {
    const gitRangeReader = fakeGitRangeReader();
    const { dependencies } = await testRuntime({ gitRangeReader });
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        source: "system-ingest",
        concernMapVersion: deterministicConcernMapVersion,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      created: true,
      version: {
        repositoryId: "openai/codex",
        baseRef: "local-main",
        targetRef: "upstream/main",
        baseSha: "1234567",
        targetSha: "abcdef1",
        commits: [
          {
            reviewMark: "FLAG",
            concernAreas: ["harness-prompts"],
            files: [
              {
                reviewMark: null,
                diffBlocks: [{ position: 0, heading: "prompt" }],
              },
            ],
          },
        ],
      },
    });
  });

  it("rejects invalid ingest payloads with contract-shaped validation errors", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryId: "openai/codex",
        baseRefOrSha: "local-main",
        targetRefOrSha: "upstream/main",
        source: "system-ingest",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_failed",
        message: "Invalid API payload.",
      },
    });
  });

  it("persists commit review mark writes and returns the updated review version", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/commits/commit-1/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1", displayName: "Cullen" },
        reviewMark: "PASS",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      version: {
        id: "version-1",
        commits: [{ id: "commit-1", reviewMark: "PASS" }],
      },
    });
  });

  it("persists file review mark writes and concern-area writes through canonical routes", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const fileResponse = await app.request("/api/review/files/file-1/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "MODIFY",
      }),
    });
    const concernResponse = await app.request("/api/review/commits/commit-1/concern-areas", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        concernAreas: ["hidden-context", "message-roles"],
      }),
    });

    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.json()).toMatchObject({
      version: {
        commits: [{ files: [{ id: "file-1", reviewMark: "MODIFY" }] }],
      },
    });
    expect(concernResponse.status).toBe(200);
    expect(await concernResponse.json()).toMatchObject({
      version: {
        commits: [{ id: "commit-1", concernAreas: ["hidden-context", "message-roles"] }],
      },
    });
  });

  it("records commit and file agent review evidence through dedicated routes", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const commitResponse = await app.request("/api/review/commits/commit-1/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "agent", id: "agent-1", displayName: "Codex" },
        reviewedMark: "MODIFY",
        reviewedConcernAreas: ["hidden-context", "message-roles"],
        notesMarkdown: "The evidence challenges the current mark.",
      }),
    });
    const fileResponse = await app.request("/api/review/files/file-1/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "agent", id: "agent-1", displayName: "Codex" },
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    });

    expect(commitResponse.status).toBe(200);
    expect(await commitResponse.json()).toMatchObject({
      version: {
        commits: [
          {
            id: "commit-1",
            reviewMark: "FLAG",
            concernAreas: ["tool-affordances"],
            agentReviews: [
              {
                reviewedMark: "MODIFY",
                reviewedConcernAreas: ["hidden-context", "message-roles"],
                notesMarkdown: "The evidence challenges the current mark.",
              },
            ],
          },
        ],
      },
    });
    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.json()).toMatchObject({
      version: {
        commits: [
          {
            files: [
              {
                id: "file-1",
                reviewMark: null,
                agentReviews: [{ reviewedMark: "PASS", notesMarkdown: null }],
              },
            ],
          },
        ],
      },
    });
    await expect(connection.db.select().from(agentReviews)).resolves.toHaveLength(2);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toHaveLength(2);
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      { id: "commit-1", reviewMark: "FLAG" },
    ]);
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      { id: "file-1", reviewMark: null },
    ]);
  });

  it("rejects invalid agent review route payloads", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const humanActorResponse = await app.request("/api/review/commits/commit-1/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    });
    const fileConcernResponse = await app.request("/api/review/files/file-1/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "agent", id: "agent-1" },
        reviewedMark: "PASS",
        reviewedConcernAreas: ["hidden-context"],
        notesMarkdown: null,
      }),
    });
    const missingResponse = await app.request("/api/review/commits/missing/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "agent", id: "agent-1" },
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    });

    expect(humanActorResponse.status).toBe(400);
    expect(fileConcernResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({ error: { code: "not_found" } });
    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
  });

  it("rejects invalid write payloads with contract-shaped validation errors", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/commits/commit-1/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "INVALID_REVIEW_MARK",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_failed",
        message: "Invalid API payload.",
      },
    });
  });

  it("maps missing review records and workflow conflicts to contract-shaped errors", async () => {
    const { connection, dependencies } = await testRuntime();
    await seedReviewVersion(connection);
    const app = createApiApp(dependencies);

    const missingResponse = await app.request("/api/review/files/missing/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "FLAG",
      }),
    });
    await app.request("/api/review/files/file-1/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "FLAG",
      }),
    });
    const conflictResponse = await app.request("/api/review/commits/commit-1/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "PASS",
      }),
    });

    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({
      error: { code: "not_found" },
    });
    expect(conflictResponse.status).toBe(409);
    expect(await conflictResponse.json()).toMatchObject({
      error: { code: "state_conflict" },
    });
  });

  it("returns contract-shaped errors", async () => {
    const { dependencies } = await testRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "not_found",
        message: "Not Found",
      },
    });
  });
});

async function testRuntime(options: { gitRangeReader?: GitRangeReader } = {}): Promise<{
  connection: ReviewDatabaseConnection;
  dependencies: ApiDependencies;
}> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "review.db")}`);
  await migrateDatabase(connection.client);
  const reviewReadStore = createReviewReadStore(connection.db);
  return {
    connection,
    dependencies: {
      config: {
        databaseUrl: `file:${join(directory, "review.db")}`,
        host: "127.0.0.1",
        port: 0,
      },
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      } as unknown as ApiDependencies["logger"],
      agentReviewStore: createAgentReviewStore(connection.db, reviewReadStore),
      reviewIngestService: createReviewIngestService(connection.db, reviewReadStore, {
        gitRangeReader: options.gitRangeReader ?? fakeGitRangeReader(),
      }),
      reviewReadStore,
      reviewWriteStore: createReviewWriteStore(connection.db, reviewReadStore),
    },
  };
}

async function seedReviewVersion(connection: ReviewDatabaseConnection): Promise<void> {
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
  await connection.db.insert(commitConcernAreas).values({
    commitId: "commit-1",
    concernAreaSlug: "tool-affordances",
    position: 0,
  });
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

function fakeGitRangeReader(): GitRangeReader {
  return {
    async resolveCommit(refOrSha) {
      return { "local-main": "1234567", "upstream/main": "abcdef1" }[refOrSha] ?? null;
    },
    async listCommits() {
      return [
        {
          sha: "abcdef1",
          title: "Adjust prompt text",
          message: null,
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
                "@@ -1 +1 @@ prompt",
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
