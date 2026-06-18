# Code Kill List

This is not a roadmap. It is a deletion target list for the reset of
`codex_reviewer` around the product model and review workflow.

The rule is simple: if code preserves the old prototype vocabulary or exists
only to narrate an architecture that is not backed by the application spine, it
should be deleted or replaced.

## Old Product Vocabulary

Remove product code, schemas, routes, tests, UI labels, and fixtures built around
these concepts:

- classifications
- classify commands
- tags and taggings
- primary and secondary tags
- decisions
- actions
- outcomes
- remaining work hints
- next action hints
- version finalization, readiness, status, or closure
- `DONE` as a review mark
- compatibility adapters to old prototype shapes

Allowed replacements:

- concern areas for ordered commit-level concern vocabulary
- review marks: `PASS`, `FLAG`, `MODIFY`
- threaded comments for discussion
- review notes for durable markdown rationale
- review plans for markdown planning workspace
- review ledger for completion

## Persistence And Projection Machinery

Delete or replace persistence code that models response documents, projection
documents, compatibility blobs, or materialized review documents as the source
of truth.

Fresh Drizzle schema work should model durable product records directly:

- review versions
- review commits
- review files
- diff blocks
- concern areas
- local change refs
- agent reviews
- human approvals
- threaded comments
- review notes
- review plans
- detector runs and evidence
- review events
- review ledgers and ledger entries

Existing migrations do not need data-preserving evolution. The database can be
reset.

## Mock And Preview App Surface

Delete preview data and mocked app-shaped reads once the first real read API
exists.

The web workbench should consume API responses composed from persisted records,
not static review objects that make the application look complete before the
backend path exists.

## Guardrails

Do not keep guardrails as a second architecture.

Guardrails are acceptable only when they catch concrete regressions at real
boundaries. They should not police incidental test setup, force mirrored DTO
layers, or preserve old vocabulary by naming it in permanent tests.

During the reset, old guardrail tests should be deleted or rewritten after the
new application spine exists.

## First Code Pass

The first implementation pass should remove or replace code matching these
surfaces:

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

Generic HTTP response status fields and package-manager lifecycle scripts are
not deletion targets merely because they contain words like `status` or
`actions`.
