import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  CompletePlanParamsSchema,
  CreatePlanItemParamsSchema,
  CreatePlanParamsSchema,
  IdSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  UpdatePlanItemParamsSchema,
  UpdatePlanParamsSchema,
} from "../../domain/schemas/index.js";
import { validateInput, validateResponse } from "../validation.js";

const PlanIdParamsSchema = z.object({ planId: IdSchema }).strict();
const PlanItemIdParamsSchema = z.object({ planItemId: IdSchema }).strict();

export async function registerPlansRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/plans", async (request, reply) => {
    const body = validateInput(CreatePlanParamsSchema, request.body, "body");
    const response = app.promptReviews.plans.createPlan(body);
    return reply.status(201).send(validateResponse(PlanDetailSchema, response));
  });

  app.patch("/api/plans/:planId", async (request, reply) => {
    const params = validateInput(PlanIdParamsSchema, request.params, "params");
    const body = validateInput(UpdatePlanParamsSchema.omit({ planId: true }), request.body, "body");
    const response = app.promptReviews.plans.updatePlan({
      ...body,
      planId: params.planId,
    });
    return reply.send(validateResponse(PlanDetailSchema, response));
  });

  app.post("/api/plans/:planId/items", async (request, reply) => {
    const params = validateInput(PlanIdParamsSchema, request.params, "params");
    const body = validateInput(CreatePlanItemParamsSchema.omit({ planId: true }), request.body, "body");
    const response = app.promptReviews.plans.createPlanItem({
      ...body,
      planId: params.planId,
    });
    return reply.status(201).send(validateResponse(PlanItemDetailSchema, response));
  });

  app.patch("/api/plan-items/:planItemId", async (request, reply) => {
    const params = validateInput(PlanItemIdParamsSchema, request.params, "params");
    const body = validateInput(UpdatePlanItemParamsSchema.omit({ planItemId: true }), request.body, "body");
    const response = app.promptReviews.plans.updatePlanItem({
      ...body,
      planItemId: params.planItemId,
    });
    return reply.send(validateResponse(PlanItemDetailSchema, response));
  });

  app.post("/api/plans/:planId/complete", async (request, reply) => {
    const params = validateInput(PlanIdParamsSchema, request.params, "params");
    const body = validateInput(CompletePlanParamsSchema.omit({ planId: true }), request.body, "body");
    const response = app.promptReviews.plans.completePlan({
      ...body,
      planId: params.planId,
    });
    return reply.send(validateResponse(PlanDetailSchema, response));
  });
}
