import { PlanSummarySchema, type PlanSummary } from "../../domain/schemas/index.js";
import { listPlansByTarget, type PlanRow } from "../../repositories/index.js";
import type { ServiceContext } from "../serviceContext.js";
import { actorRef, planScope } from "./shared.js";

export type PlanViewTarget = {
  scope: "version" | "commit" | "commit_file";
  targetId: string;
};

export function targetPlans(context: ServiceContext, target: PlanViewTarget): PlanRow[] {
  return listPlansByTarget(context.db, target);
}

export function toPlanSummary(row: PlanRow): PlanSummary {
  return PlanSummarySchema.parse({
    id: row.id,
    scope: planScope(row),
    title: row.title,
    summary: row.summary ?? undefined,
    status: row.status,
    proposedBy: actorRef(row.proposedByActorType, row.proposedByActorId, row.proposedByDisplayName),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  });
}
