# Work Area 02 Direct-Split Readiness Check

This pre-pass validates that Work Area 02 can move directly to implementation
pass split planning without a separate appendage map.

It is not an implementation pass doc. It records the request-loop and producer
terrain needed to split the Work Area against actual v136-shaped code.

## Direction Lock

Request:

- complete the WA02 Direct-Split Readiness Check from
  `implementation-prepass-planning-rules.md`
- ground the check in the real request loop, Created-event arm, current-turn
  carry, core producers, and final-payload test helpers
- do not implement Rust code

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/AGENTS.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`

Terrain:

- local `codex-rs/core/src/session/turn.rs` and `rust-v0.136.0` have the same
  important request-loop shape:
  - `run_sampling_request(...)` receives an initial input
  - retry attempts rebuild prompt input inside the loop from
    `sess.clone_history().await.for_prompt(...)`
  - `build_prompt(...)` receives the prompt input directly
  - `try_run_sampling_request(...)` has an empty `ResponseEvent::Created` arm
- `Prompt.input` in `codex-rs/core/src/client_common.rs` is cloned into
  `ResponsesApiRequest.input` by `codex-rs/core/src/client.rs`
- websocket request creation copies the same logical
  `ResponsesApiRequest.input`
- local `codex-rs/core/src/state/turn.rs` and
  `codex-rs/core/src/session/input_queue.rs` carry concrete Goal
  `ResponseInputItem`s as fork-local active-steering terrain
- upstream `rust-v0.136.0` does not have the local Goal-specific carry symbols,
  but it does have user-role internal-context Goal steering terrain in
  `codex-rs/core/src/goals.rs`
- `codex-rs/core/tests/common/responses.rs` already exposes request capture
  helpers for final `/responses` input assertions

Code-shape temptation:

- shape only the first pre-loop request input and miss retry/follow-up attempts
- treat stream setup success as the commit point instead of
  `ResponseEvent::Created`
- preserve the local concrete Goal carry because compaction still reads it
- copy upstream v136 user-role internal-context steering because it is the
  upstream landing topology
- write another broad WA02 map instead of moving to pass split planning

Locked direction:

- WA02 is ready for direct implementation-pass split planning
- split docs should follow the concrete request-loop spine:
  per-attempt request-input shaping before `build_prompt(...)`,
  inert commit metadata carried into `try_run_sampling_request(...)`,
  Created-event commit side effects, committed metadata carry, core producer
  conversion, and final-payload tests
- no separate WA02 map is needed

Exclusions:

- no Rust implementation
- no implementation pass docs in this pre-pass
- no idle automatic Continuation selection or watermark policy
- no `ext/goal` conversion
- no broad classifier/projection/raw/compaction cleanup
- no authority role for recorded request evidence; evidence remains
  metadata-only when it is in scope

## Code Findings

### Request Loop

Local `codex-rs/core/src/session/turn.rs`:

- `run_turn(...)` builds the first `sampling_request_input` from
  `sess.clone_history().await.for_prompt(...)` and passes it into
  `run_sampling_request(...)`.
- `run_sampling_request(...)` stores that value in `initial_input`, then enters
  a retry loop.
- On the first attempt, `prompt_input` is the supplied `initial_input`.
- On later retry attempts, `prompt_input` is rebuilt from
  `sess.clone_history().await.for_prompt(...)`.
- `build_prompt(prompt_input, ...)` is called inside that loop.

`rust-v0.136.0` has the same relevant shape. Therefore the request-input
shaper must be wired inside `run_sampling_request(...)`, inside the retry loop,
after each attempt's base `prompt_input` is known and before
`build_prompt(...)`.

Shaping in `run_turn(...)` would miss retries. Shaping in `client.rs` would be
too late because `Prompt.input` has already been constructed and client code
should not become Goal cadence policy.

### Final Model Input

`codex-rs/core/src/client_common.rs` owns:

```text
Prompt { input: Vec<ResponseItem>, ... }
Prompt::get_formatted_input() -> self.input.clone()
```

`codex-rs/core/src/client.rs` calls `prompt.get_formatted_input()` when
building `ResponsesApiRequest`. `codex-rs/codex-api/src/common.rs` then carries
that exact input as:

```text
ResponsesApiRequest.input: Vec<ResponseItem>
ResponseCreateWsRequest.input: Vec<ResponseItem>
```

There is no later model-role authority layer. The selected active Goal item
must already be a final outer developer-role `ResponseItem` before
`build_prompt(...)` returns its `Prompt`.

### Created-Event Commit

Local and `rust-v0.136.0` `try_run_sampling_request(...)` currently match
`ResponseEvent::Created` with an empty arm.

That arm is the concrete WA02 commit hook:

- `run_sampling_request(...)` allocates the attempt ordinal, assembles
  `GoalRequestContext`, calls `goal_cadence::finalize_request_input(...)`,
  and keeps the returned inert `GoalRequestCommit`.
- `try_run_sampling_request(...)` receives the `Option<GoalRequestCommit>` for
  that exact attempt.
- the `ResponseEvent::Created` arm consumes the commit metadata and executes
  side effects.

Commit must not occur when `client_session.stream(...)` returns a stream but
the stream fails or closes before `ResponseEvent::Created`.

### Current-Turn Carry

Local fork terrain currently carries pre-shaper Goal model input:

- `TurnState.current_turn_goal_steering_items:
  Vec<GoalSteeringCarryItem>`
- `GoalSteeringCarryItem { purpose, item: ResponseInputItem }`
- `InputQueue::inject_goal_response_items(...)` appends these items to
  turn-local pending input and carry
- `InputQueue::extend_goal_pending_input_for_turn_state(...)` does the same
  for reserved Goal continuation turns
- `Session::current_turn_goal_steering_items()` exposes the concrete items
- local and remote mid-turn compaction append those concrete items into
  replacement history

`rust-v0.136.0` does not have this local Goal-specific carry. Upstream v136
uses ordinary pending input for Goal steering.

WA02 split docs should replace the local carry path with committed metadata
for a Goal item that already reached final request input and then reached the
Created-event commit point. The replacement carry belongs in
`core/src/state/turn.rs` plus `Session` / `InputQueue` adapters, but it must
not store rendered Goal text or prebuilt `ResponseInputItem`s as authority.

Compaction consumers may not be fully removed in WA02. The split should
introduce committed metadata carry and leave old compaction cleanup/removal to
WA05/WA06 unless the specific pass also owns that cleanup.

### Core Producers

Local `codex-rs/core/src/goals.rs` currently has fork-local active steering
terrain:

- `GoalSteeringMessage::into_response_input_item(...)` wraps prompt text with
  `GoalContext::new(prompt).into_response_input_item(...)`
- `apply_external_thread_goal_status(...)` injects ObjectiveUpdated Goal
  steering into the active turn
- `account_thread_goal_progress(...)` injects BudgetLimit Goal steering into
  the active turn
- create/set paths call `mark_initial_goal_steering_pending(...)`, and the
  current idle/pending path later turns Initial or Continuation into concrete
  Goal input
- `maybe_continue_goal_if_idle_runtime(...)` and
  `goal_continuation_candidate_if_active(...)` build Initial/Continuation
  concrete input and reserve/start a Goal-owned turn

Upstream `rust-v0.136.0` is different but still authority-conflicting:

- it uses `ContextualUserFragment::into(InternalModelContextFragment(source =
  "goal", ...))`
- that helper path is user-role model input
- it injects concrete Goal `ResponseItem`s before final request-input shaping

WA02 split docs should convert core Initial, ObjectiveUpdated, and BudgetLimit
delivery to durable pending intent plus final request-input shaping. Idle
automatic Continuation reservation/selection remains WA03. Reachable
`ext/goal` producer conversion remains WA04.

### Final-Payload Test Terrain

`codex-rs/core/tests/common/responses.rs` already supports final request
payload assertions:

- `ResponseMock::single_request()`
- `ResponseMock::requests()`
- `ResponsesRequest::input()`
- `ResponsesRequest::message_input_texts(role)`
- `ResponsesRequest::message_input_text_groups(role)`

These helpers exist in `rust-v0.136.0` as well. WA02 tests should inspect the
captured `/responses` input and request count/order. They should not prove
helper output, classifier output, raw notifications, rollout trace payloads,
or ordinary rollout `ResponseItem`s as substitutes for final request input.

## Required Readiness Answers

### Where does the request-input shaper run on every retry/follow-up attempt?

Inside `codex-rs/core/src/session/turn.rs`:

```text
run_sampling_request(...)
  loop {
    let prompt_input = first supplied input or rebuilt history.for_prompt(...)
    let attempt_ordinal = ...
    let goal_request_context = ...
    let finalized =
        goal_cadence::finalize_request_input(prompt_input, goal_request_context)
    let prompt = build_prompt(finalized.input, ...)
    try_run_sampling_request(..., finalized.commit, &prompt, ...)
  }
