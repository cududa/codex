# Rewind Tool Results and Rollback Performance Plan

Date: 2026-07-11

This is the broader/future implementation plan after the upstream look-ahead subagents reviewed `upstream/main` at `5c19155cbd93bfa099016e7487259f61669823ff`.

Companion doc: `local/codex-rewind-tool-results-handoff.md`: original research handoff. Keep as the historical route.

## Current Conclusions

- The visible full-tool-result replay is still not directly caused by core raw response item replay.
- `b57c2f2a` is still not the direct visible replay cause. It added hidden goal-context filtering/carry behavior, covered in the b57 doc.
- Upstream still has no ack-only rollback response, no rollback-specific render mode, no tool-result replay policy, and no replay generation fence.
- Upstream did add adjacent infrastructure:
  - `thread/rollback` is now explicitly deprecated but still returns a full `ThreadRollbackResponse { thread }`.
  - `thread/resume` supports `excludeTurns` and `initialTurnsPage`.
  - paged turns support `TurnItemsView::{NotLoaded, Summary, Full}`.
  - TUI rollback repair now uses resize-reflow style rebuilding rather than the old full `render_transcript_once` helper.
  - rollout loading no longer uses a plain `read_to_string`, but it still eagerly parses all records into a `Vec<RolloutItem>`.
  - upstream already changed reconstruction to return `history.into_raw_items()`.

## Upstream Facts To Anchor On

App-server/protocol:

- `thread/rollback` is deprecated: `upstream/main:codex-rs/app-server-protocol/src/protocol/v2/thread.rs:1045`.
- `ThreadRollbackParams` is still only `thread_id` and `num_turns`: `thread.rs:1046-1053`.
- `ThreadRollbackResponse` is still `{ thread: Thread }`: `thread.rs:1058-1065`.
- pending rollback state is still `Option<ConnectionRequestId>`: `upstream/main:codex-rs/app-server/src/thread_state.rs:77-80`.
- rollback response still rereads persisted history and populates turns: `upstream/main:codex-rs/app-server/src/bespoke_event_handling.rs:1063-1123`, `:1477-1495`.
- turn paging and item views exist for other routes: `upstream/main:codex-rs/app-server-protocol/src/protocol/v2/thread.rs:450-459`, `upstream/main:codex-rs/app-server/src/request_processors/thread_processor.rs:4024-4104`.

TUI:

- active backtrack still calls full rollback: `upstream/main:codex-rs/tui/src/app_backtrack.rs:188`, `:225`, `:230`; `upstream/main:codex-rs/tui/src/app/thread_routing.rs:701`, `:709`.
- rollback success trims local transcript and sets `backtrack_render_pending`: `upstream/main:codex-rs/tui/src/app_backtrack.rs:522`, `:556`, `:564`, `:573`.
- next draw calls `rebuild_transcript_after_backtrack`: `upstream/main:codex-rs/tui/src/app.rs:1290`; implementation is in `upstream/main:codex-rs/tui/src/app/resize_reflow.rs:426`.
- thread switch replay still uses `ReplayKind::ThreadSnapshot` and normal completed tool handlers: `upstream/main:codex-rs/tui/src/chatwidget/replay.rs:14`, `:31`, `:67`, `:132-146`.
- `ReplayKind` is still only `ResumeInitialMessages` and `ThreadSnapshot`: `upstream/main:codex-rs/tui/src/chatwidget.rs:796`.
- `HistoryRenderMode` is still only `Rich` and `Raw`: `upstream/main:codex-rs/tui/src/history_cell/mod.rs:145-148`.
- `AppEvent::InsertHistoryCell` has no thread id/generation guard, and insertion targets current `App.transcript_cells`: `upstream/main:codex-rs/tui/src/app_event.rs:665`, `upstream/main:codex-rs/tui/src/app/history_ui.rs:11-17`.

Core/rollout:

