import {
  ConcernTagViewSchema,
  TaggingViewSchema,
  type ConcernTagView,
  type ReviewEntityScope,
  type TaggingView,
} from "../../domain/schemas/index.js";
import {
  findConcernTagById,
  listTaggingsByTarget,
  type ConcernTagRow,
  type ConcernTagTreeNode,
  type TaggingRow,
  type TaggingTarget,
} from "../../repositories/index.js";
import { invariantFailed } from "../errors.js";
import type { ServiceContext } from "../serviceContext.js";
import { actorRef, parseStringArray } from "./shared.js";

export function toConcernTagView(context: ServiceContext, row: ConcernTagRow): ConcernTagView {
  const parent = row.parentId === null ? undefined : findConcernTagById(context.db, row.parentId);
  return ConcernTagViewSchema.parse({
    slug: row.slug,
    label: row.label,
    parentSlug: parent?.slug ?? null,
    description: row.description,
    examples: parseStringArray(row.examplesJson),
    pitfalls: parseStringArray(row.pitfallsJson),
    sortOrder: row.sortOrder,
  });
}

export function flattenConcernTagViews(context: ServiceContext, node: ConcernTagTreeNode): ConcernTagView[] {
  return [toConcernTagView(context, node), ...node.children.flatMap((child) => flattenConcernTagViews(context, child))];
}

export function toTaggingView(context: ServiceContext, row: TaggingRow): TaggingView {
  const tag = findConcernTagById(context.db, row.tagId);
  if (tag === undefined) {
    throw invariantFailed("Tagging points at a missing concern tag.", { taggingId: row.id, tagId: row.tagId });
  }

  return TaggingViewSchema.parse({
    id: row.id,
    scope: taggingScope(row),
    tag: toConcernTagView(context, tag),
    kind: row.kind,
    createdBy: actorRef(row.createdByActorType, row.createdByActorId, row.createdByDisplayName),
    createdAt: row.createdAt,
  });
}

export function targetTaggings(context: ServiceContext, target: TaggingTarget): TaggingView[] {
  return listTaggingsByTarget(context.db, target).map((tagging) => toTaggingView(context, tagging));
}

export function targetTagSlugs(context: ServiceContext, target: TaggingTarget): {
  primary: string | undefined;
  secondary: string[];
} {
  const primary: string[] = [];
  const secondary: string[] = [];
  for (const tagging of listTaggingsByTarget(context.db, target)) {
    const tag = findConcernTagById(context.db, tagging.tagId);
    if (tag === undefined) {
      throw invariantFailed("Tagging points at a missing concern tag.", { taggingId: tagging.id, tagId: tagging.tagId });
    }
    if (tagging.kind === "primary") {
      primary.push(tag.slug);
    } else {
      secondary.push(tag.slug);
    }
  }
  return { primary: primary[0], secondary };
}

export function taggingTargetFromScope(scope: ReviewEntityScope): TaggingTarget {
  if (scope.type === "version") {
    return { targetType: "version", targetId: scope.versionId };
  }
  if (scope.type === "commit") {
    return { targetType: "commit", targetId: scope.commitId };
  }
  if (scope.type === "commit_file") {
    return { targetType: "commit_file", targetId: scope.commitFileId };
  }
  return { targetType: "diff_block", targetId: scope.diffBlockId };
}

export function taggingScope(row: TaggingRow): ReviewEntityScope {
  if (row.targetType === "version") {
    return { type: "version", versionId: row.targetId };
  }
  if (row.targetType === "commit") {
    return { type: "commit", commitId: row.targetId };
  }
  if (row.targetType === "commit_file") {
    return { type: "commit_file", commitFileId: row.targetId };
  }
  return { type: "diff_block", diffBlockId: row.targetId };
}
