import type { DecisionSummary } from "../../domain/schemas/index.js";
import { listDecisionsByTarget, type DecisionRow } from "../../repositories/index.js";
import { invariantFailed } from "../errors.js";
import type { ServiceContext } from "../serviceContext.js";
import { actorRef, decisionScope } from "./shared.js";

export type DecisionViewTarget = {
  scope: "version" | "commit" | "commit_file";
  targetId: string;
};

export function targetDecisions(context: ServiceContext, target: DecisionViewTarget): DecisionRow[] {
  return listDecisionsByTarget(context.db, target);
}

export function hasAcceptedHumanDecision(context: ServiceContext, target: DecisionViewTarget): boolean {
  return listDecisionsByTarget(context.db, target, ["accepted"]).some((decision) => decision.finalizedByActorType === "human");
}

export function toDecisionSummary(row: DecisionRow): DecisionSummary {
  return {
    id: row.id,
    scope: decisionScope(row),
    status: row.status,
    outcome: row.outcome,
    rationale: row.rationale,
    proposedBy: actorRef(row.proposedByActorType, row.proposedByActorId, row.proposedByDisplayName),
    finalizedBy: finalizedByActor(row),
    createdAt: row.createdAt,
    finalizedAt: row.finalizedAt ?? undefined,
  };
}

function finalizedByActor(row: DecisionRow): DecisionSummary["finalizedBy"] {
  if (row.finalizedByActorType === null) {
    return undefined;
  }
  if (row.finalizedByActorType !== "human") {
    throw invariantFailed("Finalized decisions must be finalized by a human actor.", { decisionId: row.id });
  }
  return {
    type: "human",
    id: row.finalizedByActorId ?? undefined,
    displayName: row.finalizedByDisplayName ?? undefined,
  };
}
