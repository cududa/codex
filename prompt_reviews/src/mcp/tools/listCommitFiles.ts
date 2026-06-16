import { z } from "zod";
import { CommitFileQueueItemSchema, IdSchema, paginatedResponseSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ListCommitFilesInputSchema = z
  .object({
    commitId: IdSchema,
    remaining: z.boolean().optional().default(true),
  })
  .strict();

export const ListCommitFilesToolOutputSchema = paginatedResponseSchema(CommitFileQueueItemSchema).extend({
  nextAction: NextActionSchema,
});

export const listCommitFilesTool = {
  name: "list_commit_files",
  title: "List commit files",
  description: "List structured file queue entries for a commit.",
  inputSchema: ListCommitFilesInputSchema,
  outputSchema: ListCommitFilesToolOutputSchema,
  handler(context, input) {
    const page = context.read.listCommitFiles(input);
    const firstFile = page.data[0];
    return {
      ...page,
      nextAction: {
        tool: firstFile === undefined ? "classify_commit" : "get_file_review",
        description:
          firstFile === undefined
            ? "Classify the commit after its file queue is reviewed."
            : "Open the structured file review, including diff blocks.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ListCommitFilesInputSchema._output, typeof ListCommitFilesToolOutputSchema._output>;
