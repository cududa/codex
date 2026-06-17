import type { ConcernAreaSlug, ReviewMark } from "@prompt-reviews/contracts";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { reviewCommits, reviewFiles } from "./core.js";
import type { ActorKind, ReviewEventKind } from "./types.js";

export const localChangeRefs = sqliteTable(
  "local_change_refs",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    sha: text("sha").notNull(),
    title: text("title"),
    summary: text("summary"),
    linkedByType: text("linked_by_type").$type<ActorKind>().notNull(),
    linkedById: text("linked_by_id").notNull(),
    linkedByDisplayName: text("linked_by_display_name"),
    linkedAt: text("linked_at").notNull(),
  },
  (table) => [
    index("local_change_refs_commit_idx").on(table.commitId),
    index("local_change_refs_file_idx").on(table.fileId),
  ],
);

export const agentReviews = sqliteTable(
  "agent_reviews",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    reviewedMark: text("reviewed_mark").$type<ReviewMark>().notNull(),
    notes: text("notes"),
    reviewerId: text("reviewer_id").notNull(),
    reviewerDisplayName: text("reviewer_display_name"),
    reviewedAt: text("reviewed_at").notNull(),
  },
  (table) => [index("agent_reviews_commit_idx").on(table.commitId), index("agent_reviews_file_idx").on(table.fileId)],
);

export const agentReviewConcernAreas = sqliteTable(
  "agent_review_concern_areas",
  {
    agentReviewId: text("agent_review_id")
      .notNull()
      .references(() => agentReviews.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.agentReviewId, table.concernAreaSlug] }),
    uniqueIndex("agent_review_concern_areas_position_unique").on(table.agentReviewId, table.position),
  ],
);

export const humanApprovals = sqliteTable(
  "human_approvals",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    approvedMark: text("approved_mark").$type<"PASS" | "DONE">().notNull(),
    notes: text("notes"),
    approvedById: text("approved_by_id").notNull(),
    approvedByDisplayName: text("approved_by_display_name"),
    approvedAt: text("approved_at").notNull(),
  },
  (table) => [index("human_approvals_commit_idx").on(table.commitId), index("human_approvals_file_idx").on(table.fileId)],
);

export const humanApprovalConcernAreas = sqliteTable(
  "human_approval_concern_areas",
  {
    humanApprovalId: text("human_approval_id")
      .notNull()
      .references(() => humanApprovals.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.humanApprovalId, table.concernAreaSlug] }),
    uniqueIndex("human_approval_concern_areas_position_unique").on(table.humanApprovalId, table.position),
  ],
);

export const reviewEvents = sqliteTable(
  "review_events",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ReviewEventKind>().notNull(),
    actorType: text("actor_type").$type<ActorKind>().notNull(),
    actorId: text("actor_id").notNull(),
    actorDisplayName: text("actor_display_name"),
    summary: text("summary").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("review_events_commit_idx").on(table.commitId), index("review_events_file_idx").on(table.fileId)],
);
