# WA03 History Key And Idle Continuation Appendage Map

This is the pre-pass appendage map for
`03-history-key-and-idle-continuation.md`.

It is not an implementation pass doc. It exists to make the coupling inside
WA03 explicit before split planning.

## Direction Lock

Request:

- produce only the WA03 appendage map
- ground it in the Goal authority docs, completed WA01/WA02 pre-pass notes,
  WA03 parent doc, and real local/upstream terrain
- do not implement Rust code
- do not write `03a` / `03b` implementation pass docs in this pass

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`

Route context:

- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`

Terrain:

- local and `rust-v0.136.0` both rebuild prompt input inside
  `run_sampling_request(...)` retry loops and both have an empty
  `ResponseEvent::Created` arm
- local `ContextManager::history_version()` and the `rust-v0.136.0` matching
  shape are rewrite counters; ordinary `record_items(...)` appends
  model-visible progress without bumping the counter
- local Goal runtime still has runtime-only Initial state, concrete Goal
  `ResponseInputItem` injection/carry, and Goal-owned synthetic turns built
  around prebuilt model input
- local and `rust-v0.136.0` state stores are facts-only; there is no
  `facts_version`, pending cadence intent table, or Continuation watermark
  table in the landing terrain
- `rust-v0.140.0` typed replay shows a migration precedent for structured
  replay metadata, not a Goal authority or model-input materialization path

Code-shape temptation:

- split WA03 mechanically by the parent doc's pass index without mapping the
  real coupling between key projection, idle staging, turn metadata, shaper
  recheck, Created commit, resume, compaction, and retry/failure behavior
- keep current `MaybeContinueIfIdle` as "construct Goal input and inject it"
  because it already reserves/starts a synthetic turn
- use `ContextManager::history_version()` as a cheap Continuation key
- treat preflight selection, reservation, ordinary rollout items, raw
  notifications, classifier matches, or rendered Goal text as commit evidence

Locked direction:

- map WA03 as appendages around the WA02 request-input shaping and
  Created-event commit seam
- keep `core/src/goal_cadence/` responsible for key projection, shaper recheck,
  selected Continuation item construction, and inert commit metadata
- keep `codex-state` responsible for the default durable latest committed
  Continuation watermark record
- keep `goals.rs`, `tasks/mod.rs`, `input_queue.rs`, `state/turn.rs`, and
  `session/mod.rs` as v136 idle/turn metadata adapters, not model-input
  authority owners
- treat recorded request evidence as optional metadata from the same
  Created-event commit path, not the default live suppression owner

Exclusions:

- no Rust implementation
- no implementation pass docs
- no `ext/goal` conversion
- no broad WA05 classifier/projection/raw-notification cleanup
- no final deletion of all old active-path symbols
- no persisted pending Continuation intent
- no standalone build, PR, or acceptance checkpoint for WA03

## Terrain Findings

Local request path:

- `codex-rs/core/src/session/turn.rs` builds the first
  `sampling_request_input` from `sess.clone_history().await.for_prompt(...)`
  before calling `run_sampling_request(...)`.
- `run_sampling_request(...)` stores that first input in `initial_input`, then
  rebuilds `prompt_input` from `sess.clone_history().await.for_prompt(...)` on
  retry attempts.
- `build_prompt(prompt_input, ...)` is called inside the retry loop.
- `try_run_sampling_request(...)` has an empty `ResponseEvent::Created` arm.
- Therefore every WA03 key/recheck decision used for model submission depends
  on the WA02 per-attempt shaper running inside `run_sampling_request(...)`
  before `build_prompt(...)`, with Created-event commit metadata passed into
  `try_run_sampling_request(...)`.

Local idle terrain:

- `GoalRuntimeEvent::MaybeContinueIfIdle` dispatches to
  `maybe_continue_goal_if_idle_runtime()`.
- `maybe_continue_goal_if_idle_runtime()` currently calls
  `maybe_start_turn_for_pending_work().await` and then
  `maybe_start_goal_continuation_turn().await` without knowing whether pending
  work actually started.
