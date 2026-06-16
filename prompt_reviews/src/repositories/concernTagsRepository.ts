import { asc, eq } from "drizzle-orm";
import { seedConcernTags } from "../db/seedConcernTags.js";
import { concernTags } from "../db/schema.js";
import type { RepositoryDatabase } from "./database.js";

export type ConcernTagRow = typeof concernTags.$inferSelect;
export type ConcernTagTreeNode = ConcernTagRow & {
  children: ConcernTagTreeNode[];
};

export function seedConcernTagsRepository(db: RepositoryDatabase): void {
  seedConcernTags(db);
}

export function findConcernTagById(db: RepositoryDatabase, id: string): ConcernTagRow | undefined {
  return db.select().from(concernTags).where(eq(concernTags.id, id)).get();
}

export function findConcernTagBySlug(db: RepositoryDatabase, slug: string): ConcernTagRow | undefined {
  return db.select().from(concernTags).where(eq(concernTags.slug, slug)).get();
}

export function listConcernTagTree(db: RepositoryDatabase, options: { includeInactive?: boolean } = {}): ConcernTagTreeNode[] {
  const rows =
    options.includeInactive === true
      ? db.select().from(concernTags).orderBy(asc(concernTags.sortOrder), asc(concernTags.slug)).all()
      : db
          .select()
          .from(concernTags)
          .where(eq(concernTags.isActive, true))
          .orderBy(asc(concernTags.sortOrder), asc(concernTags.slug))
          .all();

  const nodes = new Map<string, ConcernTagTreeNode>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  const roots: ConcernTagTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(node.parentId);
    if (parent === undefined) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  return roots;
}
