# Codex Reviewer

Codex Reviewer reviews upstream Codex changes before accepting them locally.
The active implementation is a CRUD application spine for persisted review
versions, commits, files, ordered commit concern areas, diff blocks, review
state writes, and review audit events.

Authority docs:

- [`docs/product-model.md`](docs/product-model.md)
- [`docs/review-workflow.md`](docs/review-workflow.md)
- [`docs/review-events.md`](docs/review-events.md)
- [`docs/code-kill-list.md`](docs/code-kill-list.md)
- [`docs/canonical-review-note.md`](docs/canonical-review-note.md)

## Shape

- `packages/contracts` owns canonical Zod contracts and inferred TypeScript
  types for review reads and review-state write requests.
- `apps/api` owns the Hono runtime, Drizzle schema, migrations, and read
  service that composes persisted rows into the canonical API shape. Review
  state writes mutate durable rows through the write service and append
  `review_events` history rows.
- `apps/web` owns the workbench and consumes persisted review data through the
  API. Workbench controls call the write routes and then read back canonical
  persisted state.

Local databases can be reset during this unshipped reset. Run migrations after
pulling schema changes so `review_events` exists beside the core review tables.

## Commands

```sh
pnpm install
pnpm --filter @prompt-reviews/api db:migrate
pnpm dev
pnpm verify
```