- `maybe_start_goal_continuation_turn()` acquires `continuation_lock`, builds a
  `GoalContinuationCandidate`, reserves `ActiveTurn`, injects concrete Goal
  input through `extend_goal_pending_input_for_turn_state(...)`, optionally
  clears runtime Initial state, and starts `RegularTask`.
- `goal_continuation_candidate_if_active()` currently filters feature/mode,
  active-turn presence, queued next-turn input, trigger-turn mailbox input,
  durable active Goal state, and then renders Initial or Continuation prompt
  into a `ResponseInputItem`.
- WA03 must keep the useful lock/reservation shape but replace the candidate
  payload with `GoalTurnRequest` metadata and shaper recheck.

Local pending-work terrain:

- `codex-rs/core/src/tasks/mod.rs` has
  `maybe_start_turn_for_pending_work(...)` and
  `maybe_start_turn_for_pending_work_with_sub_id(...)`; both return `()`.
- Pending work currently includes
  `InputQueue::has_queued_response_items_for_next_turn()` and
  `InputQueue::has_trigger_turn_mailbox_items()`.
- The same helper drains queued response items and mailbox items into the
  active turn when `start_task(...)` runs.
- WA03 needs a stage-order adapter change that reports whether pending work was
  started so the idle hook can return before Goal-owned stages.
- Later Goal-owned synthetic launch paths must also account for that drain
  behavior. A pending-work recheck before generic `start_task(...)` is not
  enough unless recheck and start are effectively atomic, or the launch path
  refuses/requeues newly arrived queued/mailbox work before model submission.

Local turn-state terrain:

- `codex-rs/core/src/state/turn.rs` stores
  `current_turn_goal_steering_items: Vec<GoalSteeringCarryItem>`, where each
  carry item holds a concrete `ResponseInputItem`.
- `codex-rs/core/src/session/input_queue.rs` has
  `extend_goal_pending_input_for_turn_state(...)`,
  `inject_goal_response_items(...)`,
  `close_goal_steering_injection_if_idle(...)`, and
  `current_turn_goal_steering_items(...)`.
- These are replacement terrain. WA03-owned idle paths must use metadata-only
  `GoalTurnRequest` storage and must not append concrete Goal input.

Local history/reconstruction terrain:

- `ContextManager::record_items(...)` appends API messages to history without
  changing `history_version`.
- `ContextManager::history_version()` changes on rewrites such as
  `replace(...)`, `remove_last_item(...)`, `replace_last_turn_images(...)`, and
  `drop_last_n_user_turns(...)`.
- `ContextManager::for_prompt(...)` normalizes the model-bound history used
  for a sampling attempt.
- `rollout_reconstruction.rs` rebuilds `ContextManager` from ordinary
  `RolloutItem::ResponseItem`, `RolloutItem::Compacted`, `RolloutItem::TurnContext`,
  and event messages; local code filters legacy Goal context items during
  reconstruction.
- Local and remote compaction install replacement history through
  `replace_compacted_history(...)`; mid-turn paths currently reinsert concrete
  current-turn Goal steering items.
- WA03 must compute the Continuation key from cleaned prompt input, not from
  `history_version`, raw rollout counts, or ordinary rendered Goal text.

