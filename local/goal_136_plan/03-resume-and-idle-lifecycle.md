# 03 Resume And Idle Lifecycle

This slice wires resume and idle behavior against the cadence model introduced
by the earlier slices.

It must not recreate runtime-only Initial, turn resume into a cadence event, or
let automatic Continuation outrank pending user/mailbox work or pending durable
cadence intent.

## Authority Inputs

Read first:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`

## Goals

- Make resume hydration-only for Goal steering.
- Reload durable Goal facts and pending cadence intent without fabricating
  Initial.
- Seed Goal accounting and automatic Continuation suppression from durable
  state and committed records.
- Make pending non-Goal work run before any Goal-owned synthetic turn.
- Deliver pending durable cadence intent before automatic Continuation.
- Add the automatic Continuation candidate key and runtime suppression.
- Clear stale reservations without consuming pending intent or advancing the
  Continuation watermark.

## Resume Behavior

Owner terrain:

- `codex-rs/core/src/goals.rs::restore_thread_goal_runtime_after_resume`
- `codex-rs/core/src/codex_thread.rs::apply_goal_resume_runtime_effects`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs::emit_resume_goal_snapshot_and_continue`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs::handle_pending_thread_resume_request`

Required behavior:

- Resume reloads durable Goal facts.
- Resume reloads pending Initial, ObjectiveUpdated, or BudgetLimit intent.
- Resume initializes accounting for an active goal.
- Resume seeds the runtime auto-Continuation watermark from committed
  Continuation records only when the current candidate key matches.
- Resume does not create Initial merely because a durable active Goal exists.
- Resume does not emit active steering.
- Resume does not consume pending intent.
- If pending Initial existed before resume, keep it pending until a later final
  model request contains the matching developer-role Goal item.
- If Initial was already committed before resume and no pending intent exists,
  do not re-emit Initial.
- If pending ObjectiveUpdated or BudgetLimit exists, it outranks automatic
  Continuation after app-server resume response/snapshot/replay ordering.

Keep app-server ordering:

- Cold resume applies runtime effects before sending resume response; sends
  token usage and Goal snapshot; then calls `continue_active_goal_if_idle()`.
- Running-thread resume applies runtime effects before response; sends
  response, usage snapshot, Goal snapshot, and replay; then calls
  `continue_active_goal_if_idle()`.

Resume must distinguish:

- an already-persisted pending Initial intent that existed before resume, which
  remains due until consumed
- an existing active Goal whose Initial item was already consumed before
  resume, which must not receive a new Initial item
- an idle resumed thread with no pending user/mailbox work, which may later
  receive Continuation only through the normal idle predicate

## Idle Lifecycle

Owner terrain:

- `codex-rs/core/src/goals.rs::maybe_continue_goal_if_idle_runtime`
- `codex-rs/core/src/goals.rs::maybe_start_goal_continuation_turn`
- `codex-rs/core/src/tasks/mod.rs::maybe_start_turn_for_pending_work`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

Replace the current sequence with:

```text
MaybeContinueIfIdle
  -> if active turn exists, return
  -> start_pending_work_if_idle(); if Started or ActiveTurnPresent, return
  -> acquire Goal idle scheduling lock
  -> re-check active turn and pending non-Goal work
  -> if eligible pending durable cadence intent exists:
       reserve Goal-owned cadence-delivery turn, then return
  -> re-check active turn and pending non-Goal work
  -> if Continuation candidate key is not suppressed:
       reserve Goal-owned automatic Continuation turn
