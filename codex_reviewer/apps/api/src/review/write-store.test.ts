import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";
import {
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewVersions,
} from "../db/schema/index.js";
import { createReviewReadStore } from "./read-store.js";
import { createReviewWriteStore } from "./write-store.js";

const now = "2026-06-17T12:00:00.000Z";
const actor = { type: "human", id: "human-1", displayName: "Cullen" } as const;
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("review write store", () => {
  it("updates commit review marks and writes audit history", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.setCommitReviewMark({
      commitId: "commit-1",
      reviewMark: "PASS",
      actor,
    });

    expect(version.commits[0]?.reviewMark).toBe("PASS");
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: "commit-1",
        reviewMark: "PASS",
      },
    ]);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(event).toMatchObject({
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "human",
      actorId: "human-1",
      actorDisplayName: "Cullen",
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
    });
    expect(JSON.parse(event?.payloadJson ?? "{}")).toEqual({
      previousReviewMark: "FLAG",
      reviewMark: "PASS",
    });
  });

  it("does not write audit history or timestamps for no-op commit review marks", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.setCommitReviewMark({
      commitId: "commit-1",
      reviewMark: "FLAG",
      actor,
    });

    expect(version.commits[0]).toMatchObject({
      id: "commit-1",
      reviewMark: "FLAG",
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: "commit-1",
        reviewMark: "FLAG",
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });

  it("updates file review marks, including clearing explicit file state", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    await store.setFileReviewMark({
      fileId: "file-1",
      reviewMark: "MODIFY",
      actor,
    });
    const version = await store.setFileReviewMark({
      fileId: "file-1",
      reviewMark: null,
      actor,
    });

    expect(version.commits[0]?.files[0]?.reviewMark).toBeNull();
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: "file-1",
        reviewMark: null,
      },
    ]);
    const events = await connection.db.select().from(reviewEvents).orderBy(asc(reviewEvents.createdAt));
    expect(events).toHaveLength(2);
    expect(events.map((event) => JSON.parse(event.payloadJson))).toEqual([
      { previousReviewMark: null, reviewMark: "MODIFY" },
      { previousReviewMark: "MODIFY", reviewMark: null },
    ]);
  });

  it("does not write audit history or timestamps for no-op file review marks", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.setFileReviewMark({
      fileId: "file-1",
      reviewMark: null,
      actor,
    });

    expect(version.commits[0]?.files[0]).toMatchObject({
      id: "file-1",
      reviewMark: null,
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: "file-1",
        reviewMark: null,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });

  it("replaces ordered commit concern areas and compacts positions", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.setCommitConcernAreas({
      commitId: "commit-1",
      concernAreas: ["hidden-context", "message-roles"],
      actor,
    });

    expect(version.commits[0]?.concernAreas).toEqual(["hidden-context", "message-roles"]);
    await expect(
      connection.db
        .select()
        .from(commitConcernAreas)
        .where(eq(commitConcernAreas.commitId, "commit-1"))
        .orderBy(asc(commitConcernAreas.position)),
    ).resolves.toEqual([
      { commitId: "commit-1", concernAreaSlug: "hidden-context", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "message-roles", position: 1 },
    ]);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(JSON.parse(event?.payloadJson ?? "{}")).toEqual({
      previousConcernAreas: ["tool-affordances", "permission-defaults"],
      concernAreas: ["hidden-context", "message-roles"],
    });
  });

  it("does not write audit history or timestamps for no-op concern-area selections", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.setCommitConcernAreas({
      commitId: "commit-1",
      concernAreas: ["tool-affordances", "permission-defaults"],
      actor,
    });

    expect(version.commits[0]).toMatchObject({
      id: "commit-1",
      concernAreas: ["tool-affordances", "permission-defaults"],
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: "commit-1",
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });

  it("returns not_found for missing commits and files", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    await expect(
      store.setCommitReviewMark({
        commitId: "missing",
        reviewMark: "PASS",
        actor,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.setFileReviewMark({
        fileId: "missing",
        reviewMark: "FLAG",
        actor,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("returns state_conflict for review-state invariants", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    await store.setFileReviewMark({
      fileId: "file-1",
      reviewMark: "FLAG",
      actor,
    });
    await expect(
      store.setCommitReviewMark({
        commitId: "commit-1",
        reviewMark: "PASS",
        actor,
      }),
    ).rejects.toMatchObject({ code: "state_conflict" });

    await connection.db.update(reviewFiles).set({ reviewMark: null }).where(eq(reviewFiles.id, "file-1"));
    await store.setCommitReviewMark({
      commitId: "commit-1",
      reviewMark: "PASS",
      actor,
    });
    await expect(
      store.setFileReviewMark({
        fileId: "file-1",
        reviewMark: "MODIFY",
        actor,
      }),
    ).rejects.toMatchObject({ code: "state_conflict" });
  });
});

async function testConnection(): Promise<ReviewDatabaseConnection> {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
  tempDirectories.push(directory);
  const connection = createDatabaseConnection(`file:${join(directory, "review.db")}`);
  await migrateDatabase(connection.client);
  return connection;
}

function createStore(connection: ReviewDatabaseConnection) {
  const readStore = createReviewReadStore(connection.db);
  return createReviewWriteStore(connection.db, readStore);
}

async function seedReviewVersion(connection: ReviewDatabaseConnection): Promise<void> {
  await connection.db.insert(reviewVersions).values({
    id: "version-1",
    label: "Upstream review",
    repositoryId: "openai/codex",
    baseRef: "local-main",
    targetRef: "upstream/main",
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