- upstream already uses `history.into_raw_items()` in reconstruction: `upstream/main:codex-rs/core/src/session/rollout_reconstruction.rs:431`.
- rollback still allocates `replay_items` just to append a virtual rollback marker: `upstream/main:codex-rs/core/src/session/handlers.rs:531-538`.
- `drop_last_n_user_turns` still clones and slices, but upstream `replace()` has additional world-state baseline side effects that a truncate rewrite must preserve.
- token recompute still clones history after replacement; upstream reconstruction also carries world-state and auto-compact window metadata.
- `load_rollout_items` streams lines now, but still eagerly parses every line into a full vector. Upstream added reverse JSONL scanning infrastructure, but it is not wired into core rollback reconstruction.

## Track A: Rollback API Shape

### Recommendation

Do not change the existing `ThreadRollbackResponse` into a tagged enum. Upstream marks `thread/rollback` deprecated, and v2 is effectively shipped. A tagged response would be a larger compatibility break than the earlier plan assumed.

Use upstream vocabulary instead:

1. Preferred durable route: add a replacement rollback/backtrack method that returns an ack/minimal response and is not tied to deprecated `thread/rollback`.
2. Acceptable short-term route for this fork: add `excludeTurns` and optionally `itemsView` to deprecated `ThreadRollbackParams`, mirroring `thread/resume`.

Short-term compatible shape:

```rust
pub struct ThreadRollbackParams {
    pub thread_id: String,
    pub num_turns: u32,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub exclude_turns: bool,
    #[ts(optional = nullable)]
    pub items_view: Option<TurnItemsView>,
}
```

Behavior:

- default remains full legacy response;
- `excludeTurns=true` waits for core rollback but does not read/rebuild full history;
- response still contains `ThreadRollbackResponse { thread }`, but `thread.turns` is empty/not-loaded;
- `itemsView=Summary` can be used only if a caller intentionally wants a small turn page/snapshot.

If extending a deprecated method feels wrong, add a new method instead and keep the same behavior contract:

- request: `thread_id`, `num_turns`, optional result detail;
- response: `thread_id`, `num_turns`, `status`, maybe updated metadata;
- no populated `turns` unless explicitly requested.

### Implementation Notes

- Replace `ThreadState.pending_rollbacks: Option<ConnectionRequestId>` with a small pending struct that records request id, `exclude_turns`, `items_view`, and `num_turns`.
- In the `ThreadRolledBack` handler, branch before `conversation.read_thread(... include_history: true)`.
- For exclude-turns/ack mode, avoid the full stored-history read and `populate_thread_turns_from_history`.
- Preserve the existing full response path for compatibility.

## Track B: TUI Active Backtrack Uses Minimal Rollback

### Goal

The active TUI should not request, clone, store, or later replay a full rollback snapshot when it already has local transcript state.

### Implementation Shape

- Update the TUI app-server client call for `AppCommand::ThreadRollback` to request the minimal rollback response (`excludeTurns=true` or the new replacement method).
- In `handle_thread_rollback_response`, handle both full and minimal responses.
- For minimal responses, locally truncate `ThreadEventStore.turns` by `num_turns`, clear buffered events, clear pending interactive replay state, and clear active turn id.
- Keep the active receiver drain initially; it prevents stale queued events from applying after rollback.

Suggested store helper:

```rust
fn apply_thread_rollback_minimal(&mut self, num_turns: u32) {
    let n = usize::try_from(num_turns).unwrap_or(usize::MAX);
    if n >= self.turns.len() {
        self.turns.clear();
    } else {
        self.turns.truncate(self.turns.len().saturating_sub(n));
    }
    self.buffer.clear();
    self.pending_interactive_replay = PendingInteractiveReplayState::default();
    self.active_turn_id = None;
}
```

This directly addresses the later replay vector where rollback currently stores returned full `thread.turns` into the per-thread event store.

## Track C: Rollback Repair Render Mode

### Upstream Change

The old `render_transcript_once` target is stale after upstream. Rollback repair now goes through:

- `rebuild_transcript_after_backtrack`
- `render_transcript_lines_for_reflow`
- `display_hyperlink_lines_for_mode(width, self.chat_widget.history_render_mode())`

