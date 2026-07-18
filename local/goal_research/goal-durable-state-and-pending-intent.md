# Goal Durable State And Pending Intent

## Navigation Header

This successor doc is the durable-state contract for Goal facts and pending
non-Continuation intent. It answers what state must persist, what state may
clean up, and what state must never claim to prove.

- Role: canonical durable state contract for current Goal facts, durable facts
  versioning, pending non-Continuation intent, exact-key consumption, and
  state-owned Continuation suppression records.
- Owns: durable Goal facts; durable facts version; structured pending Initial,
  ObjectiveUpdated, and BudgetLimit intent; atomic facts-plus-intent mutation;
  mechanical supersedence cleanup; exact-key pending-intent consumption; and
  durable storage of the latest automatic Continuation suppression record when
  that route is selected.
- Does not own: active model authority, cadence selection, model role
  selection, prompt rendering, final request-input shaping, commit metadata,
  idle scheduling, model-visible history-key construction, request repair,
  recorded request evidence, extension lifecycle, or the replacement test
  matrix.
- Primary pointers: `goal-cadence-contract.md` for cadence selection,
  `goal-final-request-input.md` for commit-time consumption, and
  `goal-idle-history-lifecycle.md` for Continuation selection and suppression
  comparison.
- Fidelity note: do not turn durable state into model authority or cadence.
  State stores current facts and structured pending work; another owner must
  decide and prove what reached final model request input.

## Core Rule

Durable state is the live source of current Goal facts and pending
non-Continuation cadence intent. It is not the authority proof, cadence
selector, prompt renderer, repair engine, evidence carrier, or idle scheduler.

State must preserve enough structured data for the final request-input owner
to render and commit the selected current Goal item. State must not render
that item, choose its model role, decide that a request opportunity should
carry Goal steering, or treat an active durable Goal as model-visible steering
by itself.

If durable structured Goal facts are absent, runtime must not resurrect an
active Goal from historical rendered text, rollout items, raw notifications,
projection output, trace payloads, classifier matches, tool output, or
recorded request evidence.

## Durable Goal Facts

Durable Goal facts are the persisted source of current Goal state:

- thread and Goal identity
- objective text
- status and active run state
- budget, usage, and limit facts
- timestamps and other factual product state needed by Goal behavior

Current Goal steering text must be rendered from durable facts when cadence
and final request-input owners select a Goal item for a request. It must not
be rendered from tool request bodies, app-server request bodies, UI
projections, historical rendered Goal artifacts, ordinary rollout items, raw
notifications, traces, or pending-intent bodies.

Durable state may expose snapshots of these facts to callers. Those snapshots
are factual data and producer metadata. They are not model input, authority
proof, cadence delivery, recorded request evidence, or committed current-turn
carry.

## Durable Facts Version

State owns a durable facts version that identifies the steering-relevant Goal
facts used by pending intent and Continuation suppression.

The facts version must be durable and monotonic for steering-relevant changes.
It must change when current Goal facts change in a way that can require a
different Goal steering item, including objective replacement and budget or
status changes that affect steering. Product timestamps such as `updated_at`
are useful terrain but must not be the only cadence facts identity unless they
are explicitly made to satisfy the durable, monotonic, steering-relevant
identity contract.

The facts version participates in:

- pending Initial, ObjectiveUpdated, and BudgetLimit intent identity
- exact-key pending-intent consumption
- stale-intent cleanup
- automatic Continuation duplicate suppression with the model-visible history
  key
- resume and restart checks that must not duplicate unchanged Goal steering

Facts-version allocation is a state mutation outcome. Final request-input,
idle lifecycle, history-key, evidence, and extension code may consume the
facts version, but they do not allocate or infer it from rendered text.

## Pending Non-Continuation Intent

Pending Goal intent is structured durable state for the non-Continuation
steering kinds:

```text
Initial
ObjectiveUpdated
BudgetLimit
```

The logical pending-intent identity includes at least:

```text
thread_id
goal_id
kind
facts_version
created_at
```

The concrete schema and Rust names are implementation work. The logical model
is not optional: pending intent is keyed structured state, not rollout text,
rendered internal context, `<goal_context>`, UI metadata, raw response events,
ordinary rollout items, trace payloads, helper output, tool output, or
producer request bodies.

Multiple pending non-Continuation kinds may exist until an explicit
supersedence cleanup or exact commit consumption removes them. Cadence and
final request-input owners decide which eligible kind is selected for a
request opportunity. State stores the facts and pending rows that make that
selection possible.

