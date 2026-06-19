import { describe, expect, it } from "vitest";
import { ReviewMarkSchema, reviewMarkDefinitions, reviewMarks } from "./review-marks.js";

describe("review mark contracts", () => {
  it("defines review marks as PASS, FLAG, and MODIFY only", () => {
    expect(reviewMarks).toEqual(["PASS", "FLAG", "MODIFY"]);
    expect(reviewMarkDefinitions).toEqual([
      {
        mark: "PASS",
        label: "Pass",
        description: "Reviewed and no local adaptation is required.",
        requiresLocalChangeEvidence: false,
      },
      {
        mark: "FLAG",
        label: "Flag",
        description: "Investigation is required before the review can resolve to pass or modify.",
        requiresLocalChangeEvidence: false,
      },
      {
        mark: "MODIFY",
        label: "Modify",
        description: "The upstream change requires intentional local adaptation before approval.",
        requiresLocalChangeEvidence: true,
      },
    ]);
    expect(() => ReviewMarkSchema.parse("INVALID_REVIEW_MARK")).toThrow();
    expect(() => ReviewMarkSchema.parse("DONE")).toThrow();
  });
});
