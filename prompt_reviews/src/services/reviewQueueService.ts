import {
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  CommentSummarySchema,
  PlanSummarySchema,
  RemainingWorkSchema,
  type ActorRef,
  type CommitFileQueueItem,
  type CommitQueueItem,
  type CommentSummary,
  type DecisionSummary,
  type PaginatedResult,
  type PlanSummary,
  type RemainingWork,
  type ReviewEntityScope,
} from "../domain/schemas/index.js";
import {
  findVersionById,
  countCommitFilesByCommitIds,
  listCommitFilesByVersion,
  listIncompleteAcceptedPlansByVersion,
  listPlanItems,
  listOpenCommentsByVersion,
  listRemainingCommitFilesByCommit,
  listRemainingCommitFilesByVersion,
  listRemainingCommitsByVersion,
  listTagSlugsByTargets,
  listTaggedCommitFilesMissingHumanAcceptedDecisionByVersion,
  listUntaggedCommitFilesByVersion,
  type CommentRow,
  type CommitFileRow,
  type CommitRow,
  type PlanRow,
  type TargetTagSlugs,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import type { ServiceContext } from "./serviceContext.js";

export type ListRemainingCommitsParams = {
  versionId: string;
  cursor?: string | null;
  limit?: number;
};

export type ListRemainingFilesParams = {
  versionId?: string;
  commitId?: string;
  cursor?: string | null;
  limit?: number;
};

export type VersionScopedParams = {
  versionId: string;
};

export type ReviewQueueService = {
  listRemainingCommits: (params: ListRemainingCommitsParams) => PaginatedResult<CommitQueueItem>;
  listRemainingFiles: (params: ListRemainingFilesParams) => PaginatedResult<CommitFileQueueItem>;
  listMissingDecisions: (params: VersionScopedParams) => CommitFileQueueItem[];
  listOpenComments: (params: VersionScopedParams) => CommentSummary[];
  listOpenPlans: (params: VersionScopedParams) => PlanSummary[];
  getRemainingWork: (params: VersionScopedParams) => RemainingWork[];
};

export function createReviewQueueService(context: ServiceContext): ReviewQueueService {
  return {
    listRemainingCommits: (params) => listRemainingCommits(context, params),
    listRemainingFiles: (params) => listRemainingFiles(context, params),
    listMissingDecisions: (params) => listMissingDecisions(context, params),
    listOpenComments: (params) => listOpenComments(context, params),
    listOpenPlans: (params) => listOpenPlans(context, params),
    getRemainingWork: (params) => getRemainingWork(context, params),
  };
}

export function listRemainingCommits(
  context: ServiceContext,
  params: ListRemainingCommitsParams,
): PaginatedResult<CommitQueueItem> {
  const page = listRemainingCommitsByVersion(context.db, params.versionId, {
    cursor: params.cursor,
    limit: params.limit,
  });
  return {
    data: toCommitQueueItems(context, page.data),
    nextCursor: page.nextCursor,
    returnedCount: page.returnedCount,
    totalCount: page.totalCount,
    hasMore: page.hasMore,
  };
}

export function listRemainingFiles(
  context: ServiceContext,
  params: ListRemainingFilesParams,
): PaginatedResult<CommitFileQueueItem> {
  if ((params.versionId === undefined) === (params.commitId === undefined)) {
    throw validationFailed("Exactly one of versionId or commitId is required.");
  }

  const page =
    params.commitId === undefined
      ? listRemainingCommitFilesByVersion(context.db, requireVersionId(params), {
          cursor: params.cursor,
          limit: params.limit,
        })
      : listRemainingCommitFilesByCommit(context.db, params.commitId, {
          cursor: params.cursor,
          limit: params.limit,
        });

  return {
    data: toCommitFileQueueItems(context, page.data),
    nextCursor: page.nextCursor,
    returnedCount: page.returnedCount,
    totalCount: page.totalCount,
    hasMore: page.hasMore,
  };
}

function requireVersionId(params: ListRemainingFilesParams): string {
  if (params.versionId === undefined) {
    throw validationFailed("versionId is required.");
  }
  return params.versionId;
}

export function listMissingDecisions(context: ServiceContext, params: VersionScopedParams): CommitFileQueueItem[] {
  return toCommitFileQueueItems(
    context,
    listTaggedCommitFilesMissingHumanAcceptedDecisionByVersion(context.db, params.versionId),
  );
}

export function listOpenComments(context: ServiceContext, params: VersionScopedParams): CommentSummary[] {
  return listOpenCommentsByVersion(context.db, params.versionId).map((comment) =>
    CommentSummarySchema.parse(toCommentSummary(comment)),
  );
}

export function listOpenPlans(context: ServiceContext, params: VersionScopedParams): PlanSummary[] {
  return listIncompleteAcceptedPlansByVersion(context.db, params.versionId).map((plan) =>
    PlanSummarySchema.parse(toPlanSummary(plan)),
  );
}

export function getRemainingWork(context: ServiceContext, params: VersionScopedParams): RemainingWork[] {
  const unclassifiedFiles = listUntaggedCommitFilesByVersion(context.db, params.versionId);
  const missingDecisions = listMissingDecisions(context, params);
  const openComments = listOpenComments(context, params);
  const incompletePlans = listOpenPlans(context, params);
  const remainingWork: RemainingWork[] = [];

  if (unclassifiedFiles.length > 0) {
    remainingWork.push(
      RemainingWorkSchema.parse({
        kind: "classification",
        label: "Files need classification",
        count: unclassifiedFiles.length,
        targetIds: unclassifiedFiles.map((file) => file.id),
        blockingComments: [],
        pendingDecisions: [],
        incompletePlans: [],
        nextActions: unclassifiedFiles.map((file) => ({
          type: "classify",
          label: `Classify ${file.newPath ?? file.oldPath}`,
          targetId: file.id,
        })),
      }),
    );
  }

  if (missingDecisions.length > 0) {
    remainingWork.push(
      RemainingWorkSchema.parse({
        kind: "decision",
        label: "Files need human-final decisions",
        count: missingDecisions.length,
        targetIds: missingDecisions.map((file) => file.id),
        blockingComments: [],
        pendingDecisions: [] satisfies DecisionSummary[],
        incompletePlans: [],
        nextActions: missingDecisions.map((file) => ({
          type: "decide",
          label: `Decide ${file.path}`,
          targetId: file.id,
        })),
      }),
    );
  }

  if (openComments.length > 0) {
    remainingWork.push(
      RemainingWorkSchema.parse({
        kind: "comment",
        label: "Open comments need resolution",
        count: openComments.length,
        targetIds: openComments.map((comment) => comment.id),
        blockingComments: openComments,
        pendingDecisions: [],
        incompletePlans: [],
        nextActions: openComments.map((comment) => ({
          type: "comment",
          label: "Resolve comment",
          targetId: comment.id,
        })),
      }),
    );
  }

  if (incompletePlans.length > 0) {
    remainingWork.push(
      RemainingWorkSchema.parse({
        kind: "plan",
        label: "Accepted plans have incomplete items",
        count: incompletePlans.length,
        targetIds: incompletePlans.map((plan) => plan.id),
        blockingComments: [],
        pendingDecisions: [],
        incompletePlans,
        nextActions: collectIncompletePlanItemActions(context, incompletePlans),
      }),
    );
  }

  const version = findVersionById(context.db, params.versionId);
  if (version === undefined) {
    throw notFound("version", params.versionId);
  }
  if (version.status === "ready" && remainingWork.length === 0) {
    remainingWork.push(
      RemainingWorkSchema.parse({
        kind: "version_closure",
        label: "Version is ready to close",
        count: 1,
        targetIds: [params.versionId],
        blockingComments: [],
        pendingDecisions: [],
        incompletePlans: [],
        nextActions: [
          {
            type: "close_version",
            label: "Close version",
            targetId: params.versionId,
          },
        ],
      }),
    );
  }

  return remainingWork;
}

function toCommitQueueItems(context: ServiceContext, rows: readonly CommitRow[]): CommitQueueItem[] {
  const commitIds = rows.map((row) => row.id);
  const fileCounts = countCommitFilesByCommitIds(context.db, commitIds);
  const tagSlugsByTarget = listTagSlugsByTargets(context.db, "commit", commitIds);
  return rows.map((row) => toCommitQueueItem(row, fileCounts.get(row.id) ?? 0, tagSlugsByTarget.get(row.id)));
}

function toCommitQueueItem(row: CommitRow, fileCount: number, tagSlugs: TargetTagSlugs | undefined): CommitQueueItem {
  return CommitQueueItemSchema.parse({
    id: row.id,
    versionId: row.versionId,
    sha: row.sha,
    title: row.title,
    authorName: row.authorName ?? undefined,
    committedAt: row.committedAt ?? undefined,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs?.primary,
    secondaryTagSlugs: tagSlugs?.secondary ?? [],
    fileCount,
  });
}

function toCommitFileQueueItems(context: ServiceContext, rows: readonly CommitFileRow[]): CommitFileQueueItem[] {
  const fileIds = rows.map((row) => row.id);
  const tagSlugsByTarget = listTagSlugsByTargets(context.db, "commit_file", fileIds);
  return rows.map((row) => toCommitFileQueueItem(row, tagSlugsByTarget.get(row.id)));
}

function toCommitFileQueueItem(row: CommitFileRow, tagSlugs: TargetTagSlugs | undefined): CommitFileQueueItem {
  return CommitFileQueueItemSchema.parse({
    id: row.id,
    commitId: row.commitId,
    path: row.newPath ?? row.oldPath,
    oldPath: row.oldPath ?? undefined,
    changeType: row.changeType,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs?.primary,
    secondaryTagSlugs: tagSlugs?.secondary ?? [],
  });
}

function toCommentSummary(row: CommentRow): CommentSummary {
  return {
    id: row.id,
    scope: commentScope(row),
    status: row.status,
    body: row.body,
    author: actorRef(row.authorActorType, row.authorActorId, row.authorDisplayName),
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt ?? undefined,
  };
}

function toPlanSummary(row: PlanRow): PlanSummary {
  return {
    id: row.id,
    scope: planScope(row),
    title: row.title,
    summary: row.summary ?? undefined,
    status: row.status,
    proposedBy: actorRef(row.proposedByActorType, row.proposedByActorId, row.proposedByDisplayName),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  };
}

function collectIncompletePlanItemActions(context: ServiceContext, plans: PlanSummary[]) {
  return plans.flatMap((plan) =>
    listPlanItems(context.db, plan.id)
      .filter((item) => item.status === "todo" || item.status === "in_progress" || item.status === "blocked")
      .map((item) => ({
        type: "plan" as const,
        label: item.title,
        targetId: item.id,
        reason: item.blockingReason ?? undefined,
      })),
  );
}

function commentScope(row: CommentRow): ReviewEntityScope {
  if (row.scope === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.scope === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.scope === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  if (row.scope === "diff_block" && row.diffBlockId !== null) {
    return { type: "diff_block", diffBlockId: row.diffBlockId };
  }
  throw invariantFailed("Comment scope is missing its target id.", { commentId: row.id, scope: row.scope });
}

function planScope(row: PlanRow): PlanSummary["scope"] {
  if (row.scope === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.scope === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.scope === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  throw invariantFailed("Plan scope is missing its target id.", { planId: row.id, scope: row.scope });
}

function actorRef(type: ActorRef["type"], id: string | null, displayName: string | null): ActorRef {
  return {
    type,
    id: id ?? undefined,
    displayName: displayName ?? undefined,
  };
}
