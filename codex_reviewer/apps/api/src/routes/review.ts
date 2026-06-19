import {
  ConcernAreasResponseSchema,
  IngestReviewVersionRequestSchema,
  IngestReviewVersionResponseSchema,
  ReviewBootstrapResponseSchema,
  ReviewMarksResponseSchema,
  ReviewStateWriteResponseSchema,
  ReviewVersionResponseSchema,
  ReviewVersionsResponseSchema,
  SetCommitConcernAreasRequestSchema,
  SetCommitReviewMarkRequestSchema,
  SetFileReviewMarkRequestSchema,
  concernAreas,
  reviewMarkDefinitions,
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

  routes.post(
    "/versions/ingest",
    zValidator("json", IngestReviewVersionRequestSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      const response = await c.var.context.reviewIngestService.ingestReviewVersion(c.req.valid("json"));
      return c.json(IngestReviewVersionResponseSchema.parse(response));
    },
  );

  routes.get("/versions/:versionId", async (c) => {
    const version = await c.var.context.reviewReadStore.getReviewVersion(c.req.param("versionId"));
    return c.json(ReviewVersionResponseSchema.parse({ version }));
  });

  routes.patch(
    "/commits/:commitId/review-mark",
    zValidator("json", SetCommitReviewMarkRequestSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      const payload = c.req.valid("json");
      const version = await c.var.context.reviewWriteStore.setCommitReviewMark({
        commitId: c.req.param("commitId"),
        reviewMark: payload.reviewMark,
        actor: payload.actor,
      });
      return c.json(ReviewStateWriteResponseSchema.parse({ version }));
    },
  );

  routes.patch(
    "/files/:fileId/review-mark",
    zValidator("json", SetFileReviewMarkRequestSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      const payload = c.req.valid("json");
      const version = await c.var.context.reviewWriteStore.setFileReviewMark({
        fileId: c.req.param("fileId"),
        reviewMark: payload.reviewMark,
        actor: payload.actor,
      });
      return c.json(ReviewStateWriteResponseSchema.parse({ version }));
    },
  );

  routes.put(
    "/commits/:commitId/concern-areas",
    zValidator("json", SetCommitConcernAreasRequestSchema, (result) => {
      if (!result.success) {
        throw result.error;
      }
    }),
    async (c) => {
      const payload = c.req.valid("json");
      const version = await c.var.context.reviewWriteStore.setCommitConcernAreas({
        commitId: c.req.param("commitId"),
        concernAreas: payload.concernAreas,
        actor: payload.actor,
      });
      return c.json(ReviewStateWriteResponseSchema.parse({ version }));
    },
  );

  return routes;
}
