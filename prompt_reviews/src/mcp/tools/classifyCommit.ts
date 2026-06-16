import { ClassifyCommitParamsSchema, ClassificationViewSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ClassifyCommitToolOutputSchema = ClassificationViewSchema.extend({
  nextAction: NextActionSchema,
});

export const classifyCommitTool = {
  name: "classify_commit",
  title: "Classify commit",
  description: "Classify a commit through the shared classification service.",
  inputSchema: ClassifyCommitParamsSchema,
  outputSchema: ClassifyCommitToolOutputSchema,
  handler(context, input) {
    return {
      ...context.classification.classifyCommit(input),
      nextAction: {
        tool: "list_missing_decisions",
        description: "After classification, check whether this version has targets needing human decisions.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ClassifyCommitParamsSchema._output, typeof ClassifyCommitToolOutputSchema._output>;
