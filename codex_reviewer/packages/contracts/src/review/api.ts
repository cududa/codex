import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import { ConcernAreaSchema, ConcernAreaSelectionSchema } from "./concern-areas.js";
import {
  ExplicitFileReviewMarkSchema,
  ReviewMarkDefinitionSchema,
  ReviewMarkSchema,
} from "./review-marks.js";
import { ReviewVersionReadSchema } from "./reviewables.js";

export const ConcernAreasResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
  })
  .strict()
  .describe("Response containing the canonical concern area registry.");

export const ReviewMarksResponseSchema = z
  .object({
    reviewMarks: z
      .array(ReviewMarkDefinitionSchema)
      .describe("Canonical review marks and workflow metadata."),
  })
  .strict()
  .describe("Response containing the canonical review mark registry.");

export const ReviewBootstrapResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
    reviewMarks: z
      .array(ReviewMarkDefinitionSchema)
      .describe("Canonical review marks and workflow metadata."),
  })
  .strict()
  .describe("Bootstrap response for review UI and MCP clients.");

export const ReviewVersionsResponseSchema = z
  .object({
    versions: z.array(ReviewVersionReadSchema).describe("Persisted review versions and their commits."),
  })
  .strict()
  .describe("Response containing persisted review workbench data.");

export const ReviewVersionResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.nullable().describe("Persisted review version, or null when absent."),
  })
  .strict()
  .describe("Response containing one persisted review version.");

export const ReviewStateWriteResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.describe("Updated review version after a persisted state change."),
  })
  .strict()
  .describe("Response containing the owning review version after a state write.");

export const SetCommitReviewMarkRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the review mark change."),
    reviewMark: ReviewMarkSchema.describe("New commit-level review mark."),
  })
  .strict()
  .describe("Request to set the current review mark for a commit.");

export const SetFileReviewMarkRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the review mark change."),
    reviewMark: ExplicitFileReviewMarkSchema.describe("New explicit file-level review mark, or null."),
  })
  .strict()
  .describe("Request to set the explicit review mark for a file.");

export const SetCommitConcernAreasRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the concern area change."),
    concernAreas: ConcernAreaSelectionSchema.describe("Ordered commit concern areas."),
  })
  .strict()
  .describe("Request to replace the ordered concern areas for a commit.");

export type ConcernAreasResponse = z.infer<typeof ConcernAreasResponseSchema>;
export type ReviewMarksResponse = z.infer<typeof ReviewMarksResponseSchema>;
export type ReviewBootstrapResponse = z.infer<typeof ReviewBootstrapResponseSchema>;
export type ReviewVersionsResponse = z.infer<typeof ReviewVersionsResponseSchema>;
export type ReviewVersionResponse = z.infer<typeof ReviewVersionResponseSchema>;
export type ReviewStateWriteResponse = z.infer<typeof ReviewStateWriteResponseSchema>;
export type SetCommitReviewMarkRequest = z.infer<typeof SetCommitReviewMarkRequestSchema>;
export type SetFileReviewMarkRequest = z.infer<typeof SetFileReviewMarkRequestSchema>;
export type SetCommitConcernAreasRequest = z.infer<typeof SetCommitConcernAreasRequestSchema>;
