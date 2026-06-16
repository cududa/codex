import { and, asc, count, eq, gt, inArray, isNull, or } from "drizzle-orm";
import type { ReviewStatus } from "../domain/enums.js";
import { paginatedResult, type PaginatedResult } from "../domain/schemas/index.js";
import { commitFiles, commits, decisions, taggings } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
  type CursorLimit,
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

export function countCommitFilesByCommitIds(db: RepositoryDatabase, commitIds: readonly string[]): Map<string, number> {
  const counts = new Map(commitIds.map((commitId) => [commitId, 0]));
  if (commitIds.length === 0) {
    return counts;
  }

  for (const row of db
    .select({ commitId: commitFiles.commitId, fileCount: count() })
    .from(commitFiles)
    .where(inArray(commitFiles.commitId, commitIds))
    .groupBy(commitFiles.commitId)
    .all()) {
    counts.set(row.commitId, row.fileCount);
  }
  return counts;
}

export function countRemainingCommitFilesByCommit(
  db: RepositoryDatabase,
  commitId: string,
  options: { statuses?: readonly ReviewStatus[] } = {},
): number {
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return 0;
  }
  return db
    .select({ value: count() })
    .from(commitFiles)
    .where(and(eq(commitFiles.commitId, commitId), inArray(commitFiles.reviewStatus, statuses)))
    .get()?.value ?? 0;
}

export function countRemainingCommitFilesByVersion(
  db: RepositoryDatabase,
  versionId: string,
  options: { statuses?: readonly ReviewStatus[] } = {},
): number {
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return 0;
  }
  return db
    .select({ value: count() })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .where(and(eq(commits.versionId, versionId), inArray(commitFiles.reviewStatus, statuses)))
    .get()?.value ?? 0;
}

export function listUntaggedCommitFilesByVersion(db: RepositoryDatabase, versionId: string): CommitFileRow[] {
  return db
    .select({ file: commitFiles })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .leftJoin(
      taggings,
      and(eq(taggings.targetType, "commit_file"), eq(taggings.targetId, commitFiles.id)),
    )
    .where(and(eq(commits.versionId, versionId), isNull(taggings.id)))
    .orderBy(asc(commits.ordinal), asc(commitFiles.createdAt), asc(commitFiles.id))
    .all()
    .map((row) => row.file);
}

export function listTaggedCommitFilesMissingHumanAcceptedDecisionByVersion(
  db: RepositoryDatabase,
  versionId: string,
): CommitFileRow[] {
  const rows = db
    .select({ file: commitFiles })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .innerJoin(
      taggings,
      and(eq(taggings.targetType, "commit_file"), eq(taggings.targetId, commitFiles.id)),
    )
    .leftJoin(
      decisions,
      and(
        eq(decisions.scope, "commit_file"),
        eq(decisions.commitFileId, commitFiles.id),
        eq(decisions.status, "accepted"),
        eq(decisions.finalizedByActorType, "human"),
      ),
    )
    .where(and(eq(commits.versionId, versionId), isNull(decisions.id)))
    .orderBy(asc(commits.ordinal), asc(commitFiles.createdAt), asc(commitFiles.id))
    .all();

  return uniqueFiles(rows.map((row) => row.file));
}

export function listRemainingCommitFilesByCommit(
  db: RepositoryDatabase,
  commitId: string,
  options: CommitFileQueueOptions = {},
): PaginatedResult<CommitFileRow> {
  const cursor = decodeCursor<CommitFileQueueCursor>(options.cursor);
  const limit = normalizeLimit(options.limit);
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return paginatedResult([], null, 0);
  }
  const totalCount = countRemainingCommitFilesByCommit(db, commitId, { statuses });

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

  return pageFromCommitFileRows(rows, limit, totalCount);
}

export function listRemainingCommitFilesByVersion(
  db: RepositoryDatabase,
  versionId: string,
  options: CommitFileQueueOptions = {},
): PaginatedResult<CommitFileRow> {
  const cursor = decodeCursor<CommitFileVersionQueueCursor>(options.cursor);
  const limit = normalizeLimit(options.limit);
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return paginatedResult([], null, 0);
  }
  const totalCount = countRemainingCommitFilesByVersion(db, versionId, { statuses });

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

  return pageFromCommitFileVersionRows(rows, limit, totalCount);
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

export type CommitFileStatusOverrideUpdate = Pick<
  CommitFileRow,
  | "statusOverride"
  | "statusOverrideReason"
  | "statusOverrideActorType"
  | "statusOverrideActorId"
  | "statusOverrideDisplayName"
  | "statusOverrideAt"
> & {
  updatedAt?: number | null;
};

export function updateCommitFileStatusOverride(
  db: RepositoryDatabase,
  id: string,
  values: CommitFileStatusOverrideUpdate,
): CommitFileRow | undefined {
  return db
    .update(commitFiles)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(commitFiles.id, id))
    .returning()
    .get();
}

function pageFromCommitFileRows(
  rows: CommitFileRow[],
  limit: number,
  totalCount: number,
): PaginatedResult<CommitFileRow> {
  const data = rows.slice(0, limit);
  const last = data.at(-1);
  const nextCursor =
    rows.length > limit && last !== undefined ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
  return paginatedResult(data, nextCursor, totalCount);
}

function uniqueFiles(rows: CommitFileRow[]): CommitFileRow[] {
  const unique = new Map<string, CommitFileRow>();
  for (const row of rows) {
    unique.set(row.id, row);
  }
  return [...unique.values()];
}

function pageFromCommitFileVersionRows(
  rows: { file: CommitFileRow; ordinal: number }[],
  limit: number,
  totalCount: number,
): PaginatedResult<CommitFileRow> {
  const data = rows.slice(0, limit);
  const last = data.at(-1);
  const nextCursor =
    rows.length > limit && last !== undefined
      ? encodeCursor({ ordinal: last.ordinal, createdAt: last.file.createdAt, id: last.file.id })
      : null;
  return paginatedResult(
    data.map((row) => row.file),
    nextCursor,
    totalCount,
  );
}
