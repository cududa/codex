import { and, asc, count, eq, gt, inArray, or } from "drizzle-orm";
import type { ReviewStatus } from "../domain/enums.js";
import { paginatedResult, type PaginatedResult } from "../domain/schemas/index.js";
import { commits } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
  type CursorLimit,
  type RepositoryDatabase,
} from "./database.js";

export type CommitRow = typeof commits.$inferSelect;
export type CommitInsert = typeof commits.$inferInsert;

const defaultRemainingStatuses = [
  "unreviewed",
  "needs_classification",
  "reviewing",
  "needs_decision",
  "patch_required",
  "blocked",
] as const satisfies readonly ReviewStatus[];

type CommitQueueCursor = {
  ordinal: number;
  id: string;
};

export type CommitQueueOptions = CursorLimit & {
  statuses?: readonly ReviewStatus[];
};

export function bulkInsertCommits(db: RepositoryDatabase, values: readonly CommitInsert[]): CommitRow[] {
  if (values.length === 0) {
    return [];
  }
  return db.insert(commits).values([...values]).returning().all();
}

export function listCommitsByVersion(db: RepositoryDatabase, versionId: string): CommitRow[] {
  return db.select().from(commits).where(eq(commits.versionId, versionId)).orderBy(asc(commits.ordinal)).all();
}

export function findCommitById(db: RepositoryDatabase, id: string): CommitRow | undefined {
  return db.select().from(commits).where(eq(commits.id, id)).get();
}

export function listRemainingCommitsByVersion(
  db: RepositoryDatabase,
  versionId: string,
  options: CommitQueueOptions = {},
): PaginatedResult<CommitRow> {
  const cursor = decodeCursor<CommitQueueCursor>(options.cursor);
  const limit = normalizeLimit(options.limit);
  const statuses = options.statuses ?? defaultRemainingStatuses;
  if (statuses.length === 0) {
    return paginatedResult([], null, 0);
  }
  const totalCount = countRemainingCommitsByVersion(db, versionId, { statuses });

  const rows = db
    .select()
    .from(commits)
    .where(
      and(
        eq(commits.versionId, versionId),
        inArray(commits.reviewStatus, statuses),
        cursor === null
          ? undefined
          : or(gt(commits.ordinal, cursor.ordinal), and(eq(commits.ordinal, cursor.ordinal), gt(commits.id, cursor.id))),
      ),
    )
    .orderBy(asc(commits.ordinal), asc(commits.id))
    .limit(limit + 1)
    .all();

  return pageFromCommitRows(rows, limit, totalCount);
}

export function countRemainingCommitsByVersion(
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
    .from(commits)
    .where(and(eq(commits.versionId, versionId), inArray(commits.reviewStatus, statuses)))
    .get()?.value ?? 0;
}

export type CommitReviewUpdate = {
  reviewStatus: ReviewStatus;
  updatedAt?: number | null;
};

export function updateCommitReviewFields(
  db: RepositoryDatabase,
  id: string,
  values: CommitReviewUpdate,
): CommitRow | undefined {
  return db
    .update(commits)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(commits.id, id))
    .returning()
    .get();
}

export type CommitStatusOverrideUpdate = Pick<
  CommitRow,
  | "statusOverride"
  | "statusOverrideReason"
  | "statusOverrideActorType"
  | "statusOverrideActorId"
  | "statusOverrideDisplayName"
  | "statusOverrideAt"
> & {
  updatedAt?: number | null;
};

export function updateCommitStatusOverride(
  db: RepositoryDatabase,
  id: string,
  values: CommitStatusOverrideUpdate,
): CommitRow | undefined {
  return db
    .update(commits)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(commits.id, id))
    .returning()
    .get();
}

function pageFromCommitRows(rows: CommitRow[], limit: number, totalCount: number): PaginatedResult<CommitRow> {
  const data = rows.slice(0, limit);
  const last = data.at(-1);
  const nextCursor =
    rows.length > limit && last !== undefined ? encodeCursor({ ordinal: last.ordinal, id: last.id }) : null;
  return paginatedResult(data, nextCursor, totalCount);
}
