import { and, desc, eq } from "drizzle-orm";
import type { VersionStatus } from "../domain/enums.js";
import { unixSecondsNow } from "../db/timestamps.js";
import { versions } from "../db/schema.js";
import type { RepositoryDatabase } from "./database.js";

export type VersionRow = typeof versions.$inferSelect;
export type VersionInsert = typeof versions.$inferInsert;

export function createVersion(db: RepositoryDatabase, values: VersionInsert): VersionRow {
  return db.insert(versions).values(values).returning().get();
}

export function findVersionById(db: RepositoryDatabase, id: string): VersionRow | undefined {
  return db.select().from(versions).where(eq(versions.id, id)).get();
}

export function findVersionByRange(
  db: RepositoryDatabase,
  range: Pick<VersionRow, "baseSha" | "targetSha">,
): VersionRow | undefined {
  return db
    .select()
    .from(versions)
    .where(and(eq(versions.baseSha, range.baseSha), eq(versions.targetSha, range.targetSha)))
    .get();
}

export function listVersions(
  db: RepositoryDatabase,
  filter: { repositoryId?: string; status?: VersionStatus } = {},
): VersionRow[] {
  return db
    .select()
    .from(versions)
    .where(
      and(
        filter.repositoryId === undefined ? undefined : eq(versions.repositoryId, filter.repositoryId),
        filter.status === undefined ? undefined : eq(versions.status, filter.status),
      ),
    )
    .orderBy(desc(versions.createdAt), desc(versions.id))
    .all();
}

export function listVersionsByStatus(db: RepositoryDatabase, status: VersionStatus): VersionRow[] {
  return db.select().from(versions).where(eq(versions.status, status)).orderBy(desc(versions.createdAt)).all();
}

export type VersionStatusUpdate = {
  status: VersionStatus;
  updatedAt?: number | null;
  closedAt?: number | null;
  closedByActorType?: VersionRow["closedByActorType"];
  closedByActorId?: string | null;
  closedByDisplayName?: string | null;
  closureSummary?: string | null;
};

export function updateVersionStatus(
  db: RepositoryDatabase,
  id: string,
  values: VersionStatusUpdate,
): VersionRow | undefined {
  return db
    .update(versions)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(versions.id, id))
    .returning()
    .get();
}

export function findLastClosedTarget(
  db: RepositoryDatabase,
  params: { repositoryId: string; targetSha?: string },
): VersionRow | undefined {
  const filters = [eq(versions.repositoryId, params.repositoryId), eq(versions.status, "closed" as const)];
  if (params.targetSha !== undefined) {
    filters.push(eq(versions.targetSha, params.targetSha));
  }

  return db.select().from(versions).where(and(...filters)).orderBy(desc(versions.closedAt), desc(versions.createdAt)).get();
}
