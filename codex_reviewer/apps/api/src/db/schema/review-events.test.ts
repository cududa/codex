import {
  AgentReviewRecordedEventPayloadSchema,
  ReviewEventTargetSchema,
  ReviewMarkChangedEventPayloadSchema,
} from "@prompt-reviews/contracts";
import {
  reviewTestActors,
  reviewTestConcernAreas,
  reviewTestIds,
  reviewTestNow,
} from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { reviewEvents } from "./index.js";

afterEach(cleanupTestDatabases);

describe("review event persistence schema", () => {
  it("stores review audit events as history rows", async () => {
    const connection = await migratedTestConnection();

    await connection.db.insert(reviewEvents).values({
      id: reviewTestIds.event,
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "human",
      actorId: reviewTestActors.human.id,
      actorDisplayName: reviewTestActors.human.displayName,
      kind: "review_mark_changed",
      summary: "Commit review mark changed from FLAG to PASS.",
      payloadJson: JSON.stringify(
        ReviewMarkChangedEventPayloadSchema.parse({
          target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
          previousReviewMark: "FLAG",
          newReviewMark: "PASS",
        }),
      ),
      createdAt: reviewTestNow,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toEqual([
      {
        id: reviewTestIds.event,
        scopeType: "commit",
        scopeId: reviewTestIds.commit,
        actorType: "human",
        actorId: reviewTestActors.human.id,
        actorDisplayName: reviewTestActors.human.displayName,
        kind: "review_mark_changed",
        summary: "Commit review mark changed from FLAG to PASS.",
        payloadJson: JSON.stringify(
          ReviewMarkChangedEventPayloadSchema.parse({
            target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
            previousReviewMark: "FLAG",
            newReviewMark: "PASS",
          }),
        ),
        createdAt: reviewTestNow,
      },
    ]);
  });

  it("allows agent review audit events through migration constraints", async () => {
    const connection = await migratedTestConnection();

    await connection.db.insert(reviewEvents).values({
      id: reviewTestIds.event,
      scopeType: "commit",
      scopeId: reviewTestIds.commit,
      actorType: "agent",
      actorId: reviewTestActors.agent.id,
      actorDisplayName: reviewTestActors.agent.displayName,
      kind: "agent_review_recorded",
      summary: "Agent review evidence recorded for commit.",
      payloadJson: JSON.stringify(
        AgentReviewRecordedEventPayloadSchema.parse({
          agentReviewId: reviewTestIds.agentReview,
          target: ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit }),
          reviewedMark: "MODIFY",
          reviewedConcernAreas: [reviewTestConcernAreas.alternate],
        }),
      ),
      createdAt: reviewTestNow,
    });

    await expect(connection.db.select().from(reviewEvents)).resolves.toMatchObject([
      {
        kind: "agent_review_recorded",
        actorType: "agent",
      },
    ]);
  });
});
