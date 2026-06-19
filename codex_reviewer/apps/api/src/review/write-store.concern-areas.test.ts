import { ConcernAreasChangedEventPayloadSchema, ReviewEventTargetSchema } from "@prompt-reviews/contracts";
import { reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { commitConcernAreas, reviewCommits, reviewEvents } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import { createReviewWriteTestStore, reviewWriteActor } from "./write-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("commit concern area write store", () => {
  it("replaces ordered commit concern areas and compacts positions", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    const version = await store.setCommitConcernAreas({
      commitId: reviewTestIds.commit,
      concernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
      actor: reviewWriteActor,
    });

    expect(version.commits[0]?.concernAreas).toEqual([
      reviewTestConcernAreas.alternate,
      reviewTestConcernAreas.followUp,
    ]);
    await expect(
      connection.db
        .select()
        .from(commitConcernAreas)
        .where(eq(commitConcernAreas.commitId, reviewTestIds.commit))
        .orderBy(asc(commitConcernAreas.position)),
    ).resolves.toEqual([
      {
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      },
      {
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.followUp,
        position: 1,
      },
    ]);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(ConcernAreasChangedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
      commitId: reviewTestIds.commit,
      previousConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.secondary],
      newConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
    });
  });

  it("does not write audit history or timestamps for no-op concern-area selections", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createReviewWriteTestStore(connection);

    const version = await store.setCommitConcernAreas({
      commitId: reviewTestIds.commit,
      concernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.secondary],
      actor: reviewWriteActor,
    });

    expect(version.commits[0]).toMatchObject({
      id: reviewTestIds.commit,
      concernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.secondary],
      updatedAt: null,
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: reviewTestIds.commit,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([]);
  });
});
