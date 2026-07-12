# Goal Authority Primary Cadence Contract

## Purpose

This document defines the implementable primary cadence contract for Goal
steering.

It is intentionally narrower than a version integration plan. Version-specific
plans, including v136 and later, must conform to this contract before selecting
files, APIs, or migration slices.

This document exists to prevent three implementation failures:

- sending a fresh full Goal reminder on every ordinary user turn
- treating request-boundary repair as the primary Goal architecture
- preserving Goal-only fake provenance wrappers as the active steering model

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

The internal-context wrapper supplies provenance and hidden classification.

The outer developer role supplies authority.

Active Goal steering must be built through a generic role-bearing internal
context abstraction, not through `GoalContext`, `<goal_context>`, or another
Goal-only wrapper serializer.

## Cadence Is Primary

Goal owns when steering is due.

Request repair does not decide cadence. Repair may only preserve or restore the
authority that cadence requires across a seam.

The primary pipeline is:

```text
Goal cadence event
  -> durable state is already current
  -> record one developer-role internal-context Goal steering item
  -> model receives that real item through the normal model-input path
```

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
mark Initial cadence intent/state
record one developer-role Initial steering item when the model is next steered
clear or consume Initial intent only after the steering item is actually used
```

Initial is not due merely because an old rendered Goal wrapper exists in
history.

### Continuation

Continuation steering is due when Goal lifecycle determines that the thread is
idle after meaningful autonomous work and the active Goal should continue.

A Continuation is not due merely because:

- a Goal is active
- the user sent another message
- a model request is being assembled
- historical Goal steering was filtered from a UI projection

The continuation idle predicate must account for at least:

- no active turn
- no queued user or pending work that should run first
- no trigger-turn mailbox input waiting
- collaboration mode allows Goal steering
- durable Goal exists and is active
- runtime accounting has not suppressed the next automatic continuation
- any continuation lock/reservation still refers to the current active Goal

### ObjectiveUpdated

ObjectiveUpdated steering is due when the active Goal objective changes and the
model needs the superseding objective.

Required ordering:

```text
persist updated objective first
mark ObjectiveUpdated cadence intent/state
record one developer-role ObjectiveUpdated steering item
render from durable state, not from the tool/app-server request body
```

ObjectiveUpdated supersedes Initial or Continuation for the same model-bound
steering opportunity.

### BudgetLimit

BudgetLimit steering is due when runtime-owned budget state changes and the
model should wrap up according to the current budget status.

Required ordering:

```text
account usage first
persist budget/status change first
mark BudgetLimit cadence intent/state
record one developer-role BudgetLimit steering item
render from durable state
```

BudgetLimit supersedes Initial or Continuation for the same model-bound steering
opportunity unless ObjectiveUpdated has also superseded the objective.

## Ordinary User Turns

An ordinary user turn is not a cadence event.

When a Goal is active, an ordinary user turn must not receive a fresh full Goal
Continuation merely because the user sent another message.

Ordinary user turns may rely on already-recorded valid Goal authority when the
model context or response chain can prove that authority is current.

Repair may act for an ordinary user turn only when a seam or model-context
transition would otherwise lose, stale, duplicate, or downgrade
cadence-required Goal authority.

`active durable Goal exists` is not enough to emit a new Goal steering item.

## Current Authority

Current Goal authority means all of the following are true:

- durable Goal state exists for the thread
- the durable Goal status allows steering
- the steering item was produced for the current Goal identity and current
  durable facts
- the item uses the current internal-context wrapper
- the item is developer-role model input
- the item is not a legacy `<goal_context>` artifact
- the item is not duplicated by another current Goal authority item

Historical rendered Goal items are evidence that prior steering happened. They
are not durable authority and do not define current Goal facts.

Runtime must not parse rendered wrappers to recover:

- active Goal state
- objective text
- budget state
- cadence intent
- pending steering kind

## Request Repair

Request repair is a backstop.

Repair may run at final request assembly or another proven model-boundary point,
but it must not become the mechanism that emits Goal steering for every active
Goal request.

Repair may act when a seam produces or risks:

- zero cadence-required Goal authority
- stale Goal authority
- wrong-role Goal authority
- wrong-wrapper active Goal authority
- duplicate current Goal authority frames
- loss after compaction, resume, rollback, fork, rollout reconstruction, retry,
  or previous-response/model-context transition

Repair should be request-local by default. Recording repair into durable history
requires a separate explicit reason, such as reconstructing a cadence item that
should have been recorded but was lost by the seam.

## Legacy Goal Wrapper

`<goal_context>` is a legacy rendered artifact.

Runtime may recognize pure legacy wrappers only for:

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

## Fake-Shim Removal Target

The existing Goal-only shim is implementation terrain to remove or replace, not
architecture to preserve.

Retire as active steering machinery:

- `GoalContext`
- `GoalContextRole`
- `<goal_context>` active emission
- `is_goal_context_*` as primary active-context predicates
- Goal-only wrapper construction in core Goal steering
- Goal-only wrapper construction in `ext/goal` steering

Keep or replace only as legacy artifact handling:

- pure legacy wrapper detection for old persisted items
- typed UI/projection hiding for old wrappers
- compaction and rollout reconstruction cleanup for old pure wrappers

Replace active steering with:

```text
InternalModelContextFragment(source = "goal", rendered_goal_prompt)
  -> explicit role-bearing conversion
  -> ResponseItem::Message { role: "developer", ... }
```

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

## Acceptance Checklist

An implementation satisfies this contract only when final model payload or
recorded rollout tests prove:

- Initial is recorded once for a newly active Goal
- Continuation is recorded only from the idle cadence predicate
- ordinary user turns do not receive fresh full Goal reminders merely because a
  Goal is active
- ObjectiveUpdated renders from persisted updated durable state
- BudgetLimit renders from persisted usage/status state
- active Goal steering is developer-role
- active Goal steering uses generic internal context
- active Goal steering does not use `<goal_context>`
- request repair fixes seam loss without becoming cadence
- legacy `<goal_context>` is cleanup/hiding only
- duplicate current Goal authority is rejected or repaired
- wrong-role current Goal authority is rejected or repaired

## Open Implementation Questions

Future version plans must answer these before code changes:

- Where is cadence intent stored durably or turn-locally?
- What exact state consumes Initial, ObjectiveUpdated, and BudgetLimit intent?
- What exact runtime accounting suppresses the next automatic Continuation?
- Which model-context paths can prove current Goal authority without resending?
- Which repair insertions are request-local only, and which reconstruct recorded
  cadence history?
- Which shared predicate owns pure legacy and current internal-context artifact
  detection?