```

This placement covers:

- the first request attempt
- retry attempts that rebuild input from history
- same-turn follow-up sampling after tool output or pending input causes
  another loop through request construction

### Where is the Created-event commit handler wired?

In `try_run_sampling_request(...)`, in the existing
`ResponseEvent::Created` match arm.

The function should accept the inert `GoalRequestCommit` produced for the same
attempt. The Created-event handler may call session/state adapters to consume
exact-key pending intent, append committed metadata where in scope, and record
committed current-turn carry. It must not reselect cadence or rebuild the Goal
item.

### What metadata moves through current-turn carry?

Current terrain carries:

```text
GoalSteeringCarryPurpose
ResponseInputItem
```

WA02 replacement carry should move only committed metadata, logically:

```text
turn_id
attempt_ordinal
goal_id
kind
facts_version
model_visible_history_key when available
item_fingerprint
request_input_fingerprint
item_index
```

The carry means a finalized request attempt already contained the selected
Goal item and reached the Created-event commit point. It is not durable Goal
state, not pending cadence intent, not recorded request evidence by itself,
and not a prebuilt model input item.

### Which core producers still create pre-shaper Goal model input?

Current local producers and adapters:

- `GoalSteeringMessage::into_response_input_item(...)`
- `Session::inject_goal_response_items(...)`
- `InputQueue::inject_goal_response_items(...)`
- `InputQueue::extend_goal_pending_input_for_turn_state(...)`
- `CodexThread::inject_goal_steering_items_into_active_turn(...)`
- ObjectiveUpdated injection in `apply_external_thread_goal_status(...)`
- BudgetLimit injection in `account_thread_goal_progress(...)`
- Initial/Continuation concrete input construction in
  `goal_continuation_candidate_if_active(...)`

WA02 should convert the core Initial, ObjectiveUpdated, and BudgetLimit paths.
WA03 owns automatic Continuation. WA04 owns `ext/goal` reachability and
conversion.

### Which tests inspect final request input rather than helper output?

Use core integration tests with `core/tests/common/responses.rs` request
capture helpers. The strongest home is a focused
`codex-rs/core/tests/suite/goal_authority.rs`, with any lower-level pure
module tests kept close to `core/src/goal_cadence/` only for shaper-local
selection, cleanup, fingerprint, or commit primitive behavior.

Final authority tests must assert captured `ResponsesApiRequest.input`,
including exact role and count. They should reject:

- helper-rendered Goal text
- pre-shaper `ResponseInputItem`
- classifier matches
- raw response item notifications
- ordinary rollout `ResponseItem`
- rollout trace payloads
- rendered Goal text parsed from history

as substitutes for final request input or structured commit metadata.

## Direct Split Spine

WA02 does not need a separate map before split docs. A code-grounded direct
split should follow this spine, adjusting names only after the split-planning
pass rereads the same terrain:

1. `core/src/goal_cadence/` module and pure request-shaping primitives:
   cadence kinds, context, outcome, selected item construction, cleanup report,
   item/request fingerprints, and inert commit metadata.
2. Per-attempt wiring in `session/turn.rs`: allocate attempt ordinals, assemble
   a fresh `GoalRequestContext`, call the shaper inside the retry loop before
   `build_prompt(...)`, and handle internal abort-before-submit outcomes.
3. Created-event commit execution: pass commit metadata into
   `try_run_sampling_request(...)`, consume exact-key pending intent after
   `ResponseEvent::Created`, and keep durable state as live correctness owner.
4. Committed carry metadata: add metadata-only carry in `state/turn.rs` and
   session/input-queue adapters; leave old concrete carry deletion to the
   cleanup work unless the pass fully removes a now-dead local callsite.
5. Core Initial, ObjectiveUpdated, and BudgetLimit producer conversion in
   `goals.rs`: durable pending intent plus metadata recheck/wake behavior, no
   active `GoalContext` / `ResponseInputItem` injection for converted paths.
6. Final-payload and retry/follow-up tests: captured `/responses` input proves
   exactly one selected outer developer-role Goal `ResponseItem`, Created
   commit timing, retry-before-Created retention, retry-after-Created
   non-duplication, follow-up reshaping, cleanup of pre-injected Goal-looking
   items, and active Goal without pending intent emitting nothing.

Recorded request evidence should be split only where the implementation also
has the matching commit metadata, request-input fingerprint, selected-item
fingerprint, and Created-event writer. If a pass defers the typed evidence
carrier, it must leave durable state as the correctness owner and keep the
evidence deferral explicit.

## Authority Compatibility Check

This readiness check is consistent with `local/goal_research`:

- it keeps final request input as the active Goal authority seam
- it places request-input shaping inside the retry loop before
  `build_prompt(...)`
- it keeps `ResponseEvent::Created` as the commit point
- it treats current `GoalContext`, user-role internal-context steering,
  concrete Goal `ResponseInputItem` injection, and concrete current-turn carry
  as terrain to replace
- it leaves idle automatic Continuation selection and watermark policy to WA03
- it leaves `ext/goal` producer conversion to WA04
- it keeps classifier, raw notification, compaction, and projection cleanup
  outside WA02 except for request-local cleanup performed by the shaper
- it treats recorded request evidence as structured Created-event metadata,
  not as authority, durable facts, repair authority, or rendered-text recovery

## Proceed Criteria

WA02 is ready for direct implementation-pass split planning.

The split-planning pass should read this readiness note, the WA02 parent doc,
the authority docs named here, and the concrete code terrain above. It should
then write ordered implementation pass docs using
`implementation-pass-planning-rules.md`.

No WA02 appendage map is required unless a later code walk discovers a new
request-loop or producer path that changes the hooks above.

## Validation

Docs-only validation for this pre-pass:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```
