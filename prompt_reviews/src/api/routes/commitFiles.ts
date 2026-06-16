import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ClassifyFileParamsSchema,
  ClassificationViewSchema,
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  IdSchema,
  paginatedResponseSchema,
} from "../../domain/schemas/index.js";
import { booleanQueryParam, numericQueryParam, validateInput, validateResponse } from "../validation.js";

const CommitIdParamsSchema = z.object({ commitId: IdSchema }).strict();
const CommitFileIdParamsSchema = z.object({ commitFileId: IdSchema }).strict();

const CommitFilesQuerySchema = z
  .object({
    remaining: booleanQueryParam(false),
    limit: numericQueryParam(),
    cursor: IdSchema.optional(),
  })
  .strict();

const CommitFilesResponseSchema = paginatedResponseSchema(CommitFileQueueItemSchema);

export async function registerCommitFilesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/commits/:commitId/files", async (request, reply) => {
    const params = validateInput(CommitIdParamsSchema, request.params, "params");
    const query = validateInput(CommitFilesQuerySchema, request.query, "query");
    const response = app.promptReviews.read.listCommitFiles({
      commitId: params.commitId,
      remaining: query.remaining,
      cursor: query.cursor,
      limit: query.limit,
    });
    return reply.send(validateResponse(CommitFilesResponseSchema, response));
  });

  app.get("/api/commit-files/:commitFileId", async (request, reply) => {
    const params = validateInput(CommitFileIdParamsSchema, request.params, "params");
    const response = app.promptReviews.read.getCommitFileDetail(params.commitFileId);
    return reply.send(validateResponse(CommitFileDetailSchema, response));
  });

  app.patch("/api/commit-files/:commitFileId/classification", async (request, reply) => {
    const params = validateInput(CommitFileIdParamsSchema, request.params, "params");
    const body = validateInput(ClassifyFileParamsSchema.omit({ commitFileId: true }), request.body, "body");
    const response = app.promptReviews.classification.classifyFile({
      ...body,
      commitFileId: params.commitFileId,
    });
    return reply.send(validateResponse(ClassificationViewSchema, response));
  });
}
