import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import { ReviewScopeSchema } from "./scopes.js";
import { IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const ReviewPlanSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review plan."),
    scope: ReviewScopeSchema.describe("Review scope the plan belongs to."),
    bodyMarkdown: MarkdownStringSchema.describe("Markdown plan content."),
    createdBy: ActorRefSchema.describe("Human or agent that created the plan."),
    createdAt: IsoDateTimeSchema.describe("When the plan was created."),
    updatedBy: ActorRefSchema.optional().describe("Human or agent that last updated the plan."),
    updatedAt: IsoDateTimeSchema.optional().describe("When the plan was last updated."),
  })
  .strict()
  .describe("Markdown planning workspace for review follow-up work.");

export type ReviewPlan = z.infer<typeof ReviewPlanSchema>;
