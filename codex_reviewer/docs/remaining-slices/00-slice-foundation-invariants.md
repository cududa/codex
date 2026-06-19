# Slice 00: Foundation Invariants And Response Cleanup

This is a pre-flight implementation slice for the remaining review workflow
work. It exists to remove low-level footguns before adding more product
surfaces.

This slice should be completed before `02-agent-review-evidence.md` unless a
human explicitly chooses to defer part of it.

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce product semantics,
workflow gates, event kinds, compatibility behavior, or response models that
conflict with those authority docs.

## Goals

Make the existing reset spine harder to misuse before later slices add more
tables and routes.

This slice owns:

- exact actor subtype contracts
- review event contract alignment
- database/service invariant patterns for target ownership and uniqueness
- response naming cleanup for current review-state writes
- test standards that catch fake or schema-only implementation work

It does not add agent reviews, comments, approvals, notes, plans, ledger rows,
or detector evidence.

## Exact Actor Contracts

The actor contract module must expose exact actor schemas:

- `HumanActorRefSchema`
- `AgentActorRefSchema`
- `SystemActorRefSchema`

Use `ActorRefSchema` only where the product operation intentionally accepts
multiple actor kinds.

Do not accept `ActorRefSchema` at a command boundary and then recover the
boundary with ad hoc runtime checks when the product model already requires one
actor kind.

Expected usage:

- human approval: `HumanActorRefSchema`
- ledger generation: `HumanActorRefSchema`
- agent review evidence: `AgentActorRefSchema`
- detector writes: `SystemActorRefSchema`
- local-change linking: generic actor contract is acceptable because the
  product allows human, agent, or system linkage

The first ingest implementation uses a system-scoped `source` string and
`concernMapVersion`, not a human or agent reviewer.

## Review Event Contract Alignment

Review events are not event sourcing. They are audit rows for material review
changes.

The implemented review-event type, SQL migration `CHECK` constraint, contract
schemas, service payloads, and tests must agree with `../review-events.md`.

Current baseline event kinds:

- `review_mark_changed`
- `concern_areas_changed`

Baseline payload kernels:

- `review_mark_changed`
  - `target`
  - `previousReviewMark`
  - `newReviewMark`

- `concern_areas_changed`
  - `target`
  - `commitId`
  - `previousConcernAreas`
  - `newConcernAreas`

Do not copy older payload names such as `reviewMark` or `concernAreas` when the
authority doc requires `newReviewMark` or `newConcernAreas`.

When a later slice adds an event, update all of these in the same change:

- `ReviewEventKind`
- SQL migration `CHECK` values
- event payload contract tests
- service insert payloads
- service tests asserting the payload kernel

Do not add catch-all or slice-local event names.

## Database And Service Invariants

Each slice that has scoped rows must enforce scope invariants in both database
schema and service tests.

Required patterns:

- exactly one target for scoped rows
- one active row where the product allows only one active row
- one current row where the product allows only one current row
- same-version ownership for nested scopes
- same-scope ownership for evidence links
- no persisted counters when the docs say counts are derived reads

SQLite implementation should use the strongest available database constraint
that fits the product rule:

- `CHECK` constraints for exactly-one-target rules
- unique indexes for one-row-per-parent rules
- partial unique indexes for one-active-row rules when needed
- foreign keys with cascade behavior where the parent owns the child

If SQLite support or Drizzle ergonomics make a constraint awkward, the service
must still enforce the invariant transactionally and the tests must name the
missing database constraint as a deliberate limitation. Do not silently demote a
product invariant into UI behavior.

Examples later slices must follow:

- agent reviews: exactly one target, commit or file
- comment threads: exactly one target, version/commit/file/diff block
- local change refs: exactly one target, commit or file
- human approvals: exactly one target and one active approval per target
- notes: exactly one target, commit/file/diff block
- plans: exactly one target and one plan per target
- ledger: one ledger per version
- detector evidence: scope belongs to the detector run's version

## Response Naming Cleanup

`ReviewStateWriteResponseSchema` is a naming attractor. It is valid only for
current mark/concern review-state mutations and must not be reused for evidence,
comments, notes, plans, approvals, ledger generation, detector writes, or
ingest.

Before adding later slices, rename the current mark/concern response to a more
specific contract so future agents do not copy it into unrelated commands.

Preferred direction:

- replace `ReviewStateWriteResponseSchema` with
  `ReviewMarkWriteResponseSchema`
- replace `ReviewStateWriteResponse` with `ReviewMarkWriteResponse`
- update route and web helper imports/usages
- keep the wire response shape as `{ version: ReviewVersionRead }`

This is a naming cleanup, not a behavior change. It should be covered by
existing route and web API tests.

Do not create a generic `WriteResponse` or `MutationResponse` replacement. That
would preserve the same footgun under a broader name.

## Anti-Theater Test Standard

Tests must prove behavior at the real boundary.

For each product slice, the minimum useful test set is:

- contract tests for request/response validation and forbidden variants
- migration/schema tests for table shape and hard invariants
- service tests for transactional writes and ownership failures
- route tests for validation, not-found, and conflict responses
- read-store/API tests proving composed reads reflect persisted rows
- web API/helper tests where UI/API integration is touched

Schema-only tests are not enough. A test that proves Zod accepts a shape does
not prove the product path is real.

Do not use fixtures or mocks that make the workbench look complete before the
backend path exists. UI tests should exercise API helpers or rendered state
derived from real contract responses.

## Guardrail Test Handoff

A useful small-agent task would be to add a guardrail test that fails when old
prototype vocabulary reappears in implementation-looking source.

Suggested handoff:

> Add a focused guardrail test for `codex_reviewer` that scans source files
> under `apps/*/src` and `packages/contracts/src` for old product vocabulary:
> classifications/classify, tags/taggings, primaryTag/secondaryTag/tagSlug,
> decisions, outcomes, remainingWork, nextAction, finalization/finalized,
> readiness/readyForApproval, version_closure, `DONE`, projection, and compat.
> The test must ignore docs, generated `dist`, node_modules, package-manager
> scripts, generic HTTP/runtime status, and the canonical review-note revision
> `action` exception. Keep the allowlist narrow and explicit. The goal is to
> catch old vocabulary in implementation-looking code, not to police prose in
> authority docs.
>
> Do not build a second architecture or a broad lint framework. Add one small
> test file, wire it into the existing test command if needed, and make the
> failure output list the offending path and matched term.

This guardrail should remain secondary. It protects the product spine; it must
not become a substitute for real slice tests.

## Acceptance Criteria

- `SystemActorRefSchema` exists, is exported, and rejects human/agent actors.
- Existing review-state event payload tests assert the canonical payload
  kernels from `../review-events.md`.
- Current mark/concern write responses no longer use
  `ReviewStateWriteResponseSchema` naming.
- Existing mark/concern write route and web API tests still pass with the new
  response name.
- A small old-vocabulary source guardrail exists or is explicitly deferred.
- No later slice has started adding product rows before these foundation
  footguns are resolved or deliberately deferred by a human.
