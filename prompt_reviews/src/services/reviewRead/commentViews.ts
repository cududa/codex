import {
  CommentDetailSchema,
  CommentSummarySchema,
  type CommentDetail,
  type CommentSummary,
} from "../../domain/schemas/index.js";
import type { CommentStatus } from "../../domain/enums.js";
import {
  listCommentsByScopeStatus,
  listCommitFilesByCommit,
  listCommitsByVersion,
  listDiffBlocksByCommitFile,
  type CommentRow,
} from "../../repositories/index.js";
import { validationFailed } from "../errors.js";
import type { ServiceContext } from "../serviceContext.js";
import {
  actorRef,
  commentAnchor,
  commentScope,
  findRequiredCommit,
  findRequiredCommitFile,
  findRequiredVersion,
} from "./shared.js";

export type ListCommentsFilter = {
  versionId?: string;
  commitId?: string;
  commitFileId?: string;
  status?: CommentStatus;
};

export function collectCommentRows(context: ServiceContext, filter: ListCommentsFilter): CommentRow[] {
  assertSingleCommentTarget(filter);
  if (filter.versionId !== undefined) {
    findRequiredVersion(context, filter.versionId);
    return [
      ...targetComments(context, "version", filter.versionId, filter.status),
      ...listCommitsByVersion(context.db, filter.versionId).flatMap((commit) =>
        collectCommitComments(context, commit.id, filter.status),
      ),
    ];
  }
  if (filter.commitId !== undefined) {
    findRequiredCommit(context, filter.commitId);
    return collectCommitComments(context, filter.commitId, filter.status);
  }
  if (filter.commitFileId !== undefined) {
    findRequiredCommitFile(context, filter.commitFileId);
    return collectFileComments(context, filter.commitFileId, filter.status);
  }
  return ["version", "commit", "commit_file", "diff_block"].flatMap((scope) =>
    listCommentsByScopeStatus(context.db, { scope: scope as CommentRow["scope"], status: filter.status }),
  );
}

export function toCommentDetail(row: CommentRow): CommentDetail {
  return CommentDetailSchema.parse({
    ...toCommentSummary(row),
    anchor: commentAnchor(row),
    updatedAt: row.updatedAt ?? undefined,
    resolvedBy:
      row.resolvedByActorType === null
        ? undefined
        : actorRef(row.resolvedByActorType, row.resolvedByActorId, row.resolvedByDisplayName),
    resolution: row.resolution ?? undefined,
  });
}

export function toCommentSummary(row: CommentRow): CommentSummary {
  return CommentSummarySchema.parse({
    id: row.id,
    scope: commentScope(row),
    status: row.status,
    body: row.body,
    author: actorRef(row.authorActorType, row.authorActorId, row.authorDisplayName),
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt ?? undefined,
  });
}

export function targetComments(
  context: ServiceContext,
  scope: CommentRow["scope"],
  targetId: string,
  status?: CommentStatus,
): CommentRow[] {
  return listCommentsByScopeStatus(context.db, { scope, targetId, status });
}

function collectCommitComments(context: ServiceContext, commitId: string, status?: CommentStatus): CommentRow[] {
  return [
    ...targetComments(context, "commit", commitId, status),
    ...listCommitFilesByCommit(context.db, commitId).flatMap((file) => collectFileComments(context, file.id, status)),
  ];
}

function collectFileComments(context: ServiceContext, commitFileId: string, status?: CommentStatus): CommentRow[] {
  return [
    ...targetComments(context, "commit_file", commitFileId, status),
    ...listDiffBlocksByCommitFile(context.db, commitFileId).flatMap((block) =>
      targetComments(context, "diff_block", block.id, status),
    ),
  ];
}

function assertSingleCommentTarget(filter: ListCommentsFilter): void {
  const targetCount = [filter.versionId, filter.commitId, filter.commitFileId].filter((value) => value !== undefined).length;
  if (targetCount > 1) {
    throw validationFailed("At most one comment target filter is allowed.");
  }
}
