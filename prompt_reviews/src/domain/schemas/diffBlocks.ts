import { z } from "zod";
import { IdSchema, NonEmptyTextSchema, OptionalTextSchema, PositiveLineNumberSchema } from "./actors.js";
import { CommentSummarySchema } from "./comments.js";
import { DetectorFindingSchema } from "./concernDetector/index.js";
import { DecisionSummarySchema } from "./decisions.js";
import { TaggingViewSchema } from "./tags.js";

export const DiffBlockViewSchema = z
  .object({
    id: IdSchema,
    commitFileId: IdSchema,
    heading: OptionalTextSchema,
    oldStartLine: PositiveLineNumberSchema.optional(),
    oldEndLine: PositiveLineNumberSchema.optional(),
    newStartLine: PositiveLineNumberSchema.optional(),
    newEndLine: PositiveLineNumberSchema.optional(),
    patch: NonEmptyTextSchema,
    taggings: z.array(TaggingViewSchema),
    comments: z.array(CommentSummarySchema),
    decision: DecisionSummarySchema.optional(),
    detectorFindings: z.array(DetectorFindingSchema),
  })
  .strict();

export type DiffBlockView = z.infer<typeof DiffBlockViewSchema>;
