import type {
  ActorKind,
  ConcernAreaSlug,
  FinalReviewMark,
  ReviewEventKind,
  ReviewMark,
  ReviewScopeType,
} from "@prompt-reviews/contracts";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";

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

export const agentCommitReviews = sqliteTable(
  "agent_commit_reviews",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    reviewedMark: text("reviewed_mark").$type<ReviewMark>().notNull(),
    notes: text("notes"),
    reviewerId: text("reviewer_id").notNull(),
    reviewerDisplayName: text("reviewer_display_name"),
    reviewedAt: text("reviewed_at").notNull(),
  },
  (table) => [index("agent_commit_reviews_commit_idx").on(table.commitId)],
);

export const agentCommitReviewConcernAreas = sqliteTable(
  "agent_commit_review_concern_areas",
  {
    agentReviewId: text("agent_review_id")
      .notNull()
      .references(() => agentCommitReviews.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.agentReviewId, table.concernAreaSlug] }),
    uniqueIndex("agent_commit_review_concern_areas_position_unique").on(table.agentReviewId, table.position),
  ],
);

export const agentFileReviews = sqliteTable(
  "agent_file_reviews",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => reviewFiles.id, { onDelete: "cascade" }),
    reviewedMark: text("reviewed_mark").$type<ReviewMark>().notNull(),
    notes: text("notes"),
    reviewerId: text("reviewer_id").notNull(),
    reviewerDisplayName: text("reviewer_display_name"),
    reviewedAt: text("reviewed_at").notNull(),
  },
  (table) => [index("agent_file_reviews_file_idx").on(table.fileId)],
);

export const humanCommitApprovals = sqliteTable(
  "human_commit_approvals",
  {
    id: text("id").primaryKey(),
    commitId: text("commit_id")
      .notNull()
      .references(() => reviewCommits.id, { onDelete: "cascade" }),
    approvedMark: text("approved_mark").$type<FinalReviewMark>().notNull(),
    notes: text("notes"),
    approvedById: text("approved_by_id").notNull(),
    approvedByDisplayName: text("approved_by_display_name"),
    approvedAt: text("approved_at").notNull(),
  },
  (table) => [
    index("human_commit_approvals_commit_idx").on(table.commitId),
    uniqueIndex("human_commit_approvals_commit_unique").on(table.commitId),
  ],
);

export const humanCommitApprovalConcernAreas = sqliteTable(
  "human_commit_approval_concern_areas",
  {
    humanApprovalId: text("human_approval_id")
      .notNull()
      .references(() => humanCommitApprovals.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.humanApprovalId, table.concernAreaSlug] }),
    uniqueIndex("human_commit_approval_concern_areas_position_unique").on(table.humanApprovalId, table.position),
  ],
);

export const humanFileApprovals = sqliteTable(
  "human_file_approvals",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => reviewFiles.id, { onDelete: "cascade" }),
    approvedMark: text("approved_mark").$type<FinalReviewMark>().notNull(),
    notes: text("notes"),
    approvedById: text("approved_by_id").notNull(),
    approvedByDisplayName: text("approved_by_display_name"),
    approvedAt: text("approved_at").notNull(),
  },
  (table) => [
    index("human_file_approvals_file_idx").on(table.fileId),
    uniqueIndex("human_file_approvals_file_unique").on(table.fileId),
  ],
);

export const reviewEvents = sqliteTable(
  "review_events",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type").$type<ReviewScopeType>().notNull(),
    versionId: text("version_id").references(() => reviewVersions.id, { onDelete: "cascade" }),
    commitId: text("commit_id").references(() => reviewCommits.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => reviewFiles.id, { onDelete: "cascade" }),
    diffBlockId: text("diff_block_id").references(() => diffBlocks.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ReviewEventKind>().notNull(),
    actorType: text("actor_type").$type<ActorKind>().notNull(),
    actorId: text("actor_id").notNull(),
    actorDisplayName: text("actor_display_name"),
    summary: text("summary").notNull(),
    previousReviewMark: text("previous_review_mark").$type<ReviewMark>(),
    newReviewMark: text("new_review_mark").$type<ReviewMark>(),
    agentReviewId: text("agent_review_id"),
    humanApprovalId: text("human_approval_id"),
    approvedMark: text("approved_mark").$type<FinalReviewMark>(),
    localChangeRefId: text("local_change_ref_id").references(() => localChangeRefs.id, { onDelete: "cascade" }),
    localChangeSha: text("local_change_sha"),
    commentId: text("comment_id"),
    threadId: text("thread_id"),
    reviewPlanId: text("review_plan_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("review_events_version_idx").on(table.versionId),
    index("review_events_commit_idx").on(table.commitId),
    index("review_events_file_idx").on(table.fileId),
    index("review_events_diff_block_idx").on(table.diffBlockId),
  ],
);

export const reviewEventPreviousConcernAreas = sqliteTable(
  "review_event_previous_concern_areas",
  {
    reviewEventId: text("review_event_id")
      .notNull()
      .references(() => reviewEvents.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.reviewEventId, table.concernAreaSlug] }),
    uniqueIndex("review_event_previous_concern_areas_position_unique").on(table.reviewEventId, table.position),
  ],
);

export const reviewEventNewConcernAreas = sqliteTable(
  "review_event_new_concern_areas",
  {
    reviewEventId: text("review_event_id")
      .notNull()
      .references(() => reviewEvents.id, { onDelete: "cascade" }),
    concernAreaSlug: text("concern_area_slug").$type<ConcernAreaSlug>().notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.reviewEventId, table.concernAreaSlug] }),
    uniqueIndex("review_event_new_concern_areas_position_unique").on(table.reviewEventId, table.position),
  ],
);
