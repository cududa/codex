import { relations } from "drizzle-orm";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewEvents,
  reviewFiles,
  reviewVersionIngests,
  reviewVersions,
} from "./core.js";

export const reviewVersionRelations = relations(reviewVersions, ({ many }) => ({
  commits: many(reviewCommits),
}));

export const reviewVersionIngestRelations = relations(reviewVersionIngests, ({ one }) => ({
  version: one(reviewVersions, {
    fields: [reviewVersionIngests.versionId],
    references: [reviewVersions.id],
  }),
}));

export const reviewCommitRelations = relations(reviewCommits, ({ one, many }) => ({
  version: one(reviewVersions, { fields: [reviewCommits.versionId], references: [reviewVersions.id] }),
  files: many(reviewFiles),
  concernAreas: many(commitConcernAreas),
  agentReviews: many(agentReviews),
}));

export const reviewFileRelations = relations(reviewFiles, ({ one, many }) => ({
  commit: one(reviewCommits, { fields: [reviewFiles.commitId], references: [reviewCommits.id] }),
  diffBlocks: many(diffBlocks),
  agentReviews: many(agentReviews),
}));

export const diffBlockRelations = relations(diffBlocks, ({ one }) => ({
  file: one(reviewFiles, { fields: [diffBlocks.fileId], references: [reviewFiles.id] }),
}));

export const commitConcernAreaRelations = relations(commitConcernAreas, ({ one }) => ({
  commit: one(reviewCommits, {
    fields: [commitConcernAreas.commitId],
    references: [reviewCommits.id],
  }),
}));

export const agentReviewRelations = relations(agentReviews, ({ one, many }) => ({
  commit: one(reviewCommits, { fields: [agentReviews.commitId], references: [reviewCommits.id] }),
  file: one(reviewFiles, { fields: [agentReviews.fileId], references: [reviewFiles.id] }),
  reviewedConcernAreas: many(agentReviewConcernAreas),
}));

export const agentReviewConcernAreaRelations = relations(agentReviewConcernAreas, ({ one }) => ({
  agentReview: one(agentReviews, {
    fields: [agentReviewConcernAreas.agentReviewId],
    references: [agentReviews.id],
  }),
  commit: one(reviewCommits, {
    fields: [agentReviewConcernAreas.commitId],
    references: [reviewCommits.id],
  }),
}));

export const reviewEventRelations = relations(reviewEvents, () => ({}));
