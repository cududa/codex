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
  type PlanSummary,
  type RemainingWork,
  type ReviewEntityScope,
} from "../domain/schemas/index.js";
import {
  findConcernTagById,
  findVersionById,
  listCommentsByScopeStatus,
  listCommitFilesByCommit,
  listCommitFilesByVersion,
  listCommitsByVersion,
  listDecisionsByTarget,
  listDiffBlocksByCommitFile,
  listPlanItems,
  listPlansByTarget,
  listRemainingCommitFilesByCommit,
  listRemainingCommitFilesByVersion,
  listRemainingCommitsByVersion,
  listTaggingsByTarget,
  type CommentRow,
  type CommitFileRow,
  type CommitRow,
  type PlanRow,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import type { ServiceContext } from "./serviceContext.js";

type Page<T> = {
  data: T[];
  nextCursor: string | null;
};

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
  listRemainingCommits: (params: ListRemainingCommitsParams) => Page<CommitQueueItem>;
  listRemainingFiles: (params: ListRemainingFilesParams) => Page<CommitFileQueueItem>;
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
): Page<CommitQueueItem> {
  const page = listRemainingCommitsByVersion(context.db, params.versionId, {
    cursor: params.cursor,
    limit: params.limit,
  });
  return {
    data: page.items.map((commit) => toCommitQueueItem(context, commit)),
    nextCursor: page.nextCursor,
  };
}

export function listRemainingFiles(context: ServiceContext, params: ListRemainingFilesParams): Page<CommitFileQueueItem> {
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
    data: page.items.map((file) => toCommitFileQueueItem(context, file)),
    nextCursor: page.nextCursor,
  };
}

function requireVersionId(params: ListRemainingFilesParams): string {
  if (params.versionId === undefined) {
    throw validationFailed("versionId is required.");
  }
  return params.versionId;
}

export function listMissingDecisions(context: ServiceContext, params: VersionScopedParams): CommitFileQueueItem[] {
  return listCommitFilesByVersion(context.db, params.versionId)
    .filter((file) => hasAnyTag(context, file) && !hasAcceptedHumanDecision(context, file))
    .map((file) => toCommitFileQueueItem(context, file));
}

export function listOpenComments(context: ServiceContext, params: VersionScopedParams): CommentSummary[] {
  return collectOpenComments(context, params.versionId).map((comment) => CommentSummarySchema.parse(toCommentSummary(comment)));
}

export function listOpenPlans(context: ServiceContext, params: VersionScopedParams): PlanSummary[] {
  return collectIncompleteAcceptedPlans(context, params.versionId).map((plan) => PlanSummarySchema.parse(toPlanSummary(plan)));
}

export function getRemainingWork(context: ServiceContext, params: VersionScopedParams): RemainingWork[] {
  const unclassifiedFiles = listCommitFilesByVersion(context.db, params.versionId).filter((file) => !hasAnyTag(context, file));
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

function toCommitQueueItem(context: ServiceContext, row: CommitRow): CommitQueueItem {
  const tagSlugs = getTargetTagSlugs(context, "commit", row.id);
  return CommitQueueItemSchema.parse({
    id: row.id,
    versionId: row.versionId,
    sha: row.sha,
    title: row.title,
    authorName: row.authorName ?? undefined,
    committedAt: row.committedAt ?? undefined,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs.primary,
    secondaryTagSlugs: tagSlugs.secondary,
    fileCount: listCommitFilesByCommit(context.db, row.id).length,
  });
}

function toCommitFileQueueItem(context: ServiceContext, row: CommitFileRow): CommitFileQueueItem {
  const tagSlugs = getTargetTagSlugs(context, "commit_file", row.id);
  return CommitFileQueueItemSchema.parse({
    id: row.id,
    commitId: row.commitId,
    path: row.newPath ?? row.oldPath,
    oldPath: row.oldPath ?? undefined,
    changeType: row.changeType,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs.primary,
    secondaryTagSlugs: tagSlugs.secondary,
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

function collectOpenComments(context: ServiceContext, versionId: string): CommentRow[] {
  const comments = [...listCommentsByScopeStatus(context.db, { scope: "version", status: "open", targetId: versionId })];
  for (const commit of listCommitsByVersion(context.db, versionId)) {
    comments.push(...listCommentsByScopeStatus(context.db, { scope: "commit", status: "open", targetId: commit.id }));
    for (const file of listCommitFilesByCommit(context.db, commit.id)) {
      comments.push(...listCommentsByScopeStatus(context.db, { scope: "commit_file", status: "open", targetId: file.id }));
      for (const block of listDiffBlocksByCommitFile(context.db, file.id)) {
        comments.push(...listCommentsByScopeStatus(context.db, { scope: "diff_block", status: "open", targetId: block.id }));
      }
    }
  }
  return comments;
}

function collectIncompleteAcceptedPlans(context: ServiceContext, versionId: string): PlanRow[] {
  const plans = new Map<string, PlanRow>();
  addIncompletePlans(context, plans, { scope: "version", targetId: versionId });
  for (const commit of listCommitsByVersion(context.db, versionId)) {
    addIncompletePlans(context, plans, { scope: "commit", targetId: commit.id });
    for (const file of listCommitFilesByCommit(context.db, commit.id)) {
      addIncompletePlans(context, plans, { scope: "commit_file", targetId: file.id });
    }
  }
  return [...plans.values()];
}

function addIncompletePlans(
  context: ServiceContext,
  plans: Map<string, PlanRow>,
  target: { scope: "version" | "commit" | "commit_file"; targetId: string },
): void {
  for (const plan of listPlansByTarget(context.db, target, { status: "accepted" })) {
    if (hasIncompletePlanItems(context, plan.id)) {
      plans.set(plan.id, plan);
    }
  }
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

function hasIncompletePlanItems(context: ServiceContext, planId: string): boolean {
  return listPlanItems(context.db, planId).some(
    (item) => item.status === "todo" || item.status === "in_progress" || item.status === "blocked",
  );
}

function hasAnyTag(context: ServiceContext, file: CommitFileRow): boolean {
  return listTaggingsByTarget(context.db, { targetType: "commit_file", targetId: file.id }).length > 0;
}

function hasAcceptedHumanDecision(context: ServiceContext, file: CommitFileRow): boolean {
  return listDecisionsByTarget(context.db, { scope: "commit_file", targetId: file.id }, ["accepted"]).some(
    (decision) => decision.finalizedByActorType === "human",
  );
}

function getTargetTagSlugs(context: ServiceContext, targetType: "commit" | "commit_file", targetId: string) {
  const primary: string[] = [];
  const secondary: string[] = [];
  for (const tagging of listTaggingsByTarget(context.db, { targetType, targetId })) {
    const tag = findConcernTagById(context.db, tagging.tagId);
    if (tag === undefined) {
      throw invariantFailed("Tagging points at a missing concern tag.", { taggingId: tagging.id, tagId: tagging.tagId });
    }
    if (tagging.kind === "primary") {
      primary.push(tag.slug);
    } else {
      secondary.push(tag.slug);
    }
  }
  return { primary: primary[0], secondary };
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
