import { z } from "zod";
import { commentResolutionStatuses, commentStatuses } from "../enums.js";
import {
  ActorRefSchema,
  HumanActorRefSchema,
  IdSchema,
  NonEmptyTextSchema,
  OptionalTextSchema,
  PositiveLineNumberSchema,
  UnixSecondsSchema,
} from "./actors.js";
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
    actor: HumanActorRefSchema,
  })
  .strict();

export const ReopenCommentParamsSchema = z
  .object({
    commentId: IdSchema,
    actor: HumanActorRefSchema,
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

export const CommentLocationSchema = z
  .object({
    commit: z
      .object({
        id: IdSchema,
        sha: NonEmptyTextSchema,
        title: NonEmptyTextSchema,
      })
      .strict()
      .optional(),
    file: z
      .object({
        id: IdSchema,
        path: NonEmptyTextSchema,
        oldPath: OptionalTextSchema,
      })
      .strict()
      .optional(),
    diffBlock: z
      .object({
        id: IdSchema,
        heading: OptionalTextSchema,
        oldStartLine: PositiveLineNumberSchema.optional(),
        oldEndLine: PositiveLineNumberSchema.optional(),
        newStartLine: PositiveLineNumberSchema.optional(),
        newEndLine: PositiveLineNumberSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const CommentDetailSchema = CommentSummarySchema.extend({
  anchor: SourceAnchorSchema,
  location: CommentLocationSchema.optional(),
  updatedAt: UnixSecondsSchema.optional(),
  resolvedBy: ActorRefSchema.optional(),
});

export type AddCommentParams = z.infer<typeof AddCommentParamsSchema>;
export type ResolveCommentParams = z.infer<typeof ResolveCommentParamsSchema>;
export type ReopenCommentParams = z.infer<typeof ReopenCommentParamsSchema>;
export type CommentSummary = z.infer<typeof CommentSummarySchema>;
export type CommentLocation = z.infer<typeof CommentLocationSchema>;
export type CommentDetail = z.infer<typeof CommentDetailSchema>;
