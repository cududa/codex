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
  listTagSlugsByTargets,
  type CommitFileRow,
  type DetectorFindingRow,
  type DiffBlockRow,
  type TargetTagSlugs,
} from "../../repositories/index.js";
import type { ServiceContext } from "../serviceContext.js";
import { targetComments, toCommentSummary } from "./commentViews.js";
import { targetDecisions, toDecisionSummary } from "./decisionViews.js";
import {
  detectorFindingsByCommitFileId,
  detectorFindingsByDiffBlockId,
  detectorFindingsForTarget,
  summarizeDetectorFindings,
  toDetectorFindingView,
} from "./detectorFindingViews.js";
import { targetPlans, toPlanSummary } from "./planViews.js";
import { targetTaggings } from "./tagViews.js";

export function toCommitFileQueueItem(context: ServiceContext, row: CommitFileRow): CommitFileQueueItem {
  const [item] = toCommitFileQueueItems(context, [row]);
  if (item === undefined) {
    throw new Error("Expected commit file queue item.");
  }
  return item;
}

export function toCommitFileQueueItems(context: ServiceContext, rows: readonly CommitFileRow[]): CommitFileQueueItem[] {
  const fileIds = rows.map((row) => row.id);
  const tagSlugsByTarget = listTagSlugsByTargets(context.db, "commit_file", fileIds);
  const findingsByFileId = detectorFindingsByCommitFileId(context, fileIds);
  return rows.map((row) =>
    toCommitFileQueueItemWithSummary(row, tagSlugsByTarget.get(row.id), findingsByFileId.get(row.id) ?? []),
  );
}

function toCommitFileQueueItemWithSummary(
  row: CommitFileRow,
  tagSlugs: TargetTagSlugs | undefined,
  detectorFindingRows: readonly DetectorFindingRow[],
): CommitFileQueueItem {
  return CommitFileQueueItemSchema.parse({
    id: row.id,
    commitId: row.commitId,
    path: row.newPath ?? row.oldPath,
    oldPath: row.oldPath ?? undefined,
    changeType: row.changeType,
    status: row.reviewStatus,
    primaryTagSlug: tagSlugs?.primary,
    secondaryTagSlugs: tagSlugs?.secondary ?? [],
    detectorFindingSummaries: summarizeDetectorFindings(detectorFindingRows, {
      targetType: "commit_file",
      targetId: row.id,
    }),
  });
}

export function toCommitFileDetail(context: ServiceContext, row: CommitFileRow): CommitFileDetail {
  const blocks = listDiffBlocksByCommitFile(context.db, row.id);
  const findingsByBlockId = detectorFindingsByDiffBlockId(
    context,
    blocks.map((block) => block.id),
  );
  return CommitFileDetailSchema.parse({
    ...toCommitFileQueueItem(context, row),
    detectorFindings: detectorFindingsForTarget(context, { targetType: "commit_file", targetId: row.id }),
    diffBlocks: blocks.map((block) => toDiffBlockView(context, block, findingsByBlockId.get(block.id) ?? [])),
    review: {
      taggings: targetTaggings(context, { targetType: "commit_file", targetId: row.id }),
      comments: targetComments(context, "commit_file", row.id).map(toCommentSummary),
      decisions: targetDecisions(context, { scope: "commit_file", targetId: row.id }).map(toDecisionSummary),
      plans: targetPlans(context, { scope: "commit_file", targetId: row.id }).map(toPlanSummary),
    },
  });
}

function toDiffBlockView(
  context: ServiceContext,
  row: DiffBlockRow,
  detectorFindingRows: readonly DetectorFindingRow[],
): DiffBlockView {
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
    detectorFindings: detectorFindingRows.map(toDetectorFindingView),
  });
}
