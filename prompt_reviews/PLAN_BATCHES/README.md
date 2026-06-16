# Prompt Reviews Rebuild Batch Index

These files are implementation contracts for rebuilding `prompt_reviews` as a structured SQLite-backed review workbench. They are not suggestions and they are not a substitute for the source of truth in code.

The architectural split is fixed:

- Drizzle owns persistence: SQLite tables, relations, indexes, foreign keys, nullability, defaults, row shape, and migrations.
- `drizzle-zod` generated row schemas are DB-row building blocks only.
- Hand-authored Zod schemas own API, MCP, frontend, structured agent payloads, and domain command/response validation.
- Services own workflow truth: scope invariants, human-only finalization, comment lifecycle, status derivation, unresolved-work gates, and explicit version closure.
- `src/domain/**` is the shared frontend/backend contract layer for pure enums, hand-authored
  boundary schemas, taxonomy, and pure rules. It must remain browser-safe.
- The frontend imports shared domain schemas/types from `src/domain/**` via the `@domain/*`
  alias, never DB-only modules.
- Legacy markdown and `comments.json` are import/export material only.

## Execution Order

Agents must update this table as work progresses. Keep `Status` current, and use `Implementation Notes` for commit hashes, PRs, verification commands, blockers, or handoff details that matter to the next agent.

| Order | Batch | Status | Implementation Notes |
| --- | --- | --- | --- |
| 1 | `00_architecture_test_harness_and_gates.md` | Completed | Added npm/Drizzle/Vitest harness, strict architecture checker, prototype quarantine, generated-row-schema boundary guard, LOC cap, flat-directory cap, and placeholder schema export script. Verified `npm run verify`, `npm run test:contracts`, and `npm run db:check`. `npm run schema:json` intentionally fails until Batch 01 exports hand-authored boundary schemas. `npm run db:generate` fails until Batch 02 creates `src/db/schema.ts`. |
| 2 | `01_domain_enums_boundary_schemas_and_rules.md` | Completed | Milestone A accepted shared enum arrays, scope schemas, actor/scope rules, taxonomy seeds, and focused tests. Milestone B accepted boundary schemas/json-schema export and pure status derivation rules. Verified `npm run verify`, `npm run schema:json`, `npm run db:check`; `npm run test` has 10 files / 36 tests. `npm run db:generate` still fails until Batch 02 creates `src/db/schema.ts`. |
| 3 | `02_persistence_drizzle_sqlite_repositories.md` | Completed | Milestone A accepted Drizzle schema, relations, generated row schemas, migration/bootstrap helpers, DB test support, concern-tag seeding, and migration files. Milestone B accepted repository modules and repository tests for all aggregates, transaction rollback, and stable commit/file cursor pagination. Verified locally: `npm run typecheck`, `npm run test:structure`, `npm run test` (12 files / 55 tests), `npm run db:check`, `npm run build`, `npm run schema:json`, and `npm run db:generate` with no schema drift. |
| 4 | `03_git_ingestion_version_population.md` | Not started |  |
| 5 | `04_services_workflow_state_machine.md` | Not started |  |
| 6 | `05_http_api_contracts.md` | Not started |  |
| 7 | `06_mcp_tools_contracts.md` | Not started |  |
| 8 | `07_frontend_workbench.md` | Not started |  |
| 9 | `08_legacy_import_export.md` | Not started |  |
| 10 | `09_final_acceptance_and_lead_review.md` | Not started |  |

## Non-Negotiable Rules

- Batch 00 must land first. No table, route, tool, or UI implementation starts before the architecture boundary tests exist.
- Batch 08 stays last. Legacy artifacts must not shape the primary schema.
- API and MCP contracts must be domain contracts, not generated DB row schemas.
- Services must be the only workflow mutation boundary.
- Agents may classify, comment, and propose decisions or plans. Human finalization is required for accepted decisions and version closure.
- No primary workflow may depend on `.prompt-review.md`, generated review paths, bundles, or `comments.json`.

## Shared Verification Commands

Each batch should run the strictest available subset of:

```bash
npm run typecheck
npm run test:structure
npm run test
npm run db:generate
npm run db:check
npm run schema:json
npm run build
```

If a command is introduced by a later batch, earlier batches must say so explicitly in their completion notes.
