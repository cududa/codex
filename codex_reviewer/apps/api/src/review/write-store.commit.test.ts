import { ReviewEventTargetSchema, ReviewMarkChangedEventPayloadSchema } from "@prompt-reviews/contracts";
import { reviewTestIds } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { reviewCommits, reviewEvents } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import { createReviewWriteTestStore, reviewWriteActor } from "./write-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("commit review write store", () => {
  it("updates commit review marks and writes audit history", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    const version = await store.setCommitReviewMark({
      commitId: reviewTestIds.commit,
      reviewMark: "PASS",
      actor: reviewWriteActor,
    });

    expect(version.commits[0]?.reviewMark).toBe("PASS");
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: reviewTestIds.commit,
        reviewMark: "PASS",
      },
    ]);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(event).toMatchObject({
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "human",
      actorId: reviewWriteActor.id,
      actorDisplayName: reviewWriteActor.displayName,
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
    });
    expect(ReviewMarkChangedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
      previousReviewMark: "FLAG",
      newReviewMark: "PASS",
    });
  });

  it("does not write audit history or timestamps for no-op commit review marks", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    const version = await store.setCommitReviewMark({
      commitId: reviewTestIds.commit,
      reviewMark: "FLAG",
      actor: reviewWriteActor,
    });

    expect(version.commits[0]).toMatchObject({
      id: reviewTestIds.commit,
      reviewMark: "FLAG",
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: reviewTestIds.commit,
        reviewMark: "FLAG",
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });
});
