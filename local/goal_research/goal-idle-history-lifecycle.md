# Goal Idle History Lifecycle

## Navigation Header

This successor doc is the lifecycle contract for idle Goal work, automatic
Continuation duplicate suppression, and resume/restart interaction with
model-visible history.

- Role: canonical idle/history lifecycle contract for ordered idle work,
  pending durable intent delivery, automatic Continuation selection,
  model-visible history-key projection, suppression comparison, and resume
  hydration.
- Owns: legal idle callers; idle stage order; pending non-Goal work
  precedence; pending Initial, ObjectiveUpdated, and BudgetLimit delivery from
  idle; automatic Continuation selection; Goal-owned synthetic request
  metadata; lock, reservation, stale synthetic abort behavior;
  model-visible history key; eligible progress projection; Continuation
  suppression comparison; resume suppression reconstruction semantics; and
  same-turn metadata routing after external Goal mutation.
- Does not own: behavior-level authority, cadence event definitions, durable
  facts mutation, pending-intent storage, exact-key consumption, final
  request-input insertion, Created-event commit side effects, recorded
  evidence carrier persistence, classifier mechanics, projection/raw behavior,
  extension lifecycle, or the replacement test matrix.
- Primary pointers: `goal-cadence-contract.md` for cadence events,
  `goal-durable-state-and-pending-intent.md` for pending intent and durable
  suppression storage, `goal-final-request-input.md` for commit side effects,
  and `goal-recorded-request-evidence.md` only for explicit non-best-effort
  reconstruction support.
- Fidelity note: keep idle selection, history-key projection, durable
  suppression storage, and final-input commit advancement distinct. The
  pointer pattern is: idle selection; history watermark; final commit advance.

## Core Rule

The idle/history lifecycle orders three possible wake sources:

```text
pending non-Goal work
pending durable Goal cadence intent
automatic Continuation
```

The lifecycle may start a regular pending-work turn, a synthetic regular
cadence-delivery turn for pending non-Continuation intent, or an automatic
Continuation turn. Only the third case is automatic Continuation.

Pending non-Goal work outranks every Goal-owned synthetic turn. Pending
Initial, ObjectiveUpdated, and BudgetLimit intent outranks automatic
Continuation. Ordinary user turns are not cadence events, but a regular turn
may deliver already-pending non-Continuation intent when final request-input
shaping selects it and the request later commits.

Automatic Continuation is selected only by this lifecycle after earlier work
declines. Duplicate suppression compares the current Goal id, the
model-visible history key, and the durable facts version. The Continuation
item itself must not be the history change that permits another automatic
Continuation.

This doc does not prove active Goal authority. Authority is proven only by the
final model request input containing the selected current Goal item as an
outer developer-role model item, with commit side effects owned by the final
request-input doc.

## Idle Hook Semantics

The existing external label may remain `MaybeContinueIfIdle`, but the semantic
operation is:

```text
run_idle_goal_lifecycle_if_idle
```

The hook is lifecycle scheduling. It is not ordinary user-turn prompt
assembly, not a shortcut to automatic Continuation, and not an authority proof.

The hook may run only after runtime has an ordered reason to believe the
thread might be idle:

- a turn finished and the active turn was cleared
- an abort or interrupt cleared the active turn
- resume hydrated durable state and app-server response, snapshot, and replay
  ordering completed
- an external Goal mutation persisted durable state and pending cadence intent
- an explicit thread or app-server API hook ran after the relevant resume or
  mutation side effects

The hook must be idempotent and reentrant. Repeated or racing calls must be
made harmless by active-turn checks, pending-work checks, the Goal idle
scheduling lock, synthetic turn reservation, final request-input construction,
and Continuation suppression comparison.

The hook must not be used to put fresh Goal steering into every ordinary user
turn. A user or mailbox turn can deliver already-pending
Initial/ObjectiveUpdated/BudgetLimit intent only through the final-input
delivery path.

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
the contract. One hook invocation must not start regular pending work and then
also launch a Goal-owned synthetic turn.

## Pending Non-Goal Work

Pending non-Goal work includes:

- queued response items for the next turn
- trigger-turn mailbox input
- future regular pending-work sources that normally start a turn when the
  session is idle

If pending non-Goal work exists and no turn is active, the hook starts the
regular turn and returns.

