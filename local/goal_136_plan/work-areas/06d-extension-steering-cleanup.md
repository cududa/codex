# WA06d Extension Steering Cleanup

This pass deletes or reduces `ext/goal` active steering construction after WA04
has converted extension producers to durable intent plus metadata wake/recheck.

## Direction Lock

- Request: remove extension-side active model-input construction and steering
  role plumbing.
- Authority: `ext/goal` may own lifecycle, tools, accounting, metrics,
  mutation entry points, durable state calls, and typed cadence requests; it
  must not construct active model input or choose role.
- Terrain: local `ext/goal` still has `steering.rs`, role config, runtime
  injection, and tests that vary `GoalContextRole`.
- Upstream terrain: v136 uses extension/runtime topology; later service shape is
  migration pressure only.
- Code-shape temptation: keep `steering.rs` as a private prompt wrapper or keep
  runtime injection as fallback.
- Locked direction: delete active steering construction and leave only WA04
  producer/accounting behavior.
- Exclusions: no new facade, no full later service adoption, no core shaper
  rewrite, no raw/projection work.

## Authority Docs Read

- `goal-authority-grounding-truth.md`
- `goal-authority-primary-cadence-contract.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-test-deletion-map.md`
- WA04 parent, WA04 map, WA04 pass docs
- `06a-final-precondition-and-reachability-audit.md`
- `06b-core-active-producer-and-carry-deletion.md`
- `06c-steering-role-config-removal.md`

## Code Terrain Read

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

## Pass Goal

Ensure no reachable extension path constructs active `ResponseItem` or
`ResponseInputItem`, chooses a Goal role, or calls old active-turn injection.

## Exact Files To Edit

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- core bridge files only for leftover imports/calls after 06b

## Required Edits

1. Delete `ext/goal/src/steering.rs` if no text-only helper remains.

2. If a helper is still needed, reduce it to pure prompt text helpers:
   - no `GoalContext`
   - no `GoalContextRole`
   - no `ResponseItem`
   - no `ResponseInputItem`
   - no role selection
   - no active-turn injection

3. Remove extension config role storage:
   - `GoalExtensionConfig.steering_role`
   - `goal_steering_role` closures
   - role refresh during config updates
   - tests that vary user/developer steering role

4. Remove runtime active injection:
   - `GoalRuntimeHandle::inject_active_turn_goal_steering(...)`
   - `GoalRuntimeHandle::inject_active_turn_steering(...)`
   - calls to `ThreadManager::inject_goal_steering_items_into_active_turn(...)`
   - old ObjectiveUpdated and BudgetLimit active steering branches

5. Preserve extension-owned product behavior from WA04:
   - `create_goal` durable facts plus pending Initial intent
   - terminal `update_goal` complete/blocked behavior and usage reporting
   - ObjectiveUpdated accounting and pending intent
   - BudgetLimit accounting and pending intent
   - producer-side BudgetLimit duplicate-reporting state only as accounting or
     notification de-duplication, never cadence-intent consumption
   - metadata-only wake/recheck

6. Clean build metadata:
   - remove `steering.rs` from module declarations if deleted
   - update Bazel/Cargo only if file/module references require it

7. Update extension tests:
   - keep lifecycle/accounting/state tests
   - remove assertions about extension-selected role or marker-wrapped active
     prompt output
   - use app-server/core final-payload tests for authority behavior

## Tests And Checks

Run focused extension tests that cover:

- `create_goal` creates durable active facts plus pending Initial intent
- terminal `update_goal` does not create active cadence intent
- ObjectiveUpdated and BudgetLimit effects preserve accounting/events
- old role config is ignored or absent

Audit:

```powershell
rg -n "GoalContext|GoalContextRole|ResponseItem|ResponseInputItem|goal_steering_item|inject_goal_steering" codex-rs/ext/goal
```

Remaining `ResponseItem`/`ResponseInputItem` hits must be unrelated protocol
types or deleted.

Also inspect accounting-specific hits:

```powershell
rg -n "GoalAccountingState|BudgetLimitedGoalDisposition|mark_budget_limit_reported_if_new|budget_limit_reported" codex-rs/ext/goal/src codex-rs/ext/goal/tests
```

Remaining accounting hits are valid only when they preserve product accounting,
metrics, events, or producer-side duplicate notification suppression. They must
not consume, clear, or suppress durable BudgetLimit pending intent.

## Branch Continuation State

After this pass:

- `ext/goal` cannot construct active model input
- extension runtime cannot call core active injection
- extension role config is gone or inert from 06c
- extension product behavior remains covered by state/runtime tests
- final payload behavior remains covered by WA04h/06g through request capture

## Non-Goals

- Do not move all extension mutations into a new v139/v140-style service.
- Do not delete extension product features.
- Do not make extension tests assert final request payload unless they route
  through the real app-server/core delivery path selected by WA04h.
- Do not remove legacy cleanup fixtures owned by WA05/06e.
