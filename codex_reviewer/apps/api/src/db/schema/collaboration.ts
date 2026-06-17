import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";
import type { ActorKind, ReviewScopeType, ThreadedCommentState } from "./types.js";

export const threadedComments = sqliteTable(
  "threaded_comments",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewScopeType>().notNull(),
    versionId: text("version_id").references(() => reviewVersions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    anchorKind: text("anchor_kind").$type<"scope" | "diffBlock" | "range">().notNull(),
    anchorDiffBlockId: text("anchor_diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    anchorFileId: text("anchor_file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    anchorSide: text("anchor_side").$type<"old" | "new">(),
    anchorStartLine: integer("anchor_start_line"),
    anchorEndLine: integer("anchor_end_line"),
    selectedText: text("selected_text"),
    threadId: text("thread_id").notNull(),
    parentCommentId: text("parent_comment_id"),
    bodyMarkdown: text("body_markdown").notNull(),
    state: text("state").$type<ThreadedCommentState>().notNull().default("open"),
    authorType: text("author_type").$type<ActorKind>().notNull(),
    authorId: text("author_id").notNull(),
    authorDisplayName: text("author_display_name"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at"),
    resolvedByType: text("resolved_by_type").$type<ActorKind>(),
    resolvedById: text("resolved_by_id"),
    resolvedByDisplayName: text("resolved_by_display_name"),
    resolvedAt: text("resolved_at"),
  },
  (table) => [
    index("threaded_comments_version_idx").on(table.versionId),
    index("threaded_comments_commit_idx").on(table.commitId),
    index("threaded_comments_file_idx").on(table.fileId),
    index("threaded_comments_diff_block_idx").on(table.diffBlockId),
    index("threaded_comments_thread_idx").on(table.threadId),
  ],
);

export const decisionNotes = sqliteTable(
  "decision_notes",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewScopeType>().notNull(),
    versionId: text("version_id").references(() => reviewVersions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    bodyMarkdown: text("body_markdown").notNull(),
    authorType: text("author_type").$type<ActorKind>().notNull(),
    authorId: text("author_id").notNull(),
    authorDisplayName: text("author_display_name"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("decision_notes_version_idx").on(table.versionId),
    index("decision_notes_commit_idx").on(table.commitId),
    index("decision_notes_file_idx").on(table.fileId),
    index("decision_notes_diff_block_idx").on(table.diffBlockId),
  ],
);

export const reviewPlans = sqliteTable(
  "review_plans",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewScopeType>().notNull(),
    versionId: text("version_id").references(() => reviewVersions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    bodyMarkdown: text("body_markdown").notNull(),
    createdByType: text("created_by_type").$type<ActorKind>().notNull(),
    createdById: text("created_by_id").notNull(),
    createdByDisplayName: text("created_by_display_name"),
    createdAt: text("created_at").notNull(),
    updatedByType: text("updated_by_type").$type<ActorKind>(),
    updatedById: text("updated_by_id"),
    updatedByDisplayName: text("updated_by_display_name"),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("review_plans_version_idx").on(table.versionId),
    index("review_plans_commit_idx").on(table.commitId),
    index("review_plans_file_idx").on(table.fileId),
    index("review_plans_diff_block_idx").on(table.diffBlockId),
  ],
);
