import { and, eq, inArray } from "drizzle-orm";
import type { CommentStatus, ReviewEntityScopeType } from "../domain/enums.js";
import { comments } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import type { RepositoryDatabase } from "./database.js";

export type CommentRow = typeof comments.$inferSelect;
export type CommentInsert = typeof comments.$inferInsert;

export type CommentScopeFilter = {
  scope: ReviewEntityScopeType;
  status?: CommentStatus | readonly CommentStatus[];
  targetId?: string;
};

export function addComment(db: RepositoryDatabase, values: CommentInsert): CommentRow {
  return db.insert(comments).values(values).returning().get();
}

export function listCommentsByScopeStatus(db: RepositoryDatabase, filter: CommentScopeFilter): CommentRow[] {
  const statusFilter =
    filter.status === undefined
      ? undefined
      : isCommentStatusList(filter.status)
        ? inArray(comments.status, filter.status)
        : eq(comments.status, filter.status);

  return db
    .select()
    .from(comments)
    .where(and(eq(comments.scope, filter.scope), statusFilter, commentTargetCondition(filter.scope, filter.targetId)))
    .all();
}

export type CommentLifecycleUpdate = {
  status?: CommentStatus;
  resolution?: string | null;
  resolvedByActorType?: CommentRow["resolvedByActorType"];
  resolvedByActorId?: string | null;
  resolvedByDisplayName?: string | null;
  updatedAt?: number | null;
  resolvedAt?: number | null;
};

export function updateCommentLifecycleFields(
  db: RepositoryDatabase,
  id: string,
  values: CommentLifecycleUpdate,
): CommentRow | undefined {
  return db
    .update(comments)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(comments.id, id))
    .returning()
    .get();
}

function commentTargetCondition(scope: ReviewEntityScopeType, targetId: string | undefined) {
  if (targetId === undefined) {
    return undefined;
  }
  if (scope === "version") {
    return eq(comments.versionId, targetId);
  }
  if (scope === "commit") {
    return eq(comments.commitId, targetId);
  }
  if (scope === "commit_file") {
    return eq(comments.commitFileId, targetId);
  }
  return eq(comments.diffBlockId, targetId);
}

function isCommentStatusList(status: CommentStatus | readonly CommentStatus[]): status is readonly CommentStatus[] {
  return Array.isArray(status);
}
