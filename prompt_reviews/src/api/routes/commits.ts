import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ClassifyCommitParamsSchema,
  ClassificationViewSchema,
  CommitDetailSchema,
  IdSchema,
} from "../../domain/schemas/index.js";
import { validateInput, validateResponse } from "../validation.js";

const CommitIdParamsSchema = z.object({ commitId: IdSchema }).strict();

export async function registerCommitsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/commits/:commitId", async (request, reply) => {
    const params = validateInput(CommitIdParamsSchema, request.params, "params");
    const response = app.promptReviews.read.getCommitDetail(params.commitId);
    return reply.send(validateResponse(CommitDetailSchema, response));
  });

  app.patch("/api/commits/:commitId/classification", async (request, reply) => {
    const params = validateInput(CommitIdParamsSchema, request.params, "params");
    const body = validateInput(ClassifyCommitParamsSchema.omit({ commitId: true }), request.body, "body");
    const response = app.promptReviews.classification.classifyCommit({ ...body, commitId: params.commitId });
    return reply.send(validateResponse(ClassificationViewSchema, response));
  });
}
