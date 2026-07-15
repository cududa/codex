# WA04a Adapter Runtime Ordering And Cadence Request Adapter

This implementation pass records the selected Work Area 04 ordering route and
adds or reuses the core metadata-only cadence request adapter that extension
and app-server producers need.

It is an ordered unit on the Goal authority rewrite branch, not a standalone
PR, release unit, or final acceptance checkpoint.

## Direction Lock

Request:

- implement the WA04 entry pass that confirms adapter/runtime conversion as
  the selected v136 route
- add or reuse a producer-facing same-turn cadence recheck adapter that carries
  metadata only
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `rust-v0.136.0` uses the `GoalExtension` / `GoalRuntimeHandle` topology and
  has no `GoalService`
- local `CodexThread::inject_goal_steering_items_into_active_turn(...)`,
  `Session::inject_goal_response_items(...)`, and
  `InputQueue::inject_goal_response_items(...)` accept concrete Goal model
  input today
- local `RegularTask::run(...)` repeats sampling because pending input exists;
  the current exit predicate flows through
  `Session::close_goal_steering_injection_if_no_pending_input(...)` and
  `InputQueue::has_pending_input(...)`
- WA02 owns final request-input shaping and Created-event commit
- WA03 owns `GoalTurnRequest` metadata lifecycle and idle fallback behavior

Code-shape temptation:

- introduce `ext/goal/src/api.rs` or a v139/v140-style service before v136
  adapter/runtime conversion is proven insufficient
- keep concrete active-turn injection as the wake mechanism because it already
  makes `RegularTask` run again
- expose private `goal_cadence/` policy types directly to every producer

Locked direction:

- use the existing v136 app-server, core, and `ext/goal` adapter/runtime
  topology as the selected route
- add or reuse one public core adapter that translates producer facts into
  turn-local metadata or wake/recheck behavior
- do not add `ext/goal/src/api.rs` in the planned route
- if implementation proves adapter/runtime plus WA01/WA02/WA03 seams cannot
  carry ordering, update the WA04 map and stop before downstream conversion

Exclusions:

- no active Goal `ResponseItem` construction in extension, app-server, or this
  adapter
- no pending-intent consumption
- no Continuation watermark advancement
- no recorded request evidence writer
- no full v139/v140 service adoption

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around these concrete hooks before editing:

- `codex-rs/core/src/codex_thread.rs`
  - `inject_goal_steering_items_into_active_turn(...)`
  - `apply_external_goal_set(...)`
  - `prepare_external_goal_mutation(...)`
- `codex-rs/core/src/session/mod.rs`
  - `inject_goal_response_items(...)`
  - `close_goal_steering_injection_if_no_pending_input(...)`
- `codex-rs/core/src/session/input_queue.rs`
  - `inject_goal_response_items(...)`
  - `extend_goal_pending_input_for_turn_state(...)`
  - `close_goal_steering_injection_if_idle(...)`
  - `has_pending_input(...)`
- `codex-rs/core/src/state/turn.rs`
  - `GoalSteeringCarryPurpose`
  - `GoalSteeringCarryItem`
  - `append_current_turn_goal_steering_items(...)`
- `codex-rs/core/src/tasks/regular.rs`
  - `RegularTask::run(...)`
- `codex-rs/core/src/session/turn.rs`
  - `run_sampling_request(...)`
- `codex-rs/core/src/goal_cadence/`
  - WA02/WA03 request metadata and shaper types, if already present

## Pass Goal

Create the public producer-facing seam that WA04 producers can call:

```text
producer durable mutation/accounting outcome
  -> metadata-only same-turn cadence request or wake/recheck
  -> WA02 request-input shaper reselects from fresh facts
  -> Created-event commit consumes pending intent or records carry
```

The adapter must not let producers pass rendered Goal text, model role, or
prebuilt model input.

## Exact Files To Edit

- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`

If WA03 already added the needed `GoalTurnRequest` APIs, this pass should reuse
them instead of creating parallel metadata.

## Required Edits

1. Record the selected route in code-facing comments or type docs only where
   useful: v136 adapter/runtime conversion is the route; facade/service
   adoption is blocker-only.
2. Add or reuse a typed producer request equivalent to:

   ```rust
   GoalCadenceDeliveryRequest {
       goal_id,
       kind,
       facts_version,
   }
   ```

   The concrete type names should match WA02/WA03 naming if those modules
   already exist.
3. Add a public core adapter, likely on `CodexThread` or translated through
   `ThreadManager`, equivalent to:

   ```rust
   request_goal_cadence_delivery_for_active_turn(...)
   ```

4. Return a clear outcome:

   ```text
   AcceptedForActiveTurn
   NoActiveTurn
   ActiveTurnCannotAccept
   ```

5. On `AcceptedForActiveTurn`, store turn-local metadata only. Do not append
   pending input and do not store rendered Goal prompt text.
6. Replace or augment the current repeat-loop predicate so accepted cadence
   metadata is visible as a recheck reason without representing it as pending
   `TurnInput`, mailbox input, rendered Goal prompt text, `ResponseItem`, or
   `ResponseInputItem`.
7. Ensure accepted metadata can cause the current regular turn to run another
   sampling opportunity when no model/tool follow-up is already pending.
8. Ensure the request-input shaper remains responsible for fresh durable
   snapshot lookup, supersedence selection, item construction, and submit or
   internal-abort outcome.
9. Ensure stale metadata is cleared or made obsolete by the Created-event
   commit path, per WA02/WA03 lifecycle rules.

Stop condition:

- If implementation finds that app-server and extension producers cannot share
  ordering through this adapter plus WA01/WA02/WA03 seams, update
  `04-ext-goal-reachability-and-ordering-map.md` and stop before implementing
  04b-04h. Do not silently add `ext/goal/src/api.rs`.

## Tests And Checks

Focused checks for this pass should cover:

- accepted same-turn cadence request stores metadata and no pending model
  input
- unavailable same-turn request returns a non-success outcome and does not
  clear durable pending intent
- the replacement for
  `close_goal_steering_injection_if_no_pending_input(...)` /
  `has_pending_input(...)` observes accepted cadence metadata as a recheck
  signal without adding pending model input
- accepted metadata makes `RegularTask` perform another sampling opportunity
  when no other follow-up already does that
- request-input shaper reselects from fresh durable state and can decline stale
  metadata

Suggested focused test homes:

- low-level turn/input-queue tests near `core/src/session/input_queue.rs` or
  `core/src/state/turn.rs`
- core integration request-loop tests if the repeat-sampling behavior is not
  practical to prove at unit level

Docs-only planning validation:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

## Branch Continuation State

After this pass:

- WA04 has a selected adapter/runtime route in implementation, not just docs
- producers have a metadata-only way to request same-turn cadence recheck
- final model input construction still belongs to WA02
- idle fallback and stale synthetic turn behavior still belong to WA03
- app-server and extension producers may still call old injection paths until
  later WA04 passes convert them

This branch state is deliberately incomplete. It is not final rewrite
acceptance.

## Non-Goals

- do not convert app-server mutations in this pass
- do not convert extension `create_goal`, ObjectiveUpdated, or BudgetLimit
- do not delete `ext/goal/src/steering.rs`
- do not consume pending intent or advance Continuation watermarks
- do not write recorded request evidence
- do not introduce `ext/goal/src/api.rs` unless the stop condition is met and
  the WA04 map is updated first
