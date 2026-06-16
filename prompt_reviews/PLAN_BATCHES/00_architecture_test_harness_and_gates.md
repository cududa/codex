# Batch 00: Architecture Test Harness And Gates

## Owner

Lead or architecture subagent only.

## Purpose

Create the guardrails before anyone implements schema, routes, tools, or UI. This batch prevents the rebuild from becoming a SQLite copy of the prototype markdown/file layout.

## Dependencies

None. This is the first batch.

## Write Scope

Allowed:

- `prompt_reviews/package.json`
- `prompt_reviews/package-lock.json`
- `prompt_reviews/tsconfig.json`
- `prompt_reviews/tsconfig.web.json`
- `prompt_reviews/vite.config.ts`
- `prompt_reviews/vitest.config.ts`
- `prompt_reviews/drizzle.config.ts`
- `prompt_reviews/scripts/check-architecture.ts`
- `prompt_reviews/scripts/write-json-schemas.ts`
- `prompt_reviews/src/__tests__/architecture-boundaries.test.ts`
- `prompt_reviews/src/__tests__/public-contracts.test.ts`
- `prompt_reviews/PLAN_BATCHES/**`

Forbidden:

- Implementing DB tables, services, routes, MCP tools, frontend screens, or legacy importers.
- Moving old prototype modules unless required for a structure test fixture.

## Dependencies And Scripts

Add runtime dependencies:

- `better-sqlite3`
- `drizzle-orm`
- `drizzle-zod`

Add dev dependencies:

- `vitest`
- `drizzle-kit`
- `@types/better-sqlite3`
- `tsx` if the package cannot already run TypeScript scripts reliably
- Frontend test dependencies may be deferred to Batch 07 unless this batch adds frontend tests

Add scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:structure": "tsx scripts/check-architecture.ts",
  "test:contracts": "vitest run src/**/*.contract.test.ts src/**/*.schema.test.ts",
  "db:generate": "drizzle-kit generate",
  "db:check": "drizzle-kit check",
  "schema:json": "tsx scripts/write-json-schemas.ts",
  "verify": "npm run typecheck && npm run test:structure && npm run test && npm run build"
}
```

Keep npm as the package manager because `prompt_reviews/package-lock.json` already exists.

## Required Directory Contract

The architecture checker must understand these boundaries:

```text
src/domain/**          shared enums, hand-authored Zod boundary schemas, pure rules
src/db/**              Drizzle schema, relations, generated row schemas, DB client, migrations
src/repositories/**    only layer allowed to use Drizzle query builders directly
src/services/**        workflow mutation boundary and state-machine truth
src/git/**             Git client and diff parsing
src/ingestion/**       version population orchestration
src/api/**             Fastify route modules and HTTP validation adapters
src/mcp/**             MCP tool/resource modules and schema adapters
src/legacy/**          explicit legacy import/export only
src/test-support/**    temp DB, fixtures, test helpers
web/src/**             frontend application
drizzle/**             generated migration SQL and metadata
```

## Mandatory Structure Rules

`scripts/check-architecture.ts` and `architecture-boundaries.test.ts` must fail when:

- `web/src/**` imports `src/db/**`, `src/repositories/**`, `src/services/**`, `better-sqlite3`, `drizzle-orm`, or generated row schemas.
- `src/api/**` or `src/mcp/**` imports `src/db/schema.ts`, `src/db/rowSchemas.ts`, Drizzle tables, SQL clients, or repository internals directly.
- `src/services/**` imports Fastify, MCP SDK, React, or frontend modules.
- `src/db/**` imports API, MCP, services, legacy importers, or web modules.
- Any module outside `src/db/**`, `src/repositories/**`, migrations, and DB test helpers imports `better-sqlite3` or `drizzle-orm`.
- Generated row schemas are imported outside repositories, repository tests, DB tests, and explicitly named domain composition tests.
- New primary workflow modules reference `.prompt-review.md`, `comments.json`, `ReviewFile`, `reviewPath`, `bundle`, `markdown_path`, `folder`, or generated markdown concepts outside `src/legacy/**`, importer tests, or old prototype files pending deletion.
- `src/server.ts` contains route business logic after Batch 05; it must become composition/bootstrap only.
- `src/mcp.ts` contains tool business logic after Batch 06; it must become composition/bootstrap only.

The checker must be strict by default. Use narrow allowlists with comments, not broad ignore rules.

## Required Stubs

Create placeholder `scripts/write-json-schemas.ts` that fails clearly until Batch 01 adds exported boundary schemas, or emits an empty generated artifact with a TODO message. The script must not pretend schemas exist.

Create placeholder `drizzle.config.ts` that points at the intended schema and migrations locations, even if Batch 02 fills them in.

## Tests

Add tests or script cases proving the architecture checker catches:

- A fake web import from `src/db/schema`.
- A fake API import from `src/db/rowSchemas`.
- A fake service import from Fastify.
- A fake primary module string reference to `reviewPath`.

Use fixtures or in-memory strings if easier than writing fake files.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` exists and fails on boundary violations.
- `npm run test` exists.
- `npm run build` still passes or any existing build break is documented with the exact failing reason.
- `drizzle.config.ts` and `vitest.config.ts` exist.
- The checker prevents generated row schemas from becoming the default public API/MCP contract.

## Rejection Criteria

Reject the batch if:

- It implements actual review tables, routes, tools, or frontend workflow.
- Structure tests are advisory only.
- The checker allows API/MCP to import DB rows directly.
- Legacy markdown terms are merely renamed and allowed as primary entities.
- `CommentStore`, generated markdown reviews, or `comments.json` remain described as active storage in new architecture docs.

