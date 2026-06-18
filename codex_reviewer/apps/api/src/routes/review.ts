import {
  ConcernAreasResponseSchema,
  ReviewBootstrapResponseSchema,
  ReviewMarksResponseSchema,
  ReviewVersionResponseSchema,
  ReviewVersionsResponseSchema,
  concernAreas,
  reviewMarkDefinitions,
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

  routes.get("/versions", async (c) => {
    const versions = await c.var.context.reviewReadStore.listReviewVersions();
    return c.json(ReviewVersionsResponseSchema.parse({ versions }));
  });

  routes.get("/versions/:versionId", async (c) => {
    const version = await c.var.context.reviewReadStore.getReviewVersion(c.req.param("versionId"));
    return c.json(ReviewVersionResponseSchema.parse({ version }));
  });

  return routes;
}
