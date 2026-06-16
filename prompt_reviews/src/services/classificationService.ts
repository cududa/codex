import { z } from "zod";
import {
  ClassifyCommitParamsSchema,
  ClassifyFileParamsSchema,
  ClassificationViewSchema,
  ConcernTagViewSchema,
  TaggingViewSchema,
  type ActorRef,
  type ClassifyCommitParams,
  type ClassifyFileParams,
  type ClassificationView,
  type ConcernTagView,
  type ReviewEntityScope,
  type TaggingView,
} from "../domain/schemas/index.js";
import {
  addTagging,
  findCommitById,
  findCommitFileById,
  findClassificationMetadataByTarget,
  findConcernTagById,
  findConcernTagBySlug,
  listPrimaryTaggingsByTarget,
  listTaggingsByTarget,
  removeTaggingsByTargetKind,
  upsertClassificationMetadata,
  type ConcernTagRow,
  type TaggingRow,
  type TaggingTarget,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import { withServiceTransaction, type RootServiceContext, type ServiceContext } from "./serviceContext.js";
import { recomputeCommitStatus, recomputeFileStatus } from "./statusService.js";

export type ClassificationServiceOptions = {
  actor?: ActorRef;
};

export type ClassificationService = {
  classifyCommit: (params: unknown) => ClassificationView;
  classifyFile: (params: unknown) => ClassificationView;
};

const defaultClassificationActor = {
  type: "system",
  displayName: "Prompt Reviews",
} as const satisfies ActorRef;

export function createClassificationService(
  context: RootServiceContext,
  options: ClassificationServiceOptions = {},
): ClassificationService {
  const actor = options.actor ?? defaultClassificationActor;
  return {
    classifyCommit: (params) => classifyCommit(context, params, actor),
    classifyFile: (params) => classifyFile(context, params, actor),
  };
}

export function classifyCommit(
  context: RootServiceContext,
  params: unknown,
  actor: ActorRef = defaultClassificationActor,
): ClassificationView {
  const command = parseParams(ClassifyCommitParamsSchema, params, "Invalid commit classification params.");
  return withServiceTransaction(context, (txContext) => classifyCommitInTransaction(txContext, command, actor));
}

export function classifyFile(
  context: RootServiceContext,
  params: unknown,
  actor: ActorRef = defaultClassificationActor,
): ClassificationView {
  const command = parseParams(ClassifyFileParamsSchema, params, "Invalid file classification params.");
  return withServiceTransaction(context, (txContext) => classifyFileInTransaction(txContext, command, actor));
}

function classifyCommitInTransaction(
  context: ServiceContext,
  command: ClassifyCommitParams,
  actor: ActorRef,
): ClassificationView {
  const commit = findCommitById(context.db, command.commitId);
  if (commit === undefined) {
    throw notFound("commit", command.commitId);
  }

  const classification = replaceTargetClassification(context, { targetType: "commit", targetId: commit.id }, command, actor);
  recomputeCommitStatus(context, commit.id);
  return classification;
}

function classifyFileInTransaction(context: ServiceContext, command: ClassifyFileParams, actor: ActorRef): ClassificationView {
  const file = findCommitFileById(context.db, command.commitFileId);
  if (file === undefined) {
    throw notFound("commit_file", command.commitFileId);
  }

  const classification = replaceTargetClassification(context, { targetType: "commit_file", targetId: file.id }, command, actor);
  recomputeFileStatus(context, file.id);
  return classification;
}

function replaceTargetClassification(
  context: ServiceContext,
  target: TaggingTarget,
  command: ClassifyCommitParams | ClassifyFileParams,
  actor: ActorRef,
): ClassificationView {
  const secondarySlugs = command.secondaryTagSlugs ?? [];
  if (secondarySlugs.includes(command.primaryTagSlug)) {
    throw validationFailed("Primary tag cannot also be a secondary tag.", { primaryTagSlug: command.primaryTagSlug });
  }
  if (new Set(secondarySlugs).size !== secondarySlugs.length) {
    throw validationFailed("Secondary tag slugs must be unique.");
  }

  const primaryTag = findRequiredConcernTagBySlug(context, command.primaryTagSlug);
  const secondaryTags = secondarySlugs.map((slug) => findRequiredConcernTagBySlug(context, slug));

  removeTaggingsByTargetKind(context.db, target, "primary");
  removeTaggingsByTargetKind(context.db, target, "secondary");

  addTagging(context.db, toTaggingInsert(context, target, primaryTag, "primary", command.rationale, actor));
  for (const tag of secondaryTags) {
    addTagging(context.db, toTaggingInsert(context, target, tag, "secondary", command.rationale, actor));
  }
  upsertClassificationMetadata(context.db, {
    targetType: target.targetType,
    targetId: target.targetId,
    summary: command.summary ?? null,
    riskLevel: command.riskLevel ?? null,
    confidence: command.confidence ?? null,
    updatedByActorType: actor.type,
    updatedByActorId: actor.id ?? null,
    updatedByDisplayName: actor.displayName ?? null,
    createdAt: context.now(),
    updatedAt: context.now(),
  });

  const primaryTaggings = listPrimaryTaggingsByTarget(context.db, target);
  if (primaryTaggings.length !== 1) {
    throw invariantFailed("Classification must leave exactly one primary tag.", {
      targetType: target.targetType,
      targetId: target.targetId,
      primaryCount: primaryTaggings.length,
    });
  }

  return toClassificationView(context, target);
}

function toTaggingInsert(
  context: ServiceContext,
  target: TaggingTarget,
  tag: ConcernTagRow,
  kind: TaggingRow["kind"],
  rationale: string | undefined,
  actor: ActorRef,
) {
  return {
    tagId: tag.id,
    targetType: target.targetType,
    targetId: target.targetId,
    kind,
    rationale,
    createdByActorType: actor.type,
    createdByActorId: actor.id,
    createdByDisplayName: actor.displayName,
    createdAt: context.now(),
  };
}

function findRequiredConcernTagBySlug(context: ServiceContext, slug: string): ConcernTagRow {
  const tag = findConcernTagBySlug(context.db, slug);
  if (tag === undefined) {
    throw notFound("concern_tag", slug);
  }
  if (!tag.isActive) {
    throw validationFailed("Concern tag is inactive.", { slug });
  }
  return tag;
}

function toTaggingView(context: ServiceContext, row: TaggingRow): TaggingView {
  const tag = findConcernTagById(context.db, row.tagId);
  if (tag === undefined) {
    throw invariantFailed("Tagging points at a missing concern tag.", { taggingId: row.id, tagId: row.tagId });
  }

  return TaggingViewSchema.parse({
    id: row.id,
    scope: taggingScope(row),
    tag: toConcernTagView(context, tag),
    kind: row.kind,
    rationale: row.rationale ?? undefined,
    createdBy: actorRef(row.createdByActorType, row.createdByActorId, row.createdByDisplayName),
    createdAt: row.createdAt,
  });
}

function toClassificationView(context: ServiceContext, target: TaggingTarget): ClassificationView {
  const metadata = findClassificationMetadataByTarget(context.db, target);
  if (metadata === undefined) {
    throw invariantFailed("Classification metadata is missing after classification.", target);
  }

  return ClassificationViewSchema.parse({
    scope: taggingScopeTarget(target),
    taggings: listTaggingsByTarget(context.db, target).map((tagging) => toTaggingView(context, tagging)),
    summary: metadata.summary ?? undefined,
    riskLevel: metadata.riskLevel ?? undefined,
    confidence: metadata.confidence ?? undefined,
    updatedBy: actorRef(metadata.updatedByActorType, metadata.updatedByActorId, metadata.updatedByDisplayName),
    updatedAt: metadata.updatedAt ?? metadata.createdAt,
  });
}

function toConcernTagView(context: ServiceContext, row: ConcernTagRow): ConcernTagView {
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

function taggingScope(row: TaggingRow): ReviewEntityScope {
  return taggingScopeTarget({ targetType: row.targetType, targetId: row.targetId });
}

function taggingScopeTarget(target: TaggingTarget): ReviewEntityScope {
  if (target.targetType === "version") {
    return { type: "version", versionId: target.targetId };
  }
  if (target.targetType === "commit") {
    return { type: "commit", commitId: target.targetId };
  }
  if (target.targetType === "commit_file") {
    return { type: "commit_file", commitFileId: target.targetId };
  }
  return { type: "diff_block", diffBlockId: target.targetId };
}

function actorRef(type: ActorRef["type"], id: string | null, displayName: string | null): ActorRef {
  return {
    type,
    id: id ?? undefined,
    displayName: displayName ?? undefined,
  };
}

function parseStringArray(json: string): string[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw invariantFailed("Concern tag JSON metadata must be an array of strings.");
  }
  return parsed;
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
