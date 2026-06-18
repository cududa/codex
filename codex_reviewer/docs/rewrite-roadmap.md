# Rewrite Roadmap

This roadmap starts after the target journey documentation and canonical contract schemas. It assumes `codex_reviewer` is the clean target workspace and that `prompt_reviews` is prototype reference material only.

## Already Established

1. Target journey and vocabulary live in `codex_reviewer/docs/UX_outline.md` and the canonical follow-up notes in `codex_reviewer/docs`.
2. Canonical schemas live in `codex_reviewer/packages/contracts`.
3. The Hono API should consume those contracts directly, with real request/response validation and no fake persistence layer.
4. `ReviewNote` is the canonical freeform markdown note model. It is not a renamed prototype action/outcome system.

## Remaining Sequence

### 4. Fresh Persistence

Status: implemented as the current stage-4 target.

Add a new Drizzle-backed persistence model only after the API contract shape is approved.

The database should model the target concepts directly:

- review versions
- upstream commits
- changed files
- diff blocks
- commit concern areas with ordering
- commit and file review marks
- local change references
- agent reviews
- human approvals
- review events
- threaded comments
- review notes with revision history
- review plans
- completed review ledgers and final ledger entries

Do not preserve old migrations, old review data, old repositories, old projection helpers, or document-shaped storage.

Do not preserve the old prototype action/outcome system. There are no action tables, action schemas, dropdown actions, outcome enums, or compatibility adapters.

Do not preserve the old version lifecycle/status concept. Review completion is represented by a generated review ledger and its entries, not by a version-level completion flag or separate completion wrapper table.

### 5. Selective Frontend Port

Bring over only the valuable frontend experience from `prompt_reviews/web`.

Useful pieces may include:

- workbench layout
- commit/file queues
- diff viewer
- comment interaction patterns
- panel primitives
- styling conventions that still fit the target journey

Do not port old vocabulary or old frontend data assumptions:

- tags
- taggings
- classification
- primary/secondary tag controls
- old action/outcome UI
- old plan item workflow UI
- old version lifecycle/status substitutes for human approval

### 6. Concern Map And Ingest Integration

After contracts and persistence exist, inspect and integrate the concern map and ingest pipeline.

The goal is for ingestion and detector tooling to produce first-pass review state:

- commit concern areas
- commit review marks
- file review marks when needed
- detector evidence that remains distinct from editable review state

Concern map definitions should feed the canonical `ConcernArea` model instead of recreating parallel hand-shaped objects.

### 7. MCP Surface

Add MCP tools and resources against the same canonical contracts used by HTTP and the frontend.

Agents may:

- read review versions, commits, files, diff blocks, comments, review notes, plans, and ledger state
- set or correct commit concern areas
- set or correct commit/file review marks
- record agent reviews
- add threaded comments
- resolve comments when appropriate
- add review notes
- update review notes
- delete review notes
- add or update review plans
- link local change references when local adaptation work is complete

Agents may not:

- create human approvals
- approve commits
- approve files
- generate completed review ledgers

### 8. Guardrails

Add tests that prevent prototype concepts from entering `codex_reviewer` active code.

This stage is intentionally red-first. The guardrail suite does not exist to prove the current code is clean. It exists to expose every active-code place where the rewrite is incomplete. A large initial failure count is acceptable and useful. Do not skip, soften, or narrow a guardrail so `pnpm verify` stays green. Stage 8 is complete only when the guardrail suite reports zero active-code violations.

The guardrails should fail on:

- active use of tag/tagging/classification/classify vocabulary
- public request/response schemas outside the contracts package
- duplicated local DTOs that mirror canonical schemas
- imports that reshape canonical schemas into old structures
- generated JSON/OpenAPI being treated as source of truth
- old persistence or projection concepts
- MCP tools that bypass canonical schemas

The contracts package is the only source for public schemas, inferred public types, command schemas, read schemas, row schemas, and derived artifacts. HTTP, MCP, ingest, detector, API, web, and persistence must consume canonical contracts. Generated JSON Schema/OpenAPI artifacts may exist only as derived outputs from the contract registry and can never become validation or typing authority.

#### 8.1 Guardrail Test Suite

Implement the guardrails in a Vitest suite named `packages/contracts/src/guardrails.test.ts`.

