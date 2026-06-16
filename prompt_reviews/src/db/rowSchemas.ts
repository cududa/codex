import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  comments,
  classificationMetadata,
  commitFiles,
  commits,
  concernTags,
  decisionComments,
  decisions,
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

export const classificationMetadataRowSchemas = {
  select: createSelectSchema(classificationMetadata),
  insert: createInsertSchema(classificationMetadata),
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
