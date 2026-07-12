# Goal Authority Grounding Truth

Goal authority is about the actual model input.

A Goal is effective only when the model request contains a model-visible Goal steering item in the correct role
stratum. Durable state, UI state, hidden markers, tool output, and app-server projections are not enough by
themselves.

The observable target is a real model input item shaped like:

```json
{
  "type": "message",
  "role": "developer",
  "content": [
    {
      "type": "input_text",
      "text": "<codex_internal_context source=\"goal\">\n...\n</codex_internal_context>"
    }
  ]
}
```

The exact Rust names may change by version, but the functional shape may not:

```text
ResponseItem::Message.role = "developer" by default
ContentItem::InputText.text = rendered internal Goal context
source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

## Desired Behavior

Use the lifecycle-recorded plus request-repair model.

Lifecycle-recorded means Goal steering frames are real model-visible conversation items when Goal cadence says
steering is due, matching the successful local v130/v131 behavior.

Request-repair means final request assembly also checks reconstruction seams and repairs the next model request
only when it would otherwise have zero, stale, wrong-role, wrong-wrapper, or duplicate current Goal authority.

The repair path is a backstop, not the primary cadence mechanism.

Goal lifecycle frames are real model-visible conversation items, following the working local v130/v131 cadence.

Request-local repair exists only to preserve that behavior across seams where Codex might otherwise lose,
stale, duplicate, or downgrade Goal authority.

This means:

```text
Goal lifecycle cadence
  -> records real developer-role Goal steering frames into model-visible history

Request-boundary repair
  -> checks/repairs reconstruction seams so the next model request is correct
```

Request-boundary repair is not the primary Goal architecture. It is a correctness backstop.

## Lifecycle Cadence

Goal owns when steering is due.

The semantic steering kinds are first-class:

```text
Initial
  Sent once when a newly active Goal is introduced for the active run.

Continuation
  Sent after meaningful idle/batch/work boundaries, matching the successful
  v130/v131 behavior where Codex was reminded after a body of work.

ObjectiveUpdated
  Sent when the active objective changes, superseding prior objective text.

BudgetLimit
  Sent when budget state changes and the model should wrap up according to
  runtime-owned budget status.
```

Ordinary user turns while a Goal is active must still preserve Goal authority in the model-visible context. But
they should not blindly emit a fresh full Continuation reminder unless the lifecycle cadence says one is due.

## Durable State

Durable structured Goal state is the source of truth for current Goal facts:

```text
objective
status
budget
usage
timestamps
current active run state
pending steering intent
```

Rendered Goal frames are not durable authority. They are model-visible artifacts that were actually sent to the
model.

Runtime must never recover an active Goal by parsing old rendered wrappers from history. If old sessions ever
need migration, that should be an explicit offline migration/import tool, not request-time fallback logic.

## Role-Bearing Internal Context

For v136 and later, Goal should use the real internal-context abstraction.

Preferred shape:

```rust
InternalModelContextFragment::new(
    InternalContextSource::from_static("goal"),
    rendered_goal_prompt,
)
.into_response_item(InternalModelContextRole::Developer)
```

or the exact local equivalent.

Responsibilities:

```text
Goal
  decides lifecycle cadence and renders the steering body.

InternalModelContextFragment
  owns internal context rendering/provenance.

InternalModelContextRole
  owns the outer model role.

ResponseItem::Message.role
  is the authority boundary.
```

Do not build a Goal-only fake wrapper serializer when the upstream internal-context abstraction can be made
role-bearing.

## Recorded Frames And Repair

The working local v130/v131 behavior recorded steering frames into model-visible history through pending input.
Preserve that behavioral model unless there is a deliberate, proven replacement.

The target is not:

```text
append a fresh Goal frame blindly every request
```

The target is:

```text
record lifecycle Goal frames when Goal cadence says steering is due
and repair only when the next model request would otherwise be wrong
```

Request-local repair should act when a seam produces:

```text
zero current Goal authority
wrong role
wrong wrapper
stale current frame
duplicate current authority frames
missing frame after compaction/resume/rollback/fork/reconstruction
```

Repair may insert or replace a current developer-role frame for that request. It must not turn old rendered
wrappers into durable state.

## Historical Frames

Historical Goal frames can be real evidence that the model previously saw Goal steering. They are not current
authority forever.

Rules:

```text
Do not recover Goal state from historical rendered frames.
Do not treat historical frames as the source of current objective truth.
Do not broadly delete mixed user content because it contains Goal-like text.
Do narrowly classify pure Goal steering artifacts for dedupe, hiding, and reconstruction cleanup.
Current durable Goal state wins.
```

## UI Versus Model Input

UI hiding is separate from model authority.

It is fine to hide raw Goal steering wrappers from:

```text
TUI transcript
app-server turns
raw response item notifications
resume/fork/rollback UI projections
```

But hiding from UI proves nothing about model input.

The acceptance criterion is the final serialized model request or rollout item that the model actually
receives.

## Compaction, Resume, Fork, Rollback

These are authority danger zones.

For each seam, answer:

```text
Does durable Goal state survive?
Does pending steering intent survive?
Are stale rendered frames removed only as artifacts?
Does the next model request contain the correct current developer-role Goal frame?
```

Specific policy:

```text
Compaction
  may remove stale rendered Goal artifacts from reconstructed history, but the
  next model request must still contain the current developer-role Goal frame
  when the Goal is active.

Resume
  same-thread durable Goal state should survive and current Goal authority must
  be restored in the next model-visible request.

Rollback
  if the durable Goal row survives, the next request must reflect it. If rollback
  intentionally clears Goal state, that must be explicit.

Fork
  must make an explicit policy decision: inherit structured Goal state or omit it.
  It must never rely on old rendered Goal wrappers as the only carrier.
```

## Acceptance Standard

Success is observable.

For each important scenario, inspect the actual model-bound payload or rollout and verify:

```text
there is a developer-role Goal item when the model should pursue the Goal
the item uses the current version's internal Goal context wrapper
the body matches the current durable Goal state and pending steering kind
the objective is escaped as untrusted text
there is no duplicate current Goal authority frame
there is no fallback to user-role Goal steering
```

Required scenarios:

```text
create_goal follow-up
initial active Goal
idle/batch continuation
ordinary user turn while Goal remains active
objective update
budget limit
same-turn tool follow-up
retry
local compaction
remote compaction
resume
rollback
fork
```

## Non-Goals

This is not a plan to:

```text
preserve upstream user-role Goal behavior
make hiddenness substitute for authority
parse old rendered wrappers into active Goal state
spam a fresh full Goal reminder every request
hide Goal from model-visible input
use tool output as Goal steering
build a Goal-only fake internal-context serializer
treat UI filtering as proof of model delivery
```

## Bottom Line

Goal authority means the model actually receives current Goal steering as developer-role input.

The durable state decides what the Goal is.
The lifecycle cadence decides when steering is due.
The internal-context abstraction renders provenance.
The outer message role carries authority.
The final model payload proves whether the feature works.
