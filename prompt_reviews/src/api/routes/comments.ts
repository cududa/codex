import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  AddCommentParamsSchema,
  CommentDetailSchema,
  CommentStatusSchema,
  IdSchema,
  ReopenCommentParamsSchema,
  ResolveCommentParamsSchema,
} from "../../domain/schemas/index.js";
import { validateInput, validateResponse } from "../validation.js";

const CommentIdParamsSchema = z.object({ commentId: IdSchema }).strict();

const ListCommentsQuerySchema = z
  .object({
    versionId: IdSchema.optional(),
    commitId: IdSchema.optional(),
    commitFileId: IdSchema.optional(),
    status: CommentStatusSchema.optional(),
  })
  .strict()
  .refine(
    (query) =>
      [query.versionId, query.commitId, query.commitFileId].filter((value) => value !== undefined).length <= 1,
    {
      message: "Provide at most one comment scope filter.",
    },
  );

const ListCommentsResponseSchema = z
  .object({
    comments: z.array(CommentDetailSchema),
  })
  .strict();

export async function registerCommentsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/comments", async (request, reply) => {
    const body = validateInput(AddCommentParamsSchema, request.body, "body");
    const response = app.promptReviews.comments.addComment(body);
    return reply.status(201).send(validateResponse(CommentDetailSchema, response));
  });

  app.get("/api/comments", async (request, reply) => {
    const query = validateInput(ListCommentsQuerySchema, request.query, "query");
    const comments = app.promptReviews.read.listComments(query);
    return reply.send(validateResponse(ListCommentsResponseSchema, { comments }));
  });

  app.patch("/api/comments/:commentId/resolve", async (request, reply) => {
    const params = validateInput(CommentIdParamsSchema, request.params, "params");
    const body = validateInput(ResolveCommentParamsSchema.omit({ commentId: true }), request.body, "body");
    const response = app.promptReviews.comments.resolveComment({
      ...body,
      commentId: params.commentId,
    });
    return reply.send(validateResponse(CommentDetailSchema, response));
  });

  app.patch("/api/comments/:commentId/reopen", async (request, reply) => {
    const params = validateInput(CommentIdParamsSchema, request.params, "params");
    const body = validateInput(ReopenCommentParamsSchema.omit({ commentId: true }), request.body, "body");
    const response = app.promptReviews.comments.reopenComment({
      ...body,
      commentId: params.commentId,
    });
    return reply.send(validateResponse(CommentDetailSchema, response));
  });
}
