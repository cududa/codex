# Batch 04: `ext/goal` Conversion

This batch converts reachable `codex-rs/ext/goal` Goal steering producers away
from active `GoalContext`, `<goal_context>`, `GoalContextRole`, and concrete
pre-finalizer model-input injection.

After this batch, extension-origin Goal changes may still own tools, lifecycle,
accounting, events, and mutation entry points. They must not construct active
Goal model input. Any active steering they cause must be expressed as durable
cadence state and selected by the Batch 02 final request-input shaping path.

## Direction Lock

Request:

- author the Batch 04 execution plan for `ext/goal` conversion
- ground the plan in current extension, core, app-server, and upstream terrain
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-authority-open-design-deliverables.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/batches/03-history-key-and-idle-continuation.md`

Terrain:

- local `ext/goal` currently stores `GoalContextRole` in extension config
- local `ext/goal/src/steering.rs` builds `GoalContext` and returns
  `ResponseInputItem`
- local `ext/goal/src/runtime.rs` injects those concrete items into active
  turns through `ThreadManager`
- app-server external Goal mutations use the core `ExternalMutationStarting`,
  `ExternalSet`, and `ExternalClear` runtime hooks
- upstream/main moves toward extension-owned `GoalService`, but still injects
  user-role internal-context `ResponseItem`s

Code-shape temptation:

- preserve the local active-turn injection chain as the same-turn delivery
  mechanism
- copy upstream's service ownership shape while also copying upstream's
  user-role helper output as active steering
- make `ext/goal` call low-level state APIs from every contributor and
  duplicate external mutation ordering in app-server
- treat role-preserving `ResponseInputItem` conversion as enough because the
  old item may already be developer-role

Locked direction:

- add or adopt an extension-owned `GoalService` style interface in
  `codex-rs/ext/goal/src/api.rs`
- route app-server and extension Goal mutations through that interface so the
  external mutation ordering is shared
- use Batch 01 cadence-aware state APIs to persist durable facts and pending
  Initial, ObjectiveUpdated, or BudgetLimit intent
- use Batch 02 final request-input shaping as the only active Goal model-input
  construction and commit path
- use Batch 03 idle/pending-cadence delivery when same-turn delivery cannot be
  accepted without concrete model-input injection

Exclusions:

- no Rust implementation in this planning pass
- no app-server product redesign
- no user-role active Goal steering compatibility
- no repair or classifier expansion beyond the conversion needed here
- no broad projection, raw-response, compaction, or reconstruction cleanup
- no persisted pending Continuation intent

## Bounded Code Terrain Read

Files read for this batch:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- upstream comparison:
  - `upstream/main:codex-rs/ext/goal/src/api.rs`
  - `upstream/main:codex-rs/ext/goal/src/extension.rs`
  - `upstream/main:codex-rs/ext/goal/src/runtime.rs`
  - `upstream/main:codex-rs/ext/goal/src/steering.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/extension.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/runtime.rs`

Findings:

- `ext/goal/src/tool.rs` creates active Goals with
  `insert_thread_goal(...)`, marks the current turn active, and emits events.
  It does not create pending Initial intent today.
- `ext/goal/src/runtime.rs` has three reachable steering-related paths:
  - `prepare_external_goal_mutation()` accounts active or idle progress before
    a mutation
  - `apply_external_goal_set(...)` injects ObjectiveUpdated steering when the
    active objective or active Goal identity changes
  - `inject_active_turn_goal_steering(...)` builds concrete model input and
    sends it through core active-turn injection
- `ext/goal/src/extension.rs` has a post-tool BudgetLimit producer:
  `on_tool_finish(...)` accounts progress, observes `BudgetLimited`, and calls
  `runtime.inject_active_turn_goal_steering(...)`.
- `ext/goal/src/extension.rs` stores `GoalContextRole` in
  `GoalExtensionConfig`, accepts a `goal_steering_role` closure, and includes
  TODO text that still describes role-neutral `<goal_context>` wrapping and
  configured role application.
- `ext/goal/src/steering.rs` is active shim construction terrain:
  `GoalContext::new(prompt).into_response_input_item(role)`.
- `codex-rs/core/src/codex_thread.rs` exposes
  `inject_goal_steering_items_into_active_turn(...)`, which forwards concrete
  `ResponseInputItem`s into session Goal injection.
- `codex-rs/core/src/session/input_queue.rs` appends concrete Goal
  `ResponseInputItem`s to `TurnState.pending_input` and stores them as
  current-turn Goal carry.
- `codex-rs/core/src/state/turn.rs` stores `GoalSteeringCarryItem` as concrete
  `ResponseInputItem`.
- `codex-rs/core/src/tasks/regular.rs` repeats a turn only when model follow-up
  or pending input exists. Same-turn Goal delivery needs a non-model-input
  metadata/wake path if the active turn would otherwise stop.
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs` already
  performs the required external mutation ordering in local form:
  prepare runtime effects, persist mutation, emit ordered event, then apply
  runtime effects.
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs` has a test named
  `thread_goal_set_active_schedules_developer_role_goal_steering`, but it
  currently asserts `<goal_context>` text. Batch 04 should keep the product
  scenario and change the assertion to final request input with current
  internal-context shape.
- upstream/main and rust-v0.140.0 remove extension `GoalContextRole` config and
  add a `GoalService` ownership shape. That direction is useful for reducing
  duplicated app-server/extension mutation ordering, but upstream still
  constructs user-role internal-context `ResponseItem`s in `steering.rs` and
  injects them through active-turn APIs. This fork must not copy that authority
  mistake.

## Ownership Split For This Batch

Batch 04 moves mutation/accounting ownership toward `ext/goal` without moving
active model-input authority there. Use this file split while implementing:

- `codex-rs/ext/goal/src/api.rs` owns the `GoalService` style interface for
  external Goal mutation ordering, accounting effects, event facts, and typed
  cadence delivery requests.
- `codex-rs/ext/goal/src/tool.rs`, `runtime.rs`, and `extension.rs` are
  adapters into `GoalService` and runtime accounting. They no longer own
  independent Goal mutation sequencing or active-steering injection chains.
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs` is a
  product API adapter. It calls `GoalService` and emits the same response and
  notification shapes; it does not directly sequence durable Goal mutation or
  model-input delivery.