Local state terrain:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql` has one
  `thread_goals` table with facts and timestamps only.
- `codex-rs/state/src/model/thread_goal.rs` has `ThreadGoal` /
  `ThreadGoalRow` without `facts_version`.
- `codex-rs/state/src/runtime/goals.rs` exposes facts-only methods such as
  `get_thread_goal`, `replace_thread_goal`, `insert_thread_goal`,
  `update_thread_goal`, `delete_thread_goal`, and
  `account_thread_goal_usage`.
- The file already has focused state tests and is the natural test home for
  watermark storage, but WA01 owns facts version and pending intent storage.

Upstream terrain:

- `rust-v0.136.0` matches the important request loop, empty Created arm,
  facts-only GoalStore, and `history_version` limitations.
- `rust-v0.136.0` Goal idle terrain uses upstream internal-model-context
  user-role input; this is topology terrain only and conflicts with local
  authority.
- `rust-v0.140.0` adds `RolloutItem::InterAgentCommunication` and reconstructs
  it as model-visible history through `to_model_input_item()`. That is useful
  typed replay precedent for structured metadata carriers, but Goal request
  evidence must remain metadata-only and must not become a model-input
  construction path.

## Appendage Map

### 1. `model_visible_history_key` Projection

Owner files/modules:

- new private `codex-rs/core/src/goal_cadence/` module directory
- `codex-rs/core/src/session/turn.rs` as the caller that supplies each
  attempt's base input to the request-input shaper
- `codex-rs/core/src/context_manager/history.rs` as terrain for
  `for_prompt(...)`, not as the key owner

Key hooks/functions:

- `run_sampling_request(...)` after each attempt's `prompt_input` is known and
  before `build_prompt(...)`
- WA02 `goal_cadence::finalize_request_input(base_input, GoalRequestContext)`
  or equivalent
- `ContextManager::for_prompt(...)` output as the source of the base prompt
  input for retry/follow-up attempts

Coupled appendages:

- eligible progress projection and Goal-item exclusions
- automatic Continuation preflight and request-input shaper recheck
- Created-event Continuation commit
- compaction/rollback/fork/reconstruction key behavior

What waits:

- WA02 must create the request-input shaping module and call site.
- WA05 may later replace temporary current/legacy Goal cleanup predicates with
  shared strict classifiers.
- WA06 removes remaining old active-path helpers after replacement paths
  exist.

Boundary pressure:

- This is a natural early WA03 implementation boundary because the projection
  can be tested directly over `Vec<ResponseItem>`.
- Do not let this boundary include idle scheduling or watermark mutation.

### 2. Eligible Progress Projection And Goal-Item Exclusions

Owner files/modules:

- `codex-rs/core/src/goal_cadence/` for the projection over cleaned base input
- `codex-rs/protocol/src/models.rs` as terrain for the real
  `ResponseItem` variants
- current `codex-rs/core/src/context/goal_context.rs` only as temporary
  legacy-artifact terrain until WA05 supplies shared classifiers

Key hooks/functions:

- projection helper inside `goal_cadence/`, logically
  `ModelVisibleHistoryKey::from_cleaned_base_input(...)`
- WA02 cleanup inside the shaper before inserting a selected Goal item
- `ResponseItem` variants:
  `Message`, `Reasoning`, `LocalShellCall`, `FunctionCall`,
  `FunctionCallOutput`, `CustomToolCall`, `CustomToolCallOutput`,
  `ToolSearchCall`, `ToolSearchOutput`, `WebSearchCall`,
  `ImageGenerationCall`, `Compaction`, `ContextCompaction`, and deliberate
  handling of `Other`

Coupled appendages:

- model-visible history key projection
- compaction/rollback/fork/reconstruction key behavior
- WA05 classifier/projection cleanup

What waits:

- WA02 must define cleaned base input semantics.
- WA05 must own final shared classification and whole-message purity across
  projection, typed/materialized UI, raw notifications, compaction, and
  reconstruction.

Boundary pressure:

- Keep this with the key projection unless split-planning needs a separate
  classifier-adapter pass.
- Do not make classifier output an authority check. It only decides which
  items are excluded from the key or cleaned from request input.

### 3. Durable Automatic Continuation Suppression Storage

Owner files/modules:

- `codex-rs/state/goals_migrations/` for a new watermark migration after WA01
  facts-version and pending-intent migrations
- `codex-rs/state/src/model/thread_goal.rs` for watermark model rows/types or
  a sibling state model file if split planning chooses one
- `codex-rs/state/src/model/mod.rs`, `codex-rs/state/src/runtime/goals.rs`,
  and `codex-rs/state/src/lib.rs` for exports and store APIs

Key hooks/functions:

- existing `GoalStore` construction through `StateRuntime::thread_goals()`
- new state APIs equivalent to loading, upserting, and clearing the latest
  committed Continuation watermark
- deletion/replacement/status update paths that clear stale watermark rows
  when the active Goal identity or eligibility ends

Coupled appendages:

- Created-event Continuation commit
- resume hydration
- automatic Continuation preflight and shaper recheck
- retry/failure semantics

What waits:

- WA01 must supply durable `facts_version` and cadence snapshot shape.
- WA02 must supply exact commit metadata for the selected final item.
- Recorded request evidence may later be written from the same Created path,
  but it does not replace this state-owned watermark by default.

Boundary pressure:

- This is a natural state-only implementation boundary.
- Keep it durable-only: no prompt rendering, no cadence selection, no model
  role decisions, no evidence carrier, and no pending Continuation intent.

### 4. `GoalTurnRequest` Metadata Lifecycle

Owner files/modules:

- `codex-rs/core/src/goal_cadence/` for private request metadata types used by
  request shaping
- `codex-rs/core/src/state/turn.rs` for turn-local metadata storage
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/session/mod.rs` for adapters that set, inspect, clear,
  and preserve metadata with the active turn
