# Goal Authority Primary Cadence Contract

## Purpose

This document defines the implementable primary cadence contract for Goal
steering.

It is intentionally narrower than a version integration plan. Version-specific
plans, including v136 and later, must conform to this contract before selecting
files, APIs, migration slices, or compatibility behavior.

This document exists to prevent three implementation failures:

- sending a fresh full Goal reminder on every ordinary user turn
- treating request repair as the primary Goal architecture
- preserving Goal-only fake provenance machinery as the active steering
  model

The broad authority and cadence questions previously listed here are resolved
into the state, cadence, repair, and predicate contracts below. The exact
`MaybeContinueIfIdle` caller sequence, lock behavior, retry semantics, and
watermark update point are defined by
`local/goal_research/goal-authority-idle-continuation-contract.md`, which must
conform to this contract.

## Non-Negotiable Shape

Active Goal steering is a real model-visible item.

The active steering item must be:

```text
ResponseItem::Message.role = "developer"
ContentItem::InputText.text = rendered internal Goal context
internal context source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

The internal-context text supplies provenance and hidden classification.

The outer developer role supplies authority.

Active Goal authority must be established at the final request-input shaping
point. In the current code, this is the logical `Vec<ResponseItem>` that
becomes `Prompt.input` and then `ResponsesApiRequest.input`, before any
transport-specific full request or WebSocket incremental delta is derived.

Generic internal context may render Goal text and supply provenance and cleanup
classification. It is not an authority mechanism by itself. Active Goal
steering must not be built through `GoalContext`, `<goal_context>`, or another
Goal-only active context path.

Expected logical shape:

```text
Goal cadence selects cadence item for this request
  -> render current Goal text from durable state
  -> final request-input shaping inserts or verifies exactly one
     ResponseItem::Message { role: "developer", source = "goal", ... }
```

The exact Rust type names may change. The responsibilities may not.

Adding a `Developer` variant to a helper role type, or adding a helper that can
produce developer-role internal context, is not sufficient. Tests must inspect
the final model request input to prove the selected Goal item is present as an
outer developer-role `ResponseItem`.

## Cadence State Model

Goal cadence state has three layers.

### Durable Goal Facts

Durable Goal state is the source of truth for current Goal facts:

- `thread_id`
- `goal_id`
- objective
- status
- token budget
- tokens used
- time used
- created and updated timestamps

Current Goal item construction must render from durable Goal state, not from a
tool request body, app-server request body, rendered marker text, UI projection, or
historical model item.

If durable structured Goal state is absent, runtime must not resurrect an active
Goal from historical rendered text.

### Pending Cadence Intent

Initial, ObjectiveUpdated, and BudgetLimit require persisted pending cadence
intent because the cadence event can happen before the next model request
actually consumes it.

The implementation must persist the logical equivalent of:

```text
PendingGoalSteeringIntent {
  thread_id,
  goal_id,
  kind: Initial | ObjectiveUpdated | BudgetLimit,
  durable_facts_version: goal.updated_at_ms or equivalent facts fingerprint,
  created_at_ms,
}
```

The storage may be a dedicated Goal-store table or columns on the durable Goal
record, but it must be structured state. It must not be encoded in rollout text,
`<goal_context>` text, internal-context text, UI metadata, or raw response
events.

Continuation does not require persisted pending intent. Continuation is derived
from the idle lifecycle predicate and runtime suppression accounting.

### Runtime Continuation Accounting

Automatic Continuation is controlled by runtime accounting, not by a persisted
pending intent.

The implementation must track the logical equivalent of:

```text
last_auto_continuation_attempt {
  goal_id,
  model_visible_history_key,
  durable_facts_version,
}
```

This watermark suppresses duplicate automatic Continuations for the same active
Goal when neither model-visible history nor durable Goal facts have changed.

`model_visible_history_key` is a logical key for the model-visible history
state that can justify another automatic Continuation. It must not be confused
with the current `ContextManager::history_version()`, which only tracks some
history rewrites and is not by itself a valid Continuation suppression key.

The watermark must not suppress:

- pending Initial intent for the same Goal
- pending ObjectiveUpdated intent
- pending BudgetLimit intent
- a later Continuation after the previous continuation turn records new
  model-visible output
- a later Continuation after durable Goal facts change while the Goal remains
  active

### Current-Turn Carry

Current-turn carry is turn-local evidence that a cadence item was already
included in final model request input for the active turn.

It may be used to preserve an already included cadence item across mid-turn
compaction.
It must not be treated as durable Goal state or as a source of new cadence
intent.

## Cadence Is Primary

Goal owns when steering is due.

Request repair does not decide cadence. Repair may only preserve or restore the
authority that cadence requires across a seam.

Cadence-required Goal authority is narrow. A request requires Goal authority
only when one of these is true:

- persisted pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- automatic Continuation has been selected by the idle predicate for this
  request
- a seam is preserving or repairing a cadence item that is already required for
  this request

Active durable Goal state alone is not cadence-required authority.

The primary pipeline is:

```text
Goal cadence event
  -> durable state is already current
  -> mark or derive cadence intent
  -> shape the final model request input by cleaning stale Goal-looking items
     and inserting or verifying one developer-role Goal steering item
  -> the final model request input contains that item as an outer
     developer-role message
  -> record the cadence item and consume pending intent there when pending
     intent exists
