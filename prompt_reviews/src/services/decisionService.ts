import { z } from "zod";
import {
  DecisionDetailSchema,
  FinalizeDecisionParamsSchema,
  ProposeDecisionParamsSchema,
  UpdateDecisionParamsSchema,
  type ActorRef,
  type DecisionDetail,
  type DecisionScope,
  type FinalizeDecisionParams,
  type ProposeDecisionParams,
  type UpdateDecisionParams,
} from "../domain/schemas/index.js";
import {
  createDecision as createDecisionRow,
  findCommitById,
  findCommitFileById,
  findDecisionById,
  findVersionById,
  listDecisionsByTarget,
  updateDecision as updateDecisionRow,
  type DecisionInsert,
  type DecisionRow,
  type DecisionTarget,
} from "../repositories/index.js";
import { invariantFailed, notFound, validationFailed } from "./errors.js";
import { withServiceTransaction, type RootServiceContext, type ServiceContext } from "./serviceContext.js";
import { recomputeCommitStatus, recomputeFileStatus, recomputeVersionStatus } from "./statusService.js";

export type DecisionService = {
  proposeDecision: (params: unknown) => DecisionDetail;
  updateDecision: (params: unknown) => DecisionDetail;
  finalizeDecision: (params: unknown) => DecisionDetail;
  supersedeDecision: (params: unknown) => DecisionDetail;
};

export function createDecisionService(context: RootServiceContext): DecisionService {
  return {
    proposeDecision: (params) => proposeDecision(context, params),
    updateDecision: (params) => updateDecision(context, params),
    finalizeDecision: (params) => finalizeDecision(context, params),
    supersedeDecision: (params) => supersedeDecision(context, params),
  };
}

export function proposeDecision(context: RootServiceContext, params: unknown): DecisionDetail {
  const command = parseParams(ProposeDecisionParamsSchema, params, "Invalid propose decision params.");
  return withServiceTransaction(context, (txContext) => proposeDecisionInTransaction(txContext, command));
}

export function updateDecision(context: RootServiceContext, params: unknown): DecisionDetail {
  const command = parseParams(UpdateDecisionParamsSchema, params, "Invalid update decision params.");
  return withServiceTransaction(context, (txContext) => updateDecisionInTransaction(txContext, command));
}

export function finalizeDecision(context: RootServiceContext, params: unknown): DecisionDetail {
  assertRawHumanActor(params, "finalizer", "Only human actors may finalize decisions.");
  const command = parseParams(FinalizeDecisionParamsSchema, params, "Invalid finalize decision params.");
  return withServiceTransaction(context, (txContext) => finalizeDecisionInTransaction(txContext, command));
}

export function supersedeDecision(context: RootServiceContext, params: unknown): DecisionDetail {
  assertRawHumanActor(params, "finalizer", "Only human actors may finalize decisions.");
  const command = parseParams(FinalizeDecisionParamsSchema, params, "Invalid supersede decision params.");
  if (command.status !== "superseded") {
    throw validationFailed("supersedeDecision only supports superseded finalization.", { status: command.status });
  }
  return withServiceTransaction(context, (txContext) => finalizeDecisionInTransaction(txContext, command));
}

function proposeDecisionInTransaction(context: ServiceContext, command: ProposeDecisionParams): DecisionDetail {
  validateScopeParent(context, command.scope);

  const now = context.now();
  const row = createDecisionRow(context.db, {
    ...scopeColumns(command.scope),
    status: "proposed",
    outcome: command.outcome,
    rationale: command.rationale,
    proposedByActorType: command.proposedBy.type,
    proposedByActorId: command.proposedBy.id ?? null,
    proposedByDisplayName: command.proposedBy.displayName ?? null,
    riskLevel: command.riskLevel ?? null,
    confidence: command.confidence ?? null,
    createdAt: now,
    updatedAt: now,
  });

  refreshAffectedStatus(context, row);
  return toDecisionDetail(row);
}

function updateDecisionInTransaction(context: ServiceContext, command: UpdateDecisionParams): DecisionDetail {
  const existing = findRequiredDecision(context, command.decisionId);
  assertStoredDecisionInvariant(context, existing);
  if (existing.status !== "proposed") {
    throw invariantFailed("Only proposed decisions can be updated.", { decisionId: existing.id, status: existing.status });
  }

  const updated = updateDecisionRow(context.db, existing.id, {
    outcome: command.outcome,
    rationale: command.rationale,
    riskLevel: command.riskLevel,
    confidence: command.confidence,
    updatedAt: context.now(),
  });
  if (updated === undefined) {
    throw notFound("decision", existing.id);
  }

  refreshAffectedStatus(context, updated);
  return toDecisionDetail(updated);
}

