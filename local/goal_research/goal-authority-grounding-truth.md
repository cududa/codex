# Goal Authority Grounding Truth

This document locks the posture for Goal authority work before more v135,
v136, or later-version planning.

The Goal feature is a durable steering authority system. It exists so Codex
continues pursuing the user's declared long-running objective across turns,
compactions, resumes, forks, rollbacks, tool failures, budget limits, objective
updates, and upstream harness churn.

The model has no access to hidden runtime intent. The only Goal authority that
matters at inference time is Goal authority present in the final model-visible
input.

## Core Invariant

```text
If a Goal is active and the model should pursue it,
the final model-visible input for that sample contains the current Goal
as a roleful developer-steering frame by default.
```

This invariant is not optional and not representationally flexible at the model
boundary.

The durable source of truth must preserve structured Goal facts: current
objective, status, budget/runtime facts, update source, and other Goal lifecycle
state needed to render current steering.

Those structured facts are not enough by themselves. Every path that builds
model-visible input must materialize the current structured Goal state into a
roleful current Goal frame before the model acts.

There is no valid path where durable state carries a roleless Goal blob and a
later generic layer silently decides authority.

There is no valid path where structured Goal state exists but the final model
input lacks the current Goal when the model should pursue it.

## Required Conveyor

Every version-specific implementation must account for this conveyor:

```text
user-declared objective / Goal runtime event
  -> durable structured Goal state
  -> current Goal steering render
  -> escaped untrusted objective payload
  -> version-current hidden/provenance wrapper
  -> explicit outer model role: developer by default
  -> final serialized model request
```

For compaction, resume, fork, rollback, retry, continuation, budget-limit, and
objective-update paths, the same rule applies:

```text
durable structured Goal state
  -> roleful current Goal frame
  -> developer-role model-visible input by default
```

The model-visible request body is the proof. A constructed item that never
reaches the model is not Goal steering. A persisted Goal state that is not
materialized into model input is not model conditioning. A hidden wrapper sent
as `role: "user"` is not developer-authoritative steering.

## Effective Chat

When discussing this feature, "effective chat" means the state that will be used
to construct future model requests. It is not the same as the UI transcript, app
notifications, debug history, or any single repo type named "history".

If Goal is removed from effective chat without a mandatory reconstruction step
that re-inserts the current Goal as developer-role model input, then Goal has
been functionally removed from the model's future context.

The desired behavior is not to blindly duplicate Goal everywhere. The desired
behavior is that every sample where the model should pursue an active Goal
contains exactly the current Goal steering in the correct instruction stratum,
with stale rendered frames prevented from becoming current authority.

## Filtering Means Removal

Filtering is not evidence that Goal authority survives. Filtering proves only
that Goal was removed from a surface.

Every filter or cleanup path must first be classified by the surface it affects:

```text
UI-only surface
  Raw Goal wrappers may be hidden here.
  This says nothing by itself about model-visible Goal authority.

Model-bound surface
  Removing Goal here removes Goal from the model request unless the current
  Goal is re-materialized before request serialization.

Reconstruction-bound surface
  Removing Goal here removes Goal from future model requests unless durable
  structured Goal state survives and the reconstruction path always builds the
  current developer-role Goal frame before the model acts.
```

Do not describe Goal as "filtered from replay" without also naming the exact
path that constructs the replacement current Goal frame and inserts it into the
next model-visible request.

Do not call Goal transient unless durable structured Goal state survives and
every relevant model-bound reconstruction path must materialize that state into
developer-role model input.

Do not treat app-server filtering, compaction filtering, internal history
cleanup, marker detection, or hidden-context classification as evidence that
Goal authority survives. They are at most evidence that a surface was cleaned.
If that surface feeds future model input, they are Goal-loss red flags until the
current-frame materialization path is identified.

## Harness Reality Mismatch

This work audits the gap between user-facing harness affordances and the
model's actual input.

Users can see a feature, command, marker, queued item, runtime state, or UI
surface and reasonably believe it is operative. The model only receives the
final serialized request payload. It does not know the harness's private runtime
state unless that state is rendered into model-visible input.

This creates recurring failure modes:

```text
Thing is visible to the model or present in a queue,
but the operative harness machinery does not fire.

Thing exists in one context surface,
but is dropped or downgraded across compaction, replay, or reconstruction.

A marker or wrapper exists,
but semantic authority or lifecycle behavior is missing.
```

The Goal-specific versions are:

```text
Goal text exists somewhere,
but is not developer-role model input.

Goal state exists somewhere,
but is not materialized into the model call.

Goal wrapper/provenance exists,
but authority has been flattened, lost, or made stale.
```

This is a harness-fidelity audit. It is not an attempt to coerce or abuse the
model. The purpose is to make the model's actual input match the user's intended
long-running objective and the harness affordance that claims to preserve it.

## Terms

`UI-visible transcript`

The user-facing conversation display, app-server turns, Ctrl+T style views, and
raw visible event surfaces. Raw Goal steering wrappers may be hidden here.

`Model-visible context`

The actual input sent to the model. The active Goal must be present here when
the model is supposed to pursue it.

`Effective chat`

The state that will be used to construct future model-visible context. If a repo
surface feeds future `/responses` input, it is part of effective chat for this
audit even if its local name is history, replay, rollout, replacement history,
resume data, compacted context, pending input, or materialized turns.

`Durable structured Goal state`

The persisted or reconstructable Goal facts that survive lifecycle boundaries.
This is the source of truth for current Goal steering, but it is not by itself
model conditioning until it is rendered into the final model input.

`Roleful current Goal frame`

