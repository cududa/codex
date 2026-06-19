import {
  commitAgentReviewFixture,
  fileAgentReviewFixture,
  reviewVersionReadFixture,
} from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { ReviewVersionsResponseSchema } from "./api.js";

describe("review read response contracts", () => {
  it("validates the first-slice workbench read response", () => {
    const baseVersion = reviewVersionReadFixture();
    const [baseCommit] = baseVersion.commits;
    if (baseCommit === undefined) {
      throw new Error("expected review version fixture to include a commit");
    }
    const [baseFile] = baseCommit.files;
    if (baseFile === undefined) {
      throw new Error("expected review commit fixture to include a file");
    }
    const version = {
      ...baseVersion,
      commits: [
        {
          ...baseCommit,
          agentReviews: [commitAgentReviewFixture()],
          files: [{ ...baseFile, agentReviews: [fileAgentReviewFixture()] }],
        },
      ],
    };

    expect(ReviewVersionsResponseSchema.parse({ versions: [version] })).toMatchObject({
      versions: [{ commitCount: 1 }],
    });
  });
});
