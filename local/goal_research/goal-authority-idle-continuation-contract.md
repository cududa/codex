# Goal Authority Idle Continuation Contract

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative.

- Role: focused idle lifecycle contract for `MaybeContinueIfIdle`.
- Owns: legal callers, stage order, pending non-Goal work precedence, pending
  durable cadence intent delivery, automatic Continuation eligibility,
  lock/reservation behavior, resume hydration, external mutation ordering, and
  idle acceptance tests.
- Does not own: active steering shape, the final request-input authority seam,
  durable storage details, or classifier architecture.
- Read after: `goal-authority-grounding-truth.md` and
  `goal-authority-primary-cadence-contract.md`.
- Current terrain anchors: `codex-rs/core/src/goals.rs`,
  `codex-rs/core/src/session/input_queue.rs`, and
  `codex-rs/core/src/state/turn.rs`.
- Fidelity note: do not call pending Initial, ObjectiveUpdated, or BudgetLimit
  delivery automatic Continuation merely because it is launched from the idle
  hook.

## Purpose

This document defines the `MaybeContinueIfIdle` contract for Goal authority.

`MaybeContinueIfIdle` is an idle lifecycle hook. It is not merely "maybe start
automatic Continuation."

The hook exists to order three possible wake sources without turning ordinary
user turns into cadence events:

```text
idle lifecycle hook
  -> run pending user/mailbox/queued work first
  -> if idle, deliver pending durable Goal cadence intent
  -> if still eligible, maybe launch automatic Continuation
```

This document conforms to:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`

It does not redefine active Goal steering shape. Active Goal steering remains
developer-role model input established at the final request-input shaping
point.

## Non-Negotiables

The idle hook must honor these decisions:

- ordinary user turns are not cadence events
- active durable Goal state alone must not emit Goal steering
- Initial, ObjectiveUpdated, and BudgetLimit are persisted pending cadence
  intent until final model request input contains the matching outer
  developer-role Goal item
- automatic Continuation uses runtime-only duplicate-suppression watermarking
- pending durable cadence intent outranks automatic Continuation
- pending user/mailbox/queued work outranks Goal-owned synthetic turns
- resume hydrates durable state and pending intent; it does not create Initial
- request repair remains a seam backstop, not the cadence mechanism
- legacy `<goal_context>` remains artifact handling only

## Semantic Contract

The existing external name may remain `MaybeContinueIfIdle`, but the semantic
operation is:

```text
run_idle_goal_lifecycle_if_idle
```

It may start a turn for one of three reasons:

1. pending non-Goal work needs a regular turn
2. pending durable Goal cadence intent needs delivery
3. automatic Continuation is due

Only the third reason is a Continuation.

An implementation must not name or treat pending Initial, ObjectiveUpdated, or
BudgetLimit delivery as automatic Continuation merely because it happens from
the idle hook.

## Legal Callers

The idle hook may be called when runtime has reason to believe the thread might
be idle:

- after a turn has finished and the active turn has been cleared
- after a task abort or interrupt has cleared the active turn
- after thread resume has hydrated durable Goal state and app-server resume
  response/snapshot/replay ordering has completed
- after an external Goal mutation has persisted durable Goal state and pending
  cadence intent
- from explicit app-server or thread API hooks that are already ordered after
  resume or mutation side effects

The hook must be idempotent and reentrant. Multiple calls may race or repeat;
the lock, active-turn reservation, pending-work checks, final model request
input construction, and Continuation watermark must prevent duplicate Goal
turns.

The hook must not be used as ordinary user-turn prompt assembly. User turns may
consume pending cadence intent when their final model request input contains
the matching outer developer-role Goal item, but the fact that a user turn
exists is not a Continuation trigger.

## Required Stage Order

The hook must execute in this logical order:

```text
MaybeContinueIfIdle
  -> if active turn exists, return
  -> start pending non-Goal work if it should wake the session, then return
  -> acquire the Goal idle scheduling lock
  -> re-check active turn and pending non-Goal work
  -> deliver pending durable Goal cadence intent if due, then return
  -> re-check active turn and pending non-Goal work
  -> maybe launch automatic Continuation