- `codex-rs/core/src/codex_thread.rs` as a public adapter if external callers
  need to request a same-turn recheck or wake without naming private
  `goal_cadence` types

Key hooks/functions:

- replacement for `TurnState.current_turn_goal_steering_items` in WA03-owned
  idle paths
- replacement for `InputQueue::extend_goal_pending_input_for_turn_state(...)`
  and `InputQueue::inject_goal_response_items(...)` in WA03-owned paths
- `run_sampling_request(...)` / WA02 shaper reading metadata for the current
  turn on each attempt
- active-turn cleanup paths that clear reserved synthetic turn metadata on
  abort-before-submit or turn completion
- Created-event commit paths that record committed carry and clear or mark
  uncommitted `GoalTurnRequest` metadata obsolete before same-turn follow-up
  attempts

Coupled appendages:

- idle pending durable cadence delivery
- automatic Continuation preflight and shaper recheck
- stale synthetic Goal-owned turn abort-before-submit
- Created-event Continuation commit
- retry/failure semantics

What waits:

- WA02 owns the base `GoalRequestContext` and submit-or-abort outcome.
- WA04 owns extension/app-server producer conversion into the selected public
  adapter path.
- WA06 deletes dead concrete injection paths after converted producers no
  longer need them.

Boundary pressure:

- This metadata shape should land before idle pending-intent delivery and
  automatic Continuation launch are converted.
- Do not store rendered prompt text, active `ResponseItem`, or
  `ResponseInputItem` here.

### 5. Idle Stage Ordering

Owner files/modules:

- `codex-rs/core/src/goals.rs` for the v136 idle lifecycle adapter around
  `GoalRuntimeEvent::MaybeContinueIfIdle`
- `codex-rs/core/src/tasks/mod.rs` for pending-work helpers
- `codex-rs/core/src/session/input_queue.rs` for queued next-turn and
  trigger-turn mailbox checks
- `codex-rs/core/src/session/mod.rs` for active-turn reservation/start-task
  helpers

Key hooks/functions:

- `maybe_continue_goal_if_idle_runtime()`
- `maybe_start_goal_continuation_turn()`, which should be replaced or
  decomposed into the contracted stages
- `maybe_start_turn_for_pending_work(...)`
- `maybe_start_turn_for_pending_work_with_sub_id(...)`
- `InputQueue::has_queued_response_items_for_next_turn()`
- `InputQueue::has_trigger_turn_mailbox_items()`
- `continuation_lock`

Coupled appendages:

- pending durable cadence delivery from idle
- automatic Continuation preflight
- stale synthetic abort-before-submit
- retry/failure semantics

What waits:

- WA01 pending-intent snapshot operations must exist before Stage 2 can be
  fully implemented.
- WA02 metadata/shaper outcome must exist before Stage 2 or Stage 3 can
  reserve Goal-owned synthetic turns without prebuilt input.

Boundary pressure:

- Stage-order refactor can be a separate boundary because it changes the
  pending-work helper result contract and idle hook control flow.
- It must not become a standalone acceptance point or a place to preserve old
  concrete Goal input injection.

### 6. Pending Durable Cadence Delivery From Idle

Owner files/modules:

- `codex-rs/core/src/goals.rs` for idle Stage 2 selection/reservation adapter
- `codex-rs/core/src/goal_cadence/` for final request selection and commit
  metadata when pending intent is delivered