Continuation is excluded from pending intent. Automatic Continuation is
selected by the idle lifecycle, compared through the history-key contract, and
advanced at final-input commit. It must not be stored as pending
Continuation intent.

Pending Initial, ObjectiveUpdated, and BudgetLimit intent remains pending
until the matching developer-role Goal item reaches final model request input
and the final-input commit rule calls the exact state operation that consumes
the matching key.

Pending intent is not consumed when:

- text is rendered
- a helper creates source-tagged internal context
- a response item is constructed
- same-turn cadence recheck metadata is requested, accepted, rejected, or
  unavailable
- an idle hook fires
- a Goal-owned synthetic turn is reserved
- request shaping selects no Goal item because delivery is ineligible
- request construction fails before matching final input exists
- final input is built but not submitted under the default live-correctness
  policy
- classifier, projection, raw, trace, or rollout surfaces discover
  Goal-looking text

## Atomic Mutation Expectations

State mutations that create cadence work must write Goal facts, allocate the
new durable facts version, and persist the resulting pending intent as one
logical durable mutation. Callers may receive a durable snapshot and pending
intent summary, but those summaries are metadata only.

Creating or replacing an active Goal must:

- write the current Goal facts
- allocate the next durable facts version
- clear stale pending intent for the replaced or deleted Goal when applicable
- persist pending Initial intent for the new active Goal
- return the factual mutation outcome and pending summary

Updating the active objective must:

- verify the current Goal identity and eligible status
- persist the new objective as durable facts
- allocate the next durable facts version
- persist or replace pending ObjectiveUpdated intent for the new facts version
- return the factual mutation outcome and pending summary

Budget or usage accounting that requires model wrap-up must:

- account usage before deciding the durable budget/status result
- persist the updated status, budget, and usage facts
- allocate the next durable facts version when steering-relevant facts changed
- persist or replace pending BudgetLimit intent for the new facts version
- return the factual mutation outcome and pending summary

Terminal, manual, stopped, or delete/clear mutations must update facts and
clear active-state pending intent that can no longer be delivered. Deleting a
Goal must delete or make unreachable all pending intent for that Goal.

State does not decide how, when, or whether the returned pending summary is
delivered. Same-turn delivery requests, idle wakeups, and final shaping are
owned elsewhere.

## Supersedence And Mechanical Cleanup

State may perform mechanical cleanup when a durable mutation makes older
pending intent impossible, stale, or contradictory to the current durable
facts.

Examples of state-owned cleanup include:

- replacing an active Goal clears pending intent for the replaced Goal
- deleting or clearing a Goal clears all pending intent for that Goal
- terminal or stopped statuses clear active-state intent that is no longer
  deliverable
- BudgetLimit mutation may clear older Initial or ObjectiveUpdated intent for
  the same Goal when the older intent cannot be validly delivered after the
  budget/status change

Mechanical cleanup is not cadence selection. State must not choose among
eligible pending intent for a request attempt, convert the cadence ranking into
broad deletion, or treat Continuation as a pending row that supersedes
non-Continuation intent.

Exact commit consumption and mechanical supersedence cleanup are separate
operations. Exact commit consumption proves a specific pending key was
delivered through final input. Supersedence cleanup removes stale work because
durable facts made that work no longer deliverable.

## Exact-Key Consumption

State owns the exact pending-intent consumption operation. Final
request-input commit owns when that operation may be called.

Exact-key consumption must match:

```text
thread_id
goal_id
kind
facts_version
```

It must not consume a newer Goal, an older replaced Goal, a different steering
kind, or a different facts version. It must not collapse to "clear pending
intent" or "mark delivered" without preserving the exact delivered identity.

A final-input commit may also ask state to clear explicitly superseded stale
intent when the cadence and durable contracts allow it. That stale cleanup
must be distinguishable from the exact key consumed for the selected delivered
item.

State must reject or no-op stale consumption attempts in a way callers can
observe. A stale synthetic turn, retry before commit, built-not-submitted
attempt, render-only path, helper-only path, or unavailable same-turn recheck
must leave pending intent intact.

## State-Owned Continuation Suppression Record

Continuation is not pending intent. The default live duplicate-suppression
route stores the latest committed automatic Continuation suppression record in
durable state, or in an equivalent state-owned durable or reconstructable
record with the same failure semantics.

The comparison triple is the logical equivalent of:

