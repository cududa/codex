# Work Area 04: `ext/goal` Conversion

This Work Area converts reachable `codex-rs/ext/goal` Goal steering producers away
from active `GoalContext`, `<goal_context>`, `GoalContextRole`, and concrete
model-input injection before request shaping.

After this Work Area, extension-origin Goal changes may still own tools, lifecycle,
accounting, events, and mutation entry points. They must not construct active
Goal model input. Any active steering they cause must be expressed as durable
cadence state and selected by the Work Area 02 final request-input shaping path.

This conversion preserves extension-origin Goal creation. The agent-callable
`create_goal` tool remains a valid mutation entry point when no Goal currently
exists; the required change is that successful create writes pending Initial
intent instead of relying on active model-input construction.

## Direction Lock

Request:

- author the Work Area 04 execution plan for `ext/goal` conversion
- ground the plan in current extension, core, app-server, and upstream terrain
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`

Terrain:

- local `ext/goal` currently stores `GoalContextRole` in extension config
- local `ext/goal/src/steering.rs` builds `GoalContext` and returns
  `ResponseInputItem`
- local `ext/goal/src/runtime.rs` injects those concrete items into active
  turns through `ThreadManager`
- app-server external Goal mutations use the core `ExternalMutationStarting`,
  `ExternalSet`, and `ExternalClear` runtime hooks
- `rust-v0.139.0`, `rust-v0.140.0`, and upstream/main move toward
  extension-owned `GoalService`, but still inject user-role internal-context
  `ResponseItem`s
- recorded request evidence is not produced anywhere in this extension or
  app-server mutation terrain today; WA04 must route toward the WA02
  Created-event commit path instead of adding an extension-side evidence path

Code-shape temptation:

- preserve the local active-turn injection chain as the same-turn delivery
  mechanism
- over-delete extension Goal tools because they were near active steering
  injection terrain
- copy upstream's service ownership shape while also copying upstream's
  user-role helper output as active steering
- make `ext/goal` call low-level state APIs from every contributor and
  duplicate external mutation ordering in app-server
- treat role-preserving `ResponseInputItem` conversion as enough because the
  old item may already be developer-role

Locked direction:

- convert the existing v136 `GoalExtension` / `GoalRuntimeHandle`
  adapter-runtime topology as the selected route
- preserve extension-owned `create_goal` as a mutation entry point that creates
  an active Goal only when no Goal currently exists and writes pending Initial
  intent on success
- do not add an `ext/goal/src/api.rs` service facade as part of the planned
  v136 route; revisit a thin facade only if the ordering checkpoint proves
  adapter/runtime plus WA01/WA02/WA03 seams cannot carry shared app-server,
  extension, and tool mutation ordering
- use Work Area 01 cadence-aware state APIs to persist durable facts and pending
  Initial, ObjectiveUpdated, or BudgetLimit intent
- use Work Area 02 final request-input shaping as the only active Goal model-input
  construction and commit path
- use Work Area 03 idle/pending-cadence delivery when same-turn delivery cannot be
  accepted without concrete model-input injection
- keep v139/v140 migration compatibility by preventing new long-lived ownership
  in `core/src/goals.rs`, not by prematurely recreating the full later service
  topology
- keep recorded request evidence, when implemented, on the WA02 Created-event
  commit path for the exact finalized request attempt

Exclusions:

- no Rust implementation in this planning pass
- no app-server product redesign
- no mandatory v139/v140-style `GoalService` move in v136
- no user-role active Goal steering compatibility
- no repair or classifier expansion beyond the conversion needed here
- no broad projection, raw-response, compaction, or reconstruction cleanup
- no persisted pending Continuation intent
- no extension-owned recorded request evidence writer

## Bounded Code Terrain Read

Files read for this Work Area:

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
  - `rust-v0.136.0:codex-rs/ext/goal/src/extension.rs`
  - `rust-v0.136.0:codex-rs/ext/goal/src/runtime.rs`
  - `rust-v0.136.0:codex-rs/ext/goal/src/steering.rs`
  - `rust-v0.136.0:codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `rust-v0.139.0:codex-rs/ext/goal/src/api.rs`
  - `rust-v0.139.0:codex-rs/ext/goal/src/extension.rs`
  - `rust-v0.139.0:codex-rs/ext/goal/src/runtime.rs`
  - `rust-v0.139.0:codex-rs/ext/goal/src/steering.rs`
  - `rust-v0.139.0:codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/api.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/extension.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/runtime.rs`
  - `rust-v0.140.0:codex-rs/ext/goal/src/steering.rs`
  - `rust-v0.140.0:codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `upstream/main:codex-rs/ext/goal/src/api.rs`
  - `upstream/main:codex-rs/ext/goal/src/extension.rs`
  - `upstream/main:codex-rs/ext/goal/src/runtime.rs`
  - `upstream/main:codex-rs/ext/goal/src/steering.rs`

Findings:

- `ext/goal/src/tool.rs` creates active Goals with
  `insert_thread_goal(...)`, marks the current turn active, and emits events.
  It does not create pending Initial intent today. That tool entry point is
  product behavior to preserve; only its durable cadence side effect changes.
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
  or pending input exists, through
  `Session::close_goal_steering_injection_if_no_pending_input(...)` and
  `InputQueue::has_pending_input(...)`. Same-turn Goal delivery needs a
  non-model-input metadata/wake path if the active turn would otherwise stop.
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs` already
  performs the required external mutation ordering in local form:
  prepare runtime effects, persist mutation, emit ordered event, then apply
  runtime effects.
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs` has a test named
  `thread_goal_set_active_schedules_developer_role_goal_steering`, but it
  currently asserts `<goal_context>` text. Work Area 04 should keep the product
  scenario and change the assertion to final request input containing the
  current source-tagged Goal text inside exactly one outer developer-role
  `ResponseItem`.
- `rust-v0.136.0` confirms the target landing topology is still
  `GoalExtension` plus `GoalRuntimeHandle`; it has no `GoalService` facade.
- `rust-v0.139.0`, `rust-v0.140.0`, and upstream/main add a `GoalService`
  ownership shape and remove extension `GoalContextRole` config. That
  direction is useful migration terrain, but upstream still constructs
  user-role internal-context `ResponseItem`s in `steering.rs` and injects them
  through active-turn APIs. This fork must not copy that authority mistake, and
  Work Area 04 should not install the later service topology unless the v136
  adapter/runtime route is proven insufficient.

## Ownership Split For This Work Area

Work Area 04 moves mutation/accounting behavior toward extension ownership
without moving active model-input authority there. Use this split while
implementing:

- `codex-rs/ext/goal/src/tool.rs`, `runtime.rs`, and `extension.rs` remain the
  selected v136 adapter/runtime topology. They own lifecycle, tools, runtime
  accounting, metrics, events, durable state calls, and typed cadence requests
  where useful. They no longer own active-steering injection chains.
- `codex-rs/ext/goal/src/api.rs` is not part of the planned v136 route. A thin
  facade may be reconsidered only if the ordering checkpoint proves the
  selected adapter/runtime route cannot carry shared app-server/tool/extension
  mutation ordering, accounting effects, event facts, and typed cadence
  delivery requests.
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs` is a
  product API adapter. It preserves the same response and notification shapes
  while routing through the selected Work Area 04 adapter/runtime ordering
  path. It does not construct or deliver active model input.