```

Returning after starting pending work or pending cadence delivery is part of
the contract. A single hook invocation must not start a regular pending-work
turn and then also launch a Goal-owned synthetic turn.

## Stage 1: Pending Non-Goal Work

Pending non-Goal work includes at least:

- queued response items for the next turn
- trigger-turn mailbox input
- future pending-work sources that would normally start a regular turn when
  the session is idle

If pending non-Goal work exists and no turn is active, the hook starts the
regular pending-work turn and returns.

That regular turn may consume pending Initial, ObjectiveUpdated, or BudgetLimit
intent during final model request input construction. If it does, that is cadence
delivery by a pre-existing pending intent, not a Goal reminder caused by the
user/mailbox/queued work.

If that regular turn fails before final model request input contains the
matching outer developer-role Goal item, the pending cadence intent remains
pending.

## Stage 2: Pending Durable Goal Cadence Intent

If no active turn exists and no pending non-Goal work exists, the hook must
check for persisted pending Goal cadence intent.

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

If request construction fails before final model request input contains the
matching outer developer-role Goal item, the pending intent remains pending.

If final model request input contains the matching item but the request is not
submitted to the model client and no equivalent rollout request is recorded,
the pending intent remains pending.

Delivering pending durable cadence intent must not advance the automatic
Continuation watermark.

## Stage 3: Automatic Continuation

Automatic Continuation may run only after both earlier stages decline to start
a turn.

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

After the watermark advances, repeated idle-hook calls with the same
`goal_id`, `model_visible_history_key`, and `durable_facts_version` must not
launch another automatic Continuation. The Continuation steering item in final
model request input must not, by itself, change the key used for that
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

Launching a Goal-owned synthetic turn must not drain newly arrived pending
non-Goal work into that Goal-owned turn. The launch path must either make the
pending-work recheck and task start effectively atomic for queued/mailbox work,
or use a Goal-owned task-start path that refuses or requeues pending non-Goal
work before model submission. Pending user/mailbox/queued work remains regular
pending work and still outranks Goal-owned cadence delivery or automatic
Continuation.

Reservation is not recording. Reservation does not prove the final model
request input contains Goal steering.

If a reserved synthetic Goal-owned turn becomes stale after launch but before
model submission, the abort is an internal lifecycle outcome. It must not send
a model request, consume pending intent, advance the Continuation watermark, or
surface as a user-facing model/request error. The implementation may emit normal
internal tracing or lifecycle cleanup, but it must not present the stale
Goal-owned turn as a failed user turn.

Goal-owned synthetic turn request metadata remains uncommitted scheduling
metadata until one of those outcomes happens. A stale abort clears it without
commit. A successful `ResponseEvent::Created` commit records committed carry
and pending-intent or Continuation suppression effects, then clears or makes
the synthetic request metadata obsolete so same-turn follow-up attempts do not
reuse it as a still-pending Goal-owned request.

## Resume Behavior

Thread resume is hydration, not cadence.

`ThreadResumed` must:

- reload durable Goal facts
- reload persisted pending Initial, ObjectiveUpdated, and BudgetLimit intent
- refresh runtime accounting baselines needed for future Goal usage tracking
- rebuild the Continuation suppression basis from durable Goal facts and
  model-visible rollout history, so unchanged history and unchanged durable
  facts do not permit a duplicate automatic Continuation after resume
- clear stopped-goal runtime state when durable Goal status is not eligible for
  active Goal behavior

`ThreadResumed` must not:

- create Initial intent merely because a durable active Goal exists
- infer pending intent from historical rendered Goal items
- emit active Goal steering
- consume pending intent
- advance the automatic Continuation watermark

The Continuation watermark itself may remain runtime-only, but the key it
compares against must be reconstructable after resume from stable inputs:
current `goal_id`, current durable facts version, and the eligible
`model_visible_history_key` described above. Resume may initialize the in-memory
watermark from the last structurally recorded automatic Continuation metadata
if that is stored, or it may derive an equivalent suppression state from the
current history/facts key. It must not simply empty the watermark in a way that
allows duplicate automatic Continuation when no eligible model-visible history
or durable facts changed.

After resume response/snapshot/replay ordering completes, callers may invoke
`MaybeContinueIfIdle`.

That later idle hook may:

- start pending non-Goal work first
- deliver pending Initial that already existed before resume
- deliver pending ObjectiveUpdated or BudgetLimit intent that already existed
  before resume
- launch automatic Continuation only if the Continuation predicate allows it

An active Goal whose Initial was already consumed before resume must not
receive another Initial unless a real persisted pending Initial intent still
exists.

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

If same-turn injection is unavailable or rejected because the injection phase is
closed, the pending intent remains for a later ordinary user turn or idle-hook
cadence-delivery turn.

ObjectiveUpdated and BudgetLimit must not be dropped merely because no turn was
active at mutation time.

## Request Repair Interaction

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

## Current Terrain To Replace

The current code has useful terrain:

- `GoalRuntimeEvent::ThreadResumed` and
  `GoalRuntimeEvent::MaybeContinueIfIdle` are already distinct events.
- `maybe_continue_goal_if_idle_runtime()` already attempts pending work before
  Goal continuation.
- `continuation_lock` and reserved `ActiveTurn` shape are useful as a
  scheduling pattern.
- app-server resume already calls idle continuation after resume
  response/snapshot/replay ordering.

The current code also has terrain that must not become the design:

- resume marks Initial pending for any active Goal
- Initial pending state is runtime-only
- ObjectiveUpdated and BudgetLimit steering can be dropped after failed
  same-turn injection
- pending durable cadence intent is not represented as structured durable state
- automatic Continuation duplicate suppression is not the explicit
  `{ goal_id, model_visible_history_key, durable_facts_version }` watermark
- Goal-owned synthetic turns still use the active Goal-only context path
  covered by the fake-shim removal map
- current-turn carry stores concrete Goal `ResponseInputItem`s before final
  request-input shaping; replacement carry should be metadata/evidence for an
  already finalized request item, not prebuilt authority

## Acceptance Tests

Implementation should include focused tests proving:

- `MaybeContinueIfIdle` starts queued next-turn work before any Goal-owned
  synthetic turn.
- `MaybeContinueIfIdle` starts trigger-turn mailbox work before any Goal-owned
  synthetic turn.
- A pending Initial intent with no pending non-Goal work is delivered by the
  idle hook as Initial, not Continuation.
- A resumed active Goal with already-consumed Initial does not receive another
  Initial.
- A resumed active Goal with persisted pending Initial still receives Initial.
- Pending ObjectiveUpdated intent remains pending when same-turn injection is
  unavailable, then the idle hook delivers it.
- Pending BudgetLimit intent remains pending when same-turn injection is
  unavailable, then the idle hook delivers it.
- BudgetLimit supersedes older Initial or ObjectiveUpdated pending intent for
  the same Goal.
- Pending Initial, ObjectiveUpdated, or BudgetLimit intent suppresses automatic
  Continuation for the same hook opportunity.
- Automatic Continuation launches only when no pending non-Goal work and no
  pending durable cadence intent exists.
- Repeated idle-hook calls with an unchanged Continuation watermark key do not
  launch duplicate Continuations.
- A model-visible history change or durable facts change permits a later
  automatic Continuation.
- If pending work appears after a Goal-owned turn is reserved but before
  launch, the reservation is cleared and no pending intent or watermark is
  consumed.
- If request construction fails before final model request input contains the
  matching outer developer-role Goal item, pending cadence
  intent remains pending and the Continuation watermark does not advance.
- Final model payload tests prove Goal-owned synthetic turns produce exactly
  one developer-role Goal item in final request input and do not emit active
  `<goal_context>` items.
