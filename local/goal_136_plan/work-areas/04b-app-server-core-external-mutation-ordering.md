# WA04b App-Server Core External Mutation Ordering

This implementation pass converts app-server Goal mutation ordering to the
WA01 durable cadence APIs and the WA04a metadata-only cadence request adapter.

It preserves app-server product behavior and notification ordering while
removing app-server reachability into old active Goal model-input injection.
App-server remains a product API adapter: it may validate requests, preserve
responses/notifications, call WA01 durable operations, and request WA04a
metadata-only rechecks. It does not deliver active Goal steering.

## Direction Lock

Request:

- convert app-server `thread/goal/get`, `thread/goal/set`, and
  `thread/goal/clear`
- convert the core `goals.rs` external mutation hook used by app-server
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `thread_goal_set_inner(...)` currently validates, reconciles rollout,
  prepares running-thread Goal mutation, writes facts-only state, sends
  response, emits ordered notification, then applies runtime effects
- app-server currently calls core `CodexThread::apply_external_goal_set(...)`
  and core `goals.rs::apply_external_thread_goal_status(...)`
- core external ObjectiveUpdated still builds `GoalSteeringMessage` and
  injects concrete model input
- app-server does not need a `codex-goal-extension` dependency for v136

Code-shape temptation:

- force app-server through `ext/goal` or a service facade just because
  v139/v140 later route app-server through `GoalService`
- keep app-server on facts-only state writes and let runtime injection fill the
  cadence gap
- treat the existing `<goal_context>` app-server test as acceptable because it
  checks developer role

Locked direction:

- app-server keeps its processor path and ordered response/notification shape
- app-server uses WA01 cadence-aware state operations for facts plus pending
  intent
- app-server treats the returned WA01 state outcome as the only source of
  pending-cadence metadata; request-shape branches may select an operation but
  must not invent delivery metadata after the fact
- running-thread effects use core runtime/accounting adapters and WA04a
  metadata-only recheck requests
- active Goal model input is delivered only by WA02 request-input shaping

Exclusions:

- no app-server dependency on `codex-goal-extension`
- no active model input construction in app-server or core external mutation
  effects
- no pending-intent consumption in app-server
- no Continuation watermark advancement in app-server or core external mutation
  effects
- no recorded request evidence writer in app-server

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `thread_goal_set_inner(...)`
  - `thread_goal_get_inner(...)`
  - `thread_goal_clear_inner(...)`
  - `emit_thread_goal_updated_ordered(...)`
  - `emit_thread_goal_cleared_ordered(...)`
- `codex-rs/core/src/codex_thread.rs`
  - `prepare_external_goal_mutation(...)`
  - `apply_external_goal_set(...)`
  - `apply_external_goal_clear(...)`
  - WA04a cadence request adapter
- `codex-rs/core/src/goals.rs`
  - `ExternalGoalSet`
  - `ExternalGoalPreviousStatus`
  - `GoalRuntimeEvent::ExternalSet`
  - `apply_external_thread_goal_status(...)`
- WA01 state APIs in `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`

## Pass Goal

Convert app-server external Goal mutations from:

```text
facts-only write
  -> core runtime GoalContext injection
```

to:

```text
thread/goal/set:
  prepare/account
    -> atomic durable mutation returns current facts plus pending-intent summary
    -> preserve response and ordered notification behavior
    -> runtime/accounting effect
    -> metadata-only cadence recheck request only when the outcome created due intent

thread/goal/clear:
  prepare/account
    -> atomic delete of facts plus all pending intent
    -> runtime/accounting clear
    -> preserve response and ordered notification behavior
```

Cadence intent must be determined from the WA01 state outcome and resulting
durable status/facts, not from app-server request-shape branches. A request
that includes both an objective and a status/budget update must follow the
same supersedence rules as every other producer.

The logical `thread/goal/set` order is:

```text
validate request
materialize/reconcile thread state
prepare/account running-thread Goal progress
persist durable facts plus pending cadence intent atomically through the WA01
  operation selected from current facts plus requested facts
use the returned state outcome as the only source of pending-cadence metadata
preserve app-server response and ordered notification behavior
apply runtime/accounting effects
request metadata-only same-turn cadence recheck when possible
leave pending intent for ordinary turn or WA03 idle Stage 2 when unavailable
```

Nothing in that order consumes pending intent, writes recorded request
evidence, advances a Continuation watermark, or proves final model authority.
Those happen only through WA02/WA03 final request-input and Created-event commit
paths.