That regular turn is not automatic Continuation. It may later deliver
already-pending Initial, ObjectiveUpdated, or BudgetLimit intent if final
request-input shaping selects the pending intent and the request commits. If
the regular turn fails before matching final input commits, the pending intent
remains pending under the durable/final rules.

Goal-owned synthetic launch must not drain newly arrived pending non-Goal work
into the synthetic turn. That work remains regular pending work and continues
to outrank Goal-owned cadence delivery or automatic Continuation.

## Pending Durable Intent Delivery

If no active turn exists and no pending non-Goal work exists, the hook checks
for persisted pending Goal cadence intent.

Eligible pending kinds are:

```text
Initial
ObjectiveUpdated
BudgetLimit
```

Continuation is not persisted pending intent.

When more than one pending kind is possible, choose the cadence ranking:

```text
BudgetLimit
ObjectiveUpdated
Initial
```

Pending durable intent is eligible for idle delivery only when:

- the Goals feature is enabled
- collaboration mode allows Goal steering
- durable Goal state exists
- the pending intent matches the current thread and Goal
- the durable Goal status permits the selected kind
- the durable facts version matches the intent or the intent was intentionally
  superseded under the cadence contract
- no active turn or pending non-Goal work appeared during the check

Status eligibility is kind-specific:

- Initial requires an active durable Goal.
- ObjectiveUpdated requires an active durable Goal.
- BudgetLimit requires durable budget/status state showing BudgetLimit
  steering is due.

When the pending intent is eligible, the hook may reserve a synthetic regular
turn whose final request-input shaping will deliver the selected
developer-role Goal item for that pending intent.

That turn is a cadence-delivery turn. It is not automatic Continuation.

The selected item must render from durable Goal facts through the final-input
owner, not from pending intent bodies, producer requests, rendered artifacts,
UI projection, raw notification, rollout items, or helper output.

Pending intent is not consumed when selected, rendered, constructed,
reserved, or attached to same-turn request metadata. Consumption waits for the
matching outer developer-role Goal item to reach final request input and for
the final-input commit rule to call durable exact-key consumption.

If request construction fails before matching final input exists, the pending
intent remains pending. If final input is built but not submitted, pending
intent remains pending under the default live-correctness policy unless an
explicit structured evidence path with equivalent persistence and error policy
records the same committed request.

Delivering pending durable intent must not advance automatic Continuation
suppression.

## Automatic Continuation Selection

Automatic Continuation may run only after pending non-Goal work and pending
durable non-Continuation intent both decline to start a turn.

A Continuation candidate is eligible only when:

- no active turn exists
- no queued response items should wake a regular turn
- no trigger-turn mailbox input should wake a regular turn
- no future pending-work source should wake a regular turn
- no pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- the Goals feature is enabled
- collaboration mode allows Goal steering
- durable Goal state exists and is active
- the active Goal remains current after synthetic turn reservation
- the latest committed automatic Continuation suppression record does not
  suppress the candidate

The candidate comparison key is logically:

```text
{
  goal_id,
  model_visible_history_key,
  durable_facts_version,
}
```

Continuation is not any next request, active Goal existence, a user message, a
request-assembly event, projection hiding, or pending non-Continuation
delivery. It is selected only by the idle lifecycle after all earlier work has
declined.

Selection, rendering, response-item construction, and reservation do not
advance suppression. The final request-input doc owns the commit point where a
selected Continuation may advance the durable or equivalent suppression
record.

## Lock, Reservation, And Synthetic Metadata

Goal-owned stages must be protected by a Goal idle scheduling lock. The lock
protects:

- pending durable cadence intent delivery
- automatic Continuation candidate selection
- synthetic Goal-owned turn reservation

The lock does not make stale candidates valid. After acquiring the lock and
after reservation, lifecycle code must re-check the facts that can invalidate
the candidate:

- active turn state
- pending non-Goal work
- current durable Goal identity and status
- selected pending intent when delivering non-Continuation intent
- Continuation suppression comparison when launching Continuation

If an active turn or pending non-Goal work appears after reservation but
before launch, the reservation is cleared and the hook returns. That path must
not send a model request, consume pending intent, advance Continuation
suppression, write recorded evidence, or surface as a user-facing model or
request error.

Reservation is not recording. It does not prove that final request input
contains Goal steering.

Goal-owned synthetic request metadata is uncommitted scheduling metadata. It
may carry logical fields such as Goal id, steering kind, facts version,
same-turn or idle source, reservation identity, and Continuation preflight key.
It must not carry rendered Goal text, role-bearing model input, prebuilt
`ResponseItem` or `ResponseInputItem` values, pending Continuation intent,
committed carry, recorded evidence, or authority proof.

