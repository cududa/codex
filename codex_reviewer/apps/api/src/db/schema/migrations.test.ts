import {
  AgentReviewRecordedEventPayloadSchema,
  ReviewEventTargetSchema,
  ReviewMarkChangedEventPayloadSchema,
} from "@prompt-reviews/contracts";
import { reviewTestActors, reviewTestIds, reviewTestNow } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import {
  createUnmigratedTestConnection,
  cleanupTestDatabases,
  migratedTestConnection,
} from "../../test-support/db.js";
import { databaseMigrations } from "../migrations/index.js";
import { migrateDatabase } from "../migrate.js";
import { reviewEvents } from "./index.js";

afterEach(cleanupTestDatabases);

describe("review schema migrations", () => {
  it("migrates an empty database to the implemented product records", async () => {
    const connection = await migratedTestConnection();

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

  it("upgrades previously applied review event constraints for agent review history", async () => {
    const connection = createUnmigratedTestConnection();

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
      args: ["0002_review_events", reviewTestNow],
    });
    await connection.db.insert(reviewEvents).values({
      id: reviewTestIds.event,
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "human",
      actorId: reviewTestActors.human.id,
      actorDisplayName: null,
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
      payloadJson: JSON.stringify(
        ReviewMarkChangedEventPayloadSchema.parse({
          target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
          previousReviewMark: "FLAG",
          newReviewMark: "PASS",
        }),
      ),
      createdAt: reviewTestNow,
    });

    await migrateDatabase(connection.client);
    await connection.db.insert(reviewEvents).values({
      id: "event-2",
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "agent",
      actorId: reviewTestActors.agent.id,
      actorDisplayName: reviewTestActors.agent.displayName,
      kind: "agent_review_recorded",
      summary: "Agent review evidence recorded for commit.",
      payloadJson: JSON.stringify(
        AgentReviewRecordedEventPayloadSchema.parse({
          agentReviewId: reviewTestIds.agentReview,
          target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
          reviewedMark: "PASS",
          reviewedConcernAreas: [],
        }),
      ),
      createdAt: reviewTestNow,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toMatchObject([
      { id: reviewTestIds.event, kind: "review_mark_changed" },
      { id: "event-2", kind: "agent_review_recorded" },
    ]);
  });
});
