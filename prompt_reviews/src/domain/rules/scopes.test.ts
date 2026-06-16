import { describe, expect, it } from "vitest";
import { validateDecisionScope, validateReviewEntityScope } from "./scopes.js";

describe("scope validation rules", () => {
  it("accept valid review entity scopes", () => {
    expect(validateReviewEntityScope({ type: "version", versionId: "v1" })).toEqual({
      success: true,
      data: { type: "version", versionId: "v1" },
    });
    expect(validateReviewEntityScope({ type: "commit", commitId: "c1" }).success).toBe(true);
    expect(validateReviewEntityScope({ type: "commit_file", commitFileId: "cf1" }).success).toBe(true);
    expect(validateReviewEntityScope({ type: "diff_block", diffBlockId: "db1" }).success).toBe(true);
  });

  it("rejects mixed or missing review entity parent ids", () => {
    expect(validateReviewEntityScope({ type: "commit", versionId: "v1", commitId: "c1" }).success).toBe(false);
    expect(validateReviewEntityScope({ type: "commit" }).success).toBe(false);
  });

  it("accepts valid decision scopes", () => {
    expect(validateDecisionScope({ type: "version", versionId: "v1" })).toEqual({
      success: true,
      data: { type: "version", versionId: "v1" },
    });
    expect(validateDecisionScope({ type: "commit", commitId: "c1" }).success).toBe(true);
    expect(validateDecisionScope({ type: "commit_file", commitFileId: "cf1" }).success).toBe(true);
  });

  it("rejects mixed, missing, or unsupported decision scope ids", () => {
    expect(validateDecisionScope({ type: "commit_file", commitId: "c1", commitFileId: "cf1" }).success).toBe(false);
    expect(validateDecisionScope({ type: "commit_file" }).success).toBe(false);
    expect(validateDecisionScope({ type: "diff_block", diffBlockId: "db1" }).success).toBe(false);
  });
});
