import { z } from "zod";
import { NonEmptyStringSchema } from "../shared/primitives.js";

export const reviewMarks = ["PASS", "FLAG", "MODIFY", "DONE"] as const;

export const ReviewMarkSchema = z
  .enum(reviewMarks)
  .describe("Operational review mark for an upstream commit or file.");

export const FinalReviewMarkSchema = z
  .enum(["PASS", "DONE"])
  .describe("Review marks that may appear in a completed review ledger.");

export const ExplicitFileReviewMarkSchema = ReviewMarkSchema.nullable().describe(
  "A file-specific review mark; null means no explicit file-level mark is currently operational.",
);

export const ReviewMarkDefinitionSchema = z
  .object({
    mark: ReviewMarkSchema.describe("Review mark value."),
    label: NonEmptyStringSchema.describe("Short display label for this review mark."),
    description: NonEmptyStringSchema.describe("When this review mark should be used."),
    isFinal: z.boolean().describe("Whether this mark can appear in the completed review ledger."),
    requiresLocalChangeRefs: z
      .boolean()
      .describe("Whether this mark requires linked local commit evidence before approval or finalization."),
  })
  .strict()
  .describe("Display and workflow metadata for a review mark.");

export const ReviewMarkDefinitionsSchema = z
  .array(ReviewMarkDefinitionSchema)
  .length(reviewMarks.length)
  .superRefine((definitions, context) => {
    const seen = new Set<string>();
    for (const [index, definition] of definitions.entries()) {
      if (seen.has(definition.mark)) {
        context.addIssue({
          code: "custom",
          message: `duplicate review mark definition: ${definition.mark}`,
          path: [index, "mark"],
        });
      }
      seen.add(definition.mark);
    }
  })
  .describe("The complete canonical review mark definition registry.");

const reviewMarkDefinitionInput = [
  {
    mark: "PASS",
    label: "Pass",
    description: "Reviewed and no local adaptation is required.",
    isFinal: true,
    requiresLocalChangeRefs: false,
  },
  {
    mark: "FLAG",
    label: "Flag",
    description: "Investigation is required before the review can resolve to pass or modify.",
    isFinal: false,
    requiresLocalChangeRefs: false,
  },
  {
    mark: "MODIFY",
    label: "Modify",
    description: "The upstream change requires intentional local adaptation before approval.",
    isFinal: false,
    requiresLocalChangeRefs: false,
  },
  {
    mark: "DONE",
    label: "Done",
    description: "Required local adaptation is complete and linked to local commit evidence.",
    isFinal: true,
    requiresLocalChangeRefs: true,
  },
] as const;

export const reviewMarkDefinitions = ReviewMarkDefinitionsSchema.parse(reviewMarkDefinitionInput);

export type ReviewMark = z.infer<typeof ReviewMarkSchema>;
export type FinalReviewMark = z.infer<typeof FinalReviewMarkSchema>;
export type ExplicitFileReviewMark = z.infer<typeof ExplicitFileReviewMarkSchema>;
export type ReviewMarkDefinition = z.infer<typeof ReviewMarkDefinitionSchema>;
