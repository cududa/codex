import { relations } from "drizzle-orm";
import { diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./core.js";
import { detectorEvidence, detectorRuns } from "./detector.js";
import { reviewLedgers } from "./ledger.js";
import {
  agentCommitReviews,
  agentFileReviews,
  humanCommitApprovals,
  humanFileApprovals,
  localChangeRefs,
  reviewEvents,
} from "./review-state.js";

export const reviewVersionRelations = relations(reviewVersions, ({ many, one }) => ({
  commits: many(reviewCommits),
  detectorRuns: many(detectorRuns),
  ledger: one(reviewLedgers),
}));

export const reviewCommitRelations = relations(reviewCommits, ({ one, many }) => ({
  version: one(reviewVersions, { fields: [reviewCommits.versionId], references: [reviewVersions.id] }),
  files: many(reviewFiles),
  localChangeRefs: many(localChangeRefs),
  agentReviews: many(agentCommitReviews),
  approvals: many(humanCommitApprovals),
  events: many(reviewEvents),
  detectorEvidence: many(detectorEvidence),
}));

export const reviewFileRelations = relations(reviewFiles, ({ one, many }) => ({
  commit: one(reviewCommits, { fields: [reviewFiles.commitId], references: [reviewCommits.id] }),
  diffBlocks: many(diffBlocks),
  localChangeRefs: many(localChangeRefs),
  agentReviews: many(agentFileReviews),
  approvals: many(humanFileApprovals),
  events: many(reviewEvents),
  detectorEvidence: many(detectorEvidence),
}));

export const detectorRunRelations = relations(detectorRuns, ({ one, many }) => ({
  version: one(reviewVersions, { fields: [detectorRuns.versionId], references: [reviewVersions.id] }),
  evidence: many(detectorEvidence),
}));

export const detectorEvidenceRelations = relations(detectorEvidence, ({ one }) => ({
  run: one(detectorRuns, { fields: [detectorEvidence.runId], references: [detectorRuns.id] }),
  commit: one(reviewCommits, { fields: [detectorEvidence.commitId], references: [reviewCommits.id] }),
  file: one(reviewFiles, { fields: [detectorEvidence.fileId], references: [reviewFiles.id] }),
  diffBlock: one(diffBlocks, { fields: [detectorEvidence.diffBlockId], references: [diffBlocks.id] }),
}));
