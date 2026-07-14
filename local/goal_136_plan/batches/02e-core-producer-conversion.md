# Batch 02e: Core Producer Conversion

This slice converts core Initial, ObjectiveUpdated, and BudgetLimit producers
away from pre-finalizer concrete Goal model input.

After this slice, core producers create durable pending cadence intent and
request/wake metadata. They do not inject active `GoalContext` or concrete
`ResponseInputItem` as authority.

## Direction Lock

Request:

- split Batch 02 producer conversion away from finalizer selection and Created
  commit
- keep `goals.rs` as transitional adapter terrain, not a new authority owner
- remove core dependence on pre-finalizer active Goal injection for Initial,
  ObjectiveUpdated, and BudgetLimit

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01c-cadence-aware-store-operations.md`
- `local/goal_136_plan/batches/02c-pending-intent-selection-and-insertion.md`
- `local/goal_136_plan/batches/02d-created-commit-and-carry.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- `goals.rs` currently stores runtime-only
  `initial_steering_goal_id: Mutex<Option<String>>`.
- Initial is currently represented by runtime state and old continuation
  candidate selection.
- ObjectiveUpdated and BudgetLimit create `GoalSteeringMessage` and inject
  concrete `ResponseInputItem`s into the active turn.
- `Session::inject_goal_response_items(...)` and
  `InputQueue::inject_goal_response_items(...)` register old concrete carry.
- `codex_thread.rs` exposes
  `inject_goal_steering_items_into_active_turn(...)` for extension callers.

Code-shape temptation:

- keep concrete injection as a fallback if same-turn delivery is unavailable
- create durable pending intent and still inject the old item "for now"
- move lifecycle mutation ordering into a new core Goal service
- convert `ext/goal` in this slice and reopen ownership

Locked direction:

- switch core Initial, ObjectiveUpdated, and BudgetLimit mutation/accounting
  paths to Batch 01 cadence-aware state APIs
- replace same-turn concrete injection with typed wake/recheck metadata only
- keep final item construction in `goal_cadence.rs`
- leave extension conversion to Batch 04

Exclusions:

- no `ext/goal` producer conversion
- no new core `GoalService`
- no automatic Continuation rewrite
- no broad cleanup of every old symbol
- no projection/compaction classifier work

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/tool.rs`

Findings to preserve:

- core `goals.rs` is currently a large legacy runtime/adapter file.
- Batch docs require edits there to stay transitional.
- old initial steering state is runtime-only and must not remain the durable
  Initial cadence model.
- same-turn injection failure currently drops ObjectiveUpdated/BudgetLimit
  steering; durable pending intent must survive instead.

## Prerequisites And Dependencies

Required:

- 01c cadence-aware store operations exist.
- 02c finalizer can select pending intent.
- 02d Created commit consumes intent.

This slice should not land before 02c/02d unless it is hidden behind clearly
disabled code. Converting producers before finalizer/commit exists can strand
pending intent.

## Exact Files To Edit

Expected edits:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`

Possible adapter edits:

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/goal_cadence.rs`

Do not edit as part of this slice:

- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/extension.rs`

Those files are Batch 04 unless a compile-only adapter is unavoidable.

## Required Edits

### 1. Convert Initial Producers To Durable Intent

Core paths that create or reactivate an active Goal must use Batch 01
cadence-aware APIs:

- `insert_thread_goal_with_initial_intent(...)`
- `replace_thread_goal_with_initial_intent(...)`
- equivalent state operation from 01c

Remove Initial reliance on:

- `mark_initial_goal_steering_pending(...)` as the source of Initial cadence
- runtime-only `initial_steering_goal_id` for durable Initial delivery
- concrete `GoalSteeringMessage` construction for Initial

Runtime accounting may still track active Goal id for usage. That accounting
is not cadence authority.

### 2. Convert ObjectiveUpdated Producers

Core objective update paths must use:

- `update_thread_goal_with_objective_intent(...)`

Rules:

