# Handoff: Rewind Tool Result Replay and Slow Rollback

Date: 2026-07-11

## Suggested Skills

- `task-alignment`: Use first. This work sits across core rollback, app-server snapshots, and TUI replay, so lock the direction before editing.
- `code-review`: Useful if the next step is another analysis pass before changes.
- `test-tui`: Use if implementing TUI rendering changes that need interactive/snapshot validation.
- `remote-tests`: Consider for broader Rust validation if the user asks for heavier verification.

## User Goal

The user reports that after recent local changes, rewinding/backtracking is unpleasant:

- The TUI appears to replay full tool-call results after rewind.
- Rewind is very slow.
- The user suspects commit `b57c2f2a2c450822516872a0f31f221975d4dce5` (`Implement hardened steering authority`) might be involved.
- They want both regression analysis and practical perf improvements. If some slowness is an existing design cost exposed by load, still surface it.

No code edits or tests were requested in the research pass. The next agent may be asked to implement one or more fixes.

## High-Level Conclusion From Prior Research

The evidence points away from core directly replaying raw `function_call_output` / `custom_tool_call_output` into the UI.

The likely visible issue is one or both of:

1. TUI rollback/backtrack scrollback repair re-renders surviving transcript cells after trimming, including tool cells that already contain result payloads.
2. App-server rollback returns a fully populated `ThreadRollbackResponse.thread.turns`; later thread snapshot replay replays completed `McpToolCall` items with result payloads and no rollback-specific suppression.

Commit `b57c2f2a2c450822516872a0f31f221975d4dce5` mostly adds hidden goal-context filtering in reconstruction. It can affect hidden context shape, but it does not look like the direct source of visible tool result replay.

## Fast Reading Route

Read these in order; they are the important paths.

1. Core rollback entry:
   - `codex-rs/core/src/session/handlers.rs:481`
   - Key lines: flush/load/reconstruct/recompute/persist/deliver around `:522`, `:534`, `:551`, `:556`, `:558`, `:560`, `:574`.

2. Core reconstruction:
   - `codex-rs/core/src/session/rollout_reconstruction.rs:44`
   - Key lines: goal-context filtering `:44-50`, reverse scan `:119-230`, forward materialization `:251-293`, final clone `:307-310`.
   - Also `codex-rs/core/src/session/mod.rs:1263` for `apply_rollout_reconstruction`.

3. App-server rollback request/response:
   - `codex-rs/app-server/src/request_processors/thread_processor.rs:1662`
   - `codex-rs/app-server/src/bespoke_event_handling.rs:1130`
   - `codex-rs/app-server/src/bespoke_event_handling.rs:1567`
   - These show request deferral until `ThreadRolledBack`, reading stored history with `include_history=true`, and returning populated `ThreadRollbackResponse`.

4. App-server/protocol snapshot building:
   - `codex-rs/app-server/src/request_processors.rs:534`
   - `codex-rs/app-server-protocol/src/protocol/thread_history.rs:78`
   - `codex-rs/app-server-protocol/src/protocol/thread_history.rs:536`
   - `codex-rs/rollout/src/policy.rs:147`
   - These show limited API history, `McpToolCallEnd` persistence, and `ThreadItem::McpToolCall` carrying result content.

5. TUI rollback path:
   - `codex-rs/tui/src/app_backtrack.rs:192`
   - `codex-rs/tui/src/app/thread_routing.rs:641`
   - `codex-rs/tui/src/app/thread_routing.rs:1348`
   - `codex-rs/tui/src/app/thread_events.rs:194`
   - `codex-rs/tui/src/app_backtrack.rs:492`
   - `codex-rs/tui/src/app_backtrack.rs:524`
   - `codex-rs/tui/src/app.rs:1237`
   - `codex-rs/tui/src/app_backtrack.rs:260`
   - These show request submission, storing the returned full turns, trimming local transcript, and then full scrollback re-render via `render_transcript_once`.

6. TUI replay/rendering:
   - `codex-rs/tui/src/chatwidget/replay.rs:66`
   - `codex-rs/tui/src/chatwidget/replay.rs:126`
   - `codex-rs/tui/src/chatwidget/replay.rs:136`
   - `codex-rs/tui/src/chatwidget/tool_lifecycle.rs:181`
   - `codex-rs/tui/src/history_cell/mcp.rs:63`
   - `codex-rs/tui/src/history_cell/mcp.rs:166`
   - These show completed command/MCP snapshot items going through normal completion rendering, without replay-purpose suppression.

## Detailed Findings

