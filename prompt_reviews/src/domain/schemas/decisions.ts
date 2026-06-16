import { z } from "zod";
import { confidenceLevels, decisionOutcomes, decisionStatuses, finalDecisionStatuses, riskLevels } from "../enums.js";
import { ActorRefSchema, HumanActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, UnixSecondsSchema } from "./actors.js";
import { DecisionScopeSchema } from "./scopes.js";

export const DecisionOutcomeSchema = z.enum(decisionOutcomes);
export const DecisionStatusSchema = z.enum(decisionStatuses);
export const FinalDecisionStatusSchema = z.enum(finalDecisionStatuses);
export const RiskLevelSchema = z.enum(riskLevels);
export const ConfidenceLevelSchema = z.enum(confidenceLevels);

export const ProposeDecisionParamsSchema = z
  .object({
    scope: DecisionScopeSchema,
    outcome: DecisionOutcomeSchema,
    rationale: NonEmptyTextSchema,
    proposedBy: ActorRefSchema,
    riskLevel: RiskLevelSchema.optional(),
    confidence: ConfidenceLevelSchema.optional(),
  })
  .strict();

export const UpdateDecisionParamsSchema = z
  .object({
    decisionId: IdSchema,
    outcome: DecisionOutcomeSchema.optional(),
    rationale: OptionalTextSchema,
    riskLevel: RiskLevelSchema.optional(),
    confidence: ConfidenceLevelSchema.optional(),
    actor: ActorRefSchema,
  })
  .strict();

export const FinalizeDecisionParamsSchema = z
  .object({
    decisionId: IdSchema,
    status: FinalDecisionStatusSchema,
    finalizer: HumanActorRefSchema,
    rationale: OptionalTextSchema,
  })
  .strict();

export const DecisionSummarySchema = z
  .object({
    id: IdSchema,
    scope: DecisionScopeSchema,
    status: DecisionStatusSchema,
    outcome: DecisionOutcomeSchema,
    rationale: NonEmptyTextSchema,
    proposedBy: ActorRefSchema,
    finalizedBy: HumanActorRefSchema.optional(),
    createdAt: UnixSecondsSchema,
    finalizedAt: UnixSecondsSchema.optional(),
  })
  .strict();

export const DecisionDetailSchema = DecisionSummarySchema.extend({
  riskLevel: RiskLevelSchema.optional(),
  confidence: ConfidenceLevelSchema.optional(),
  updatedAt: UnixSecondsSchema.optional(),
});

export type ProposeDecisionParams = z.infer<typeof ProposeDecisionParamsSchema>;
export type UpdateDecisionParams = z.infer<typeof UpdateDecisionParamsSchema>;
export type FinalizeDecisionParams = z.infer<typeof FinalizeDecisionParamsSchema>;
export type DecisionSummary = z.infer<typeof DecisionSummarySchema>;
export type DecisionDetail = z.infer<typeof DecisionDetailSchema>;
