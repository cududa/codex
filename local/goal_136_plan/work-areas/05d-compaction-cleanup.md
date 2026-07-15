# WA05d: Compaction Cleanup

This pass converts local, remote, and remote-v2 compaction cleanup to the
shared classifier and removes pre-shaper concrete Goal carry from compaction
replacement history.

## Direction Lock

Request:

- convert compaction cleanup surfaces
- remove compaction reliance on concrete current-turn Goal
  `ResponseInputItem` carry
- use committed carry metadata only as request-local repair context when prior
  work provides it

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `compact.rs::collect_user_messages(...)` filters old
  `is_goal_context_response_item(...)`
- local mid-turn compaction appends `sess.current_turn_goal_steering_items()`
  into replacement history
- `compact_remote.rs::process_compacted_history(...)` does the same concrete
  carry reinsertion
- `compact_remote.rs::should_keep_compacted_history_item(...)` filters old
  Goal context and is reused by `compact_remote_v2.rs`

Code-shape temptation:

- keep concrete carry because compaction already uses it to preserve current
  Goal-looking input
- make compaction synthesize Goal steering, evidence, or watermarks after
  filtering artifacts

Locked direction:

- compaction filters pure artifacts and preserves mixed prose
- compaction never carries pre-shaper concrete Goal input as authority
- any needed Goal preservation uses committed carry metadata as request-local
  repair context through `core/src/goal_cadence/`

Exclusions:

- no request-input shaper implementation
- no durable Goal mutation
- no recorded request evidence carrier
- no rollout reconstruction conversion

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`

## Code Terrain Read

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/compact_tests.rs`

## Pass Goal

Make compaction cleanup use strict artifact classification and stop preserving
active Goal authority by copying concrete pre-shaper input into replacement
history.

## Exact Files To Edit

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/mod.rs` only for committed-carry adapters if
  needed
- `codex-rs/core/src/session/input_queue.rs` only to remove now-dead concrete
  compaction accessors if this pass owns that callsite
- `codex-rs/core/src/state/turn.rs` only to remove now-dead concrete
  compaction accessors if this pass owns that callsite
- `codex-rs/core/src/compact_tests.rs`
- inline tests in `codex-rs/core/src/compact_remote_v2.rs` if retained-history
  filtering or truncation behavior needs direct coverage

## Required Edits

- Replace `is_goal_context_response_item(...)` in compaction with shared
  classifier calls.
- Update `collect_user_messages(...)` to exclude pure current Goal
  internal-context items and pure legacy artifacts while preserving mixed
  marker-like user prose.
- Update `should_keep_compacted_history_item(...)` to drop pure current Goal
  internal-context items and pure legacy artifacts from model-provided compact
  output while preserving mixed prose.
- Ensure remote-v2 compaction continues to benefit from the shared
  `should_keep_compacted_history_item(...)` behavior.
- Remove local and remote mid-turn compaction reinsertion of
  `sess.current_turn_goal_steering_items()`.
- If a compacted request needs to preserve an already committed Goal cadence
  item, pass committed carry metadata as request-local repair context to the
  request-input shaper. Do not insert a prebuilt Goal item in compaction.
- Stop and fix dependency ordering if WA02/WA03 committed carry metadata does
  not exist. Do not keep concrete carry as WA05 continuation state.
- Do not synthesize `GoalRequestEvidence`, Continuation watermark updates, or
  pending cadence intent from compaction cleanup.

## Tests And Checks

Add or update focused tests:

- `collect_user_messages(...)` filters pure current and pure legacy Goal items
- `collect_user_messages(...)` preserves mixed marker-like user prose
- `process_compacted_history(...)` or
  `should_keep_compacted_history_item(...)` filters pure current and legacy
  artifacts
- remote compact filtering preserves mixed messages
- remote-v2 compact retained-history filtering drops pure current and legacy
  Goal artifacts before truncation while preserving mixed messages
- mid-turn local compaction does not reinsert pre-shaper Goal input
- mid-turn remote compaction does not reinsert pre-shaper Goal input
- compaction cleanup does not create evidence, pending intent, or watermark
  state

Prefer unit tests around compaction helpers. Use integration request-shape
coverage only when helper-level tests cannot prove the behavior.

## Branch Continuation State

After this pass:

- compaction cleanup uses the shared classifier
- replacement history no longer gains pre-shaper concrete Goal input from
  compaction
- old concrete carry APIs may remain only if another non-compaction active
  path still needs a later WA06 deletion audit
- rollout reconstruction still has its own conversion pass

## Non-Goals

- no rollout reconstruction, rollback, or fork conversion
- no app-server raw behavior change
- no final stale-symbol deletion sweep
- no durable Continuation watermark implementation
- no recorded request evidence storage implementation
