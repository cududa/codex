import {
  CommitDetailSchema,
  CommitQueueItemSchema,
  type CommitDetail,
  type CommitQueueItem,
} from "../../domain/schemas/index.js";
import {
  countCommitFilesByCommitIds,
  listCommitFilesByCommit,
  listTagSlugsByTargets,
  type CommitRow,
  type DetectorFindingRow,
  type TargetTagSlugs,
} from "../../repositories/index.js";
import type { ServiceContext } from "../serviceContext.js";
import { targetComments, toCommentSummary } from "./commentViews.js";
import { targetDecisions, toDecisionSummary } from "./decisionViews.js";
import { detectorFindingsByCommitId, summarizeDetectorFindings } from "./detectorFindingViews.js";
import { toCommitFileDetail, toCommitFileQueueItem } from "./fileViews.js";
import { targetPlans, toPlanSummary } from "./planViews.js";
import { targetTaggings } from "./tagViews.js";

export function toCommitQueueItem(context: ServiceContext, row: CommitRow): CommitQueueItem {
  const [item] = toCommitQueueItems(context, [row]);
  if (item === undefined) {
    throw new Error("Expected commit queue item.");
  }
  return item;
}

export function toCommitQueueItems(context: ServiceContext, rows: readonly CommitRow[]): CommitQueueItem[] {
  const commitIds = rows.map((row) => row.id);
  const fileCounts = countCommitFilesByCommitIds(context.db, commitIds);
  const tagSlugsByTarget = listTagSlugsByTargets(context.db, "commit", commitIds);
  const findingsByCommitId = detectorFindingsByCommitId(context, commitIds);
  return rows.map((row) =>
    toCommitQueueItemWithSummary(
      row,
      fileCounts.get(row.id) ?? 0,
      tagSlugsByTarget.get(row.id),
      findingsByCommitId.get(row.id) ?? [],
    ),
  );
}

function toCommitQueueItemWithSummary(
  row: CommitRow,
  fileCount: number,
  tagSlugs: TargetTagSlugs | undefined,
  detectorFindingRows: readonly DetectorFindingRow[],
): CommitQueueItem {
  return CommitQueueItemSchema.parse({
    id: row.id,
    versionId: row.versionId,
    sha: row.sha,
    title: row.title,
    authorName: row.authorName ?? undefined,
    committedAt: row.committedAt ?? undefined,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs?.primary,
    secondaryTagSlugs: tagSlugs?.secondary ?? [],
    fileCount,
    detectorFindingSummaries: summarizeDetectorFindings(detectorFindingRows, {
      targetType: "commit",
      targetId: row.id,
    }),
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
