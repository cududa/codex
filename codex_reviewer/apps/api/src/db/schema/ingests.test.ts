import { reviewTestNow, reviewTestRange, reviewTestIds } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { reviewVersionIngests } from "./index.js";

afterEach(cleanupTestDatabases);

describe("review ingest persistence schema", () => {
  it("stores exactly one ingest metadata row per ingested review version", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    await connection.db.insert(reviewVersionIngests).values({
      versionId: reviewTestIds.version,
      repositoryId: reviewTestRange.repositoryId,
      baseRefOrSha: reviewTestRange.baseRef,
      targetRefOrSha: reviewTestRange.targetRef,
      baseSha: reviewTestRange.baseSha,
      targetSha: reviewTestRange.targetSha,
      concernMapVersion: "deterministic-concern-map-v1",
      source: "system-ingest",
      createdAt: reviewTestNow,
    });

    await expect(connection.db.select().from(reviewVersionIngests)).resolves.toEqual([
      {
        versionId: reviewTestIds.version,
        repositoryId: reviewTestRange.repositoryId,
        baseRefOrSha: reviewTestRange.baseRef,
        targetRefOrSha: reviewTestRange.targetRef,
        baseSha: reviewTestRange.baseSha,
        targetSha: reviewTestRange.targetSha,
        concernMapVersion: "deterministic-concern-map-v1",
        source: "system-ingest",
        createdAt: reviewTestNow,
      },
    ]);
    await expect(
      connection.db.insert(reviewVersionIngests).values({
        versionId: reviewTestIds.version,
        repositoryId: reviewTestRange.repositoryId,
        baseRefOrSha: "other-base",
        targetRefOrSha: "other-target",
        baseSha: reviewTestRange.baseSha,
        targetSha: reviewTestRange.targetSha,
        concernMapVersion: "deterministic-concern-map-v1",
        source: "system-ingest",
        createdAt: reviewTestNow,
      }),
    ).rejects.toThrow();
  });
});
