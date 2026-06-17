import { ApiErrorResponseSchema, AppMetadataQuerySchema, AppMetadataResponseSchema, HealthResponseSchema } from "@prompt-reviews/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as requestLogger } from "hono/logger";
import { handleApiError } from "../middleware/error-handler.js";
import { createReviewRoutes } from "../routes/review.js";
import type { ApiBindings, ApiDependencies } from "./types.js";

export function createApiApp(dependencies: ApiDependencies) {
  const app = new Hono<ApiBindings>();

  app.use("*", async (c, next) => {
    c.set("context", dependencies);
    await next();
  });
  app.use("*", cors({ origin: "http://127.0.0.1:5173" }));
  app.use("*", requestLogger());

  app.onError((error, c) => handleApiError(error, c));
  app.notFound((c) =>
    c.json(
      ApiErrorResponseSchema.parse({
        error: {
          code: "not_found",
          message: "Not Found",
        },
      }),
      404,
    ),
  );

  app.get("/health", (c) => c.json(HealthResponseSchema.parse({ ok: true, service: "codex-reviewer-api" })));
  app.get("/api/meta", zValidator("query", AppMetadataQuerySchema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  }), (c) =>
    c.json(
      AppMetadataResponseSchema.parse({
        appName: "Codex Reviewer",
        apiName: "codex-reviewer-api",
        contractsPackage: "@prompt-reviews/contracts",
        status: "ready",
        summary: "Contracts-first Hono and React workspace foundation.",
      }),
    ),
  );
  app.route("/api/review", createReviewRoutes());

  return app;
}
