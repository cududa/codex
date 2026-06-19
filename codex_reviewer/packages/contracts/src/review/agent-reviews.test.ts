import {
  reviewTestActors,
  reviewTestConcernAreas,
  reviewTestIds,
  reviewVersionReadFixture,
} from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import {
  RecordAgentReviewResponseSchema,
  RecordCommitAgentReviewRequestSchema,
  RecordFileAgentReviewRequestSchema,
} from "./api.js";
import { AgentReviewRecordedEventPayloadSchema } from "./review-events.js";

describe("agent review evidence contracts", () => {
  it("requires agent actors for agent review evidence writes", () => {
    expect(
      RecordCommitAgentReviewRequestSchema.parse({
        actor: reviewTestActors.agent,
        reviewedMark: "MODIFY",
        reviewedConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
        notesMarkdown: "The current mark matches the diff.",
      }),
    ).toEqual({
      actor: reviewTestActors.agent,
      reviewedMark: "MODIFY",
      reviewedConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
      notesMarkdown: "The current mark matches the diff.",
    });
    expect(
      RecordFileAgentReviewRequestSchema.parse({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    ).toEqual({
      actor: reviewTestActors.agent,
      reviewedMark: "PASS",
      notesMarkdown: null,
    });

    expect(() =>
      RecordCommitAgentReviewRequestSchema.parse({
        actor: reviewTestActors.human,
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    ).toThrow();
    expect(() =>
      RecordFileAgentReviewRequestSchema.parse({
        actor: reviewTestActors.human,
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    ).toThrow();
  });

  it("rejects file-scoped concern areas and invalid commit evidence details", () => {
    expect(() =>
      RecordFileAgentReviewRequestSchema.parse({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.primary],
        notesMarkdown: null,
      }),
    ).toThrow();
    expect(() =>
      RecordCommitAgentReviewRequestSchema.parse({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.primary],
        notesMarkdown: null,
      }),
    ).toThrow();
    expect(() =>
      RecordCommitAgentReviewRequestSchema.parse({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: "",
      }),
    ).toThrow();
  });

  it("validates agent review event payload kernels", () => {
    expect(
      AgentReviewRecordedEventPayloadSchema.parse({
        agentReviewId: reviewTestIds.agentReview,
        target: { type: "commit", id: reviewTestIds.commit },
        reviewedMark: "MODIFY",
        reviewedConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
      }),
    ).toEqual({
      agentReviewId: reviewTestIds.agentReview,
      target: { type: "commit", id: reviewTestIds.commit },
      reviewedMark: "MODIFY",
      reviewedConcernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
    });
    expect(
      AgentReviewRecordedEventPayloadSchema.parse({
        agentReviewId: "agent-review-2",
        target: { type: "file", id: reviewTestIds.file },
        reviewedMark: "PASS",
      }),
    ).toEqual({
      agentReviewId: "agent-review-2",
      target: { type: "file", id: reviewTestIds.file },
      reviewedMark: "PASS",
    });

    expect(() =>
      AgentReviewRecordedEventPayloadSchema.parse({
        agentReviewId: reviewTestIds.agentReview,
        target: { type: "file", id: reviewTestIds.file },
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.primary],
      }),
    ).toThrow();
    expect(() =>
      AgentReviewRecordedEventPayloadSchema.parse({
        agentReviewId: reviewTestIds.agentReview,
        target: { type: "commit", id: reviewTestIds.commit },
        reviewedMark: "PASS",
        concernAreas: [reviewTestConcernAreas.primary],
      }),
    ).toThrow();
  });

  it("validates agent review evidence responses without review-state mutation naming", () => {
    expect(RecordAgentReviewResponseSchema.parse({ version: reviewVersionReadFixture() })).toMatchObject({
      version: { id: reviewTestIds.version },
    });
  });
});