```

In this contract, `final model request input` means the actual logical input
list for the request that will be sent to the model. In current code, this is
the `Vec<ResponseItem>` that becomes `Prompt.input` and then
`ResponsesApiRequest.input`, before any transport-specific full request or
WebSocket incremental delta is derived. For rollout reconstruction tests, the
recorded rollout item must represent that same model input shape.

A cadence item is recorded only when final model request input contains exactly
one current Goal steering item whose outer model role is `developer`.

At that point:

- the cadence item is recorded as model-visible Goal steering
- persisted pending Initial, ObjectiveUpdated, or BudgetLimit intent is
  consumed when that item delivered the pending intent
- Continuation duplicate-suppression watermarking may advance when the item is
  an automatic Continuation

Rendering a prompt, constructing a `ResponseInputItem`, attempting same-turn
injection, reserving a turn, or recording harness-local metadata is not enough
and must not
record a cadence item, consume pending intent, or advance the Continuation
watermark.

The repair pipeline is:

```text
reconstruction seam or model-context uncertainty
  -> detect that cadence-required Goal authority would be missing, stale,
     duplicated, or wrong-role
  -> insert, replace, or deduplicate for that request only unless explicitly
     reconstructing recorded cadence history
```

## Steering Kinds

### Initial

Initial steering is due when a newly active Goal enters the active run.

Required ordering:

```text
persist durable Goal state
persist pending Initial intent for goal_id
include one developer-role Initial steering item in final model request input
record the Initial cadence item and consume Initial intent only at
  the point where final model request input contains that item
```

Initial is not due merely because an old rendered Goal artifact exists in
history.

If an ordinary user turn happens before the pending Initial intent is consumed,
that user turn may carry the Initial item because the Initial cadence event
already happened. This is not "Goal every turn"; it is delivery of a previously
persisted pending cadence intent.

### Continuation

Continuation steering is due when Goal lifecycle determines that the thread is
idle after meaningful autonomous work and the active Goal should continue.

A Continuation is not due merely because:

- a Goal is active
- the user sent another message
- a model request is being assembled
- historical Goal steering was filtered from a UI projection
- pending Initial, ObjectiveUpdated, or BudgetLimit intent exists

The continuation idle predicate must account for at least:

- no active turn
- no queued user or pending work that should run first
- no trigger-turn mailbox input waiting
- collaboration mode allows Goal steering
- durable Goal exists and is active
- runtime continuation watermark has not suppressed this exact automatic
  continuation
- any continuation lock or reservation still refers to the current active Goal
- the active Goal remains current after the continuation turn is reserved

Continuation does not consume durable pending cadence intent. It updates only
runtime continuation accounting after the Continuation item reaches the
final model request input used for sampling or equivalent recorded rollout execution. A
reservation or lock may prevent concurrent launches before then, but the
duplicate-suppression watermark must not be advanced merely because an idle
hook fired, a turn was reserved, or a prompt string was rendered.

### ObjectiveUpdated

ObjectiveUpdated steering is due when the active Goal objective changes and the
model needs the superseding objective.

Required ordering:

```text
persist updated objective first
persist pending ObjectiveUpdated intent for goal_id and durable facts version
render from durable state, not from the tool/app-server request body
include one developer-role ObjectiveUpdated steering item in final model
  request input
