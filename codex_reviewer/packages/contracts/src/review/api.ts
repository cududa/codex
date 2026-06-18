import { z } from "zod";
import { ConcernAreaSchema } from "./concern-areas.js";
import { ReviewMarkDefinitionSchema } from "./review-marks.js";
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

export type ConcernAreasResponse = z.infer<typeof ConcernAreasResponseSchema>;
export type ReviewMarksResponse = z.infer<typeof ReviewMarksResponseSchema>;
export type ReviewBootstrapResponse = z.infer<typeof ReviewBootstrapResponseSchema>;
export type ReviewVersionsResponse = z.infer<typeof ReviewVersionsResponseSchema>;
export type ReviewVersionResponse = z.infer<typeof ReviewVersionResponseSchema>;
