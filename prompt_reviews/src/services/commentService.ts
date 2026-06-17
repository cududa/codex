import { z } from "zod";
import {
  AddCommentParamsSchema,
  CommentDetailSchema,
  ReopenCommentParamsSchema,
  ResolveCommentParamsSchema,
  type ActorRef,
  type CommentDetail,
  type ReviewEntityScope,
  type SourceAnchor,
} from "../domain/schemas/index.js";
import {
  addComment as addCommentRow,
  findCommentById,
  findCommitById,
  findCommitFileById,
  findDiffBlockById,
  findVersionById,
  updateCommentLifecycleFields,
  type CommentInsert,
  type CommentRow,
} from "../repositories/index.js";
import { invariantFailed, notFound, unsupportedOperation, validationFailed } from "./errors.js";
import { withServiceTransaction, type RootServiceContext, type ServiceContext } from "./serviceContext.js";
import { recomputeCommitStatus, recomputeFileStatus, recomputeVersionStatus } from "./statusService.js";

export type CommentService = {
  addComment: (params: unknown) => CommentDetail;
  resolveComment: (params: unknown) => CommentDetail;
  reopenComment: (params: unknown) => CommentDetail;
  supersedeComment: (params: unknown) => never;
};

export function createCommentService(context: RootServiceContext): CommentService {
  return {
    addComment: (params) => addComment(context, params),
    resolveComment: (params) => resolveComment(context, params),
    reopenComment: (params) => reopenComment(context, params),
    supersedeComment: () => supersedeComment(),
  };
}

export function addComment(context: RootServiceContext, params: unknown): CommentDetail {
  const command = parseParams(AddCommentParamsSchema, params, "Invalid add comment params.");
  return withServiceTransaction(context, (txContext) => addCommentInTransaction(txContext, command));
}

export function resolveComment(context: RootServiceContext, params: unknown): CommentDetail {
  const command = parseParams(ResolveCommentParamsSchema, params, "Invalid resolve comment params.");
  return withServiceTransaction(context, (txContext) => resolveCommentInTransaction(txContext, command));
}

export function reopenComment(context: RootServiceContext, params: unknown): CommentDetail {
  const command = parseParams(ReopenCommentParamsSchema, params, "Invalid reopen comment params.");
  return withServiceTransaction(context, (txContext) => reopenCommentInTransaction(txContext, command));
}

export function supersedeComment(): never {
  throw unsupportedOperation("Superseding comments is not supported by this milestone.");
}

function addCommentInTransaction(
  context: ServiceContext,
  command: z.infer<typeof AddCommentParamsSchema>,
): CommentDetail {
  validateScopeAndAnchor(context, command.scope, command.anchor);

  const now = context.now();
  const row = addCommentRow(context.db, {
    ...scopeColumns(command.scope),
    ...anchorColumns(command.anchor),
    body: command.body,
    status: "open",
    authorActorType: command.author.type,
    authorActorId: command.author.id,
    authorDisplayName: command.author.displayName,
    createdAt: now,
    updatedAt: now,
  });

  refreshAffectedStatus(context, row);
  return toCommentDetail(row);
}

function resolveCommentInTransaction(
  context: ServiceContext,
  command: z.infer<typeof ResolveCommentParamsSchema>,
): CommentDetail {
  const existing = findRequiredComment(context, command.commentId);
  assertStoredCommentInvariant(context, existing);

  const now = context.now();
  const updated = updateCommentLifecycleFields(context.db, existing.id, {
    status: command.status,
    resolvedByActorType: command.actor.type,
    resolvedByActorId: command.actor.id ?? null,
    resolvedByDisplayName: command.actor.displayName ?? null,
    resolvedAt: now,
    updatedAt: now,
  });
  if (updated === undefined) {
    throw notFound("comment", command.commentId);
  }

  refreshAffectedStatus(context, updated);
  return toCommentDetail(updated);
}

function reopenCommentInTransaction(
  context: ServiceContext,
  command: z.infer<typeof ReopenCommentParamsSchema>,
): CommentDetail {
  const existing = findRequiredComment(context, command.commentId);
  assertStoredCommentInvariant(context, existing);

  const updated = updateCommentLifecycleFields(context.db, existing.id, {
    status: "open",
    resolvedByActorType: null,
    resolvedByActorId: null,
    resolvedByDisplayName: null,
    resolvedAt: null,
    updatedAt: context.now(),
  });
  if (updated === undefined) {
    throw notFound("comment", command.commentId);
  }

  refreshAffectedStatus(context, updated);
  return toCommentDetail(updated);
}

