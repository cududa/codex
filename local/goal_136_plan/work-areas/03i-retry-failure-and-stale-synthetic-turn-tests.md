# Work Area 03i: Retry Failure And Stale Synthetic Turn Tests

This ordered pass is the WA03 cross-seam verification layer. It covers retry,
failure, stale synthetic turns, duplicate suppression, and key behavior after
the earlier WA03 implementation pieces exist.

## Direction Lock

Request:

- write the final WA03 retry/failure/stale synthetic-turn pass
- keep validation focused on final request payloads and durable state
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`

Route context:

- all completed WA03 pass docs `03a` through `03h`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`

Terrain:

- `run_sampling_request(...)` rebuilds input on retry attempts
- `try_run_sampling_request(...)` commits only on `ResponseEvent::Created`
- `handle_retryable_response_stream_error(...)` controls retry continuation
- stale synthetic turns must abort before `build_prompt(...)` / model submit
- WA05 owns broad classifier/projection/compaction cleanup, but WA03 owns key
  correctness for request-input shaper base input
- structured evidence may support replay only under explicit non-best-effort
  recorded-evidence rules; it is not the default live suppression owner

Code-shape temptation:

- assert helper output instead of captured `/responses` input
- use ordinary rollout items or rendered Goal text as structured commit
  evidence
- patch over stale synthetic turns by submitting an empty model request
- make this pass final rewrite acceptance instead of WA03-focused coverage

Locked direction:

- add focused tests and small integration fixes for behavior introduced by
  WA03
- assert final request input, Created-event commit timing, and durable
  watermark state
- leave broad cleanup and final acceptance to WA05/WA06
- prove that stale synthetic acceptance aborts before submission rather than
  submitting an empty or helper-only model request

Exclusions:

- no new architecture
- no ext/goal conversion
- no broad raw/typed projection cleanup
- no final deletion of all old Goal shim symbols
- no assertions that treat helper output, rendered text, trace payloads, raw
  notifications, classifier matches, ordinary rollout items, or
  `history_version()` as final request-input proof or suppression authority

## Code Terrain Read

Directly read:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/tests/common/responses.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/suite/mod.rs` when adding a new suite module
- `codex-rs/state/src/runtime/goals.rs`

Observed facts:

- stream setup is earlier than Created and must not commit.
- retries rebuild prompt input and need fresh snapshots/watermark reads.
- state-owned watermark remains the default correctness owner.
- compaction/reconstruction may influence the key only through model-visible
  prompt input, not through rendered Goal text or raw rollout counts.
- rollback and fork rebuild prompt history from surviving rollout items, so
  their key behavior must be asserted against surviving reconstructed input.

## Pass Goal

Close WA03 with focused tests and any narrow integration fixes needed to make
the earlier pieces behave together:

```text
retry before Created -> no watermark
Created then retryable error -> watermark remains
unchanged key/facts -> no duplicate Continuation
stale synthetic turn -> abort before submit
resume unchanged watermark -> suppress duplicate
rollback/fork -> recompute key from surviving reconstructed history
eligible progress/facts change -> permit later Continuation
```

The acceptance target is cross-seam behavior, not final Goal rewrite
completion. A request-producing test must prove the final `/responses` input;
a suppression test must prove durable watermark state or the recomputed
model-visible key predicate.

## Exact Files To Edit

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/suite/mod.rs` when adding a new suite module
- `codex-rs/core/tests/common/responses.rs` only for small request-capture
  helper additions
- `codex-rs/state/src/runtime/goals.rs` only if state assertion helpers are
  needed

## Required Edits

Verify and, if needed, tighten integration behavior:

- every retry attempt recomputes `ModelVisibleHistoryKey` from rebuilt base
  input
- every retry attempt assembles a fresh cadence snapshot and latest watermark
- request construction failure before final input contains Continuation does
  not advance watermark
- stream setup failure before Created does not advance watermark
- stream error before Created does not advance watermark
- retry before Created keeps the uncommitted `GoalTurnRequest` available for
  the next attempt's fresh shaper recheck
- stream error after Created leaves watermark committed
- retry after Created does not insert another Continuation for the same
  `{ goal_id, model_visible_history_key, facts_version }`
- after Created commit, same-turn follow-up shaping uses committed carry plus
  fresh durable snapshots and must not reuse the pre-commit `GoalTurnRequest`
  metadata as a still-pending synthetic request
- stale synthetic Goal-owned turns clear reservation and metadata without
  user-facing model errors
- late queued next-turn or trigger-turn mailbox input is not drained into a
  Goal-owned synthetic turn after reservation; it remains regular pending work
  unless the pending-work recheck/task-start path is effectively atomic
- no structured evidence is written before Created
- rollback and fork recompute `ModelVisibleHistoryKey` from surviving
  reconstructed prompt input
- rolled-back or non-surviving Goal items, request evidence, rollout text, or
  trace payloads do not suppress or permit Continuation by themselves
- ordinary rollout `ResponseItem`s containing Goal text are not structured
  evidence and do not reconstruct state-owned watermarks
- `ContextManager::history_version()` may be useful diagnostic terrain but is
  not a key, permit, or suppression check by itself

Do not broaden this pass into WA05 cleanup. Add only narrow classifier/key
hooks needed for the WA03 request-input base input.

## Tests And Checks

Add or complete focused tests:

- `goal_idle_request_failure_before_created_does_not_advance_watermark`
- `goal_idle_retry_after_created_does_not_duplicate_continuation`
- `goal_idle_created_follow_up_does_not_reuse_stale_goal_turn_request`
- `goal_idle_automatic_continuation_preflight_mismatch_aborts_before_submit`
- `goal_idle_candidate_rejected_if_pending_work_appears_after_reservation`
- `goal_idle_late_pending_work_is_not_drained_into_goal_owned_synthetic_turn`
- `goal_idle_resume_unchanged_watermark_suppresses_duplicate_continuation`
- `goal_idle_assistant_output_after_continuation_permits_later_continuation`
- `goal_idle_goal_facts_version_change_permits_later_continuation`
- `goal_idle_resume_ignores_ordinary_rollout_goal_text_for_watermark`
- `goal_idle_rollback_recomputes_key_from_surviving_history`
- `goal_idle_fork_recomputes_key_from_surviving_history`

Assertions should use:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- durable state reads for watermark rows

Reject these as substitutes for final request input or structured commit
metadata:

- helper output
- classifier matches
- raw response item notifications
- ordinary rollout `ResponseItem`
- rollout trace payloads
- rendered Goal text

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle
cargo test -p codex-core --test all goal_authority
cargo test -p codex-state --lib goal_cadence_continuation_watermark
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, WA03-owned behavior should be covered for key projection,
durable watermarking, idle stage order, pending durable intent delivery from
idle, automatic Continuation, Created-event watermark commit, resume hydration,
and retry/failure/stale synthetic-turn behavior.

The branch can still require WA04 extension conversion, WA05
classifier/projection cleanup, and WA06 final cleanup and acceptance before the
whole Goal rewrite is complete.

## Non-Goals

This pass does not:

- make WA03 a standalone release or final acceptance checkpoint
- convert `ext/goal`
- finish raw notification or typed/materialized projection cleanup
- delete all old active Goal shim symbols
- use recorded evidence as live correctness unless an earlier pass explicitly
  implemented a non-best-effort evidence-backed path
