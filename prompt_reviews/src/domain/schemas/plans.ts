import { z } from "zod";
import { planItemStatuses, planStatuses } from "../enums.js";
import { ActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, UnixSecondsSchema } from "./actors.js";
import { DecisionScopeSchema } from "./scopes.js";

export const PlanStatusSchema = z.enum(planStatuses);
export const PlanItemStatusSchema = z.enum(planItemStatuses);

const PlanEditableFieldsSchema = z
  .object({
    title: NonEmptyTextSchema,
    summary: OptionalTextSchema,
  })
  .strict();

const PlanLinkFieldsSchema = z
  .object({
    commentIds: z.array(IdSchema).optional(),
    decisionIds: z.array(IdSchema).optional(),
  })
  .strict();

const PlanItemEditableFieldsSchema = z
  .object({
    title: NonEmptyTextSchema,
    description: OptionalTextSchema,
    status: PlanItemStatusSchema,
    blockingReason: OptionalTextSchema,
    commitFileId: IdSchema.optional(),
    decisionId: IdSchema.optional(),
  })
  .strict();

export const CreatePlanParamsSchema = PlanEditableFieldsSchema.merge(PlanLinkFieldsSchema).extend({
  scope: DecisionScopeSchema,
  proposedBy: ActorRefSchema,
});

export const UpdatePlanParamsSchema = PlanEditableFieldsSchema.merge(PlanLinkFieldsSchema).partial().extend({
  planId: IdSchema,
  status: PlanStatusSchema.optional(),
  actor: ActorRefSchema,
});

export const CreatePlanItemParamsSchema = PlanItemEditableFieldsSchema.pick({
  title: true,
  description: true,
  commitFileId: true,
  decisionId: true,
}).extend({
  planId: IdSchema,
  actor: ActorRefSchema,
});

export const UpdatePlanItemParamsSchema = PlanItemEditableFieldsSchema.partial().extend({
  planItemId: IdSchema,
  actor: ActorRefSchema,
});

export const CompletePlanParamsSchema = z
  .object({
    planId: IdSchema,
    completedBy: ActorRefSchema,
    completionNote: OptionalTextSchema,
  })
  .strict();

export const PlanItemDetailSchema = PlanItemEditableFieldsSchema.extend({
  id: IdSchema,
  planId: IdSchema,
  createdAt: UnixSecondsSchema,
  updatedAt: UnixSecondsSchema.optional(),
});

export const PlanSummarySchema = PlanEditableFieldsSchema.extend({
  id: IdSchema,
  scope: DecisionScopeSchema,
  status: PlanStatusSchema,
  proposedBy: ActorRefSchema,
  createdAt: UnixSecondsSchema,
  completedAt: UnixSecondsSchema.optional(),
});

export const PlanDetailSchema = PlanSummarySchema.extend({
  items: z.array(PlanItemDetailSchema),
  linkedCommentIds: z.array(IdSchema),
  linkedDecisionIds: z.array(IdSchema),
  updatedAt: UnixSecondsSchema.optional(),
  completedBy: ActorRefSchema.optional(),
  completionNote: OptionalTextSchema,
});

export type CreatePlanParams = z.infer<typeof CreatePlanParamsSchema>;
export type UpdatePlanParams = z.infer<typeof UpdatePlanParamsSchema>;
export type CreatePlanItemParams = z.infer<typeof CreatePlanItemParamsSchema>;
export type UpdatePlanItemParams = z.infer<typeof UpdatePlanItemParamsSchema>;
export type CompletePlanParams = z.infer<typeof CompletePlanParamsSchema>;
export type PlanSummary = z.infer<typeof PlanSummarySchema>;
export type PlanDetail = z.infer<typeof PlanDetailSchema>;
export type PlanItemDetail = z.infer<typeof PlanItemDetailSchema>;
