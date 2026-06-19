import { AgentReviewRecordedEventPayloadSchema, ReviewEventTargetSchema } from "@prompt-reviews/contracts";
import { reviewTestIds } from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { agentReviewConcernAreas, agentReviews, reviewEvents, reviewFiles } from "../db/schema/index.js";
import { cleanupTestDatabases, migratedTestConnection } from "../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../test-support/review-spine.js";
import {
  agentReviewActor,
  createAgentReviewTestStore,
  recordFileAgentReviewInput,
} from "./agent-review-store.test-support.js";

afterEach(cleanupTestDatabases);

describe("file agent review evidence store", () => {
  it("records file evidence without concern areas or file review-state mutation", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);
    const store = createAgentReviewTestStore(connection);

    const version = await store.recordFileAgentReview(recordFileAgentReviewInput());

    expect(version.commits[0]?.files[0]).toMatchObject({
      id: reviewTestIds.file,
      reviewMark: null,
      agentReviews: [
        {
          fileId: reviewTestIds.file,
          reviewedMark: "PASS",
          notesMarkdown: null,
          reviewer: agentReviewActor,
        },
      ],
    });
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      {
        id: reviewTestIds.file,
        reviewMark: null,
        updatedAt: null,
      },
    ]);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toEqual([]);

    const [review] = await connection.db.select().from(agentReviews);
    const [event] = await connection.db.select().from(reviewEvents);
    expect(review).toMatchObject({
      commitId: null,
      fileId: reviewTestIds.file,
      reviewedMark: "PASS",
    });
    expect(AgentReviewRecordedEventPayloadSchema.parse(JSON.parse(event?.payloadJson ?? "{}"))).toEqual({
      agentReviewId: review?.id,
      target: ReviewEventTargetSchema.parse({ type: "file", id: reviewTestIds.file }),
      reviewedMark: "PASS",
    });
  });
});
