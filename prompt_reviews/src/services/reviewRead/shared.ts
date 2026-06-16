import type { z } from "zod";
import type {
  ActorRef,
  DecisionScope,
  ReviewEntityScope,
  SourceAnchor,
} from "../../domain/schemas/index.js";
import {
  findCommitById,
  findCommitFileById,
  findVersionById,
  type CommentRow,
  type CommitFileRow,
  type CommitRow,
  type DecisionRow,
  type PlanRow,
  type VersionRow,
} from "../../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "../errors.js";
import type { ServiceContext } from "../serviceContext.js";

export function actorRef(type: ActorRef["type"], id: string | null, displayName: string | null): ActorRef {
  return {
    type,
    id: id ?? undefined,
    displayName: displayName ?? undefined,
  };
}

export function findRequiredVersion(context: ServiceContext, versionId: string): VersionRow {
  const version = findVersionById(context.db, versionId);
  if (version === undefined) {
    throw notFound("version", versionId);
  }
  return version;
}

export function findRequiredCommit(context: ServiceContext, commitId: string): CommitRow {
  const commit = findCommitById(context.db, commitId);
  if (commit === undefined) {
    throw notFound("commit", commitId);
  }
  return commit;
}

export function findRequiredCommitFile(context: ServiceContext, commitFileId: string): CommitFileRow {
  const file = findCommitFileById(context.db, commitFileId);
  if (file === undefined) {
    throw notFound("commit_file", commitFileId);
  }
  if (file.oldPath === null && file.newPath === null) {
    throw invariantFailed("Commit file must have at least one path.", { commitFileId });
  }
  return file;
}

export function commentScope(row: CommentRow): ReviewEntityScope {
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

export function commentAnchor(row: CommentRow): SourceAnchor {
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

export function decisionScope(row: DecisionRow): DecisionScope {
  if (row.scope === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.scope === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.scope === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  throw invariantFailed("Decision scope parent id does not match its scope.", { decisionId: row.id, scope: row.scope });
}

export function planScope(row: PlanRow): DecisionScope {
  if (row.scope === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.scope === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.scope === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  throw invariantFailed("Plan scope parent id does not match its scope.", { planId: row.id, scope: row.scope });
}

export function parseStringArray(json: string): string[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw invariantFailed("Concern tag JSON metadata must be an array of strings.");
  }
  return parsed;
}

export function isReviewedStatus(status: CommitRow["reviewStatus"]): boolean {
  return status === "accepted" || status === "accepted_with_watch" || status === "rejected";
}

export function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}

function assertEmptyAnchorFields(row: CommentRow, fields: Array<keyof CommentRow>): void {
  const populated = fields.filter((field) => row[field] !== null);
  if (populated.length > 0) {
    throw invariantFailed("Comment anchor has fields from another anchor kind.", { commentId: row.id, populated });
  }
}
