import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AgentActorRefSchema,
  AgentReviewRecordedEventPayloadSchema,
  ReviewEventTargetSchema,
} from "@prompt-reviews/contracts";
import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewVersions,
} from "../db/schema/index.js";
import { createAgentReviewStore } from "./agent-review-store.js";
import { createReviewReadStore } from "./read-store.js";

const now = "2026-06-17T12:00:00.000Z";
const actor = AgentActorRefSchema.parse({ type: "agent", id: "agent-1", displayName: "Codex" });
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("agent review evidence store", () => {
  it("records commit agent review evidence and audit history without mutating review state", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.recordCommitAgentReview({
      commitId: "commit-1",
      actor,
      reviewedMark: "MODIFY",
      reviewedConcernAreas: ["hidden-context", "tool-affordances"],
      notesMarkdown: "The current commit mark should remain challenged.",
    });

    expect(version.commits[0]).toMatchObject({
      id: "commit-1",
      reviewMark: "FLAG",
      concernAreas: ["tool-affordances", "permission-defaults"],
      agentReviews: [
        {
          commitId: "commit-1",
          reviewedMark: "MODIFY",
          reviewedConcernAreas: ["hidden-context", "tool-affordances"],
          notesMarkdown: "The current commit mark should remain challenged.",
          reviewer: actor,
        },
      ],
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: "commit-1",
        reviewMark: "FLAG",
        updatedAt: null,
      },
    ]);
    await expect(
      connection.db
        .select()
        .from(commitConcernAreas)
        .where(eq(commitConcernAreas.commitId, "commit-1"))
        .orderBy(asc(commitConcernAreas.position)),
    ).resolves.toEqual([
      { commitId: "commit-1", concernAreaSlug: "tool-affordances", position: 0 },
      { commitId: "commit-1", concernAreaSlug: "permission-defaults", position: 1 },
    ]);

    const [review] = await connection.db.select().from(agentReviews);
    expect(review).toMatchObject({
      commitId: "commit-1",
      fileId: null,
      reviewedMark: "MODIFY",
      reviewerActorType: "agent",
      reviewerActorId: "agent-1",
      reviewerActorDisplayName: "Codex",
      notesMarkdown: "The current commit mark should remain challenged.",
    });
    await expect(
      connection.db.select().from(agentReviewConcernAreas).orderBy(asc(agentReviewConcernAreas.position)),
    ).resolves.toMatchObject([
      {
        agentReviewId: review?.id,
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 0,
      },
      {
        agentReviewId: review?.id,
        commitId: "commit-1",
        concernAreaSlug: "tool-affordances",
        position: 1,
      },
    ]);

    const [event] = await connection.db.select().from(reviewEvents);
    expect(event).toMatchObject({
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "agent",
      actorId: "agent-1",
      kind: "agent_review_recorded",
    });
    expect(AgentReviewRecordedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      agentReviewId: review?.id,
      target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
      reviewedMark: "MODIFY",
      reviewedConcernAreas: ["hidden-context", "tool-affordances"],
    });
  });

  it("records file agent review evidence without concern areas or file review-state mutation", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    const version = await store.recordFileAgentReview({
      fileId: "file-1",
      actor,
      reviewedMark: "PASS",
      notesMarkdown: null,
    });

    expect(version.commits[0]?.files[0]).toMatchObject({
      id: "file-1",
      reviewMark: null,
      agentReviews: [
        {
          fileId: "file-1",
          reviewedMark: "PASS",
          notesMarkdown: null,
          reviewer: actor,
        },
      ],
    });
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: "file-1",
        reviewMark: null,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([]);

    const [review] = await connection.db.select().from(agentReviews);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(review).toMatchObject({
      commitId: null,
      fileId: "file-1",
      reviewedMark: "PASS",
    });
    expect(AgentReviewRecordedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      agentReviewId: review?.id,
      target: ReviewEventTargetSchema.parse({ type: "file", id: "file-1" }),
      reviewedMark: "PASS",
    });
  });

  it("rejects missing targets and non-agent actors without writing evidence", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    await expect(
      store.recordCommitAgentReview({
        commitId: "missing",
        actor,
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.recordFileAgentReview({
        fileId: "missing",
        actor,
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.recordCommitAgentReview({
        commitId: "commit-1",
        actor: { type: "human", id: "human-1" },
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      } as unknown as Parameters<typeof store.recordCommitAgentReview>[0]),
    ).rejects.toThrow();

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });

  it("rejects invalid concern selections and empty notes before persistence", async () => {
    const connection = await testConnection();
    await seedReviewVersion(connection);
    const store = createStore(connection);

    await expect(
      store.recordCommitAgentReview({
        commitId: "commit-1",
        actor,
        reviewedMark: "PASS",
        reviewedConcernAreas: ["hidden-context", "hidden-context"],
        notesMarkdown: null,
      }),
    ).rejects.toThrow();
    await expect(
      store.recordCommitAgentReview({
        commitId: "commit-1",
        actor,
        reviewedMark: "PASS",
        reviewedConcernAreas: ["hidden-context"],
        notesMarkdown: "",
      }),
    ).rejects.toThrow();

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
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
  return createAgentReviewStore(connection.db, readStore);
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
