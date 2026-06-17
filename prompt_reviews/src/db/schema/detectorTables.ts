import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  concernGraphEdgeKinds,
  concernGraphNodeKinds,
  concernGraphSourceKinds,
  detectorFindingEvidenceKinds,
  detectorRunKinds,
  detectorRunStatuses,
  diffSides,
  reviewEntityScopeTypes,
} from "../../domain/enums.js";
import {
  commitFiles,
  commits,
  createdAtColumn,
  diffBlocks,
  idColumn,
  updatedAtColumn,
  versions,
} from "./reviewTables.js";
import { sqliteUnixSecondsNow } from "../timestamps.js";

export const concernGraphNodes = sqliteTable(
  "concern_graph_nodes",
  {
    id: idColumn("cgn"),
    concernSlug: text("concern_slug").notNull(),
    nodeKey: text("node_key").notNull(),
    nodeKind: text("node_kind", { enum: concernGraphNodeKinds }).notNull(),
    path: text("path"),
    symbol: text("symbol"),
    marker: text("marker"),
    displayName: text("display_name"),
    description: text("description"),
    sourceKind: text("source_kind", { enum: concernGraphSourceKinds }).notNull(),
    sourceRef: text("source_ref"),
    isSeed: integer("is_seed", { mode: "boolean" }).notNull().default(false),
    isKnownMissing: integer("is_known_missing", { mode: "boolean" }).notNull().default(false),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("concern_graph_nodes_key_unique").on(table.nodeKey),
    index("concern_graph_nodes_concern_idx").on(table.concernSlug),
    index("concern_graph_nodes_concern_source_idx").on(table.concernSlug, table.sourceKind),
    index("concern_graph_nodes_path_idx").on(table.path),
    check("concern_graph_nodes_metadata_json_check", sql`json_valid(${table.metadataJson})`),
    check(
      "concern_graph_nodes_evidence_check",
      sql`${table.path} is not null or ${table.symbol} is not null or ${table.marker} is not null`,
    ),
  ],
);

