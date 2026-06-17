# Codex Reviewer

Codex Reviewer is the fresh workspace foundation for a future prompt review
workbench. The current implementation is intentionally neutral: shared
contracts, a Hono API, and a React shell with no product database model yet.

## Shape

- `packages/contracts` owns Zod schemas, inferred TypeScript types, and API
  contracts.
- `apps/api` owns Hono runtime wiring and contract-backed validation.
- `apps/web` owns the neutral workbench shell and consumes
  `@prompt-reviews/contracts` instead of reaching into backend source.

No database schema, repository layer, service layer, or review-domain model is
part of this foundation pass. Those belong in a later domain-design step.

## Commands

```sh
pnpm install
pnpm dev
pnpm verify
```
