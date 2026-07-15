# WA04 `ext/goal` Reachability And Ordering Map

This is the pre-pass reachability and ordering map for
`04-ext-goal-conversion.md`.

It is not an implementation pass doc. It exists to make the reachable
extension/app-server Goal mutation paths, active-input construction paths, and
ordering choices explicit before WA04 split planning.

## Direction Lock

Request:

- produce only the WA04 reachability and ordering map
- ground it in `local/goal_research`, completed WA01/WA02/WA03 pre-pass route
  context, the WA04 parent doc, and real local/upstream terrain
- do not implement Rust code
- do not write WA04 implementation pass docs in this pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

Route context:

- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`

Terrain:

- local `ext/goal` is compiled and test-reachable through
  `install_with_backend(...)`, but a local repo grep found no production host
  caller outside extension tests
- local `ext/goal` still stores `GoalContextRole`, builds `GoalContext`, and
  injects concrete `ResponseInputItem`s through `ThreadManager`
- local app-server Goal mutation paths are production paths and already have
  useful prepare, persist, response, notification, and runtime-effect ordering
- local core bridge APIs accept concrete Goal model input and carry concrete
  Goal `ResponseInputItem`s before request shaping
- `rust-v0.136.0` uses the same broad adapter/runtime extension topology and
  has no `GoalService` facade
- `rust-v0.139.0` and `rust-v0.140.0` add `GoalService` and runtime
  registration/locking shapes, but still use user-role internal-context
  steering and active-turn concrete input injection

Code-shape temptation:

- copy the upstream v139/v140 `GoalService` topology before migration merely
  because it is the future direction
- copy upstream user-role internal-context active steering or current local
  `GoalContextRole` compatibility because the call chain already exists
- preserve active-turn concrete input injection as the same-turn delivery
  mechanism
- force app-server to depend on `codex-goal-extension` even though v136
  adapter/runtime conversion can carry the required ordering
- treat extension tests or prompt helper output as proof that extension-origin
  cadence reached the model

Locked direction:

- use v136 adapter/runtime conversion as the selected WA04 ordering shape
- keep extension-owned lifecycle, tools, accounting, metrics, events, mutation
  entry points, durable state calls, pending-intent summaries, and typed wake
  requests where useful
- do not add `ext/goal/src/api.rs` as part of the planned v136 route; revisit
  it only if the ordering checkpoint finds a concrete blocker that
  adapter/runtime plus WA01/WA02/WA03 seams cannot carry
- do not adopt full v139/v140 `GoalService` in v136
- route all active model-input construction through WA02 final request-input
  shaping
- route same-turn extension/app-server delivery through metadata/wake/recheck
  behavior, never prebuilt model input
- leave unavailable same-turn delivery as durable pending intent for ordinary
  turns or WA03 idle Stage 2

Exclusions:

- no Rust implementation
- no WA04 implementation pass docs
- no mandatory app-server dependency on `codex-goal-extension`
- no extension-owned active `ResponseItem` or `ResponseInputItem` construction
- no pending-intent consumption or Continuation watermark advancement in
  `ext/goal`
- no extension-owned recorded request evidence writer
- no broad WA05 classifier/projection/raw-notification cleanup
- no final WA06 dead-code deletion beyond naming deletion targets

## Terrain Findings

### Local Extension Topology

Files:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Observed facts:

- `lib.rs` says the crate is not wired into the host yet, and local grep did
  not find a production `install_with_backend(...)` call outside extension
  tests. Do not use that as a permanent "unreachable" proof: the crate is
  compiled, exposes public installation/runtime APIs, and its tests exercise
  active steering paths.
- `extension.rs` stores `GoalExtensionConfig { enabled, steering_role }`,
  captures `goal_steering_role` from host config, and passes
  `config.steering_role` into BudgetLimit active steering.
- `extension.rs::on_tool_finish(...)` accounts post-tool progress, detects
  `ThreadGoalStatus::BudgetLimited`, marks producer-side reported state, and
  calls `runtime.inject_active_turn_goal_steering(...)`.
- `runtime.rs::prepare_external_goal_mutation(...)` is useful product
  ordering terrain: it accounts active or idle progress before an external
  mutation changes durable facts.
- `runtime.rs::apply_external_goal_set(...)` is useful lifecycle/accounting
  terrain but currently takes `GoalContextRole` and may call
  `inject_active_turn_goal_steering(...)` for ObjectiveUpdated.
- `runtime.rs::inject_active_turn_goal_steering(...)` builds a concrete Goal
  item with `goal_steering_item(...)` and maps it to
  `GoalSteeringCarryPurpose`.
- `runtime.rs::inject_active_turn_steering(...)` upgrades `ThreadManager`,
  looks up the live thread, and calls
  `CodexThread::inject_goal_steering_items_into_active_turn(...)`.
- `steering.rs` imports `GoalContext`, `GoalContextRole`, and
  `ResponseInputItem`; `goal_steering_item(...)` returns concrete active
  model input.
- `tool.rs::handle_create(...)` is a valid product mutation path. It validates
  objective/budget, calls `insert_thread_goal(...)`, fills empty preview,
  marks current-turn accounting active, records metrics, emits a goal update,
  and returns structured tool output. It does not create pending Initial intent
  today.
- `tool.rs::handle_update(...)` marks complete/blocked, accounts progress,
  writes a terminal status, clears current-turn accounting, and emits goal
  update events. It is a status mutation path, not an active steering producer.
- Extension tests currently preserve real product/accounting behavior, but
  several tests also encode `GoalContextRole` config and direct runtime active
  steering terrain.

### Local Core Bridge Terrain

Files:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`