- Batch 01 state APIs own durable facts and pending intent writes for the
  service. Batch 02 `goal_cadence.rs` remains the only owner of active
  developer-role Goal `ResponseItem` construction and commit metadata.
- `codex-rs/core/src/session/input_queue.rs`, `codex-rs/core/src/state/turn.rs`,
  `codex-rs/core/src/session/mod.rs`, and `codex-rs/core/src/codex_thread.rs`
  may expose metadata/wake request plumbing for same-turn cadence delivery.
  They must not accept rendered Goal prompt text or prebuilt Goal model input
  from the extension as authority.
- `codex-rs/ext/goal/src/steering.rs` should be deleted or reduced to
  prompt-body helpers. It must not return `ResponseItem` or `ResponseInputItem`
  for active steering.

## Required Edits

### 1. Add Extension-Owned Goal Service Interface

Edit:

- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/app-server/Cargo.toml`

Add `codex-rs/ext/goal/src/api.rs`, following the upstream ownership direction
but changing its output and runtime effects to structured cadence intent.

Required public types, equivalent names acceptable:

```rust
pub enum GoalServiceError {
    InvalidRequest(String),
    Internal(String),
}

pub enum GoalObjectiveUpdate<'a> {
    Keep,
    Set(&'a str),
}

pub enum GoalTokenBudgetUpdate {
    Keep,
    Set(Option<i64>),
}

pub struct GoalSetRequest<'a> {
    pub thread_id: ThreadId,
    pub objective: GoalObjectiveUpdate<'a>,
    pub status: Option<ThreadGoalStatus>,
    pub token_budget: GoalTokenBudgetUpdate,
}

