# Slice: Human Approval And Local Change Refs

Human approval is a product boundary. Agents may record evidence, but they must
not approve, revoke, or invalidate human approvals.

This slice depends on threaded comments because unresolved comments block
approval.

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce product semantics,
workflow gates, event kinds, or compatibility behavior not present in those
authority docs.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

Do not preserve or copy these current patterns into approval or local-change
evidence:

- `ReviewStateWriteResponseSchema`
- generic `ActorRefSchema` approval requests
- `localHumanActor` web defaults as approval authority
- `ReviewWriteStore` mark/concern mutation methods
- state-write pending flags as approval/evidence architecture
- app metadata `status` or `ready` vocabulary as review readiness

Do not port generated `dist` approval, ledger, final-mark, action, outcome,
decision, readiness, finalization, compatibility, or `DONE` shapes.

This slice must not start until threaded comments have durable unresolved
counts composed from comment rows. A reader that always returns zero unresolved
comments is not acceptable.

## Boundary

Human approval is human-only. The implementation must not follow the current
generic actor pattern used by mark and concern writes.

Approved marks are `PASS` or `MODIFY`; never `FLAG` and never `DONE`.

Add an explicit approval mark contract, for example
`ApprovedReviewMarkSchema = z.enum(["PASS", "MODIFY"])`. Do not reuse
`ReviewMarkSchema` and rely on service checks to reject `FLAG`.

Local change refs are evidence for completed local adaptation work. They are
not generic attachments.

## Product Rules

- Only a human actor may create or revoke a human approval.
- Agents must not create, update, revoke, or invalidate human approvals.
- A commit cannot be approved while the commit is `FLAG`.
- A commit cannot be approved while any file under it is `FLAG`.
- A commit cannot be approved while unresolved comments exist on the commit, its
  files, or their diff blocks.
- Files marked `MODIFY` require file-level human approval before the commit can
  be approved.
- `MODIFY` approval requires linked local change evidence.
- Commit approvals snapshot current ordered concern areas.

Automatic system invalidation is not part of this slice unless the root
workflow and event authority are updated to distinguish system invalidation from
human revocation.

## Persistence Requirements

Store local change refs as ordinary durable rows attached to exactly one target:

- commit
- file

Each ref owns local commit SHA, optional title/summary, actor metadata, and
created timestamp. Service code must validate that the target exists and that
the ref belongs to the target that later uses it as approval evidence.

Enforce exactly-one-target at the database and service layers. A local change
ref row must not point to both a commit and a file, and must not point to
neither.

Store human approvals as ordinary durable rows attached to exactly one target:

- commit
- file

Ordinary reads expose only the active approval for a commit or file. Revoked
approvals are audit/history.

Enforce one active approval per target. Revocation must mark the active approval
as revoked with revoker metadata and timestamp; it must not delete the approval
row.

Commit approval concern areas are snapshots of the current ordered commit
concern areas. Approval requests must not supply arbitrary concern areas.
Validation must use the canonical concern-area selection rule.

Approval-local-change links must reference local change refs for the same
approval scope. Commit approval must not silently borrow file local-change refs;
file `MODIFY` work is accepted through file approval before commit approval.

Enforce same-scope approval/local-change links with database constraints or
transactional service checks covered by tests.

## Contracts And API Shape

Add contracts for:

- `LocalChangeRefRead`
- `HumanApprovalRead`
- `ApprovedReviewMark`
- link commit local change request
- link file local change request
- record commit human approval request
- record file human approval request
- revoke human approval request
- link local change response
- record human approval response
- revoke human approval response

Approval requests must use the canonical human-only actor contract, currently
`HumanActorRefSchema`.

Local change linking may use the generic actor contract because humans, agents,
or system processes may link evidence.

MCP tools may expose local-change linking for agents when the actor is recorded
honestly. MCP tools must not expose human approval or approval revocation to
agents.

Do not use `ReviewStateWriteResponse` for approval or evidence writes. Those
writes are not current mark/concern state mutation. Return a focused response
or the refreshed owning `ReviewVersionRead` under a non-state response name.

Suggested API shape:

- `POST /api/review/commits/:commitId/local-change-refs`
- `POST /api/review/files/:fileId/local-change-refs`
- `POST /api/review/commits/:commitId/human-approval`
- `POST /api/review/files/:fileId/human-approval`
- `DELETE /api/review/commits/:commitId/human-approval`
- `DELETE /api/review/files/:fileId/human-approval`

Extend reads with:

- `ReviewCommitRead.localChangeRefs`
- `ReviewCommitRead.humanApproval`
- `ReviewFileRead.localChangeRefs`
- `ReviewFileRead.humanApproval`

## Events

This slice must append exactly these review events.

For local change links:

- kind: `local_change_linked`
- scope: the target commit or file
- actor: the actor that linked the local change ref
- payload:
  - `localChangeRefId`
  - `target`
  - `localCommitSha`

For human approval records:

- kind: `human_approval_recorded`
- scope: the approved commit or file
- actor: the `HumanActorRefSchema` actor that approved
- payload:
  - `humanApprovalId`
  - `target`
  - `approvedMark`
  - `approvedConcernAreas` for commit-scoped approvals only
  - `localChangeRefIds`

For human approval revocation:

- kind: `human_approval_revoked`
- scope: the revoked approval's commit or file
- actor: the `HumanActorRefSchema` actor that revoked
- payload:
  - `humanApprovalId`
  - `target`
  - `reason`

These event kernels must match `../review-events.md`. If this slice needs a
different event kind or payload, update `../review-events.md` first.

Do not add approval outcome, readiness, finalization, or status events.

## Workbench

Add to the review panel:

- local change ref list and add form for selected commit/file
- current human approval record for selected commit/file
- approve/revoke controls gated by current state
- API conflict messages when approval is blocked

Do not use "Done", "ready", "finalize", "decision", "action", or "outcome" as
product labels.

## Current Code Hazards

Current mark and concern write requests use generic actors. Approval requests
must not copy that pattern.

The current event enum and migration only include the implemented mark/concern
events. This slice must update them to include only
`local_change_linked`, `human_approval_recorded`, and
`human_approval_revoked`.

The current read shape has no local-change or human-approval fields. Add them as
ordinary composed reads under commits/files, not as projection documents.

## Tests

- reject agent approval
- reject approving flagged commits/files
- reject approving with unresolved comment counts
- reject `MODIFY` approval without local change evidence
- reject commit approval when a `MODIFY` file lacks file approval
- record/revoke approvals and audit events
- route tests for validation, `not_found`, and `state_conflict`