Observed facts:

- `CodexThread::inject_goal_steering_items_into_active_turn(...)` forwards
  concrete `ResponseInputItem`s to `Session::inject_goal_response_items(...)`.
- `Session::inject_goal_response_items(...)` forwards concrete items to
  `InputQueue::inject_goal_response_items(...)`.
- `InputQueue::inject_goal_response_items(...)` accepts only while
  `TurnState` has an open goal-injection phase, appends concrete pending input,
  and stores concrete current-turn carry.
- `TurnState` stores `current_turn_goal_steering_items:
  Vec<GoalSteeringCarryItem>`, and each carry item stores a concrete
  `ResponseInputItem`.
- `RegularTask::run(...)` repeats `run_turn(...)` only while model follow-up
  or pending input keeps the regular task open. The current exit predicate
  flows through `Session::close_goal_steering_injection_if_no_pending_input(...)`
  and `InputQueue::has_pending_input(...)`. Today, concrete Goal injection
  creates pending input to force another sampling opportunity.
- `session/turn.rs::run_sampling_request(...)` rebuilds prompt input inside
  its retry loop and calls `build_prompt(...)` inside that loop. WA02 owns the
  per-attempt shaper placement before `build_prompt(...)`.
- `try_run_sampling_request(...)` has an empty `ResponseEvent::Created` arm.
  WA02 owns pending-intent commit and recorded-evidence metadata, when in
  scope, at that arm.
- `goals.rs` is still core active-shim terrain: `GoalSteeringMessage` wraps
  `GoalContext`, core external ObjectiveUpdated/BudgetLimit paths inject
  concrete pending input, resume fabricates runtime Initial, and idle
  Continuation reserves a turn with prebuilt items. WA04 must not grow this
  file into a long-lived service.

### Local App-Server Terrain

Files:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`

Observed facts:

- `thread/goal/get` reads durable Goal state and returns product API data. It
  does not need cadence or model-input work.
- `thread/goal/set` already performs a useful production ordering:
  materialize/reconcile rollout, get listener ordering channel, validate
  payload, call `thread.prepare_external_goal_mutation()` for a running
  thread, persist the Goal mutation, send response, emit ordered notification,
  then call `thread.apply_external_goal_set(...)`.
- `thread/goal/set` currently calls facts-only state APIs:
  `replace_thread_goal(...)` for new/replaced objective paths and
  `update_thread_goal(...)` for edits/status changes.
- `thread/goal/clear` similarly prepares external mutation, deletes durable
  Goal state, applies runtime clear effects, sends response, and emits ordered
  clear notification.
- `thread_goal_set_active_schedules_developer_role_goal_steering` is the
  right app-server scenario but currently asserts active `<goal_context>` text
  in captured developer input. It must become a final `/responses` input test
  for exactly one current outer developer-role Goal `ResponseItem` and no
  active `<goal_context>` or user-role Goal item.
- The app-server path does not need to depend on `codex-goal-extension` to
  preserve current response/notification ordering in v136. It can call
  cadence-aware state APIs and public core thread/session metadata adapters.

### State Terrain

Files:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`

Observed facts:

- current state is facts-only: `thread_goals` stores one row per thread with
  `goal_id`, objective, status, budget, usage, and timestamps.
- `ThreadGoal` and `ThreadGoalRow` have no `facts_version`.
- `GoalStore` exposes facts-only methods such as `get_thread_goal`,
  `replace_thread_goal`, `insert_thread_goal`, `update_thread_goal`,
  `delete_thread_goal`, `usage_limit_active_thread_goal`, and
  `account_thread_goal_usage`.
- WA01 owns cadence-aware state additions: monotonic `facts_version`, durable
  pending Initial/ObjectiveUpdated/BudgetLimit intent, exact-key consumption,
  and atomic facts-plus-intent mutation APIs.
- WA04 must call those WA01-shaped APIs; it must not make `GoalStore` select
  cadence, render prompts, choose model roles, or construct request input.

### Upstream Terrain

`rust-v0.136.0`:

- extension topology is `GoalExtension` plus `GoalRuntimeHandle`
- no `ext/goal/src/api.rs` `GoalService` facade exists
- upstream v136 `steering.rs` builds
  `InternalModelContextFragment(source = "goal")` and converts it through
  `ContextualUserFragment::into(...)`, which is user-role model input
- upstream v136 app-server keeps local processor ordering similar to the
  current local processor

`rust-v0.139.0` and `rust-v0.140.0`:

- introduce `ext/goal/src/api.rs` with `GoalService`
- app-server routes `thread/goal/set`, `get`, and `clear` through
  `GoalService`
- runtime registration and a `goal_state_permit()` lock provide useful
  ordering precedent around external mutation and idle continuation
- `rust-v0.140.0` moves idle continuation toward extension runtime
  `continue_if_idle()`
- active steering still constructs concrete `ResponseItem`s through
  `steering.rs` and active-turn APIs, so the payload shape conflicts with
  local Goal authority

Conclusion:

- upstream service topology is migration terrain, not authority
- v136 adapter/runtime conversion is selected for the WA04 split
- a thin facade is not selected by this map; it is only a blocker-triggered
  revisit if adapter/runtime plus WA01/WA02/WA03 seams cannot carry ordering