A stale synthetic turn that becomes invalid after launch but before submission
is an internal lifecycle outcome. It clears the uncommitted metadata without
model submission, pending-intent consumption, suppression advancement,
evidence write, or user-facing request failure.

A successful Created-event commit records committed carry and the appropriate
pending-intent or Continuation suppression effects through the final/durable
owners, then clears or makes the source request metadata obsolete. Same-turn
follow-up must not reuse stale pre-commit metadata as if the original
Goal-owned request were still pending.

## Model-Visible History Key

The `model_visible_history_key` answers one narrow question:

```text
Has model-visible, non-Goal progress changed enough to justify another
automatic Continuation for the same active Goal and durable facts version?
```

The key is not authority, cadence selection, pending intent, evidence, or a
repair decision. It is suppression accounting support for automatic
Continuation.

The logical key shape is equivalent to:

```text
ModelVisibleHistoryKey {
  schema_version,
  eligible_progress_count,
  eligible_progress_fingerprint,
  latest_eligible_progress_fingerprint,
  compaction_basis_fingerprint,
}
```

The persisted or transported form may be a digest string, but tests and code
reviews must be able to see the projection inputs.

The key is computed from the same logical model-visible history used for the
next request attempt, before inserting a new automatic Continuation item. The
capture order is:

```text
base prompt input for this attempt
  -> classify and ignore Goal-only cleanup items for key purposes
  -> compute model_visible_history_key from eligible progress projection
  -> select pending durable intent or automatic Continuation request metadata
  -> insert or verify selected developer-role Goal item when due
```

The final request-input path is the capture point, but this doc owns the key
semantics and eligible progress projection. A rewrite counter alone is not a
valid key when it misses ordinary model-visible progress or changes for
rewrites that do not represent new eligible work.

## Eligible Progress Projection

Eligible progress includes model-visible items that can represent user work,
assistant work, tool work, mailbox work, or compaction of such work:

- ordinary user messages and hook prompts that reach model input
- assistant messages
- reasoning items
- tool calls and tool outputs
- local shell calls
- web-search and image-generation calls
- mailbox input that reaches model input
- compaction and context-compaction items that alter the model-visible summary
  of prior eligible progress

The projection excludes:

- the automatic Continuation item being considered
- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts
- duplicate, stale, wrong-role, or pre-injected Goal-looking items
- pure contextual fragments that are not work progress
- raw response notification counts
- typed or materialized UI projection counts
- helper output that did not reach final request input

If the only model-visible change since the latest committed automatic
Continuation is Goal cadence, request repair, cleanup, or internal-context
material, the key must not change for Continuation suppression purposes.

## Continuation Suppression And Reconstruction

Automatic Continuation duplicate suppression compares:

```text
{
  goal_id,
  model_visible_history_key,
  durable_facts_version,
}
```

A repeated idle hook with the same triple must not launch another automatic
Continuation. A later eligible model-visible history change or durable facts
version change may permit another Continuation when all idle selection
requirements still hold.

The comparison triple is distinct from the stored or reconstructed committed
suppression record. A committed record also needs commit identity such as
committed turn identity, selected item fingerprint, and commit timestamp or
equivalent metadata so resume, restart, rollback, and fork can distinguish a
real committed Continuation from a rendered artifact or helper result.

Default live correctness uses the durable/state-owned Continuation suppression
record owned by the durable-state doc. This doc owns what is compared and how
resume/reconstruction interprets the suppression basis. Final input owns the
commit point that may advance the record; recorded evidence owns any
non-best-effort reconstruction support.

Suppression must not advance when:

- the idle hook fires
- a candidate is selected
- text is rendered
- a helper constructs an item
- a turn is reserved
- request shaping fails
- the active Goal changes before launch
- pending non-Goal work appears before launch
- final input is built but not submitted under the default live-correctness
  policy
- stream setup or submission fails before the commit point

Resume/restart suppression precedence is:

1. durable watermark or equivalent state-owned suppression record
2. explicitly supported non-best-effort structured committed Continuation
   evidence from surviving replay history
3. no reconstructed watermark

The third case must not resurrect active Goal state, infer a watermark from
rendered text, or parse ordinary rollout items, rollout trace payloads, raw
notifications, classifier matches, or projections as suppression proof.