pub struct GoalCreateRequest<'a> {
    pub thread_id: ThreadId,
    pub objective: &'a str,
    pub token_budget: Option<i64>,
}

pub struct GoalCreateOutcome {
    pub goal: ThreadGoal,
    pub state_goal: codex_state::ThreadGoal,
    pub pending_intent: codex_state::ThreadGoalPendingIntent,
}

pub struct GoalSetOutcome {
    pub goal: ThreadGoal,
    pub state_goal: codex_state::ThreadGoal,
    pub previous_goal: Option<PreviousGoalSnapshot>,
    pub pending_intent: Option<codex_state::ThreadGoalPendingIntent>,
}

pub struct GoalSetRuntimeEffect {
    pub goal_id: String,
    pub status: codex_state::ThreadGoalStatus,
    pub previous_goal: Option<PreviousGoalSnapshot>,
    pub pending_intent: Option<codex_state::ThreadGoalPendingIntent>,
}

pub struct GoalService {
    // registered runtime handles by thread id
}
```

Required methods, equivalent names acceptable:

```rust
impl GoalService {
    pub fn new() -> Self;

    pub async fn get_thread_goal(
        &self,
        state_db: &codex_state::StateRuntime,
        thread_id: ThreadId,
    ) -> Result<Option<ThreadGoal>, GoalServiceError>;

    pub async fn create_thread_goal_from_tool(
        &self,
        state_db: &codex_state::StateRuntime,
        request: GoalCreateRequest<'_>,
    ) -> Result<GoalCreateOutcome, GoalServiceError>;

    pub async fn set_thread_goal(
        &self,
        state_db: &codex_state::StateRuntime,
        request: GoalSetRequest<'_>,
    ) -> Result<GoalSetOutcome, GoalServiceError>;

    pub async fn clear_thread_goal(
        &self,
        state_db: &codex_state::StateRuntime,
        thread_id: ThreadId,
    ) -> Result<bool, GoalServiceError>;

    pub(crate) fn register_runtime(&self, runtime: &Arc<GoalRuntimeHandle>);
    pub(crate) fn unregister_runtime(&self, runtime: &Arc<GoalRuntimeHandle>);
}
```

`GoalService` must own external Goal mutation ordering for app-server and
extension callers:

```text
acquire runtime goal-state permit when a live runtime exists
account in-flight usage if needed
persist durable Goal mutation through Batch 01 cadence-aware state API
persist pending Initial / ObjectiveUpdated / BudgetLimit intent when due
emit or expose ordered Goal event data to the caller
apply runtime bookkeeping
request cadence delivery or idle recheck without model-input injection
```

Do not make `GoalService` construct `ResponseItem` or `ResponseInputItem`.
Do not make it choose model role. Do not make it consume pending intent.
Do not split the same ordering across app-server and extension callers; the
service interface is the shared seam for that mutation/accounting behavior.

`GoalExtension::new_with_host_capabilities(...)` and `install_with_backend(...)`
must receive `Arc<GoalService>`. The extension must register each
`GoalRuntimeHandle` on thread start and unregister it on thread stop so
app-server `GoalService` calls can find live runtime accounting/cadence hooks.

Add `codex-goal-extension` as an app-server dependency if app-server does not
already depend on it. Because this changes `Cargo.toml`, the implementation
must run the repository dependency-lock workflow required by the root
`AGENTS.md`.

### 2. Convert App-Server Goal Mutation To `GoalService`

Edit:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/message_processor.rs`
- `codex-rs/app-server/Cargo.toml`
- `codex-rs/app-server/BUILD.bazel`, if the Bazel macro does not infer the
  new crate dependency

Replace the current local app-server mutation sequence with `GoalService`.

Required behavior:

- `thread/goal/get` calls `GoalService::get_thread_goal(...)`.
- `thread/goal/set` calls `GoalService::set_thread_goal(...)`.
- `thread/goal/clear` calls `GoalService::clear_thread_goal(...)`.
- ordered app-server responses and notifications remain product-equivalent.
- `message_processor.rs` creates or receives an `Arc<GoalService>` and passes
  it into `ThreadGoalRequestProcessor::new(...)`.