- full `GoalService` adoption is not selected for v136 by this map

## Ordering Shape Decision

### Selected Route: Adapter/Runtime Conversion

The WA04 split should start from the existing v136 topology:

```text
app-server processor
  -> cadence-aware state APIs
  -> CodexThread runtime/cadence adapter for running threads

ext/goal tool/runtime/lifecycle contributors
  -> cadence-aware state APIs
  -> GoalRuntimeHandle accounting/events
  -> ThreadManager/CodexThread metadata-only cadence request when needed

core request assembly
  -> WA02 request-input shaper
  -> Created-event commit handler
```

Why this is sufficient for split planning:

- app-server already owns product response and notification ordering locally
- extension tool/runtime already owns tool lifecycle, accounting, metrics, and
  event behavior locally
- WA01 atomic state APIs can prevent facts-plus-intent race gaps without a
  service facade
- WA02 shaper and Created-event commit path own active input and pending-intent
  consumption
- WA03 metadata/idle work owns same-turn recheck and idle fallback behavior
- there is no current code blocker requiring app-server to call into
  `codex-goal-extension`

### Thin Facade Revisit Only On Blocker

A thin `codex-rs/ext/goal/src/api.rs` facade is not selected by this map or
the WA04 split.

It is a blocker-triggered revisit only if the ordering checkpoint finds a
concrete problem such as:

- app-server and extension tools must duplicate non-trivial
  prepare/account/persist/event outcome ordering after WA01 APIs exist
- a shared mutation outcome type is needed to keep previous/current facts,
  pending-intent summaries, runtime accounting effects, and event facts
  coherent across app-server and extension tools
- a migration-compatible runtime registry is needed for a specific v136
  ordering lock that cannot be expressed through `CodexThread`,
  `GoalRuntimeHandle`, WA01 durable operations, WA02 request-input
  shaping/commit, and WA03 metadata/idle delivery

If that blocker is found, update this map before writing downstream pass docs.
If introduced after that update, the facade may return durable facts, previous
facts, pending intent summaries, runtime effects, event facts, and typed
cadence/wake requests. It must not return active `ResponseItem` or
`ResponseInputItem`, pick active role, consume pending intent, advance
Continuation watermarks, or write recorded request evidence.

### Full `GoalService` Adoption

Full v139/v140 service adoption is not selected for v136.

Reasons:

- upstream v136 does not have the service topology
- current app-server ordering can be converted without an extension dependency
- current extension runtime/tool topology can call cadence-aware state APIs
  and core metadata adapters
- upstream service code still has authority-conflicting active steering output
- adopting the full topology now would add migration churn before it is needed

## Reachable Path Map

### 1. Extension `create_goal` Tool

Owner files/modules:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs` for accounting state interaction
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- WA01 `codex-rs/state/src/runtime/goals.rs` cadence-aware insert API

Current entry point and call chain:

```text
GoalToolExecutor::handle(...)
  -> handle_create(...)
  -> GoalStore::insert_thread_goal(...)
  -> fill_empty_thread_preview_if_possible(...)
  -> accounting_state.mark_current_turn_goal_active(...)
  -> metrics.record_created()
  -> event_emitter.thread_goal_updated(...)
```

Durable state mutation required:

- replace facts-only `insert_thread_goal(...)` with
  `insert_thread_goal_with_initial_intent(...)` or the exact WA01
  cadence-aware equivalent
- create active durable Goal facts and pending Initial intent in the same
  transaction
- preserve duplicate-create error when a Goal already exists

Pending intent behavior:

- successful create always writes pending Initial intent for the new active
  `goal_id` and facts version
- duplicate create writes no intent

Runtime/accounting effects to preserve:

- empty thread preview fill
- current-turn active accounting baseline reset
- created metric
- `ThreadGoalUpdated` event from tool call
- structured tool output and remaining token calculation

Cadence request or wake metadata emitted:

- no active model input is constructed
- when the create happens during a model tool call, the normal tool output
  follow-up already creates another sampling opportunity; the WA02 shaper
  should consume pending Initial from fresh durable facts on that follow-up
- if implementation finds a create path without an imminent follow-up, emit
  same-turn recheck metadata only; if unavailable, pending Initial remains for
  ordinary turn or idle Stage 2 delivery

Active model-input construction to remove:

- none directly in `tool.rs`
- do not add any call to `goal_steering_item(...)`,
  `GoalContext`, or active-turn injection

Tests:

- extension state/runtime test:
  `goal_extension_create_active_goal_writes_initial_intent`
- keep preview, duplicate create, tool response, and accounting baseline tests
- final payload coverage belongs in core/app-server integration when the
  created pending Initial is delivered by WA02 shaper

### 2. Extension `update_goal` Tool: Terminal Status Mutation

Owner files/modules:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs` for accounting state interaction
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Current entry point and call chain:

```text
GoalToolExecutor::handle(...)
  -> handle_update(...)
  -> account active progress and completion usage
  -> GoalStore::update_thread_goal(...)
  -> accounting_state.clear_current_turn_goal()
  -> event_emitter.thread_goal_updated(...)
```

Durable state mutation required:

- preserve complete/blocked product status updates
- use WA01-shaped status/update APIs to allocate facts versions when facts
  change and clear/supersede pending active-state intent that can no longer be
  delivered
