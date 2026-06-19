import { reviewTestNow, reviewTestRange, reviewVersionFixture } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { reviewVersions } from "./index.js";

afterEach(cleanupTestDatabases);

describe("review version persistence schema", () => {
  it("requires resolved SHAs and enforces one ingested version per resolved repository range", async () => {
    const connection = await migratedTestConnection();

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
          reviewTestRange.label,
          reviewTestRange.repositoryId,
          reviewTestRange.baseRef,
          reviewTestRange.targetRef,
          reviewTestRange.targetSha,
          reviewTestNow,
        ],
      }),
    ).rejects.toThrow();

    await seedReviewSpineWithTwoConcernAreas(connection);
    await expect(
      connection.db.insert(reviewVersions).values({
        ...reviewVersionFixture(),
        id: "version-duplicate",
        baseRef: "other-base",
        targetRef: "other-target",
      }),
    ).rejects.toThrow();
  });
});
