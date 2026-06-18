# Codex Reviewer

Codex Reviewer reviews upstream Codex changes before accepting them locally.
The active implementation is a CRUD application spine for persisted review
versions, commits, files, ordered commit concern areas, and diff blocks.

## Shape

- `packages/contracts` owns canonical Zod contracts and inferred TypeScript
  types for the review read model.
- `apps/api` owns the Hono runtime, Drizzle schema, migrations, and read
  service that composes persisted rows into the canonical API shape.
- `apps/web` owns the workbench and consumes persisted review data through the
  API.

## Commands

```sh
pnpm install
pnpm --filter @prompt-reviews/api db:migrate
pnpm dev
pnpm verify
```