- do not create pending Initial, ObjectiveUpdated, or BudgetLimit intent merely
  because the terminal status was written

Runtime/accounting effects to preserve:

- active progress accounting before completion/blocking
- final usage reporting
- current-turn active accounting cleanup
- product event emission

Cadence request or wake metadata emitted:

- none for ordinary complete/blocked terminal updates
- any already accepted same-turn metadata becomes stale if the durable Goal is
  no longer active; WA02/WA03 request shaping must decline or abort it from
  fresh durable facts

Active model-input construction to remove:

- do not add any active Goal item construction to this path
- do not call `goal_steering_item(...)`, `GoalContext`, or active-turn
  injection from terminal update handling

Tests:

- keep extension terminal update tests for complete/blocked behavior and final
  usage reporting
- add or update a state/runtime assertion that terminal update clears or
  supersedes stale active-state pending intent for stopped Goals
- no final payload test is required unless the scenario also creates a separate
  pending cadence intent

### 3. App-Server `thread/goal/get`

Owner files/modules:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`

Current entry point and call chain:

```text
thread_goal_get(...)
  -> state_db_for_materialized_thread(...)
  -> GoalStore::get_thread_goal(...)
  -> ThreadGoalGetResponse
```

Required outcome:

- preserve product read behavior
- do not create cadence intent
- do not request same-turn delivery
- do not construct or inspect model input

Tests:

- keep upstream baseline `thread_goal_get_rejects_unmaterialized_thread`
- no final payload test is needed for `get`

### 4. App-Server `thread/goal/set`: New Active Goal

Owner files/modules:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/core/src/codex_thread.rs`
- WA01 state APIs
- WA02/WA03 cadence metadata adapters

Current entry point and call chain:

```text
thread_goal_set_inner(...)
  -> running_thread.prepare_external_goal_mutation()
  -> GoalStore::replace_thread_goal(...)
  -> send ThreadGoalSetResponse
  -> emit ordered ThreadGoalUpdated notification
  -> running_thread.apply_external_goal_set(ExternalGoalSet)
  -> core goals.rs runtime effects
```

Durable state mutation required:

- use `replace_thread_goal_with_initial_intent(...)` or exact WA01 equivalent
  when the request creates/replaces an active Goal
- write durable Goal facts and pending Initial intent atomically
- clear stale pending intent for the replaced goal id

Runtime/accounting effects to preserve:

- prepare/account before mutation for running thread
- empty preview fill when objective is present
- response before ordered notification, preserving current app-server contract
- core/extension runtime metrics and active accounting baseline updates

Cadence request or wake metadata emitted:

- after durable write and ordered app-server response/notification, request
  same-turn cadence recheck through `CodexThread` if a running active turn can
  accept metadata
- same-turn request carries only `goal_id`, kind Initial, and facts version or
  a WA02/WA03 public equivalent
- if no active turn, injection phase is closed, or metadata cannot be
  accepted, do not drop intent; call the idle lifecycle when ordered so WA03
  Stage 2 may deliver pending Initial

Active model-input construction to remove:

- app-server must not construct model input
- `core::goals::apply_external_thread_goal_status(...)` must not turn this
  path into `GoalSteeringMessage -> GoalContext -> ResponseInputItem`

Tests:

- update `thread_goal_set_active_schedules_developer_role_goal_steering`
  to assert captured final `/responses` input contains exactly one current
  outer developer-role Goal `ResponseItem`
- assert no active `<goal_context>` reaches final input
- assert no user-role active Goal item reaches final input
- state/app-server tests should assert pending Initial intent exists before
  Created-event commit and is not consumed by response/notification emission

### 5. App-Server `thread/goal/set`: Objective Edit

Owner files/modules:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/goals.rs` as v136 runtime adapter terrain
- WA01 state APIs

Current entry point and call chain:

```text
thread_goal_set_inner(...)
  -> prepare_external_goal_mutation()
  -> GoalStore::update_thread_goal(objective = Some(...))
  -> send response and ordered ThreadGoalUpdated notification
  -> apply_external_goal_set(...)
  -> core/extension runtime may inject ObjectiveUpdated input
```

Durable state mutation required:

- use `update_thread_goal_with_objective_intent(...)` or exact WA01
  equivalent when the active objective changes
- write updated objective, allocate facts version, and write pending
  ObjectiveUpdated intent atomically
- if status/budget in the same request moves the Goal to BudgetLimited, the
  state outcome must reflect BudgetLimit supersedence as WA01/WA02 specify

Runtime/accounting effects to preserve:

- prepare/account active or idle progress before mutation
- preserve tokens/time already used
- preserve ordered response and notification
- keep metrics for resumed/terminal/status transitions
- refresh current/idle active accounting baseline when Goal remains active

Cadence request or wake metadata emitted:

- request same-turn cadence recheck for ObjectiveUpdated metadata only after
  durable state and pending intent exist
- same-turn recheck does not guarantee ObjectiveUpdated will be delivered; the
  shaper must re-read fresh facts and apply BudgetLimit > ObjectiveUpdated >
  Initial > Continuation
- if same-turn metadata cannot be accepted, pending ObjectiveUpdated remains
  for ordinary turn or idle Stage 2

Active model-input construction to remove:

- delete or bypass ObjectiveUpdated active path:

```text
GoalSteeringMessage / goal_steering_item
  -> GoalContext
  -> ResponseInputItem
  -> inject_goal_steering_items_into_active_turn(...)