- Work Area 01 state APIs own durable facts and pending intent writes.
  Work Area 02 `core/src/goal_cadence/` remains the only owner of active
  developer-role Goal `ResponseItem` construction and commit metadata.
- Recorded request evidence, when present, is appended only by the WA02
  Created-event commit handler for the exact finalized request attempt.
  Extension and app-server mutation code may return facts or typed cadence
  metadata that later become commit metadata, but they must not append evidence
  or treat evidence as authority.
- `codex-rs/core/src/session/input_queue.rs`, `codex-rs/core/src/state/turn.rs`,
  `codex-rs/core/src/session/mod.rs`, and `codex-rs/core/src/codex_thread.rs`
  may expose metadata/wake request plumbing for same-turn cadence delivery.
  They must not accept rendered Goal prompt text or prebuilt Goal model input
  from the extension as authority.
- `codex-rs/ext/goal/src/steering.rs` should be deleted or reduced to
  prompt-body helpers. It must not return `ResponseItem` or `ResponseInputItem`
  for active steering.

## Required Edits

### 1. Confirm The Work Area 04 Ordering Shape

Edit:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`

Before implementing the mutation conversion, the first pass must record the
selected v136 route:

- keep current v136 `GoalExtension` and `GoalRuntimeHandle` topology
- convert active steering effects to durable pending intent plus
  metadata-only cadence requests
- keep app-server ordered responses/notifications on its current processor
  path while using the same cadence-aware state APIs and core wake/recheck
  adapters
- do not force app-server to depend on `codex-goal-extension`
- do not add `codex-rs/ext/goal/src/api.rs`

This route is selected because it matches upstream v136 topology, preserves
the clean later migration seam, and avoids installing a facade before the
authority-correct v136 behavior exists.

Stop only if code inspection finds a concrete blocker that adapter/runtime plus
WA01 durable operations, WA02 request-input shaping/commit, and WA03
metadata/idle delivery cannot carry. In that case, update the WA04 map and this
doc before writing downstream pass docs. Do not silently introduce a facade in
later implementation passes.

No ordering route may construct active model input, choose the active steering
role, consume pending intent, or advance Continuation suppression.

### 2. Convert App-Server Goal Mutation Through The Selected Adapter/Runtime Path

Edit:

- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/BUILD.bazel`, if dependency metadata changes

