import { and, asc, eq, inArray } from "drizzle-orm";
import type { DecisionScopeType, PlanItemStatus, PlanStatus } from "../domain/enums.js";
import { planItems, plans } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import type { RepositoryDatabase } from "./database.js";

export type PlanRow = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PlanItemRow = typeof planItems.$inferSelect;
export type PlanItemInsert = typeof planItems.$inferInsert;
export type PlanTarget = {
  scope: DecisionScopeType;
  targetId: string;
};

const incompleteAcceptedPlanItemStatuses = [
  "todo",
  "in_progress",
  "blocked",
] as const satisfies readonly PlanItemStatus[];

export function createPlan(db: RepositoryDatabase, values: PlanInsert): PlanRow {
  return db.insert(plans).values(values).returning().get();
}

export type PlanUpdate = Partial<
  Pick<
    PlanRow,
    | "title"
    | "summary"
    | "status"
    | "completedByActorType"
    | "completedByActorId"
    | "completedByDisplayName"
    | "completionNote"
    | "updatedAt"
    | "completedAt"
  >
>;

export function updatePlan(db: RepositoryDatabase, id: string, values: PlanUpdate): PlanRow | undefined {
  return db
    .update(plans)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(plans.id, id))
    .returning()
    .get();
}

export function listPlans(
  db: RepositoryDatabase,
  filter: { scope?: DecisionScopeType; status?: PlanStatus } = {},
): PlanRow[] {
  const scopeCondition = filter.scope === undefined ? undefined : eq(plans.scope, filter.scope);
  const statusCondition = filter.status === undefined ? undefined : eq(plans.status, filter.status);

  return db
    .select()
    .from(plans)
    .where(and(scopeCondition, statusCondition))
    .orderBy(asc(plans.createdAt), asc(plans.id))
    .all();
}

export function createPlanItem(db: RepositoryDatabase, values: PlanItemInsert): PlanItemRow {
  return db.insert(planItems).values(values).returning().get();
}

export function listPlanItems(db: RepositoryDatabase, planId: string): PlanItemRow[] {
  return db.select().from(planItems).where(eq(planItems.planId, planId)).orderBy(asc(planItems.ordinal)).all();
}

export type PlanItemUpdate = Partial<
  Pick<
    PlanItemRow,
    "title" | "description" | "status" | "blockingReason" | "commitFileId" | "decisionId" | "updatedAt"
  >
>;

export function updatePlanItem(db: RepositoryDatabase, id: string, values: PlanItemUpdate): PlanItemRow | undefined {
  return db
    .update(planItems)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(planItems.id, id))
    .returning()
    .get();
}

export function deletePlanItem(db: RepositoryDatabase, id: string): PlanItemRow[] {
  return db.delete(planItems).where(eq(planItems.id, id)).returning().all();
}

export function listIncompleteAcceptedPlanItemsByTarget(
  db: RepositoryDatabase,
  target: PlanTarget,
): { plan: PlanRow; item: PlanItemRow }[] {
  return db
    .select({ plan: plans, item: planItems })
    .from(planItems)
    .innerJoin(plans, eq(plans.id, planItems.planId))
    .where(
      and(
        eq(plans.status, "accepted"),
        planTargetCondition(target),
        inArray(planItems.status, incompleteAcceptedPlanItemStatuses),
      ),
    )
    .orderBy(asc(plans.createdAt), asc(planItems.ordinal))
    .all();
}

function planTargetCondition(target: PlanTarget) {
  if (target.scope === "version") {
    return eq(plans.versionId, target.targetId);
  }
  if (target.scope === "commit") {
    return eq(plans.commitId, target.targetId);
  }
  return eq(plans.commitFileId, target.targetId);
}
