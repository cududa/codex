import { z } from "zod";
import {
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  DecisionDetailSchema,
  FinalizeDecisionParamsSchema,
  IdSchema,
  ProposeDecisionParamsSchema,
} from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const DecisionToolOutputSchema = DecisionDetailSchema.extend({
  nextAction: NextActionSchema,
});

export const ListMissingDecisionsInputSchema = z
  .object({
    versionId: IdSchema,
    target: z.enum(["commit", "file"]).optional().default("file"),
  })
  .strict();

export const ListMissingDecisionsToolOutputSchema = z
  .object({
    target: z.enum(["commit", "file"]),
    data: z.array(z.union([CommitQueueItemSchema, CommitFileQueueItemSchema])),
    nextAction: NextActionSchema,
  })
  .strict();

const proposeDecisionTool = {
  name: "propose_decision",
  title: "Propose decision",
  description: "Create an agent or human decision proposal through the decision service.",
  inputSchema: ProposeDecisionParamsSchema,
  outputSchema: DecisionToolOutputSchema,
  handler(context, input) {
    return {
      ...context.decisions.proposeDecision(input),
      nextAction: {
        tool: "finalize_decision",
        description: "Ask a human reviewer to finalize the proposed decision when ready.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ProposeDecisionParamsSchema._output, typeof DecisionToolOutputSchema._output>;

const finalizeDecisionTool = {
  name: "finalize_decision",
  title: "Finalize decision",
  description: "Finalize a proposed decision; the boundary contract requires a human finalizer.",
  inputSchema: FinalizeDecisionParamsSchema,
  outputSchema: DecisionToolOutputSchema,
  handler(context, input) {
    return {
      ...context.decisions.finalizeDecision(input),
      nextAction: {
        tool: "list_missing_decisions",
        description: "Check for remaining targets that still need human-final decisions.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof FinalizeDecisionParamsSchema._output, typeof DecisionToolOutputSchema._output>;

const listMissingDecisionsTool = {
  name: "list_missing_decisions",
  title: "List missing decisions",
  description: "List tagged commits or files that still need accepted human decisions.",
  inputSchema: ListMissingDecisionsInputSchema,
  outputSchema: ListMissingDecisionsToolOutputSchema,
  handler(context, input) {
    const response = context.read.listMissingDecisions(input);
    return {
      ...response,
      nextAction: {
        tool: response.data[0] === undefined ? "list_open_comments" : "propose_decision",
        description:
          response.data[0] === undefined
            ? "Check open comments after decisions are complete."
            : "Propose a decision for the first target in the missing-decision queue.",
      },
    };
  },
} satisfies PromptReviewMcpTool<
  typeof ListMissingDecisionsInputSchema._output,
  typeof ListMissingDecisionsToolOutputSchema._output
>;

export const decisionsTools = [proposeDecisionTool, finalizeDecisionTool, listMissingDecisionsTool];
