# Batch 02f: Request Payload And Retry Tests

This slice adds Batch 02 acceptance tests.

The tests must prove final `/responses` payload authority and Created commit
behavior. They should not assert helper output or rendered old Goal marker
text as authority.

## Direction Lock

Request:

- split Batch 02 tests into their own acceptance slice
- make tests inspect final request payloads, commit behavior, and retry
  behavior
- keep the slice faithful to final request-input authority

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/02a-goal-cadence-module-types.md`
- `local/goal_136_plan/batches/02b-per-attempt-finalizer-wiring.md`
- `local/goal_136_plan/batches/02c-pending-intent-selection-and-insertion.md`
- `local/goal_136_plan/batches/02d-created-commit-and-carry.md`
- `local/goal_136_plan/batches/02e-core-producer-conversion.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- `core/tests/common/responses.rs` exposes
  `ResponseMock::single_request()`, `ResponseMock::requests()`,
  `ResponsesRequest::input()`, `message_input_texts(...)`, and
  `message_input_text_groups(...)`.
- existing tests under `core/tests/suite` inspect captured request payloads.
- existing local session tests still include old `<goal_context>` assertions
  and concrete injection expectations that must not remain as Batch 02
  acceptance pressure.
- retry behavior is driven by stream errors and
  `handle_retryable_response_stream_error(...)`.

Code-shape temptation:

- assert that `goal_cadence.rs` returned a helper item instead of inspecting
  `/responses.input`
- keep old tests that only prove `<goal_context>` appeared somewhere
- test pending intent consumption without proving Created timing
- make retry tests so broad that they become full-suite integration coverage

Locked direction:

- add focused tests that inspect captured final `ResponsesApiRequest.input`
- cover Initial, ObjectiveUpdated, BudgetLimit, cleanup, active-without-pending,
  Created commit, retry before Created, and retry after Created
- rewrite or delete old tests that preserve active `<goal_context>` or
  user-role steering pressure
- keep validation focused

Exclusions:

- no new architecture
- no broad workspace suite
- no product redesign of Goal APIs
- no Batch 03 Continuation acceptance matrix
- no Batch 05 projection/raw/compaction acceptance matrix

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/tests/common/responses.rs`
- `codex-rs/core/tests/suite/additional_context.rs`
- `codex-rs/core/tests/suite/resume.rs`
- `codex-rs/core/tests/suite/client.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/responses_retry.rs`
- `local/goal_research/goal-test-deletion-map.md`

Findings to preserve:

- `ResponsesRequest::message_input_texts("developer")` and
  `message_input_text_groups("developer")` are the primary proof tools.
- `ResponsesRequest::input()` supports structured assertions against all
  input items.
- old tests around `<goal_context>` in `session/tests.rs` should be rewritten
  or removed, not preserved.

## Prerequisites And Dependencies

Required:

- 02a through 02e behavior exists for end-to-end tests.

Earlier slices should already carry cheap proof for their own introduced
behavior. This slice is the representative acceptance pass that ties those
slice-local proofs to final request payloads and retry semantics.

## Exact Files To Edit

Expected edits:

- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/suite/mod.rs` or suite registration file, if needed
- `codex-rs/core/tests/common/responses.rs` if small inspection helpers are
  needed
- `codex-rs/core/src/session/tests.rs` to remove or rewrite old active
  `<goal_context>` assertions

Possible edits:

- focused existing tests in `codex-rs/core/tests/suite/resume.rs`
- focused existing tests in `codex-rs/core/tests/suite/client.rs`

## Required Edits

### 1. Add Goal Authority Test Helpers

In the new or existing test file, add helpers that inspect captured request
input:

- collect developer-role Goal internal-context messages
- assert no developer/user message contains active `<goal_context>`
- assert no user-role active Goal item exists
- assert exactly one current Goal developer item when cadence is due
- assert no Goal item when no cadence is due

Helpers should operate on `ResponsesRequest`, not on `goal_cadence` internals.

### 2. Test Initial Final Payload And Commit

Add:

- `goal_authority_initial_reaches_final_request_as_single_developer_item`

Required assertions:

- create active Goal through the core path
- captured `/responses.input` contains exactly one current Goal developer
  item
- no user-role active Goal item exists
- no `<goal_context>` item reaches the request
- pending Initial intent remains until Created
- after Created, pending Initial is consumed by exact key

### 3. Test ObjectiveUpdated Payload

Add:

- `goal_authority_objective_updated_renders_from_persisted_state`

Required assertions:

- update objective
- captured request renders from persisted durable objective
- request-body archaeology is not used as authority
- pending ObjectiveUpdated is consumed only after Created

### 4. Test BudgetLimit Payload

Add:

- `goal_authority_budget_limit_renders_from_persisted_usage_state`

Required assertions:

- budget crossing persists usage/status first
- captured request renders BudgetLimit from durable facts
- stale Initial or ObjectiveUpdated for the same Goal is cleared after
  committed BudgetLimit
- no old concrete injected item is trusted as authority

### 5. Test Retry Before Created

Add:

- `goal_authority_retry_before_created_keeps_pending_intent`

Required setup:

- first stream attempt fails retryably before `ResponseEvent::Created`
- second attempt succeeds and emits Created

Required assertions:

- first attempt request contains selected developer-role Goal item
- pending intent is still present after pre-Created failure
- retry request also contains selected developer-role Goal item
- pending intent is consumed only after later Created

### 6. Test Retry After Created

Add:

- `goal_authority_retry_after_created_does_not_duplicate_pending_item`

Required setup:

- first stream emits Created and then fails retryably
- retry request is captured

Required assertions:

- pending intent is consumed after first Created
- retry does not emit another pending Initial/ObjectiveUpdated/BudgetLimit item
  solely from active durable Goal state
- finalizer reruns against rebuilt input and committed state

### 7. Test Follow-Up And Cleanup

Add:

- `goal_authority_follow_up_reruns_finalizer_from_rebuilt_history`
- `goal_authority_removes_wrong_role_duplicate_and_legacy_goal_items`
- `goal_authority_active_goal_without_pending_intent_does_not_emit`
- `goal_authority_ineligible_attempt_does_not_emit_or_consume_goal_intent`
- `goal_authority_created_commit_records_committed_carry_metadata`
- `goal_authority_exact_key_commit_mismatch_does_not_consume_other_intent`

Required assertions:

- tool follow-up requests pass through finalizer again
- pure wrong-role, duplicate, stale, legacy, and pre-injected Goal-looking
  items are removed or replaced when cadence is due
- mixed ordinary prose containing marker-like text remains visible
- active durable Goal without pending intent emits no fresh Goal item
- feature-disabled or collaboration-ineligible attempts do not emit active
  Goal items and leave pending intent pending
- committed carry contains metadata and not `ResponseInputItem`
- exact-key commit mismatch cannot consume a newer, older, different-kind, or
  different-Goal pending intent

### 8. Remove Old False-Compatibility Tests

Delete or rewrite tests that assert:

- active `<goal_context>` emission
- `GoalContextRole` as active behavior
- user-role active Goal steering compatibility
- concrete current-turn Goal `ResponseInputItem` carry as authority

Use `local/goal_research/goal-test-deletion-map.md` to decide whether to
delete, restore upstream baseline, or replace.

Do not preserve old tests by changing expected role from user to developer if
the item is still `<goal_context>` or still pre-finalizer concrete carry.

## Focused Tests

Primary command:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority
```

If some tests are kept in `session/tests.rs`:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority
```

Run `just fmt` after Rust edits.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-core --test suite goal_authority
```

Optional focused retry filter if the suite file grows:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority_retry
```

Do not run full crate or workspace suites by default.

## Acceptance Criteria

This slice is complete when tests prove:

- final `/responses.input` contains exactly one selected current
  developer-role Goal item when Initial, ObjectiveUpdated, or BudgetLimit is
  due
- no active Goal item is user-role
- no active Goal item uses `<goal_context>`
- active durable Goal without pending intent emits no Goal item
- pending intent is consumed only after Created
- retry before Created leaves intent pending and retries delivery
- retry after Created does not duplicate pending delivery
- cleanup removes pure stale/wrong-role/duplicate/legacy Goal-looking items
- mixed ordinary prose remains
- committed carry stores metadata, not pre-finalizer model input

## Non-Goals

This slice does not:

- add new cadence policy
- implement automatic Continuation acceptance
- convert `ext/goal`
- finish projection/raw/compaction/reconstruction classifier tests
- run broad suites

## Partial Landing Constraints

02f should land after 02a through 02e for a completed Batch 02 implementation.

Earlier slice tests should stay narrow and local. This slice is where the
Batch 02 acceptance matrix becomes mandatory before claiming Batch 02 complete,
not where previously untested slice behavior should first become observable.
