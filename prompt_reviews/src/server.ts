import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { z } from "zod";
import { resolveAnchor } from "./anchors.js";
import { PromptReviewMcp } from "./mcp.js";
import { createReviews, parseTargetSpec } from "./reviews.js";
import { CommentStore } from "./store.js";
import { Workspace } from "./workspace.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptReviewsDir = path.resolve(__dirname, "../..");
const workspace = new Workspace(promptReviewsDir);
const store = new CommentStore(path.join(promptReviewsDir, "data/comments.json"));
const mcp = new PromptReviewMcp(workspace, store);

const app = Fastify({
  logger: true,
});

const FileQuerySchema = z.object({
  path: z.string(),
});

const CommentQuerySchema = z.object({
  filePath: z.string().optional(),
});

const AddCommentSchema = z.object({
  filePath: z.string().optional(),
  reviewPath: z.string().optional(),
  selectedText: z.string(),
  comment: z.string(),
  startLine: z.number().int().positive().optional(),
  author: z.string().optional(),
});

const CreateReviewSchema = z.object({
  commit: z.string(),
  targets: z
    .array(
      z.object({
        name: z.string(),
        path: z.string(),
        startLine: z.number().int().positive().optional(),
        endLine: z.number().int().positive().optional(),
      }),
    )
    .optional(),
  targetSpecs: z.array(z.string()).optional(),
});

app.get("/api/file", async (request, reply) => {
  const query = FileQuerySchema.parse(request.query);
  const file = await workspace.readTextFile(query.path);
  return reply.send(file);
});

app.post("/api/reviews", async (request, reply) => {
  const input = CreateReviewSchema.parse(request.body);
  const targets = input.targets ?? input.targetSpecs?.map(parseTargetSpec) ?? [];
  const result = await createReviews({
    workspace,
    artifactRoot: promptReviewsDir,
    commit: input.commit,
    targets,
  });
  return reply.status(201).send(result);
});

app.get("/api/comments", async (request, reply) => {
  const query = CommentQuerySchema.parse(request.query);
  const relativePath =
    query.filePath === undefined ? undefined : workspace.resolveFile(query.filePath).relativePath;
  return reply.send({ comments: await store.list(relativePath) });
});

app.post("/api/comments", async (request, reply) => {
  const input = AddCommentSchema.parse(request.body);
  const targetPath = input.reviewPath ?? input.filePath;
  if (targetPath === undefined) {
    return reply.status(400).send({ error: "filePath or reviewPath is required." });
  }

  const file = await workspace.readTextFile(targetPath);
  const anchor = resolveAnchor(file.text, input.selectedText, input.startLine);

  if (!anchor.ok) {
    return reply.status(409).send(anchor);
  }

  const comment = await store.add({
    filePath: file.relativePath,
    body: input.comment,
    author: input.author ?? "user",
    anchor: anchor.anchor,
  });

  return reply.status(201).send(comment);
});

app.all("/mcp", async (request, reply) => {
  reply.hijack();
  await mcp.handle(request.raw, reply.raw, request.body);
});

const webRoot = path.join(promptReviewsDir, "dist/web");
await app.register(fastifyStatic, {
  root: webRoot,
  prefix: "/",
});

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api/") || request.raw.url?.startsWith("/mcp")) {
    return reply.status(404).send({ error: "Not found" });
  }
  return reply.sendFile("index.html");
});

const port = Number(process.env.PORT ?? 4177);
await app.listen({ host: "127.0.0.1", port });
