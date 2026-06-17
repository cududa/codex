import { relations } from "drizzle-orm";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";
import { versionFinalizations } from "./ledger.js";
import { agentReviews, humanApprovals, localChangeRefs, reviewEvents } from "./review-state.js";

export const reviewVersionRelations = relations(reviewVersions, ({ many, one }) => ({
  commits: many(reviewCommits),
  finalization: one(versionFinalizations),
}));

export const reviewCommitRelations = relations(reviewCommits, ({ one, many }) => ({
  version: one(reviewVersions, { fields: [reviewCommits.versionId], references: [reviewVersions.id] }),
  files: many(reviewFiles),
  localChangeRefs: many(localChangeRefs),
  agentReviews: many(agentReviews),
  approvals: many(humanApprovals),
  events: many(reviewEvents),
}));

export const reviewFileRelations = relations(reviewFiles, ({ one, many }) => ({
  commit: one(reviewCommits, { fields: [reviewFiles.commitId], references: [reviewCommits.id] }),
  diffBlocks: many(diffBlocks),
  localChangeRefs: many(localChangeRefs),
  agentReviews: many(agentReviews),
  approvals: many(humanApprovals),
  events: many(reviewEvents),
}));
