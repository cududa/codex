# Work Area 03d: Idle Stage Order Refactor

This ordered pass changes `MaybeContinueIfIdle` into the contracted idle
lifecycle order. It prepares the scheduler for pending durable cadence
delivery and automatic Continuation without making `goals.rs` the request-input
owner.

## Direction Lock

Request:

- refactor the idle hook stage order from the WA03 appendage map
- make pending non-Goal work visibly outrank Goal-owned synthetic turns
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`

Route context:

- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/03c-goal-turn-request-metadata.md`

Terrain:

- `maybe_continue_goal_if_idle_runtime()` currently starts pending work and
  then calls Goal continuation without knowing whether pending work started
- `maybe_start_turn_for_pending_work*` currently returns `()`
- `continuation_lock` already exists and should remain the Goal-owned
  scheduling lock
- current Goal-owned scheduling still injects concrete Goal input and must not
  be preserved as WA03's new path

Code-shape temptation:

- keep old `maybe_start_goal_continuation_turn()` as the Stage 3 fallback
- treat pending Initial delivery as automatic Continuation because the idle
  hook launched it
- add no-op architecture to simulate independent pass acceptance

Locked direction:

- make Stage 1 pending work return whether it started
- structure the idle hook as pending work first, pending durable cadence
  second, automatic Continuation last
- keep Stage 2 and Stage 3 calls metadata-only and allowed to decline until
  later passes implement them

Exclusions:

- no model input construction in the idle hook
- no pending intent consumption
- no watermark mutation
- no request-input shaping logic in `goals.rs`
- no final deletion of old helpers

## Code Terrain Read

Directly read:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Observed facts:

- pending work sources are queued next-turn response items and trigger-turn
  mailbox items.
- `maybe_start_turn_for_pending_work_with_sub_id(...)` already owns the
  regular turn start path for those sources.
- the generic `start_task(...)` path drains queued next-turn items and mailbox
  items into the active turn, so later Goal-owned synthetic launch paths cannot
  rely on a non-atomic pre-launch recheck alone.
- idle Goal scheduling needs rechecks before and after taking
  `continuation_lock`.

## Pass Goal

Change idle control flow to the contracted order:

```text
MaybeContinueIfIdle
  -> if active turn exists, return
  -> start pending non-Goal work if present, return
  -> acquire Goal idle scheduling lock
  -> re-check active turn and pending non-Goal work
  -> try pending durable cadence delivery, return if started
  -> re-check active turn and pending non-Goal work
  -> try automatic Continuation, return
```

## Exact Files To Edit

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`

## Required Edits

Change pending-work helpers to return whether they started a turn:

```rust
pub(crate) async fn maybe_start_turn_for_pending_work(self: &Arc<Self>) -> bool;

pub(crate) async fn maybe_start_turn_for_pending_work_with_sub_id(
    self: &Arc<Self>,
    sub_id: String,
) -> bool;
```

Update existing callers that do not need the result to ignore it explicitly.

Replace `maybe_continue_goal_if_idle_runtime()` with a staged helper such as
`run_idle_goal_lifecycle_if_idle`. The public enum/event name may remain
`MaybeContinueIfIdle`.

Inside the Goal lock, re-check:

- active turn is still absent
- queued next-turn input is still absent
- trigger-turn mailbox input is still absent

Stage 2 and Stage 3 helper calls may decline until later passes complete. They
must not call old concrete Goal input injection as the new WA03 path.

This pass sets up ordering only. Later Goal-owned Stage 2 and Stage 3 launch
paths must either make the pending-work recheck and task start effectively
atomic for queued/mailbox work, or use a Goal-owned task-start path that
refuses or requeues newly arrived pending work before model submission. A
boolean Stage 1 helper result is not by itself enough to protect a later
synthetic launch from draining late pending work.

If the implementation keeps old helpers temporarily for unconverted paths,
mark them as old-path terrain and keep them out of the new staged idle
lifecycle.

## Tests And Checks

Add or update focused tests:

- `goal_idle_starts_queued_next_turn_work_before_goal_owned_turn`
- `goal_idle_starts_trigger_turn_mailbox_before_goal_owned_turn`
- a unit or integration check that pending-work helper callers handle the new
  boolean result

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_idle_starts_queued
cargo test -p codex-core --lib goal_idle_starts_trigger
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, the idle hook is structured around the correct stage order.
Stage 2 pending cadence delivery and Stage 3 automatic Continuation may still
decline until later passes implement their metadata reservation paths.

This pass deliberately does not promise a complete runnable Goal rewrite.

## Non-Goals

This pass does not:

- deliver pending Initial / ObjectiveUpdated / BudgetLimit
- launch automatic Continuation
- consume pending intent
- advance a watermark
- construct or inject Goal model input
- convert same-turn or extension producers
