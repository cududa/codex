import { afterEach, describe, expect, it } from "vitest";
import { reviewCommits, reviewVersionIngests, reviewVersions } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { createReviewIngestTestService, fixtureGitRangeReader } from "./ingest-service.test-support.js";
import { deterministicConcernMapVersion } from "./ingest-service.js";

afterEach(cleanupTestDatabases);

describe("review ingest service idempotency", () => {
  it("is idempotent for repository and resolved SHA range", async () => {
    const connection = await migratedTestConnection();
    const reader = fixtureGitRangeReader();
    const store = createReviewIngestTestService(connection, reader);

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
});
