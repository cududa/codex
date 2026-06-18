import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import { ReviewAnchorSchema, ReviewScopeSchema } from "./scopes.js";
import { IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const ThreadedCommentStateSchema = z
  .enum(["open", "resolved"])
  .describe("Whether a threaded comment still blocks approval.");

export const ThreadedCommentReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this comment."),
    scope: ReviewScopeSchema.describe("Review scope the comment belongs to."),
    anchor: ReviewAnchorSchema.describe("Precise location of the comment within the scope."),
    threadId: IdSchema.describe("Identifier shared by all comments in the same thread."),
    parentCommentId: IdSchema.nullable().describe("Parent comment for replies; null for the thread root."),
    bodyMarkdown: MarkdownStringSchema.describe("Comment body supplied by a human or agent."),
    state: ThreadedCommentStateSchema.describe("Whether the comment is open or resolved."),
    author: ActorRefSchema.describe("Human or agent that wrote the comment."),
    createdAt: IsoDateTimeSchema.describe("When the comment was created."),
    updatedAt: IsoDateTimeSchema.optional().describe("When the comment body was last edited."),
    resolvedBy: ActorRefSchema.optional().describe("Actor that resolved the comment."),
    resolvedAt: IsoDateTimeSchema.optional().describe("When the comment was resolved."),
  })
  .strict()
  .superRefine((comment, context) => {
    if (
      comment.state === "resolved" &&
      (comment.resolvedBy === undefined || comment.resolvedAt === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "resolved comments require resolvedBy and resolvedAt",
        path: ["state"],
      });
    }

    if (comment.state === "open" && (comment.resolvedBy !== undefined || comment.resolvedAt !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "open comments cannot include resolution fields",
        path: ["state"],
      });
    }
  })
  .describe("A comment that can participate in a human/agent discussion thread.");

export type ThreadedCommentState = z.infer<typeof ThreadedCommentStateSchema>;
export type ThreadedCommentRead = z.infer<typeof ThreadedCommentReadSchema>;