- app-server no longer calls:
  - `thread.prepare_external_goal_mutation()`
  - direct `state_db.thread_goals().replace_thread_goal(...)`
  - direct `state_db.thread_goals().update_thread_goal(...)`
  - direct `thread.apply_external_goal_set(...)`
  - direct `thread.apply_external_goal_clear()`

The service result must still let app-server emit the same response and
`thread/goal/updated` or `thread/goal/cleared` notifications. This is product
surface preservation, not model authority.

The `thread_goal_set_active_schedules_developer_role_goal_steering` test must
remain as an app-server integration scenario, but its payload assertion must be
updated from `<goal_context>` to the current developer-role Goal
internal-context item in final `/responses` input.

### 3. Convert Extension Tool Mutations To Cadence-Aware State

Edit:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Route `create_goal` through:

```rust
GoalService::create_thread_goal_from_tool(...)
```

Inside that service method, use the Batch 01 cadence-aware insert API:

```text
insert_thread_goal_with_initial_intent(...)
```

Required behavior:

- creating an active Goal writes durable Goal facts and pending Initial intent
  in the same state transaction
- tool-origin create creates an active Goal only; it always writes pending
  Initial intent on successful create
- duplicate create still returns the existing product error
- empty preview fill remains unchanged
- current-turn accounting baseline remains updated through
  `GoalAccountingState`
- `create_goal` does not construct or inject a Goal model item

`update_goal` that marks complete or blocked should remain a product/tool
status mutation and should not create active steering intent. It must keep
final usage reporting behavior.

### 4. Convert External Objective Updates

Edit:

- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Replace `apply_external_goal_set(..., steering_role: GoalContextRole)` with an
interface that carries structured mutation/cadence data only.

Required shape:

```rust
pub async fn apply_external_goal_set(
    &self,
    outcome: GoalSetRuntimeEffect,
) -> Result<(), String>;
```

`GoalSetRuntimeEffect` carries:

- `goal_id`
- current status
- previous goal snapshot
- pending intent kind and facts version when one was created
- event/accounting facts needed for metrics

When an external set creates a new active Goal:

```text
prepare/account usage
persist durable facts
persist pending Initial intent
mark current or idle accounting state active
request cadence delivery/recheck
```

When an external set changes the objective of the same active Goal:

```text
prepare/account usage
persist updated objective
persist pending ObjectiveUpdated intent
mark current or idle accounting state active
request cadence delivery/recheck
```

When an external set changes status away from Active:

```text
prepare/account usage
persist status change and clear/supersede stale active pending intent
clear runtime active-goal accounting when required
do not create active Goal steering
```

Delete the call chain that turns external ObjectiveUpdated into:

```text
goal_steering_item(...)
  -> GoalContext
  -> ResponseInputItem
  -> ThreadManager::inject_goal_steering_items_into_active_turn(...)
```

### 5. Convert BudgetLimit Reporting

Edit:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Change post-tool BudgetLimit handling to persist BudgetLimit pending intent
through the Batch 01 accounting API:

```text
account_thread_goal_usage_with_budget_intent(...)
```

Required behavior:

- account progress first
- persist BudgetLimited status and usage facts when the budget transition
  happens
- persist pending BudgetLimit intent with the returned facts version
- record metrics/events as today
- mark budget limit reported in runtime accounting only to avoid duplicate
  producer-side reporting, not to consume cadence intent
- request cadence delivery/recheck without concrete model input

Delete the BudgetLimit path that currently does:

```text
budget_limit prompt
  -> GoalContext
  -> ResponseInputItem
  -> active-turn injection
```

BudgetLimit delivery and supersedence remain owned by the Batch 02 finalizer.

### 6. Add Non-Model-Input Cadence Delivery Request

Edit:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`

Add a core request interface for same-turn cadence delivery that carries
metadata, not model input.

Suggested shape:

```rust
pub struct GoalCadenceDeliveryRequest {
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
}

