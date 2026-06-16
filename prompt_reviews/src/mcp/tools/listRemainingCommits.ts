import { z } from "zod";
import { CommitQueueItemSchema, IdSchema, paginatedResponseSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const ListRemainingCommitsInputSchema = z
  .object({
    versionId: IdSchema,
    cursor: IdSchema.nullable().optional(),
    limit: z.number().int().positive().optional(),
  })
  .strict();

export const ListRemainingCommitsToolOutputSchema = paginatedResponseSchema(CommitQueueItemSchema).extend({
  nextAction: NextActionSchema,
});

export const listRemainingCommitsTool = {
  name: "list_remaining_commits",
  title: "List remaining commits",
  description: "Return the remaining commit review queue for a version.",
  inputSchema: ListRemainingCommitsInputSchema,
  outputSchema: ListRemainingCommitsToolOutputSchema,
  handler(context, input) {
    const page = context.queue.listRemainingCommits(input);
    const firstCommit = page.data[0];
    return {
      ...page,
      nextAction: {
        tool: firstCommit === undefined ? "list_missing_decisions" : "list_commit_files",
        description:
          firstCommit === undefined
            ? "Check whether tagged work is waiting for human decisions."
            : "List remaining files for the next commit in the queue.",
      },
    };
  },
} satisfies PromptReviewMcpTool<
  typeof ListRemainingCommitsInputSchema._output,
  typeof ListRemainingCommitsToolOutputSchema._output
>;