- persist updated objective first
- pending ObjectiveUpdated intent survives if no active turn can immediately
  sample
- do not inject `GoalSteeringMessage` or `ResponseInputItem`
- request/wake metadata may ask the active turn to recheck finalizer state
  without carrying rendered prompt text

### 3. Convert BudgetLimit Producers

Core budget accounting paths that currently inject BudgetLimit steering must
use:

- `account_thread_goal_usage_with_budget_intent(...)`

Rules:

- account usage/status first
- pending BudgetLimit survives until Created commit
- BudgetLimit supersedes older active-state intent through state/finalizer
  rules
- do not use `budget_limit_reported_goal_id` as the durable delivery guard
  for pending BudgetLimit

Runtime may retain accounting guards only to avoid repeated local accounting
work. It must not be the source of cadence authority.

### 4. Replace Same-Turn Injection With Wake/Recheck Metadata

Where the old path calls:

- `inject_goal_response_items(...)`
- `extend_goal_pending_input_for_turn_state(...)`
- `GoalSteeringMessage::into_response_input_item(...)`

replace core Initial / ObjectiveUpdated / BudgetLimit usage with a typed
request that says, in effect:

```text
Goal cadence state changed; active turn should re-run final request-input
finalizer on its next sampling opportunity.
```

This metadata must not include:

- rendered Goal prompt body
- `ResponseInputItem`
- `ResponseItem`
- role choice
- `<goal_context>` text

If no active turn exists, do nothing beyond durable pending intent. The next
normal sampling attempt or idle logic will read pending state.

### 5. Keep `goals.rs` As Adapter Terrain

Allowed in `goals.rs`:

- validation
- state/protocol conversion
- metrics
- usage accounting hooks
- prompt-body helper functions, if still used by `goal_cadence.rs`
- small typed wake/recheck helpers

Forbidden:

- final request-input shaping
- `ResponseItem` construction for active steering
- pending-intent consumption
- Created commit
- new long-lived core Goal service

### 6. Leave Extension Producers For Batch 04

Do not convert `ext/goal` in this slice.

If core changes require extension compile adaptation, use the smallest adapter
possible and document that full extension producer conversion remains Batch
04.

## Focused Tests

Add or update tests for:

- `goal_authority_core_create_goal_writes_pending_initial_not_concrete_injection`
- `goal_authority_core_objective_update_writes_pending_intent_when_no_active_turn`
- `goal_authority_core_budget_limit_writes_pending_intent_when_injection_closed`
- `goal_authority_same_turn_injection_failure_does_not_drop_objective_updated`
- `goal_authority_same_turn_injection_failure_does_not_drop_budget_limit`

Tests should inspect:

- durable pending intent state
- final request payload when a later sampling attempt runs
- absence of active `<goal_context>` / concrete pre-finalizer item for the
  converted core path

Do not rely on helper text or old current-turn concrete carry.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-core --lib goal_authority_core
```

If integration tests are added:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority_core
```

Do not run broad workspace suites by default.

## Acceptance Criteria

This slice is complete when:

- core Initial producers create durable pending Initial intent
- core ObjectiveUpdated producers create durable pending ObjectiveUpdated
  intent
- core BudgetLimit producers create durable pending BudgetLimit intent
- converted core producers no longer inject active `GoalContext` or concrete
  Goal `ResponseInputItem`
- same-turn unavailable/closed injection cannot lose required intent
- final request-input construction remains in `goal_cadence.rs`
- extension producer conversion is explicitly left for Batch 04

## Non-Goals

This slice does not:

- convert `ext/goal`
- remove all old carry symbols
- implement Continuation rewrite
- own Created commit
- own request-payload acceptance matrix
- redesign app-server Goal product APIs

## Partial Landing Constraints

02e must not land before 02c and 02d in a branch that is expected to run, unless
all converted producer paths remain disabled.

If extension producer conversion is attempted in the same PR, satisfy Batch
04 rather than expanding this slice.

