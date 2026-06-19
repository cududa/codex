import { reviewTestIds } from "@prompt-reviews/review-test-support";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { reviewFiles } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import { createReviewWriteTestStore, reviewWriteActor } from "./write-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("review write store validation", () => {
  it("returns not_found for missing commits and files", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    await expect(
      store.setCommitReviewMark({
        commitId: "missing",
        reviewMark: "PASS",
        actor: reviewWriteActor,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      store.setFileReviewMark({
        fileId: "missing",
        reviewMark: "FLAG",
        actor: reviewWriteActor,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("returns state_conflict for review-state invariants", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    await store.setFileReviewMark({
      fileId: reviewTestIds.file,
      reviewMark: "FLAG",
      actor: reviewWriteActor,
    });
    await expect(
      store.setCommitReviewMark({
        commitId: reviewTestIds.commit,
        reviewMark: "PASS",
        actor: reviewWriteActor,
      }),
    ).rejects.toMatchObject({ code: "state_conflict" });

    await connection.db
      .update(reviewFiles)
      .set({ reviewMark: null })
      .where(eq(reviewFiles.id, reviewTestIds.file));
    await store.setCommitReviewMark({
      commitId: reviewTestIds.commit,
      reviewMark: "PASS",
      actor: reviewWriteActor,
    });
    await expect(
      store.setFileReviewMark({
        fileId: reviewTestIds.file,
        reviewMark: "MODIFY",
        actor: reviewWriteActor,
      }),
    ).rejects.toMatchObject({ code: "state_conflict" });
  });
});
