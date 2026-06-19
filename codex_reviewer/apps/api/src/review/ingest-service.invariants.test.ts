import { asc } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  reviewCommits,
  reviewEvents,
  reviewFiles,
} from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { createReviewIngestTestService, fixtureGitRangeReader } from "./ingest-service.test-support.js";
import { deterministicConcernMapVersion } from "./ingest-service.js";

afterEach(cleanupTestDatabases);

describe("review ingest service invariants", () => {
  it("does not write baseline events, detector evidence, or agent review rows", async () => {
    const connection = await migratedTestConnection();
    const store = createReviewIngestTestService(connection, fixtureGitRangeReader());

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
    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([]);
  });

  it("keeps concern areas commit-scoped and review marks inside the canonical set", async () => {
    const connection = await migratedTestConnection();
    const store = createReviewIngestTestService(connection, fixtureGitRangeReader());

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
