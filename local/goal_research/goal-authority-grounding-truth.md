# Goal Authority Grounding Truth

## Purpose

This document defines the behavioral truth for Goal authority.

It is not a version-specific implementation plan. Version plans must conform to this document.

The purpose is to make the wrong implementations hard to justify:

- no Goal reminder on every ordinary user turn
- no user-role active Goal steering
- no Goal-only fake provenance mechanism in the active Goal path
- no recovery of active Goal state from rendered marker text
- no treating UI hiding, hidden classification, or tool output as model authority

## Core Truth

A Goal has model authority only when the model actually receives current Goal steering as developer-role model
input.

Durable state, UI state, rendered marker text, hidden markers, app-server projections, and tool output are not enough
by themselves.

The active Goal steering item in final model request input is:

```text
ResponseItem::Message.role = "developer"
ContentItem::InputText.text = rendered internal Goal context
internal context source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

The internal-context text identifies provenance. The outer developer role carries authority.

## Required Active Steering Shape

Active Goal steering must use the generic internal-context abstraction through an explicit role-bearing
conversion. The existing Goal-only active context path is deletion terrain for active Goal steering, not an
architecture to preserve, keep in place, or design around.

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
owns internal-context rendering and source provenance.

InternalModelContextRole::Developer
owns the outer model role.

ResponseItem::Message.role
is the authority source.

Adding `Developer` to a role enum is not sufficient by itself. Active Goal
call sites must invoke the generic role-bearing conversion with
`InternalModelContextRole::Developer` or its direct equivalent, and tests must
inspect the final model request input to prove the outer message role is
`developer`.

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

Structured persisted Goal facts plus structured persisted Goal cadence state.
Goal facts include objective, status, budget, usage, timestamps, and active run
state. Pending steering intent is durable cadence state; it is not rendered
marker text and is not a model-visible Goal item.

Cadence item

A developer-role Goal steering item recorded because Goal cadence says steering is due.

Final model request input

The actual input list for the request that will be sent to the model. A Goal
cadence item exists only when this input list contains the Goal steering item as
an outer developer-role message. Rendering, constructing a response item,
attempting same-turn injection, reserving a turn, or recording harness-local
metadata is not enough.

If that input list is built but the request is not submitted to the model
client and no equivalent rollout request is recorded, pending cadence intent
remains pending. A send failure before any response is created must have an
explicit retry policy; the default is to keep pending Initial,
ObjectiveUpdated, and BudgetLimit intent pending.

Repair item

A developer-role Goal steering item inserted or corrected at a reconstruction seam so the next model request
preserves authority that cadence requires.

Rendered Goal item

A concrete model-visible item that was sent to the model. It is evidence of prior steering, not the source of
truth for current Goal facts.

Seam

A point where model-visible context can be rebuilt, filtered, compacted, resumed, rolled back, forked,
retried, or transferred through previous_response_id / model-context state.

## Primary Cadence

Goal owns when steering is due.

Cadence, not request repair, decides when Goal should speak.

| Event | Trigger | Model-Visible Item | Durable Ordering |
| --- | --- | --- | --- |
| Initial | A newly active Goal enters the active run | Final model request input contains one developer-role Goal item | Persist pending Initial intent before steering |
| Continuation | Thread is idle after meaningful autonomous work | Final model request input contains one developer-role Goal item | Goal must still be active; runtime suppression must allow it |
| ObjectiveUpdated | Active objective changes | Final model request input contains one developer-role Goal item | Persist updated objective and pending ObjectiveUpdated intent first |
| BudgetLimit | Budget state changes and model should wrap up | Final model request input contains one developer-role Goal item | Persist usage/status and pending BudgetLimit intent first |

The record step happens only when the final model request input contains the
outer developer-role Goal item, not when a prompt is rendered, a response item
is constructed, same-turn injection is attempted, or a turn is reserved.

A Continuation is not “any next request.” It is due only when the lifecycle says the thread is idle and Goal
continuation should run.

The idle predicate must account for at least:

- no active turn
- no queued user/pending work that should run first
- no trigger-turn mailbox input waiting
- current collaboration mode allows Goal steering
- durable Goal still exists and is active
- the continuation is not suppressed by runtime accounting rules

Version plans that implement Continuation must spell out the idle lifecycle
caller sequence, reservation/lock behavior, retry/failure behavior, and
watermark update point. Those details may refine when the predicate is checked;
they must not redefine ordinary user turns as Continuation events. The
dedicated contract is
`local/goal_research/goal-authority-idle-continuation-contract.md`.

Initial, ObjectiveUpdated, and BudgetLimit intent must survive until the final
model request input contains the developer-role Goal item that consumes that
intent. Continuation is derived from the idle lifecycle predicate, not from
persisted pending intent.

## Ordinary User Turns

An ordinary user turn is not a cadence event.

If a Goal is active, the ordinary user turn may rely on already-valid current Goal authority when the final
model request input can prove it. It must not inject a fresh full Continuation item merely because the user sent
another message.

An ordinary user turn may carry a Goal item when it is consuming an already-persisted pending Initial,
ObjectiveUpdated, or BudgetLimit intent. That is cadence delivery, not a Goal reminder caused by the user turn.

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

## Legacy Goal Artifact Handling

<goal_context> is a legacy rendered Goal artifact.

Runtime may recognize pure legacy artifacts only for artifact handling:

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

Any remaining code for old `<goal_context>` artifacts must not keep a Goal-specific active-context abstraction alive.

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
present in the final model request input, repair does not need to resend it. If it cannot prove that, repair
must restore the cadence-required developer-role Goal authority for that request. Cross-turn
previous_response_id reuse is not proof by itself.

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
| Durable state and pending Initial/ObjectiveUpdated/BudgetLimit intent require Goal authority, but next request has none | Yes, as cadence delivery | Yes, when consuming the pending intent |
| Structured reconstruction proves a recorded cadence item was lost | Yes | Yes, if reconstructing recorded history |

## Anti-Patterns

### Goal Every Turn

Do not convert active Goal state into repeated full Goal reminders on every ordinary user turn.

### User-Role Goal Steering

Do not emit active Goal steering as user-role input. Provenance text does not compensate for the wrong
outer role.

### Rendered Text As Authority

Do not treat <goal_context> or source = "goal" as authority. The outer model role carries authority.

### Goal-Only Fake Provenance

Do not build active Goal steering around a Goal-specific active context helper. Use the generic internal-context
abstraction with explicit role-bearing conversion.

Do not leave the Goal-only active context path as an active-path subsystem under compatibility or migration language.

### Runtime Archaeology

Do not parse rendered Goal artifacts to recover active Goal state.

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
- Ordinary user turns may consume already-pending Initial, ObjectiveUpdated, or BudgetLimit intent.
- Resume preserves already-pending Initial intent but does not create Initial from active Goal state alone.
- Duplicate current Goal authority is removed or prevented.
- Legacy <goal_context> handling is limited to artifact handling.
- Raw response item notifications are not specially suppressed for Goal context.

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
resume with pending Initial intent
resume after Initial was already consumed

## Conformance Requirements

Any implementation plan must identify:

- cadence event sources
- durable state fields used
- pending steering intent representation
- final model request input construction point that consumes pending steering intent
- idle lifecycle caller, reservation, retry, and watermark update behavior for
  `MaybeContinueIfIdle`
- developer-role internal-context construction API
- places where user-role conversion paths are removed for active Goal steering
- resume behavior for pending intent versus already-introduced active Goals
- repair insertion points
- legacy artifact predicates
- tests that inspect final model payloads or rollout items

Implementation plans may add version-specific routing or test sequencing, but they must conform to this
document.
