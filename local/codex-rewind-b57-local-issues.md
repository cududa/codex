# b57 Local Issues: Rewind Tool Result Replay

Date: 2026-07-11

Scope: local commit `b57c2f2a2c450822516872a0f31f221975d4dce5` (`Implement hardened steering authority`) only.

This is not the upstream look-ahead. The upstream comparison is delegated to subagents. Keep `local/codex-rewind-tool-results-handoff.md` as the research record and `local/codex-rewind-implementation-plan.md` as the broader future plan until the subagent reports are integrated.

## Bottom Line

The evidence still does not point to `b57c2f2a` as the direct cause of visible full tool-result replay in the TUI.

`b57c2f2a` does not change:

- TUI backtrack rendering.
- TUI thread-switch replay.
- `ThreadRollbackResponse` shape.
- App-server rollback response construction.
- MCP result rendering.
- command output rendering.

The visible replay symptom is still more likely from pre-existing rollback/snapshot paths:

- rollback stores a full app-server `thread.turns` snapshot in `ThreadEventStore`;
- later thread snapshot replay renders completed tool items normally;
- immediate rollback scrollback repair re-renders surviving transcript cells, including tool cells.

What `b57c2f2a` did introduce in this area is hidden goal-context filtering and active-turn goal steering carry behavior. That work can be tightened, but it should be treated as a narrow local cleanup rather than the main replay fix.

## Commit Surface Relevant To This Issue

Important touched files:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - Adds `filter_goal_context_response_items`.
  - Skips goal-context response items while rebuilding history.
  - Filters compaction replacement histories before installing them into reconstructed history.

- `codex-rs/app-server/src/bespoke_event_handling.rs`
  - Suppresses raw response item notifications for goal-context messages.
  - Makes local goal-context text detection case-insensitive.

- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
  - Adds test coverage that goal-context response items do not become visible thread-history items.

- `codex-rs/core/src/context/goal_context.rs`
  - Defines `is_goal_context_response_item`.
  - Recognizes only `user` or `developer` messages whose content is exactly one `InputText` goal-context fragment.

- `codex-rs/core/src/compact.rs` and `codex-rs/core/src/compact_remote.rs`
  - Carry current-turn goal steering items through mid-turn compaction initial-context injection.
  - Filter goal-context items when collecting user messages / keeping compacted history.

- `codex-rs/core/src/session/input_queue.rs`, `codex-rs/core/src/state/turn.rs`, `codex-rs/core/src/tasks/regular.rs`
  - Add goal-steering injection phase and current-turn carry items.
  - Close goal-steering injection once there is no pending input after a sampling pass.

## Narrow Issues Introduced Or Left By `b57c2f2a`

### 1. Goal-Context Predicates Are Split Across Core And App-Server

Core uses `codex-rs/core/src/context/goal_context.rs:is_goal_context_response_item`.

App-server has a separate local predicate in `codex-rs/app-server/src/bespoke_event_handling.rs` for raw response item suppression.

They are intended to match the same hidden payload shape:

- role is `user` or `developer`;
- content is one `InputText`;
- text starts with `<goal_context>` and ends with `</goal_context>`, case-insensitively after trimming.

This is not causing tool-result replay, but it is a drift risk. If the hidden goal-context wire shape changes, one path can hide it while another leaks it.

Fix-now option:

- Extract a shared predicate into a crate both app-server and core can use, likely near protocol/history projection rather than deeper `codex-core`.
- If that dependency shape is not acceptable, add mirrored tests documenting the same cases in both places.

### 2. Reconstruction Filtering Adds More Hidden-Context Work To The Hot Rollback Path

`b57c2f2a` made rollback/resume reconstruction inspect response items for hidden goal context:

- replacement history filtering;
- suffix response-item filtering;
- compaction replacement-history filtering.

This is not the main rollback slowness. The hot path was already expensive because it reads/parses rollout history, rebuilds history, clones history, recomputes token usage, and app-server later rebuilds visible turns. Still, the commit did add another predicate pass over response items in a path the user is feeling.

Fix-now option:

- Keep the behavior, but remove the existing final clone in the same file by returning `history.into_raw_items()` instead of `history.raw_items().to_vec()`.
- That small cleanup is not specific to goal-context filtering, but it is a reasonable local cleanup because this commit touched reconstruction and left an avoidable full-history clone in the hot rollback path.

Do not overstate this as the replay fix. It is just a cheap rollback perf cleanup.

### 3. Mid-Turn Compaction Goal Steering Needs A Stronger Contract Test

`b57c2f2a` carries current-turn goal steering items into mid-turn compaction replacement history so the active turn keeps seeing steering after compaction.

That is reasonable, but the contract is subtle:

- live post-compaction history may include hidden goal steering context;
- reconstruction/resume filters that hidden context back out;
- future turns should receive fresh canonical context instead of accidentally preserving stale active-turn steering as durable user/developer history.

Fix-now option:

- Add a focused core reconstruction/compaction test for a mid-turn compaction replacement history that includes a goal-context item.
- Assert reconstruction removes the goal-context item but preserves normal user messages and compaction summary behavior.

This does not need to block the broader rewind fix, but it would make the local steering contract safer before more upstream integration.

### 4. Current-Turn Goal Steering Carry Is Purpose-Deduped But Assumes One Item Per Purpose

`TurnState::append_current_turn_goal_steering_items` stores one carried item per `GoalSteeringCarryPurpose`. If a caller ever passes multiple response input items for the same purpose, the loop repeatedly replaces the same stored entry and only the last item survives.

Today that appears compatible with the goal extension, which emits one goal-context item per steering purpose. The code shape is still easy to misuse later.

Fix-now option:

- Either document/test the one-item-per-purpose invariant, or store `Vec<ResponseInputItem>` per purpose.
- This is not connected to tool-result replay; it is a local robustness cleanup.

## What Is Not A `b57c2f2a` Regression

These should stay in the broader future plan unless subagents find new evidence:

- Full MCP result bodies appearing after rollback.
- Snapshot replay of completed MCP/command items.
- App-server rollback returning `ThreadRollbackResponse { thread }` with populated turns.
- TUI storing full rollback turns into `ThreadEventStore`.
- TUI raw-mode scrollback repair rendering verbose tool cells.
- Full rollout JSONL load/parse.
- `drop_last_n_user_turns` cloning history.
- token recompute cloning history after replacement.

Those may still be real issues. They just were not introduced by `b57c2f2a`.

## Recommended Narrow Fix-Now Scope

If we want a small patch before broad upstream integration, keep it to this:

1. In `codex-rs/core/src/session/rollout_reconstruction.rs`, return `history.into_raw_items()` instead of `history.raw_items().to_vec()`.
2. Add a focused test that goal-context items inside compaction replacement history are filtered during reconstruction.
3. Add or mirror a test ensuring app-server raw-response suppression and core reconstruction use equivalent goal-context marker semantics.
4. Optionally document or test the one-item-per-purpose assumption for goal steering carry.

Avoid implementing app-server rollback API changes or TUI replay policy from this narrow doc. Those belong in the broader plan after the upstream subagent findings are back.

## Verification If Implemented

No tests were run for this doc.

For a narrow Rust patch:

- Run `just fmt` in `codex-rs`.
- Prefer a targeted core test filter around `rollout_reconstruction` / goal-context reconstruction.
- If app-server predicate tests change, run a focused app-server or app-server-protocol test filter rather than a full crate suite.