The suite walks active `codex_reviewer` source and fails with a complete violation report. Each violation must include:

- rule id
- rule description
- relative file path
- offending line number when applicable
- offending snippet or missing surface message

The scanner must exclude dependency, generated, cache, build, and documentation output:

- `node_modules`
- `.turbo`
- `dist`
- `build`
- `coverage`
- `.next`
- `.vite`
- `docs`

The guardrail implementation may name forbidden tokens inside its own rule definitions. That is not an active product surface. Do not generalize this into allowlists for application code.

#### 8.2 Active Source Roots

Scan these roots when they exist:

- `packages/contracts/src`
- `apps/api/src`
- `apps/web/src`
- `apps/mcp/src`
- `packages/mcp/src`
- `apps/ingest/src`
- `packages/ingest/src`
- `apps/concern-map/src`
- `packages/concern-map/src`

The scanner must not import or depend on `prompt_reviews`. If any active source imports from `prompt_reviews`, that is a violation.

Missing MCP implementation is not the implementation task for this stage. The guardrail still owns MCP rules: as soon as an MCP source root exists, it must be scanned and must use canonical contracts and centralized write paths.

#### 8.3 Rules To Implement

Implement these rule ids exactly:

- `old-review-vocabulary`: fail old review-domain vocabulary in active source, including tag/tagging/classification/classify names, primary/secondary tag names, `needs_classification`, old decision/action/outcome review machinery, and old finalization/status/readiness lifecycle substitutes.
- `public-schemas-outside-contracts`: fail route, MCP, ingest, detector, API, web, or persistence public schemas outside `packages/contracts/src`. Route-local `z.object(...)` request/response schemas and exported `*Schema` boundary objects outside contracts are violations.
- `mirrored-local-dtos`: fail local `type` or `interface` definitions outside contracts that recreate canonical review objects, commands, rows, responses, MCP payloads, app metadata, API errors, or bootstrap payloads.
- `reshape-into-old-structures`: fail imports or adapters that map canonical `ConcernArea`, `concernAreas`, `ReviewMark`, or `ReviewNote` into old tag/classification/status/finalization/decision/action/outcome structures.
- `generated-schema-authority`: fail active imports or runtime reads of OpenAPI, Swagger, JSON Schema, or generated TypeScript schema artifacts as validation or typing authority.
- `old-persistence-or-projection`: fail document-shaped review storage, generic domain `payload_json`, projectors, materialized document helpers, prototype migration/preservation paths, file-level concern-area storage, old tag/classification/decision/action/outcome/finalization/status tables, and direct DB writes outside centralized persistence, migrations, or DB constraint tests.
- `mcp-bypasses-contracts`: fail MCP code that defines local canonical tool/resource schemas, validates with generated artifacts, imports DB schema/client modules, writes Drizzle tables directly, imports old MCP tools, exposes old classify/tag tools, allows agents to create human approvals, allows agents to approve commits/files, allows agents to generate completed review ledgers, or bypasses centralized command-backed writes.

#### 8.4 Required Assertions

The suite must contain tests that prove:

- every scan violation is reported with rule id, path, and snippet/message
- `prompt_reviews` imports fail
- old review vocabulary fails in active app/API/MCP/ingest/detector code
- public schemas outside contracts fail
- local mirrored DTOs outside contracts fail
- canonical-to-old adapter/reshape code fails
- generated schema authority fails
- old persistence/projection concepts fail
- direct DB writes outside centralized persistence/migrations/DB tests fail
- MCP bypasses fail when MCP source exists

Do not make these tests pass by matching the current repo shape. Red failures are work items. The completion state is zero active-code violations, not a softened suite.

#### 8.5 Canonical Contract Consumption

Allowed active-code consumption patterns are:

- direct imports from `@prompt-reviews/contracts`
- route validation with imported command or query schemas
- MCP tool validation with imported command schemas
- MCP resource validation with imported read or response schemas
- web/API client parsing with imported response/read schemas
- persistence row validation with imported row schemas
- command-to-row lowering inside centralized review persistence only

Everything else is suspect until proven canonical by the guardrail. The tests should force code changes when the scanner cannot safely distinguish a harmless infrastructure type from a public review model.

## Operating Rule

Each step should be approved before implementation. If investigation shows a planned step would recreate old architecture under new names, stop and revise the plan before coding.
