import {
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  DiffBlockViewSchema,
  type CommitFileDetail,
  type CommitFileQueueItem,
  type DiffBlockView,
} from "../../domain/schemas/index.js";
import {
  listDiffBlocksByCommitFile,
  type CommitFileRow,
  type DiffBlockRow,
} from "../../repositories/index.js";
import type { ServiceContext } from "../serviceContext.js";
import { targetComments, toCommentSummary } from "./commentViews.js";
import { targetDecisions, toDecisionSummary } from "./decisionViews.js";
import { targetPlans, toPlanSummary } from "./planViews.js";
import { targetTaggings, targetTagSlugs } from "./tagViews.js";

export function toCommitFileQueueItem(context: ServiceContext, row: CommitFileRow): CommitFileQueueItem {
  const tagSlugs = targetTagSlugs(context, { targetType: "commit_file", targetId: row.id });
  return CommitFileQueueItemSchema.parse({
    id: row.id,
    commitId: row.commitId,
    path: row.newPath ?? row.oldPath,
    oldPath: row.oldPath ?? undefined,
    changeType: row.changeType,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs.primary,
    secondaryTagSlugs: tagSlugs.secondary,
  });
}

export function toCommitFileDetail(context: ServiceContext, row: CommitFileRow): CommitFileDetail {
  return CommitFileDetailSchema.parse({
    ...toCommitFileQueueItem(context, row),
    diffBlocks: listDiffBlocksByCommitFile(context.db, row.id).map((block) => toDiffBlockView(context, block)),
    review: {
      taggings: targetTaggings(context, { targetType: "commit_file", targetId: row.id }),
      comments: targetComments(context, "commit_file", row.id).map(toCommentSummary),
      decisions: targetDecisions(context, { scope: "commit_file", targetId: row.id }).map(toDecisionSummary),
      plans: targetPlans(context, { scope: "commit_file", targetId: row.id }).map(toPlanSummary),
    },
  });
}

function toDiffBlockView(context: ServiceContext, row: DiffBlockRow): DiffBlockView {
  return DiffBlockViewSchema.parse({
    id: row.id,
    commitFileId: row.commitFileId,
    heading: row.heading ?? undefined,
    oldStartLine: row.oldStartLine ?? undefined,
    oldEndLine: row.oldEndLine ?? undefined,
    newStartLine: row.newStartLine ?? undefined,
    newEndLine: row.newEndLine ?? undefined,
    patch: row.patch,
    taggings: targetTaggings(context, { targetType: "diff_block", targetId: row.id }),
    comments: targetComments(context, "diff_block", row.id).map(toCommentSummary),
    decision: undefined,
  });
}
