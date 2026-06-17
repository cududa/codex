import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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

export const versionRowSchemas = {
  select: createSelectSchema(versions),
  insert: createInsertSchema(versions),
};

export const commitRowSchemas = {
  select: createSelectSchema(commits),
  insert: createInsertSchema(commits),
};

export const commitFileRowSchemas = {
  select: createSelectSchema(commitFiles),
  insert: createInsertSchema(commitFiles),
};

export const diffBlockRowSchemas = {
  select: createSelectSchema(diffBlocks),
  insert: createInsertSchema(diffBlocks),
};

export const concernTagRowSchemas = {
  select: createSelectSchema(concernTags),
  insert: createInsertSchema(concernTags),
};

export const taggingRowSchemas = {
  select: createSelectSchema(taggings),
  insert: createInsertSchema(taggings),
};

export const concernGraphNodeRowSchemas = {
  select: createSelectSchema(concernGraphNodes),
  insert: createInsertSchema(concernGraphNodes),
};

export const concernGraphEdgeRowSchemas = {
  select: createSelectSchema(concernGraphEdges),
  insert: createInsertSchema(concernGraphEdges),
};

export const detectorRunRowSchemas = {
  select: createSelectSchema(detectorRuns),
  insert: createInsertSchema(detectorRuns),
};

export const detectorFindingRowSchemas = {
  select: createSelectSchema(detectorFindings),
  insert: createInsertSchema(detectorFindings),
};

export const commentRowSchemas = {
  select: createSelectSchema(comments),
  insert: createInsertSchema(comments),
};

export const decisionRowSchemas = {
  select: createSelectSchema(decisions),
  insert: createInsertSchema(decisions),
};

export const planRowSchemas = {
  select: createSelectSchema(plans),
  insert: createInsertSchema(plans),
};

export const planItemRowSchemas = {
  select: createSelectSchema(planItems),
  insert: createInsertSchema(planItems),
};

export const planCommentRowSchemas = {
  select: createSelectSchema(planComments),
  insert: createInsertSchema(planComments),
};

export const planDecisionRowSchemas = {
  select: createSelectSchema(planDecisions),
  insert: createInsertSchema(planDecisions),
};

export const planDiffBlockRowSchemas = {
  select: createSelectSchema(planDiffBlocks),
  insert: createInsertSchema(planDiffBlocks),
};

export const decisionCommentRowSchemas = {
  select: createSelectSchema(decisionComments),
  insert: createInsertSchema(decisionComments),
};
