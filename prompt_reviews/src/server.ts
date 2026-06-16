import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { registerPromptReviewsApi, type PromptReviewsApiContext } from "./api/app.js";
import { openPromptReviewsDatabase } from "./db/client.js";
import { migratePromptReviewsDatabase } from "./db/migrate.js";
import { createCommandGitClient } from "./git/gitClient.js";
import { PromptReviewMcp } from "./mcp.js";
import {
  createClassificationService,
  createCommentService,
  createDecisionService,
  createPlanService,
  createReviewQueueService,
  createReviewReadService,
  createServiceContext,
  createStatusService,
  createVersionService,
} from "./services/index.js";
import { CommentStore } from "./store.js";
import { Workspace } from "./workspace.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptReviewsDir =
  path.basename(__dirname) === "src" ? path.resolve(__dirname, "..") : path.resolve(__dirname, "../..");
const repositoryRoot = path.resolve(promptReviewsDir, "..");
const dataDir = path.join(promptReviewsDir, "data");
const databasePath = process.env.PROMPT_REVIEWS_DB ?? path.join(dataDir, "prompt_reviews.sqlite");

mkdirSync(path.dirname(databasePath), { recursive: true });

const database = openPromptReviewsDatabase(databasePath);
migratePromptReviewsDatabase(database, { migrationsFolder: path.join(promptReviewsDir, "drizzle") });

const serviceContext = createServiceContext({ db: database.db });
const gitClient = createCommandGitClient(repositoryRoot);
const apiContext: PromptReviewsApiContext = {
  versions: createVersionService(serviceContext, { gitClient }),
  classification: createClassificationService(serviceContext),
  status: createStatusService(serviceContext),
  queue: createReviewQueueService(serviceContext),
  comments: createCommentService(serviceContext),
  decisions: createDecisionService(serviceContext),
  plans: createPlanService(serviceContext),
  read: createReviewReadService(serviceContext),
};

const app = Fastify({ logger: true });
await registerPromptReviewsApi(app, apiContext);

const workspace = new Workspace(promptReviewsDir);
const store = new CommentStore(path.join(dataDir, "comments.json"));
const mcp = new PromptReviewMcp(workspace, store);

app.all("/mcp", async (request, reply) => {
  reply.hijack();
  await mcp.handle(request.raw, reply.raw, request.body);
});

await app.register(fastifyStatic, {
  root: path.join(promptReviewsDir, "dist/web"),
  prefix: "/",
});

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api/") || request.raw.url?.startsWith("/mcp")) {
    return reply.status(404).send({ error: { code: "not_found", message: "Not found" } });
  }
  return reply.sendFile("index.html");
});

app.addHook("onClose", () => {
  database.close();
});

const port = Number(process.env.PORT ?? 4177);
await app.listen({ host: "127.0.0.1", port });