export const concernGraphEdges = sqliteTable(
  "concern_graph_edges",
  {
    id: idColumn("cge"),
    concernSlug: text("concern_slug").notNull(),
    edgeKey: text("edge_key").notNull(),
    edgeKind: text("edge_kind", { enum: concernGraphEdgeKinds }).notNull(),
    fromNodeId: text("from_node_id")
      .notNull()
      .references(() => concernGraphNodes.id, { onDelete: "cascade" }),
    toNodeId: text("to_node_id")
      .notNull()
      .references(() => concernGraphNodes.id, { onDelete: "cascade" }),
    sourceKind: text("source_kind", { enum: concernGraphSourceKinds }).notNull(),
    sourceRef: text("source_ref"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("concern_graph_edges_key_unique").on(table.edgeKey),
    uniqueIndex("concern_graph_edges_nodes_kind_unique").on(table.fromNodeId, table.toNodeId, table.edgeKind),
    index("concern_graph_edges_concern_idx").on(table.concernSlug),
    index("concern_graph_edges_concern_source_idx").on(table.concernSlug, table.sourceKind),
    index("concern_graph_edges_from_idx").on(table.fromNodeId),
    index("concern_graph_edges_to_idx").on(table.toNodeId),
    check("concern_graph_edges_metadata_json_check", sql`json_valid(${table.metadataJson})`),
  ],
);

export const detectorRuns = sqliteTable(
  "detector_runs",
  {
    id: idColumn("drun"),
    versionId: text("version_id").references(() => versions.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id").notNull(),
    runKind: text("run_kind", { enum: detectorRunKinds }).notNull(),
    status: text("status", { enum: detectorRunStatuses }).notNull().default(detectorRunStatuses[0]),
    concernMapVersion: integer("concern_map_version", { mode: "number" }).notNull(),
    baseSha: text("base_sha"),
    targetSha: text("target_sha"),
    sourceRef: text("source_ref"),
    startedAt: integer("started_at", { mode: "number" }).notNull().default(sqliteUnixSecondsNow),
    completedAt: integer("completed_at", { mode: "number" }),
    error: text("error"),
    summaryJson: text("summary_json").notNull().default("{}"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("detector_runs_version_idx").on(table.versionId),
    index("detector_runs_repository_created_idx").on(table.repositoryId, table.createdAt, table.id),
    index("detector_runs_status_idx").on(table.status),
    check("detector_runs_summary_json_check", sql`json_valid(${table.summaryJson})`),
    check(
      "detector_runs_completion_check",
      sql`(${table.status} = 'running' and ${table.completedAt} is null and ${table.error} is null) or (${table.status} = 'succeeded' and ${table.completedAt} is not null and ${table.error} is null) or (${table.status} = 'failed' and ${table.completedAt} is not null and length(trim(coalesce(${table.error}, ''))) > 0)`,
    ),
  ],
);

export const detectorFindings = sqliteTable(
  "detector_findings",
  {
    id: idColumn("dfnd"),
    runId: text("run_id")
      .notNull()
      .references(() => detectorRuns.id, { onDelete: "cascade" }),
    versionId: text("version_id").references(() => versions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => commits.id, { onDelete: "cascade" }),
    commitFileId: text("commit_file_id").references(() => commitFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    graphNodeId: text("graph_node_id").references(() => concernGraphNodes.id, { onDelete: "set null" }),
    graphNodeKey: text("graph_node_key"),
    findingKey: text("finding_key").notNull(),
    concernSlug: text("concern_slug").notNull(),
    targetType: text("target_type", { enum: reviewEntityScopeTypes }).notNull(),
    targetId: text("target_id").notNull(),
    path: text("path"),
    side: text("side", { enum: diffSides }),
    startLine: integer("start_line", { mode: "number" }),
    endLine: integer("end_line", { mode: "number" }),
    symbol: text("symbol"),
    marker: text("marker"),
    evidenceKind: text("evidence_kind", { enum: detectorFindingEvidenceKinds }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    evidenceJson: text("evidence_json").notNull().default("[]"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("detector_findings_run_key_unique").on(table.runId, table.findingKey),
    index("detector_findings_run_idx").on(table.runId),
    index("detector_findings_version_idx").on(table.versionId),
    index("detector_findings_commit_idx").on(table.commitId),
    index("detector_findings_commit_file_idx").on(table.commitFileId),
    index("detector_findings_diff_block_idx").on(table.diffBlockId),
    index("detector_findings_graph_node_key_idx").on(table.graphNodeKey),
    index("detector_findings_target_idx").on(table.targetType, table.targetId),
    index("detector_findings_concern_idx").on(table.concernSlug),
    check("detector_findings_evidence_json_check", sql`json_valid(${table.evidenceJson})`),
    check(
      "detector_findings_line_range_check",
      sql`${table.startLine} is null or (${table.startLine} > 0 and (${table.endLine} is null or ${table.endLine} >= ${table.startLine}))`,
    ),
    check(
      "detector_findings_scope_check",
      sql`(${table.targetType} = 'version' and ${table.versionId} is not null and ${table.versionId} = ${table.targetId} and ${table.commitId} is null and ${table.commitFileId} is null and ${table.diffBlockId} is null) or (${table.targetType} = 'commit' and ${table.commitId} is not null and ${table.commitId} = ${table.targetId} and ${table.commitFileId} is null and ${table.diffBlockId} is null) or (${table.targetType} = 'commit_file' and ${table.commitFileId} is not null and ${table.commitFileId} = ${table.targetId} and ${table.diffBlockId} is null) or (${table.targetType} = 'diff_block' and ${table.diffBlockId} is not null and ${table.diffBlockId} = ${table.targetId})`,
    ),
  ],
);
