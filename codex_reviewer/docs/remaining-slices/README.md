# Remaining Implementation Slices

These are implementation handoffs for extending the reset code that already
exists in `codex_reviewer`.

The implemented spine is:

`ReviewVersion -> ReviewCommit -> ReviewFile -> DiffBlock -> read API -> workbench`

Each remaining slice must attach to that spine with durable rows, contract
schemas, service behavior, route coverage, read composition, minimal workbench
consumption, and targeted tests. Do not rebuild old prototype surfaces beside
the spine.

Do not start a later slice until the current slice is real in code.

Slice docs:

- `01-ingest-and-initial-review-state.md`
- `02-agent-review-evidence.md`
- `03-threaded-comments.md`
- `04-human-approval-and-local-change-refs.md`
- `05-review-notes.md`
- `06-review-plans.md`
- `07-review-ledger.md`
- `08-detector-evidence.md`

Authority docs still live one level up:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`
- `../canonical-review-note.md`

The slice docs may add implementation detail, but they must not invent product
semantics, workflow gates, event kinds, compatibility behavior, or response
models that conflict with those authority docs.

Current code is useful only in two ways:

- keep infrastructure that already matches the reset spine
- identify stale surfaces to delete or avoid

Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

Every slice starts with a source cleanup pass.

Read current `src/` code to find reset-spine extension points and stale source
surfaces. Do not treat generated output, app data, archived notes, old
prototype docs, or git history as product authority.

Do not port from:

- `packages/contracts/dist/`
- `apps/api/dist/`
- `apps/web/dist/`
- `apps/api/data/*.sqlite`
- `.turbo/`
- old UX outlines or archive docs
- pre-reset `prompt_reviews` concepts

Before adding slice code, scan the implementation-looking tree for old reset
vocabulary:

- `classification`, `classify`, `needs_classification`
- `tag`, `tags`, `tagging`, `taggings`
- `primaryTag`, `secondaryTag`, `tagSlug`
- `decision`, `decisions`
- `action`, `actions`
- `outcome`, `outcomes`
- `remainingWork`
- `nextAction`
- `finalization`, `finalized`, `readiness`, `readyForApproval`
- `version_closure`
- `DONE`
- `projection`
- `compat`

Delete or replace matching source surfaces unless the match is one of these
explicit exceptions:

- authority docs explaining deletion targets
- generic HTTP/runtime status unrelated to review workflow
- package manager lifecycle scripts
- canonical review-note revision `action`

A slice is not complete if it leaves new contracts, routes, services,
migrations, fixtures, tests, or UI labels shaped around old vocabulary.

When a slice touches review event plumbing, align the Drizzle event type,
migration `CHECK` constraints, service payloads, and tests to
`../review-events.md`. Do not copy older event payload names from current source
when they diverge from the authority doc.
