import { relations } from "drizzle-orm";
import {
  comments,
  commitFiles,
  commits,
  concernGraphEdges,
  concernGraphNodes,
  concernTags,
  decisionComments,
  decisions,
  detectorFindings,
  detectorRuns,
  diffBlocks,
  planComments,
  planDecisions,
  planDiffBlocks,
  planItems,
  plans,
  taggings,
  versions,
} from "./schema.js";

export const versionRelations = relations(versions, ({ many }) => ({
  commits: many(commits),
  detectorRuns: many(detectorRuns),
  detectorFindings: many(detectorFindings),
  comments: many(comments),
  decisions: many(decisions),
  plans: many(plans),
}));

export const commitRelations = relations(commits, ({ one, many }) => ({
  version: one(versions, { fields: [commits.versionId], references: [versions.id] }),
  files: many(commitFiles),
  detectorFindings: many(detectorFindings),
  comments: many(comments),
  decisions: many(decisions),
  plans: many(plans),
}));

export const commitFileRelations = relations(commitFiles, ({ one, many }) => ({
  commit: one(commits, { fields: [commitFiles.commitId], references: [commits.id] }),
  diffBlocks: many(diffBlocks),
  detectorFindings: many(detectorFindings),
  comments: many(comments),
  decisions: many(decisions),
  plans: many(plans),
  planItems: many(planItems),
}));

export const diffBlockRelations = relations(diffBlocks, ({ one, many }) => ({
  commitFile: one(commitFiles, { fields: [diffBlocks.commitFileId], references: [commitFiles.id] }),
  detectorFindings: many(detectorFindings),
  comments: many(comments),
  planLinks: many(planDiffBlocks),
}));

export const concernTagRelations = relations(concernTags, ({ one, many }) => ({
  parent: one(concernTags, { fields: [concernTags.parentId], references: [concernTags.id] }),
  children: many(concernTags),
  taggings: many(taggings),
}));

export const taggingRelations = relations(taggings, ({ one }) => ({
  tag: one(concernTags, { fields: [taggings.tagId], references: [concernTags.id] }),
}));

export const concernGraphNodeRelations = relations(concernGraphNodes, ({ many }) => ({
  outgoingEdges: many(concernGraphEdges, { relationName: "concernGraphEdgesFromNode" }),
  incomingEdges: many(concernGraphEdges, { relationName: "concernGraphEdgesToNode" }),
  detectorFindings: many(detectorFindings),
}));

export const concernGraphEdgeRelations = relations(concernGraphEdges, ({ one }) => ({
  fromNode: one(concernGraphNodes, {
    fields: [concernGraphEdges.fromNodeId],
    references: [concernGraphNodes.id],
    relationName: "concernGraphEdgesFromNode",
  }),
  toNode: one(concernGraphNodes, {
    fields: [concernGraphEdges.toNodeId],
    references: [concernGraphNodes.id],
    relationName: "concernGraphEdgesToNode",
  }),
}));

export const detectorRunRelations = relations(detectorRuns, ({ one, many }) => ({
  version: one(versions, { fields: [detectorRuns.versionId], references: [versions.id] }),
  findings: many(detectorFindings),
}));

export const detectorFindingRelations = relations(detectorFindings, ({ one }) => ({
  run: one(detectorRuns, { fields: [detectorFindings.runId], references: [detectorRuns.id] }),
  version: one(versions, { fields: [detectorFindings.versionId], references: [versions.id] }),
  commit: one(commits, { fields: [detectorFindings.commitId], references: [commits.id] }),
  commitFile: one(commitFiles, { fields: [detectorFindings.commitFileId], references: [commitFiles.id] }),
  diffBlock: one(diffBlocks, { fields: [detectorFindings.diffBlockId], references: [diffBlocks.id] }),
  graphNode: one(concernGraphNodes, { fields: [detectorFindings.graphNodeId], references: [concernGraphNodes.id] }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  version: one(versions, { fields: [comments.versionId], references: [versions.id] }),
  commit: one(commits, { fields: [comments.commitId], references: [commits.id] }),
  commitFile: one(commitFiles, { fields: [comments.commitFileId], references: [commitFiles.id] }),
  diffBlock: one(diffBlocks, { fields: [comments.diffBlockId], references: [diffBlocks.id] }),
  planLinks: many(planComments),
  decisionLinks: many(decisionComments),
}));

export const decisionRelations = relations(decisions, ({ one, many }) => ({
  version: one(versions, { fields: [decisions.versionId], references: [versions.id] }),
  commit: one(commits, { fields: [decisions.commitId], references: [commits.id] }),
  commitFile: one(commitFiles, { fields: [decisions.commitFileId], references: [commitFiles.id] }),
  planItems: many(planItems),
  planLinks: many(planDecisions),
  commentLinks: many(decisionComments),
}));

export const planRelations = relations(plans, ({ one, many }) => ({
  version: one(versions, { fields: [plans.versionId], references: [versions.id] }),
  commit: one(commits, { fields: [plans.commitId], references: [commits.id] }),
  commitFile: one(commitFiles, { fields: [plans.commitFileId], references: [commitFiles.id] }),
  items: many(planItems),
  commentLinks: many(planComments),
  decisionLinks: many(planDecisions),
  diffBlockLinks: many(planDiffBlocks),
}));

export const planItemRelations = relations(planItems, ({ one }) => ({
  plan: one(plans, { fields: [planItems.planId], references: [plans.id] }),
  commitFile: one(commitFiles, { fields: [planItems.commitFileId], references: [commitFiles.id] }),
  decision: one(decisions, { fields: [planItems.decisionId], references: [decisions.id] }),
}));

export const planCommentRelations = relations(planComments, ({ one }) => ({
  plan: one(plans, { fields: [planComments.planId], references: [plans.id] }),
  comment: one(comments, { fields: [planComments.commentId], references: [comments.id] }),
}));

export const planDecisionRelations = relations(planDecisions, ({ one }) => ({
  plan: one(plans, { fields: [planDecisions.planId], references: [plans.id] }),
  decision: one(decisions, { fields: [planDecisions.decisionId], references: [decisions.id] }),
}));

export const planDiffBlockRelations = relations(planDiffBlocks, ({ one }) => ({
  plan: one(plans, { fields: [planDiffBlocks.planId], references: [plans.id] }),
  diffBlock: one(diffBlocks, { fields: [planDiffBlocks.diffBlockId], references: [diffBlocks.id] }),
}));

export const decisionCommentRelations = relations(decisionComments, ({ one }) => ({
  decision: one(decisions, { fields: [decisionComments.decisionId], references: [decisions.id] }),
  comment: one(comments, { fields: [decisionComments.commentId], references: [comments.id] }),
}));
