import type {
  ActorKind,
  ReviewNoteRevisionAction,
  ReviewNoteScopeType,
  ReviewScopeType,
  ThreadedCommentState,
} from "@prompt-reviews/contracts";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";

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

export const reviewNotes = sqliteTable(
  "review_notes",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewNoteScopeType>().notNull(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    bodyMarkdown: text("body_markdown").notNull(),
    authorType: text("author_type").$type<ActorKind>().notNull(),
    authorId: text("author_id").notNull(),
    authorDisplayName: text("author_display_name"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    deletedByType: text("deleted_by_type").$type<ActorKind>(),
    deletedById: text("deleted_by_id"),
    deletedByDisplayName: text("deleted_by_display_name"),
  },
  (table) => [
    index("review_notes_commit_idx").on(table.commitId),
    index("review_notes_file_idx").on(table.fileId),
    index("review_notes_diff_block_idx").on(table.diffBlockId),
    index("review_notes_deleted_idx").on(table.deletedAt),
  ],
);

export const reviewNoteRevisions = sqliteTable(
  "review_note_revisions",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => reviewNotes.id, { onDelete: "cascade" }),
    actorType: text("actor_type").$type<ActorKind>().notNull(),
    actorId: text("actor_id").notNull(),
    actorDisplayName: text("actor_display_name"),
    changedAt: text("changed_at").notNull(),
    action: text("action").$type<ReviewNoteRevisionAction>().notNull(),
    bodyMarkdownBefore: text("body_markdown_before"),
    bodyMarkdownAfter: text("body_markdown_after"),
  },
  (table) => [
    index("review_note_revisions_note_idx").on(table.noteId),
    index("review_note_revisions_changed_idx").on(table.changedAt),
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
