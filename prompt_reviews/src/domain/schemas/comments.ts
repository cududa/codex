import { z } from "zod";
import { commentResolutionStatuses, commentStatuses } from "../enums.js";
import { ActorRefSchema, IdSchema, NonEmptyTextSchema, OptionalTextSchema, UnixSecondsSchema } from "./actors.js";
import { ReviewEntityScopeSchema, SourceAnchorSchema } from "./scopes.js";

export const CommentStatusSchema = z.enum(commentStatuses);
export const CommentResolutionStatusSchema = z.enum(commentResolutionStatuses);

const ScopedCommentTargetSchema = z
  .object({
    scope: ReviewEntityScopeSchema,
    anchor: SourceAnchorSchema,
  })
  .strict()
  .superRefine(({ scope, anchor }, context) => {
    if (anchor.kind === "scope") {
      return;
    }

    if (anchor.kind === "block") {
      if (scope.type !== "diff_block" || scope.diffBlockId !== anchor.diffBlockId) {
        context.addIssue({
          code: "custom",
          message: "block anchors must target the matching diff block scope",
          path: ["anchor"],
        });
      }
      return;
    }

    if (scope.type !== "commit_file" || scope.commitFileId !== anchor.commitFileId) {
      context.addIssue({
        code: "custom",
        message: "range anchors must target the matching commit file scope",
        path: ["anchor"],
      });
    }
  });

export const AddCommentParamsSchema = ScopedCommentTargetSchema.extend({
  body: NonEmptyTextSchema,
  author: ActorRefSchema,
});

export const ResolveCommentParamsSchema = z
  .object({
    commentId: IdSchema,
    status: CommentResolutionStatusSchema,
    resolution: NonEmptyTextSchema,
    actor: ActorRefSchema,
  })
  .strict();

export const ReopenCommentParamsSchema = z
  .object({
    commentId: IdSchema,
    reason: OptionalTextSchema,
    actor: ActorRefSchema,
  })
  .strict();

export const CommentSummarySchema = z
  .object({
    id: IdSchema,
    scope: ReviewEntityScopeSchema,
    status: CommentStatusSchema,
    body: NonEmptyTextSchema,
    author: ActorRefSchema,
    createdAt: UnixSecondsSchema,
    resolvedAt: UnixSecondsSchema.optional(),
  })
  .strict();

export const CommentDetailSchema = CommentSummarySchema.extend({
  anchor: SourceAnchorSchema,
  updatedAt: UnixSecondsSchema.optional(),
  resolvedBy: ActorRefSchema.optional(),
  resolution: OptionalTextSchema,
});

export type AddCommentParams = z.infer<typeof AddCommentParamsSchema>;
export type ResolveCommentParams = z.infer<typeof ResolveCommentParamsSchema>;
export type ReopenCommentParams = z.infer<typeof ReopenCommentParamsSchema>;
export type CommentSummary = z.infer<typeof CommentSummarySchema>;
export type CommentDetail = z.infer<typeof CommentDetailSchema>;