record the ObjectiveUpdated cadence item and consume ObjectiveUpdated intent
  only when final model request input contains that item
```

ObjectiveUpdated supersedes Initial or Continuation for the same active-goal
final request opportunity.

If ObjectiveUpdated cannot be injected into the currently active turn, the
pending intent remains. It must not be silently dropped just because active-turn
Goal injection was closed or no active turn existed.

### BudgetLimit

BudgetLimit steering is due when runtime-owned budget state changes and the
model should wrap up according to the current budget status.

Required ordering:

```text
account usage first
persist budget/status change first
persist pending BudgetLimit intent for goal_id and durable facts version
render from durable state
include one developer-role BudgetLimit steering item in final model request
  input
record the BudgetLimit cadence item and consume BudgetLimit intent only at
  the point where final model request input contains that item
```

BudgetLimit supersedes Initial, Continuation, and ObjectiveUpdated for the same
final request opportunity because the Goal status now requires wrap-up behavior.
The BudgetLimit prompt must render from current durable Goal facts, including
the current objective.

When BudgetLimit is recorded for a Goal, stale pending Initial or
ObjectiveUpdated intent for that same Goal may be consumed or cleared as
superseded. Runtime must not emit those older active-state steering items after
the durable Goal is budget-limited.

## Supersedence Rules

When more than one steering kind is possible for the same final request
opportunity, choose the newest durable-state-correct item by this order:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

Continuation never supersedes persisted pending cadence intent.

ObjectiveUpdated only applies while the durable Goal is active. If the durable
Goal is budget-limited before ObjectiveUpdated is consumed, BudgetLimit is the
correct steering item and must render the current objective.

Historical rendered Goal items do not participate in supersedence decisions.

## Final Model Request Input

Initial, ObjectiveUpdated, and BudgetLimit intent is consumed at the
point where final model request input contains the selected Goal steering item
as an outer developer-role message.

Consumption requires all of the following:

- the durable Goal still matches the intent's `goal_id`
- the durable facts version still matches or has been intentionally superseded
- the chosen steering item was rendered from current durable facts
- the item is developer-role model input
- the item uses the current Goal internal-context text representation when
  that representation is part of the active design
- the final model request input contains the item
- the cadence item is recorded as model-visible Goal steering, unless the
  operation is explicitly request-local repair rather than cadence delivery

Intent must not be consumed when:

- a prompt string is merely rendered
- a `ResponseInputItem` is merely constructed
- active-turn injection is attempted but rejected
- a synthetic continuation turn is reserved
- a legacy `<goal_context>` artifact is discovered
- a raw response notification is emitted

If request construction fails before final model request input contains the
item, the intent should remain pending unless the implementation has a clear
recorded-attempt policy and tests that prove retry behavior remains correct.

If final model request input is constructed but the request is not submitted to
the model client and no equivalent rollout request is recorded, pending intent
must remain pending and the Continuation watermark must not advance.

If submission begins and then fails before any response is created, the
implementation must choose an explicit retry policy and test it. The default
policy is to leave pending Initial, ObjectiveUpdated, and BudgetLimit intent
pending so a retry cannot silently lose required Goal steering.

## Ordinary User Turns

An ordinary user turn is not a cadence event.

When a Goal is active, an ordinary user turn must not receive a fresh full Goal
Continuation merely because the user sent another message.

An ordinary user turn may carry a Goal item only when one of these is true:

- a previously persisted pending Initial, ObjectiveUpdated, or BudgetLimit
  intent is still due and this request is the final request opportunity that
  consumes it
- request repair is needed because a seam would otherwise lose, stale,
  duplicate, or downgrade cadence-required Goal authority

`active durable Goal exists` is not enough to emit a new Goal steering item.

## Current Authority

Current Goal authority means all of the following are true:

- durable Goal state exists for the thread
- the durable Goal status allows the steering kind being considered
- the steering item was produced for the current Goal identity and current
  durable facts
- the item uses the current Goal internal-context text representation when
  that representation is part of the active design
- the item is developer-role model input
- the item is not a legacy `<goal_context>` artifact
- the item is not duplicated by another current Goal authority item

Historical rendered Goal items are evidence that prior steering happened. They
are not durable authority and do not define current Goal facts.

Runtime must not parse rendered Goal artifacts to recover:

- active Goal state
- objective text
- budget state
- cadence intent
- pending steering kind

## Proving Current Authority

A model-context path can prove current Goal authority only if it can inspect or
account for the final model request input and show that the input already
contains exactly one current developer-role Goal internal-context item matching
durable Goal state.

Valid proof sources include:

- the final `ContextManager::for_prompt(...)` output immediately before
  sampling
- same-turn WebSocket incremental reuse when the full logical request is known
  to match the previous request baseline before compression
- current-turn carry metadata for mid-turn compaction, after the cadence item
  was included in final model request input and recorded for that active turn

Invalid proof sources include:

- active durable Goal state alone
- app-server typed or materialized projections
- raw response item events
- legacy `<goal_context>` text
- helper output before final request-input shaping
- generic hidden classification without developer role
- rendered artifact parsing
- cross-turn `previous_response_id` reuse without exact final model request
  input proof

Because the current model client session is turn-scoped, ordinary cross-turn
requests must not treat `previous_response_id` as proof that current Goal
authority is still present.

## Request Repair

Request repair is a backstop.

Repair may run at final request assembly or another point that can inspect the
actual final model request input, but it must not become the mechanism that
emits Goal steering for every active Goal request.

Repair may act when a seam produces or risks:

- zero cadence-required Goal authority
- stale Goal authority
- wrong-role Goal authority
- wrong internal-context representation for active Goal authority
- duplicate current Goal authority frames
- loss after compaction, resume, rollback, fork, rollout reconstruction, retry,
  or previous-response/model-context transition

Repair is request-local by default.

Request-local repair:

- may alter the prompt input for the current model request
- must render from durable Goal state
- must leave the final request input with a developer-role Goal item when
  cadence-required authority is due
- must not consume pending cadence intent unless it is explicitly delivering
  that pending intent
- must not persist a new rollout item
- must not create a new cadence event

Repair may record to history only when one of these is true:

- it is the normal cadence path consuming persisted pending Initial,
  ObjectiveUpdated, or BudgetLimit intent
- structured reconstruction proves that a cadence item was previously recorded
  and was lost by the seam being reconstructed

Repair must not record to history merely because durable active Goal state
exists.

Mid-turn compaction carry is preservation of a cadence item already included in
final model request input, not a new cadence event and not rendered-artifact
archaeology.

## Repair Decision Table

| Situation | Repair Allowed? | Record To History? |
| --- | --- | --- |
| Ordinary user turn with no pending intent and valid current authority already present | No | No |
| Ordinary user turn only has active durable Goal state and no cadence-required seam loss | No | No |
| Ordinary user turn has pending Initial, ObjectiveUpdated, or BudgetLimit intent | Yes, as cadence delivery | Yes, when consumed |
| Compaction dropped cadence-required Goal authority | Yes | No by default |
| Resume/rollback/fork/reconstruction lost cadence-required Goal authority | Yes | No by default |
| Duplicate current Goal items | Yes, dedupe | No new cadence event |
| Wrong-role current Goal item | Yes, replace with developer-role item | No by default |
| Legacy `<goal_context>` only, no durable state | No active Goal repair; artifact handling only | No |
| Durable state and pending cadence intent require Goal authority, but next request has none | Yes | Yes, when consuming the pending intent |
| Structured reconstruction proves a recorded cadence item was lost | Yes | Yes, if reconstructing recorded history |

## Legacy Goal Artifact

`<goal_context>` is a legacy rendered artifact.

Runtime may recognize pure legacy artifacts only for:

- hiding legacy Goal artifacts from typed/materialized UI projections
- filtering or deduplicating pure legacy artifacts during compaction and
  reconstruction
- preventing legacy artifacts from being treated as ordinary user/developer
  prose
- keeping raw response item notifications raw; Goal context must not get
  special raw-response suppression unless the general raw-response contract is
  changed explicitly

Runtime must not use `<goal_context>` to:

- construct new active Goal steering
- recover durable Goal state
- infer current objective text
- decide cadence
- preserve user-role Goal steering behavior
- migrate old sessions into active Goals at request time

Thread resume, fork, rollback, and reconstruction may inspect legacy artifacts
only as cleanup artifacts. If structured durable Goal state or pending cadence
intent is absent, a legacy artifact must not create it.

## Fake-Shim Deletion Target

The existing Goal-only shim is implementation terrain to delete from the active
Goal path, not architecture to preserve, keep in place, or design around.

Delete as active steering machinery:

- `GoalContext`
- `GoalContextRole`
- `<goal_context>` active emission
- `is_goal_context_*` as primary active-context predicates
- GoalContext construction in core Goal steering
- GoalContext construction in `ext/goal` steering

If `ext/goal` remains compiled and reachable as an active Goal steering
producer under any supported configuration, it must be converted in the same
completed implementation. A version plan may leave unrelated extension
ownership/timing untouched only when the extension path is removed, converted,
or proven unreachable for active Goal steering.

Any remaining code for old `<goal_context>` artifacts must be limited to legacy artifact
handling:

- pure legacy artifact detection for old persisted items
- typed UI/projection hiding for old artifacts
- compaction and rollout reconstruction cleanup for old pure artifacts

This legacy artifact handling must not keep a Goal-specific active-context
abstraction alive. The active path must have no dependency on `GoalContext`,
`GoalContextRole`, `<goal_context>`, or Goal-only artifact predicates.

Replace active steering with:

```text
Goal cadence-selected request item
  -> final request-input shaping
  -> exactly one ResponseItem::Message { role: "developer", source = "goal", ... }