### Core Does Not Directly Replay Raw Tool Outputs On Rollback

`thread_rollback` in `codex-rs/core/src/session/handlers.rs`:

- Refuses zero turns and active turns.
- Creates a default turn context.
- Flushes the live thread.
- Loads stored history with `include_archived=false`.
- Appends a `ThreadRolledBack` marker to a new replay vector.
- Calls `apply_rollout_reconstruction`.
- Recomputes token usage.
- Persists the rollback marker and flushes.
- Delivers only `EventMsg::ThreadRolledBack`.

The raw response path is elsewhere: `record_conversation_items` / `send_raw_response_items` in `codex-rs/core/src/session/mod.rs:2543` and `:2670`. Rollback does not call it.

### `b57c2f2a` Is Probably Not The Direct Visible Replay Cause

The suspicious commit introduced goal-context filtering:

- `codex-rs/core/src/session/rollout_reconstruction.rs:44-50`
- `codex-rs/core/src/session/rollout_reconstruction.rs:253-256`
- `codex-rs/core/src/session/rollout_reconstruction.rs:245-247`
- `codex-rs/core/src/session/rollout_reconstruction.rs:263-267`
- Predicate is in `codex-rs/core/src/context/goal_context.rs:107-118`.

That only targets user/developer `<goal_context>` messages. It is relevant to hidden context and steering behavior, not visible MCP/tool output rendering.

### Rollback-Visible MCP Results Come From Snapshot `ThreadItem::McpToolCall`

App-server defers `thread/rollback` response until it sees core emit `ThreadRolledBack`.

Important path:

- `codex-rs/app-server/src/message_processor.rs:1072`
- `codex-rs/app-server/src/request_processors/thread_processor.rs:1662`
- `codex-rs/app-server/src/request_processors/thread_processor.rs:1696`
- `codex-rs/app-server/src/bespoke_event_handling.rs:1130`
- `codex-rs/app-server/src/bespoke_event_handling.rs:1152`
- `codex-rs/app-server/src/bespoke_event_handling.rs:1567`

On rollback completion, app-server reads stored thread history with `include_history=true`, rebuilds `thread.turns`, and sends `ThreadRollbackResponse`.

MCP result propagation:

- `McpToolCallEnd` is persisted in limited API history: `codex-rs/rollout/src/policy.rs:147`.
- The history builder emits `ThreadItem::McpToolCall` with `result.content`, `structured_content`, and `_meta`: `codex-rs/app-server-protocol/src/protocol/thread_history.rs:536-549`.
- The visible v2 result type is in `codex-rs/app-server-protocol/src/protocol/v2/mcp.rs:123`.

So if the user sees full MCP result material after rewind, it is very plausibly from visible thread snapshot data, not raw response items.

### Command Output Is Less Likely On The Normal Rollback Snapshot Path

The protocol can rebuild command output:

- `ExecCommandEnd` has `aggregated_output`: `codex-rs/protocol/src/protocol.rs:3047`.
- `build_command_execution_end_item` copies it into `ThreadItem::CommandExecution`: `codex-rs/app-server-protocol/src/protocol/item_builders.rs:108`.

But app-server rollback uses the limited API builder, and `ExecCommandEnd` is `Extended`, not `Limited`: `codex-rs/rollout/src/policy.rs:164`.

So command aggregated output should usually be filtered out of the normal rollback response. If command output appears, check whether the source is:

- Local existing `transcript_cells` being re-rendered after trim.
- Raw output mode.
- Another replay path using extended history.
- A non-standard event path for unified exec/terminal interactions.

There is a stale/overbroad comment: `ThreadRollbackResponse` says command executions are not persisted at `codex-rs/app-server-protocol/src/protocol/v2/thread.rs:926`, but protocol reducers/builders can reconstruct them when those events are present. The limited rollback path filters command output today, but the comment is still misleading.

### Raw Response Items Do Not Render In TUI

Raw response event facts:

- `rawResponseItem/completed` is marked internal-only: `codex-rs/app-server-protocol/src/protocol/common.rs:1494`.
- App-server emits it live for `EventMsg::RawResponseItem`, excluding goal-context messages: `codex-rs/app-server/src/bespoke_event_handling.rs:1032` and `:1406`.
- It is not persisted for rollout replay: `codex-rs/rollout/src/policy.rs:184`.
- `RolloutItem::ResponseItem` becomes a visible `HookPrompt` only for specific user messages; non-message response items like function outputs return early: `codex-rs/app-server-protocol/src/protocol/thread_history.rs:239`.
- TUI ignores `RawResponseItemCompleted`: `codex-rs/tui/src/chatwidget/protocol.rs:218`.

