import { z } from "zod";
import { versionStatuses } from "../enums.js";
import { CountSchema, HumanActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, UnixSecondsSchema } from "./actors.js";
import { DetectorRunStatusSchema } from "./concernDetector/index.js";
import { CommitDetailSchema, CommitQueueItemSchema } from "./commits.js";
import { RemainingWorkSchema } from "./remainingWork.js";

export const VersionStatusSchema = z.enum(versionStatuses);

export const PopulateNextVersionParamsSchema = z
  .object({
    repositoryId: IdSchema,
    baseVersionId: IdSchema.optional(),
    baseRefOrSha: OptionalTextSchema,
    targetRef: OptionalTextSchema,
    label: OptionalTextSchema,
  })
  .strict();

export const CloseVersionParamsSchema = z
  .object({
    versionId: IdSchema,
    finalizer: HumanActorRefSchema,
    summary: OptionalTextSchema,
  })
  .strict();

export const VersionProgressSchema = z
  .object({
    totalCommits: CountSchema,
    reviewedCommits: CountSchema,
    totalFiles: CountSchema,
    reviewedFiles: CountSchema,
    unresolvedComments: CountSchema,
    pendingDecisions: CountSchema,
    incompletePlans: CountSchema,
    remainingWorkCount: CountSchema,
  })
  .strict();

export const VersionSummarySchema = z
  .object({
    id: IdSchema,
    label: NonEmptyTextSchema,
    status: VersionStatusSchema,
    createdAt: UnixSecondsSchema,
    updatedAt: UnixSecondsSchema.optional(),
    closedAt: UnixSecondsSchema.optional(),
    progress: VersionProgressSchema,
  })
  .strict();

export const PopulateNextVersionDetectorSummarySchema = z
  .object({
    runCount: CountSchema,
    latestRunId: IdSchema.nullable(),
    latestRunStatus: DetectorRunStatusSchema.nullable(),
    findingCount: CountSchema,
    graphNodeCount: CountSchema,
    graphEdgeCount: CountSchema,
  })
  .strict();

export const PopulateNextVersionResponseSchema = z
  .object({
    version: VersionSummarySchema,
    baseSha: NonEmptyTextSchema,
    targetSha: NonEmptyTextSchema,
    commitCount: CountSchema,
    fileCount: CountSchema,
    diffBlockCount: CountSchema,
    detector: PopulateNextVersionDetectorSummarySchema,
    created: z.boolean(),
  })
  .strict();

export const VersionDetailSchema = VersionSummarySchema.extend({
  description: OptionalTextSchema,
  commits: z.array(CommitQueueItemSchema),
  selectedCommit: CommitDetailSchema.optional(),
  remainingWork: z.array(RemainingWorkSchema),
});

export const PaginatedResponseSchema = z
  .object({
    data: z.array(z.unknown()),
    nextCursor: IdSchema.nullable(),
    returnedCount: CountSchema,
    totalCount: CountSchema,
    hasMore: z.boolean(),
  })
  .strict();

export function paginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return PaginatedResponseSchema.extend({
    data: z.array(itemSchema),
  });
}

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
  returnedCount: number;
  totalCount: number;
  hasMore: boolean;
};

export function paginatedResult<T>(data: T[], nextCursor: string | null, totalCount: number): PaginatedResult<T> {
  return {
    data,
    nextCursor,
    returnedCount: data.length,
    totalCount,
    hasMore: nextCursor !== null,
  };
}

export type PopulateNextVersionParams = z.infer<typeof PopulateNextVersionParamsSchema>;
export type PopulateNextVersionDetectorSummary = z.infer<typeof PopulateNextVersionDetectorSummarySchema>;
export type PopulateNextVersionResponse = z.infer<typeof PopulateNextVersionResponseSchema>;
export type CloseVersionParams = z.infer<typeof CloseVersionParamsSchema>;
export type VersionProgress = z.infer<typeof VersionProgressSchema>;
export type VersionSummary = z.infer<typeof VersionSummarySchema>;
export type VersionDetail = z.infer<typeof VersionDetailSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
