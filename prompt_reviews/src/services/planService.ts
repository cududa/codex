import { z } from "zod";
import {
  CompletePlanParamsSchema,
  CreatePlanItemParamsSchema,
  CreatePlanParamsSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  UpdatePlanItemParamsSchema,
  UpdatePlanParamsSchema,
  type ActorRef,
  type CompletePlanParams,
  type CreatePlanItemParams,
  type CreatePlanParams,
  type DecisionScope,
  type PlanDetail,
  type PlanItemDetail,
  type UpdatePlanItemParams,
  type UpdatePlanParams,
} from "../domain/schemas/index.js";
import {
  addPlanCommentLink,
  addPlanDecisionLink,
  addPlanDiffBlockLink,
  createPlan as createPlanRow,
  createPlanItem as createPlanItemRow,
  deletePlanCommentLinks,
  deletePlanDecisionLinks,
  deletePlanDiffBlockLinks,
  findCommentById,
  findCommitById,
  findCommitFileById,
  findDecisionById,
  findDiffBlockById,
  findPlanById,
  findPlanItemById,
  findVersionById,
  listPlanCommentLinks,
  listPlanDecisionLinks,
  listPlanDiffBlockLinks,
  listPlanItems,
  updatePlan as updatePlanRow,
  updatePlanItem as updatePlanItemRow,
  type PlanInsert,
  type PlanItemRow,
  type PlanRow,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import { withServiceTransaction, type RootServiceContext, type ServiceContext } from "./serviceContext.js";
import { recomputeCommitStatus, recomputeFileStatus, recomputeVersionStatus } from "./statusService.js";

export type PlanService = {
  createPlan: (params: unknown) => PlanDetail;
  updatePlan: (params: unknown) => PlanDetail;
  createPlanItem: (params: unknown) => PlanItemDetail;
  updatePlanItem: (params: unknown) => PlanItemDetail;
  completePlan: (params: unknown) => PlanDetail;
};

export function createPlanService(context: RootServiceContext): PlanService {
  return {
    createPlan: (params) => createPlan(context, params),
    updatePlan: (params) => updatePlan(context, params),
    createPlanItem: (params) => createPlanItem(context, params),
    updatePlanItem: (params) => updatePlanItem(context, params),
    completePlan: (params) => completePlan(context, params),
  };
}

export function createPlan(context: RootServiceContext, params: unknown): PlanDetail {
  const command = parseParams(CreatePlanParamsSchema, params, "Invalid create plan params.");
  return withServiceTransaction(context, (txContext) => createPlanInTransaction(txContext, command));
}

export function updatePlan(context: RootServiceContext, params: unknown): PlanDetail {
  const command = parseParams(UpdatePlanParamsSchema, params, "Invalid update plan params.");
  return withServiceTransaction(context, (txContext) => updatePlanInTransaction(txContext, command));
}

export function createPlanItem(context: RootServiceContext, params: unknown): PlanItemDetail {
  const command = parseParams(CreatePlanItemParamsSchema, params, "Invalid create plan item params.");
  return withServiceTransaction(context, (txContext) => createPlanItemInTransaction(txContext, command));
}

export function updatePlanItem(context: RootServiceContext, params: unknown): PlanItemDetail {
  const command = parseParams(UpdatePlanItemParamsSchema, params, "Invalid update plan item params.");
  return withServiceTransaction(context, (txContext) => updatePlanItemInTransaction(txContext, command));
}

export function completePlan(context: RootServiceContext, params: unknown): PlanDetail {
  const command = parseParams(CompletePlanParamsSchema, params, "Invalid complete plan params.");
  return withServiceTransaction(context, (txContext) => completePlanInTransaction(txContext, command));
}

function createPlanInTransaction(context: ServiceContext, command: CreatePlanParams): PlanDetail {
  validateScopeParent(context, command.scope);
  const now = context.now();
  const row = createPlanRow(context.db, {
    ...scopeColumns(command.scope),
    title: command.title,
    summary: command.summary ?? null,
    status: "proposed",
    proposedByActorType: command.proposedBy.type,
    proposedByActorId: command.proposedBy.id ?? null,
    proposedByDisplayName: command.proposedBy.displayName ?? null,
    createdAt: now,
    updatedAt: now,
  });
  replacePlanLinks(context, row.id, {
    commentIds: command.commentIds ?? [],
    decisionIds: command.decisionIds ?? [],
    diffBlockIds: command.diffBlockIds ?? [],
  });

  refreshAffectedStatus(context, row);
  return toPlanDetail(context, row);
}

function updatePlanInTransaction(context: ServiceContext, command: UpdatePlanParams): PlanDetail {
  const existing = findRequiredPlan(context, command.planId);
  assertStoredPlanInvariant(context, existing);

  const updated = updatePlanRow(context.db, existing.id, {
    title: command.title,
    summary: command.summary,
    status: command.status,
    updatedAt: context.now(),
  });
  if (updated === undefined) {
    throw notFound("plan", existing.id);
  }
  replacePlanLinks(context, updated.id, {
    commentIds: command.commentIds,
    decisionIds: command.decisionIds,
    diffBlockIds: command.diffBlockIds,
  });

  refreshAffectedStatus(context, updated);
  return toPlanDetail(context, updated);
}

function createPlanItemInTransaction(context: ServiceContext, command: CreatePlanItemParams): PlanItemDetail {
  const plan = findRequiredPlan(context, command.planId);
  assertStoredPlanInvariant(context, plan);
  validatePlanItemLinks(context, {
    commitFileId: command.commitFileId,
    decisionId: command.decisionId,
  });
  const ordinal = nextPlanItemOrdinal(context, plan.id);
  const now = context.now();
  const item = createPlanItemRow(context.db, {
    planId: plan.id,
    ordinal,
    title: command.title,
    description: command.description ?? null,
    status: "todo",
    commitFileId: command.commitFileId ?? null,
    decisionId: command.decisionId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  refreshAffectedStatus(context, plan);
  return toPlanItemDetail(item);
}

function updatePlanItemInTransaction(context: ServiceContext, command: UpdatePlanItemParams): PlanItemDetail {
  const existing = findRequiredPlanItem(context, command.planItemId);
  const plan = findRequiredPlan(context, existing.planId);
  assertStoredPlanInvariant(context, plan);
  validatePlanItemLinks(context, {
    commitFileId: command.commitFileId,
    decisionId: command.decisionId,
  });

  const updated = updatePlanItemRow(context.db, existing.id, {
    title: command.title,
    description: command.description,
    status: command.status,
    blockingReason: command.blockingReason,
    commitFileId: command.commitFileId,
    decisionId: command.decisionId,
    updatedAt: context.now(),
  });
  if (updated === undefined) {
    throw notFound("plan_item", existing.id);
  }

  refreshAffectedStatus(context, plan);
  return toPlanItemDetail(updated);
}

function completePlanInTransaction(context: ServiceContext, command: CompletePlanParams): PlanDetail {
  const existing = findRequiredPlan(context, command.planId);
  assertStoredPlanInvariant(context, existing);
  const incompleteItems = listPlanItems(context.db, existing.id).filter(isIncompletePlanItem);
  if (incompleteItems.length > 0) {
    throw invariantFailed("Cannot complete a plan while it has incomplete items.", {
      planId: existing.id,
      incompleteItemIds: incompleteItems.map((item) => item.id),
    });
  }

  const now = context.now();
  const updated = updatePlanRow(context.db, existing.id, {
    status: "complete",
    completedByActorType: command.completedBy.type,
    completedByActorId: command.completedBy.id ?? null,
    completedByDisplayName: command.completedBy.displayName ?? null,
    completionNote: command.completionNote ?? null,
    completedAt: now,
    updatedAt: now,
  });
  if (updated === undefined) {
    throw notFound("plan", existing.id);
  }

  refreshAffectedStatus(context, updated);
  return toPlanDetail(context, updated);
}

function validateScopeParent(context: ServiceContext, scope: DecisionScope): void {
  if (scope.type === "version") {
    if (findVersionById(context.db, scope.versionId) === undefined) {
      throw notFound("version", scope.versionId);
    }
  } else if (scope.type === "commit") {
    if (findCommitById(context.db, scope.commitId) === undefined) {
      throw notFound("commit", scope.commitId);
    }
  } else if (findCommitFileById(context.db, scope.commitFileId) === undefined) {
    throw notFound("commit_file", scope.commitFileId);
  }
}

function replacePlanLinks(
  context: ServiceContext,
  planId: string,
  links: { commentIds?: string[]; decisionIds?: string[]; diffBlockIds?: string[] },
): void {
  if (links.commentIds !== undefined) {
    validateUniqueIds(links.commentIds, "commentIds");
    for (const commentId of links.commentIds) {
      if (findCommentById(context.db, commentId) === undefined) {
        throw notFound("comment", commentId);
      }
    }
    deletePlanCommentLinks(context.db, planId);
    for (const commentId of links.commentIds) {
      addPlanCommentLink(context.db, { planId, commentId, createdAt: context.now() });
    }
  }

  if (links.decisionIds !== undefined) {
    validateUniqueIds(links.decisionIds, "decisionIds");
    for (const decisionId of links.decisionIds) {
      if (findDecisionById(context.db, decisionId) === undefined) {
        throw notFound("decision", decisionId);
      }
    }
    deletePlanDecisionLinks(context.db, planId);
    for (const decisionId of links.decisionIds) {
      addPlanDecisionLink(context.db, { planId, decisionId, createdAt: context.now() });
    }
  }

  if (links.diffBlockIds !== undefined) {
    validateUniqueIds(links.diffBlockIds, "diffBlockIds");
    for (const diffBlockId of links.diffBlockIds) {
      if (findDiffBlockById(context.db, diffBlockId) === undefined) {
        throw notFound("diff_block", diffBlockId);
      }
    }
    deletePlanDiffBlockLinks(context.db, planId);
    for (const diffBlockId of links.diffBlockIds) {
      addPlanDiffBlockLink(context.db, { planId, diffBlockId, createdAt: context.now() });
    }
  }
}

function validatePlanItemLinks(
  context: ServiceContext,
  links: { commitFileId?: string; decisionId?: string },
): void {
  if (links.commitFileId !== undefined && findCommitFileById(context.db, links.commitFileId) === undefined) {
    throw notFound("commit_file", links.commitFileId);
  }
  if (links.decisionId !== undefined && findDecisionById(context.db, links.decisionId) === undefined) {
    throw notFound("decision", links.decisionId);
  }
}

function validateUniqueIds(ids: string[], field: string): void {
  if (new Set(ids).size !== ids.length) {
    throw validationFailed("Plan link ids must be unique.", { field });
  }
}

function scopeColumns(scope: DecisionScope): Pick<PlanInsert, "scope" | "versionId" | "commitId" | "commitFileId"> {
  if (scope.type === "version") {
    return { scope: "version", versionId: scope.versionId, commitId: null, commitFileId: null };
  }
  if (scope.type === "commit") {
    return { scope: "commit", versionId: null, commitId: scope.commitId, commitFileId: null };
  }
  return { scope: "commit_file", versionId: null, commitId: null, commitFileId: scope.commitFileId };
}

function refreshAffectedStatus(context: ServiceContext, row: PlanRow): void {
  const scope = planScope(row);
  if (scope.type === "version") {
    recomputeVersionStatus(context, scope.versionId);
  } else if (scope.type === "commit") {
    recomputeCommitStatus(context, scope.commitId);
  } else {
    recomputeFileStatus(context, scope.commitFileId);
  }
}

function findRequiredPlan(context: ServiceContext, planId: string): PlanRow {
  const plan = findPlanById(context.db, planId);
  if (plan === undefined) {
    throw notFound("plan", planId);
  }
  return plan;
}

function findRequiredPlanItem(context: ServiceContext, planItemId: string): PlanItemRow {
  const item = findPlanItemById(context.db, planItemId);
  if (item === undefined) {
    throw notFound("plan_item", planItemId);
  }
  return item;
}

function assertStoredPlanInvariant(context: ServiceContext, row: PlanRow): void {
  validateScopeParent(context, planScope(row));
}

function planScope(row: PlanRow): DecisionScope {
  const parentIds = [
    row.versionId === null ? undefined : "versionId",
    row.commitId === null ? undefined : "commitId",
    row.commitFileId === null ? undefined : "commitFileId",
  ].filter((value) => value !== undefined);
  if (parentIds.length !== 1) {
    throw invariantFailed("Plan must have exactly one scope parent id.", { planId: row.id, parentIds });
  }

  if (row.scope === "version" && row.versionId !== null) {
    return { type: "version", versionId: row.versionId };
  }
  if (row.scope === "commit" && row.commitId !== null) {
    return { type: "commit", commitId: row.commitId };
  }
  if (row.scope === "commit_file" && row.commitFileId !== null) {
    return { type: "commit_file", commitFileId: row.commitFileId };
  }
  throw invariantFailed("Plan scope parent id does not match its scope.", { planId: row.id, scope: row.scope });
}

function nextPlanItemOrdinal(context: ServiceContext, planId: string): number {
  const last = listPlanItems(context.db, planId).at(-1);
  return last === undefined ? 1 : last.ordinal + 1;
}

function isIncompletePlanItem(item: PlanItemRow): boolean {
  return item.status === "todo" || item.status === "in_progress" || item.status === "blocked";
}

function toPlanDetail(context: ServiceContext, row: PlanRow): PlanDetail {
  return PlanDetailSchema.parse({
    id: row.id,
    scope: planScope(row),
    title: row.title,
    summary: row.summary ?? undefined,
    status: row.status,
    proposedBy: actorRef(row.proposedByActorType, row.proposedByActorId, row.proposedByDisplayName),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
    items: listPlanItems(context.db, row.id).map(toPlanItemDetail),
    linkedCommentIds: listPlanCommentLinks(context.db, row.id).map((link) => link.commentId),
    linkedDecisionIds: listPlanDecisionLinks(context.db, row.id).map((link) => link.decisionId),
    linkedDiffBlockIds: listPlanDiffBlockLinks(context.db, row.id).map((link) => link.diffBlockId),
    updatedAt: row.updatedAt ?? undefined,
    completedBy:
      row.completedByActorType === null
        ? undefined
        : actorRef(row.completedByActorType, row.completedByActorId, row.completedByDisplayName),
    completionNote: row.completionNote ?? undefined,
  });
}

function toPlanItemDetail(row: PlanItemRow): PlanItemDetail {
  return PlanItemDetailSchema.parse({
    id: row.id,
    planId: row.planId,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    blockingReason: row.blockingReason ?? undefined,
    commitFileId: row.commitFileId ?? undefined,
    decisionId: row.decisionId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
  });
}

function actorRef(type: ActorRef["type"], id: string | null, displayName: string | null): ActorRef {
  return {
    type,
    id: id ?? undefined,
    displayName: displayName ?? undefined,
  };
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
