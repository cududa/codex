import { z } from "zod";
import { ActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, UnixSecondsSchema } from "./actors.js";
import { CommentSummarySchema } from "./comments.js";
import { DetectorFindingSummarySchema } from "./concernDetector/index.js";
import { DecisionSummarySchema } from "./decisions.js";
import { CommitFileDetailSchema, CommitFileQueueItemSchema, ReviewStatusSchema } from "./files.js";
import { PlanSummarySchema } from "./plans.js";
import { ClassificationFieldsSchema, TaggingViewSchema } from "./tags.js";

export const ClassifyCommitParamsSchema = ClassificationFieldsSchema.extend({
  commitId: IdSchema,
});

export const OverrideCommitStatusParamsSchema = z
  .object({
    commitId: IdSchema,
    status: ReviewStatusSchema,
    reason: NonEmptyTextSchema,
    actor: ActorRefSchema,
  })
  .strict();

export const CommitQueueItemSchema = z
  .object({
    id: IdSchema,
    versionId: IdSchema,
    sha: NonEmptyTextSchema,
    title: NonEmptyTextSchema,
    authorName: OptionalTextSchema,
    committedAt: UnixSecondsSchema.optional(),
    status: ReviewStatusSchema,
    primaryTagSlug: OptionalTextSchema,
    secondaryTagSlugs: z.array(NonEmptyTextSchema),
    fileCount: z.number().int().nonnegative(),
    detectorFindingSummaries: z.array(DetectorFindingSummarySchema),
  })
  .strict();

export const CommitDetailSchema = CommitQueueItemSchema.extend({
  message: OptionalTextSchema,
  files: z.array(CommitFileDetailSchema),
  queuedFiles: z.array(CommitFileQueueItemSchema),
  taggings: z.array(TaggingViewSchema),
  comments: z.array(CommentSummarySchema),
  decisions: z.array(DecisionSummarySchema),
  plans: z.array(PlanSummarySchema),
});

export type ClassifyCommitParams = z.infer<typeof ClassifyCommitParamsSchema>;
export type OverrideCommitStatusParams = z.infer<typeof OverrideCommitStatusParamsSchema>;
export type CommitQueueItem = z.infer<typeof CommitQueueItemSchema>;
export type CommitDetail = z.infer<typeof CommitDetailSchema>;