## Resume And Restart

Resume is hydration, not cadence.

Resume must hydrate the lifecycle inputs before any later idle decision:

- reload durable Goal facts
- reload pending Initial, ObjectiveUpdated, and BudgetLimit intent
- refresh accounting baselines needed for future Goal usage tracking
- reload or reconstruct the latest automatic Continuation suppression basis
  from durable facts, the state-owned watermark or equivalent record, and
  model-visible history
- clear stopped-goal runtime state when durable Goal status is not eligible
  for active Goal behavior

Resume must not:

- create Initial intent merely because durable active Goal state exists
- infer pending intent from historical rendered Goal items
- emit active Goal steering
- consume pending intent
- advance automatic Continuation suppression
- empty the suppression basis in a way that permits duplicate automatic
  Continuation when eligible history and durable facts are unchanged

After resume response, snapshot, and replay ordering completes, an ordered
caller may invoke the idle hook. That later hook may start pending non-Goal
work first, deliver already-pending Initial/ObjectiveUpdated/BudgetLimit
intent, or launch automatic Continuation only when the Continuation predicate
allows it.

An active Goal whose Initial was already consumed before resume must not
receive another Initial unless real persisted pending Initial intent still
exists. An already-pending Initial remains due until final-input commit
consumes it.

## External Mutation And Same-Turn Metadata

External Goal mutation must order side effects as:

```text
account in-flight Goal usage if needed
persist durable Goal mutation
persist pending cadence intent when the mutation creates Initial,
  ObjectiveUpdated, or BudgetLimit work
request same-turn cadence recheck only if an active turn can still accept
  turn-local cadence request metadata
leave pending intent intact if same-turn recheck is unavailable or rejected
run pending non-Goal work before any Goal-owned synthetic turn
```

Same-turn cadence recheck is metadata and wake behavior only. It must not
construct active model input, choose the model role, carry rendered Goal text,
consume pending intent, advance Continuation suppression, write evidence, or
prove delivery.

The logical outcomes are:

- `AcceptedForActiveTurn`: the active turn accepted metadata-only recheck or
  wake state.
- `NoActiveTurn`: no active turn can accept metadata.
- `ActiveTurnCannotAccept`: an active turn exists but cannot accept new
  cadence metadata.

`AcceptedForActiveTurn` still does not deliver cadence by itself. Pending
intent is consumed only if that active turn's final request input later
contains the matching developer-role Goal item and reaches the final-input
commit point.

`NoActiveTurn` and `ActiveTurnCannotAccept` are not delivery loss.
ObjectiveUpdated and BudgetLimit must remain pending for a later ordinary turn
or idle cadence-delivery turn when same-turn metadata is unavailable or
rejected.

Extension and app-server producers may participate by creating durable facts,
pending-intent summaries, and typed wake or recheck metadata through their
own lifecycle owners. They must not own active model input, role selection,
pending-intent consumption, Continuation suppression advancement, or recorded
evidence writes.

## Repair, Retry, And Follow-Up Boundaries

The idle hook schedules work. Request repair is a request-local backstop.

A request launched by the idle lifecycle may use request-local repair only
when a seam would otherwise lose, stale, duplicate, omit, or downgrade
cadence-required Goal authority for that specific request. Repair cannot:

- create pending cadence intent
- consume pending intent unless the repaired request is explicitly delivering
  that pending intent through final-input commit
- advance Continuation suppression
- record rollout history merely because durable active Goal state exists
- infer Goal facts, objective text, pending intent, evidence, or suppression
  from rendered artifacts

Retry and same-turn follow-up shaping are owned by the final request-input
doc. This doc owns the lifecycle for Goal-owned synthetic metadata and stale
abort before submission.

Retry before commit and built-not-submitted attempts leave pending intent and
Continuation suppression unchanged by default. Any exception must satisfy the
recorded-evidence doc's explicit persistence and error-policy boundary.

Same-turn follow-up after Created must use fresh finalization context and must
not reuse stale pre-commit Goal-owned synthetic request metadata as if the
original cadence request were still pending.

## Compaction, Reconstruction, Rollback, And Fork Effects

Compaction affects automatic Continuation eligibility only through the
eligible progress projection.

Pure Goal cleanup does not change the model-visible history key. Compaction
summaries that replace eligible progress participate in the projection.
Compaction metadata with no model-visible eligible-progress effect does not
permit another Continuation.

