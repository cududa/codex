# Work Area 03h: Resume Hydration And Watermark Reconstruction

This ordered pass makes thread resume hydrate durable Goal facts, pending
intent, and the Continuation suppression basis without fabricating Initial or
recovering state from rendered text.

## Direction Lock

Request:

- add the WA03 resume hydration pass
- ensure resume reloads state and suppression basis without creating cadence
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`

Route context:

- `local/goal_136_plan/work-areas/03a-watermark-schema-store-apis.md`
- `local/goal_136_plan/work-areas/03b-model-visible-history-key-projection.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03g-continuation-created-commit.md`

Terrain:

- `restore_thread_goal_runtime_after_resume()` currently marks Initial pending
  for active Goals
- `CodexThread::apply_goal_resume_runtime_effects()` and
  `continue_active_goal_if_idle()` already provide hydration-then-idle caller
  order
- rollout reconstruction rebuilds `ContextManager` before resume effects
- structured request evidence is metadata only and does not create durable
  facts
- rollback and fork recompute suppression keys from surviving reconstructed
  model-visible history, not from removed rollout segments or old Goal text

Code-shape temptation:

- recreate pending Initial from any active durable Goal on resume
- reconstruct Continuation suppression from ordinary rendered Goal text
- clear duplicate suppression on resume and let idle immediately duplicate
  Continuation
- treat surviving structured evidence, rollout traces, classifier matches, or
  raw notifications as the default state-owned watermark

Locked direction:

- resume reloads durable Goal facts, pending intent, accounting baselines, and
  latest state-owned Continuation watermark
- resume does not emit steering, consume intent, or advance watermark
- the later idle hook decides pending work, pending durable cadence delivery,
  or automatic Continuation
- rollback, fork, and reconstruction compute any new request key from the
  surviving model-visible prompt input rather than from Goal artifacts

Exclusions:

- no app-server product API redesign
- no evidence-backed reconstruction unless a non-best-effort carrier was
  explicitly implemented earlier
- no parsing rendered Goal artifacts
- no broad WA05 projection cleanup
- no watermark reconstruction from raw notifications, rollout trace payloads,
  classifier matches, ordinary rollout Goal text, or `history_version()`

## Code Terrain Read

Directly read:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/state/src/runtime/goals.rs`
- app-server resume ordering terrain if implementation touches callers

Observed facts:

- current resume behavior violates the authority contract by fabricating
  Initial from active state alone.
- resume ordering already separates runtime hydration from the later idle hook.
- reconstructed history can support key recomputation but must not recover
  Goal facts or watermark state from rendered Goal text.

## Pass Goal

Replace resume-fabricated Initial with hydration:

```text
ThreadResumed:
  reload durable Goal facts
  reload pending Initial / ObjectiveUpdated / BudgetLimit intent
  reload latest Continuation watermark
  refresh accounting baselines
  clear stopped-goal runtime state when ineligible
  do not emit steering
  do not consume pending intent
  do not advance watermark
```

Resume hydration reloads state. It does not fabricate cadence, reconstruct
facts, or synthesize suppression from history artifacts.

## Exact Files To Edit

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/state/src/runtime/goals.rs`

## Required Edits

Change `restore_thread_goal_runtime_after_resume()` so it:

- loads the WA01 cadence snapshot
- loads the latest 03a Continuation watermark
- records usage/accounting baselines for active Goals
- clears stopped-goal runtime state for ineligible statuses
- removes resume use of `mark_initial_goal_steering_pending(...)`
- does not inspect rendered Goal items to create state

Keep caller order as hydration followed by optional idle lifecycle:

```text
apply_goal_resume_runtime_effects()
continue_active_goal_if_idle()
```

The later idle hook may:

- start pending non-Goal work
- deliver already-persisted pending cadence intent
- launch automatic Continuation only when key/watermark facts allow it

If structured request evidence exists, resume may read it only under the
recorded-evidence rules. The default correctness path is the state-owned
watermark.

For compaction, rollback, fork, and reconstruction behavior in this pass:

- compute `ModelVisibleHistoryKey` from the reconstructed or surviving
  model-visible prompt input that the request-input shaper will see
- allow compaction summaries or replacement history to affect the key only
  when they alter model-visible eligible progress
- ignore rolled-back or non-surviving Goal items, evidence records, trace
  payloads, and raw notifications as suppression authority
- do not create durable Goal facts, pending intent, committed carry, or a
  Continuation watermark by parsing rendered Goal text
- keep structured evidence metadata-only unless an explicit non-best-effort
  reconstruction path was implemented earlier

## Tests And Checks

Add focused tests:

- `goal_idle_resume_does_not_fabricate_initial`
- `goal_idle_resume_preserves_existing_pending_initial`
- `goal_idle_resume_unchanged_watermark_suppresses_duplicate_continuation`
- `goal_idle_resume_after_new_progress_permits_continuation`
- `goal_idle_resume_ignores_ordinary_rollout_goal_text_for_watermark`
- `goal_idle_rollback_recomputes_key_from_surviving_history`
- `goal_idle_fork_recomputes_key_from_surviving_history`

Use captured final request input for any request-producing scenario and state
assertions for hydration/watermark rows.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle_resume
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, resume hydrates durable Goal state and Continuation
suppression basis without creating cadence. Broad rollback/fork/compaction
cleanup and final old-path deletion still belong to WA05/WA06 unless needed
for the focused tests here.

## Non-Goals

This pass does not:

- create Initial from active Goal state alone
- parse rendered Goal text for durable facts, pending intent, or watermark
- make evidence the default live suppression owner
- rewrite app-server Goal APIs
- finish broad classifier/projection cleanup
