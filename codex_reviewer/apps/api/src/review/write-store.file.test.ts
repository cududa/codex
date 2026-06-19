import { ReviewEventTargetSchema, ReviewMarkChangedEventPayloadSchema } from "@prompt-reviews/contracts";
import { reviewTestIds } from "@prompt-reviews/review-test-support";
import { asc } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { reviewEvents, reviewFiles } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import { createReviewWriteTestStore, reviewWriteActor } from "./write-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("file review write store", () => {
  it("updates file review marks, including clearing explicit file state", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    await store.setFileReviewMark({
      fileId: reviewTestIds.file,
      reviewMark: "MODIFY",
      actor: reviewWriteActor,
    });
    const version = await store.setFileReviewMark({
      fileId: reviewTestIds.file,
      reviewMark: null,
      actor: reviewWriteActor,
    });

    expect(version.commits[0]?.files[0]?.reviewMark).toBeNull();
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: reviewTestIds.file,
        reviewMark: null,
      },
    ]);
    const events = await connection.db.select().from(reviewEvents).orderBy(asc(reviewEvents.createdAt));
    expect(events).toHaveLength(2);
    expect(
      events.map((event) => ReviewMarkChangedEventPayloadSchema.parse(JSON.parse(event.payloadJson))),
    ).toEqual([
      {
        target: ReviewEventTargetSchema.parse({ type: "file", id: reviewTestIds.file }),
        previousReviewMark: null,
        newReviewMark: "MODIFY",
      },
      {
        target: ReviewEventTargetSchema.parse({ type: "file", id: reviewTestIds.file }),
        previousReviewMark: "MODIFY",
        newReviewMark: null,
      },
    ]);
  });

  it("does not write audit history or timestamps for no-op file review marks", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    const version = await store.setFileReviewMark({
      fileId: reviewTestIds.file,
      reviewMark: null,
      actor: reviewWriteActor,
    });

    expect(version.commits[0]?.files[0]).toMatchObject({
      id: reviewTestIds.file,
      reviewMark: null,
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: reviewTestIds.file,
        reviewMark: null,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });
});