App-server Goal mutation must preserve product-equivalent ordered responses and
notifications while switching to cadence-aware durable state operations.

Required behavior:

- `thread/goal/get` remains a product read path and does not construct model
  input.
- `thread/goal/set` selects the WA01 durable operation from current facts plus
  requested facts, and then treats the returned state outcome as the only
  source of pending-cadence metadata.
- `thread/goal/set` for a new or replacement active Goal writes durable facts
  plus pending Initial intent in one state transaction. If the resulting Goal
  is not active, it clears or supersedes active-state intent instead.
- `thread/goal/set` for an active objective edit writes durable facts plus
  pending ObjectiveUpdated intent in one state transaction only when the
  resulting Goal remains active. If the same request also moves the Goal to
  BudgetLimited or a terminal/non-active status, the WA01 outcome applies
  BudgetLimit or cleanup supersedence instead of preserving stale
  ObjectiveUpdated work.
- `thread/goal/set` for a non-active status clears or supersedes stale active
  pending intent as specified by Work Area 01.
- `thread/goal/clear` deletes durable facts and pending intent.
- app-server requests metadata-only cadence delivery or idle recheck when
  the state outcome contains pending Initial, ObjectiveUpdated, or BudgetLimit
  intent; it does not inject prebuilt Goal model input.

App-server keeps its local processor structure and calls state plus core
thread/runtime adapters directly, as long as the ordering is explicit and no
concrete Goal model input is built. This Work Area must not force app-server to
depend on `codex-goal-extension`.

The `thread_goal_set_active_schedules_developer_role_goal_steering` test must
remain as an app-server integration scenario, but its payload assertion must be
updated from `<goal_context>` to final `/responses` input containing exactly
one current developer-role Goal `ResponseItem`.
If the recorded-evidence carrier is in scope for the implementation pass, the
same scenario may assert Created-event evidence fingerprints for the exact
finalized request. It must not use ordinary rollout `ResponseItem`s, rollout
trace payloads, raw notifications, classifier matches, or rendered Goal text as
an extension-origin delivery substitute.

### 3. Convert Extension Tool Mutations To Cadence-Aware State

Edit:

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Route `create_goal` through the selected Work Area 04 adapter/runtime ordering
path. That path must use the Work Area 01 cadence-aware insert API:

```text
insert_thread_goal_with_initial_intent(...)
```

Required behavior:

- `create_goal` remains available as an extension-owned agent tool; it is not
  deleted merely because active steering construction moves out of `ext/goal`
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
final usage reporting behavior while using WA01 status behavior to clear or
supersede stale active-state pending intent that the terminal status makes
undeliverable.

### 4. Convert External Objective Updates

Edit:

- `codex-rs/ext/goal/src/runtime.rs`
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

The effect is derived from the completed WA01 durable mutation outcome.
Runtime code must not create pending intent, infer pending kind from request
bodies or prompt helper text, or write durable facts independently.

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
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Change post-tool BudgetLimit handling so the named BudgetLimit producer
persists BudgetLimit pending intent through the Work Area 01 accounting API
only when the returned state outcome says model wrap-up work is newly due:

```text
account_thread_goal_usage_with_budget_intent(...)
```

Required behavior:

- account progress first
- persist BudgetLimited status and usage facts when the BudgetLimit producer
  transition happens
- persist pending BudgetLimit intent with the returned facts version only when
  that outcome says BudgetLimit cadence is newly due
