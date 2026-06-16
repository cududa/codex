import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { z } from "zod";
import { resolveAnchor, resolveBlockAnchor } from "./anchors.js";
import { listReviews } from "./discovery.js";
import { PromptReviewMcp } from "./mcp.js";
import { createReviews, normalizeBundleName, parseTargetSpec } from "./reviews.js";
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
  format: z.enum(["full", "compact"]).optional(),
});

const AddCommentSchema = z.object({
  filePath: z.string().optional(),
  reviewPath: z.string().optional(),
  selectedText: z.string().optional(),
  blockId: z.string().optional(),
  lineOffset: z.number().int().nonnegative().optional(),
  comment: z.string(),
  startLine: z.number().int().positive().optional(),
  author: z.string().optional(),
});

const CreateReviewSchema = z.object({
  commit: z.string(),
  bundle: z.string().optional(),
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

const ReviewQuerySchema = z.object({
  commit: z.string().optional(),
  bundle: z.string().optional(),
});

const AddNoteSchema = z.object({
  reviewPath: z.string().optional(),
  bundle: z.string().optional(),
  comment: z.string(),
  author: z.string().optional(),
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
    bundle: input.bundle,
    targets,
  });
  return reply.status(201).send(result);
});

app.get("/api/reviews", async (request, reply) => {
  const query = ReviewQuerySchema.parse(request.query);
  const reviews = await listReviews(promptReviewsDir, query);
  const comments = await store.list();
  const notes = await store.listNotes();
  return reply.send({
    reviews: reviews.map((review) => ({
      ...review,
      commentCount: comments.filter((comment) => comment.filePath === review.reviewPath).length,
      noteCount: notes.filter(
        (note) => note.scope.type === "review" && note.scope.filePath === review.reviewPath,
      ).length,
    })),
  });
});

app.get("/api/comments", async (request, reply) => {
  const query = CommentQuerySchema.parse(request.query);
  const relativePath =
    query.filePath === undefined ? undefined : workspace.resolveFile(query.filePath).relativePath;
  const comments = await store.list(relativePath);
  const notes =
    relativePath === undefined
      ? await store.listNotes()
      : await store.listNotes({ type: "review", filePath: relativePath });
  return reply.send({
    comments:
      query.format === "compact"
        ? comments.map((comment) => ({
            filePath: comment.filePath,
            blockId: comment.blockId,
            line: comment.anchor.startLine,
            selectedText: compactText(comment.anchor.selectedText),
            body: comment.body,
          }))
        : comments,
    notes,
  });
});

app.post("/api/comments", async (request, reply) => {
  const input = AddCommentSchema.parse(request.body);
  const targetPath = input.reviewPath ?? input.filePath;
  if (targetPath === undefined) {
    return reply.status(400).send({ error: "filePath or reviewPath is required." });
  }

  const file = await workspace.readTextFile(targetPath);
  const anchor =
    input.blockId === undefined
      ? input.selectedText === undefined
        ? { ok: false as const, reason: "selectedText or blockId is required." }
        : resolveAnchor(file.text, input.selectedText, input.startLine)
      : resolveBlockAnchor(file.text, input.blockId, input.lineOffset);

  if (!anchor.ok) {
    return reply.status(409).send(anchor);
  }

  const comment = await store.add({
    filePath: file.relativePath,
    body: input.comment,
    author: input.author ?? "user",
    anchor: anchor.anchor,
    blockId: input.blockId,
  });

  return reply.status(201).send(comment);
});

app.post("/api/notes", async (request, reply) => {
  const input = AddNoteSchema.parse(request.body);
  if ((input.reviewPath === undefined) === (input.bundle === undefined)) {
    return reply.status(400).send({ error: "Provide exactly one of reviewPath or bundle." });
  }

  const scope =
    input.reviewPath === undefined
      ? { type: "bundle" as const, bundle: normalizeBundleName(input.bundle ?? "") }
      : { type: "review" as const, filePath: workspace.resolveFile(input.reviewPath).relativePath };
  const note = await store.addNote({
    scope,
    body: input.comment,
    author: input.author ?? "user",
  });
  return reply.status(201).send(note);
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

function compactText(value: string): string {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length <= 160 ? normalized : `${normalized.slice(0, 157)}...`;
}
