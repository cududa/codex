import {
  CommitDetailSchema,
  CommitQueueItemSchema,
  type CommitDetail,
  type CommitQueueItem,
} from "../../domain/schemas/index.js";
import { listCommitFilesByCommit, type CommitRow } from "../../repositories/index.js";
import type { ServiceContext } from "../serviceContext.js";
import { targetComments, toCommentSummary } from "./commentViews.js";
import { targetDecisions, toDecisionSummary } from "./decisionViews.js";
import { toCommitFileDetail, toCommitFileQueueItem } from "./fileViews.js";
import { targetPlans, toPlanSummary } from "./planViews.js";
import { targetTaggings, targetTagSlugs } from "./tagViews.js";

export function toCommitQueueItem(context: ServiceContext, row: CommitRow): CommitQueueItem {
  const tagSlugs = targetTagSlugs(context, { targetType: "commit", targetId: row.id });
  return CommitQueueItemSchema.parse({
    id: row.id,
    versionId: row.versionId,
    sha: row.sha,
    title: row.title,
    authorName: row.authorName ?? undefined,
    committedAt: row.committedAt ?? undefined,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs.primary,
    secondaryTagSlugs: tagSlugs.secondary,
    fileCount: listCommitFilesByCommit(context.db, row.id).length,
  });
}

export function toCommitDetail(context: ServiceContext, row: CommitRow): CommitDetail {
  const files = listCommitFilesByCommit(context.db, row.id);
  return CommitDetailSchema.parse({
    ...toCommitQueueItem(context, row),
    message: row.message ?? undefined,
    files: files.map((file) => toCommitFileDetail(context, file)),
    queuedFiles: files.map((file) => toCommitFileQueueItem(context, file)),
    taggings: targetTaggings(context, { targetType: "commit", targetId: row.id }),
    comments: targetComments(context, "commit", row.id).map(toCommentSummary),
    decisions: targetDecisions(context, { scope: "commit", targetId: row.id }).map(toDecisionSummary),
    plans: targetPlans(context, { scope: "commit", targetId: row.id }).map(toPlanSummary),
  });
}