```

Tests:

- app-server/core final payload test:
  `thread_goal_set_objective_update_delivers_developer_role_goal_item`
- state/runtime test that ObjectiveUpdated pending intent survives failed or
  unavailable same-turn delivery
- assert final item renders the persisted updated objective, not app-server
  request body text recovered elsewhere

### 6. App-Server `thread/goal/set`: Status Or Budget Update Without Active Objective Steering

Owner files/modules:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- WA01 state APIs

Current entry point and call chain:

- same `thread_goal_set_inner(...)`, using facts-only `update_thread_goal(...)`
  when objective is absent

Durable state mutation required:

- use cadence-aware status/update APIs that allocate facts version when facts
  change and clear/supersede active-state pending intent when the durable
  status no longer permits delivery
- if the status/budget transition creates BudgetLimit work, state must write
  pending BudgetLimit intent atomically

Runtime/accounting effects to preserve:

- prepare/account before mutation for running thread
- preserve product behavior for paused/blocked/usage-limited/complete and
  budget-limited statuses
- clear runtime active accounting when status is no longer active-eligible

Cadence request or wake metadata emitted:

- only emit cadence recheck/wake metadata when the state outcome includes a
  pending Initial/ObjectiveUpdated/BudgetLimit intent
- no active steering for terminal/manual status updates that merely clear or
  stop Goal state

Active model-input construction to remove:

- no app-server model-input construction
- no runtime injection for non-cadence status changes

Tests:

- keep upstream product tests:
  `thread_goal_set_preserves_budget_limited_same_objective`,
  `thread_goal_set_persists_resumable_stopped_statuses`, and
  `thread_goal_set_edits_objective_without_resetting_usage`
- add BudgetLimit pending-intent/final-payload coverage only when the request
  actually creates BudgetLimit cadence

### 7. App-Server `thread/goal/clear`

Owner files/modules:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/core/src/codex_thread.rs`
- WA01 state APIs

Current entry point and call chain:

```text
thread_goal_clear_inner(...)
  -> prepare_external_goal_mutation()
  -> GoalStore::delete_thread_goal(...)
  -> apply_external_goal_clear()
  -> send ThreadGoalClearResponse
  -> emit ordered ThreadGoalCleared notification
```

Durable state mutation required:

- use `delete_thread_goal_and_intents(thread_id)` or exact WA01 equivalent
- delete Goal facts and all pending intent atomically

Runtime/accounting effects to preserve:

- account in-flight progress before clear
- clear runtime active/idle accounting after durable deletion and before the
  app-server response, matching current local ordering
- preserve response and ordered clear notification after runtime clear

Cadence request or wake metadata emitted:

- none
- any already accepted same-turn or synthetic metadata becomes stale; the
  WA02/WA03 shaper recheck must abort/decline without model submission or
  commit when no durable Goal remains

Active model-input construction to remove:

- no active model input

Tests:

- keep upstream product `thread_goal_clear_deletes_goal_and_notifies`
- add focused stale-metadata test in WA03/WA04 only if clear races a pending
  cadence request in that pass

### 8. Extension Runtime External Objective Update

Owner files/modules:

- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Current entry point and call chain:

```text
GoalRuntimeHandle::prepare_external_goal_mutation()
  -> account active or idle progress

GoalRuntimeHandle::apply_external_goal_set(goal, previous_goal, steering_role)
  -> metrics/accounting updates
  -> maybe inject ObjectiveUpdated active steering
```

Required shape:

- replace `steering_role: GoalContextRole` with a structured outcome carrying
  current facts, previous facts, pending intent summary, and runtime effect
  data
- runtime applies metrics/accounting only
- runtime requests cadence delivery/recheck metadata only when pending
  Initial/ObjectiveUpdated/BudgetLimit intent exists

Durable state mutation required:

- the durable mutation should already have happened through app-server,
  extension tool, or the selected adapter/runtime ordering path
- runtime must not independently create model input from the mutation body

Pending intent behavior:

- new active Goal: pending Initial
- active objective edit: pending ObjectiveUpdated
- BudgetLimit status outcome: pending BudgetLimit when state/accounting says
  it is due
- stopped/cleared statuses: no active steering intent

Runtime/accounting effects to preserve:

- created/resumed/terminal metrics
- active-turn or idle active-goal accounting baseline
- clear active accounting for stopped statuses

Cadence request or wake metadata emitted:

- `request_goal_cadence_delivery_for_active_turn(...)` or equivalent public
  core adapter, carrying metadata only
- on `NoActiveTurn` or `ActiveTurnCannotAccept`, leave pending intent intact
  and allow idle Stage 2 after pending non-Goal work

Active model-input construction to remove:

- `GoalRuntimeHandle::inject_active_turn_goal_steering(...)`
- `GoalRuntimeHandle::inject_active_turn_steering(...)` for Goal steering
- `steering::goal_steering_item(...)` output into runtime injection

Tests:

- extension state/runtime tests:
  `goal_extension_objective_update_outcome_requests_metadata_not_model_input`
  and `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`
- final payload tests in core/app-server, not extension helper-output tests

### 9. Extension Post-Tool BudgetLimit

Owner files/modules:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- WA01 state APIs
- core metadata/wake adapter

Current entry point and call chain:

```text
GoalExtension::on_tool_finish(...)
  -> runtime.account_active_goal_progress(...)
  -> if goal.status == BudgetLimited
  -> accounting_state.mark_budget_limit_reported_if_new(...)
  -> runtime.inject_active_turn_goal_steering(BudgetLimit, ...)
```

Durable state mutation required:

- replace facts-only `account_thread_goal_usage(...)` in the BudgetLimit
  producer path with `account_thread_goal_usage_with_budget_intent(...)` or
  exact WA01 equivalent
- when the producer outcome says model wrap-up BudgetLimit cadence is newly
  due, persist usage/status facts and pending BudgetLimit intent atomically
- producer-side reported flag may suppress duplicate producer notifications,
  but it must not consume pending intent

Runtime/accounting effects to preserve:

- token/time accounting
- budget limited metrics and events
- continued accounting behavior for budget-limited goals until turn stop where
  current product behavior requires it
- continued BudgetLimited accounting must not create duplicate/new BudgetLimit
  cadence unless the WA01 outcome explicitly says wrap-up work is newly due
- `update_goal` tool remains excluded from normal post-tool progress counting

Cadence request or wake metadata emitted:

- request same-turn cadence recheck for BudgetLimit metadata when active turn
  can accept it
- if same-turn recheck cannot be accepted, pending BudgetLimit remains for
  ordinary turn or idle Stage 2
- when the tool output already forces model follow-up, the request-input
  shaper still reselects from fresh durable state on that follow-up

Active model-input construction to remove:

```text
budget_limit prompt
  -> GoalContext
  -> ResponseInputItem
  -> active-turn injection
```

Tests:

- extension state/runtime test:
  `goal_extension_budget_limit_writes_pending_intent_not_model_input`
- final payload test:
  `goal_extension_budget_limit_delivers_via_request_shaping`
- test that producer-side `mark_budget_limit_reported_if_new(...)` does not
  consume pending intent
- test that shared accounting callers do not create duplicate BudgetLimit
  cadence after BudgetLimit was already pending or reported

### 10. Same-Turn Metadata/Wake Bridge

Owner files/modules:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`

Current entry point and call chain:

- current extension/core paths call concrete input injection to create pending
  input and force `RegularTask` to sample again
- current `RegularTask` closes Goal injection only when no pending input
  remains, through
  `close_goal_steering_injection_if_no_pending_input(...)` /
  `has_pending_input(...)`

Required replacement:

- add a public core adapter that extension/app-server callers can use without
  naming private `goal_cadence` types, or translate public request facts in
  `CodexThread`
- suggested logical outcome:

```text
AcceptedForActiveTurn
NoActiveTurn
ActiveTurnCannotAccept
```

- store `GoalTurnRequest::SameTurnCadenceRecheck(...)` metadata on the active
  turn
- do not store rendered prompt text, `ResponseItem`, or `ResponseInputItem`
- replace or augment the current repeat-loop predicate so accepted metadata is
  visible as a recheck reason without being modeled as pending `TurnInput`,
  mailbox input, rendered Goal prompt text, `ResponseItem`, or
  `ResponseInputItem`
- cause the active regular task to run another sampling opportunity when
  metadata is accepted and no model/tool follow-up is already pending
- shaper re-reads durable snapshot and may select a different superseding
  pending kind
- Created-event commit consumes exact pending intent and clears/obsoletes
  uncommitted request metadata

Tests:

- metadata acceptance test that no pending model input is added
- repeat-loop predicate test proving accepted metadata causes another sampling
  opportunity without adding pending model input
- regular-task follow-up test that accepted metadata causes another sampling
  opportunity
- unavailable delivery test that pending intent remains for idle Stage 2

### 11. `GoalContextRole` / Steering Role Config

Owner files/modules:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- broader core config files only if the selected WA04 split owns the config
  cleanup fallout

Current terrain:

- local `ext/goal` stores `GoalContextRole` in `GoalExtensionConfig`
- `install_with_backend(...)` accepts a `goal_steering_role` closure
- tests vary `GoalContextRole::Developer` and `GoalContextRole::User`
- local core config still parses `GoalSteeringRole` from `[goals]`

Required outcome:

- remove `GoalContextRole` from converted extension active paths
- extension config stores enablement only, or enablement plus non-steering
  extension state
- converted extension paths ignore any old steering-role config for active
  Goal authority
- app-server/core final-payload coverage in 04h proves any still-parseable old
  user-role config value cannot affect active Goal authority
- final request-input shaping always constructs the selected current Goal item
  as outer `role: "developer"`

Boundary note:

- broader config key removal or schema generation may be handled in the pass
  that owns core config cleanup if not all core old producers are converted
  yet
- WA04 must at least make extension-origin active steering impossible to make
  user-role

Tests:

- rename/update `backend_config_stores_role_and_updates_runtime_enabled_state`
  to enablement-only behavior
- add `goal_extension_config_cannot_select_user_role_steering` as an
  extension-level config/metadata test, not final payload proof
- final payload proof with an old user-role config value, if still parseable,
  belongs to 04h app-server/core payload tests and must still show exactly one
  current outer developer-role Goal item

### 12. `ext/goal/src/steering.rs`

Owner files/modules:

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/core/src/goal_cadence/prompt.rs` or selected prompt-body owner

Current terrain:

- owns prompt text and active `ResponseInputItem` construction together
- imports `GoalContext`, `GoalContextRole`, and `ResponseInputItem`

