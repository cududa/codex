# Work Area 03e: Idle Pending Durable Intent Delivery

This ordered pass implements idle Stage 2: when no pending non-Goal work is
waiting, the idle hook may reserve a Goal-owned synthetic turn to deliver
pending Initial, ObjectiveUpdated, or BudgetLimit intent through the WA02
request-input shaper.

## Direction Lock

Request:

- add idle delivery of durable pending cadence intent
- keep it distinct from automatic Continuation
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`

Route context:

- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03c-goal-turn-request-metadata.md`
- `local/goal_136_plan/work-areas/03d-idle-stage-order-refactor.md`

Terrain:

- WA01 owns durable pending intent and exact-key commit consumption
- WA02 owns final request-input selection and Created-event commit for pending
  intent
- `goals.rs` currently uses runtime-only Initial state and concrete
  `GoalContinuationCandidate.items`
- `start_task(turn_context, Vec::new(), RegularTask::new())` is the synthetic
  regular task launch terrain, but the current generic start path drains
  queued next-turn items and mailbox input into the active turn

Code-shape temptation:

- call pending Initial delivery "Continuation" because it is launched by
  `MaybeContinueIfIdle`
- consume pending intent when the idle hook reserves the turn
- inject a prebuilt Goal item into `pending_input`
- assume a pending-work recheck before generic `start_task(...)` is enough even
  though generic task start can drain newly arrived queued/mailbox work into
  the synthetic Goal-owned turn

Locked direction:

- Stage 2 chooses pending durable intent only by snapshot metadata and
  supersedence order
- the reserved turn stores `GoalTurnRequest::IdlePendingCadence`
- the request-input shaper rechecks and commits; the idle hook does not
  consume intent
- the synthetic launch path must not absorb newly arrived pending non-Goal
  work; late queued/mailbox work remains regular pending work

Exclusions:

- no automatic Continuation launch
- no Continuation watermark advancement
- no rendered prompt or prebuilt model input in idle code
- no producer conversion outside idle delivery

## Code Terrain Read

Directly read:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/state/src/runtime/goals.rs`

Observed facts:

- current idle path clears runtime Initial before model submission.
- pending intent must instead remain until the Created-event commit path
  consumes the exact key.
- pending work can appear after reservation and must still outrank the
  Goal-owned synthetic turn.

## Pass Goal

Implement idle Stage 2 for pending durable cadence intent:

```text
read ThreadGoalCadenceSnapshot
choose BudgetLimit > ObjectiveUpdated > Initial
reserve ActiveTurn
store GoalTurnRequest::IdlePendingCadence
create default TurnContext
re-check active Goal, selected pending intent, reservation, and pending work
start Goal-owned task without draining newly arrived queued/mailbox work into
  the synthetic turn
```

## Exact Files To Edit

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/state/src/runtime/goals.rs` only for snapshot call pressure

## Required Edits

Add a Stage 2 helper in `goals.rs` that:

- loads a fresh cadence snapshot
- declines when no pending Initial / ObjectiveUpdated / BudgetLimit intent is
  due
- applies supersedence order `BudgetLimit > ObjectiveUpdated > Initial`
- verifies feature and collaboration-mode eligibility
- reserves an active turn without adding pending input
- stores `GoalTurnRequest::IdlePendingCadence`
- re-reads the snapshot and pending-work state before launch
- makes the pending-work recheck and task start effectively atomic for
  queued/mailbox work, or uses a Goal-owned launch path that refuses or
  requeues newly arrived pending work before model submission
- clears reservation and metadata when the candidate becomes stale

Ensure the WA02 request-input shaper:

- receives the fresh snapshot and turn metadata
- may select a newer superseding pending kind
- returns `AbortSyntheticGoalTurn` when the synthetic turn has no valid cadence
  item after recheck
- returns commit metadata for the selected pending intent when delivery is
  valid
- after Created-event commit consumes the selected pending intent and records
  committed carry, the uncommitted `IdlePendingCadence` metadata is cleared or
  obsolete before any same-turn follow-up attempt

Remove WA03-owned idle use of:

- `mark_initial_goal_steering_pending(...)`
- `goal_steering_kind_for(...)`
- `take_initial_goal_steering(...)`
- `GoalContinuationCandidate.items`
- `extend_goal_pending_input_for_turn_state(...)`

Old functions may remain only for unconverted terrain awaiting later Work
Areas.

## Tests And Checks

Add focused tests:

- `goal_idle_delivers_pending_initial_as_initial_not_continuation`
- `goal_idle_delivers_pending_objective_updated_after_injection_unavailable`
- `goal_idle_delivers_pending_budget_limit_and_supersedes_older_intent`
- `goal_idle_pending_durable_intent_suppresses_automatic_continuation`
- `goal_idle_pending_intent_stale_after_reservation_aborts_before_submit`
- `goal_idle_pending_intent_late_pending_work_is_not_drained_into_synthetic_turn`

Request tests should inspect captured `/responses` input for exactly one
outer developer-role Goal `ResponseItem` when delivery occurs.
Late pending-work tests should prove queued next-turn or trigger-turn mailbox
input stays regular pending work rather than becoming input to the Goal-owned
synthetic cadence-delivery turn.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle_delivers_pending
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, pending durable Initial / ObjectiveUpdated / BudgetLimit
intent can be delivered from the idle hook without being automatic
Continuation. Automatic Continuation may still be inactive until 03f/03g.

The branch is still not a final accepted Goal rewrite.

## Non-Goals

This pass does not:

- persist pending Continuation intent
- launch automatic Continuation
- advance the Continuation watermark
- consume pending intent before `ResponseEvent::Created`
- convert `ext/goal` producers
- finish broad compaction or classifier cleanup