pub enum GoalCadenceDeliveryRequestOutcome {
    AcceptedForActiveTurn,
    NoActiveTurn,
    ActiveTurnCannotAccept,
}
```

Add `ThreadManager` / `CodexThread` / `Session` methods equivalent to:

```rust
request_goal_cadence_delivery_for_active_turn(
    request: GoalCadenceDeliveryRequest,
) -> GoalCadenceDeliveryRequestOutcome;
```

The implementation may choose names that fit Batch 02/03 types, but the
interface must:

- store request metadata on the active `TurnState`
- not store `ResponseInputItem`
- not store rendered Goal prompt text
- not choose model role
- not consume pending intent
- not advance Continuation watermark
- make the current regular turn loop perform another sampling attempt when
  cadence delivery is accepted and no other model follow-up is already pending

If the active turn cannot accept same-turn delivery, the request outcome is not
a loss. The durable pending intent remains and Batch 03 idle Stage 2 delivers
it later.

`run_turn(...)` and `RegularTask` must treat accepted cadence-delivery metadata
as a reason to run another sampling attempt, but the finalizer still performs
the real selection from durable state. If the finalizer finds the pending
intent gone, stale, or superseded, it must not submit an empty Goal-owned
request.

### 7. Remove Extension Steering Role Configuration

Edit:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/config/config_tests.rs`
- config schema generated output if config types change

Remove `GoalContextRole` from `GoalExtensionConfig` and from
`install_with_backend(...)`.

Required behavior:

- `GoalExtensionConfig` stores enablement only, or enablement plus
  non-steering extension state
- extension tests no longer vary `GoalContextRole`
- active Goal steering role is always developer role because final
  request-input shaping constructs it that way
- any remaining `goals.steering_role` config key must not affect active Goal
  steering

If the broader config key cannot be removed in this batch because core still
has old producer paths awaiting Batch 06 cleanup, hard-map it in converted
Batch 04 paths:

```text
config may parse old values for compatibility
converted extension/app-server producers ignore the value for active steering
tests prove user cannot make extension-origin active Goal steering user-role
```

Do not preserve a user-role extension steering mode.

### 8. Delete Or Reduce `ext/goal/src/steering.rs`