Required outcome:

- delete `GoalSteeringFrame`
- delete active `goal_steering_item(...)` returning model input
- move or share prompt body helpers as text-only helpers if WA02/WA04 still
  needs their prompt templates
- no extension code returns active model input

Tests:

- keep prompt escaping tests only if text helper remains
- otherwise move prompt-body tests to the prompt owner selected by WA02

## Product Behavior To Preserve

WA04 split planning must preserve these behaviors while changing authority
plumbing:

- extension-owned `create_goal` tool remains valid when no Goal exists
- duplicate `create_goal` remains a product error
- `update_goal` may mark complete or blocked and report completion usage
- extension tool availability and enabled-state behavior remain
- active/idle Goal accounting and baseline reset behavior remain
- token/time usage and BudgetLimited/UsageLimited status behavior remain
- app-server `thread/goal/get`, `set`, and `clear` response and notification
  shapes remain
- app-server ordered response/notification behavior remains
- thread preview fill remains when a new objective is provided
- upstream Goal product tests listed by `goal-test-deletion-map.md` remain
  active unless replaced by a separate product change

## Active Model-Input Construction Targets

Convert, delete, or prove unreachable:

- `codex-rs/ext/goal/src/steering.rs`
  - `GoalSteeringFrame`
  - `goal_steering_item(...)`
  - imports of `GoalContext`, `GoalContextRole`, `ResponseInputItem`
- `codex-rs/ext/goal/src/runtime.rs`
  - `inject_active_turn_goal_steering(...)`
  - `inject_active_turn_steering(...)` for Goal steering
  - `apply_external_goal_set(..., steering_role: GoalContextRole)`
- `codex-rs/ext/goal/src/extension.rs`
  - `GoalExtensionConfig.steering_role`
  - `goal_steering_role` closure
  - BudgetLimit injection call in `on_tool_finish(...)`
  - TODOs that describe configured role, role-neutral `<goal_context>`,
    injection timing, or hidden-context classification as active design
- `codex-rs/core/src/codex_thread.rs`
  - extension/app-server caller reachability into
    `inject_goal_steering_items_into_active_turn(...)`
- `codex-rs/core/src/goals.rs`
  - app-server/core external mutation reachability through
    `GoalRuntimeEvent::ExternalSet`
  - `apply_external_thread_goal_status(...)` must not remain a WA04 route into
    `GoalSteeringMessage` or `inject_goal_response_items(...)`
- `codex-rs/core/src/session/mod.rs`
  - extension/app-server caller reachability into
    `inject_goal_response_items(...)`
- `codex-rs/core/src/session/input_queue.rs`
  - extension/app-server caller reachability into
    `inject_goal_response_items(...)`
  - concrete Goal pending input for converted paths
- `codex-rs/core/src/state/turn.rs`
  - concrete pre-shaper Goal carry for converted paths

Old core injection APIs may remain temporarily only for unconverted core/WA05
cleanup terrain. WA04 target state must make them unreachable from
`ext/goal` and app-server external Goal mutation paths. The cleanup pass must
audit `core/src/goals.rs` explicitly before treating those APIs as merely
later cleanup terrain.

## Ordering Constraints

### App-Server `thread/goal/set`

Required logical order:

```text
validate request
materialize/reconcile thread state
prepare/account running-thread Goal progress
persist durable facts plus pending cadence intent atomically through a WA01
  operation selected from current facts plus requested facts
use the returned state outcome as the only source of pending-cadence metadata
preserve response and ordered notification behavior
apply runtime/accounting effects
request metadata-only same-turn cadence recheck when possible
leave pending intent for ordinary turn or idle Stage 2 when unavailable
```

The app-server request shape does not decide cadence by itself. Combined
objective, status, and budget updates must follow the WA01/WA02 supersedence
rules from the returned durable outcome: BudgetLimit over ObjectiveUpdated,
active-only Initial/ObjectiveUpdated, and cleanup for terminal/non-active
states.

Do not:

- inject prebuilt model input
- consume pending intent in app-server
- write recorded request evidence
- force app-server through `codex-goal-extension`

### Extension `create_goal`

Required logical order:

```text
parse and validate tool request
persist active Goal facts plus pending Initial intent atomically
fill preview if empty
mark current-turn accounting active
emit metrics and ThreadGoalUpdated event
return structured tool output
let normal tool follow-up or metadata recheck reach WA02 shaper
```

Do not:

- construct active Goal model input
- consume pending Initial
- make duplicate create succeed

### External ObjectiveUpdated

Required logical order:

```text
prepare/account in-flight progress
persist objective facts plus pending ObjectiveUpdated intent atomically
emit product response/notification or extension event as applicable
refresh accounting/metrics baseline
request metadata-only same-turn recheck if possible
leave intent pending if unavailable
```

### Post-Tool BudgetLimit

Required logical order:

```text
record token usage
account progress through cadence-aware budget API
persist BudgetLimited facts plus pending BudgetLimit intent atomically only
  when the producer outcome says wrap-up cadence is newly due
emit metrics/events
mark producer-side reported flag only to avoid duplicate producer reporting
request metadata-only same-turn recheck if possible
leave intent pending if unavailable
```

## Test Map

### Extension State/Runtime Tests

Owner:

- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Update or add tests for:

- `goal_extension_create_active_goal_writes_initial_intent`
- `goal_extension_objective_update_outcome_requests_metadata_not_model_input`
- `goal_extension_budget_limit_writes_pending_intent_not_model_input`
- `goal_extension_update_goal_terminal_status_clears_stale_active_intent`
- `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`
- `goal_extension_config_cannot_select_user_role_steering`
  - extension-level config/metadata assertion only; final payload proof is
    listed under app-server/core tests
- enablement-only replacement for current role-config test
- existing accounting, preview, duplicate create, terminal update, resume
  accounting, UsageLimited, and BudgetLimited product behavior

These tests may inspect durable state, pending intent snapshots, metrics/events,
and metadata request outcomes. They do not prove active Goal authority by
helper output.

### Final Payload Test Routes

Current v136 terrain does not host `codex-goal-extension` through app-server,
and core tests cannot import `codex-goal-extension` without reversing the
existing dependency direction. Therefore the WA04 split must choose one of two
routes for extension-related final payload coverage:

1. true extension-origin final-payload coverage in an extension integration
   test that drives a real extension producer through a real core request path
   with mock Responses
2. paired coverage: extension tests show durable pending intent, accounting,
   events, and metadata request outcomes; app-server/core tests seed or reach
   equivalent pending intent and assert the shared WA02 shaper's final
   `/responses` payload

The paired route is valid shared-shaper coverage, but it must not be described
as end-to-end extension-origin final-payload coverage.

### App-Server/Core Final Payload Tests

Owners:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/tests/suite/goal_authority.rs` or another WA02-selected core
  suite module
- `codex-rs/core/tests/common/responses.rs` only if small helper additions are
  needed
- `codex-rs/ext/goal/tests/...` only for the true extension-origin route
  above, where the extension test can drive a real core request path with mock
  Responses

Update or add tests for:

- `thread_goal_set_active_schedules_developer_role_goal_steering`
  - keep scenario
  - assert captured final `/responses` input contains exactly one current
    outer developer-role Goal `ResponseItem`
  - assert no active `<goal_context>` item
  - assert no user-role active Goal item
- `thread_goal_set_objective_update_delivers_developer_role_goal_item`
- `goal_extension_budget_limit_delivers_via_request_shaping`
  - use this name only for true extension-origin final-payload coverage; for
    paired coverage, use an equivalent pending-intent/shared-shaper name and
    keep extension BudgetLimit producer coverage in extension tests
- `goal_extension_same_turn_unavailable_keeps_pending_intent_for_idle`
  - use this name only for true extension-origin final-payload coverage; for
    paired coverage, assert unavailable delivery and pending intent in
    extension tests, then assert idle/shared-shaper delivery from equivalent
    pending intent
- `goal_extension_user_role_config_does_not_affect_final_payload`
  - use this name only if the old config value is exercised through a real
    extension producer-to-core-request path
  - if the old user-role config value is still parseable, captured
    `/responses` input still contains exactly one current outer developer-role
    Goal item and no user-role active Goal item

Use captured `/responses` input helpers such as:

- `ResponseMock::single_request()`
- `ResponseMock::requests()`
- `ResponsesRequest::input()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

Do not accept these as substitutes for final request input:

- extension prompt helper output
- classifier matches
- raw response item notifications
- ordinary rollout `ResponseItem`s
- rollout trace payloads
- rendered Goal text parsed from history
- recorded request evidence by itself

Recorded request evidence, when in scope, is asserted only as structured
Created-event metadata paired to the finalized request input by fingerprint.
Extension/app-server code must not write it.

## Proceed Criteria For WA04 Split Planning

WA04 can move to implementation pass split planning when the split planner can
use this map to name:

- the pass that records the adapter/runtime route and blocker-only facade
  revisit rule
- the pass that converts app-server `thread/goal/get`, `set`, and `clear`
  ordering to WA01 cadence-aware state APIs
- the pass that converts extension `create_goal` to pending Initial intent
- the pass that converts external ObjectiveUpdated runtime effects to
  metadata-only cadence requests
- the pass that converts post-tool BudgetLimit to pending BudgetLimit intent
- the pass that adds or reuses metadata-only same-turn wake/recheck plumbing
- the pass that removes or hard-maps `GoalContextRole` / steering role config
  influence for extension-origin steering
- the pass that deletes or reduces `ext/goal/src/steering.rs`
- the pass that re-audits `core/src/goals.rs` external set reachability before
  old concrete injection APIs are treated as isolated later cleanup terrain
- which extension tests prove state/runtime behavior
- which final-payload route is selected for extension-related scenarios: true
  extension-origin integration, or paired extension state/runtime tests plus
  app-server/core shared-shaper payload tests
- which app-server/core tests prove final request payload behavior

Do not proceed to WA04 implementation pass docs if a split cannot carry the
selected adapter/runtime route or identify the concrete blocker that requires
updating this map before any facade appears.

## Validation

Docs-only validation:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

Stale architecture scan:

```powershell
rg -n "developer-role internal-context|internal-context ResponseItem|core/src/goal_cadence\.rs|\bfinalizer\b|GoalService::|route through `GoalService`|structured proof|authority proof|ResponseInputItem.*authority|GoalContextRole.*active" local\goal_136_plan\work-areas\04-ext-goal-reachability-and-ordering-map.md
```

Remaining `GoalService` or `GoalContextRole` hits are valid only when naming
upstream terrain, rejected terrain, blocker-triggered facade revisit rules, or
deletion/conversion targets.
