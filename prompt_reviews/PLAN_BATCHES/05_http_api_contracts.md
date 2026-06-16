# Batch 05: HTTP API Contracts

## Owner

API subagent.

## Purpose

Replace prototype markdown-centric HTTP routes with structured domain routes. Fastify handlers must be thin validators/controllers over services.

## Dependencies

Requires Batches 00 through 04.

## Write Scope

Allowed:

```text
src/server.ts
src/api/app.ts
src/api/validation.ts
src/api/errors.ts
src/api/routes/versions.ts
src/api/routes/commits.ts
src/api/routes/commitFiles.ts
src/api/routes/concernTags.ts
src/api/routes/taggings.ts
src/api/routes/comments.ts
src/api/routes/decisions.ts
src/api/routes/plans.ts
src/api/**/*.test.ts
```

Forbidden:

- `src/db/**`
- `src/db/rowSchemas.ts` imports
- Direct Drizzle or SQLite usage
- MCP tool implementation
- Frontend changes except API-client compile fixes approved by lead

## Route Requirements

Implement:

```text
POST /api/versions/populate-next
GET /api/versions?status=open|closed|all
GET /api/versions/:versionId
PATCH /api/versions/:versionId
POST /api/versions/:versionId/close

GET /api/versions/:versionId/commits?remaining=true&limit=&cursor=
GET /api/commits/:commitId
PATCH /api/commits/:commitId/classification

GET /api/commits/:commitId/files?remaining=true
GET /api/commit-files/:commitFileId
PATCH /api/commit-files/:commitFileId/classification

GET /api/concern-tags
POST /api/taggings
DELETE /api/taggings/:taggingId

POST /api/comments
GET /api/comments?versionId=&commitId=&commitFileId=&status=
PATCH /api/comments/:commentId/resolve
PATCH /api/comments/:commentId/reopen

POST /api/decisions
PATCH /api/decisions/:decisionId
POST /api/decisions/:decisionId/finalize
GET /api/versions/:versionId/missing-decisions?target=commit|file

POST /api/plans
PATCH /api/plans/:planId
POST /api/plans/:planId/items
PATCH /api/plan-items/:planItemId
POST /api/plans/:planId/complete

GET /api/versions/:versionId/remaining-work
```

## Validation Contract

- Validate route params, query, body, and responses with hand-authored domain/boundary Zod schemas from `src/domain/schemas/**`.
- Do not validate public contracts with generated row schemas.
- Map service/domain errors to stable HTTP errors:
  - Validation: 400.
  - Unknown IDs: 404.
  - Actor authority failure: 403.
  - State conflict: 409.
  - Unexpected: 500.
- Response bodies should be domain-shaped, not raw DB rows.

## Server Composition

`src/server.ts` should become bootstrap/composition:

- Create DB/client/service context.
- Register API app/routes.
- Register MCP handler composition if still colocated.
- Register static web assets.
- Avoid route business logic.

## Tests

Use Fastify inject tests with temp DB:

- Every endpoint validates request payloads.
- Every endpoint response parses through the expected response schema.
- Open versions list works.
- Remaining commits list supports cursor/limit.
- Remaining files list works.
- File review detail includes structured diff blocks.
- Missing decisions returns actionable commit/file targets.
- Add, resolve, and reopen comment flows work.
- Propose and finalize decision flows enforce human-only finalization.
- Agent finalization returns 403 or equivalent stable error.
- Plan create, update, item update, and complete flows work.
- Invalid scope payloads return 400.
- Unknown IDs return 404.
- State conflicts return 409.
- No route imports DB schema or row schemas.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for API tests.
- `src/api/**` uses services, not repositories or Drizzle.
- API response schemas are hand-authored boundary schemas.
- The prototype routes `/api/file`, `/api/reviews`, and markdown-based comments are not the primary frontend path after Batch 07.

## Rejection Criteria

Reject the batch if:

- Route handlers import Drizzle tables, generated row schemas, SQL clients, or repository internals.
- API responses are raw persistence rows by default.
- API-specific business logic duplicates service rules.
- Legacy markdown endpoints remain the main path for review state.
- HTTP and MCP payload shapes are allowed to drift for the same command.