function finalizeDecisionInTransaction(context: ServiceContext, command: FinalizeDecisionParams): DecisionDetail {
  if (command.finalizer.type !== "human") {
    throw invariantFailed("Only human actors may finalize decisions.", { decisionId: command.decisionId });
  }

  const existing = findRequiredDecision(context, command.decisionId);
  assertStoredDecisionInvariant(context, existing);
  if (command.status === "accepted") {
    assertNoOtherAcceptedDecision(context, existing);
  }

  const now = context.now();
  const updated = updateDecisionRow(context.db, existing.id, {
    status: command.status,
    rationale: command.rationale ?? existing.rationale,
    finalizedByActorType: command.finalizer.type,
    finalizedByActorId: command.finalizer.id ?? null,
    finalizedByDisplayName: command.finalizer.displayName ?? null,
    finalizedAt: now,
    updatedAt: now,
  });
  if (updated === undefined) {
    throw notFound("decision", existing.id);
  }

  refreshAffectedStatus(context, updated);
  return toDecisionDetail(updated);
}

function assertNoOtherAcceptedDecision(context: ServiceContext, row: DecisionRow): void {
  const target = decisionTarget(row);
  const accepted = listDecisionsByTarget(context.db, target, ["accepted"]).filter((decision) => decision.id !== row.id);
  if (accepted.length > 0) {
    throw invariantFailed("Only one accepted non-superseded decision is allowed per target.", {
      decisionId: row.id,
      target,
      acceptedDecisionId: accepted[0].id,
    });
  }
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

function scopeColumns(
  scope: DecisionScope,
): Pick<DecisionInsert, "scope" | "versionId" | "commitId" | "commitFileId"> {
  if (scope.type === "version") {
    return { scope: "version", versionId: scope.versionId, commitId: null, commitFileId: null };
  }
  if (scope.type === "commit") {
    return { scope: "commit", versionId: null, commitId: scope.commitId, commitFileId: null };
  }
  return { scope: "commit_file", versionId: null, commitId: null, commitFileId: scope.commitFileId };
}

function refreshAffectedStatus(context: ServiceContext, row: DecisionRow): void {
  const scope = decisionScope(row);
  if (scope.type === "version") {
    recomputeVersionStatus(context, scope.versionId);
  } else if (scope.type === "commit") {
    recomputeCommitStatus(context, scope.commitId);
  } else {
    recomputeFileStatus(context, scope.commitFileId);
  }
}

function findRequiredDecision(context: ServiceContext, decisionId: string): DecisionRow {
  const decision = findDecisionById(context.db, decisionId);
  if (decision === undefined) {
    throw notFound("decision", decisionId);
  }
  return decision;
}

function assertStoredDecisionInvariant(context: ServiceContext, row: DecisionRow): void {
  validateScopeParent(context, decisionScope(row));
}

function decisionTarget(row: DecisionRow): DecisionTarget {
  const scope = decisionScope(row);
  if (scope.type === "version") {
    return { scope: "version", targetId: scope.versionId };
  }
  if (scope.type === "commit") {
    return { scope: "commit", targetId: scope.commitId };
  }
  return { scope: "commit_file", targetId: scope.commitFileId };
}

function decisionScope(row: DecisionRow): DecisionScope {
  const parentIds = [
    row.versionId === null ? undefined : "versionId",
    row.commitId === null ? undefined : "commitId",
    row.commitFileId === null ? undefined : "commitFileId",
  ].filter((value) => value !== undefined);
  if (parentIds.length !== 1) {
    throw invariantFailed("Decision must have exactly one scope parent id.", { decisionId: row.id, parentIds });
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
  throw invariantFailed("Decision scope parent id does not match its scope.", { decisionId: row.id, scope: row.scope });
}

function toDecisionDetail(row: DecisionRow): DecisionDetail {
  return DecisionDetailSchema.parse({
    id: row.id,
    scope: decisionScope(row),
    status: row.status,
    outcome: row.outcome,
    rationale: row.rationale,
    proposedBy: actorRef(row.proposedByActorType, row.proposedByActorId, row.proposedByDisplayName),
    finalizedBy:
      row.finalizedByActorType === null
        ? undefined
        : actorRef(row.finalizedByActorType, row.finalizedByActorId, row.finalizedByDisplayName),
    createdAt: row.createdAt,
    finalizedAt: row.finalizedAt ?? undefined,
    riskLevel: row.riskLevel ?? undefined,
    confidence: row.confidence ?? undefined,
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

function assertRawHumanActor(params: unknown, actorKey: string, message: string): void {
  if (params === null || typeof params !== "object" || !(actorKey in params)) {
    return;
  }
  const actor = (params as Record<string, unknown>)[actorKey];
  if (actor === null || typeof actor !== "object" || !("type" in actor)) {
    return;
  }
  if ((actor as Record<string, unknown>).type !== "human") {
    throw invariantFailed(message, { actorType: (actor as Record<string, unknown>).type });
  }
}

function parseParams<T>(schema: z.ZodType<T>, params: unknown, message: string): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationFailed(message, { issues: parsed.error.issues });
  }
  return parsed.data;
}