Rollout reconstruction must compute the same key for reconstructed history
that live history would compute for the same model-visible items. Rollback
and fork compute keys from surviving reconstructed history and surviving
durable or explicitly supported evidence-derived suppression records.

Rollback, fork, compaction, and reconstruction must not resurrect active Goal
state, pending intent, objective text, evidence, committed carry, or
Continuation suppression by parsing rendered Goal text. Ordinary
`RolloutItem::ResponseItem`, rollout trace payloads, raw notifications,
classifier matches, typed/materialized projection state, and helper output are
not suppression proof.

If a committed Continuation evidence record is rolled back or its paired
model-visible Goal item is not in surviving history, that evidence cannot be
used as surviving suppression proof. If a durable/state-owned suppression
record survives, it remains the default live correctness basis according to
the durable-state contract.

## Primary Pointers

- `goal-authority-behavior.md` owns the authority truth; this doc does not
  prove active model authority.
- `goal-cadence-contract.md` owns steering kinds, ranking, ordinary user-turn
  limits, and cadence-required authority. This doc applies those rules to idle
  opportunities.
- `goal-durable-state-and-pending-intent.md` and
  `goal-final-request-input.md` own durable facts, pending intent, exact-key
  consumption, final shaping, Created-event commit, suppression advancement,
  and committed carry. This doc owns idle ordering, synthetic metadata before
  submission, history-key semantics, and comparison/reconstruction rules.
- `goal-recorded-request-evidence.md` owns evidence carrier and replay policy;
  this doc uses evidence only through the explicit non-best-effort
  reconstruction boundary.
- Cleanup/projection, extension, and test-prep docs own their support
  surfaces; this doc keeps only idle/history-local repair limits, eligible
  progress effects, producer-mutation ordering, and proof obligations.

## Local Proof Obligations

Idle/history coverage must prove:

- legal idle callers run only after ordered idle opportunities
- repeated or racing idle hooks are idempotent and reentrant
- pending non-Goal queued work and mailbox work start before any Goal-owned
  synthetic turn
- pending Initial, ObjectiveUpdated, or BudgetLimit delivery from idle is not
  automatic Continuation
- pending durable intent outranks automatic Continuation
- pending intent is not consumed on selection, render, construction,
  reservation, accepted metadata, rejected metadata, idle-hook firing, stale
  abort, construction failure, or built-not-submitted default paths
- automatic Continuation launches only when no active turn, no pending
  non-Goal work, and no pending non-Continuation intent exist
- the Continuation comparison triple uses Goal id, model-visible history key,
  and durable facts version
- unchanged comparison triple suppresses duplicate automatic Continuation
- eligible model-visible progress or durable facts changes permit a later
  automatic Continuation when all lifecycle requirements still hold
- the Continuation item itself does not change the key that permits another
  Continuation
- the key includes eligible model-visible user, assistant, reasoning, tool,
  shell, web-search, image-generation, mailbox, hook-prompt, and relevant
  compaction progress
- the key excludes pure current Goal items, pure legacy artifacts,
  stale/wrong/pre-injected Goal-looking items, non-progress fragments, raw/UI
  counts, and helper output
- a rewrite counter alone is not accepted as the model-visible history key
- Goal-owned reservations clear stale candidates before submission without
  model send, consumption, suppression advancement, evidence write, or
  user-facing request failure
- Goal-owned launch does not drain newly arrived pending non-Goal work
- resume reloads durable facts, pending intent, accounting basis, and
  suppression basis without fabricating Initial
- resume with unchanged eligible history and unchanged durable facts does not
  duplicate automatic Continuation
- resume distinguishes already-pending Initial from already-consumed Initial
- external ObjectiveUpdated and BudgetLimit mutations leave pending intent
  intact when same-turn metadata is unavailable or rejected
- compaction, reconstruction, rollback, and fork compute keys from surviving
  eligible progress and never from rendered Goal text
- suppression reconstruction uses durable/state-owned records by default and
  uses structured evidence only under the recorded-evidence doc's explicit
  non-best-effort rules
- final payload or structured evidence tests prove any Goal-owned synthetic
  turn that reaches the model contains exactly one current outer
  developer-role Goal item and no active `<goal_context>` item, with final
  payload mechanics owned by the final-input doc

The test-prep successor doc owns how these obligations join the broader final
payload, durable state, evidence, repair/projection/raw, extension, and UI
proof matrix.
