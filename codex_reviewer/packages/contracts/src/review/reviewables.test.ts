import {
  commitAgentReviewFixture,
  reviewCommitFixture,
  reviewFileFixture,
} from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { ReviewCommitReadSchema, ReviewFileReadSchema } from "./reviewables.js";

describe("reviewable read contracts", () => {
  it("models commit concern areas only at commit level", () => {
    expect(
      ReviewCommitReadSchema.parse({
        ...reviewCommitFixture(),
        sha: "1234567",
        title: "Adjust tool prompt",
        authorName: null,
        reviewMark: "MODIFY",
        concernAreas: ["tool-affordances"],
        agentReviews: [commitAgentReviewFixture()],
        files: [],
      }),
    ).toMatchObject({
      concernAreas: ["tool-affordances"],
      reviewMark: "MODIFY",
    });

    expect(() =>
      ReviewFileReadSchema.parse({
        ...reviewFileFixture(),
        reviewMark: "FLAG",
        concernAreas: ["tool-affordances"],
        agentReviews: [],
        diffBlocks: [],
      }),
    ).toThrow();
  });
});
