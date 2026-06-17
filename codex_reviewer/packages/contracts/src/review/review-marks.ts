import { z } from "zod";

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

export type ReviewMark = z.infer<typeof ReviewMarkSchema>;
export type FinalReviewMark = z.infer<typeof FinalReviewMarkSchema>;
export type ExplicitFileReviewMark = z.infer<typeof ExplicitFileReviewMarkSchema>;
