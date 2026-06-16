import { z } from "zod";
import {
  CommentStatusSchema,
  CreateTaggingParamsSchema,
  DeleteTaggingParamsSchema,
  VersionDetailSchema,
  VersionSummarySchema,
  type CommentDetail,
  type CommitDetail,
  type CommitFileDetail,
  type CommitFileQueueItem,
  type CommitQueueItem,
  type ConcernTagView,
  type ReviewEntityScope,
  type TaggingView,
  type VersionDetail,
  type VersionProgress,
  type VersionSummary,
} from "../domain/schemas/index.js";
import type { CommentStatus } from "../domain/enums.js";
import {
  addTagging as addTaggingRow,
  deleteTaggingById,
  findConcernTagBySlug,
  findDiffBlockById,
  findTaggingById,
  listCommitFilesByCommit,
  listCommitFilesByVersion,
  listCommitsByVersion,
  listConcernTagTree,
  listRemainingCommitFilesByCommit,
  listTaggingsByTarget,
  listVersions as listVersionRows,
  removeTaggingsByTargetKind,
  type ConcernTagRow,
  type TaggingTarget,
  type VersionRow,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import { toCommitDetail, toCommitQueueItem } from "./reviewRead/commitViews.js";
import { collectCommentRows, toCommentDetail, type ListCommentsFilter } from "./reviewRead/commentViews.js";
import { hasAcceptedHumanDecision } from "./reviewRead/decisionViews.js";
import { toCommitFileDetail, toCommitFileQueueItem } from "./reviewRead/fileViews.js";
import {
  findRequiredCommit,
  findRequiredCommitFile,
  findRequiredVersion,
  isReviewedStatus,
  parseParams,
} from "./reviewRead/shared.js";
import {
  flattenConcernTagViews,
  taggingTargetFromScope,
  targetTaggings,
  toTaggingView,
} from "./reviewRead/tagViews.js";
import { createReviewQueueService } from "./reviewQueueService.js";
import { type RootServiceContext, type ServiceContext, withServiceTransaction } from "./serviceContext.js";
import { recomputeCommitStatus, recomputeFileStatus, recomputeVersionStatus } from "./statusService.js";

export type ReviewReadPage<T> = {
  data: T[];
  nextCursor: string | null;
};

export type VersionListStatus = "open" | "closed" | "all";
export type MissingDecisionTarget = "commit" | "file";
export type { ListCommentsFilter } from "./reviewRead/commentViews.js";

export type ReviewReadService = {
  listVersions: (params?: { status?: VersionListStatus }) => VersionSummary[];
  getVersionDetail: (versionId: string) => VersionDetail;
  getCommitDetail: (commitId: string) => CommitDetail;
  listCommitFiles: (params: { commitId: string; remaining?: boolean }) => ReviewReadPage<CommitFileQueueItem>;
  getCommitFileDetail: (commitFileId: string) => CommitFileDetail;
  listConcernTags: () => ConcernTagView[];
  listComments: (filter?: ListCommentsFilter) => CommentDetail[];
  listMissingDecisions: (params: { versionId: string; target: MissingDecisionTarget }) => {
    target: MissingDecisionTarget;
    data: CommitQueueItem[] | CommitFileQueueItem[];
  };
  createTagging: (params: unknown) => TaggingView;
  deleteTagging: (params: unknown) => TaggingView;
};

const ListCommentsFilterSchema = z
  .object({
    versionId: z.string().trim().min(1).optional(),
    commitId: z.string().trim().min(1).optional(),
    commitFileId: z.string().trim().min(1).optional(),
    status: CommentStatusSchema.optional(),
  })
  .strict();

export function createReviewReadService(context: RootServiceContext): ReviewReadService {
  return {
    listVersions: (params = {}) => listVersions(context, params),
    getVersionDetail: (versionId) => getVersionDetail(context, versionId),
    getCommitDetail: (commitId) => getCommitDetail(context, commitId),
    listCommitFiles: (params) => listCommitFiles(context, params),
    getCommitFileDetail: (commitFileId) => getCommitFileDetail(context, commitFileId),
    listConcernTags: () => listConcernTags(context),
    listComments: (filter = {}) => listComments(context, filter),
    listMissingDecisions: (params) => listMissingDecisions(context, params),
    createTagging: (params) => createTagging(context, params),
    deleteTagging: (params) => deleteTagging(context, params),
  };
}

function listVersions(context: RootServiceContext, params: { status?: VersionListStatus } = {}): VersionSummary[] {
  const status = params.status ?? "open";
  const filter = status === "all" ? {} : { status };
  return listVersionRows(context.db, filter).map((version) => toVersionSummary(context, version));
}

function getVersionDetail(context: RootServiceContext, versionId: string): VersionDetail {
  const version = findRequiredVersion(context, versionId);
  return VersionDetailSchema.parse({
    ...toVersionSummary(context, version),
    description: version.description ?? undefined,
    commits: listCommitsByVersion(context.db, version.id).map((commit) => toCommitQueueItem(context, commit)),
    selectedCommit: undefined,
    remainingWork: createReviewQueueService(context).getRemainingWork({ versionId: version.id }),
  });
}

function getCommitDetail(context: ServiceContext, commitId: string): CommitDetail {
  return toCommitDetail(context, findRequiredCommit(context, commitId));
}

function listCommitFiles(
  context: ServiceContext,
  params: { commitId: string; remaining?: boolean },
): ReviewReadPage<CommitFileQueueItem> {
  findRequiredCommit(context, params.commitId);
  if (params.remaining === true) {
    const page = listRemainingCommitFilesByCommit(context.db, params.commitId);
    return {
      data: page.items.map((file) => toCommitFileQueueItem(context, file)),
      nextCursor: page.nextCursor,
    };
  }
  return {
    data: listCommitFilesByCommit(context.db, params.commitId).map((file) => toCommitFileQueueItem(context, file)),
    nextCursor: null,
  };
}

function getCommitFileDetail(context: ServiceContext, commitFileId: string): CommitFileDetail {
  return toCommitFileDetail(context, findRequiredCommitFile(context, commitFileId));
}

function listConcernTags(context: ServiceContext): ConcernTagView[] {
  return listConcernTagTree(context.db).flatMap((node) => flattenConcernTagViews(context, node));
}

function listComments(context: ServiceContext, filter: ListCommentsFilter = {}): CommentDetail[] {
  const command = parseParams(ListCommentsFilterSchema, filter, "Invalid list comments filter.");
  return collectCommentRows(context, command)
    .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
    .map(toCommentDetail);
}

function listMissingDecisions(
  context: ServiceContext,
  params: { versionId: string; target: MissingDecisionTarget },
): { target: MissingDecisionTarget; data: CommitQueueItem[] | CommitFileQueueItem[] } {
  findRequiredVersion(context, params.versionId);
  if (params.target === "commit") {
    return {
      target: "commit",
      data: listCommitsByVersion(context.db, params.versionId)
        .filter((commit) => hasAnyTag(context, { targetType: "commit", targetId: commit.id }))
        .filter((commit) => !hasAcceptedHumanDecision(context, { scope: "commit", targetId: commit.id }))
        .map((commit) => toCommitQueueItem(context, commit)),
    };
  }
  return {
    target: "file",
    data: listCommitFilesByVersion(context.db, params.versionId)
      .filter((file) => hasAnyTag(context, { targetType: "commit_file", targetId: file.id }))
      .filter((file) => !hasAcceptedHumanDecision(context, { scope: "commit_file", targetId: file.id }))
      .map((file) => toCommitFileQueueItem(context, file)),
  };
}

function createTagging(context: RootServiceContext, params: unknown): TaggingView {
  const command = parseParams(CreateTaggingParamsSchema, params, "Invalid create tagging params.");
  return withServiceTransaction(context, (txContext) => {
    validateTaggingScopeParent(txContext, command.scope);
    const target = taggingTargetFromScope(command.scope);
    const tag = findRequiredActiveConcernTag(txContext, command.tagSlug);

    if (command.kind === "secondary" && hasPrimaryTaggingForTag(txContext, target, tag.id)) {
      throw validationFailed("Primary tag cannot also be a secondary tag.", { tagSlug: command.tagSlug });
    }
    if (command.kind === "primary") {
      removeTaggingsByTargetKind(txContext.db, target, "primary");
    }

    const tagging = addTaggingRow(txContext.db, {
      tagId: tag.id,
      targetType: target.targetType,
      targetId: target.targetId,
      kind: command.kind,
      rationale: command.rationale ?? null,
      createdByActorType: command.actor.type,
      createdByActorId: command.actor.id ?? null,
      createdByDisplayName: command.actor.displayName ?? null,
      createdAt: txContext.now(),
    });
    assertAtMostOnePrimaryTagging(txContext, target);
    refreshTaggedTargetStatus(txContext, target);
    return toTaggingView(txContext, tagging);
  });
}

function deleteTagging(context: RootServiceContext, params: unknown): TaggingView {
  const command = parseParams(DeleteTaggingParamsSchema, params, "Invalid delete tagging params.");
  return withServiceTransaction(context, (txContext) => {
    const existing = findTaggingById(txContext.db, command.taggingId);
    if (existing === undefined) {
      throw notFound("tagging", command.taggingId);
    }
    const target = { targetType: existing.targetType, targetId: existing.targetId };
    const [deleted] = deleteTaggingById(txContext.db, existing.id);
    if (deleted === undefined) {
      throw notFound("tagging", command.taggingId);
    }
    assertAtMostOnePrimaryTagging(txContext, target);
    refreshTaggedTargetStatus(txContext, target);
    return toTaggingView(txContext, deleted);
  });
}

function toVersionSummary(context: RootServiceContext, row: VersionRow): VersionSummary {
  return VersionSummarySchema.parse({
    id: row.id,
    label: row.label,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
    closedAt: row.closedAt ?? undefined,
    progress: versionProgress(context, row.id),
  });
}

function versionProgress(context: RootServiceContext, versionId: string): VersionProgress {
  const commits = listCommitsByVersion(context.db, versionId);
  const files = commits.flatMap((commit) => listCommitFilesByCommit(context.db, commit.id));
  const queue = createReviewQueueService(context);
  const remainingWork = queue.getRemainingWork({ versionId }).filter((work) => work.kind !== "version_closure");
  return {
    totalCommits: commits.length,
    reviewedCommits: commits.filter((commit) => isReviewedStatus(commit.reviewStatus)).length,
    totalFiles: files.length,
    reviewedFiles: files.filter((file) => isReviewedStatus(file.reviewStatus)).length,
    unresolvedComments: queue.listOpenComments({ versionId }).length,
    pendingDecisions: queue.listMissingDecisions({ versionId }).length,
    incompletePlans: queue.listOpenPlans({ versionId }).length,
    remainingWorkCount: remainingWork.reduce((total, work) => total + work.count, 0),
  };
}

function findRequiredActiveConcernTag(context: ServiceContext, slug: string): ConcernTagRow {
  const tag = findConcernTagBySlug(context.db, slug);
  if (tag === undefined) {
    throw notFound("concern_tag", slug);
  }
  if (!tag.isActive) {
    throw validationFailed("Concern tag is inactive.", { slug });
  }
  return tag;
}

function validateTaggingScopeParent(context: ServiceContext, scope: ReviewEntityScope): void {
  if (scope.type === "version") {
    findRequiredVersion(context, scope.versionId);
  } else if (scope.type === "commit") {
    findRequiredCommit(context, scope.commitId);
  } else if (scope.type === "commit_file") {
    findRequiredCommitFile(context, scope.commitFileId);
  } else if (findDiffBlockById(context.db, scope.diffBlockId) === undefined) {
    throw notFound("diff_block", scope.diffBlockId);
  }
}

function hasAnyTag(context: ServiceContext, target: TaggingTarget): boolean {
  return listTaggingsByTarget(context.db, target).length > 0;
}

function assertAtMostOnePrimaryTagging(context: ServiceContext, target: TaggingTarget): void {
  const primaryCount = listTaggingsByTarget(context.db, target).filter((tagging) => tagging.kind === "primary").length;
  if (primaryCount > 1) {
    throw invariantFailed("Target cannot have more than one primary tag.", { ...target, primaryCount });
  }
}

function hasPrimaryTaggingForTag(context: ServiceContext, target: TaggingTarget, tagId: string): boolean {
  return listTaggingsByTarget(context.db, target).some((tagging) => tagging.kind === "primary" && tagging.tagId === tagId);
}

function refreshTaggedTargetStatus(context: ServiceContext, target: TaggingTarget): void {
  if (target.targetType === "version") {
    recomputeVersionStatus(context, target.targetId);
  } else if (target.targetType === "commit") {
    recomputeCommitStatus(context, target.targetId);
  } else if (target.targetType === "commit_file") {
    recomputeFileStatus(context, target.targetId);
  } else {
    const block = findDiffBlockById(context.db, target.targetId);
    if (block === undefined) {
      throw notFound("diff_block", target.targetId);
    }
    recomputeFileStatus(context, block.commitFileId);
  }
}
