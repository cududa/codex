import { afterEach, describe, expect, it } from "vitest";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { createReviewIngestTestService, fixtureGitRangeReader } from "./ingest-service.test-support.js";
import { deterministicConcernMapVersion } from "./ingest-service.js";

afterEach(cleanupTestDatabases);

describe("review ingest service validation", () => {
  it("fails before creating rows when refs cannot resolve", async () => {
    const connection = await migratedTestConnection();
    const store = createReviewIngestTestService(connection, fixtureGitRangeReader());

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

  it("rejects unsupported concern-map versions without partial rows", async () => {
    const connection = await migratedTestConnection();
    const store = createReviewIngestTestService(connection, fixtureGitRangeReader());

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
});