Edit:

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`

After extension producers no longer construct model input, `steering.rs`
should either be deleted or reduced to prompt-body rendering helpers used by
the Batch 02 finalizer.

Preferred Batch 04 outcome:

- delete active `goal_steering_item(...)`
- delete `GoalSteeringFrame`
- delete all imports of:
  - `codex_core::context::GoalContext`
  - `codex_core::context::GoalContextRole`
  - `codex_protocol::models::ResponseInputItem`
- move any prompt-body helpers that remain useful to the shared prompt body
  owner selected by Batch 02

If prompt templates from upstream are adopted later, they still render prompt
body text only. The finalizer owns the developer-role `ResponseItem`.

### 9. Narrow Old Core Injection APIs

Edit:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

Batch 04 must remove the extension caller from:

```text
CodexThread::inject_goal_steering_items_into_active_turn(...)
Session::inject_goal_response_items(...)
InputQueue::inject_goal_response_items(...)
TurnState::append_current_turn_goal_steering_items(...)
```

These old APIs may still exist temporarily if core old producers or compaction
cleanup are not fully removed until Batch 05/06. Batch 04 must make them
unreachable from `ext/goal` and from app-server external mutation paths.

If no non-extension reachable producer remains after Batches 02 and 03, Batch
04 should delete these APIs immediately instead of leaving dead active shim
terrain.

### 10. Update TODOs And Comments That Preserve The Old Concept

Edit:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- any touched app-server/core comments that still describe Goal steering role
  application or `<goal_context>` as future active design

Remove or rewrite TODO text that says future host/runtime should apply:

- configured `GoalSteeringRole`
- role-neutral `<goal_context>` wrapping
- injection timing for prebuilt Goal model input
- hidden-context classification as active authority

Replacement wording should say:

```text
extension-owned mutation/accounting requests durable cadence intent;
final request-input shaping owns active Goal model input.
```

## Reachable Producers And Required Outcome

| Producer | Current path | Required Batch 04 outcome |
| --- | --- | --- |
| `create_goal` tool | `insert_thread_goal(...)`, mark accounting active, no pending Initial | convert to cadence-aware create/insert with pending Initial intent; no model input |
| app-server `thread/goal/set` new active Goal | direct state mutation, core `ExternalSet`, old steering runtime effects | route through `GoalService`; persist Initial intent; finalizer delivers |
| app-server `thread/goal/set` objective update | direct state mutation, core `ExternalSet`, active-turn injection if possible | route through `GoalService`; persist ObjectiveUpdated intent; request metadata/wake only |
| extension `apply_external_goal_set` | metrics/accounting plus `GoalContextRole` ObjectiveUpdated injection | structured runtime effect only; no role or model input |
| extension post-tool BudgetLimit | `account_thread_goal_usage(...)`, `goal_steering_item(...)`, active-turn injection | cadence-aware accounting with pending BudgetLimit intent; request metadata/wake only |
| extension Continuation | local v136 extension has no extension-owned idle Continuation; upstream/main has `continue_if_idle()` with `ResponseItem` | do not add extension-owned Continuation in Batch 04; Batch 03 core idle lifecycle remains owner unless a later version explicitly moves it |

## Tests

### Extension Crate Tests

Edit:

- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Update existing tests:

- `installed_goal_tools_create_goal_and_fill_empty_preview`
  - assert create writes pending Initial intent through state snapshot
  - keep preview and tool output assertions
- `backend_config_stores_role_and_updates_runtime_enabled_state`
  - rename and change to assert enablement only
  - remove `GoalContextRole::User` expectations
- `external_goal_mutation_start_accounts_active_goal_progress`
  - keep accounting/event assertions
  - assert no concrete steering injection is attempted
- `external_goal_set_active_resets_baseline_without_live_thread`
  - assert ObjectiveUpdated pending intent is written when objective changes
  - assert failed same-turn request does not drop pending intent
- BudgetLimit accounting tests
  - assert budget crossing writes pending BudgetLimit intent
  - assert producer-side reported flag does not consume pending intent
- `thread_resume_rehydrates_active_goal_idle_accounting`
  - keep idle accounting behavior
  - assert resume does not create Initial from active Goal state alone

Add tests:

- `goal_extension_create_active_goal_writes_initial_intent`
- `goal_extension_objective_update_writes_pending_intent_not_model_input`
- `goal_extension_budget_limit_writes_pending_intent_not_model_input`
- `goal_extension_config_cannot_select_user_role_steering`
- `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`

These extension tests can inspect state and runtime calls. They do not replace
final `/responses` payload tests.

### Core/App-Server Payload Tests

Edit:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/common/responses.rs` only if small request helpers are
  needed

Update:

- `thread_goal_set_active_schedules_developer_role_goal_steering`
  - keep the app-server scenario
  - assert captured `/responses` input contains exactly one developer-role
    current Goal internal-context item
  - assert no `<goal_context>` item reaches final request input
  - assert no user-role active Goal item is present

Add app-server or core integration tests:

- `thread_goal_set_objective_update_delivers_developer_role_goal_item`
  - app-server objective edit persists ObjectiveUpdated intent
  - captured final request renders the persisted updated objective
  - no old concrete injection path is used
- `goal_extension_budget_limit_delivers_via_finalizer`
  - extension/tool accounting crosses budget
  - pending BudgetLimit intent is written
  - next same-turn or idle request contains exactly one developer-role
    BudgetLimit item in final `/responses` input
- `goal_extension_same_turn_unavailable_keeps_pending_intent_for_idle`
  - active-turn delivery request is rejected or unavailable
  - pending intent remains
  - later idle Stage 2 delivers through finalizer
- `goal_extension_user_role_config_does_not_affect_final_payload`
  - old config value, if still parseable, is set to user
  - final `/responses` input still has developer-role Goal steering only

