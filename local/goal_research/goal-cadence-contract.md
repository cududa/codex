# Goal Cadence Contract

## Navigation Header

This successor doc is the cadence contract for Goal steering. It answers when
Goal steering is due, which steering kind wins, and which nearby mechanisms are
not cadence.

- Role: canonical cadence rule for Goal steering obligations.
- Owns: Initial, ObjectiveUpdated, BudgetLimit, and automatic Continuation as
  cadence events; steering-kind ranking; supersedence; ordinary user-turn
  limits; cadence-required authority; same-turn metadata boundaries; and the
  rule that repair is not cadence.
- Does not own: durable storage schema, facts-version allocation, exact-key
  store mechanics, final request-input shaping, commit metadata, Created-event
  side effects, idle hook stage mechanics, model-visible history-key
  construction, classifier behavior, evidence persistence, extension
  lifecycle, or the replacement test matrix.
- Primary pointers: `goal-authority-behavior.md` for authority proof,
  `goal-durable-state-and-pending-intent.md` for pending intent,
  `goal-final-request-input.md` for delivery/commit, and
  `goal-idle-history-lifecycle.md` for idle-selected Continuation.
- Fidelity note: do not turn active durable Goal state, an ordinary user turn,
  repair, same-turn metadata, helper output, or final-input construction into a
  cadence event.

## Core Rule

Goal cadence decides when Goal steering is due for a request opportunity.
Cadence does not prove delivery. Delivery is proven only by the final model
request input containing the selected current Goal item as an outer
developer-role model item, with the commit and consumption rules owned by the
final request-input doc.

Cadence-required Goal authority is narrow. A request requires Goal authority
only when one of these is true:

- persisted pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- automatic Continuation has been selected by the idle lifecycle for this
  request opportunity
- a seam is preserving or repairing a cadence item that is already required for
  this request

Active durable Goal state alone is not cadence-required authority. Feature or
collaboration-mode eligibility can block delivery, but it is only a delivery
gate. It is not cadence authority, not durable Goal facts, and not proof that
Goal steering reached final model request input.

## Steering Kinds

Cadence has four steering kinds:

```text
Initial
ObjectiveUpdated
BudgetLimit
Continuation
```

For one final request opportunity, choose by this order:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

Continuation never supersedes persisted pending Initial, ObjectiveUpdated, or
BudgetLimit intent. Historical rendered Goal items do not participate in
supersedence.

### Initial

Initial is due when a newly active Goal enters the active run.

The durable Goal facts and pending Initial intent must exist before delivery
is attempted. Initial remains pending until a matching developer-role Initial
item reaches final model request input and the final-input commit rule consumes
it.

Initial is not due merely because an old rendered Goal artifact exists or
because resume found an active durable Goal. If an ordinary user turn happens
while pre-existing pending Initial intent is still due, that turn may deliver
the Initial item through final request-input shaping. That is pending intent
delivery, not a fresh user-turn cadence event.

### ObjectiveUpdated

ObjectiveUpdated is due when the active Goal objective changes and the model
needs the superseding objective.

The updated objective must be persisted as durable Goal facts, and pending
ObjectiveUpdated intent must be persisted for the current Goal identity and
facts version, before delivery is attempted. The steering item renders from
durable state, not from a tool request, app-server request, UI projection, or
historical model item.

ObjectiveUpdated supersedes Initial and Continuation for the same active-goal
request opportunity unless BudgetLimit supersedes it. If same-turn cadence
recheck metadata cannot be accepted or cannot be used before final input
commit, the ObjectiveUpdated intent remains pending for a later ordinary turn
or idle cadence-delivery turn.

### BudgetLimit

BudgetLimit is due when runtime-owned budget state changes and the model should
wrap up according to the current budget status.

Usage and status facts must be accounted and persisted before pending
BudgetLimit intent is persisted. The BudgetLimit item renders from current
durable Goal facts, including the current objective and budget/status facts.
Budget and usage are upstream Goal facts, not local experiments.

BudgetLimit supersedes Initial, ObjectiveUpdated, and Continuation for the same
request opportunity. When BudgetLimit is committed for a Goal, stale pending
Initial or ObjectiveUpdated intent for the same Goal may be cleared only under
the durable/final supersedence rules. Cadence ranking must not become broad
"clear pending intent" behavior.

If same-turn cadence recheck metadata is unavailable or rejected, BudgetLimit
intent remains pending. It must not be dropped because no active turn existed
or because an active turn could not accept new metadata.

