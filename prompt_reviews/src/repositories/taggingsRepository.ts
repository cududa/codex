import { and, eq } from "drizzle-orm";
import type { ReviewEntityScopeType } from "../domain/enums.js";
import { taggings } from "../db/schema.js";
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
        rationale: values.rationale ?? null,
        createdByActorType: values.createdByActorType,
        createdByActorId: values.createdByActorId ?? null,
        createdByDisplayName: values.createdByDisplayName ?? null,
      },
    })
    .returning()
    .get();
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

export function listTaggingsByTarget(db: RepositoryDatabase, target: TaggingTarget): TaggingRow[] {
  return db
    .select()
    .from(taggings)
    .where(and(eq(taggings.targetType, target.targetType), eq(taggings.targetId, target.targetId)))
    .all();
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
