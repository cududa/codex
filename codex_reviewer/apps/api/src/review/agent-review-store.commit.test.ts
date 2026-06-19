import { AgentReviewRecordedEventPayloadSchema, ReviewEventTargetSchema } from "@prompt-reviews/contracts";
import { reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { asc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  reviewCommits,
  reviewEvents,
} from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import {
  agentReviewActor,
  createAgentReviewTestStore,
  recordCommitAgentReviewInput,
} from "./agent-review-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("commit agent review evidence store", () => {
  it("records commit evidence and composes it into reads without mutating current review state", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createAgentReviewTestStore(connection);

    const version = await store.recordCommitAgentReview(recordCommitAgentReviewInput());

    expect(version.commits[0]).toMatchObject({
      id: reviewTestIds.commit,
      reviewMark: "FLAG",
      concernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.secondary],
      agentReviews: [
        {
          commitId: reviewTestIds.commit,
          reviewedMark: "MODIFY",
          reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.primary],
          notesMarkdown: "The current commit mark should remain challenged.",
          reviewer: agentReviewActor,
        },
      ],
    });
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      {
        id: reviewTestIds.commit,
        reviewMark: "FLAG",
        updatedAt: null,
      },
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
        concernAreaSlug: reviewTestConcernAreas.primary,
        position: 0,
      },
      {
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.secondary,
        position: 1,
      },
    ]);
  });

  it("records ordered concern evidence and transactional audit history", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createAgentReviewTestStore(connection);

    await store.recordCommitAgentReview(recordCommitAgentReviewInput());

    const [review] = await connection.db.select().from(agentReviews);
    expect(review).toMatchObject({
      commitId: reviewTestIds.commit,
      fileId: null,
      reviewedMark: "MODIFY",
      reviewerActorType: "agent",
      reviewerActorId: agentReviewActor.id,
      reviewerActorDisplayName: agentReviewActor.displayName,
      notesMarkdown: "The current commit mark should remain challenged.",
    });
    await expect(
      connection.db.select().from(agentReviewConcernAreas).orderBy(asc(agentReviewConcernAreas.position)),
    ).resolves.toMatchObject([
      {
        agentReviewId: review?.id,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.alternate,
        position: 0,
      },
      {
        agentReviewId: review?.id,
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.primary,
        position: 1,
      },
    ]);

    const [event] = await connection.db.select().from(reviewEvents);
    expect(event).toMatchObject({
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "agent",
      actorId: agentReviewActor.id,
      kind: "agent_review_recorded",
    });
    expect(AgentReviewRecordedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      agentReviewId: review?.id,
      target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
      reviewedMark: "MODIFY",
      reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.primary],
    });
  });
});