### Automatic Continuation

Automatic Continuation is due only when the idle lifecycle selects it after
meaningful autonomous work.

Continuation is not due merely because:

- a Goal is active
- a user sent another message
- a request is being assembled
- a UI or projection filtered Goal-looking history
- pending Initial, ObjectiveUpdated, or BudgetLimit intent exists
- an idle hook fired but earlier idle stages still have work

Automatic Continuation may run only after the idle lifecycle determines that
there is no active turn, no pending non-Goal work, and no eligible pending
Initial, ObjectiveUpdated, or BudgetLimit intent for that idle opportunity.
Idle/history owns stage order, legal callers, reservations, stale synthetic
behavior, model-visible history key, and duplicate-suppression comparison.
Cadence owns only the fact that idle-selected Continuation is a cadence event
and ranks below pending non-Continuation intent.

Continuation still requires feature and collaboration-mode eligibility, current
active durable Goal state, and unchanged lifecycle facts after reservation.
The Continuation item itself must not be the model-visible history change that
permits another automatic Continuation.

Continuation is not persisted pending cadence intent. Its duplicate
suppression is based on a committed watermark or equivalent durable or
reconstructable suppression record for the active Goal, model-visible history
key, and durable facts version. That watermark advances only after the
Continuation item reaches final model request input and the final-input commit
rule runs, not when an idle hook fires, a candidate is selected, a turn is
reserved, text is rendered, or helper output exists.

## Pending Intent And Delivery

Initial, ObjectiveUpdated, and BudgetLimit persist as structured durable
pending intent until the matching selected item is included in final model
request input as an outer developer-role Goal item and reaches the final-input
commit rule.

Pending intent is not consumed when:

- a prompt string is rendered
- a helper produces source-tagged Goal text
- a response item is merely constructed
- same-turn cadence recheck metadata is requested, accepted, rejected, or
  unavailable
- an idle hook fires
- a Goal-owned synthetic turn is reserved
- a stale synthetic turn aborts before submission
- request construction fails before the selected item is in final input
- final input is built but the request is not submitted and no explicitly
  supported structured evidence policy records an equivalent committed request
- a legacy artifact, raw notification, projection item, or classifier match is
  discovered

If final-input shaping is ineligible because the feature is disabled,
collaboration mode does not allow Goal steering, or the current durable Goal no
longer matches the selected intent, it selects no active Goal item and consumes
no pending intent.

The durable-state doc owns pending-intent storage, durable facts version,
atomic mutation, mechanical supersedence cleanup, and exact-key consumption.
The final request-input doc owns per-attempt selection, insertion,
fingerprints, Created-event commit, retry/follow-up shaping, current-turn
carry, and the point where exact-key consumption or Continuation watermark
advancement may happen.

## Ordinary User Turns

An ordinary user turn is not a cadence event.

An ordinary user turn must not receive a fresh full Continuation merely because
a Goal is active or because the user sent another message. "Goal only speaks
from idle" is also wrong: an ordinary turn may deliver already-pending Initial,
ObjectiveUpdated, or BudgetLimit intent when final request-input shaping
selects that pending intent and the request reaches the commit rule.

An ordinary user turn may contain Goal authority only when cadence already
requires it for that request:

- the turn is delivering pre-existing pending Initial, ObjectiveUpdated, or
  BudgetLimit intent
- request-local repair is preserving or restoring cadence-required authority
  that would otherwise be lost, stale, duplicated, or wrong-role at a seam

Active durable Goal state alone, valid UI state, previous rendered Goal items,
tool output, helper output, hidden projection, raw notifications, or
cross-turn previous-response reuse do not make an ordinary user turn cadence.

## Same-Turn Metadata And External Mutation

External Goal mutation that creates cadence work must order side effects as:

```text
account in-flight Goal usage if needed
persist durable Goal mutation
persist pending Initial, ObjectiveUpdated, or BudgetLimit intent when due
request same-turn cadence recheck metadata only if an active turn can accept it
leave pending intent intact if metadata is unavailable or rejected
run pending non-Goal work before automatic idle Continuation
```

Same-turn cadence recheck is metadata and wake behavior only. It must not
construct active model input, choose the model role, carry rendered Goal text,
consume pending intent, advance a Continuation watermark, or prove delivery.

The logical same-turn outcomes are:

- `AcceptedForActiveTurn`: the active turn accepted metadata-only recheck or
  wake state.
