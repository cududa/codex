# Batch 02d: Created Commit And Carry

This slice commits selected Goal delivery when model execution reaches
`ResponseEvent::Created`.

It consumes pending Initial / ObjectiveUpdated / BudgetLimit intent by exact
key and records committed current-turn carry metadata. It does not convert
core producers; 02e owns that.

## Direction Lock

Request:

- split Batch 02 so commit dataflow is independent from selection and producer
  conversion
- make `ResponseEvent::Created` the first commit point
- replace pre-finalizer concrete carry with committed metadata for finalized
  Goal delivery

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01b-pending-cadence-intent-storage.md`
- `local/goal_136_plan/batches/01c-cadence-aware-store-operations.md`
- `local/goal_136_plan/batches/02a-goal-cadence-module-types.md`
- `local/goal_136_plan/batches/02b-per-attempt-finalizer-wiring.md`
- `local/goal_136_plan/batches/02c-pending-intent-selection-and-insertion.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- `try_run_sampling_request(...)` currently matches
  `ResponseEvent::Created => {}`.
- `client_session.stream(...).await??` can fail before any stream exists.
- stream errors before Created should leave pending intent intact.
- stream errors after Created should not roll back the delivery commit.
- `TurnState` currently carries old concrete Goal `ResponseInputItem`s.
- Batch 01 state owns `consume_pending_intent_exact(...)` and
  `clear_superseded_intents(...)`.

Code-shape temptation:

- consume pending intent when finalizer inserts an item
- commit after `build_prompt(...)` but before the stream reaches Created
- store the finalized item itself as carry and let future code treat it as new
  authority
- advance Continuation watermarking before Batch 03 defines the real key

Locked direction:

- pass `GoalRequestCommit` into `try_run_sampling_request(...)`
- consume pending intent only on `ResponseEvent::Created`
- clear superseded older intents after committed BudgetLimit when required
- record committed carry metadata, not `ResponseInputItem`
- leave Continuation watermarking inactive until Batch 03

Exclusions:

- no producer conversion
- no automatic Continuation watermarking
- no broad compaction repair rewrite
- no retry acceptance suite; 02f owns comprehensive tests

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/responses_retry.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/tests/common/responses.rs`

Findings to preserve:

- Created is currently the first stream event locally available for commit.
- retry handling happens outside `try_run_sampling_request(...)` after a
  retryable error is returned.
- old mid-turn compaction reads concrete carry through
  `current_turn_goal_steering_items(...)`.
- committed carry can be introduced before compaction consumes it, as long as
  old carry removal waits for later slices.

## Prerequisites And Dependencies

Required:

- 02a types exist.
- 02b passes finalizer output from attempt to `try_run_sampling_request(...)`.
- 02c produces `GoalRequestCommit` for selected pending intent.

This slice may land before 02e only if old producers are still explicitly
marked as conversion terrain and finalizer-owned delivery uses committed
metadata.

## Exact Files To Edit

Expected edits:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`

Possible state/API edits:

- `codex-rs/state/src/runtime/goals.rs` only if exact-key consumption or
  supersedence helpers need minor signature adjustment from Batch 01

Possible tests:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`

## Required Edits

### 1. Pass Commit Metadata To The Stream Handler

Change `try_run_sampling_request(...)` to accept:

```rust
goal_request_commit: Option<GoalRequestCommit>
```

`run_sampling_request(...)` passes the value returned by the finalizer for the
current attempt.

Requirements:

- each retry attempt gets its own commit metadata from that attempt's finalized
  input
- commit metadata must not be reused across attempts after a retry
- if finalizer returns `None`, Created does nothing for Goal commit

### 2. Commit On `ResponseEvent::Created`

In the event loop:

```rust
ResponseEvent::Created => {
    if let Some(commit) = goal_request_commit.take() {
        goal_cadence::commit_goal_request(sess.as_ref(), turn_context.as_ref(), commit).await?;
    }
}
```

Requirements:

- commit runs at most once per attempt
- commit happens before later output item processing
- if commit fails, return an error rather than silently losing state
- if the stream ends before Created, no commit occurs

### 3. Consume Pending Intent By Exact Key

Implement `goal_cadence::commit_goal_request(...)`.

For `Initial`, `ObjectiveUpdated`, and `BudgetLimit`:

- verify the commit metadata still refers to the selected final item
- call `consume_pending_intent_exact(thread_id, goal_id, kind, facts_version)`
- if exact-key consumption returns false, do not consume any other intent or
  treat a different key as delivered; return a recoverable no-op only when a
  re-read proves the exact intent is already absent or superseded, otherwise
  surface an error and test that policy in 02f

For `BudgetLimit`:

- clear superseded Initial and ObjectiveUpdated rows for the same Goal when
  required by Batch 01 state API

For `Continuation`:

- do not advance watermark in Batch 02
- either reject Continuation commits or leave a `debug_assert`/error path that
  Batch 03 replaces

### 4. Record Committed Carry Metadata

Add a carry shape equivalent to:

```rust
pub(crate) struct CommittedGoalRequestCarry {
    pub turn_id: String,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
}
```

Add methods equivalent to:

```rust
TurnState::record_committed_goal_request_carry(...)
TurnState::committed_goal_request_carry(...)
InputQueue::record_committed_goal_request_carry(...)
Session::record_committed_goal_request_carry(...)
Session::committed_goal_request_carry(...)
```

Requirements:

- carry records metadata only
- carry does not store `ResponseInputItem`
- carry does not store rendered prompt text as authority
- carry cannot create new cadence intent
- carry may later support mid-turn compaction repair

### 5. Do Not Remove Old Concrete Carry Yet

Keep existing old carry methods compiling:

- `append_current_turn_goal_steering_items(...)`
- `current_turn_goal_steering_items(...)`
- `inject_goal_response_items(...)`

02e and later batches will reduce usage. Batch 05 converts compaction
consumers. Batch 06 deletes dead old carry.

This slice only introduces committed carry and makes finalizer-owned commit
record it.

## Focused Tests

Add unit or integration tests for:

- `goal_cadence_created_commit_consumes_initial_by_exact_key`
- `goal_cadence_created_commit_consumes_objective_updated_by_exact_key`
- `goal_cadence_created_commit_consumes_budget_limit_and_clears_superseded`
- `goal_cadence_no_created_event_leaves_pending_intent`
- `goal_cadence_created_commit_records_committed_carry_metadata`
- `goal_cadence_committed_carry_does_not_expose_response_input_item`

Full retry-before/after-Created behavior belongs to 02f, but this slice should
have enough coverage to prove the commit primitive.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-core --lib goal_cadence_created_commit
```

If tests are in the integration suite:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority_created_commit
```

Do not run broad workspace suites by default.

## Acceptance Criteria

This slice is complete when:

- `try_run_sampling_request(...)` receives per-attempt commit metadata
- `ResponseEvent::Created` commits selected Goal delivery at most once
- pending Initial / ObjectiveUpdated / BudgetLimit is consumed by exact key
  only after Created
- stream failure before Created leaves pending intent intact
- committed carry metadata is recorded after Created
- committed carry does not contain `ResponseInputItem`
- Continuation commit remains inactive until Batch 03

## Non-Goals

This slice does not:

- convert core producers
- delete old concrete carry
- rewrite compaction consumers
- implement automatic Continuation watermarking
- add full retry request-payload acceptance tests

## Partial Landing Constraints

02d may land after 02c before 02e only if finalizer-owned pending-intent
delivery is marked incomplete until core producers are converted.

If old core producers are converted in the same PR, satisfy 02e. If the full
request-payload/retry acceptance matrix is added, satisfy 02f.
