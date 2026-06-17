import {
  ConcernAreasResponseSchema,
  ReviewBootstrapResponseSchema,
  ReviewMarksResponseSchema,
  ReviewSchemaCatalogResponseSchema,
  concernAreas,
  reviewMarkDefinitions,
  reviewSchemas,
} from "@prompt-reviews/contracts";
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

  return routes;
}

function reviewSchemaNames(): string[] {
  return Object.keys(reviewSchemas).sort();
}