## Exact Files To Edit

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- WA01 state API callsites in `codex-rs/state/src/runtime/goals.rs` only if
  compile fallout requires signatures to be adjusted
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/app-server/BUILD.bazel` only if dependency metadata changes

## Required Edits

1. Keep `thread/goal/get` as a product read path. It must not create cadence
   intent, request same-turn delivery, construct model input, or inspect model
   input.
2. Convert `thread/goal/set` to select the WA01 durable operation by current
   facts plus requested facts, and then use the returned state outcome as the
   only source of pending-cadence metadata.
3. For a new or replacement active Goal, the WA01 outcome must write durable
   facts plus pending Initial intent in one transaction. If the resulting Goal
   is not active, it must clear/supersede active-state intent instead of
   creating Initial.
4. For same-goal objective edits that leave the Goal active, the WA01 outcome
   must write updated facts plus pending ObjectiveUpdated intent in one
   transaction. If the same request also moves the Goal to BudgetLimited or a
   terminal/non-active status, the outcome must apply BudgetLimit or cleanup
   supersedence instead of blindly creating ObjectiveUpdated.
5. Convert status-only or budget/status updates to WA01 APIs that allocate
   facts versions and clear/supersede active-state pending intent as required.
   Only request cadence delivery when the returned outcome contains pending
   Initial, ObjectiveUpdated, or BudgetLimit intent. Manual terminal,
   paused/stopped, usage-limited, and non-cadence status updates must not create
   active steering merely because Goal facts changed.
6. Preserve empty-thread preview fill when an objective is provided.
7. Convert `thread/goal/clear` to delete durable facts plus all pending intent
   for the thread atomically.
8. Replace the `ExternalGoalSet` runtime payload with a state outcome or
   equivalent structure carrying:
   - current durable Goal facts
   - previous Goal status/facts needed for metrics
   - pending intent kind and facts version when created
   - runtime/accounting effects
9. Update `core/src/goals.rs::apply_external_thread_goal_status(...)` so it
   preserves metrics/accounting and calls the WA04a metadata adapter when a
   pending cadence intent was created. It must not infer cadence kind from the
   app-server request body or rendered/helper text.
10. Delete the app-server/core external mutation path that creates
   `GoalSteeringMessage` and injects concrete items.
    Leave a grep-able route for 04g to audit: after this pass,
    `GoalRuntimeEvent::ExternalSet` / `apply_external_thread_goal_status(...)`
    must no longer be a WA04 producer path into `GoalSteeringMessage` or
    `inject_goal_response_items(...)`.
11. Preserve app-server response and ordered notification behavior:
    - `thread/goal/set` preserves response before ordered update notification,
      then applies runtime/accounting effects and metadata requests.
    - `thread/goal/clear` preserves runtime/accounting clear before response
      and ordered clear notification.
12. If same-turn metadata cannot be accepted, leave durable pending intent for
    ordinary turn or WA03 idle Stage 2 delivery.
13. Ensure app-server response/notification emission, runtime effects, and
    same-turn metadata requests do not consume pending intent. Exact-key
    pending intent consumption belongs to the Created-event commit path after
    the final request input contains the selected developer-role Goal item.
14. If recorded request evidence is in scope for an implementation pass,
    app-server/core may expose metadata that later helps the commit path, but
    must not append evidence. Evidence is structured Created-event metadata
    paired to the finalized request input by fingerprint.

## Tests And Checks

Keep upstream product tests active, including:

- `thread_goal_get_rejects_unmaterialized_thread`
- `thread_goal_set_preserves_budget_limited_same_objective`
- `thread_goal_set_persists_resumable_stopped_statuses`
- `thread_goal_set_edits_objective_without_resetting_usage`
- `thread_goal_clear_deletes_goal_and_notifies`

Update or prepare:

- `thread_goal_set_active_schedules_developer_role_goal_steering`
  - keep the scenario
  - assert final captured `/responses` input contains exactly one current outer
    developer-role Goal `ResponseItem`
  - assert no active `<goal_context>` item reaches final request input
  - assert no user-role active Goal item is present

Add app-server/core coverage as needed for:

- app-server objective edit writes ObjectiveUpdated pending intent
- app-server objective plus BudgetLimited or terminal status does not create a
  stale ObjectiveUpdated intent
- clear deletes facts plus pending intent
- objective-bearing set still preserves empty-thread preview fill
- same-turn metadata unavailable leaves intent pending
- app-server response/notification emission and WA04a metadata request do not
  consume pending intent before Created-event commit
- objective-bearing final payload renders the persisted updated objective, not
  request body text, helper output, or a rollout artifact

Do not use helper output, raw notifications, ordinary rollout items, rollout
trace, classifier matches, or rendered Goal text as substitutes for final
request input. Recorded request evidence, if asserted, is not a substitute
either; it must be structured Created-event metadata paired to captured final
input by fingerprint.

## Branch Continuation State

After this pass:

- app-server mutation paths use WA01-shaped durable cadence operations
- app-server no longer depends on core active Goal injection for
  ObjectiveUpdated or Initial delivery
- core external mutation effects are metadata-only for cadence delivery
- 04g can audit `core/src/goals.rs` to confirm app-server/external mutation no
  longer reaches `GoalSteeringMessage` or concrete injection
- old extension runtime injection paths may still remain until 04d/04e
- old core injection APIs may still exist for unconverted producers and later
  cleanup

This state is not full WA04 acceptance until extension producers and old
steering modules are converted.

## Non-Goals

- do not introduce `ext/goal/src/api.rs`
- do not convert extension `create_goal`
- do not convert extension BudgetLimit
- do not implement automatic Continuation
- do not add recorded request evidence outside the WA02 Created-event commit
  path
- do not redesign app-server wire payloads or notification names
