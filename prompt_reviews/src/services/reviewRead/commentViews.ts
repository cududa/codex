import {
  CommentDetailSchema,
  CommentSummarySchema,
  type CommentDetail,
  type CommentLocation,
  type CommentSummary,
} from "../../domain/schemas/index.js";
import type { CommentStatus } from "../../domain/enums.js";
import {
  findCommitById,
  findCommitFileById,
  findDiffBlockById,
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

export function toCommentDetail(context: ServiceContext, row: CommentRow): CommentDetail {
  return CommentDetailSchema.parse({
    ...toCommentSummary(row),
    anchor: commentAnchor(row),
    location: commentLocation(context, row),
    updatedAt: row.updatedAt ?? undefined,
    resolvedBy:
      row.resolvedByActorType === null
        ? undefined
        : actorRef(row.resolvedByActorType, row.resolvedByActorId, row.resolvedByDisplayName),
    resolution: row.resolution ?? undefined,
  });
}

function commentLocation(context: ServiceContext, row: CommentRow): CommentLocation | undefined {
  if (row.scope === "version") {
    return undefined;
  }

  if (row.scope === "commit" && row.commitId !== null) {
    const commit = findCommitById(context.db, row.commitId);
    if (commit === undefined) {
      return undefined;
    }
    return { commit: { id: commit.id, sha: commit.sha, title: commit.title } };
  }

  const file =
    row.scope === "commit_file" && row.commitFileId !== null
      ? findCommitFileById(context.db, row.commitFileId)
      : row.scope === "diff_block" && row.diffBlockId !== null
        ? findFileForDiffBlock(context, row.diffBlockId)
        : undefined;
  if (file === undefined) {
    return undefined;
  }

  const commit = findCommitById(context.db, file.commitId);
  const diffBlock = row.diffBlockId === null ? undefined : findDiffBlockById(context.db, row.diffBlockId);
  return {
    commit: commit === undefined ? undefined : { id: commit.id, sha: commit.sha, title: commit.title },
    file: {
      id: file.id,
      path: file.newPath ?? file.oldPath ?? file.id,
      oldPath: file.oldPath ?? undefined,
    },
    diffBlock:
      diffBlock === undefined
        ? undefined
        : {
            id: diffBlock.id,
            heading: diffBlock.heading ?? undefined,
            oldStartLine: diffBlock.oldStartLine ?? undefined,
            oldEndLine: diffBlock.oldEndLine ?? undefined,
            newStartLine: diffBlock.newStartLine ?? undefined,
            newEndLine: diffBlock.newEndLine ?? undefined,
          },
  };
}

function findFileForDiffBlock(context: ServiceContext, diffBlockId: string) {
  const block = findDiffBlockById(context.db, diffBlockId);
  return block === undefined ? undefined : findCommitFileById(context.db, block.commitFileId);
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
