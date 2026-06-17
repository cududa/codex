import type { ConcernAreaSlug } from "@prompt-reviews/contracts";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { reviewCommits, reviewVersions } from "./core.js";
import { localChangeRefs } from "./review-state.js";

export const versionFinalizations = sqliteTable(
  "version_finalizations",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => reviewVersions.id, { onDelete: "cascade" }),
    finalizedById: text("finalized_by_id").notNull(),
    finalizedByDisplayName: text("finalized_by_display_name"),
    finalizedAt: text("finalized_at").notNull(),
    summary: text("summary"),
  },
  (table) => [uniqueIndex("version_finalizations_version_unique").on(table.versionId)],
);

export const reviewLedgerEntries = sqliteTable(
  "review_ledger_entries",
  {
    id: text("id").primaryKey(),
    finalizationId: text("finalization_id")
      .notNull()
      .references(() => versionFinalizations.id, { onDelete: "cascade" }),
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    upstreamSha: text("upstream_sha").notNull(),
    finalMark: text("final_mark").$type<"PASS" | "DONE">().notNull(),
    approvedById: text("approved_by_id").notNull(),
    approvedByDisplayName: text("approved_by_display_name"),
    approvedAt: text("approved_at").notNull(),
  },
  (table) => [
    index("review_ledger_entries_finalization_idx").on(table.finalizationId),
    uniqueIndex("review_ledger_entries_commit_unique").on(table.finalizationId, table.commitId),
  ],
);

export const reviewLedgerEntryConcernAreas = sqliteTable(
  "review_ledger_entry_concern_areas",
  {
    ledgerEntryId: text("ledger_entry_id")
      .notNull()
      .references(() => reviewLedgerEntries.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ledgerEntryId, table.concernAreaSlug] }),
    uniqueIndex("review_ledger_entry_concern_areas_position_unique").on(table.ledgerEntryId, table.position),
  ],
);

export const reviewLedgerEntryLocalChangeRefs = sqliteTable(
  "review_ledger_entry_local_change_refs",
  {
    ledgerEntryId: text("ledger_entry_id")
      .notNull()
      .references(() => reviewLedgerEntries.id, { onDelete: "cascade" }),
    localChangeRefId: text("local_change_ref_id")
      .notNull()
      .references(() => localChangeRefs.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.ledgerEntryId, table.localChangeRefId] })],
);
