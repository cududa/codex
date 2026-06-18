import {
  AddReviewNoteCommandSchema,
  AddThreadedCommentCommandSchema,
  ConcernAreasResponseSchema,
  DeleteReviewNoteCommandSchema,
  GenerateReviewLedgerCommandSchema,
  ResolveThreadedCommentCommandSchema,
  ReviewBootstrapResponseSchema,
  ReviewMarksResponseSchema,
  ReviewSchemaCatalogResponseSchema,
  UpdateReviewNoteCommandSchema,
  UpsertReviewPlanCommandSchema,
  concernAreas,
  reviewMarkDefinitions,
  reviewSchemas,
} from "@prompt-reviews/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { ApiBindings } from "../server/types.js";

export function createReviewRoutes() {
  const routes = new Hono<ApiBindings>();

  routes.get("/bootstrap", (c) =>
    c.json(
      ReviewBootstrapResponseSchema.parse({
        concernAreas,
        reviewMarks: reviewMarkDefinitions,
        schemaNames: reviewSchemaNames(),
      }),
    ),
  );

  routes.get("/concern-areas", (c) =>
    c.json(
      ConcernAreasResponseSchema.parse({
        concernAreas,
      }),
    ),
  );

  routes.get("/marks", (c) =>
    c.json(
      ReviewMarksResponseSchema.parse({
        reviewMarks: reviewMarkDefinitions,
      }),
    ),
  );

  routes.get("/schemas", (c) =>
    c.json(
      ReviewSchemaCatalogResponseSchema.parse({
        schemaNames: reviewSchemaNames(),
      }),
    ),
  );

  routes.post(
    "/comments",
    zValidator("json", AddThreadedCommentCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.addThreadedComment(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.post(
    "/comments/resolve",
    zValidator("json", ResolveThreadedCommentCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.resolveThreadedComment(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.post(
    "/notes",
    zValidator("json", AddReviewNoteCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.addReviewNote(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.put(
    "/notes",
    zValidator("json", UpdateReviewNoteCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.updateReviewNote(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.delete(
    "/notes",
    zValidator("json", DeleteReviewNoteCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.deleteReviewNote(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.put(
    "/plans",
    zValidator("json", UpsertReviewPlanCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.upsertReviewPlan(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  routes.post(
    "/ledgers",
    zValidator("json", GenerateReviewLedgerCommandSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      await c.var.context.reviewWriteStore.generateReviewLedger(c.req.valid("json"));
      return c.body(null, 204);
    },
  );

  return routes;
}

function reviewSchemaNames(): string[] {
  return Object.keys(reviewSchemas).sort();
}
