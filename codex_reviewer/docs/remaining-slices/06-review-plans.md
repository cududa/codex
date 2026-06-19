# Slice: Review Plans

Review plans are markdown workspaces attached to review scopes. They are not
checklists, task statuses, approvals, decisions, or workflow engines.

Implement this only after review notes are real.

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce workflow state,
event kinds, or compatibility behavior not present in those authority docs.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

There is no active plan implementation to port. Build plans as a greenfield
markdown workspace attached to the reset spine.

Do not port generated `dist` plan contracts, old row schemas, camelCase event
kinds such as `planUpdated`, `review_plan_updated`, plan item rows, checklist
rows, task statuses, decision links, action queues, outcomes, readiness, or
compatibility adapters.

Do not use `ReviewStateWriteResponseSchema`, mark/concern write-store methods,
queue chips, plan counts, status badges, or persisted completion fields for
plans.

## Boundary

A review plan is one editable markdown workspace per review scope.

It is not task management. Do not add plan item rows, checklist rows, statuses,
transitions, decision links, action queues, outcomes, approval state, readiness,
or completion fields.

## Scope

Canonical plan scopes are:

- version
- commit
- file
- diff block

If the scope model is narrowed, update the authority docs before
implementation.

The first UI may expose only version, commit, and file plans. Storage and
contracts should still follow the canonical scope model unless the authority
docs change.

## Persistence Requirements

Store one current markdown plan per scope as an ordinary durable row.

The row owns scope, body markdown, created actor metadata, updated actor
metadata, and timestamps.

Upsert must validate that the target version, commit, file, or diff block
exists.

Enforce exactly-one-target and one-plan-per-scope at the database and service
layers. A plan row must not point to multiple scopes, must not be targetless,
and must be unique for its target scope.

Plan markdown may be empty. Use a plan-specific body schema that permits an
empty string; do not reuse `MarkdownStringSchema` if it still requires non-empty
content. An empty body means an empty workspace, not deletion.

Do not add plan revision rows unless a separate product decision adds plan
history. The `review_plans` row is current state.

## Contracts And API Shape

Add contracts for:

- plan scope
- plan read
- plan response
- upsert plan request

The write request should contain only actor and `bodyMarkdown`. The scope comes
from the route.

Plan actor contracts may use the union of `HumanActorRefSchema` and
`AgentActorRefSchema`. Do not use `ActorRefSchema` if system-authored plans are
not part of the product model.

Plan reads should return a plan-shaped response, likely
`plan: ReviewPlanRead | null`. Do not use `ReviewStateWriteResponse`.

Use explicit response contracts:

- `ReviewPlanResponse`
- `UpsertReviewPlanResponse`

Fetch plans on demand for the selected scope. Do not add plans to the primary
`ReviewVersionRead` or to commit/file queue data in this slice.

MCP tools may use the same plan upsert command for humans or agents. There is
no agent-specific plan model.

Suggested API shape:

- `GET /api/review/versions/:versionId/plan`
- `PUT /api/review/versions/:versionId/plan`
- `GET /api/review/commits/:commitId/plan`
- `PUT /api/review/commits/:commitId/plan`
- `GET /api/review/files/:fileId/plan`
- `PUT /api/review/files/:fileId/plan`
- `GET /api/review/diff-blocks/:diffBlockId/plan`
- `PUT /api/review/diff-blocks/:diffBlockId/plan`

## Events

Upserting a plan must append exactly this review event in the same transaction
as the plan row write:

- kind: `plan_updated`
- scope: the plan target
- actor: the actor that upserted the plan
- payload:
  - `planId`
  - `target`

This event kernel must match `../review-events.md`. If this slice needs a
different event kind or payload, update `../review-events.md` first.

Do not require previous/new markdown bodies in the event payload; event
payloads must not become plan revision storage.

## Workbench

Use a large markdown workspace visually below the diff blocks in the diff pane.

Do not put plans in commit/file queues. That turns planning into workflow state.

## Current Code Hazards

There is no current plan implementation to port. This slice is greenfield.

The current event enum and migration only include the implemented mark/concern
events. This slice must update them to include only `plan_updated` for plan
writes, not `planUpdated` or `review_plan_updated`.

## Tests

- contract tests for plan scope and upsert request
- DB tests for one plan per scope and no checklist/status columns
- write-service tests for create/update and event writing
- route tests for absent plan reads and upsert behavior
- web API/helper tests without decision/action/outcome vocabulary