```

Implementation requirements:

- Change `maybe_start_turn_for_pending_work()` or add a wrapper with a concrete
  result type:

  ```rust
  pub(crate) enum PendingWorkStartOutcome {
      Started,
      Idle,
      ActiveTurnPresent,
  }
  ```

  `Started` means queued response items or trigger-turn mailbox work claimed a
  regular turn. `Idle` means no pending non-Goal work was waiting.
  `ActiveTurnPresent` means the idle hook lost the idle race or a turn already
  existed. `MaybeContinueIfIdle` returns immediately for `Started` and
  `ActiveTurnPresent`; it proceeds to Goal-owned scheduling only for `Idle`.
- Use `GoalRuntimeState::continuation_lock`, or rename it to an idle scheduling
  lock, to protect both pending durable cadence delivery and automatic
  Continuation reservation.
- Re-check active turn, queued next-turn response items, and trigger-turn
  mailbox input after acquiring the lock.
- Pending durable cadence delivery reserves `ActiveTurn::default()`, sets
  `TurnGoalCadenceRequest::PendingIntent { origin: IdleReserved }`, starts a
  regular default turn, and returns.
- Automatic Continuation computes candidate key
  `{ goal_id, model_visible_history_key, durable_facts_version }`, compares it
  with runtime watermark, reserves `ActiveTurn::default()`, re-reads durable
  Goal and pending-work state, sets `TurnGoalCadenceRequest::AutoContinuation`,
  starts a regular default turn, and returns.
- If pending non-Goal work appears after reservation but before launch, clear
  the reserved turn and return.
- If durable Goal changes after reservation but before launch, clear the
  reserved turn and return.
- Do not consume pending intent or update the Continuation watermark during
  selection, rendering, reservation, or launch.
- Update the Continuation watermark only from the finalizer commit on
  `ResponseEvent::Created`.
- If a Goal-owned request fails before `ResponseEvent::Created`, the next idle
  hook may retry because pending intent and watermark state were not advanced.

## Pending Durable Cadence Delivery

Eligible pending intent kinds are:

- Initial
- ObjectiveUpdated
- BudgetLimit

Continuation is not persisted pending intent.

When more than one pending intent is possible, choose by the cadence contract's
supersedence order:

```text
BudgetLimit
ObjectiveUpdated
Initial
```

Pending durable Goal cadence intent is eligible only when:

- the Goals feature is enabled
- collaboration mode allows Goal steering
- durable Goal state exists
- the pending intent matches the current `thread_id` and `goal_id`
- the durable Goal status permits the selected kind
- the durable facts version matches the intent or the intent has been
  intentionally superseded under the cadence contract
- no active turn or pending non-Goal work appeared during the check

Status eligibility:

- Initial requires the durable Goal to be active.
- ObjectiveUpdated requires the durable Goal to be active.
- BudgetLimit requires durable budget/status state showing that BudgetLimit
  steering is due.

When pending intent is eligible, the hook may reserve a synthetic regular turn
that will construct final model request input containing exactly one
developer-role Goal steering item for the selected pending intent.

That turn is a cadence-delivery turn. It is not automatic Continuation.

The hook must render from durable Goal state, not from the pending intent body,
tool request body, app-server request body, rendered artifact text, or UI
projection.

Pending intent must not be consumed when:

- the intent is selected
- a prompt string is rendered
- a response item is constructed
- a turn is reserved
- active-turn injection is attempted
- an idle hook fires

Pending intent is consumed only when the final model request input contains the
matching Goal steering item as an outer developer-role message.

At that point, the cadence item is recorded as model-visible Goal steering and
the matching pending intent is consumed as the delivered cadence intent.

Delivering pending durable cadence intent must not advance the automatic
Continuation watermark.

## Automatic Continuation

Automatic Continuation may run only after pending non-Goal work and pending
durable cadence intent both decline to start a turn.

A Continuation candidate is eligible only when:

- no active turn exists
- no queued response items should wake a regular turn
- no trigger-turn mailbox input should wake a regular turn
- no pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- the Goals feature is enabled
- collaboration mode allows Goal steering
- durable Goal state exists and is active
- the active Goal remains current after turn reservation
- the runtime Continuation watermark does not suppress the candidate

The Continuation candidate key is the logical equivalent of:

```text
{
  goal_id,
  model_visible_history_key,
  durable_facts_version,
}
```

`model_visible_history_key` must represent model-visible rollout history
changes that can justify another automatic Continuation. The automatic
Continuation steering item itself must not be the history change that justifies
another automatic Continuation. A later assistant output, tool result, user
item, mailbox item, or other non-Continuation-steering model-visible change may
justify a later Continuation.

The current `ContextManager::history_version()` is not enough by itself. It is
a rewrite counter, not a complete key for model-visible work progress.

Acceptable implementations include a monotonic rollout/history generation that
excludes the just-recorded automatic Continuation steering item for this
purpose, the last persisted model-visible non-Continuation-steering item id
plus a compaction generation, or an equivalent stable fingerprint of the
model-visible history used for the next request. UI projection counts, raw
notification counts, and the id of the Continuation steering item itself are
not sufficient.

`durable_facts_version` must change when durable Goal facts change in a way
that can justify another automatic Continuation.

The automatic Continuation watermark advances only after the Continuation item
appears in final model request input as an outer developer-role message.

The watermark must not advance when:

- an idle hook merely fires
- a candidate is selected
- a response item is constructed
- a turn is reserved
- the active Goal changes before launch
- pending non-Goal work appears before launch
- request construction fails before final model request input contains the
  Continuation item as an outer developer-role message
- final model request input contains the Continuation item, but the request is
  not submitted to the model client and no equivalent rollout request is
  recorded

After the watermark advances, repeated idle-hook calls with the same `goal_id`,
`model_visible_history_key`, and `durable_facts_version` must not launch
another automatic Continuation. The Continuation steering item in final model
request input must not, by itself, change the key used for that
duplicate-suppression decision.

## Lock And Reservation

Goal-owned stages must be protected by a Goal idle scheduling lock.

The lock protects:

- pending durable cadence intent delivery
- automatic Continuation candidate selection
- synthetic Goal-owned turn reservation

The lock does not make a stale candidate valid. The implementation must re-read
or re-check:

- active turn state after acquiring the lock
- pending non-Goal work after acquiring the lock
- durable Goal state after reservation and before launch
- pending cadence intent after reservation when delivering pending intent
- Continuation watermark after reservation when launching Continuation

If an active turn or pending non-Goal work appears after reservation but before
launch, the reserved turn must be cleared and the hook must return without
consuming pending intent or advancing the Continuation watermark.

Reservation is not recording. Reservation does not prove the final model
request input contains Goal steering.

## External Goal Mutation Behavior

External Goal mutation must order side effects as:

```text
account in-flight Goal usage if needed
persist durable Goal mutation
persist pending cadence intent when mutation creates Initial,
  ObjectiveUpdated, or BudgetLimit work
