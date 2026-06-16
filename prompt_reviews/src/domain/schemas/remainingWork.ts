import { z } from "zod";
import { nextActionKinds, remainingWorkKinds } from "../enums.js";
import { CountSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema } from "./actors.js";
import { CommentSummarySchema } from "./comments.js";
import { DecisionSummarySchema } from "./decisions.js";
import { PlanSummarySchema } from "./plans.js";

export const RemainingWorkKindSchema = z.enum(remainingWorkKinds);
export const NextActionKindSchema = z.enum(nextActionKinds);

export const NextActionHintSchema = z
  .object({
    type: NextActionKindSchema,
    label: NonEmptyTextSchema,
    targetId: IdSchema.optional(),
    reason: OptionalTextSchema,
  })
  .strict();

export const RemainingWorkSchema = z
  .object({
    kind: RemainingWorkKindSchema,
    label: NonEmptyTextSchema,
    count: CountSchema,
    targetIds: z.array(IdSchema),
    blockingComments: z.array(CommentSummarySchema),
    pendingDecisions: z.array(DecisionSummarySchema),
    incompletePlans: z.array(PlanSummarySchema),
    nextActions: z.array(NextActionHintSchema),
  })
  .strict();

export type NextActionHint = z.infer<typeof NextActionHintSchema>;
export type RemainingWork = z.infer<typeof RemainingWorkSchema>;