- `codex-rs/core/src/state/turn.rs` and `codex-rs/core/src/session/mod.rs` for
  `GoalTurnRequest::IdlePendingCadence` metadata
- `codex-rs/state/src/runtime/goals.rs` for snapshot reads and later
  Created-event exact-key consumption through WA02 commit plumbing

Key hooks/functions:

- `maybe_continue_goal_if_idle_runtime()` after pending non-Goal work declines
- WA01 `ThreadGoalCadenceSnapshot` or equivalent
- pending intent supersedence order:
  `BudgetLimit > ObjectiveUpdated > Initial`
- `start_task(turn_context, Vec::new(), RegularTask::new())` only after
  metadata-only reservation and rechecks
- or an equivalent Goal-owned task-start path that prevents newly arrived
  queued/mailbox work from being drained into the synthetic cadence-delivery
  turn
- WA02 Created-event commit path for exact-key consumption

Coupled appendages:

- idle stage ordering
- `GoalTurnRequest` lifecycle
- stale synthetic abort-before-submit
- retry/failure semantics

What waits:

- WA01 durable pending intent storage and exact-key consumption must exist.
- WA02 request-input shaping and commit must exist.
- WA04 producer conversion decides how app-server and extension mutations
  create pending intent atomically, but WA03 can deliver pending intent once it
  is present.

Boundary pressure:

- This is distinct from automatic Continuation. Do not label Stage 2 as
  Continuation merely because it is launched from the idle hook.
- Delivery must not advance the automatic Continuation watermark.

### 7. Automatic Continuation Preflight And Shaper Recheck

Owner files/modules:

- `codex-rs/core/src/goals.rs` for Stage 3 candidate preflight and
  reservation
- `codex-rs/core/src/goal_cadence/` for recomputing the key and rechecking the
  candidate against fresh attempt facts
- `codex-rs/core/src/session/turn.rs` for passing the fresh per-attempt
  `GoalRequestContext` into the shaper
- `codex-rs/state/src/runtime/goals.rs` for latest watermark reads

Key hooks/functions:

- `goal_continuation_candidate_if_active(...)`, to be replaced by a
  metadata-only candidate path
- `sess.clone_history().await.for_prompt(...)` for the preflight base input
- `ModelVisibleHistoryKey` projection reused by both preflight and shaper
- WA02 `GoalFinalizationOutcome::Submit(...)` /
  `AbortSyntheticGoalTurn` or equivalent

Coupled appendages:

- model-visible history key projection
- durable watermark storage
- `GoalTurnRequest` lifecycle
- stale synthetic abort-before-submit
- Created-event Continuation commit

What waits:

- WA02 must expose a submit-or-abort outcome.
- WA01 must expose current durable facts version and pending intent snapshot.
- WA05 later hardens classifiers used during key/cleanup.

Boundary pressure:

- Keep preflight subordinate. It avoids launching clearly suppressed
  synthetic turns; it is not commit evidence and it does not replace the
  request-input shaper's per-attempt recomputation.
- This boundary should include the stale/suppressed candidate path only if the
  shaper abort outcome already exists.

### 8. Stale Synthetic Goal-Owned Turn Abort Before Submit

Owner files/modules:

- `codex-rs/core/src/goal_cadence/` for the internal abort disposition
- `codex-rs/core/src/session/turn.rs` for honoring abort before
  `build_prompt(...)` / model submission
- `codex-rs/core/src/session/mod.rs` and `codex-rs/core/src/state/turn.rs` for
  clearing the reserved active turn and turn metadata
- `codex-rs/core/src/goals.rs` for reservation stale checks before launch

Key hooks/functions:

- WA02 request-input shaper return type
- `run_sampling_request(...)` loop before `build_prompt(...)`
- active-turn reservation checks in current
  `maybe_start_goal_continuation_turn()`
- active-turn cleanup paths that must not emit user-facing model/request errors

Coupled appendages:

- `GoalTurnRequest` metadata lifecycle
- idle pending durable cadence delivery
- automatic Continuation preflight/recheck
- retry/failure semantics

What waits:

- WA02 submit-or-abort outcome must exist.
- WA06 can delete old dead injection helpers once all synthetic Goal-owned
  paths use metadata.

