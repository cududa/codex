import { ClassifyFileParamsSchema, ClassificationViewSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ClassifyFileToolOutputSchema = ClassificationViewSchema.extend({
  nextAction: NextActionSchema,
});

export const classifyFileTool = {
  name: "classify_file",
  title: "Classify file",
  description: "Classify a commit file through the shared classification service.",
  inputSchema: ClassifyFileParamsSchema,
  outputSchema: ClassifyFileToolOutputSchema,
  handler(context, input) {
    return {
      ...context.classification.classifyFile(input),
      nextAction: {
        tool: "propose_decision",
        description: "Propose an agent recommendation for human finalization when the file needs a decision.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ClassifyFileParamsSchema._output, typeof ClassifyFileToolOutputSchema._output>;