function validateScopeAndAnchor(context: ServiceContext, scope: ReviewEntityScope, anchor: SourceAnchor): void {
  if (scope.type === "version") {
    if (findVersionById(context.db, scope.versionId) === undefined) {
      throw notFound("version", scope.versionId);
    }
  } else if (scope.type === "commit") {
    if (findCommitById(context.db, scope.commitId) === undefined) {
      throw notFound("commit", scope.commitId);
    }
  } else if (scope.type === "commit_file") {
    if (findCommitFileById(context.db, scope.commitFileId) === undefined) {
      throw notFound("commit_file", scope.commitFileId);
    }
  } else {
    const block = findDiffBlockById(context.db, scope.diffBlockId);
    if (block === undefined) {
      throw notFound("diff_block", scope.diffBlockId);
    }
  }

  if (anchor.kind === "scope") {
    return;
  }

  if (anchor.kind === "block") {
    const anchorBlock = findDiffBlockById(context.db, anchor.diffBlockId);
    if (anchorBlock === undefined) {
      throw notFound("diff_block", anchor.diffBlockId);
    }
    if (scope.type !== "diff_block" || scope.diffBlockId !== anchor.diffBlockId) {
      throw validationFailed("Block anchor must target the same diff block as its scope.", { scope, anchor });
    }
    return;
  }

  const anchorFile = findCommitFileById(context.db, anchor.commitFileId);
  if (anchorFile === undefined) {
    throw notFound("commit_file", anchor.commitFileId);
  }
  if (scope.type !== "commit_file" || scope.commitFileId !== anchor.commitFileId) {
    throw validationFailed("Range anchor must target the same commit file as its scope.", { scope, anchor });
  }
}

function scopeColumns(scope: ReviewEntityScope): Pick<CommentInsert, "scope" | "versionId" | "commitId" | "commitFileId" | "diffBlockId"> {
  if (scope.type === "version") {
    return { scope: "version", versionId: scope.versionId, commitId: null, commitFileId: null, diffBlockId: null };
  }
  if (scope.type === "commit") {
    return { scope: "commit", versionId: null, commitId: scope.commitId, commitFileId: null, diffBlockId: null };
  }
  if (scope.type === "commit_file") {
    return { scope: "commit_file", versionId: null, commitId: null, commitFileId: scope.commitFileId, diffBlockId: null };
  }
  return { scope: "diff_block", versionId: null, commitId: null, commitFileId: null, diffBlockId: scope.diffBlockId };
}

function anchorColumns(
  anchor: SourceAnchor,
): Pick<
  CommentInsert,
  | "anchorKind"
  | "anchorDiffBlockId"
  | "anchorCommitFileId"
  | "anchorSide"
  | "startLine"
  | "endLine"
  | "startColumn"
  | "endColumn"
  | "selectedText"
> {
  if (anchor.kind === "scope") {
    return {
      anchorKind: "scope",
      anchorDiffBlockId: null,
      anchorCommitFileId: null,
      anchorSide: null,
      startLine: null,
      endLine: null,
      startColumn: null,
      endColumn: null,
      selectedText: null,
    };
  }
  if (anchor.kind === "block") {
    return {
      anchorKind: "block",
      anchorDiffBlockId: anchor.diffBlockId,
      anchorCommitFileId: null,
      anchorSide: null,
      startLine: null,
      endLine: null,
      startColumn: null,
      endColumn: null,
      selectedText: null,
    };
  }
  return {
    anchorKind: "range",
    anchorDiffBlockId: null,
    anchorCommitFileId: anchor.commitFileId,
    anchorSide: anchor.side,
    startLine: anchor.startLine,
    endLine: anchor.endLine,
    startColumn: anchor.startColumn ?? null,
    endColumn: anchor.endColumn ?? null,
    selectedText: anchor.selectedText ?? null,
  };
}

