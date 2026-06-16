import { and, asc, eq, inArray } from "drizzle-orm";
import type { DecisionScopeType, PlanItemStatus, PlanStatus } from "../domain/enums.js";
import { planComments, planDecisions, planDiffBlocks, planItems, plans } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import type { RepositoryDatabase } from "./database.js";

export type PlanRow = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PlanItemRow = typeof planItems.$inferSelect;
export type PlanItemInsert = typeof planItems.$inferInsert;
export type PlanCommentRow = typeof planComments.$inferSelect;
export type PlanCommentInsert = typeof planComments.$inferInsert;
export type PlanDecisionRow = typeof planDecisions.$inferSelect;
export type PlanDecisionInsert = typeof planDecisions.$inferInsert;
export type PlanDiffBlockRow = typeof planDiffBlocks.$inferSelect;
export type PlanDiffBlockInsert = typeof planDiffBlocks.$inferInsert;
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

export function findPlanById(db: RepositoryDatabase, id: string): PlanRow | undefined {
  return db.select().from(plans).where(eq(plans.id, id)).get();
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

export function listPlansByTarget(
  db: RepositoryDatabase,
  target: PlanTarget,
  filter: { status?: PlanStatus } = {},
): PlanRow[] {
  return db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.scope, target.scope),
        planTargetCondition(target),
        filter.status === undefined ? undefined : eq(plans.status, filter.status),
      ),
    )
    .orderBy(asc(plans.createdAt), asc(plans.id))
    .all();
}

export function addPlanCommentLink(db: RepositoryDatabase, values: PlanCommentInsert): PlanCommentRow {
  return db.insert(planComments).values(values).returning().get();
}

export function deletePlanCommentLinks(db: RepositoryDatabase, planId: string): PlanCommentRow[] {
  return db.delete(planComments).where(eq(planComments.planId, planId)).returning().all();
}

export function listPlanCommentLinks(db: RepositoryDatabase, planId: string): PlanCommentRow[] {
  return db
    .select()
    .from(planComments)
    .where(eq(planComments.planId, planId))
    .orderBy(asc(planComments.createdAt), asc(planComments.id))
    .all();
}

export function addPlanDecisionLink(db: RepositoryDatabase, values: PlanDecisionInsert): PlanDecisionRow {
  return db.insert(planDecisions).values(values).returning().get();
}

export function deletePlanDecisionLinks(db: RepositoryDatabase, planId: string): PlanDecisionRow[] {
  return db.delete(planDecisions).where(eq(planDecisions.planId, planId)).returning().all();
}

export function listPlanDecisionLinks(db: RepositoryDatabase, planId: string): PlanDecisionRow[] {
  return db
    .select()
    .from(planDecisions)
    .where(eq(planDecisions.planId, planId))
    .orderBy(asc(planDecisions.createdAt), asc(planDecisions.id))
    .all();
}

export function addPlanDiffBlockLink(db: RepositoryDatabase, values: PlanDiffBlockInsert): PlanDiffBlockRow {
  return db.insert(planDiffBlocks).values(values).returning().get();
}

export function deletePlanDiffBlockLinks(db: RepositoryDatabase, planId: string): PlanDiffBlockRow[] {
  return db.delete(planDiffBlocks).where(eq(planDiffBlocks.planId, planId)).returning().all();
}

export function listPlanDiffBlockLinks(db: RepositoryDatabase, planId: string): PlanDiffBlockRow[] {
  return db
    .select()
    .from(planDiffBlocks)
    .where(eq(planDiffBlocks.planId, planId))
    .orderBy(asc(planDiffBlocks.createdAt), asc(planDiffBlocks.id))
    .all();
}

export function createPlanItem(db: RepositoryDatabase, values: PlanItemInsert): PlanItemRow {
  return db.insert(planItems).values(values).returning().get();
}

export function findPlanItemById(db: RepositoryDatabase, id: string): PlanItemRow | undefined {
  return db.select().from(planItems).where(eq(planItems.id, id)).get();
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
