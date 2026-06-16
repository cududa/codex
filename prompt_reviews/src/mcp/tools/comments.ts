import { z } from "zod";
import {
  AddCommentParamsSchema,
  CommentDetailSchema,
  IdSchema,
  ResolveCommentParamsSchema,
} from "../../domain/schemas/index.js";
import { NextActionSchema } from "../format.js";
import type { PromptReviewMcpTool } from "../server.js";

export const AddCommentToolOutputSchema = CommentDetailSchema.extend({
  nextAction: NextActionSchema,
});

export const ResolveCommentToolOutputSchema = CommentDetailSchema.extend({
  nextAction: NextActionSchema,
});

export const ListOpenCommentsInputSchema = z
  .object({
    versionId: IdSchema.optional(),
    commitId: IdSchema.optional(),
    commitFileId: IdSchema.optional(),
  })
  .strict()
  .refine((query) => [query.versionId, query.commitId, query.commitFileId].filter(Boolean).length <= 1, {
    message: "Provide at most one comment scope filter.",
  });

export const ListOpenCommentsToolOutputSchema = z
  .object({
    comments: z.array(CommentDetailSchema),
    nextAction: NextActionSchema,
  })
  .strict();

const addCommentTool = {
  name: "add_comment",
  title: "Add comment",
  description: "Add a structured comment using a domain scope and source anchor.",
  inputSchema: AddCommentParamsSchema,
  outputSchema: AddCommentToolOutputSchema,
  handler(context, input) {
    return {
      ...context.comments.addComment(input),
      nextAction: {
        tool: "propose_decision",
        description: "Propose a decision or create a plan if the comment identifies review work.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof AddCommentParamsSchema._output, typeof AddCommentToolOutputSchema._output>;

const resolveCommentTool = {
  name: "resolve_comment",
  title: "Resolve comment",
  description: "Resolve or otherwise close a structured comment through the comment service.",
  inputSchema: ResolveCommentParamsSchema,
  outputSchema: ResolveCommentToolOutputSchema,
  handler(context, input) {
    return {
      ...context.comments.resolveComment(input),
      nextAction: {
        tool: "list_open_comments",
        description: "Check for additional open comments in the same review scope.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ResolveCommentParamsSchema._output, typeof ResolveCommentToolOutputSchema._output>;

const listOpenCommentsTool = {
  name: "list_open_comments",
  title: "List open comments",
  description: "List open structured comments, optionally filtered to one version, commit, or file.",
  inputSchema: ListOpenCommentsInputSchema,
  outputSchema: ListOpenCommentsToolOutputSchema,
  handler(context, input) {
    return {
      comments: context.read.listComments({ ...input, status: "open" }),
      nextAction: {
        tool: "resolve_comment",
        description: "Resolve comments that no longer block the review.",
      },
    };
  },
} satisfies PromptReviewMcpTool<typeof ListOpenCommentsInputSchema._output, typeof ListOpenCommentsToolOutputSchema._output>;

export const commentsTools = [addCommentTool, resolveCommentTool, listOpenCommentsTool];