### Immediate Rewind UI Path

Immediate rewind/backtrack does not first replay the app-server snapshot into `ChatWidget`.

Flow:

1. `apply_backtrack_rollback` computes `num_turns`, stores `pending_rollback`, submits `AppCommand::ThreadRollback`: `codex-rs/tui/src/app_backtrack.rs:192` and `:220`.
2. Command handler calls `app_server.thread_rollback`: `codex-rs/tui/src/app/thread_routing.rs:641`.
3. `handle_thread_rollback_response` stores the returned full turns in `ThreadEventStore` and drains the active channel: `codex-rs/tui/src/app/thread_routing.rs:1348`.
4. `ThreadEventStore::apply_thread_rollback` sets `self.turns = response.thread.turns.clone()`, clears buffer, resets pending interactive replay: `codex-rs/tui/src/app/thread_events.rs:194`.
5. TUI then trims local transcript through `handle_backtrack_rollback_succeeded` / `finish_pending_backtrack`: `codex-rs/tui/src/app_backtrack.rs:492` and `:524`.
6. It sets `backtrack_render_pending`; next draw calls `render_transcript_once`: `codex-rs/tui/src/app.rs:1237`.
7. `render_transcript_once` loops all surviving `transcript_cells`, calls `display_lines_for_mode`, and inserts lines into terminal scrollback: `codex-rs/tui/src/app_backtrack.rs:260`.

This is the likely immediate “it replayed tool output” experience: it is a full scrollback repair of surviving cells. It is not a model/tool event replay, but it can feel identical.

Raw output mode matters:

- `render_transcript_once` uses `self.chat_widget.history_render_mode()`.
- Raw mode uses `HistoryRenderMode::Raw`.
- `ExecCell::raw_lines()` delegates to transcript lines, which include command output without the normal rich-mode summary limits.
- MCP `raw_lines()` can render formatted result text too.

Relevant files:

- `codex-rs/tui/src/chatwidget.rs:1530`
- `codex-rs/tui/src/history_cell/mod.rs:192`
- `codex-rs/tui/src/exec_cell/render.rs:204`
- `codex-rs/tui/src/exec_cell/render.rs:248`
- `codex-rs/tui/src/history_cell/mcp.rs:215`

### Later Snapshot Replay Path

Because rollback stores `response.thread.turns.clone()` in the thread event store, later thread activation/snapshot replay can render those turns:

- `codex-rs/tui/src/app/thread_events.rs:194`
- `codex-rs/tui/src/app/thread_routing.rs:82`
- `codex-rs/tui/src/app/session_lifecycle.rs:331`
- `codex-rs/tui/src/app/thread_routing.rs:1258`

`ChatWidget::replay_thread_turns` passes `ReplayKind::ThreadSnapshot`, but completed command/MCP items still go through normal handlers:

- `codex-rs/tui/src/chatwidget/replay.rs:66`
- `codex-rs/tui/src/chatwidget/replay.rs:126`
- `codex-rs/tui/src/chatwidget/replay.rs:136`

There is no replay-specific suppression for completed MCP result bodies.

## Slow Path Inventory

Core:

- Full JSONL read/parse: `codex-rs/rollout/src/recorder.rs:818`, `:830`, `:843-845`.
- Replay vector allocation just to append marker: `codex-rs/core/src/session/handlers.rs:551-555`.
- Reverse scan: `codex-rs/core/src/session/rollout_reconstruction.rs:119-230`.
- Forward suffix materialization: `codex-rs/core/src/session/rollout_reconstruction.rs:251-293`.
- `drop_last_n_user_turns` clones current history then surviving prefix: `codex-rs/core/src/context_manager/history.rs:247` and `:264`.
- Final reconstruction clone: `codex-rs/core/src/session/rollout_reconstruction.rs:308`.
- Token recompute clones/serializes: `codex-rs/core/src/session/mod.rs:3018`, `codex-rs/core/src/context_manager/history.rs:156`, `:556`.
- Extra prefix-token estimate can clone immediately after reconstruction: `codex-rs/core/src/session/mod.rs:1277-1284`.

App-server:

- Reads stored thread with full history after rollback.
- Rebuilds visible turns from rollout history.
- Copies MCP result payloads into `ThreadItem::McpToolCall`.

TUI:

- `ThreadEventStore::apply_thread_rollback` clones full returned turns.
- Active channel drain can loop through many queued events in `handle_thread_rollback_response`.
- Full scrollback repair walks every surviving transcript cell and formats/wraps it.
- Snapshot replay can rehydrate every turn/item.
- Some insertion paths call expensive display formatting more than once; prior report noted `add_boxed_history` calling `display_lines(u16::MAX)` before app renders at real width.

## Recommended Fix Directions

### Best First TUI Experiment

Replace backtrack’s `render_transcript_once` path with a rollback-specific scrollback repair:

- Use tail-capped resize reflow where available instead of walking full transcript.
- Consider rendering only the retained visible tail after rollback.
- Keep normal resume/thread-switch replay behavior unchanged.

Relevant starting point:

- `codex-rs/tui/src/app_backtrack.rs:260`
- `codex-rs/tui/src/app/resize_reflow.rs:456`

### Suppress Tool Bodies For Rollback Repair

Add a rollback/backtrack render mode or method on `HistoryCell` that renders tool summaries without result bodies.

Apply it only when repairing scrollback after rollback, not globally:

- Do not break transcript overlay.
- Do not break normal resume/thread-switch unless the user explicitly wants that too.
- Be especially careful with raw output mode: decide whether rollback repair should respect raw mode or force summary mode.

Potential API shape:

- Add enum variant such as `HistoryRenderMode::RollbackSummary`.
- Or add a dedicated method such as `display_lines_for_rollback_repair`.
- Implement summary behavior for `McpToolCallCell` and `ExecCell`; default to existing display for other cells.

### If Later Thread-Switch Replay Is Also Wrong

Introduce a distinct replay purpose instead of changing all `ReplayKind::ThreadSnapshot`.

Possible shape:

- `ReplayKind::RollbackSnapshot` or `ReplayPurpose::Rollback`.
- Pass it through `replay_thread_turns` / `handle_thread_item`.
- In completed MCP/command handlers, suppress result bodies only for rollback replay.

This avoids breaking ordinary thread switch/resume snapshots.

### App-Server/API Alternative

Return a lighter rollback response:

- Only an acknowledgement plus metadata.
- Or `ThreadRollbackResponse` with turns omitted / `itemsView` not loaded.
- Or an option such as `excludeTurns` / summary-only items.

This lets active TUI rely on local trim and avoids shipping large MCP result payloads.

Separately, consider truncating/redacting `McpToolCallResult` in visible app-server snapshots while keeping full core/model history intact.

### Core Perf Improvements

Behavior-preserving candidates:

- Avoid `replay_items` allocation by letting reconstruction accept loaded history plus pending rollback marker/count.
- Return `ContextManager::into_raw_items()` instead of `raw_items().to_vec()`.
- Replace `drop_last_n_user_turns` full clone/slice clone with a cut-index operation.
- Reuse reconstructed history for token recompute instead of cloning state immediately after replacement.
- Add lazy/reverse checkpoint loading for rollout history. The comments in `rollout_reconstruction.rs:101-105` already point toward that future shape.

## Instrumentation Suggestions

Before making large behavior changes, add timing/count instrumentation around:

- Core rollback flush.
- Full history load.
- Replay vector allocation.
- Reconstruction.
- Token recompute.
- Marker persist.
- Final flush.
- App-server stored-thread read.
- Visible turn rebuild.
- TUI active channel drain.
- TUI local trim.
- TUI scrollback repair render time and line count.

Counters worth logging:

- Rollout item count.
- Response item count.
- Compaction count.
- Rollback marker count.
- MCP result item count.
- Approx serialized bytes of MCP result payloads.
- Reconstruction reverse-scan items visited.
- Suffix length.
- Replacement history length.
- Goal-context items filtered.
- Legacy compaction path hits.
- Rebuilt history length.
- TUI surviving transcript cell count and rendered line count.

## Cautions For Implementation

- Do not modify code related to `CODEX_SANDBOX_NETWORK_DISABLED_ENV_VAR` or `CODEX_SANDBOX_ENV_VAR`.
- Follow Rust repo instructions from `AGENTS.md`: run `just fmt` after Rust changes, and only narrow targeted tests unless the user explicitly asks broader validation.
- TUI-visible UI changes need snapshot coverage if implemented.
- Keep this out of `codex-core` where possible unless the change truly belongs there.
- Avoid changing global thread snapshot replay semantics unless explicitly intended; ordinary resume/thread-switch behavior may depend on current replay fidelity.
- The user is likely to value preserving the model-visible history while changing only user-visible replay/rendering.

## Current State

No files were changed during the analysis pass except this handoff document in the OS temp directory. No tests, builds, or formatters were run.
