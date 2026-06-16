import { PopulateNextVersionParamsSchema, PopulateNextVersionResponseSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

const PopulateNextVersionToolOutputSchema = PopulateNextVersionResponseSchema.extend({
  nextAction: NextActionSchema,
});

export const populateNextVersionTool = {
  name: "populate_next_version",
  title: "Populate next review version",
  description: "Ingest the next review version from repository refs through the version service.",
  inputSchema: PopulateNextVersionParamsSchema,
  outputSchema: PopulateNextVersionToolOutputSchema,
  async handler(context, input) {
    const response = await context.versions.populateNextVersion(input);
    return {
      ...response,
      nextAction: {
        tool: "list_remaining_commits",
        description: "Review the remaining commit queue for the populated version.",
      },
    };
  },
} satisfies PromptReviewMcpTool<
  typeof PopulateNextVersionParamsSchema._output,
  typeof PopulateNextVersionToolOutputSchema._output
>;
