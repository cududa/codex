import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  actorTypes,
  changeTypes,
  commentStatuses,
  confidenceLevels,
  decisionOutcomes,
  decisionScopeTypes,
  decisionStatuses,
  diffSides,
  planItemStatuses,
  planStatuses,
  reviewEntityScopeTypes,
  reviewStatuses,
  riskLevels,
  sourceAnchorKinds,
  tagKinds,
  versionStatuses,
} from "../domain/enums.js";
import { createDbId } from "./ids.js";
import { sqliteUnixSecondsNow } from "./timestamps.js";

const idColumn = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createDbId(prefix));

const createdAtColumn = () => integer("created_at", { mode: "number" }).notNull().default(sqliteUnixSecondsNow);
const updatedAtColumn = () => integer("updated_at", { mode: "number" });

export const versions = sqliteTable(
  "versions",
  {
    id: idColumn("ver"),
    repositoryId: text("repository_id").notNull(),
    label: text("label").notNull(),
    baseSha: text("base_sha").notNull(),
    targetSha: text("target_sha").notNull(),
    status: text("status", { enum: versionStatuses }).notNull().default(versionStatuses[0]),
    description: text("description"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    closedAt: integer("closed_at", { mode: "number" }),
    closedByActorType: text("closed_by_actor_type", { enum: actorTypes }),
    closedByActorId: text("closed_by_actor_id"),
    closedByDisplayName: text("closed_by_display_name"),
    closureSummary: text("closure_summary"),
  },
  (table) => [
    uniqueIndex("versions_label_unique").on(table.label),
    uniqueIndex("versions_base_target_unique").on(table.baseSha, table.targetSha),
    index("versions_status_idx").on(table.status),
    index("versions_target_sha_idx").on(table.targetSha),
  ],
);

export const commits = sqliteTable(
  "commits",
  {
    id: idColumn("cmt"),
    versionId: text("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    parentSha: text("parent_sha"),
    ordinal: integer("ordinal", { mode: "number" }).notNull(),
    title: text("title").notNull(),
    message: text("message"),
    authorName: text("author_name"),
    authorEmail: text("author_email"),
    committedAt: integer("committed_at", { mode: "number" }),
    reviewStatus: text("review_status", { enum: reviewStatuses }).notNull().default(reviewStatuses[0]),
    statusOverride: text("status_override", { enum: reviewStatuses }),
    statusOverrideReason: text("status_override_reason"),
    statusOverrideActorType: text("status_override_actor_type", { enum: actorTypes }),
    statusOverrideActorId: text("status_override_actor_id"),
    statusOverrideDisplayName: text("status_override_display_name"),
    statusOverrideAt: integer("status_override_at", { mode: "number" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("commits_version_sha_unique").on(table.versionId, table.sha),
    uniqueIndex("commits_version_ordinal_unique").on(table.versionId, table.ordinal),
    index("commits_version_status_idx").on(table.versionId, table.reviewStatus),
    index("commits_sha_idx").on(table.sha),
    check(
      "commits_status_override_reason_check",
      sql`(${table.statusOverride} is null and ${table.statusOverrideReason} is null and ${table.statusOverrideActorType} is null and ${table.statusOverrideAt} is null) or (${table.statusOverride} is not null and length(trim(coalesce(${table.statusOverrideReason}, ''))) > 0 and ${table.statusOverrideActorType} is not null and ${table.statusOverrideAt} is not null)`,
    ),
  ],
);

export const commitFiles = sqliteTable(
  "commit_files",
  {
    id: idColumn("file"),
    commitId: text("commit_id")
      .notNull()
      .references(() => commits.id, { onDelete: "cascade" }),
    oldPath: text("old_path"),
    newPath: text("new_path"),
    changeType: text("change_type", { enum: changeTypes }).notNull(),
    reviewStatus: text("review_status", { enum: reviewStatuses }).notNull().default(reviewStatuses[0]),
    statusOverride: text("status_override", { enum: reviewStatuses }),
    statusOverrideReason: text("status_override_reason"),
    statusOverrideActorType: text("status_override_actor_type", { enum: actorTypes }),
    statusOverrideActorId: text("status_override_actor_id"),
    statusOverrideDisplayName: text("status_override_display_name"),
    statusOverrideAt: integer("status_override_at", { mode: "number" }),
    additions: integer("additions", { mode: "number" }).notNull().default(0),
    deletions: integer("deletions", { mode: "number" }).notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("commit_files_commit_paths_unique")
      .on(table.commitId, table.oldPath, table.newPath)
      .where(sql`${table.oldPath} is not null and ${table.newPath} is not null`),
    uniqueIndex("commit_files_commit_added_new_unique")
      .on(table.commitId, table.newPath)
      .where(sql`${table.oldPath} is null and ${table.newPath} is not null`),
    uniqueIndex("commit_files_commit_deleted_old_unique")
      .on(table.commitId, table.oldPath)
      .where(sql`${table.oldPath} is not null and ${table.newPath} is null`),
    index("commit_files_commit_status_idx").on(table.commitId, table.reviewStatus),
    index("commit_files_commit_created_idx").on(table.commitId, table.createdAt, table.id),
    index("commit_files_new_path_idx").on(table.newPath),
    index("commit_files_old_path_idx").on(table.oldPath),
    check("commit_files_path_present_check", sql`${table.oldPath} is not null or ${table.newPath} is not null`),
    check(
      "commit_files_status_override_reason_check",
      sql`(${table.statusOverride} is null and ${table.statusOverrideReason} is null and ${table.statusOverrideActorType} is null and ${table.statusOverrideAt} is null) or (${table.statusOverride} is not null and length(trim(coalesce(${table.statusOverrideReason}, ''))) > 0 and ${table.statusOverrideActorType} is not null and ${table.statusOverrideAt} is not null)`,
    ),
  ],
);

export const diffBlocks = sqliteTable(
  "diff_blocks",
  {
    id: idColumn("blk"),
    commitFileId: text("commit_file_id")
      .notNull()
      .references(() => commitFiles.id, { onDelete: "cascade" }),
    blockKey: text("block_key").notNull(),
    ordinal: integer("ordinal", { mode: "number" }).notNull(),
    contentHash: text("content_hash").notNull(),
    heading: text("heading"),
    oldStartLine: integer("old_start_line", { mode: "number" }),
    oldEndLine: integer("old_end_line", { mode: "number" }),
    newStartLine: integer("new_start_line", { mode: "number" }),
    newEndLine: integer("new_end_line", { mode: "number" }),
    patch: text("patch").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("diff_blocks_file_key_unique").on(table.commitFileId, table.blockKey),
    uniqueIndex("diff_blocks_file_ordinal_unique").on(table.commitFileId, table.ordinal),
    index("diff_blocks_file_hash_idx").on(table.commitFileId, table.contentHash),
  ],
);

export const concernTags = sqliteTable(
  "concern_tags",
  {
    id: idColumn("tag"),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    parentId: text("parent_id"),
    description: text("description").notNull(),
    examplesJson: text("examples_json").notNull().default("[]"),
    pitfallsJson: text("pitfalls_json").notNull().default("[]"),
    sortOrder: integer("sort_order", { mode: "number" }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("concern_tags_slug_unique").on(table.slug),
    index("concern_tags_parent_idx").on(table.parentId),
    index("concern_tags_active_sort_idx").on(table.isActive, table.sortOrder),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "concern_tags_parent_fk",
    }).onDelete("set null"),
  ],
);

export const taggings = sqliteTable(
  "taggings",
  {
    id: idColumn("tgg"),
    tagId: text("tag_id")
      .notNull()
      .references(() => concernTags.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: reviewEntityScopeTypes }).notNull(),
    targetId: text("target_id").notNull(),
    kind: text("kind", { enum: tagKinds }).notNull(),
    rationale: text("rationale"),
    createdByActorType: text("created_by_actor_type", { enum: actorTypes }).notNull(),
    createdByActorId: text("created_by_actor_id"),
    createdByDisplayName: text("created_by_display_name"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("taggings_tag_target_unique").on(table.tagId, table.targetType, table.targetId),
    index("taggings_target_idx").on(table.targetType, table.targetId),
    index("taggings_tag_idx").on(table.tagId),
  ],
);

export const classificationMetadata = sqliteTable(
  "classification_metadata",
  {
    id: idColumn("clf"),
    targetType: text("target_type", { enum: reviewEntityScopeTypes }).notNull(),
    targetId: text("target_id").notNull(),
    summary: text("summary"),
    riskLevel: text("risk_level", { enum: riskLevels }),
    confidence: text("confidence", { enum: confidenceLevels }),
    updatedByActorType: text("updated_by_actor_type", { enum: actorTypes }).notNull(),
    updatedByActorId: text("updated_by_actor_id"),
    updatedByDisplayName: text("updated_by_display_name"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("classification_metadata_target_unique").on(table.targetType, table.targetId),
    index("classification_metadata_target_idx").on(table.targetType, table.targetId),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: idColumn("com"),
    scope: text("scope", { enum: reviewEntityScopeTypes }).notNull(),
    versionId: text("version_id").references(() => versions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => commits.id, { onDelete: "cascade" }),
    commitFileId: text("commit_file_id").references(() => commitFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    anchorKind: text("anchor_kind", { enum: sourceAnchorKinds }).notNull().default(sourceAnchorKinds[0]),
    anchorDiffBlockId: text("anchor_diff_block_id").references(() => diffBlocks.id, { onDelete: "set null" }),
    anchorCommitFileId: text("anchor_commit_file_id").references(() => commitFiles.id, { onDelete: "set null" }),
    anchorSide: text("anchor_side", { enum: diffSides }),
    startLine: integer("start_line", { mode: "number" }),
    endLine: integer("end_line", { mode: "number" }),
    startColumn: integer("start_column", { mode: "number" }),
    endColumn: integer("end_column", { mode: "number" }),
    selectedText: text("selected_text"),
    body: text("body").notNull(),
    status: text("status", { enum: commentStatuses }).notNull().default(commentStatuses[0]),
    authorActorType: text("author_actor_type", { enum: actorTypes }).notNull(),
    authorActorId: text("author_actor_id"),
    authorDisplayName: text("author_display_name"),
    resolution: text("resolution"),
    resolvedByActorType: text("resolved_by_actor_type", { enum: actorTypes }),
    resolvedByActorId: text("resolved_by_actor_id"),
    resolvedByDisplayName: text("resolved_by_display_name"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    resolvedAt: integer("resolved_at", { mode: "number" }),
  },
  (table) => [
    index("comments_status_idx").on(table.status),
    index("comments_scope_status_idx").on(table.scope, table.status),
    index("comments_scope_target_status_idx").on(
      table.scope,
      table.versionId,
      table.commitId,
      table.commitFileId,
      table.diffBlockId,
      table.status,
    ),
    index("comments_version_idx").on(table.versionId),
    index("comments_commit_idx").on(table.commitId),
    index("comments_commit_file_idx").on(table.commitFileId),
    index("comments_diff_block_idx").on(table.diffBlockId),
  ],
);

export const decisions = sqliteTable(
  "decisions",
  {
    id: idColumn("dec"),
    scope: text("scope", { enum: decisionScopeTypes }).notNull(),
    versionId: text("version_id").references(() => versions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => commits.id, { onDelete: "cascade" }),
    commitFileId: text("commit_file_id").references(() => commitFiles.id, { onDelete: "cascade" }),
    status: text("status", { enum: decisionStatuses }).notNull().default(decisionStatuses[0]),
    outcome: text("outcome", { enum: decisionOutcomes }).notNull(),
    rationale: text("rationale").notNull(),
    proposedByActorType: text("proposed_by_actor_type", { enum: actorTypes }).notNull(),
    proposedByActorId: text("proposed_by_actor_id"),
    proposedByDisplayName: text("proposed_by_display_name"),
    finalizedByActorType: text("finalized_by_actor_type", { enum: actorTypes }),
    finalizedByActorId: text("finalized_by_actor_id"),
    finalizedByDisplayName: text("finalized_by_display_name"),
    riskLevel: text("risk_level", { enum: riskLevels }),
    confidence: text("confidence", { enum: confidenceLevels }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    finalizedAt: integer("finalized_at", { mode: "number" }),
  },
  (table) => [
    index("decisions_scope_status_idx").on(table.scope, table.status),
    index("decisions_version_idx").on(table.versionId),
    index("decisions_commit_idx").on(table.commitId),
    index("decisions_commit_file_idx").on(table.commitFileId),
    index("decisions_file_status_finalizer_idx").on(table.commitFileId, table.status, table.finalizedByActorType),
    index("decisions_outcome_idx").on(table.outcome),
  ],
);

export const plans = sqliteTable(
  "plans",
  {
    id: idColumn("pln"),
    scope: text("scope", { enum: decisionScopeTypes }).notNull(),
    versionId: text("version_id").references(() => versions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => commits.id, { onDelete: "cascade" }),
    commitFileId: text("commit_file_id").references(() => commitFiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    status: text("status", { enum: planStatuses }).notNull().default(planStatuses[0]),
    proposedByActorType: text("proposed_by_actor_type", { enum: actorTypes }).notNull(),
    proposedByActorId: text("proposed_by_actor_id"),
    proposedByDisplayName: text("proposed_by_display_name"),
    completedByActorType: text("completed_by_actor_type", { enum: actorTypes }),
    completedByActorId: text("completed_by_actor_id"),
    completedByDisplayName: text("completed_by_display_name"),
    completionNote: text("completion_note"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    completedAt: integer("completed_at", { mode: "number" }),
  },
  (table) => [
    index("plans_version_status_idx").on(table.versionId, table.status),
    index("plans_commit_idx").on(table.commitId),
  ],
);

export const planItems = sqliteTable(
  "plan_items",
  {
    id: idColumn("pli"),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal", { mode: "number" }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: planItemStatuses }).notNull().default(planItemStatuses[0]),
    blockingReason: text("blocking_reason"),
    commitFileId: text("commit_file_id").references(() => commitFiles.id, { onDelete: "set null" }),
    decisionId: text("decision_id").references(() => decisions.id, { onDelete: "set null" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("plan_items_plan_ordinal_unique").on(table.planId, table.ordinal),
    index("plan_items_plan_status_idx").on(table.planId, table.status),
    index("plan_items_status_plan_idx").on(table.status, table.planId),
    index("plan_items_commit_file_idx").on(table.commitFileId),
    index("plan_items_decision_idx").on(table.decisionId),
  ],
);

export const planComments = sqliteTable(
  "plan_comments",
  {
    id: idColumn("plc"),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("plan_comments_plan_comment_unique").on(table.planId, table.commentId)],
);

export const planDecisions = sqliteTable(
  "plan_decisions",
  {
    id: idColumn("pld"),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("plan_decisions_plan_decision_unique").on(table.planId, table.decisionId)],
);

export const planDiffBlocks = sqliteTable(
  "plan_diff_blocks",
  {
    id: idColumn("pdb"),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id")
      .notNull()
      .references(() => diffBlocks.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("plan_diff_blocks_plan_diff_block_unique").on(table.planId, table.diffBlockId)],
);

export const decisionComments = sqliteTable(
  "decision_comments",
  {
    id: idColumn("dcm"),
    decisionId: text("decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("decision_comments_decision_comment_unique").on(table.decisionId, table.commentId)],
);

export const schemaTables = [
  versions,
  commits,
  commitFiles,
  diffBlocks,
  concernTags,
  taggings,
  classificationMetadata,
  comments,
  decisions,
  plans,
  planItems,
  planComments,
  planDecisions,
  planDiffBlocks,
  decisionComments,
] as const;

export const one = sql`1`;
