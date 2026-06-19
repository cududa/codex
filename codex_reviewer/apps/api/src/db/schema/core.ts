import type { ActorKind, ChangeKind, ConcernAreaSlug, ReviewMark } from "@prompt-reviews/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export type ReviewEventScopeType = "version" | "commit" | "file" | "diffBlock";
export type ReviewEventKind = "review_mark_changed" | "concern_areas_changed" | "agent_review_recorded";

export const reviewVersions = sqliteTable(
  "review_versions",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    repositoryId: text("repository_id").notNull(),
    baseRef: text("base_ref"),
    targetRef: text("target_ref"),
    baseSha: text("base_sha").notNull(),
    targetSha: text("target_sha").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at"),
  },
  (table) => [
    uniqueIndex("review_versions_resolved_range_unique").on(
      table.repositoryId,
      table.baseSha,
      table.targetSha,
    ),
  ],
);

export const reviewVersionIngests = sqliteTable("review_version_ingests", {
  versionId: text("version_id")
    .primaryKey()
    .references(() => reviewVersions.id, { onDelete: "cascade" }),
  repositoryId: text("repository_id").notNull(),
  baseRefOrSha: text("base_ref_or_sha").notNull(),
  targetRefOrSha: text("target_ref_or_sha").notNull(),
  baseSha: text("base_sha").notNull(),
  targetSha: text("target_sha").notNull(),
  concernMapVersion: text("concern_map_version").notNull(),
  source: text("source").notNull(),
  createdAt: text("created_at").notNull(),
});

export const reviewCommits = sqliteTable(
  "review_commits",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => reviewVersions.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    authorName: text("author_name"),
    committedAt: text("committed_at"),
    reviewMark: text("review_mark").$type<ReviewMark>().notNull().default("FLAG"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("review_commits_version_idx").on(table.versionId),
    uniqueIndex("review_commits_version_sha_unique").on(table.versionId, table.sha),
    uniqueIndex("review_commits_version_position_unique").on(table.versionId, table.position),
  ],
);

export const reviewFiles = sqliteTable(
  "review_files",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    path: text("path").notNull(),
    oldPath: text("old_path"),
    changeKind: text("change_kind").$type<ChangeKind>().notNull(),
    reviewMark: text("review_mark").$type<ReviewMark>(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("review_files_commit_idx").on(table.commitId),
    uniqueIndex("review_files_commit_position_unique").on(table.commitId, table.position),
  ],
);

export const diffBlocks = sqliteTable(
  "diff_blocks",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => reviewFiles.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    heading: text("heading"),
    oldStartLine: integer("old_start_line"),
    oldEndLine: integer("old_end_line"),
    newStartLine: integer("new_start_line"),
    newEndLine: integer("new_end_line"),
    patch: text("patch").notNull(),
  },
  (table) => [
    index("diff_blocks_file_idx").on(table.fileId),
    uniqueIndex("diff_blocks_file_position_unique").on(table.fileId, table.position),
  ],
);

export const commitConcernAreas = sqliteTable(
  "commit_concern_areas",
  {
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.commitId, table.concernAreaSlug] }),
    uniqueIndex("commit_concern_areas_position_unique").on(table.commitId, table.position),
  ],
);

export const agentReviews = sqliteTable(
  "agent_reviews",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    reviewedMark: text("reviewed_mark").$type<ReviewMark>().notNull(),
    reviewerActorType: text("reviewer_actor_type").$type<"agent">().notNull(),
    reviewerActorId: text("reviewer_actor_id").notNull(),
    reviewerActorDisplayName: text("reviewer_actor_display_name"),
    notesMarkdown: text("notes_markdown"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    check("agent_reviews_exactly_one_target", sql`(${table.commitId} IS NULL) <> (${table.fileId} IS NULL)`),
    check("agent_reviews_reviewed_mark_check", sql`${table.reviewedMark} IN ('PASS', 'FLAG', 'MODIFY')`),
    check("agent_reviews_reviewer_actor_type_check", sql`${table.reviewerActorType} = 'agent'`),
    index("agent_reviews_commit_idx").on(table.commitId),
    index("agent_reviews_file_idx").on(table.fileId),
    index("agent_reviews_created_at_idx").on(table.createdAt),
    uniqueIndex("agent_reviews_id_commit_unique").on(table.id, table.commitId),
  ],
);

export const agentReviewConcernAreas = sqliteTable(
  "agent_review_concern_areas",
  {
    agentReviewId: text("agent_review_id").notNull(),
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    check(
      "agent_review_concern_areas_slug_check",
      sql`${table.concernAreaSlug} IN (
        'harness-prompts',
        'message-roles',
        'hidden-context',
        'goal-continuation',
        'goal-behavior',
        'context-compaction',
        'tool-affordances',
        'permission-defaults'
      )`,
    ),
    check("agent_review_concern_areas_position_check", sql`${table.position} >= 0 AND ${table.position} < 3`),
    primaryKey({ columns: [table.agentReviewId, table.concernAreaSlug] }),
    uniqueIndex("agent_review_concern_areas_position_unique").on(table.agentReviewId, table.position),
    foreignKey({
      name: "agent_review_concern_areas_agent_review_commit_fk",
      columns: [table.agentReviewId, table.commitId],
      foreignColumns: [agentReviews.id, agentReviews.commitId],
    }).onDelete("cascade"),
  ],
);

export const reviewEvents = sqliteTable(
  "review_events",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewEventScopeType>().notNull(),
    scopeId: text("scope_id").notNull(),
    actorType: text("actor_type").$type<ActorKind>().notNull(),
    actorId: text("actor_id").notNull(),
    actorDisplayName: text("actor_display_name"),
    kind: text("kind").$type<ReviewEventKind>().notNull(),
    summary: text("summary").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("review_events_scope_idx").on(table.scopeType, table.scopeId),
    index("review_events_created_at_idx").on(table.createdAt),
  ],
);
