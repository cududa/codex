# WA04g Steering Module And Injection API Cleanup

This implementation pass deletes or reduces old extension steering
construction and makes old core concrete injection APIs unreachable from WA04
producer paths.

This is the WA04 cleanup after app-server, extension create, ObjectiveUpdated,
BudgetLimit, and role-config conversion exist.

## Direction Lock

Request:

- delete or reduce `ext/goal/src/steering.rs`
- remove WA04 producer reachability into old core concrete Goal injection APIs
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `ext/goal/src/steering.rs` imports `GoalContext`, `GoalContextRole`, and
  `ResponseInputItem`
- `goal_steering_item(...)` returns concrete active model input
- extension runtime and extension lifecycle injection paths should already be
  converted by 04d/04e
- app-server/core external mutation injection should already be converted by
  04b, including the `core/src/goals.rs` external set route
- old core injection APIs may still exist for unconverted core or later WA05/WA06
  cleanup terrain, but WA04 producers must not reach them

Code-shape temptation:

- keep `steering.rs` as a "compatibility" active item constructor
- leave dead imports and tests because final WA06 will clean everything
- delete core injection APIs before confirming no non-WA04 path still needs
  temporary compatibility on the branch
- forget that `core/src/goals.rs` is itself a WA04 reachability path for
  app-server external mutation, not only old core cleanup terrain

Locked direction:

- extension code must not return active `ResponseItem` or `ResponseInputItem`
- keep only text-only prompt helpers if the WA02 prompt owner still needs them
- remove extension/app-server reachability into concrete Goal injection APIs
- delete old core injection APIs now only if no remaining converted branch
  terrain needs them
- verify `core/src/goals.rs` no longer routes WA04 app-server/external
  mutation effects through `GoalSteeringMessage` or concrete injection

Exclusions:

- no prompt-body ownership move that conflicts with WA02
- no broad WA05 classifier/projection cleanup
- no final deletion of legacy artifact handling
- no app-server product behavior changes

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/src/steering.rs`
  - `GoalSteeringFrame`
  - `goal_steering_item(...)`
  - prompt body helpers and tests
- `codex-rs/ext/goal/src/runtime.rs`
  - any remaining steering imports or injection calls
- `codex-rs/ext/goal/src/extension.rs`
  - any remaining BudgetLimit steering imports or TODOs
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/core/src/goals.rs`
  - `GoalRuntimeEvent::ExternalSet`
  - `apply_external_thread_goal_status(...)`
  - `GoalSteeringMessage`
  - app-server/external mutation calls to `inject_goal_response_items(...)`
- `codex-rs/core/src/codex_thread.rs`
  - `inject_goal_steering_items_into_active_turn(...)`
- `codex-rs/core/src/session/mod.rs`
  - `inject_goal_response_items(...)`
- `codex-rs/core/src/session/input_queue.rs`
  - `inject_goal_response_items(...)`
  - `extend_goal_pending_input_for_turn_state(...)`
- `codex-rs/core/src/state/turn.rs`
  - `GoalSteeringCarryPurpose`
  - `GoalSteeringCarryItem`

## Pass Goal

Remove the extension active steering construction path:

```text
ext/goal steering prompt
  -> GoalContext
  -> ResponseInputItem
  -> core active-turn injection
```

and leave only:

```text
extension mutation/accounting
  -> durable pending intent
  -> metadata-only recheck
  -> WA02 request-input shaping
```

## Exact Files To Edit

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

## Required Edits

1. Delete `GoalSteeringFrame`.
2. Delete active `goal_steering_item(...)`.
3. Delete imports of:
   - `codex_core::context::GoalContext`
   - `codex_core::context::GoalContextRole`
   - `codex_protocol::models::ResponseInputItem`
4. Move any still-useful prompt body text helpers to the WA02-selected prompt
   owner, such as `core/src/goal_cadence/prompt.rs`, or delete them if the
   shared owner already has equivalent prompts.
5. Move prompt escaping tests to the prompt owner if helpers move.
6. Remove extension module exports and build metadata for deleted modules.
7. Audit `codex-rs/core/src/goals.rs` after 04b:
   - `GoalRuntimeEvent::ExternalSet` and
     `apply_external_thread_goal_status(...)` must not construct
     `GoalSteeringMessage` for WA04 app-server/external mutation paths.
   - app-server/core external mutation effects must request metadata-only
     cadence delivery or no cadence work, according to the WA01 outcome.
   - if this old path is still reachable for WA04 producers, stop and finish
     the 04b conversion before deleting extension steering.
8. Remove extension/app-server reachability into:
   - `CodexThread::inject_goal_steering_items_into_active_turn(...)`
   - `Session::inject_goal_response_items(...)`
   - `InputQueue::inject_goal_response_items(...)`
   - concrete Goal carry in `TurnState`
9. If no non-WA04 producer remains after WA02/WA03 conversion, delete the old
   core concrete injection APIs. If a later cleanup pass still owns a remaining
   path, leave the APIs temporarily but make WA04 producers unable to call
   them.
10. Update TODOs and comments in touched files that still describe configured
   steering role, role-neutral `<goal_context>`, or host-applied active item
   construction as the future design.

## Tests And Checks

Focused checks:

- `rg -n "GoalContext|GoalContextRole|ResponseInputItem|goal_steering_item" codex-rs/ext/goal`
- `rg -n "inject_active_turn_goal_steering" codex-rs/ext/goal`
  should have no active steering hits after implementation, except comments
  that explicitly name rejected terrain
- `rg -n "GoalRuntimeEvent::ExternalSet|apply_external_thread_goal_status|GoalSteeringMessage|inject_goal_response_items" codex-rs/core/src/goals.rs`
  should show no WA04 app-server/external mutation route that constructs or
  injects concrete active Goal model input; remaining hits must be explicitly
  owned by later core cleanup, WA05, or WA06 terrain
- extension tests still pass for create/update/accounting behavior after
  module cleanup
- core/app-server tests from 04h prove final payload delivery for converted
  producers

If Rust dependencies or build metadata change, follow root `AGENTS.md`
validation and Bazel lock rules.

## Branch Continuation State

After this pass:

- extension has no active model-input construction path
- extension/app-server producer paths cannot reach concrete core Goal
  injection APIs
- app-server/core external mutation no longer reaches
  `core/src/goals.rs` active `GoalSteeringMessage` construction
- old core injection APIs are deleted or isolated as later cleanup terrain
- final WA04 payload and product tests still need consolidation in 04h
- broad classifier/projection cleanup still belongs to WA05

## Non-Goals

- do not remove generic internal-context helpers
- do not remove legacy `<goal_context>` artifact handling
- do not change raw response notification behavior
- do not parse rendered Goal text for facts
- do not add `ext/goal/src/api.rs`
