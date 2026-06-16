import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ConcernTagViewSchema } from "../../domain/schemas/index.js";
import { validateResponse } from "../validation.js";

const ConcernTagsResponseSchema = z
  .object({
    tags: z.array(ConcernTagViewSchema),
  })
  .strict();

export async function registerConcernTagsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/concern-tags", async (_request, reply) => {
    const tags = app.promptReviews.read.listConcernTags();
    return reply.send(validateResponse(ConcernTagsResponseSchema, { tags }));
  });
}
