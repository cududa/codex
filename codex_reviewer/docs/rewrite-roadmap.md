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

The guardrails should fail on:

- active use of tag/tagging/classification/classify vocabulary
- public request/response schemas outside the contracts package
- duplicated local DTOs that mirror canonical schemas
- imports that reshape canonical schemas into old structures
- generated JSON/OpenAPI being treated as source of truth
- old persistence or projection concepts
- MCP tools that bypass canonical schemas

The contracts package should remain the single source for public schemas, inferred types, and derived artifacts.

## Operating Rule

Each step should be approved before implementation. If investigation shows a planned step would recreate old architecture under new names, stop and revise the plan before coding.