Use `core_test_support::responses` helpers:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

Assertions must target final request payloads, not prompt helper output.

## Verification

Docs-only validation for this planning batch:

```powershell
git diff --check -- local/goal_136_plan
```

Implementation validation for Batch 04:

```powershell
cd codex-rs
just fmt
```

Focused extension tests:

```powershell
cd codex-rs
cargo test -p codex-goal-extension --test goal_extension_backend goal_extension_
```

Focused app-server scenario:

```powershell
cd codex-rs
cargo test -p codex-app-server --test suite thread_goal_set_active_schedules_developer_role_goal_steering
```

Focused core payload tests if added under the core suite:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_extension
cargo test -p codex-core --test suite goal_authority
```

If `Cargo.toml` dependencies change:

```powershell
just bazel-lock-update
just bazel-lock-check
```

Do not run broad workspace or full crate suites by default on this workstation.

## Acceptance Criteria

Batch 04 is complete when:

- reachable `ext/goal` active steering producers no longer import or use
  `GoalContext`
- reachable `ext/goal` active steering producers no longer import or use
  `GoalContextRole`
- reachable `ext/goal` active steering producers no longer construct
  `ResponseInputItem` or `ResponseItem` for active Goal steering
- app-server and extension external Goal mutations share one service-style
  mutation ordering path through `GoalService`
- creating an active Goal through extension-owned tools writes pending Initial
  intent
- app-server new active Goal writes pending Initial intent
- app-server or extension objective updates write pending ObjectiveUpdated
  intent
- extension BudgetLimit accounting writes pending BudgetLimit intent
- same-turn delivery, when possible, uses metadata/wake behavior and the Batch
  02 finalizer, not concrete model-input injection
- unavailable same-turn delivery leaves pending intent intact for idle
  delivery
- old user-role steering config cannot affect extension-origin active Goal
  steering
- final request payload tests prove extension/app-server-origin steering
  reaches `/responses` as exactly one current developer-role Goal item
- final request payload tests prove no active `<goal_context>` item reaches
  `/responses` for converted extension/app-server paths
- old active injection APIs are removed or proven unreachable from `ext/goal`
  and app-server external Goal mutation paths

## Non-Goals

This batch does not:

- redesign app-server Goal APIs, wire payloads, or notification names
- remove upstream Goal product behavior such as `/goal`, status/footer
  projection, pause/edit/clear, budget, or usage
- implement automatic idle Continuation; Batch 03 owns that
- create persisted pending Continuation intent
- complete broad repair/classifier/projection cleanup; Batch 05 owns that
- finish compaction carry or rollout reconstruction cleanup
- delete every old `GoalContext` helper if other later-batch cleanup still
  needs legacy artifact detection
- parse rendered Goal text to recover active Goal state
- preserve user-role active Goal steering compatibility
- treat extension helper output, classifier output, or raw notifications as
  Goal authority

## Continuation Constraints

Batch 04 should be implemented after Batch 01 durable cadence state and Batch
02 final request-input shaping/Created commit exist. It should also follow
Batch 03 if same-turn delivery fallback depends on idle Stage 2 pending durable
cadence delivery.

Allowed continuation state while Batch 05/06 remain:

- app-server and extension mutation paths route through cadence-aware state
- extension-origin pending intent is delivered by the finalizer
- legacy artifact classifiers still await Batch 05
- dead old core injection APIs remain only if still required by unconverted
  later-batch cleanup terrain

Not allowed in a completed Batch 04 implementation:

- any reachable `ext/goal` path constructing active `GoalContext`
- any reachable `ext/goal` path accepting or applying `GoalContextRole` for
  active steering
- any reachable `ext/goal` path injecting concrete Goal `ResponseInputItem`s
  into active turns
- app-server external Goal mutation continuing to bypass the shared mutation
  ordering interface
- same-turn ObjectiveUpdated or BudgetLimit being dropped when metadata/wake
  delivery is unavailable
- tests that prove extension prompt helper output but not final `/responses`
  input
