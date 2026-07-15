# WA04d Extension Runtime Objective Effects

This implementation pass converts extension runtime external objective effects
from role-bearing active injection to structured runtime effects plus
metadata-only cadence requests.

It is for `ext/goal` runtime paths. App-server production mutation ordering is
handled by 04b, although both paths should share the same WA01 outcome and
WA04a metadata concepts.

## Direction Lock

Request:

- convert `GoalRuntimeHandle::apply_external_goal_set(...)`
- remove `GoalContextRole` from the runtime objective-effect path
- preserve metrics and accounting behavior
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `prepare_external_goal_mutation(...)` accounts active or idle progress before
  external mutation
- `apply_external_goal_set(goal, previous_goal, steering_role)` currently
  records metrics, updates accounting baselines, and may inject
  ObjectiveUpdated steering
- `inject_active_turn_goal_steering(...)` builds concrete model input through
  `goal_steering_item(...)`
- `inject_active_turn_steering(...)` calls `CodexThread` active-turn injection

Code-shape temptation:

- keep `GoalContextRole` as a harmless runtime option because WA02 will clean
  final input later
- let runtime infer ObjectiveUpdated from request bodies or helper prompt text
- duplicate app-server state mutation logic inside runtime effects

Locked direction:

- runtime receives a structured effect/outcome from the durable mutation path
- runtime preserves metrics/accounting only
- runtime requests cadence delivery through WA04a metadata when a pending
  Initial, ObjectiveUpdated, or BudgetLimit intent exists
- runtime does not create, infer, or repair durable pending intent by itself;
  it trusts the WA01 mutation outcome supplied by the selected ordering path
- final role and model input construction remain WA02 responsibilities

Exclusions:

- no active model input construction
- no role selection
- no state mutation outside the selected ordering path
- no pending-intent consumption
- no recorded request evidence writing

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/src/runtime.rs`
  - `prepare_external_goal_mutation(...)`
  - `apply_external_goal_set(...)`
  - `inject_active_turn_goal_steering(...)`
  - `inject_active_turn_steering(...)`
  - `restore_after_resume(...)`
- `codex-rs/ext/goal/src/extension.rs`
  - callers and config that pass `GoalContextRole`
- `codex-rs/core/src/codex_thread.rs`
  - WA04a metadata adapter
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - `external_goal_mutation_start_accounts_active_goal_progress`
  - `external_goal_set_active_resets_baseline_without_live_thread`

## Pass Goal

Replace:

```text
apply_external_goal_set(..., steering_role)
  -> goal_steering_item(ObjectiveUpdated, role)
  -> ResponseInputItem
  -> active-turn injection
```

with:

```text
WA01 durable mutation outcome
  -> GoalSetRuntimeEffect
apply_external_goal_set(GoalSetRuntimeEffect)
  -> metrics/accounting baseline updates
  -> metadata-only cadence recheck when pending intent exists
```

## Exact Files To Edit

- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs` only for callsite fallout
- `codex-rs/core/src/codex_thread.rs` only for WA04a adapter callsite fallout
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

## Required Edits

1. Replace the runtime signature:

   ```rust
   apply_external_goal_set(goal, previous_goal, steering_role)
   ```

   with an effect/outcome parameter such as `GoalSetRuntimeEffect`.
2. Build that outcome from the already-completed WA01 durable mutation path.
   Runtime must not write durable Goal facts, create pending intent, or infer
   pending kind from request bodies or prompt/helper text.
3. Include in that outcome:
   - current durable Goal facts
   - previous Goal facts/status needed for metrics
   - whether a pending Initial, ObjectiveUpdated, or BudgetLimit intent was
     created
   - goal id and facts version for the pending intent when present
   - accounting/event facts needed by runtime
4. Preserve `record_created`, `record_resumed_if_status_changed`, and
   `record_terminal_if_status_changed` behavior.
5. Preserve current-turn versus idle accounting baseline behavior for active
   Goals.
6. Preserve active accounting cleanup for stopped statuses.
7. Delete ObjectiveUpdated active injection from the runtime effect path.
8. Call the WA04a metadata adapter when the durable mutation outcome includes
   a deliverable pending cadence intent.
9. On `NoActiveTurn` or `ActiveTurnCannotAccept`, leave pending intent intact.
10. Remove `GoalContextRole` from this runtime call chain.

## Tests And Checks

Update extension tests:

- `external_goal_mutation_start_accounts_active_goal_progress`
  - preserve progress/event assertions
  - assert no concrete steering injection is attempted if the test harness
    observes thread manager calls
- `external_goal_set_active_resets_baseline_without_live_thread`
  - seed or call the WA01 mutation path that creates the structured
    effect/outcome
  - assert runtime accounting resets baseline
  - assert ObjectiveUpdated pending intent remains in state when delivery is
    unavailable
  - assert runtime did not create that pending intent independently

Add or update:

- `goal_extension_objective_update_outcome_requests_metadata_not_model_input`
- `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`

No extension helper-output assertion substitutes for a final payload test.

## Branch Continuation State

After this pass:

- extension runtime objective effects no longer take `GoalContextRole`
- extension runtime no longer injects ObjectiveUpdated model input
- durable ObjectiveUpdated intent remains pending until WA02 Created-event
  commit consumes it
- post-tool BudgetLimit may still use old injection until 04e
- `ext/goal/src/steering.rs` may still exist until 04g

## Non-Goals

- do not convert post-tool BudgetLimit
- do not remove all steering role config
- do not delete `steering.rs`
- do not implement app-server mutation ordering
- do not write evidence or advance Continuation watermarks
