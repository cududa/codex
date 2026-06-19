import { reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { commitConcernAreas } from "./index.js";

afterEach(cleanupTestDatabases);

describe("commit concern area persistence schema", () => {
  it("enforces ordered commit concern areas without file-level concern areas", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(
      connection.db.insert(commitConcernAreas).values({
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 1,
      }),
    ).rejects.toThrow();

    const fileColumns = await connection.client.execute("PRAGMA table_info(review_files)");
    expect(fileColumns.rows.map((row) => row.name)).not.toContain("concern_area_slug");
  });

  it("keeps the concern-area selection limit consistent with the contract", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await connection.db.insert(commitConcernAreas).values({
      commitId: reviewTestIds.commit,
      concernAreaSlug: reviewTestConcernAreas.alternate,
      position: 2,
    });
    await expect(
      connection.db.insert(commitConcernAreas).values({
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.followUp,
        position: 3,
      }),
    ).rejects.toThrow();

    await expect(
      connection.db
        .select()
        .from(commitConcernAreas)
        .where(eq(commitConcernAreas.commitId, reviewTestIds.commit)),
    ).resolves.toHaveLength(3);
  });
});
