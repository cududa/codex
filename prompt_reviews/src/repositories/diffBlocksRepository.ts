import { asc, eq } from "drizzle-orm";
import { diffBlocks } from "../db/schema.js";
import type { RepositoryDatabase } from "./database.js";

export type DiffBlockRow = typeof diffBlocks.$inferSelect;
export type DiffBlockInsert = typeof diffBlocks.$inferInsert;

export function bulkInsertDiffBlocks(db: RepositoryDatabase, values: readonly DiffBlockInsert[]): DiffBlockRow[] {
  if (values.length === 0) {
    return [];
  }
  return db.insert(diffBlocks).values([...values]).returning().all();
}

export function listDiffBlocksByCommitFile(db: RepositoryDatabase, commitFileId: string): DiffBlockRow[] {
  return db
    .select()
    .from(diffBlocks)
    .where(eq(diffBlocks.commitFileId, commitFileId))
    .orderBy(asc(diffBlocks.ordinal))
    .all();
}

export function findDiffBlockById(db: RepositoryDatabase, id: string): DiffBlockRow | undefined {
  return db.select().from(diffBlocks).where(eq(diffBlocks.id, id)).get();
}