Boundary pressure:

- This is a cross-cutting behavior rather than a state schema pass.
- It is likely coupled with either turn metadata or automatic Continuation
  launch during split planning.

### 9. Created-Event Continuation Commit

Owner files/modules:

- `codex-rs/core/src/session/turn.rs` for the
  `ResponseEvent::Created` commit handler
- `codex-rs/core/src/goal_cadence/` for inert `GoalRequestCommit` metadata and
  item/request fingerprints
- `codex-rs/state/src/runtime/goals.rs` for durable watermark upsert
- optional later evidence carrier in protocol/thread-history modules only if
  split planning includes typed evidence integration

Key hooks/functions:

- `try_run_sampling_request(...)` `ResponseEvent::Created` arm
- WA02 commit metadata passed from `run_sampling_request(...)`
- selected item fingerprint, full request-input fingerprint, item index, turn
  id, attempt ordinal, facts version, and
  `model_visible_history_key`
- watermark upsert after Created for `GoalCadenceKind::Continuation`

Coupled appendages:

- durable watermark storage
- retry/failure semantics
- recorded request evidence relationship
- current-turn committed carry from WA02

What waits:

- WA02 must wire commit metadata into `try_run_sampling_request(...)`.
- WA03 key projection must exist before Continuation commit can write the
  triple.
- Typed evidence can wait unless a later implementation selects a
  non-best-effort evidence-backed reconstruction path.

Boundary pressure:

- This is a distinct commit boundary because it changes live correctness.
- Commit must not run on stream creation, prompt construction, reservation, or
  helper rendering. Created is the commit point in v136 unless later code walk
  proves a more precise execution point.

### 10. Resume Hydration

Owner files/modules:

- `codex-rs/core/src/goals.rs` for
  `restore_thread_goal_runtime_after_resume()`
- `codex-rs/core/src/codex_thread.rs` for
  `apply_goal_resume_runtime_effects()` and
  `continue_active_goal_if_idle()`
- `codex-rs/core/src/session/mod.rs` and
  `codex-rs/core/src/session/rollout_reconstruction.rs` for rollout
  reconstruction before Goal hydration
- app-server lifecycle callers as terrain for ordering after resume response,
  snapshot, and replay
- state APIs from WA01 and WA03 for durable facts, pending intents, and latest
  Continuation watermark

Key hooks/functions:

- `restore_thread_goal_runtime_after_resume()` currently marks Initial pending
  for every active Goal; this is replacement terrain
- `Session::reconstruct_history_from_rollout(...)`
- `Session::apply_rollout_reconstruction(...)`
- `CodexThread::apply_goal_resume_runtime_effects()`
- `CodexThread::continue_active_goal_if_idle()`
- app-server `emit_resume_goal_snapshot_and_continue(...)` and running-thread
  resume ordering after replay

Coupled appendages:

- durable watermark storage
- compaction/rollback/fork/reconstruction key behavior
- idle stage ordering
- pending durable cadence delivery from idle

What waits:

- WA01 snapshot must load pending Initial/ObjectiveUpdated/BudgetLimit rather
  than runtime fabricating Initial.
- WA03 watermark storage must exist for duplicate suppression after resume.
- WA04 may later adjust mutation/adapters, but resume hydration remains core
  idle lifecycle terrain for v136.

Boundary pressure:

- Resume is a natural later WA03 boundary because it depends on key projection,
  watermark storage, and idle ordering.
- Do not reconstruct active Goal facts, pending intent, or watermark from
  rendered Goal text or ordinary rollout `ResponseItem`s.

### 11. Compaction, Rollback, Fork, And Reconstruction Key Behavior

Owner files/modules:

- `codex-rs/core/src/goal_cadence/` for key projection over cleaned prompt
  input
- `codex-rs/core/src/context_manager/history.rs` for prompt-history terrain and
  rollback rewrite behavior
