import type {
  ConcernAreaSlug,
  DetectorRunState,
  DiffSide,
  ReviewMark,
  ReviewScopeType,
} from "@prompt-reviews/contracts";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";

export const detectorRuns = sqliteTable(
  "detector_runs",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => reviewVersions.id, { onDelete: "cascade" }),
    concernMapVersion: integer("concern_map_version").notNull(),
    state: text("state").$type<DetectorRunState>().notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    failureMessage: text("failure_message"),
  },
  (table) => [index("detector_runs_version_idx").on(table.versionId)],
);

export const detectorEvidence = sqliteTable(
  "detector_evidence",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => detectorRuns.id, { onDelete: "cascade" }),
    scopeType: text("scope_type").$type<ReviewScopeType>().notNull(),
    versionId: text("version_id").references(() => reviewVersions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    suggestedReviewMark: text("suggested_review_mark").$type<ReviewMark>(),
    title: text("title").notNull(),
    summary: text("summary"),
    detailKind: text("detail_kind")
      .$type<"path" | "symbol" | "marker" | "templateMarker" | "diff" | "graph">()
      .notNull(),
    detailPath: text("detail_path"),
    detailSymbolName: text("detail_symbol_name"),
    detailMarker: text("detail_marker"),
    detailDiffBlockId: text("detail_diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    detailSide: text("detail_side").$type<DiffSide>(),
    detailStartLine: integer("detail_start_line"),
    detailEndLine: integer("detail_end_line"),
    detailGraphNodeId: text("detail_graph_node_id"),
    detailGraphNodeLabel: text("detail_graph_node_label"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("detector_evidence_run_idx").on(table.runId),
    index("detector_evidence_commit_idx").on(table.commitId),
    index("detector_evidence_file_idx").on(table.fileId),
    index("detector_evidence_diff_block_idx").on(table.diffBlockId),
  ],
);
