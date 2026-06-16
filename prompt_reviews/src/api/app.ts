import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type {
  ClassificationService,
  CommentService,
  DecisionService,
  PlanService,
  ReviewReadService,
  ReviewQueueService,
  StatusService,
  VersionService,
} from "../services/index.js";
import { sendHttpError } from "./errors.js";
import { registerCommentsRoutes } from "./routes/comments.js";
import { registerCommitFilesRoutes } from "./routes/commitFiles.js";
import { registerCommitsRoutes } from "./routes/commits.js";
import { registerConcernTagsRoutes } from "./routes/concernTags.js";
import { registerDecisionsRoutes } from "./routes/decisions.js";
import { registerPlansRoutes } from "./routes/plans.js";
import { registerTaggingsRoutes } from "./routes/taggings.js";
import { registerVersionsRoutes } from "./routes/versions.js";

export type MissingDecisionTarget = "commit" | "file";

export type PromptReviewsApiContext = {
  versions: VersionService;
  classification: ClassificationService;
  status: StatusService;
  queue: ReviewQueueService;
  comments: CommentService;
  decisions: DecisionService;
  plans: PlanService;
  read: ReviewReadService;
};

export type CreatePromptReviewsApiOptions = {
  context: PromptReviewsApiContext;
  logger?: boolean;
};

declare module "fastify" {
  interface FastifyInstance {
    promptReviews: PromptReviewsApiContext;
  }
}

export async function createPromptReviewsApi(options: CreatePromptReviewsApiOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  await registerPromptReviewsApi(app, options.context);
  return app;
}

export async function registerPromptReviewsApi(
  app: FastifyInstance,
  context: PromptReviewsApiContext,
): Promise<void> {
  app.decorate("promptReviews", context);
  app.setErrorHandler((error, request, reply) => sendHttpError(error, request, reply));

  await registerVersionsRoutes(app);
  await registerCommitsRoutes(app);
  await registerCommitFilesRoutes(app);
  await registerConcernTagsRoutes(app);
  await registerTaggingsRoutes(app);
  await registerCommentsRoutes(app);
  await registerDecisionsRoutes(app);
  await registerPlansRoutes(app);
}