That already improves performance with tail/row-capped rendering when configured. It still respects raw mode and still renders whatever each surviving tool cell renders.

### Implementation Shape

Add a rollback-specific render mode:

```rust
pub(crate) enum HistoryRenderMode {
    Rich,
    Raw,
    RollbackRepair,
}
```

Extend both rendering entry points:

- `display_lines_for_mode`
- `display_hyperlink_lines_for_mode`

Add a default trait method for rollback repair that delegates to rich rendering:

```rust
fn rollback_repair_hyperlink_lines(&self, width: u16) -> Vec<HyperlinkLine> {
    self.display_hyperlink_lines(width)
}
```

Override for high-volume cells:

- MCP tool call cells: show status/server/tool/duration; omit `result.content`, `structured_content`, `_meta`, and image-output decoding.
- exec/command cells: show command/status/duration/exit code; omit aggregated stdout/stderr/output body.

Then add a rollback-specific reflow call, for example:

```rust
render_transcript_lines_for_reflow_with_mode(width, HistoryRenderMode::RollbackRepair)
```

Use it only from `rebuild_transcript_after_backtrack`. Normal resize, resume, transcript overlay, and raw-output viewing should keep their existing behavior unless explicitly changed later.

Important policy: rollback repair should not use `Raw` even when raw output mode is enabled. Raw output remains useful for normal transcript viewing, but it is the wrong default for scrollback repair after rewind.

## Track D: Thread-Switch Replay And Reappearing Messages

### Likely Cause

The strongest upstream explanation for messages reappearing during rapid terminal/thread switching is stale app-level history/replay events:

- `AppEvent::InsertHistoryCell` carries no thread id or generation.
- `insert_history_cell` always inserts into the current app transcript.
- thread switching clears current UI state, but it does not fence already queued insert/replay-buffer events against a newer active thread.

### Implementation Shape

Add a thread activation generation fence.

Minimum viable shape:

- Add `thread_activation_generation: u64` to `App`.
- Increment it whenever the active thread changes or snapshot replay begins.
- Include `{ thread_id, generation }` on app-level history/replay events that can be queued across activation changes:
  - `AppEvent::InsertHistoryCell`
  - `BeginThreadSwitchHistoryReplayBuffer`
  - `EndInitialHistoryReplayBuffer` or a renamed thread-switch-specific end event
  - any delayed replay-buffer flush event
- Drop queued events whose thread id/generation does not match the current active thread.

If wiring generation into `ChatWidget` is too wide for the first pass, start with a thread-id guard on `InsertHistoryCell`. A generation token is still preferable because switching away and back to the same thread can otherwise accept stale events from an earlier activation.

Also consider renaming the flush event. Upstream starts thread-switch buffering with `BeginThreadSwitchHistoryReplayBuffer` but ends via `EndInitialHistoryReplayBuffer`; that shared name makes stale-event reasoning harder.

## Track E: Snapshot Replay Tool-Result Policy

This is separate from active rollback repair. It addresses later thread-switch/resume replay of completed tool items.

Extend replay purpose:

```rust
pub(crate) enum ReplayToolResultMode {
    Full,
    SummaryOnly,
}

pub(crate) enum ReplayKind {
    ResumeInitialMessages,
    ThreadSnapshot {
        tool_results: ReplayToolResultMode,
    },
}
```

Initial resume can stay `Full` unless product intent changes. Thread-switch snapshots, especially after rollback, should use `SummaryOnly` if full tool bodies are still observed.

Implementation notes:

- Do not change live tool handlers globally.
- Pass replay policy into completed command/MCP replay handling.
- For MCP summary replay, avoid creating a fake error by completing without result. Add an explicit summary-completed state or method.
- For command summary replay, avoid rendering `aggregated_output`; preserve status/exit code/duration so absence of output does not imply failure.

This track can be delayed until Track D and the minimal rollback response are in place, unless fast switching still reproduces full result replay.

## Track F: App-Server Visible History Detail

The old plan proposed a generic `ThreadHistoryProjection`. Upstream now has `TurnItemsView`, so use that vocabulary first.