The current rendered Goal steering frame with its model role already resolved.
By default that role is developer. This is the only valid model-bound Goal
reconstruction artifact.

`Stale Goal frame`

An old rendered Goal message that no longer represents current Goal state. It
must not become renewed authority merely because it exists in prior history.

## Separation Rules

Do not collapse these concepts:

```text
UI visibility != model visibility
filtering != survival
hidden wrapper != model authority
source/provenance tag != model authority
history cleanup != Goal delivery
structured Goal state != model conditioning until materialized
roleless reconstruction != Goal authority
```

Hiding raw Goal steering from user-facing UI surfaces is acceptable.

Hiding or removing Goal steering from model-visible or reconstruction-bound
state is wrong unless durable structured Goal state is preserved and the
reconstruction path necessarily materializes the current Goal as developer-role
model-visible input before the model acts.

Filtering stale Goal frames is stale-authority defense. It is not Goal delivery.
The current Goal still has to be present in final model input.

## Replay And Reconstruction Rule

Any model-bound replay, compaction, resume, fork, rollback, replacement-history,
or reconstruction path that removes, filters, ignores, summarizes, replaces, or
genericizes a rendered Goal frame must also own or call the constructive path:

```text
current durable Goal state
  -> current steering render
  -> explicit developer-role model item
  -> final model request
```

If that constructive path is missing, unknown, optional, roleless, user-role, or
UI-only, the implementation is broken for Goal authority.

The old rendered Goal frame is not the durable source of truth. The durable
structured Goal state is the source of truth. But the current roleful Goal frame
is still required at the model boundary. Both halves are required:

```text
durable structured Goal state
AND
current developer-role Goal frame in final model input
```

Do not replace that with an either/or.

## What This Is

This is a plan to preserve both halves of Goal authority:

```text
structured Goal state as durable source of truth
AND
roleful current developer Goal frame at every model-bound boundary
```

The durable state allows the current Goal to survive compaction, resume, fork,
rollback, objective updates, budget limits, and runtime events.

The roleful current frame is how the model is actually conditioned to pursue
that Goal.

## What This Is Not

This is not a plan to append duplicate Goal messages blindly every turn.

This is not a plan to hide Goal from model-visible context.

This is not a plan to rely on stale rendered Goal messages as durable authority.

This is not a plan to carry roleless Goal blobs through reconstruction and
assign authority later.

This is not a plan to treat `<goal_context>` or
`<codex_internal_context source="goal">` as authority by themselves.

This is not a plan to treat app-server/UI filtering as equivalent to model-input
filtering.

This is not a plan to treat compaction filtering or internal history cleanup as
proof that Goal survived.

This is not a plan to accept upstream user-role Goal steering because the
wrapper is hidden or source-labeled.

## Review Questions

For every upstream version and every Goal path, answer these in production code:

```text
Where is durable structured Goal state stored?
Where is the current steering text rendered from that state?
Where is the untrusted objective escaped?
Where is the hidden/provenance wrapper applied?
Where is the outer model role resolved?
Where is the roleful current Goal frame inserted into final model input?
Where do compaction/resume/fork/rollback reconstruct that current frame?
Which filtered surfaces are UI-only?
Which filtered surfaces are model-bound or reconstruction-bound?
Where are stale rendered frames prevented from becoming authority again?
Where are UI-only hiding rules kept separate from model-visible context?
```

For every filtering or cleanup path, also answer:

```text
What surface did this remove Goal from?
Does that surface feed future model input?
If yes, where is the current Goal re-materialized as developer-role input?
```

Any plan that cannot answer those questions end-to-end is not
implementation-ready.

## Audit Operating Rule

When auditing v135 or later versions, start from production code and the final
model request conveyor. Do not infer authority from names, wrappers, comments,
tests, UI surfaces, or the fact that a filter exists.

For every claim, identify exact production functions and the final model-bound
item. Classify each path as:

```text
proven: current Goal reaches final model input as developer-role by default
broken: Goal is absent, stale, roleless, user-flattened, filtered from effective
        chat without replacement, or UI-only
unknown: exact missing code link is named and bounded
```

Subagent audits for this concern area must be code-only unless explicitly
directed otherwise:

- do not read tests;
- do not read docs, review findings, or local plan files;
- do not run tests;
- tree-walk production code;
- report exact files, functions, and model-bound data shape;
- classify every filtering path by surface;
- do not treat hiddenness, filtering, or structured state as proof of model
  authority.

## Practical Test Standard

Every implementation plan must include final-request proof for the important
Goal scenarios:

- initial active Goal steering;
- continuation steering;
- budget-limit steering;
- objective-updated steering;
- same-turn retry or follow-up sampling;
- local compaction;
- remote compaction;
- resume;
- fork or rollback where Goal state is preserved.

For each scenario, tests must prove the final model input contains the current
Goal as developer-role input by default when the model should pursue it.

Tests must also prove stale rendered Goal frames do not become renewed authority
after objective updates, compaction, resume, fork, or rollback.

## Bottom Line

The Goal feature exists to preserve and deliver active Goal authority to the
model.

Filtering Goal from a surface means Goal was removed from that surface. If the
surface is UI-only, that may be correct. If the surface is model-bound or
reconstruction-bound, it is broken unless the current Goal is rebuilt from
durable structured state and inserted into final model input as developer-role
steering before the model acts.

Any design that prevents the model from seeing the current active Goal is wrong.
Any design that preserves structured Goal state but fails to materialize a
roleful current developer Goal frame into final model input is wrong. Any design
that lets stale Goal text become current authority is wrong. Any design that
flattens default Goal steering to user-role input is wrong.
