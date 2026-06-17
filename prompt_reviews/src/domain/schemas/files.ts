import { z } from "zod";
import { changeTypes, reviewStatuses } from "../enums.js";
import { ActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema } from "./actors.js";
import { CommentSummarySchema } from "./comments.js";
import { DetectorFindingSchema, DetectorFindingSummarySchema } from "./concernDetector/index.js";
import { DecisionSummarySchema } from "./decisions.js";
import { DiffBlockViewSchema } from "./diffBlocks.js";
import { PlanSummarySchema } from "./plans.js";
import { ClassificationFieldsSchema, TaggingViewSchema } from "./tags.js";

export const ChangeTypeSchema = z.enum(changeTypes);
export const ReviewStatusSchema = z.enum(reviewStatuses);

export const ClassifyFileParamsSchema = ClassificationFieldsSchema.extend({
  commitFileId: IdSchema,
});

export const OverrideFileStatusParamsSchema = z
  .object({
    commitFileId: IdSchema,
    status: ReviewStatusSchema,
    reason: NonEmptyTextSchema,
    actor: ActorRefSchema,
  })
  .strict();

export const CommitFileQueueItemSchema = z
  .object({
    id: IdSchema,
    commitId: IdSchema,
    path: NonEmptyTextSchema,
    oldPath: OptionalTextSchema,
    changeType: ChangeTypeSchema,
    status: ReviewStatusSchema,
    primaryTagSlug: OptionalTextSchema,
    secondaryTagSlugs: z.array(NonEmptyTextSchema),
    detectorFindingSummaries: z.array(DetectorFindingSummarySchema),
  })
  .strict();

export const FileReviewViewSchema = z
  .object({
    file: CommitFileQueueItemSchema,
    taggings: z.array(TaggingViewSchema),
    comments: z.array(CommentSummarySchema),
    decisions: z.array(DecisionSummarySchema),
    plans: z.array(PlanSummarySchema),
  })
  .strict();

export const CommitFileDetailSchema = CommitFileQueueItemSchema.extend({
  detectorFindings: z.array(DetectorFindingSchema),
  diffBlocks: z.array(DiffBlockViewSchema),
  review: FileReviewViewSchema.omit({ file: true }),
});

export type ClassifyFileParams = z.infer<typeof ClassifyFileParamsSchema>;
export type OverrideFileStatusParams = z.infer<typeof OverrideFileStatusParamsSchema>;
export type CommitFileQueueItem = z.infer<typeof CommitFileQueueItemSchema>;
export type CommitFileDetail = z.infer<typeof CommitFileDetailSchema>;
export type FileReviewView = z.infer<typeof FileReviewViewSchema>;