```text
goal_id
model_visible_history_key
facts_version
```

When state owns the persisted record, it stores the committed comparison
triple and the commit identity needed for resume or restart, such as the
committed turn identity, selected item fingerprint, and timestamp or
equivalent durable commit metadata supplied by final-input and history owners.

State ownership here is storage ownership. State must not:

- decide automatic Continuation eligibility
- compute the model-visible history key
- render a Continuation item
- construct model input
- advance the record before final-input commit
- treat the record as pending Continuation intent
- treat the record as recorded request evidence

Idle lifecycle owns Continuation selection. The history-key doc owns the
model-visible history key and suppression comparison. The final request-input
doc owns the commit point where a selected Continuation may advance the
record. Evidence may support reconstruction only under its explicit
non-best-effort rules; durable state remains the default live correctness
owner.

Resume and restart must be able to reload durable Goal facts, pending
non-Continuation intent, and the state-owned Continuation suppression basis so
unchanged facts and unchanged model-visible history do not permit duplicate
automatic Continuation. Resume ordering and lifecycle decisions remain owned
by the idle/history docs.

## Logical State Interfaces

The concrete API names are implementation work. The durable state surface must
provide logical equivalents of these operations:

- read current Goal facts with durable facts version
- read pending non-Continuation intent for the current thread and Goal
- create or replace an active Goal and persist pending Initial intent
- update the active objective and persist pending ObjectiveUpdated intent
- account usage or budget/status changes and persist pending BudgetLimit
  intent when due
- mark a Goal terminal, manual, paused, stopped, or cleared while cleaning
  now-undeliverable pending intent
- delete a Goal and all associated pending intent
- clear mechanically superseded pending intent
- consume pending intent by exact key
- read and write the state-owned automatic Continuation suppression record
  when that storage route is selected

These operations may be used by core, app-server, extension, resume, idle, and
final request-input code. They must not require app-server producers to route
through `codex-goal-extension`, and they must not let producers pass rendered
Goal text, a model role, prebuilt model input, or a pending Continuation item.

State API results may include durable snapshots, previous/current fact
summaries, pending-intent summaries, accounting outcomes, and metadata needed
to request same-turn recheck or idle wake behavior. Those results must not be
active `ResponseItem` values, active `ResponseInputItem` values, committed
carry, evidence records, final-input fingerprints, or proof of delivery.

## Primary Pointers

- `goal-authority-behavior.md` owns why durable state alone is not active
  model authority and why rendered-text recovery is forbidden.
- `goal-cadence-contract.md` owns steering-kind ranking and cadence-required
  authority; state stores facts and pending rows, not request selection.
- `goal-final-request-input.md` owns per-attempt finalization and the commit
  call site for exact-key consumption or Continuation suppression advancement.
- `goal-idle-history-lifecycle.md` owns idle selection, model-visible history
  key use, and duplicate-suppression comparison; state owns only the selected
  durable suppression storage route.
- Evidence, cleanup/projection, extension, and test-prep docs own their
  support surfaces without creating durable facts, recovering state from
  rendered text, or replacing pending-intent storage.

## Local Proof Obligations

Durable-state coverage must prove:

- creating or replacing an active Goal persists durable facts, allocates a
  facts version, and persists pending Initial as one logical mutation
- objective changes persist new facts and pending ObjectiveUpdated with a new
  facts version before any delivery attempt
- budget/status accounting persists current usage/status facts and pending
  BudgetLimit before delivery
- ObjectiveUpdated and BudgetLimit remain pending when same-turn recheck
  metadata is unavailable or rejected
- exact-key consumption consumes only the matching thread, Goal, kind, and
  facts version
- stale consumption attempts do not consume newer, different-kind,
  different-goal, or different-version pending intent
- mechanical supersedence cleanup removes only intent made stale by durable
  facts and does not choose eligible request intent
- deleting, replacing, terminal, or stopped mutations clear pending intent
  that can no longer be delivered
- resume reads durable facts, pending intent, and suppression basis without
  fabricating Initial from active state alone
- the state-owned Continuation suppression record round-trips the committed
  comparison triple and does not appear as pending intent or evidence
- state APIs do not render prompts, construct active model input, select model
  roles, choose cadence for a request opportunity, write recorded evidence, or
  consume pending intent without a final-input commit caller

The test-prep successor doc owns how these obligations join the broader final
payload, idle, evidence, extension, cleanup, and UI proof matrix.