- record metrics/events as today
- mark budget limit reported in runtime accounting only to avoid duplicate
  producer-side reporting, not to consume cadence intent
- request cadence delivery/recheck without concrete model input
- preserve shared accounting callers that merely maintain product accounting,
  terminal status, usage-limit behavior, or continued BudgetLimited accrual
  without creating duplicate/new BudgetLimit cadence unless their WA01 outcome
  explicitly says wrap-up work is due

Delete the BudgetLimit path that currently does:

```text
budget_limit prompt
  -> GoalContext
  -> ResponseInputItem
  -> active-turn injection
```

BudgetLimit delivery and supersedence remain owned by the Work Area 02
request-input shaper and Created-event commit handler.

### 6. Add Non-Model-Input Cadence Delivery Request

Edit:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`

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

The implementation may choose names that fit Work Area 02/03 types, but the
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
a loss. The durable pending intent remains and Work Area 03 idle Stage 2 delivers
it later.

`run_turn(...)` and `RegularTask` must treat accepted cadence-delivery metadata
as a reason to run another sampling attempt, but the request-input shaper still
performs the real selection from a fresh durable snapshot. In current terrain,
that means replacing or augmenting the
`close_goal_steering_injection_if_no_pending_input(...)` /
`has_pending_input(...)` repeat predicate so accepted metadata is visible as a
recheck signal without becoming pending `TurnInput`, mailbox input, rendered
Goal prompt text, `ResponseItem`, or `ResponseInputItem`. If the shaper finds
the pending intent gone, stale, or superseded, it must not submit an empty
Goal-owned request.

### 7. Remove Extension Steering Role Configuration

Edit:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
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

If the broader config key cannot be removed in this Work Area because core still
has old producer paths awaiting Work Area 06 cleanup, hard-map it in converted
Work Area 04 paths:

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
the Work Area 02 request-input shaping path.

Preferred Work Area 04 outcome:

- delete active `goal_steering_item(...)`
- delete `GoalSteeringFrame`
- delete all imports of:
  - `codex_core::context::GoalContext`
  - `codex_core::context::GoalContextRole`
  - `codex_protocol::models::ResponseInputItem`
- move any prompt-body helpers that remain useful to the shared prompt body
  owner selected by Work Area 02

If prompt templates from upstream are adopted later, they still render prompt
body text only. The request-input shaper owns the developer-role
`ResponseItem`.

### 9. Narrow Old Core Injection APIs

Edit:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

Work Area 04 must remove the extension caller from:

```text
CodexThread::inject_goal_steering_items_into_active_turn(...)
Session::inject_goal_response_items(...)
InputQueue::inject_goal_response_items(...)
TurnState::append_current_turn_goal_steering_items(...)
```

These old APIs may still exist temporarily if core old producers or compaction
cleanup are not fully removed until Work Area 05/06. Work Area 04 must make them
unreachable from `ext/goal` and from app-server external mutation paths.
That reachability audit includes `codex-rs/core/src/goals.rs`:
`GoalRuntimeEvent::ExternalSet` and `apply_external_thread_goal_status(...)`
must not remain a WA04 app-server/external mutation route into
`GoalSteeringMessage` or `inject_goal_response_items(...)` after the 04b
conversion.

If no non-extension reachable producer remains after Work Areas 02 and 03, Work Area
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

| Producer | Current path | Required Work Area 04 outcome |
| --- | --- | --- |
| `create_goal` tool | agent-callable mutation path using `insert_thread_goal(...)`, mark accounting active, no pending Initial | preserve the tool entry point; convert to cadence-aware create/insert with pending Initial intent; no model input |
| `update_goal` tool | terminal complete/blocked product mutation, final usage reporting, active accounting cleanup | preserve product status behavior; clear/supersede stale active-state pending intent; do not create active cadence intent; no model input |
| app-server `thread/goal/set` new active Goal | direct state mutation, core `ExternalSet`, old steering runtime effects | route through the selected adapter/runtime ordering path; persist Initial intent; final request-input shaper delivers |
| app-server `thread/goal/set` objective update | direct state mutation, core `ExternalSet`, active-turn injection if possible | route through the selected adapter/runtime ordering path; persist ObjectiveUpdated intent; request metadata/wake only |
| extension `apply_external_goal_set` | metrics/accounting plus `GoalContextRole` ObjectiveUpdated injection | structured runtime effect only; no role or model input |
| extension post-tool BudgetLimit | `account_thread_goal_usage(...)`, `goal_steering_item(...)`, active-turn injection | cadence-aware accounting with pending BudgetLimit intent only when wrap-up cadence is newly due; request metadata/wake only |
| extension Continuation | local v136 extension has no extension-owned idle Continuation; `rust-v0.140.0` and upstream/main have `continue_if_idle()` with `ResponseItem` | do not add extension-owned Continuation in Work Area 04; Work Area 03 core idle lifecycle remains owner unless a later version explicitly moves it |

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
  - assert the WA01 objective-update outcome carries pending intent when the
    objective changes
  - assert runtime requests metadata and does not write pending intent itself
  - assert failed same-turn request does not drop pending intent
- BudgetLimit accounting tests
  - assert post-tool budget crossing writes pending BudgetLimit intent only
    when wrap-up cadence is newly due
  - assert producer-side reported flag does not consume pending intent
  - assert continued BudgetLimited accounting does not create duplicate
    BudgetLimit cadence
- `thread_resume_rehydrates_active_goal_idle_accounting`
  - keep idle accounting behavior
  - assert resume does not create Initial from active Goal state alone

Add tests:

- `goal_extension_create_active_goal_writes_initial_intent`
- `goal_extension_objective_update_outcome_requests_metadata_not_model_input`
- `goal_extension_budget_limit_writes_pending_intent_not_model_input`
- `goal_extension_update_goal_terminal_status_clears_stale_active_intent`
- `goal_extension_config_cannot_select_user_role_steering`
  - extension-level config/metadata assertion; final `/responses` payload
    proof for old user-role config belongs to app-server/core payload tests
- `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`

These extension tests can inspect state and runtime calls. They do not replace
final `/responses` payload tests. They also do not write or validate recorded
request evidence; evidence belongs to the Created-event commit path tested from
the final request-input side.

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
    current Goal `ResponseItem`
  - assert no `<goal_context>` item reaches final request input
  - assert no user-role active Goal item is present

Final-payload test ownership must be explicit. Current v136 terrain does not
host `codex-goal-extension` through app-server, and core tests cannot import
the extension without reversing the existing dependency direction. True
extension-origin final-payload coverage may live in an extension integration
test only if that test drives a real extension producer through a real core
request path with mock Responses. If that route is not practical in v136,
extension tests must cover durable pending intent, accounting, events, and
metadata request outcomes, while app-server/core payload tests cover the
shared Work Area 02 shaper from equivalent pending intent. Do not describe the
paired route as end-to-end extension-origin final-payload coverage.

Add app-server or core integration tests:

- `thread_goal_set_objective_update_delivers_developer_role_goal_item`
  - app-server objective edit persists ObjectiveUpdated intent
  - captured final request renders the persisted updated objective
  - no old concrete injection path is used
- `goal_extension_budget_limit_delivers_via_request_shaping`
  - use this name only if the chosen test route drives a real extension
    BudgetLimit producer through a real core request path
  - extension/tool accounting crosses budget
  - pending BudgetLimit intent is written
  - next same-turn or idle request contains exactly one developer-role
    BudgetLimit item in final `/responses` input
- `pending_budget_limit_intent_delivers_via_request_shaping` or equivalent
  - use this route if the final payload test seeds equivalent pending intent
    rather than driving a real extension producer
  - pair it with extension state/runtime BudgetLimit tests
- `goal_extension_same_turn_unavailable_keeps_pending_intent_for_idle`
  - use this name only when the extension producer path is driven end to end;
    otherwise use an equivalent pending-intent/shared-shaper name
  - active-turn delivery request is rejected or unavailable
  - pending intent remains
  - later idle Stage 2 delivers through final request-input shaping
- `goal_extension_user_role_config_does_not_affect_final_payload`
  - use this name only if the old config value is exercised through a real
    extension producer-to-core-request path
  - old config value, if still parseable, is set to user
  - final `/responses` input still has developer-role Goal steering only

Use `core_test_support::responses` helpers:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

Assertions must target final request payloads, not prompt helper output. When a
test needs recorded request evidence, it must assert structured Created-event
metadata paired to the captured finalized input by fingerprint. It must not
treat ordinary rollout items, rollout trace request bodies, raw response
notifications, classifier matches, or rendered Goal text as substitutes.

## Verification

Docs-only validation for this planning Work Area:

```powershell
git diff --check -- local/goal_research local/goal_136_plan
```

Implementation validation for Work Area 04:

```powershell
cd codex-rs
just fmt
```

Focused extension tests:

```powershell
cd codex-rs
cargo test -p codex-goal-extension --test goal_extension_backend
```

If implementation needs a narrower local filter, list the touched existing
tests and new tests explicitly. Do not use only a `goal_extension_` prefix,
because several preserved product/accounting tests in
`goal_extension_backend.rs` do not use that prefix.

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

## Target State

This Work Area's target state is:

- reachable `ext/goal` active steering producers no longer import or use
  `GoalContext`
- reachable `ext/goal` active steering producers no longer import or use
  `GoalContextRole`
- reachable `ext/goal` active steering producers no longer construct
  `ResponseInputItem` or `ResponseItem` for active Goal steering
- app-server and extension external Goal mutations use the selected Work Area
  04 adapter/runtime mutation ordering path
- creating an active Goal through extension-owned tools writes pending Initial
  intent
- app-server new active Goal writes pending Initial intent
- app-server or extension objective updates write pending ObjectiveUpdated
  intent
- extension post-tool BudgetLimit producer writes pending BudgetLimit intent
  only when the WA01 outcome says wrap-up cadence is newly due
- same-turn delivery, when possible, uses metadata/wake behavior and the Work Area
  02 request-input shaper, not concrete model-input injection
- unavailable same-turn delivery leaves pending intent intact for idle
  delivery
- old user-role steering config cannot affect extension-origin active Goal
  steering
- final request payload tests prove app-server-origin steering reaches
  `/responses` as exactly one current developer-role Goal item, and
  extension-related final-payload coverage follows either the true extension
  integration route or the paired shared-shaper route named in this Work Area
- final request payload tests prove no active `<goal_context>` item reaches
  `/responses` for converted extension/app-server paths
- any recorded request evidence involved in WA04 scenarios is written only by
  the Created-event commit handler and is structured metadata paired to the
  finalized request input; extension/app-server code does not write evidence
  and tests do not use rendered Goal text as a substitute
- old active injection APIs are removed or proven unreachable from `ext/goal`
  and app-server external Goal mutation paths, including the
  `core/src/goals.rs` external set hook

## Non-Goals

This Work Area does not:

- redesign app-server Goal APIs, wire payloads, or notification names
- remove the extension-owned `create_goal` tool or the rule that it may create
  a Goal when no Goal currently exists
- remove upstream Goal product behavior such as `/goal`, status/footer
  projection, pause/edit/clear, budget, or usage
- implement automatic idle Continuation; Work Area 03 owns that
- create persisted pending Continuation intent
- complete broad repair/classifier/projection cleanup; Work Area 05 owns that
- finish compaction carry or rollout reconstruction cleanup
- delete every old `GoalContext` helper if other later-Work Area cleanup still
  needs legacy artifact detection
- parse rendered Goal text to recover active Goal state
- preserve user-role active Goal steering compatibility
- treat extension helper output, classifier output, raw notifications, ordinary
  rollout items, rollout trace payloads, recorded request evidence, or rendered
  Goal text as Goal authority

## Continuation Constraints

Work Area 04 should be implemented after Work Area 01 durable cadence state and Work Area
02 final request-input shaping/Created commit exist. It should also follow
Work Area 03 if same-turn delivery fallback depends on idle Stage 2 pending durable
cadence delivery.

Allowed interim state while Work Area 05/06 remain:

- app-server and extension mutation paths route through cadence-aware state
- extension-origin pending intent is selected by the request-input shaper and
  consumed by the Created-event commit handler
- legacy artifact classifiers still await Work Area 05
- dead old core injection APIs remain only if still required by unconverted
  later-Work Area cleanup terrain

Not allowed for this Work Area's target state:

- any reachable `ext/goal` path constructing active `GoalContext`
- any reachable `ext/goal` path accepting or applying `GoalContextRole` for
  active steering
- any reachable `ext/goal` path injecting concrete Goal `ResponseInputItem`s
  into active turns
- app-server external Goal mutation continuing to bypass the selected Work Area
  04 adapter/runtime mutation ordering path
- same-turn ObjectiveUpdated or BudgetLimit being dropped when metadata/wake
  delivery is unavailable
- tests that prove extension prompt helper output but not final `/responses`
  input
