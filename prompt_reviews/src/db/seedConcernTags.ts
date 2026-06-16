import { eq } from "drizzle-orm";
import { concernTagSeeds } from "../domain/taxonomy.js";
import type { PromptReviewsDatabase } from "./client.js";
import { concernTags } from "./schema.js";
import { unixSecondsNow } from "./timestamps.js";

export function seedConcernTags(db: PromptReviewsDatabase): void {
  const now = unixSecondsNow();

  db.transaction((tx) => {
    for (const seed of concernTagSeeds) {
      const existing = tx.select().from(concernTags).where(eq(concernTags.slug, seed.slug)).get();
      const parentId =
        seed.parentSlug === null
          ? null
          : tx.select({ id: concernTags.id }).from(concernTags).where(eq(concernTags.slug, seed.parentSlug)).get()
              ?.id;

      if (seed.parentSlug !== null && parentId === undefined) {
        throw new Error(`Missing parent concern tag seed: ${seed.parentSlug}`);
      }

      if (existing === undefined) {
        tx.insert(concernTags)
          .values({
            slug: seed.slug,
            label: seed.label,
            parentId,
            description: seed.description,
            examplesJson: JSON.stringify(seed.examples),
            pitfallsJson: JSON.stringify(seed.pitfalls),
            sortOrder: seed.sortOrder,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          })
          .run();
        continue;
      }

      // Seed refresh owns stable taxonomy metadata only. Local edits to narrative fields
      // stay intact so reviewers can tune descriptions, examples, and pitfalls in their DB.
      tx.update(concernTags)
        .set({
          label: seed.label,
          parentId,
          sortOrder: seed.sortOrder,
          isActive: true,
          updatedAt: now,
        })
        .where(eq(concernTags.id, existing.id))
        .run();
    }
  });
}
