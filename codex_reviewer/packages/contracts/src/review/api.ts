import { z } from "zod";
import { ConcernAreaSchema } from "./concern-areas.js";
import { ReviewMarkDefinitionSchema } from "./review-marks.js";
import { NonEmptyStringSchema } from "../shared/primitives.js";

export const ConcernAreasResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
  })
  .strict()
  .describe("Response containing the canonical concern area registry.");

export const ReviewMarksResponseSchema = z
  .object({
    reviewMarks: z.array(ReviewMarkDefinitionSchema).describe("Canonical review marks and workflow metadata."),
  })
  .strict()
  .describe("Response containing the canonical review mark registry.");

export const ReviewSchemaCatalogResponseSchema = z
  .object({
    schemaNames: z.array(NonEmptyStringSchema).describe("Canonical review schema names exported by the contracts package."),
  })
  .strict()
  .describe("Response containing the review schema catalog.");

export const ReviewBootstrapResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
    reviewMarks: z.array(ReviewMarkDefinitionSchema).describe("Canonical review marks and workflow metadata."),
    schemaNames: z.array(NonEmptyStringSchema).describe("Canonical review schema names exported by the contracts package."),
  })
  .strict()
  .describe("Bootstrap response for review UI and MCP clients.");

export type ConcernAreasResponse = z.infer<typeof ConcernAreasResponseSchema>;
export type ReviewMarksResponse = z.infer<typeof ReviewMarksResponseSchema>;
export type ReviewSchemaCatalogResponse = z.infer<typeof ReviewSchemaCatalogResponseSchema>;
export type ReviewBootstrapResponse = z.infer<typeof ReviewBootstrapResponseSchema>;
