import { z } from "zod";
import { CommitFileDetailSchema, IdSchema } from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const GetFileReviewInputSchema = z
  .object({
    commitFileId: IdSchema,
  })
  .strict();

export const GetFileReviewToolOutputSchema = z
  .object({
    file: CommitFileDetailSchema,
    nextAction: NextActionSchema,
  })
  .strict();

export const getFileReviewTool = {
  name: "get_file_review",
  title: "Get file review",
  description: "Return structured file detail, review metadata, and diff blocks.",
  inputSchema: GetFileReviewInputSchema,
  outputSchema: GetFileReviewToolOutputSchema,
  handler(context, input) {
    return {
      file: context.read.getCommitFileDetail(input.commitFileId),
      nextAction: {
        tool: "classify_file",
        description: "Classify this file using an active concern tag, then propose any needed decision.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof GetFileReviewInputSchema._output, typeof GetFileReviewToolOutputSchema._output>;
