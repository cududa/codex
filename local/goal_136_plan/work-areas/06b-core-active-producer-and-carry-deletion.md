# WA06b Core Active Producer And Carry Deletion

This pass removes old core active Goal producer, concrete injection, runtime
Initial, and concrete carry terrain after WA01-WA05 replacement surfaces exist.

## Direction Lock

- Request: delete core active Goal production and carry leftovers.
- Authority: final request input is the active Goal authority seam; durable
  state and Created-event commit metadata are the replacement surfaces.
- Terrain: current local core still has `GoalSteeringMessage`, concrete Goal
  input injection, runtime Initial state, and current-turn concrete carry.
- Upstream terrain: v136 lacks this local shim terrain; later upstream service
  topology is not required for this deletion.
- Code-shape temptation: retain core injection as a fallback repair path or
  private carry channel.
- Locked direction: remove old concrete producer/carry APIs once WA02/WA03
  metadata and committed carry exist.
- Exclusions: no new cadence selection, state schema, extension ordering, raw
  behavior, classifier behavior, or service adoption.

## Authority Docs Read

- `goal-authority-grounding-truth.md`
- `goal-authority-primary-cadence-contract.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-durable-cadence-state.md`
- `goal-authority-idle-continuation-contract.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-test-deletion-map.md`
- WA02, WA03, WA04, WA05 parent/pass docs
- `06a-final-precondition-and-reachability-audit.md`
- `06-cleanup-and-acceptance.md`

## Code Terrain Read

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/state/mod.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- core tests that mention concrete Goal injection/carry

## Pass Goal

Delete old core active-path machinery so the only surviving Goal delivery path
is:

1. durable state records facts and pending intent
2. request-input shaper selects exactly one current Goal item
3. Created-event commit consumes exact pending intent, records committed carry,
   and advances Continuation watermark when appropriate
4. later same-turn attempts use committed carry metadata, not prebuilt input

## Exact Files To Edit

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/state/mod.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/tasks/regular.rs`
- tests under `codex-rs/core/src/` that still exercise concrete injection/carry

Touch compaction files only to remove obsolete callsites left after WA05:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`

## Required Edits

1. Remove old Goal active producer types and methods from `goals.rs`:
   - `GoalSteeringMessage`
   - `GoalContinuationCandidate.items`
   - runtime-only `initial_steering_goal_id`
   - `mark_initial_goal_steering_pending(...)`
   - `goal_steering_kind_for(...)`
   - `take_initial_goal_steering(...)`
   - any conversion to prebuilt model input
   - any use of configurable steering role

2. Remove old external mutation injection from `goals.rs`:
   - app-server/objective update paths must already use WA04 durable intent
     plus metadata wake/recheck
   - BudgetLimit paths must already use WA04 atomic durable intent
   - no fallback path may construct concrete Goal model input

3. Remove concrete carry types from `state/turn.rs`:
   - `GoalSteeringInjectionPhase`
   - `GoalSteeringCarryPurpose`
   - `GoalSteeringCarryItem`
   - `current_turn_goal_steering_items`
   - append/current/close helper methods

4. Remove session and input-queue injection APIs:
   - `InputQueue::extend_goal_pending_input_for_turn_state(...)`
   - `InputQueue::inject_goal_response_items(...)`
   - `InputQueue::current_turn_goal_steering_items(...)`
   - `InputQueue::close_goal_steering_injection_if_idle(...)`
   - `Session::inject_goal_response_items(...)`
   - `Session::current_turn_goal_steering_items(...)`
   - `Session::close_goal_steering_injection_if_no_pending_input(...)` if it
     has no non-Goal replacement responsibility

5. Remove public or crate exports for concrete carry:
   - `core/src/state/mod.rs`
   - `core/src/lib.rs`
   - `core/src/codex_thread.rs`
   - `CodexThread::inject_goal_steering_items_into_active_turn(...)`
   - `pub use state::GoalSteeringCarryPurpose`

6. Update task startup code:
   - remove calls that close old Goal injection windows
   - keep WA03 stale synthetic turn abort and pending-work recheck behavior

7. Update tests:
   - delete tests that assert old concrete injection/carry
   - replace only with tests owned by WA02/WA03/WA04 when final request payload
     or durable state behavior must still be covered

## Tests And Checks

Use focused tests from the owning replacement passes:

- WA02 final request-input shaper tests
- WA03 idle/retry/Continuation tests
- WA04 app-server/core final payload tests
- any core tests touched by removing injection APIs

Audit:

```powershell
rg -n "GoalContinuationCandidate|initial_steering_goal_id|mark_initial_goal_steering_pending|goal_steering_kind_for|take_initial_goal_steering|inject_goal_response_items|inject_goal_steering_items_into_active_turn|extend_goal_pending_input_for_turn_state|current_turn_goal_steering_items|GoalSteeringCarry|GoalSteeringInjectionPhase|append_current_turn_goal_steering_items|close_goal_steering_injection" `
  codex-rs/core/src codex-rs/ext/goal/src codex-rs/core/tests codex-rs/ext/goal/tests codex-rs/app-server/tests
```

Remaining hits must be deleted, valid test fixture names, or comments in local
planning docs outside the implementation scope.

Also run the parent work area's pre-shaper model-input construction audit:

```powershell
rg -n "ResponseInputItem|ResponseItem|into_response_input_item|Message \\{ role" `
  codex-rs/core/src/goals.rs `
  codex-rs/ext/goal/src `
  codex-rs/core/src/session/input_queue.rs `
  codex-rs/core/src/state/turn.rs
```

Expected result:

- no Goal prompt-body-to-model-input construction outside
  `core/src/goal_cadence/`
- `ResponseInputItem` matches in these files are unrelated to active Goal
  steering or removed

## Branch Continuation State

After this pass:

- no core producer constructs old concrete Goal model input
- no session/input queue/state API carries pre-shaper Goal input across turns
- compaction cannot pull concrete current-turn Goal carry
- extension/app-server paths have no core injection fallback
- committed carry metadata remains the only same-turn record of delivered Goal

## Non-Goals

- Do not delete legacy artifact classifiers or projection fixtures; WA05/06e
  own that consumer cleanup.
- Do not remove `GoalSteeringRole` config types here unless the code change is
  inseparable; 06c owns config cleanup.
- Do not redesign extension producer ordering; WA04 owns it.
- Do not add a later upstream service abstraction in this v136 cleanup pass.
