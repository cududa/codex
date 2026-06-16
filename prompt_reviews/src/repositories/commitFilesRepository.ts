import { and, asc, eq, gt, inArray, or } from "drizzle-orm";
import type { ReviewStatus } from "../domain/enums.js";
import { commitFiles, commits } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
  type CursorLimit,
  type Page,
  type RepositoryDatabase,
} from "./database.js";

export type CommitFileRow = typeof commitFiles.$inferSelect;
export type CommitFileInsert = typeof commitFiles.$inferInsert;

const defaultRemainingStatuses = [
  "unreviewed",
  "needs_classification",
  "reviewing",
  "needs_decision",
  "patch_required",
  "blocked",
] as const satisfies readonly ReviewStatus[];

type CommitFileQueueCursor = {
  createdAt: number;
  id: string;
};

type CommitFileVersionQueueCursor = {
  ordinal: number;
  createdAt: number;
  id: string;
};

export type CommitFileQueueOptions = CursorLimit & {
  statuses?: readonly ReviewStatus[];
};

export function bulkInsertCommitFiles(db: RepositoryDatabase, values: readonly CommitFileInsert[]): CommitFileRow[] {
  if (values.length === 0) {
    return [];
  }
  return db.insert(commitFiles).values([...values]).returning().all();
}

export function listCommitFilesByCommit(db: RepositoryDatabase, commitId: string): CommitFileRow[] {
  return db
    .select()
    .from(commitFiles)
    .where(eq(commitFiles.commitId, commitId))
    .orderBy(asc(commitFiles.createdAt), asc(commitFiles.id))
    .all();
}

export function findCommitFileById(db: RepositoryDatabase, id: string): CommitFileRow | undefined {
  return db.select().from(commitFiles).where(eq(commitFiles.id, id)).get();
}

export function listCommitFilesByVersion(db: RepositoryDatabase, versionId: string): CommitFileRow[] {
  return db
    .select({ file: commitFiles })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .where(eq(commits.versionId, versionId))
    .orderBy(asc(commits.ordinal), asc(commitFiles.createdAt), asc(commitFiles.id))
    .all()
    .map((row) => row.file);
}

export function listRemainingCommitFilesByCommit(
  db: RepositoryDatabase,
  commitId: string,
  options: CommitFileQueueOptions = {},
): Page<CommitFileRow> {
  const cursor = decodeCursor<CommitFileQueueCursor>(options.cursor);
  const limit = normalizeLimit(options.limit);
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return { items: [], nextCursor: null };
  }

  const rows = db
    .select()
    .from(commitFiles)
    .where(
      and(
        eq(commitFiles.commitId, commitId),
        inArray(commitFiles.reviewStatus, statuses),
        cursor === null
          ? undefined
          : or(
              gt(commitFiles.createdAt, cursor.createdAt),
              and(eq(commitFiles.createdAt, cursor.createdAt), gt(commitFiles.id, cursor.id)),
            ),
      ),
    )
    .orderBy(asc(commitFiles.createdAt), asc(commitFiles.id))
    .limit(limit + 1)
    .all();

  return pageFromCommitFileRows(rows, limit);
}

export function listRemainingCommitFilesByVersion(
  db: RepositoryDatabase,
  versionId: string,
  options: CommitFileQueueOptions = {},
): Page<CommitFileRow> {
  const cursor = decodeCursor<CommitFileVersionQueueCursor>(options.cursor);
  const limit = normalizeLimit(options.limit);
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return { items: [], nextCursor: null };
  }

  const rows = db
    .select({ file: commitFiles, ordinal: commits.ordinal })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .where(
      and(
        eq(commits.versionId, versionId),
        inArray(commitFiles.reviewStatus, statuses),
        cursor === null
          ? undefined
          : or(
              gt(commits.ordinal, cursor.ordinal),
              and(
                eq(commits.ordinal, cursor.ordinal),
                or(
                  gt(commitFiles.createdAt, cursor.createdAt),
                  and(eq(commitFiles.createdAt, cursor.createdAt), gt(commitFiles.id, cursor.id)),
                ),
              ),
            ),
      ),
    )
    .orderBy(asc(commits.ordinal), asc(commitFiles.createdAt), asc(commitFiles.id))
    .limit(limit + 1)
    .all();

  return pageFromCommitFileVersionRows(rows, limit);
}

export type CommitFileReviewUpdate = {
  reviewStatus: ReviewStatus;
  updatedAt?: number | null;
};

export function updateCommitFileReviewFields(
  db: RepositoryDatabase,
  id: string,
  values: CommitFileReviewUpdate,
): CommitFileRow | undefined {
  return db
    .update(commitFiles)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(commitFiles.id, id))
    .returning()
    .get();
}

function pageFromCommitFileRows(rows: CommitFileRow[], limit: number): Page<CommitFileRow> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > limit && last !== undefined ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
  };
}

function pageFromCommitFileVersionRows(
  rows: { file: CommitFileRow; ordinal: number }[],
  limit: number,
): Page<CommitFileRow> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items: items.map((row) => row.file),
    nextCursor:
      rows.length > limit && last !== undefined
        ? encodeCursor({ ordinal: last.ordinal, createdAt: last.file.createdAt, id: last.file.id })
        : null,
  };
}
