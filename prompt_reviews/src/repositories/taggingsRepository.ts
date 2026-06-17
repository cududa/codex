import { and, eq, inArray } from "drizzle-orm";
import type { ReviewEntityScopeType } from "../domain/enums.js";
import { concernTags, taggings } from "../db/schema.js";
import type { RepositoryDatabase } from "./database.js";

export type TaggingRow = typeof taggings.$inferSelect;
export type TaggingInsert = typeof taggings.$inferInsert;

export type TaggingTarget = {
  targetType: ReviewEntityScopeType;
  targetId: string;
};

export function addTagging(db: RepositoryDatabase, values: TaggingInsert): TaggingRow {
  return db
    .insert(taggings)
    .values(values)
    .onConflictDoUpdate({
      target: [taggings.tagId, taggings.targetType, taggings.targetId],
      set: {
        kind: values.kind,
        createdByActorType: values.createdByActorType,
        createdByActorId: values.createdByActorId ?? null,
        createdByDisplayName: values.createdByDisplayName ?? null,
      },
    })
    .returning()
    .get();
}

export function findTaggingById(db: RepositoryDatabase, id: string): TaggingRow | undefined {
  return db.select().from(taggings).where(eq(taggings.id, id)).get();
}

export function deleteTaggingById(db: RepositoryDatabase, id: string): TaggingRow[] {
  return db.delete(taggings).where(eq(taggings.id, id)).returning().all();
}

export function removeTagging(
  db: RepositoryDatabase,
  values: Pick<TaggingRow, "tagId" | "targetType" | "targetId">,
): TaggingRow[] {
  return db
    .delete(taggings)
    .where(
      and(
        eq(taggings.tagId, values.tagId),
        eq(taggings.targetType, values.targetType),
        eq(taggings.targetId, values.targetId),
      ),
    )
    .returning()
    .all();
}

export function removeTaggingsByTargetKind(db: RepositoryDatabase, target: TaggingTarget, kind: TaggingRow["kind"]): TaggingRow[] {
  return db
    .delete(taggings)
    .where(and(eq(taggings.targetType, target.targetType), eq(taggings.targetId, target.targetId), eq(taggings.kind, kind)))
    .returning()
    .all();
}

export function listTaggingsByTarget(db: RepositoryDatabase, target: TaggingTarget): TaggingRow[] {
  return db
    .select()
    .from(taggings)
    .where(and(eq(taggings.targetType, target.targetType), eq(taggings.targetId, target.targetId)))
    .all();
}

export type TargetTagSlugs = {
  primary: string | undefined;
  secondary: string[];
};

export function listTagSlugsByTargets(
  db: RepositoryDatabase,
  targetType: ReviewEntityScopeType,
  targetIds: readonly string[],
): Map<string, TargetTagSlugs> {
  const slugsByTarget = new Map<string, TargetTagSlugs>(
    targetIds.map((targetId) => [targetId, { primary: undefined, secondary: [] }]),
  );
  if (targetIds.length === 0) {
    return slugsByTarget;
  }

  const rows = db
    .select({
      targetId: taggings.targetId,
      kind: taggings.kind,
      slug: concernTags.slug,
    })
    .from(taggings)
    .innerJoin(concernTags, eq(concernTags.id, taggings.tagId))
    .where(and(eq(taggings.targetType, targetType), inArray(taggings.targetId, targetIds)))
    .all();

  for (const row of rows) {
    const entry = slugsByTarget.get(row.targetId);
    if (entry === undefined) {
      continue;
    }
    if (row.kind === "primary") {
      entry.primary = row.slug;
    } else {
      entry.secondary.push(row.slug);
    }
  }

  return slugsByTarget;
}

export function listPrimaryTaggingsByTarget(db: RepositoryDatabase, target: TaggingTarget): TaggingRow[] {
  return db
    .select()
    .from(taggings)
    .where(
      and(
        eq(taggings.targetType, target.targetType),
        eq(taggings.targetId, target.targetId),
        eq(taggings.kind, "primary"),
      ),
    )
    .all();
}
