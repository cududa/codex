import { describe, expect, it } from "vitest";
import { boundarySchemas, exportBoundaryJsonSchemas, toBoundaryJsonSchema } from "./jsonSchemas.js";

describe("boundary JSON schema export", () => {
  it("exports every command and view schema for later orchestration", () => {
    expect(Object.keys(boundarySchemas).sort()).toEqual([
      "AddCommentParams",
      "ClassifyCommitParams",
      "ClassifyFileParams",
      "CloseVersionParams",
      "CommentDetail",
      "CommentSummary",
      "CommitDetail",
      "CommitFileDetail",
      "CommitFileQueueItem",
      "CommitQueueItem",
      "CompletePlanParams",
      "ConcernTagView",
      "CreatePlanItemParams",
      "CreatePlanParams",
      "CreateTaggingParams",
      "DecisionDetail",
      "DecisionSummary",
      "DeleteTaggingParams",
      "DiffBlockView",
      "FileReviewView",
      "FinalizeDecisionParams",
      "NextActionHint",
      "PaginatedResponse",
      "PlanDetail",
      "PlanItemDetail",
      "PlanSummary",
      "PopulateNextVersionParams",
      "ProposeDecisionParams",
      "RemainingWork",
      "ReopenCommentParams",
      "ResolveCommentParams",
      "TaggingView",
      "UpdateDecisionParams",
      "UpdatePlanItemParams",
      "UpdatePlanParams",
      "VersionDetail",
      "VersionProgress",
      "VersionSummary",
    ]);
  });

  it("converts boundary schemas with Zod local JSON schema support", () => {
    const jsonSchemas = exportBoundaryJsonSchemas();

    expect(Object.keys(jsonSchemas).sort()).toEqual(Object.keys(boundarySchemas).sort());
    expect(toBoundaryJsonSchema("ClassifyCommitParams")).toMatchObject({
      type: "object",
      properties: {
        commitId: { type: "string" },
        primaryTagSlug: {},
      },
    });
  });

  it("does not surface legacy artifact fields in exported schemas", () => {
    const exported = JSON.stringify(exportBoundaryJsonSchemas());

    expect(exported.includes("reviewPath")).toBe(false);
    expect(exported.includes("comments.json")).toBe(false);
    expect(exported.includes("markdown_path")).toBe(false);
  });
});
