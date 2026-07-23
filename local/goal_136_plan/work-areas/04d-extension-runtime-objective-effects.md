# WA04d Extension Runtime Objective Effects

This implementation pass converts extension runtime external objective effects
from role-bearing active injection to structured runtime effects plus
metadata-only cadence requests.

It is for `ext/goal` runtime paths. App-server production mutation ordering is
handled by 04b, although both paths should share the same WA01 outcome and
WA04a metadata concepts.

The runtime effect is after-the-fact accounting/event/cadence-request handling.
It is not the durable mutation owner and is not a prompt renderer.

## Direction Lock

Request:

- convert `GoalRuntimeHandle::apply_external_goal_set(...)`
- remove `GoalContextRole` from the runtime objective-effect path
- preserve metrics and accounting behavior
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
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
- failed or unavailable same-turn delivery leaves durable pending intent intact
  for ordinary turn or WA03 idle Stage 2

Exclusions:

- no active model input construction
- no role selection
- no state mutation outside the selected ordering path
- no pending-intent consumption
- no Continuation watermark advancement
- no recorded request evidence writing

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
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

The runtime must preserve the external-set effect order without becoming the
source of durable cadence facts:

```text
new active Goal:
  prepare/account usage
  durable mutation path persists facts plus pending Initial intent
  runtime marks current or idle accounting state active
  runtime requests cadence delivery/recheck from the pending-intent summary

same active Goal objective edit:
  prepare/account usage
  durable mutation path persists updated objective plus pending ObjectiveUpdated
  runtime refreshes current or idle accounting baseline
  runtime requests cadence delivery/recheck from the pending-intent summary

status changes away from Active:
  prepare/account usage
  durable mutation path persists status and clears/supersedes stale active intent
  runtime clears active-goal accounting when required
  runtime does not create active Goal steering
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
   - `goal_id`
   - current durable Goal facts
   - current durable status
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
   a deliverable pending cadence intent. The request carries metadata only,
   such as `goal_id`, pending kind, and facts version, or the exact WA02/WA03
   equivalent.
9. On `NoActiveTurn` or `ActiveTurnCannotAccept`, leave pending intent intact.
10. Remove `GoalContextRole` from this runtime call chain.
11. Delete the ObjectiveUpdated injection path:

    ```text
    goal_steering_item(...)
      -> GoalContext
      -> ResponseInputItem
      -> ThreadManager::inject_goal_steering_items_into_active_turn(...)
    ```

12. Do not consume pending intent, advance Continuation watermarks, or write
    recorded request evidence from runtime effects. Created-event commit owns
    exact pending-intent consumption and any structured evidence append.

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
  - assert the WA01 objective-update outcome carries pending intent when the
    objective changes
  - assert ObjectiveUpdated pending intent remains in state when delivery is
    unavailable
  - assert runtime did not create that pending intent independently

Add or update:

- `goal_extension_objective_update_outcome_requests_metadata_not_model_input`
- `goal_extension_external_mutation_failed_same_turn_delivery_leaves_intent`

No extension helper-output assertion substitutes for a final payload test.
Extension tests may inspect durable state, pending intent snapshots,
metrics/events, and metadata request outcomes. They must not use helper output,
raw notifications, ordinary rollout items, rollout trace payloads, classifier
matches, rendered Goal text, or recorded evidence alone as active authority.

## Branch Continuation State

After this pass:

- extension runtime objective effects no longer take `GoalContextRole`
- extension runtime no longer injects ObjectiveUpdated model input
- extension runtime uses WA01 mutation outcomes as the only pending-intent
  source and does not infer cadence from request bodies or helper prompt text
- durable ObjectiveUpdated intent remains pending until WA02 Created-event
  commit consumes it
- failed same-turn cadence requests leave pending intent available for ordinary
  turns or WA03 idle Stage 2
- post-tool BudgetLimit may still use old injection until 04e
- `ext/goal/src/steering.rs` may still exist until 04g

## Non-Goals

- do not convert post-tool BudgetLimit
- do not remove all steering role config
- do not delete `steering.rs`
- do not implement app-server mutation ordering
- do not write evidence or advance Continuation watermarks