function refreshAffectedStatus(context: ServiceContext, row: CommentRow): void {
  const scope = commentScope(row);
  if (scope.type === "version") {
    recomputeVersionStatus(context, scope.versionId);
  } else if (scope.type === "commit") {
    recomputeCommitStatus(context, scope.commitId);
  } else if (scope.type === "commit_file") {
    recomputeFileStatus(context, scope.commitFileId);
  } else {
    const block = findDiffBlockById(context.db, scope.diffBlockId);
    if (block === undefined) {
      throw notFound("diff_block", scope.diffBlockId);
    }
    recomputeFileStatus(context, block.commitFileId);
  }
}

function findRequiredComment(context: ServiceContext, commentId: string): CommentRow {
  const comment = findCommentById(context.db, commentId);
  if (comment === undefined) {
    throw notFound("comment", commentId);
  }
  return comment;
}

function assertStoredCommentInvariant(context: ServiceContext, row: CommentRow): void {
  const scope = commentScope(row);
  const anchor = commentAnchor(row);
  validateScopeAndAnchor(context, scope, anchor);
}

function toCommentDetail(row: CommentRow): CommentDetail {
  return CommentDetailSchema.parse({
    id: row.id,
    scope: commentScope(row),
    status: row.status,
    body: row.body,
    author: actorRef(row.authorActorType, row.authorActorId, row.authorDisplayName),
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt ?? undefined,
    anchor: commentAnchor(row),
    updatedAt: row.updatedAt ?? undefined,
    resolvedBy:
      row.resolvedByActorType === null
        ? undefined
        : actorRef(row.resolvedByActorType, row.resolvedByActorId, row.resolvedByDisplayName),
  });
}

function commentScope(row: CommentRow): ReviewEntityScope {
  const parentIds = [
    row.versionId === null ? undefined : "versionId",
    row.commitId === null ? undefined : "commitId",
    row.commitFileId === null ? undefined : "commitFileId",
    row.diffBlockId === null ? undefined : "diffBlockId",
  ].filter((value) => value !== undefined);
  if (parentIds.length !== 1) {
    throw invariantFailed("Comment must have exactly one scope parent id.", { commentId: row.id, parentIds });
  }

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
  throw invariantFailed("Comment scope parent id does not match its scope.", { commentId: row.id, scope: row.scope });
}

function commentAnchor(row: CommentRow): SourceAnchor {
  if (row.anchorKind === "scope") {
    assertEmptyAnchorFields(row, [
      "anchorDiffBlockId",
      "anchorCommitFileId",
      "anchorSide",
      "startLine",
      "endLine",
      "startColumn",
      "endColumn",
      "selectedText",
    ]);
    return { kind: "scope" };
  }
  if (row.anchorKind === "block") {
    if (row.anchorDiffBlockId === null) {
      throw invariantFailed("Block comment anchor must have a diff block id.", { commentId: row.id });
    }
    assertEmptyAnchorFields(row, [
      "anchorCommitFileId",
      "anchorSide",
      "startLine",
      "endLine",
      "startColumn",
      "endColumn",
      "selectedText",
    ]);
    return { kind: "block", diffBlockId: row.anchorDiffBlockId };
  }

  if (row.anchorCommitFileId === null || row.anchorSide === null || row.startLine === null || row.endLine === null) {
    throw invariantFailed("Range comment anchor must have file, side, start line, and end line.", { commentId: row.id });
  }
  assertEmptyAnchorFields(row, ["anchorDiffBlockId"]);
  return {
    kind: "range",
    commitFileId: row.anchorCommitFileId,
    side: row.anchorSide,
    startLine: row.startLine,
    endLine: row.endLine,
    startColumn: row.startColumn ?? undefined,
    endColumn: row.endColumn ?? undefined,
    selectedText: row.selectedText ?? undefined,
  };
}

function assertEmptyAnchorFields(row: CommentRow, fields: Array<keyof CommentRow>): void {
  const populated = fields.filter((field) => row[field] !== null);
  if (populated.length > 0) {
    throw invariantFailed("Comment anchor has fields from another anchor kind.", { commentId: row.id, populated });
  }
}

function actorRef(type: ActorRef["type"], id: string | null, displayName: string | null): ActorRef {
  return {
    type,
    id: id ?? undefined,
    displayName: displayName ?? undefined,
  };
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
