import type { ChangeKind, ConcernAreaSlug, ReviewMark, ReviewVersionState } from "@prompt-reviews/contracts";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const reviewVersions = sqliteTable("review_versions", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  repositoryId: text("repository_id").notNull(),
  baseRef: text("base_ref"),
  targetRef: text("target_ref"),
  baseSha: text("base_sha"),
  targetSha: text("target_sha"),
  state: text("state").$type<ReviewVersionState>().notNull().default("open"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
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
