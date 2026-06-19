import { reviewTestIds } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { diffBlocks } from "./index.js";

afterEach(cleanupTestDatabases);

describe("diff block persistence schema", () => {
  it("enforces diff block line ranges", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(
      connection.db.insert(diffBlocks).values({
        id: "diff-2",
        fileId: reviewTestIds.file,
        position: 1,
        oldStartLine: 8,
        oldEndLine: 4,
        patch: "@@ -8,4 +8,4 @@\n unchanged",
      }),
    ).rejects.toThrow();
  });
});