- `codex-rs/core/src/session/rollout_reconstruction.rs` for reconstructed
  prompt history
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`

Key hooks/functions:

- `ContextManager::for_prompt(...)`
- `ContextManager::replace(...)` and `drop_last_n_user_turns(...)`
- `Session::replace_compacted_history(...)`
- compaction functions that install replacement history
- current mid-turn compaction calls to `current_turn_goal_steering_items()`,
  which are cleanup terrain and not a key mechanism

Coupled appendages:

- model-visible history key projection
- eligible progress projection and exclusions
- resume hydration
- WA05 cleanup/classifier surface map

What waits:

- WA05 owns broad classifier/projection/raw-notification cleanup and final
  compaction filtering behavior.
- WA06 owns deletion of old active-path carry once replacement carry and
  classifier cleanup are complete.

Boundary pressure:

- WA03 should only make the key correct for the final cleaned base input it
  receives and for reconstructed histories used by requests.
- Do not make compaction synthesize a watermark, evidence record, or Goal
  steering item merely because it removed or summarized Goal-looking items.

### 12. Retry And Failure Semantics

Owner files/modules:

- `codex-rs/core/src/session/turn.rs` for retry-loop shaping and stream event
  handling
- `codex-rs/core/src/goal_cadence/` for per-attempt recomputation and inert
  commit metadata
- `codex-rs/state/src/runtime/goals.rs` for watermark reads/upserts and
  pending-intent exact-key consumption through WA02 commit

Key hooks/functions:

- `run_sampling_request(...)` retry loop
- `handle_retryable_response_stream_error(...)`
- `try_run_sampling_request(...)`
- `ResponseEvent::Created`
- WA02/WA03 shaper metadata and commit metadata

Coupled appendages:

- model-visible history key projection
- automatic Continuation preflight and shaper recheck
- stale synthetic abort-before-submit
- Created-event Continuation commit
- recorded request evidence timing

What waits:

- WA02 retry/follow-up shaper placement must be implemented.
- WA03 Created-event Continuation commit must exist before retry-after-Created
  duplicate suppression can be tested end-to-end.

Boundary pressure:

- This is likely the final WA03 acceptance-test boundary after the state,
  projection, idle, metadata, shaper recheck, and Created commit appendages
  exist.
- Tests should assert final `/responses` input and durable watermark state, not
  helper output, classifier output, raw notifications, rollout trace payloads,
  or rendered Goal text.

## Coupling Summary

Use this dependency order during split planning:

1. Durable watermark storage can be planned from state terrain, but it depends
   on WA01 facts version and snapshot shape.
2. Key projection and eligible progress exclusion should land before
   automatic Continuation lifecycle tests depend on it.
3. `GoalTurnRequest` metadata must exist before idle pending-intent delivery
   or automatic Continuation can stop injecting concrete Goal input.
4. Idle stage ordering should be separated from automatic Continuation
   selection because `tasks/mod.rs` pending-work helpers need a return value.
5. Pending durable cadence delivery from idle depends on WA01 pending intent
   and WA02 shaper/commit.
6. Automatic Continuation preflight depends on key projection, metadata, and
   watermark reads, but commit remains Created-event only.
7. Created-event Continuation commit depends on WA02 commit metadata and WA03
   key/watermark state.
8. Resume hydration depends on state snapshots, watermark loading, and
   reconstructed history key behavior.
9. Retry/failure/stale synthetic-turn coverage should be last because it
   crosses nearly every earlier appendage.

## Proceed Criteria For WA03 Split Planning

WA03 can move to implementation pass split planning when the split planner can
use this map to name:

- which pass owns the durable watermark schema and store APIs
- which pass owns `ModelVisibleHistoryKey` projection and direct projection
  tests
- which pass owns `GoalTurnRequest` metadata storage/adapters
- which pass owns pending-work stage-order helper return values
- which pass owns idle delivery of pending Initial/ObjectiveUpdated/BudgetLimit
  intent
- which pass owns automatic Continuation preflight plus shaper recheck
- which pass owns Created-event Continuation commit and watermark advancement
- which pass owns resume hydration and duplicate-suppression reload
- which pass owns retry/failure/stale synthetic-turn end-to-end tests

The split must not require any WA03 pass to be an independent release,
standalone PR, or final acceptance checkpoint. The whole rewrite acceptance
still flows through WA06.

## Validation

Docs-only validation:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```
