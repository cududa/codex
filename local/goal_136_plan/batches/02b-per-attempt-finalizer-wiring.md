# Batch 02b: Per-Attempt Finalizer Wiring

This slice wires the Batch 02 finalizer seam into every sampling attempt.

The finalizer may be no-op or cleanup-only in this slice. The important
behavior is placement: after the attempt's base input is known and before
`build_prompt(...)`.

## Direction Lock

Request:

- split Batch 02 so request-loop wiring can land before full cadence behavior
- prove the finalizer runs on every attempt, not only the first request
- keep this slice self-contained and grounded in `turn.rs`

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/batches/02a-goal-cadence-module-types.md`

Terrain:

- `run_turn(...)` builds an initial `sampling_request_input` from history.
- `run_sampling_request(...)` receives that initial input but later retry
  attempts rebuild prompt input from history inside its loop.
- `build_prompt(...)` constructs `Prompt { input, ... }`.
- `try_run_sampling_request(...)` receives only a `Prompt`, after the final
  request input has already been chosen.
- `client.rs` copies `Prompt.input` into `ResponsesApiRequest.input`.

Code-shape temptation:

- finalize the `sampling_request_input` in `run_turn(...)`
- finalize inside `client.rs` during request serialization
- run cleanup only on retries because first attempts already have caller input
- start consuming pending intent when the finalizer output is built

Locked direction:

- call `goal_cadence::finalize_goal_request_input(...)` inside
  `run_sampling_request(...)` for every loop attempt
- pass the returned `input` directly to `build_prompt(...)`
- carry returned commit metadata forward without consuming it in this slice
- keep finalizer behavior no-op or cleanup-only until 02c

Exclusions:

- no durable pending-intent selection
- no developer-role Goal item insertion for cadence
- no Created commit
- no producer conversion
- no automatic Continuation

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/codex-api/src/common.rs`
- `codex-rs/core/src/responses_retry.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/tests/common/responses.rs`

Findings to preserve:

- final request input is the `Vec<ResponseItem>` passed to `build_prompt(...)`
- retry attempts rebuild prompt input after the first attempt
- the client layer is too late to be the Goal authority seam
- no commit should occur unless a stream reaches `ResponseEvent::Created`

## Prerequisites And Dependencies

Required:

- 02a has landed, or this slice lands with 02a.

This slice may land independently if:

- the finalizer returns the base input unchanged or with only cleanup behavior
- no pending intent is consumed
- no production Goal producer behavior changes
- tests or compile checks prove placement did not break the request path

## Exact Files To Edit

Expected edits:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`

Possible test edits:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/common/responses.rs`

## Required Edits

### 1. Add A Callable Finalizer Function

In `goal_cadence.rs`, expose a function equivalent to:

```rust
pub(crate) async fn finalize_goal_request_input(
    attempt: GoalRequestAttemptContext,
    base_input: Vec<ResponseItem>,
) -> CodexResult<FinalizedGoalRequestInput>;
```

This slice may implement it as:

- pure no-op: return `base_input`, `None` commit, default repair report
- cleanup-only: remove pure old active Goal artifacts if strict local
  classifier logic already exists

No-op is acceptable for this slice because 02c owns cadence selection.

### 2. Build Attempt Context In `run_sampling_request(...)`

Edit `codex-rs/core/src/session/turn.rs`.

Inside the retry loop:

```rust
let base_prompt_input = if let Some(input) = initial_input.take() {
    input
} else {
    sess.clone_history()
        .await
        .for_prompt(&turn_context.model_info.input_modalities)
};
```

Immediately after that, build a `GoalRequestAttemptContext` from available
typed facts:

- `thread_id` from the session/conversation
- `turn_id` from `turn_context.sub_id`
- no Continuation request in Batch 02
- no fake `model_visible_history_key`
- Goals feature and collaboration-mode eligibility facts for this attempt
- transport facts for the logical request path
- repair context needed for request-local cleanup diagnostics
- cadence snapshot may be `None` until 02c if the finalizer is no-op

Do not read durable state in multiple scattered callsites. If state reading is
needed, keep it as a small helper on `goal_cadence.rs` or a narrow call before
finalizer invocation.

If the attempt is feature-disabled or collaboration-ineligible, the finalizer
must not select or insert active Goal steering. Cleanup-only behavior may still
remove pure old artifacts according to the request-local repair policy.

### 3. Call The Finalizer Before `build_prompt(...)`

Target placement:

```rust
let finalized_goal_input =
    goal_cadence::finalize_goal_request_input(attempt_context, base_prompt_input).await?;

let prompt = build_prompt(
    finalized_goal_input.input,
    router.as_ref(),
    turn_context.as_ref(),
    base_instructions.clone(),
);
```

Requirements:

- the call is inside the retry loop
- retry attempts after stream errors also pass through the finalizer
- `build_prompt(...)` receives only finalized input
- finalizer errors abort the attempt before prompt construction

### 4. Thread Commit Metadata Forward Without Committing

`try_run_sampling_request(...)` will need commit metadata in 02d.

This slice may:

- pass `finalized_goal_input.commit` to `try_run_sampling_request(...)` but not
  act on it
- or leave a TODO and keep `commit` unused only if the compiler permits it

Do not consume pending intent. Do not record committed carry. Do not advance
Continuation watermark.

### 5. Keep Client Serialization Unchanged

Do not edit `client.rs` for Goal shaping.

The client should continue copying `Prompt.input` to
`ResponsesApiRequest.input`. That is how tests prove the finalizer seam works.

## Focused Tests

Preferred minimal test if finalizer is no-op:

- add a unit or integration test that forces one retry before Created and
  verifies the finalizer invocation count through an internal test hook only
  if such a hook is simple and private

If adding a hook would create test-only architecture, do not add the hook.
Instead, keep this slice's proof cheap and explicit:

- if the finalizer is truly no-op and observable request behavior is unchanged,
  run the focused compile check and document that there is no executable
  behavior to assert yet
- if cleanup-only behavior is introduced, add the focused cleanup/retry test in
  this slice
- if the wiring exposes a natural private assertion point without broadening
  the interface, add a narrow test here

02f still owns the representative full retry acceptance matrix, but it should
not be the first proof that this slice's introduced behavior works.

If cleanup-only behavior is implemented, add:

- `goal_authority_finalizer_cleanup_runs_on_retry_attempt`
  - first attempt fails retryably before Created
  - second request has cleanup applied

Do not write final pending-intent assertions in this slice; 02c/02d/02f own
those.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo check -p codex-core --lib
```

If a focused test is added:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority_finalizer
```

Do not run broad workspace suites by default.

## Acceptance Criteria

This slice is complete when:

- `run_sampling_request(...)` invokes the finalizer inside the retry loop
- the call happens after base attempt input is known and before
  `build_prompt(...)`
- `build_prompt(...)` receives finalized input
- client request serialization remains unchanged
- no pending intent is selected or consumed
- no producer conversion is required

## Non-Goals

This slice does not:

- select pending Initial, ObjectiveUpdated, or BudgetLimit
- insert a Goal item for cadence
- commit on Created
- record current-turn carry
- convert core Goal producers
- implement Continuation
- add full request-payload acceptance tests

## Partial Landing Constraints

02b may land after 02a as a no-op or cleanup-only wiring change.

If the finalizer selects pending intent in the same PR, satisfy 02c. If
`ResponseEvent::Created` commits anything, satisfy 02d.
