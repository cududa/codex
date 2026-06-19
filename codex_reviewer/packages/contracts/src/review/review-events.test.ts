import { reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import {
  ConcernAreasChangedEventPayloadSchema,
  ReviewEventTargetSchema,
  ReviewMarkChangedEventPayloadSchema,
} from "./review-events.js";

describe("review event contracts", () => {
  it("validates review event payload targets", () => {
    expect(ReviewEventTargetSchema.parse({ type: "commit", id: reviewTestIds.commit })).toEqual({
      type: "commit",
      id: reviewTestIds.commit,
    });
    expect(ReviewEventTargetSchema.parse({ type: "diffBlock", id: reviewTestIds.diffBlock })).toEqual({
      type: "diffBlock",
      id: reviewTestIds.diffBlock,
    });
    expect(() => ReviewEventTargetSchema.parse({ type: "comment", id: "comment-1" })).toThrow();
    expect(() =>
      ReviewEventTargetSchema.parse({
        type: "commit",
        id: reviewTestIds.commit,
        commitId: reviewTestIds.commit,
      }),
    ).toThrow();
  });

  it("validates review mark and concern area event payload kernels", () => {
    expect(
      ReviewMarkChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        previousReviewMark: "FLAG",
        newReviewMark: "PASS",
      }),
    ).toEqual({
      target: { type: "commit", id: reviewTestIds.commit },
      previousReviewMark: "FLAG",
      newReviewMark: "PASS",
    });
    expect(
      ReviewMarkChangedEventPayloadSchema.parse({
        target: { type: "file", id: reviewTestIds.file },
        previousReviewMark: null,
        newReviewMark: "MODIFY",
      }),
    ).toEqual({
      target: { type: "file", id: reviewTestIds.file },
      previousReviewMark: null,
      newReviewMark: "MODIFY",
    });
    expect(
      ConcernAreasChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        commitId: reviewTestIds.commit,
        previousConcernAreas: [reviewTestConcernAreas.primary],
        newConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
      }),
    ).toEqual({
      target: { type: "commit", id: reviewTestIds.commit },
      commitId: reviewTestIds.commit,
      previousConcernAreas: [reviewTestConcernAreas.primary],
      newConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
    });
  });

  it("rejects malformed review mark and concern area event payloads", () => {
    expect(() =>
      ReviewMarkChangedEventPayloadSchema.parse({
        target: { type: "version", id: reviewTestIds.version },
        previousReviewMark: "FLAG",
        newReviewMark: "PASS",
      }),
    ).toThrow();
    expect(() =>
      ReviewMarkChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        previousReviewMark: null,
        newReviewMark: "PASS",
      }),
    ).toThrow();
    expect(() =>
      ReviewMarkChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        reviewMark: "PASS",
      }),
    ).toThrow();
    expect(() =>
      ConcernAreasChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        commitId: reviewTestIds.commit,
        concernAreas: [reviewTestConcernAreas.alternate],
      }),
    ).toThrow();
    expect(() =>
      ConcernAreasChangedEventPayloadSchema.parse({
        target: { type: "commit", id: reviewTestIds.commit },
        commitId: "commit-2",
        previousConcernAreas: [reviewTestConcernAreas.primary],
        newConcernAreas: [reviewTestConcernAreas.alternate],
      }),
    ).toThrow();
  });
});