try same-turn injection only if an active turn can still accept it
leave pending intent intact if same-turn injection is unavailable
run pending non-Goal work before any Goal-owned synthetic turn
```

If same-turn injection succeeds, the pending intent is still consumed only when
that active turn's final model request input contains the matching outer
developer-role Goal item.

If same-turn injection is unavailable or rejected because the injection phase
is closed, the pending intent remains for a later ordinary user turn or
idle-hook cadence-delivery turn.

ObjectiveUpdated and BudgetLimit must not be dropped merely because no turn was
active at mutation time.

## Repair Interaction

The idle hook is cadence scheduling. Request repair is seam repair.

A request-local repair item may be inserted into a request created by the idle
hook only when a seam would otherwise lose, stale, duplicate, or downgrade
cadence-required Goal authority.

Request-local repair must not:

- create pending cadence intent
- consume pending cadence intent unless it is explicitly delivering that
  pending intent
- advance the automatic Continuation watermark
- persist a new rollout item merely because durable active Goal state exists

Repair may record only in the narrow cases allowed by the primary cadence
contract: normal cadence consumption or structured reconstruction of a
previously recorded cadence item.

## Verification

- resume with active goal and no pending intent does not create Initial
- resume with pending Initial keeps it pending until final request delivery
- already consumed Initial is not re-emitted after resume
- pending queued input outranks Goal-owned synthetic turns
- trigger-turn mailbox input outranks Goal-owned synthetic turns
- pending Initial/ObjectiveUpdated/BudgetLimit idle delivery is not
  Continuation
- pending ObjectiveUpdated intent remains pending when same-turn injection is
  unavailable, then the idle hook delivers it
- pending BudgetLimit intent remains pending when same-turn injection is
  unavailable, then the idle hook delivers it
- BudgetLimit supersedes older Initial or ObjectiveUpdated pending intent for
  the same Goal
- pending Initial, ObjectiveUpdated, or BudgetLimit intent suppresses automatic
  Continuation for the same hook opportunity
- automatic Continuation launches only when no pending non-Goal work and no
  pending durable cadence intent exists
- repeated idle hook with unchanged
  `{ goal_id, model_visible_history_key, durable_facts_version }` does not
  launch duplicate Continuation
- non-Goal-cadence model-visible history change or facts revision change
  permits later Continuation
- if pending work appears after a Goal-owned turn is reserved but before
  launch, the reservation is cleared and no pending intent or watermark is
  consumed
- if request construction fails before final model request input contains the
  matching outer developer-role Goal item, pending cadence intent remains
  pending and the Continuation watermark does not advance

Suggested focused check after Rust edits:

```text
cargo test -p codex-core idle_goal_continuation
```