- `NoActiveTurn`: no active turn can accept metadata.
- `ActiveTurnCannotAccept`: an active turn exists but cannot accept new
  cadence metadata.

`AcceptedForActiveTurn` still consumes pending intent only if that active
turn's final model request input later contains the matching developer-role
Goal item and reaches the commit rule. The other outcomes are not delivery
loss; pending intent remains for a later ordinary turn or idle cadence-delivery
turn.

Extension and app-server producers may create durable facts, pending-intent
summaries, and typed cadence/wake request metadata. They must not construct
active model input, choose the active model role, consume pending intent,
advance watermarks, or write recorded request evidence.

## Repair Boundary

Request repair is a backstop, not cadence.

Repair may preserve or restore already cadence-required authority when a seam
would otherwise leave the next request missing, stale, duplicated, wrong-role,
or using the wrong internal-context representation. Repair may also support
normal pending-intent delivery through the final request-input seam. Repair
does not decide that a Goal should speak.

Repair must not:

- turn active durable Goal state alone into steering
- create pending cadence intent
- consume pending intent unless the repaired item is explicitly delivering
  that pending intent through final request-input commit
- advance the automatic Continuation watermark
- record new rollout history merely because active durable Goal state exists
- recover facts, objective text, pending intent, evidence, or watermarks from
  rendered artifacts

Repair may record to history only for normal cadence consumption or when
structured reconstruction proves that a previously recorded cadence item was
lost and the evidence/repair contracts allow reconstruction.

## Resume And Lifecycle Boundaries

Resume is hydration, not cadence. Resume reloads durable Goal facts, pending
Initial/ObjectiveUpdated/BudgetLimit intent, accounting basis, and automatic
Continuation suppression basis. It must not fabricate Initial merely because a
durable Goal is active, infer intent from rendered artifacts, emit steering,
consume pending intent, or advance a watermark.

After resume ordering completes, the normal idle lifecycle may start pending
non-Goal work, deliver already-pending durable intent, or launch automatic
Continuation only if its own predicate allows it. An already-pending Initial
remains due; an already-consumed Initial is not re-emitted by resume.

Retry and follow-up are final-input attempt mechanics, but cadence keeps the
local boundary: retry before commit leaves pending Initial, ObjectiveUpdated,
and BudgetLimit intent pending and leaves the Continuation watermark
unchanged. Same-turn follow-up after commit must assemble fresh cadence inputs
from durable state, pending intent or watermark state, optional new request
metadata, and committed carry; it must not reuse stale pre-commit metadata as
if the original cadence request were still pending.

## Local Proof Obligations

Cadence obligations are proven by final model payload tests, or by structured
recorded request evidence when that evidence represents the same logical final
request input and its persistence/error policy is in scope. Cadence does not
own evidence persistence or replay semantics.

Cadence-local proof obligations include:

- Initial is created as pending intent for a newly active Goal and is consumed
  only by matching final-input commit.
- Resume preserves already-pending Initial and does not create Initial from
  active state alone.
- ObjectiveUpdated and BudgetLimit remain pending when same-turn metadata is
  unavailable or rejected.
- BudgetLimit supersedes older Initial, ObjectiveUpdated, and Continuation
  opportunities for the same Goal request opportunity.
- Ordinary user turns do not receive fresh Continuation merely because a Goal
  is active.
- Ordinary user turns may deliver already-pending non-Continuation intent.
- Automatic Continuation is selected only through the idle lifecycle after
  pending work and pending durable intent decline.
- Repair preserves cadence-required authority without becoming cadence.

## Primary Pointers

- `goal-authority-behavior.md` owns what active Goal authority is and why
  proof substitutes are forbidden.
- `goal-durable-state-and-pending-intent.md` and
  `goal-final-request-input.md` own durable facts, pending non-Continuation
  intent, exact-key consumption, final input selection, commit metadata,
  retry/follow-up shaping, and committed current-turn carry.
- `goal-idle-history-lifecycle.md` owns idle stage order, pending-work
  precedence, Goal-owned synthetic request metadata, automatic Continuation
  selection, resume hydration, model-visible history key, and Continuation
  suppression.
- `goal-request-repair-and-artifact-classification.md` owns classifier and
  request-local repair mechanics; repair can preserve cadence-required
  authority but must not become cadence.
- `goal-recorded-request-evidence.md`,
  `goal-extension-lifecycle-and-reachability.md`, and
  `goal-test-prep-and-replacement-proof.md` own evidence, extension, and proof
  support without creating cadence events.
