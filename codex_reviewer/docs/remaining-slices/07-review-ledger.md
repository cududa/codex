# Slice: Review Ledger

The review ledger is the final human-generated completion artifact for a review
version. It is not a version status, readiness flag, finalization flag, or close
workflow.

Do not implement this slice until these dependencies are implemented and tested:

- threaded comments and unresolved counts
- local change refs
- human approvals

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce status,
readiness/finalization, close-version workflow, or event kinds not present in
those authority docs.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

Do not implement this slice until durable threaded comments, unresolved counts,
local change refs, and human approvals exist in source and are covered by
tests. Do not add provisional ledger routes or UI that infer readiness from
current commit/file marks alone.

Do not port generated `dist` ledger contracts, stale `FinalReviewMarkSchema`,
`DONE` marks, finalization/readiness/status/close-version routes, action or
outcome vocabulary, compatibility adapters, projection documents, or ledger
event machinery.

Do not use `ReviewStateWriteResponseSchema`, app metadata `status`/`ready`, or
review-state write-store methods as ledger architecture.

## Boundary

Ledger generation is a human command.

The ledger row and ledger entry rows are the completion artifact. Do not mutate
`review_versions` to say the review is complete. There is no separate lifecycle
flag.

## Completion Gates

Ledger generation can happen only when:

- every commit has active human approval
- no commit is `FLAG`
- no file is `FLAG`
- every `MODIFY` commit or file has linked local change evidence
- every `MODIFY` file has file-level human approval before commit approval
- all comments under the version are resolved

Ledger generation must recheck every gate in the same transaction that inserts
the ledger.

Generation must fail if a ledger already exists for the version.

## Persistence Requirements

Store one immutable ledger per version for the first implementation. Ledger
replacement requires a later explicit product change.

Enforce one ledger per version at the database and service layers.

Store ledger entries as immutable acceptance snapshots generated from active
human approvals. Entries must record:

- commit ID and upstream SHA
- commit order
- final approved mark: `PASS` or `MODIFY`
- final ordered concern areas from the human approval
- human approval identity and timestamp
- accepted local change evidence

Do not make the ledger's meaning depend on later mutable review-state rows.
Ledger entries must snapshot the approval fields, ordered concern areas, and
local change fields needed to understand the final accepted result.

The ledger may store an optional human-authored summary. If the generate
request accepts a summary, store it on the ledger row as immutable ledger
content.

## Contracts And API Shape

Add contracts for:

- ledger final mark
- ledger read
- ledger entry read
- generate ledger request
- ledger write response

The generate request must use the canonical human-only actor contract.

Approved and final marks are `PASS | MODIFY`, never `FLAG` and never `DONE`.
Add a fresh source contract, for example
`LedgerFinalMarkSchema = z.enum(["PASS", "MODIFY"])`; do not import or revive
stale generated final-mark contracts.

The generate request actor must use `HumanActorRefSchema`.

Suggested API shape:

- `POST /api/review/versions/:versionId/ledger`

Do not add a version finalize/ready/status/close route.

Extend `ReviewVersionRead` with `ledger: ReviewLedgerRead | null`, composed
from persisted ledger rows.

Do not use `ReviewStateWriteResponse` for ledger generation. Ledger generation
is completion artifact creation, not a mark/concern state write.

## Events

Do not add a ledger event unless `../review-events.md` is deliberately updated
as an authority-doc change.

The ledger rows are the source of ledger state. Review events must not become a
shadow completion model.

There is no `ledger_generated`, `review_finalized`, `version_closed`, or
`ready_for_approval` event in this slice.

## Workbench

Show:

- ledger presence and generated ledger details for selected version
- generate ledger command derived from current reads
- API conflict messages when generation is blocked

The service remains authoritative for gates. UI affordances must not become
persisted readiness.

Do not label this "finalize" or "done."

## Current Code Hazards

The current `review_versions` table has no status/finalization fields. Keep it
that way.

The current event enum and migration only include implemented mark/concern
events. Do not add a ledger event unless root event authority changes.

## Tests

- contract tests reject `FLAG` and `DONE` ledger marks
- DB tests enforce one ledger per version and ordered entries
- service tests reject non-human actors, unmet gates, and second ledger
  generation
- service tests snapshot marks, concern areas, approvals, and local change refs
- route tests return contract-shaped ledger/version reads
- web tests call the ledger route and refresh persisted review data
