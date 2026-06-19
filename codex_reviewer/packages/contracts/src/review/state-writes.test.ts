import {
  reviewTestActors,
  reviewTestConcernAreas,
  reviewVersionReadFixture,
} from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import {
  ReviewMarkWriteResponseSchema,
  SetCommitConcernAreasRequestSchema,
  SetCommitReviewMarkRequestSchema,
  SetFileReviewMarkRequestSchema,
} from "./api.js";

describe("review state write contracts", () => {
  it("requires actors for review-state write requests", () => {
    expect(
      SetCommitReviewMarkRequestSchema.parse({
        actor: reviewTestActors.human,
        reviewMark: "PASS",
      }),
    ).toEqual({
      actor: reviewTestActors.human,
      reviewMark: "PASS",
    });
    expect(
      SetFileReviewMarkRequestSchema.parse({
        actor: reviewTestActors.human,
        reviewMark: null,
      }),
    ).toEqual({
      actor: reviewTestActors.human,
      reviewMark: null,
    });
    expect(
      SetCommitConcernAreasRequestSchema.parse({
        actor: reviewTestActors.human,
        concernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
      }),
    ).toEqual({
      actor: reviewTestActors.human,
      concernAreas: [reviewTestConcernAreas.primary, reviewTestConcernAreas.alternate],
    });
    expect(() => SetCommitReviewMarkRequestSchema.parse({ reviewMark: "INVALID_REVIEW_MARK" })).toThrow();
    expect(() =>
      SetFileReviewMarkRequestSchema.parse({
        actor: reviewTestActors.human,
        reviewMark: "INVALID_REVIEW_MARK",
      }),
    ).toThrow();
    expect(() =>
      SetCommitConcernAreasRequestSchema.parse({
        actor: reviewTestActors.human,
        concernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.alternate],
      }),
    ).toThrow();
  });

  it("validates mark and concern writes with a specific response contract", () => {
    expect(ReviewMarkWriteResponseSchema.parse({ version: reviewVersionReadFixture() })).toMatchObject({
      version: { id: "version-1" },
    });
  });
});
