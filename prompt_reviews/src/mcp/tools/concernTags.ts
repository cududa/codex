import { z } from "zod";
import { ConcernTagViewSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ListConcernTagsInputSchema = z.object({}).strict();

export const ListConcernTagsToolOutputSchema = z
  .object({
    tags: z.array(ConcernTagViewSchema),
    nextAction: NextActionSchema,
  })
  .strict();

export const listConcernTagsTool = {
  name: "list_concern_tags",
  title: "List concern tags",
  description: "List active concern tags for classification commands.",
  inputSchema: ListConcernTagsInputSchema,
  outputSchema: ListConcernTagsToolOutputSchema,
  handler(context) {
    return {
      tags: context.read.listConcernTags(),
      nextAction: {
        tool: "classify_file",
        description: "Use one tag slug as the primary classification for a reviewed file.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ListConcernTagsInputSchema._output, typeof ListConcernTagsToolOutputSchema._output>;
