import { relations } from "drizzle-orm";
import { commitConcernAreas, diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";

export const reviewVersionRelations = relations(reviewVersions, ({ many }) => ({
  commits: many(reviewCommits),
}));

export const reviewCommitRelations = relations(reviewCommits, ({ one, many }) => ({
  version: one(reviewVersions, { fields: [reviewCommits.versionId], references: [reviewVersions.id] }),
  files: many(reviewFiles),
  concernAreas: many(commitConcernAreas),
}));

export const reviewFileRelations = relations(reviewFiles, ({ one, many }) => ({
  commit: one(reviewCommits, { fields: [reviewFiles.commitId], references: [reviewCommits.id] }),
  diffBlocks: many(diffBlocks),
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