Current upstream `Summary` is coarse: it is useful for turn lists, but it is not the same as "show tool rows but redact large result bodies." If clients need that middle ground, add a new item view rather than a disconnected projection abstraction.

Possible shape:

```rust
pub enum TurnItemsView {
    NotLoaded,
    Summary,
    ToolSummaries,
    Full,
}
```

`ToolSummaries` would preserve:

- user message rows as appropriate;
- tool id/server/tool name/arguments if already visible;
- status, duration, exit code, success/error;
- short error strings.

It would drop or cap:

- MCP `result.content`;
- MCP `structured_content`;
- MCP `_meta`;
- command `aggregated_output`.

Do not apply this to model-visible core history.

## Track G: Core Rollback Perf

### Already Done Upstream

Do not keep `ContextManager::into_raw_items()` as a future task after upstream integration. Upstream already returns `history.into_raw_items()` from reconstruction.

If implementing locally before upstream is merged, that small cleanup belongs in `local/codex-rewind-b57-local-issues.md`, not this broad plan.

### Still Valid

1. Avoid `replay_items` allocation.
   - Let reconstruction accept loaded history plus a pending virtual rollback marker/count.
   - Core rollback should pass the pending marker without allocating a new `Vec<RolloutItem>`.

2. Rewrite `drop_last_n_user_turns` as a cut-index/truncate operation.
   - Preserve upstream `replace()` side effects, especially `world_state_baseline` reset.
   - Keep contextual pre-turn trimming behavior.

3. Reuse reconstructed history for token recompute.
   - Avoid cloning state immediately after replacement.
   - Preserve upstream reconstruction metadata: world state and auto-compact window IDs.
   - Preserve `BodyAfterPrefix` behavior.

4. Wire reverse rollout scanning into reconstruction.
   - Do not write a reverse JSONL reader from scratch after upstream; upstream already added scanner infrastructure.
   - The remaining work is to feed reverse scan results into core reconstruction so rollback/resume does not eagerly parse every rollout record into a full vector.

## Instrumentation

Add timings/counters before or alongside behavior changes.

Core:

- flush live thread
- load persisted history
- reconstruction
- token estimate/recompute
- marker persist/final flush
- rollout items parsed
- reconstructed history items
- rollback suffix length

App-server:

- rollback response mode
- full stored-thread read time
- visible turn rebuild time
- response turn/item count
- approximate MCP result bytes returned

TUI:

- active event drain count/duration
- local transcript trim duration
- rollback repair rendered cell/line count
- thread-switch replay turn/item count
- queued app events dropped by generation fence

## Suggested Implementation Order

1. Add b57-local cleanup separately only if desired; do not mix it into the rollback UX patch.
2. Add minimal rollback response support using `excludeTurns` or a replacement rollback method.
3. Update TUI active backtrack to request minimal rollback and locally truncate `ThreadEventStore`.
4. Add rollback repair render mode on upstream `rebuild_transcript_after_backtrack` / `render_transcript_lines_for_reflow`.
5. Add thread activation generation fencing for queued history/replay events.
6. Add replay tool-result policy only if fast switching still shows full tool bodies after the fence/minimal rollback work.
7. Do core perf cleanups: virtual rollback marker, truncate-based rollback, token recompute reuse.
8. Consider `TurnItemsView::ToolSummaries` if non-TUI clients need middle-ground visible history detail.
9. Wire upstream reverse JSONL scanning into reconstruction if eager full-vector rollout loading remains a dominant cost.

## Targeted Verification If Implemented

No tests were run for this planning pass.

For implementation:

- after Rust edits, run `just fmt` in `codex-rs`;
- app-server protocol changes need schema regeneration and focused protocol/app-server tests;
- TUI-visible changes need focused snapshot coverage;
- prefer narrow test filters such as:
  - `just test -p codex-app-server-protocol thread_rollback`
  - `just test -p codex-tui <rollback_or_replay_filter>`
  - `cargo test -p codex-core rollout_reconstruction`

Avoid full crate/workspace test suites unless explicitly requested.

