import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AgentReviewRecordedEventPayloadSchema,
  ReviewEventTargetSchema,
  ReviewMarkChangedEventPayloadSchema,
} from "@prompt-reviews/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "./client.js";
import { databaseMigrations } from "./migrations/index.js";
import { migrateDatabase } from "./migrate.js";
import {
  agentReviewConcernAreas,
  agentReviews,
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
      "agent_review_concern_areas",
      "agent_reviews",
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
        args: [
          "version-missing-base",
          "Upstream review",
          "openai/codex",
          "local-main",
          "upstream/main",
          "abcdef1",
          now,
        ],
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
      payloadJson: JSON.stringify(
        ReviewMarkChangedEventPayloadSchema.parse({
          target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
          previousReviewMark: "FLAG",
          newReviewMark: "PASS",
        }),
      ),
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
        payloadJson: JSON.stringify(
          ReviewMarkChangedEventPayloadSchema.parse({
            target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
            previousReviewMark: "FLAG",
            newReviewMark: "PASS",
          }),
        ),
        createdAt: now,
      },
    ]);
  });

  it("stores agent review evidence rows with ordered commit concern areas", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);
    await connection.db.insert(agentReviews).values({
      id: "agent-review-1",
      commitId: "commit-1",
      fileId: null,
      reviewedMark: "MODIFY",
      reviewerActorType: "agent",
      reviewerActorId: "agent-1",
      reviewerActorDisplayName: "Codex",
      notesMarkdown: "The current commit mark is correct.",
      createdAt: now,
    });
    await connection.db.insert(agentReviewConcernAreas).values([
      {
        agentReviewId: "agent-review-1",
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 0,
      },
      {
        agentReviewId: "agent-review-1",
        commitId: "commit-1",
        concernAreaSlug: "tool-affordances",
        position: 1,
      },
    ]);

    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([
      {
        id: "agent-review-1",
        commitId: "commit-1",
        fileId: null,
        reviewedMark: "MODIFY",
        reviewerActorType: "agent",
        reviewerActorId: "agent-1",
        reviewerActorDisplayName: "Codex",
        notesMarkdown: "The current commit mark is correct.",
        createdAt: now,
      },
    ]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([
      {
        agentReviewId: "agent-review-1",
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 0,
      },
      {
        agentReviewId: "agent-review-1",
        commitId: "commit-1",
        concernAreaSlug: "tool-affordances",
        position: 1,
      },
    ]);
  });

  it("enforces agent review target and concern-area invariants in the database", async () => {
    const connection = await migratedConnection();

    await insertCoreSlice(connection);
    await expect(
      connection.db.insert(agentReviews).values({
        id: "agent-review-targetless",
        commitId: null,
        fileId: null,
        reviewedMark: "PASS",
        reviewerActorType: "agent",
        reviewerActorId: "agent-1",
        createdAt: now,
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(agentReviews).values({
        id: "agent-review-two-targets",
        commitId: "commit-1",
        fileId: "file-1",
        reviewedMark: "PASS",
        reviewerActorType: "agent",
        reviewerActorId: "agent-1",
        createdAt: now,
      }),
    ).rejects.toThrow();
    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_reviews
            (id, commit_id, file_id, reviewed_mark, reviewer_actor_type, reviewer_actor_id, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["agent-review-human", "commit-1", null, "PASS", "human", "human-1", now],
      }),
    ).rejects.toThrow();
    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_reviews
            (id, commit_id, file_id, reviewed_mark, reviewer_actor_type, reviewer_actor_id, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["agent-review-bad-mark", "commit-1", null, "DONE", "agent", "agent-1", now],
      }),
    ).rejects.toThrow();

    await connection.db.insert(agentReviews).values({
      id: "agent-review-file",
      commitId: null,
      fileId: "file-1",
      reviewedMark: "PASS",
      reviewerActorType: "agent",
      reviewerActorId: "agent-1",
      createdAt: now,
    });
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: "agent-review-file",
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 0,
      }),
    ).rejects.toThrow();

    await connection.db.insert(agentReviews).values({
      id: "agent-review-commit",
      commitId: "commit-1",
      fileId: null,
      reviewedMark: "PASS",
      reviewerActorType: "agent",
      reviewerActorId: "agent-1",
      createdAt: now,
    });
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: "agent-review-commit",
        commitId: "missing",
        concernAreaSlug: "hidden-context",
        position: 0,
      }),
    ).rejects.toThrow();
    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO agent_review_concern_areas
            (agent_review_id, commit_id, concern_area_slug, position)
          VALUES
            (?, ?, ?, ?)
        `,
        args: ["agent-review-commit", "commit-1", "not-canonical", 0],
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(agentReviewConcernAreas).values({
        agentReviewId: "agent-review-commit",
        commitId: "commit-1",
        concernAreaSlug: "hidden-context",
        position: 3,
      }),
    ).rejects.toThrow();
  });

  it("allows agent review audit events through migration constraints", async () => {
    const connection = await migratedConnection();

    await connection.db.insert(reviewEvents).values({
      id: "event-1",
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "agent",
      actorId: "agent-1",
      actorDisplayName: "Codex",
      kind: "agent_review_recorded",
      summary: "Agent review evidence recorded for commit.",
      payloadJson: JSON.stringify(
        AgentReviewRecordedEventPayloadSchema.parse({
          agentReviewId: "agent-review-1",
          target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
          reviewedMark: "MODIFY",
          reviewedConcernAreas: ["hidden-context"],
        }),
      ),
      createdAt: now,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toMatchObject([
      {
        kind: "agent_review_recorded",
        actorType: "agent",
      },
    ]);
  });

  it("upgrades previously applied review event constraints for agent review history", async () => {
    const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
    tempDirectories.push(directory);
    const connection = createDatabaseConnection(`file:${join(directory, "review.db")}`);

    await migrateDatabase(connection.client, databaseMigrations.slice(0, 1));
    await connection.client.execute(`
      CREATE TABLE review_events (
        id TEXT PRIMARY KEY NOT NULL,
        scope_type TEXT NOT NULL CHECK (scope_type IN ('version', 'commit', 'file', 'diffBlock')),
        scope_id TEXT NOT NULL,
        actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
        actor_id TEXT NOT NULL,
        actor_display_name TEXT,
        kind TEXT NOT NULL CHECK (kind IN ('review_mark_changed', 'concern_areas_changed')),
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await connection.client.execute(
      "CREATE INDEX review_events_scope_idx ON review_events(scope_type, scope_id)",
    );
    await connection.client.execute("CREATE INDEX review_events_created_at_idx ON review_events(created_at)");
    await connection.client.execute({
      sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: ["0002_review_events", now],
    });
    await connection.db.insert(reviewEvents).values({
      id: "event-1",
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "human",
      actorId: "human-1",
      actorDisplayName: null,
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
      payloadJson: JSON.stringify(
        ReviewMarkChangedEventPayloadSchema.parse({
          target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
          previousReviewMark: "FLAG",
          newReviewMark: "PASS",
        }),
      ),
      createdAt: now,
    });

    await migrateDatabase(connection.client);
    await connection.db.insert(reviewEvents).values({
      id: "event-2",
      scopeType: "commit",
      scopeId: "commit-1",
      actorType: "agent",
      actorId: "agent-1",
      actorDisplayName: "Codex",
      kind: "agent_review_recorded",
      summary: "Agent review evidence recorded for commit.",
      payloadJson: JSON.stringify(
        AgentReviewRecordedEventPayloadSchema.parse({
          agentReviewId: "agent-review-1",
          target: ReviewEventTargetSchema.parse({ type: "commit", id: "commit-1" }),
          reviewedMark: "PASS",
          reviewedConcernAreas: [],
        }),
      ),
      createdAt: now,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toMatchObject([
      { id: "event-1", kind: "review_mark_changed" },
      { id: "event-2", kind: "agent_review_recorded" },
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
