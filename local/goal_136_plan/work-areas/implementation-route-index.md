# Implementation Route Index

This file is the concise bearings map for executing the v136 Goal authority
rewrite after WA01-WA06 pre-pass and split planning.

It is execution guidance only. The authority docs under `local/goal_research`
still win. The parent Work Area docs, maps/readiness notes, and pass docs are
the route context. This index does not replace them.

## How To Use

Start from the first `todo` row whose predecessors are `done`. Read that pass
doc and the authority/code terrain it names before editing code.

Do not use this file to rerun split planning, re-verify every boundary, or add
new gates. Reopen planning only when a pass doc is missing, directly conflicts
with `local/goal_research`, or implementation finds a concrete route-breaking
dependency gap.

## Status Discipline

The `Status` column is intentionally tiny. Keep each cell to one of:

- `todo`
- `doing`
- `done`
- `blocked: <short reason>`

Do not add accomplishment notes, dates, sub-bullets, test logs, summaries, or
handoff text to this file. Detailed implementation results belong in the
agent's final response, commit message, PR description, or a separate handoff
note if the user asks for one.

## Ordered Route

| Order | Status | Pass | Scope |
| --- | --- | --- | --- |
| 00 | todo | `00-test-prep-and-baseline-reset.md` | Reset false-pressure tests and preserve upstream product baseline obligations. |
| 01a | todo | `01a-durable-facts-version-plumbing.md` | Durable Goal facts version plumbing. |
| 01b | todo | `01b-pending-cadence-intent-storage.md` | Pending cadence intent storage. |
| 01c | todo | `01c-cadence-aware-store-operations.md` | Cadence-aware state operations. |
| 02 | todo | `02-final-request-input-shaping-and-commit.md` | Final request-input shaping and Created-event commit. |
| 03a | todo | `03a-watermark-schema-store-apis.md` | Continuation watermark schema and store APIs. |
| 03b | todo | `03b-model-visible-history-key-projection.md` | Model-visible history key projection. |
| 03c | todo | `03c-goal-turn-request-metadata.md` | Metadata-only `GoalTurnRequest` lifecycle. |
| 03d | todo | `03d-idle-stage-order-refactor.md` | Idle stage ordering. |
| 03e | todo | `03e-idle-pending-durable-intent-delivery.md` | Idle delivery of pending durable cadence intent. |
| 03f | todo | `03f-automatic-continuation-preflight-shaper-recheck.md` | Automatic Continuation preflight and shaper recheck. |
| 03g | todo | `03g-continuation-created-commit.md` | Continuation Created-event commit and watermark advancement. |
| 03h | todo | `03h-resume-hydration-and-watermark-reconstruction.md` | Resume hydration and watermark reconstruction. |
| 03i | todo | `03i-retry-failure-and-stale-synthetic-turn-tests.md` | Retry, failure, and stale synthetic-turn tests. |
| 04a | todo | `04a-adapter-runtime-ordering-and-cadence-request-adapter.md` | v136 adapter/runtime ordering and metadata-only cadence request adapter. |
| 04b | todo | `04b-app-server-core-external-mutation-ordering.md` | App-server and core external mutation ordering. |
| 04c | todo | `04c-extension-tool-goal-mutations.md` | Extension `create_goal` and terminal tool mutation behavior. |
| 04d | todo | `04d-extension-runtime-objective-effects.md` | Extension runtime ObjectiveUpdated effects. |
| 04e | todo | `04e-extension-budget-limit-cadence-intent.md` | Extension BudgetLimit cadence intent. |
| 04f | todo | `04f-extension-steering-role-config-removal.md` | Extension steering role config removal. |
| 04g | todo | `04g-steering-module-and-injection-api-cleanup.md` | Steering module and injection API cleanup. |
| 04h | todo | `04h-wa04-tests-and-final-payload-verification.md` | WA04 tests and final-payload verification. |
| 05a | todo | `05a-internal-context-and-goal-artifact-classifier.md` | Internal-context support and strict Goal artifact classifier. |
| 05b | todo | `05b-request-input-cleanup-integration.md` | Request-input cleanup integration. |
| 05c | todo | `05c-contextual-parsing-projection-history-boundaries.md` | Contextual parsing, projection, and history boundaries. |
| 05d | todo | `05d-compaction-cleanup.md` | Compaction cleanup. |
| 05e | todo | `05e-rollout-reconstruction-rollback-fork-cleanup.md` | Rollout reconstruction, rollback, and fork cleanup. |
| 05f | todo | `05f-app-server-raw-and-materialized-projection.md` | App-server raw behavior and materialized projection. |
| 05g | todo | `05g-wa05-test-surface-and-cross-checks.md` | WA05 test surfaces and cross-checks. |
| 06a | todo | `06a-final-precondition-and-reachability-audit.md` | Final precondition and reachability audit. |
| 06b | todo | `06b-core-active-producer-and-carry-deletion.md` | Core active producer and concrete carry deletion. |
| 06c | todo | `06c-steering-role-config-removal.md` | Steering-role config removal. |
| 06d | todo | `06d-extension-steering-cleanup.md` | Extension steering cleanup. |
| 06e | todo | `06e-legacy-context-consumer-and-raw-cleanup.md` | Legacy context consumer and raw cleanup. |
| 06f | todo | `06f-test-deletion-map-closeout.md` | Test deletion-map closeout. |
| 06g | todo | `06g-final-acceptance-tests-and-audit-gates.md` | Final acceptance tests and audit gates. |

## Route Context

Use these only as context for the pass that names them:

- `01-existing-pass-validation.md`
- `02-direct-split-readiness-check.md`
- `03-history-key-and-idle-continuation-appendage-map.md`
- `04-ext-goal-reachability-and-ordering-map.md`
- `05-repair-classifiers-and-projections-surface-map.md`
- parent Work Area docs `01` through `06`
- `implementation-prepass-planning-rules.md`
- `implementation-pass-planning-rules.md`
