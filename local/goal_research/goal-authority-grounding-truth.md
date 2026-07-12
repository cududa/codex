# Goal Authority Grounding Truth

## Purpose

This document defines the behavioral truth for Goal authority.

It is not a version-specific implementation plan. Version plans must conform to this document.

The purpose is to make the wrong implementations hard to justify:

- no Goal reminder on every ordinary user turn
- no user-role active Goal steering
- no Goal-only fake provenance wrapper as the active architecture
- no recovery of active Goal state from rendered wrapper text
- no treating UI hiding, hidden classification, or tool output as model authority

## Core Truth

A Goal has model authority only when the model actually receives current Goal steering as developer-role model
input.

Durable state, UI state, wrapper text, hidden markers, app-server projections, and tool output are not enough
by themselves.

The model-bound active Goal steering item is:

```text
ResponseItem::Message.role = "developer"
ContentItem::InputText.text = rendered internal Goal context
internal context source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

The internal-context wrapper identifies provenance. The outer developer role carries authority.

## Required Active Steering Shape

Active Goal steering must use the generic internal-context abstraction through an explicit role-bearing
conversion.

Expected shape:

```rust
InternalModelContextFragment::new(
    InternalContextSource::from_static("goal"),
    rendered_goal_prompt,
)
.into_response_item(InternalModelContextRole::Developer)
```

The exact names may change, but the responsibilities may not:

InternalModelContextFragment
owns wrapper rendering and source provenance.

InternalModelContextRole::Developer
owns the outer model role.

ResponseItem::Message.role
is the authority boundary.

Active Goal steering must not use ContextualUserFragment::into(...) or any equivalent conversion path that
hardcodes, defaults, or infers role = "user".

There is no user-role active Goal steering path.

Implementation plans must add or adapt a generic role-bearing conversion API on
InternalModelContextFragment or its direct equivalent. They must not solve Goal authority with a
Goal-specific helper that bypasses the generic internal-context abstraction.

If older configuration exposes a Goal steering role override, implementation plans must remove it, reject it,
or map it to developer-role behavior. They must not preserve user-role Goal steering as compatibility.

## Terminology

Durable Goal state

Structured persisted Goal facts: objective, status, budget, usage, timestamps, active run state, and pending
steering intent.

Cadence item

A developer-role Goal steering item recorded because Goal cadence says steering is due.

Repair item

A developer-role Goal steering item inserted or corrected at a reconstruction seam so the next model request
preserves authority that cadence requires.

Rendered Goal item

A concrete model-visible item that was sent to the model. It is evidence of prior steering, not the source of
truth for current Goal facts.

Seam

A boundary where model-visible context can be rebuilt, filtered, compacted, resumed, rolled back, forked,
retried, or transferred through previous_response_id / model-context state.

## Primary Cadence

Goal owns when steering is due.

Cadence, not request repair, decides when Goal should speak.

| Event | Trigger | Model-Visible Item | Durable Ordering |
| --- | --- | --- | --- |
| Initial | A newly active Goal enters the active run | Record one developer-role Goal item | Mark Initial intent/state before steering |
| Continuation | Thread is idle after meaningful autonomous work | Record one developer-role Goal item | Goal must still be active |
| ObjectiveUpdated | Active objective changes | Record one developer-role Goal item | Persist updated objective first |
| BudgetLimit | Budget state changes and model should wrap up | Record one developer-role Goal item | Persist usage/status first |

A Continuation is not “any next request.” It is due only when the lifecycle says the thread is idle and Goal
continuation should run.

The idle predicate must account for at least:

no active turn
no queued user/pending work that should run first
no trigger-turn mailbox input waiting
current collaboration mode allows Goal steering
durable Goal still exists and is active
the continuation is not suppressed by runtime accounting rules

## Ordinary User Turns

An ordinary user turn is not a cadence event.

If a Goal is active, the ordinary user turn should preserve valid existing Goal authority in the model context.
It must not inject a fresh full Continuation item merely because the user sent another message.

Repair may act only if a seam or model-context transition means the next request would otherwise violate
current cadence-required authority.

“Active Goal exists” is not enough to emit a new Goal item.

## Durable State

Durable Goal state is the source of truth for current Goal facts.

Current Goal item construction must read from durable Goal state. Rendered Goal items must not be parsed at
runtime to recover:

active Goal state
current objective
budget state
cadence intent
pending steering kind

If durable structured Goal state is absent, runtime must not resurrect a Goal from historical rendered text.

## Legacy Goal Wrapper Compatibility

<goal_context> is a legacy rendered Goal artifact.

Runtime may continue to recognize pure legacy wrappers only for artifact handling:

- hiding legacy Goal artifacts from typed/materialized UI projections
- filtering or deduplicating pure legacy Goal artifacts during compaction and reconstruction
- preventing legacy Goal artifacts from being treated as ordinary user/developer prose
- keeping raw response item notifications raw; Goal context must not get special raw-response suppression unless
  the general raw-response contract is changed explicitly

This is not active Goal architecture.

Runtime must not use <goal_context> to:

- recover durable Goal state
- infer objective text
- decide cadence
- construct new active Goal steering
- preserve user-role steering behavior
- migrate old Goal sessions into active Goals

New active Goal steering must use generic internal context plus explicit developer-role conversion.

## Request Repair

Request repair is a backstop, not cadence.

Repair may insert, replace, or deduplicate a developer-role Goal item only when a seam would otherwise make the
next model request violate durable Goal state plus cadence-required authority.

Repair must not turn this:

durable active Goal exists

into this:

send a fresh full Goal item every request

Repair applies to seams such as:

compaction
resume
rollback
fork
rollout reconstruction
history filtering
retry paths
previous_response_id / model-context transitions

If a previous_response_id or model-side context path can prove the current developer-role Goal item is already
present, repair does not need to resend it. If it cannot prove that, repair must restore the cadence-required
developer-role Goal authority for that request.

## Repair Decision Table

| Situation | Repair Allowed? | Record To History? |
| --- | --- | --- |
| Ordinary user turn with valid current Goal authority already present | No | No |
| Ordinary user turn only has active durable Goal state, but no cadence-required seam loss | No | No |
| Compaction dropped cadence-required Goal authority | Yes | No by default |
| Resume/rollback/fork/reconstruction lost cadence-required Goal authority | Yes | No by default |
| Duplicate current Goal items | Yes, dedupe | No new cadence event |
| Wrong-role current Goal item | Yes, replace with developer-role item | No by default |
| Legacy <goal_context> only, no durable state | No active Goal repair; artifact handling only | No |
| Durable state and cadence intent require Goal authority, but next request has none | Yes | Only if reconstructing cadence history explicitly requires it |

## Anti-Patterns

### Goal Every Turn

Do not convert active Goal state into repeated full Goal reminders on every ordinary user turn.

### User-Role Goal Steering

Do not emit active Goal steering as user-role input. A provenance wrapper does not compensate for the wrong
outer role.

### Wrapper As Authority

Do not treat <goal_context> or source = "goal" as authority. The outer model role carries authority.

### Goal-Only Fake Provenance

Do not build active Goal steering around a Goal-specific wrapper serializer. Use the generic internal-context
abstraction with explicit role-bearing conversion.

### Runtime Archaeology

Do not parse rendered Goal wrappers to recover active Goal state.

### Tool Output As Steering

Tool output may report Goal state. It is not Goal steering.

### Hiddenness As Authority

UI hiding, hidden classification, and invisible metadata do not prove the model received Goal authority.

### Repair As Cadence

Do not make request repair the primary mechanism that decides when Goal steering is due.

## Acceptance Standard

Success is proven at the final model payload or recorded rollout item.

For each relevant scenario, verify:

- Active Goal steering is developer-role model input.
- No active Goal steering item is user-role.
- Active Goal steering uses generic internal context with source = "goal".
- Active Goal steering is built through explicit role-bearing conversion, not
ContextualUserFragment::into(...).

- The body reflects current durable Goal state.
- The objective is escaped as untrusted text.
- Goal items exist only when cadence or repair requires them.
- Ordinary user turns do not receive blind fresh Continuation items.
- Duplicate current Goal authority is removed or prevented.
- Legacy <goal_context> compatibility is limited to artifact handling.

Required scenario coverage should include:

Initial active Goal
idle Continuation
ordinary user turn while Goal remains active
ObjectiveUpdated
BudgetLimit
same-turn tool follow-up
retry
local compaction
remote compaction
resume
rollback
fork
previous_response_id / model-context transition
legacy <goal_context> artifact filtering

## Conformance Requirements

Any implementation plan must identify:

- cadence event sources
- durable state fields used
- pending steering intent representation
- developer-role internal-context construction API
- places where user-role conversion paths are removed for active Goal steering
- repair insertion points
- legacy artifact predicates
- tests that inspect final model payloads or rollout items

Implementation plans may add version-specific routing or test sequencing, but they must conform to this
document.
