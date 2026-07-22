# Work Area 02e: Core Producer Conversion And Carry Cleanup

This ordered pass converts core Initial, ObjectiveUpdated, and BudgetLimit
producers to durable pending intent and removes concrete current-turn Goal carry
as an authority path for converted producers. It builds on the committed
metadata carry introduced by 02d. It does not convert `ext/goal` or automatic
Continuation.

## Direction Lock

Request:

- convert core pending producers away from concrete Goal item injection
- switch reachable core paths away from concrete current-turn carry authority
- keep `goals.rs` as adapter/helper terrain, not the request-input authority

Authority:

- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02d-created-event-commit-and-evidence.md`

Terrain:

- local `TurnState.current_turn_goal_steering_items` carries concrete
  `ResponseInputItem`s.
- `InputQueue::inject_goal_response_items(...)` and
  `extend_goal_pending_input_for_turn_state(...)` append concrete Goal items.
- `Session::current_turn_goal_steering_items()` exposes concrete carry.
- `core/src/goals.rs` currently creates Initial, ObjectiveUpdated, and
  BudgetLimit concrete steering items.
- `GoalSteeringMessage::into_response_input_item(...)` wraps prompt text with
  `GoalContext`.

Code-shape temptation:

- preserve concrete carry because compaction still reads it
- create a parallel core `GoalService`
- leave converted core producers also injecting concrete Goal items
- fabricate Initial intent during thread resume hydration

Locked direction:

- core Initial, ObjectiveUpdated, and BudgetLimit producers write durable
  pending intent through Work Area 01 cadence-aware APIs
- no core converted path injects concrete `GoalContext` or `ResponseInputItem`
  as active steering
- concrete current-turn carry may remain only where later Work Areas still own
  reachable cleanup; it is not authority for converted core producers

Exclusions:

- no automatic Continuation selection or reservation
- no `ext/goal` conversion
- no full deletion of old concrete carry consumers
- no broad compaction/projection cleanup
- no final `GoalContext` terrain deletion

## Code Terrain Read

Directly read:

- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/context/goal_context.rs`
- Work Area 01 cadence-aware state APIs

Observed facts:

- current mid-turn compaction reads concrete current-turn Goal items from
  `TurnState`.
- the replacement carry must be committed metadata, not a pre-request-shaping
  model-input item.
- compaction consumers may not be fully removed in Work Area 02; Work Areas 05
  and 06 own broader cleanup.

## Pass Goal

Convert reachable core Initial, ObjectiveUpdated, and BudgetLimit producers to
durable intent and remove concrete Goal item carry/injection from those
converted paths.

## Exact Files To Edit

- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/codex_thread.rs` only for direct concrete-injection
  fallout

## Required Edits

Producer conversion:

- newly active Goal creation or explicit paused-to-active mutation writes
  pending Initial intent in durable state
- thread resume hydration does not fabricate Initial
- objective update writes pending ObjectiveUpdated intent in durable state
- budget-limit accounting writes pending BudgetLimit intent in durable state
- same-turn recheck or wake unavailability must not drop intent
- `GoalSteeringMessage::into_response_input_item(...)` must not be used for
  converted core Initial, ObjectiveUpdated, or BudgetLimit paths

Carry cleanup for converted paths:

- remove or bypass `Session::inject_goal_response_items(...)` and
  `InputQueue::inject_goal_response_items(...)` for converted core producer
  flows
- remove or bypass `InputQueue::extend_goal_pending_input_for_turn_state(...)`
  for converted core Initial, ObjectiveUpdated, and BudgetLimit flows
- keep 02d committed carry as the only current-turn carry authority for
  Created-event Goal delivery

Keep prompt body helpers in `goals.rs` if useful:

- Initial prompt body
- ObjectiveUpdated prompt body
- BudgetLimit prompt body

But final `ResponseItem` construction belongs to `goal_cadence/`.

Allowed to remain for later Work Areas:

- automatic Continuation selection and reservation until Work Area 03
- `ext/goal` pre-request-shaping producer path until Work Area 04
- legacy artifact classifiers until Work Area 05
- old concrete carry consumers until Work Area 05/06 when no reachable producer
  depends on them

## Tests And Checks

Add or update focused tests for:

- core Initial creation writes durable pending Initial intent and does not
  inject a concrete Goal item
- objective update writes durable pending ObjectiveUpdated intent and does not
  inject a concrete Goal item
- budget-limit accounting writes durable pending BudgetLimit intent and does
  not inject a concrete Goal item
- same-turn wake unavailability does not drop durable intent

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

These checks are the local confidence bar for the 02e slice.

## Branch Continuation State

After this pass, Work Area 02 core Initial, ObjectiveUpdated, and BudgetLimit
paths should use durable pending intent plus final request-input shaping, and
converted core paths should not use concrete current-turn Goal item carry as
authority. Automatic Continuation remains old or inactive until Work Area 03,
`ext/goal` remains for Work Area 04, and broad projection/compaction cleanup
remains for Work Area 05/06.

The next pass, 02f, proves the integrated final `/responses` payload and retry
behavior.

## Non-Goals

This pass does not:

- implement automatic Continuation
- convert `ext/goal`
- delete every `GoalContext` helper or legacy predicate
- complete compaction or rollout reconstruction rewrite
- change app-server APIs, `/goal`, status/footer projection, pause/edit/clear,
  budget, or usage product surfaces