```

## Shared Classification

Internal-context and legacy-artifact classification must be shared
infrastructure, not scattered Goal-specific marker checks.

The implementation must provide strict classifiers for:

- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts
- non-Goal internal-context items
- mixed visible prose that contains marker-like strings but is not a pure
  artifact

These classifiers are not authority predicates. Current Goal authority still
requires final model request input proof that exactly one current Goal item is
present as outer developer-role model input.

The classifiers must require whole-message purity. A mixed ordinary
user/developer message must not be hidden, dropped, deduplicated, or treated as
Goal authority merely because it contains a marker-like substring.

Generic internal-context infrastructure owns:

- source validation
- internal-context rendering
- pure internal-context detection
- optional conversion helpers for ordinary context construction

Goal-specific code owns:

- cadence decision
- durable Goal state lookup
- steering kind selection
- prompt rendering
- objective escaping
- final request-input Goal shaping and commit metadata, or a narrowly named
  cadence module that owns those responsibilities on Goal's behalf

Legacy Goal artifact code owns only:

- pure `<goal_context>` artifact detection
- legacy artifact cleanup/hiding support

## Ordering With Pending Work

The cadence implementation must specify ordering among:

- queued user input
- trigger-turn mailbox input
- pending tool or follow-up work
- idle lifecycle hooks
- Goal continuation turns
- app-server resume, fork, rollback, and external Goal mutation paths

Baseline ordering expectation:

```text
pending user/mailbox/work that should run first
  before
