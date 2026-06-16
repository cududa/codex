import {
  CompletePlanParamsSchema,
  CreatePlanParamsSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  UpdatePlanItemParamsSchema,
  UpdatePlanParamsSchema,
} from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const PlanToolOutputSchema = PlanDetailSchema.extend({
  nextAction: NextActionSchema,
});

export const PlanItemToolOutputSchema = PlanItemDetailSchema.extend({
  nextAction: NextActionSchema,
});

const createPlanTool = {
  name: "create_plan",
  title: "Create plan",
  description: "Create a structured review plan through the plan service.",
  inputSchema: CreatePlanParamsSchema,
  outputSchema: PlanToolOutputSchema,
  handler(context, input) {
    return {
      ...context.plans.createPlan(input),
      nextAction: {
        tool: "update_plan_item",
        description: "Update plan items as follow-up work progresses.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof CreatePlanParamsSchema._output, typeof PlanToolOutputSchema._output>;

const updatePlanTool = {
  name: "update_plan",
  title: "Update plan",
  description: "Update plan metadata, status, and structured links through the plan service.",
  inputSchema: UpdatePlanParamsSchema,
  outputSchema: PlanToolOutputSchema,
  handler(context, input) {
    return {
      ...context.plans.updatePlan(input),
      nextAction: {
        tool: "complete_plan",
        description: "Complete the plan when all plan items are finished.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof UpdatePlanParamsSchema._output, typeof PlanToolOutputSchema._output>;

const updatePlanItemTool = {
  name: "update_plan_item",
  title: "Update plan item",
  description: "Update a structured plan item through the plan service.",
  inputSchema: UpdatePlanItemParamsSchema,
  outputSchema: PlanItemToolOutputSchema,
  handler(context, input) {
    return {
      ...context.plans.updatePlanItem(input),
      nextAction: {
        tool: "complete_plan",
        description: "Complete the parent plan once every item is complete.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof UpdatePlanItemParamsSchema._output, typeof PlanItemToolOutputSchema._output>;

const completePlanTool = {
  name: "complete_plan",
  title: "Complete plan",
  description: "Complete a structured review plan through the plan service.",
  inputSchema: CompletePlanParamsSchema,
  outputSchema: PlanToolOutputSchema,
  handler(context, input) {
    return {
      ...context.plans.completePlan(input),
      nextAction: {
        tool: "list_remaining_commits",
        description: "Return to the remaining review queue after plan completion.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof CompletePlanParamsSchema._output, typeof PlanToolOutputSchema._output>;

export const plansTools = [createPlanTool, updatePlanTool, updatePlanItemTool, completePlanTool];
