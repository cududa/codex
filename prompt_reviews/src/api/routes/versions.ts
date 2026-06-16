import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ActorRefSchema,
  CloseVersionParamsSchema,
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  IdSchema,
  PopulateNextVersionParamsSchema,
  PopulateNextVersionResponseSchema,
  RemainingWorkSchema,
  VersionDetailSchema,
  VersionSummarySchema,
  paginatedResponseSchema,
} from "../../domain/schemas/index.js";
import { booleanQueryParam, numericQueryParam, validateInput, validateResponse } from "../validation.js";
import type { MissingDecisionTarget } from "../app.js";

const VersionIdParamsSchema = z.object({ versionId: IdSchema }).strict();

const ListVersionsQuerySchema = z
  .object({
    status: z.enum(["open", "closed", "all"]).optional().default("open"),
  })
  .strict();

const ListVersionsResponseSchema = z
  .object({
    versions: z.array(VersionSummarySchema),
  })
  .strict();

const PatchVersionBodySchema = z.object({}).strict();

const CloseVersionBodySchema = CloseVersionParamsSchema.omit({ versionId: true }).extend({
  finalizer: ActorRefSchema,
});

const VersionCommitsQuerySchema = z
  .object({
    remaining: booleanQueryParam(false),
    limit: numericQueryParam(),
    cursor: IdSchema.optional(),
  })
  .strict();

const VersionCommitsResponseSchema = paginatedResponseSchema(CommitQueueItemSchema);

const MissingDecisionsQuerySchema = z
  .object({
    target: z.enum(["commit", "file"]),
  })
  .strict();

const MissingDecisionsResponseSchema = z
  .object({
    target: z.enum(["commit", "file"]),
    data: z.array(z.union([CommitQueueItemSchema, CommitFileQueueItemSchema])),
  })
  .strict();

const RemainingWorkResponseSchema = z
  .object({
    remainingWork: z.array(RemainingWorkSchema),
  })
  .strict();

export async function registerVersionsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/versions/populate-next", async (request, reply) => {
    const body = validateInput(PopulateNextVersionParamsSchema, request.body, "body");
    const response = await app.promptReviews.versions.populateNextVersion(body);
    return reply.status(201).send(validateResponse(PopulateNextVersionResponseSchema, response));
  });

  app.get("/api/versions", async (request, reply) => {
    const query = validateInput(ListVersionsQuerySchema, request.query, "query");
    const versions = app.promptReviews.read.listVersions(query);
    return reply.send(validateResponse(ListVersionsResponseSchema, { versions }));
  });

  app.get("/api/versions/:versionId", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    const response = app.promptReviews.versions.getVersionDetail(params);
    return reply.send(validateResponse(VersionDetailSchema, response));
  });

  app.patch("/api/versions/:versionId", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    validateInput(PatchVersionBodySchema, request.body ?? {}, "body");
    const response = app.promptReviews.read.getVersionDetail(params.versionId);
    return reply.send(validateResponse(VersionDetailSchema, response));
  });

  app.post("/api/versions/:versionId/close", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    const body = validateInput(CloseVersionBodySchema, request.body, "body");
    const response = app.promptReviews.versions.closeVersion({ ...body, versionId: params.versionId });
    return reply.send(validateResponse(VersionSummarySchema, response));
  });

  app.get("/api/versions/:versionId/commits", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    const query = validateInput(VersionCommitsQuerySchema, request.query, "query");
    const response =
      query.remaining === true
        ? app.promptReviews.queue.listRemainingCommits({
            versionId: params.versionId,
            cursor: query.cursor,
            limit: query.limit,
          })
        : {
            data: app.promptReviews.versions.getVersionDetail(params).commits,
            nextCursor: null,
          };
    return reply.send(validateResponse(VersionCommitsResponseSchema, response));
  });

  app.get("/api/versions/:versionId/missing-decisions", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    const query = validateInput(MissingDecisionsQuerySchema, request.query, "query");
    const response = app.promptReviews.read.listMissingDecisions({
      versionId: params.versionId,
      target: query.target satisfies MissingDecisionTarget,
    });
    return reply.send(validateResponse(MissingDecisionsResponseSchema, response));
  });

  app.get("/api/versions/:versionId/remaining-work", async (request, reply) => {
    const params = validateInput(VersionIdParamsSchema, request.params, "params");
    const remainingWork = app.promptReviews.queue.getRemainingWork(params);
    return reply.send(validateResponse(RemainingWorkResponseSchema, { remainingWork }));
  });
}
