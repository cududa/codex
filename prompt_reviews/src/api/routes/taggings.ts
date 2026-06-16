import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CreateTaggingParamsSchema, DeleteTaggingParamsSchema, IdSchema, TaggingViewSchema } from "../../domain/schemas/index.js";
import { validateInput, validateResponse } from "../validation.js";

const TaggingIdParamsSchema = z.object({ taggingId: IdSchema }).strict();

export async function registerTaggingsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/taggings", async (request, reply) => {
    const body = validateInput(CreateTaggingParamsSchema, request.body, "body");
    const response = app.promptReviews.read.createTagging(body);
    return reply.status(201).send(validateResponse(TaggingViewSchema, response));
  });

  app.delete("/api/taggings/:taggingId", async (request, reply) => {
    const params = validateInput(TaggingIdParamsSchema, request.params, "params");
    const body = validateInput(DeleteTaggingParamsSchema.omit({ taggingId: true }), request.body ?? {}, "body");
    const response = app.promptReviews.read.deleteTagging({ ...body, taggingId: params.taggingId });
    return reply.send(validateResponse(TaggingViewSchema, response));
  });
}
