import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ActorRefSchema,
  DecisionDetailSchema,
  FinalizeDecisionParamsSchema,
  IdSchema,
  ProposeDecisionParamsSchema,
  UpdateDecisionParamsSchema,
} from "../../domain/schemas/index.js";
import { validateInput, validateResponse } from "../validation.js";

const DecisionIdParamsSchema = z.object({ decisionId: IdSchema }).strict();
const FinalizeDecisionBodySchema = FinalizeDecisionParamsSchema.omit({ decisionId: true }).extend({
  finalizer: ActorRefSchema,
});

export async function registerDecisionsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/decisions", async (request, reply) => {
    const body = validateInput(ProposeDecisionParamsSchema, request.body, "body");
    const response = app.promptReviews.decisions.proposeDecision(body);
    return reply.status(201).send(validateResponse(DecisionDetailSchema, response));
  });

  app.patch("/api/decisions/:decisionId", async (request, reply) => {
    const params = validateInput(DecisionIdParamsSchema, request.params, "params");
    const body = validateInput(UpdateDecisionParamsSchema.omit({ decisionId: true }), request.body, "body");
    const response = app.promptReviews.decisions.updateDecision({
      ...body,
      decisionId: params.decisionId,
    });
    return reply.send(validateResponse(DecisionDetailSchema, response));
  });

  app.post("/api/decisions/:decisionId/finalize", async (request, reply) => {
    const params = validateInput(DecisionIdParamsSchema, request.params, "params");
    const body = validateInput(FinalizeDecisionBodySchema, request.body, "body");
    const response = app.promptReviews.decisions.finalizeDecision({
      ...body,
      decisionId: params.decisionId,
    });
    return reply.send(validateResponse(DecisionDetailSchema, response));
  });
}
