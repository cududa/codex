# Work Area 02c: Per-Attempt Request Loop Wiring

This ordered pass wires the pure shaper into every sampling attempt before
`build_prompt(...)`. It assembles fresh per-attempt context and carries inert
commit metadata forward, but it does not execute Created-event side effects.

## Direction Lock

Request:

- run final request-input shaping for every retry and follow-up sampling attempt
- allocate attempt ordinals before shaping
- pass commit metadata to the stream path without consuming pending intent yet

Authority:

- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02a-goal-cadence-module-and-shaper-primitives.md`
- `local/goal_136_plan/work-areas/02b-final-request-input-shaper.md`

Terrain:

- `core/src/session/turn.rs` owns `run_turn(...)`,
  `run_sampling_request(...)`, `build_prompt(...)`, and
  `try_run_sampling_request(...)`.
- `run_sampling_request(...)` receives initial input, then retry attempts
  rebuild prompt input from `sess.clone_history().await.for_prompt(...)`.
- `try_run_sampling_request(...)` currently has no Goal commit argument.

Code-shape temptation:

- shape only the first input in `run_turn(...)`
- move shaping to `client.rs`, after `Prompt` construction
- allocate attempt ordinals only for attempts that selected Goal cadence
- store prompt text or prebuilt Goal items in turn metadata

Locked direction:

- `session/turn.rs` loads durable snapshots and turn request metadata for each
  attempt
- `goal_cadence::finalize_request_input(...)` remains pure and receives typed
  context
- shaping occurs inside the retry loop, after base input is known and before
  `build_prompt(...)`

Exclusions:

- no Created-event side effects
- no pending intent consumption
- no typed evidence append
- no committed carry storage
- no producer conversion

## Code Terrain Read

Directly read:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/client_common.rs`
- Work Area 01 and 02a/02b APIs

Observed facts:

- retry attempts rebuild base prompt input from history after the first attempt.
- `build_prompt(...)` receives the selected prompt input directly.
- client code is too late for Goal authority because `Prompt.input` has
  already been constructed.

## Pass Goal

Ensure every sampling attempt uses the final request-input shaper before
`Prompt.input` is created.

## Exact Files To Edit

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- nearby session adapter files only if needed to assemble `GoalRequestContext`

## Required Edits

Wire the shaper inside `run_sampling_request(...)`:

- inside the retry loop
- after the attempt's base `prompt_input` is chosen
- before `build_prompt(...)`

Target shape:

```rust
let attempt_ordinal = next_goal_request_attempt_ordinal();
let base_prompt_input = if let Some(input) = initial_input.take() {
    input
} else {
    sess.clone_history()
        .await
        .for_prompt(&turn_context.model_info.input_modalities)
};

let goal_request_context =
    assemble_goal_request_context_for_attempt(attempt_ordinal, ...).await?;
let finalized_goal_input = match goal_cadence::finalize_request_input(
    base_prompt_input,
    goal_request_context,
) {
    GoalFinalizationOutcome::Submit(finalized) => finalized,
    GoalFinalizationOutcome::AbortSyntheticGoalTurn => {
        return Ok(SamplingRequestResult::synthetic_goal_turn_aborted());
    }
};

let prompt = build_prompt(
    finalized_goal_input.input,
    router.as_ref(),
    turn_context.as_ref(),
    base_instructions.clone(),
);
```

Then pass `finalized_goal_input.commit` into `try_run_sampling_request(...)`.

`assemble_goal_request_context_for_attempt(...)` is illustrative, not a
required name. The important boundary is:

- session code loads durable snapshots and turn request metadata
- the shaper receives typed facts
- turn metadata is not stored prompt text, preselected cadence item, or
  authority record

Attempt ordinal rules:

- allocate before calling the shaper for each sampling attempt
- reuse the same ordinal in `GoalRequestCommit` and any future evidence
- do not allocate ordinals only for attempts with selected Goal cadence
- retries and follow-up requests get new ordinals

Do not shape only in `run_turn(...)`; that misses retry attempts. Do not move
the seam into `client.rs`.

## Tests And Checks

Add focused tests if practical in `core/src/session/tests.rs` or the integration
suite for:

- retry attempts call the shaper against rebuilt prompt input
- follow-up sampling after tool output reruns shaping
- attempt ordinals advance per attempt, including attempts with no selected
  Goal item

The final `/responses` payload tests can wait until 02f.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

These checks are the local confidence bar for the 02c slice.

## Branch Continuation State

After this pass, request attempts should be shaped before `build_prompt(...)`,
but `ResponseEvent::Created` still does not consume pending intent or write
evidence. Pending intent may therefore remain after requests until 02d.

The next pass, 02d, executes Created-event commit side effects.

## Non-Goals

This pass does not:

- consume pending intent
- write structured request evidence
- store committed carry
- convert core producers
- implement automatic Continuation
- move request shaping into `goals.rs` or `client.rs`