automatic idle Goal continuation
```

Goal continuation must not starve pending user work, and pending user work must
not be silently converted into a Goal continuation event.

Thread resume must reload durable Goal facts and pending cadence intent, refresh
Goal accounting, and then allow the normal idle lifecycle to decide whether
Continuation is due. Thread resume must not mark Initial pending merely because
an active Goal exists.

Resume is hydration, not cadence. It must distinguish:

- an already-persisted pending Initial intent that existed before resume, which
  remains due until consumed
- an existing active Goal whose Initial item was already consumed before resume,
  which must not receive a new Initial item
- an idle resumed thread with no pending user/mailbox work, which may later
  receive Continuation only through the normal idle predicate

External Goal mutation ordering:

```text
account in-flight Goal usage if needed
persist durable Goal mutation
persist pending cadence intent when the mutation creates Initial,
  ObjectiveUpdated, or BudgetLimit work
try same-turn injection only if the active turn can still accept it
leave pending intent intact if same-turn injection is unavailable
run pending user/mailbox/work before automatic idle Continuation
```

## Verification Checklist

An implementation satisfies this contract only when final model payload or
recorded rollout tests prove:

- Initial intent is persisted for a newly active Goal
- Initial is recorded once and consumed only when final model request input
  contains the Initial item as an outer developer-role message
- resume preserves already-pending Initial intent but does not create Initial
  from active Goal state alone
- Continuation is recorded only from the idle cadence predicate
- Continuation duplicate suppression uses goal id, history version, and durable
  facts version or their logical equivalents
- Continuation duplicate-suppression watermark advances only after final model
  request input contains the Continuation item as an outer developer-role
  message, not when an idle hook merely fires
- ordinary user turns do not receive fresh full Goal reminders merely because a
  Goal is active
- ordinary user turns may consume pre-existing pending Initial,
  ObjectiveUpdated, or BudgetLimit intent
- ObjectiveUpdated renders from persisted updated durable state
- ObjectiveUpdated remains pending if same-turn injection is unavailable
- BudgetLimit renders from persisted usage/status state
- BudgetLimit supersedes older active-state pending intent for the same Goal
- active Goal steering is developer-role
- active Goal steering is inserted or verified in the final model request input
- active Goal steering does not use `<goal_context>`
- request repair fixes seam loss without becoming cadence
- request-local repair does not create rollout history
- recorded repair happens only for cadence consumption or structured
  reconstruction of a lost recorded cadence item
- legacy `<goal_context>` is cleanup/hiding only
- duplicate current Goal authority is rejected or repaired
- wrong-role current Goal authority is rejected or repaired
- raw response item notifications are not specially suppressed for Goal context

## Version Plan Requirements

Future version plans must identify:

- the durable storage shape for pending Initial, ObjectiveUpdated, and
  BudgetLimit intent
- the exact mutation points that create each pending intent
- the exact final model request input construction point that records cadence
  items and consumes each pending intent
- the resume path that reloads durable Goal facts and pending intent without
  fabricating Initial for already-introduced active Goals
- the idle lifecycle caller sequence, including pending-work precedence,
  reservation/lock behavior, retry/failure semantics, and the runtime
  continuation watermark update point
- the final model request input proof path for current Goal authority
- the final request-input shaping point that removes stale/wrong-role/duplicate
  Goal-looking items and inserts or verifies the selected current item
- the request-local repair insertion point
- the narrow cases where repair records reconstructed cadence history
- the shared classifier API for current internal-context items and legacy
  `<goal_context>` artifacts
- tests that inspect final model payloads or recorded rollout items for every
  verification checklist item above
