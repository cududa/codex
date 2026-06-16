# Goal Artifact-Proving Failure Modes

This note captures the failure modes discussed while reviewing `/goal` steering
wording, especially around evidence, local artifacts, and source authority. It is
descriptive context for future goal-steering patches, not itself a patch plan.

## User-Described Failure Mode

The central user-observed failure mode is not that evidence, tools, demos, or
repository inspection are bad. The failure is that the agent can let nearby
artifacts become the practical center of the task even when those artifacts are
not authoritative for the active objective.

The user described the conflict this way:

> artifact-proving is quite literally the phrase codex uses itself when I ask it what the heck it actually did.

The concrete scenario:

> A lot of where the conflict occurs is that I'll build a detailed implementation plan for a library I'm building around a CAD kernel. I have demos that draw on that library. We won't have demos that use the new library capability I'm instructing it to build.

The common breakdown:

> So it'll do all the research to build the full thing, then before executing, to re-orient themselves for implementation or find their sort of lighthouse, they do a sweep looking at local samples/ demos, find the "closest" callers of similar concepts then the whole thing just breaks down

The deeper tension:

> in-repo "requirements" can start to become the lighthouse because it's more tactical and already created/ materialized as code

and:

> the *ACTUAL* goals the users stated at the start that were meant to supercede in-repo evidence can be parsed by the model as "the user's requested end state".

## Agent Interpretation The User Agreed With

The useful framing is:

> the failure is not "evidence is bad," it's that the model starts treating nearby artifacts as the objective's gravitational center.

The better abstraction:

> source authority getting inferred from proximity instead of from the user's current goal.

Or, more operationally:

> The bad move is not reading demos. The bad move is letting "most concrete thing I just saw" outrank "what this goal is trying to create."

This means the target is not to suppress repo inspection or tool use. The target
is to make the agent decide which sources are authoritative for the current
objective before letting local samples, demos, tests, callers, or docs narrow the
work.

## Modes Of Work

The user noted that the real authority source depends on the active goal mode,
with examples including:

- improve a platform feature
- build a model using the platform
- research the kernel/API to build a platform feature
- implement a platform feature

These modes are general even though the motivating example involves a CAD
kernel. A demo may be authoritative for one mode, illustrative for another, and
actively misleading for a third.

## Tooling Is Not The Problem

The user explicitly corrected an over-broad interpretation that would treat tool
calls as equivalent to the failure mode:

> just a slight nudge away from now saying all tool calls are bad and an equivelant to the failure mode I described

In the motivating case, the user built a comprehensive MCP tool surface for the
kernel API and documentation:

> I took 40 years of docs and private overloads between callers etc and built an actual structured documentation representation that's available via tool calls.

So the tool surface can be the correct lighthouse. The failure is not "tool call
versus repository." The failure is choosing a lighthouse by recency,
concreteness, or locality rather than by the active objective.

## Wording Risks Identified

The discussed upstream/local wording risks include:

- "Work from evidence"
- "Use the current worktree and external state as authoritative"
- deriving requirements from files, plans, specs, issues, or user instructions
- requiring current-state sources such as files, command output, tests, PR state,
  rendered artifacts, or runtime behavior
- "The audit must prove completion"
- local initial-goal wording: "work from the repository state and evidence you gather"

These are not always wrong. They are risky when they cause the agent to privilege
nearby/current artifacts over the task's intended direction.

## Rejected Or Risky Patch Framing

A proposed sentence was rejected as risky:

> but preserve the user's requested end state

The concern is that "preserve" can trigger compatibility/default-conservatism
behavior. If the freshest context is old docs, current demos, nearby callers, or
in-repo requirements, the agent may preserve the wrong thing.

The user explained the issue:

> the documentation they just read, which might be documenting an old state that output work of the goal is meant to supercede, is fresher in mind and they have the mental framing of "preserve" and then we fall apart

Another proposed sentence was also criticized as too wordy and opinionated:

> When the objective depends on external/domain/library/API behavior, prefer the relevant docs, schemas, tools, or specifications for that behavior, then reconcile with the current codebase.

The concern was that this phrasing becomes "gooey" and can pull the agent into
compatibility speculation, including worrying about outside callers when the user
would have requested a compatibility pass if that were needed.

## Wording The User Aligned With

The user strongly aligned with this core:

> Work from the sources that are authoritative for the current objective. Do not treat nearby repository artifacts, examples, demos, tests, or existing callers as authoritative merely because they are local. Use them to understand current integration patterns,

The follow-up refinement that avoids the rejected "preserve" framing:

```md
Work from the sources that are authoritative for the current objective. Do not
treat nearby repository artifacts, examples, demos, tests, or existing callers as
authoritative merely because they are local. Use them to understand current
integration patterns, not to narrow or redefine the requested work. When sources
disagree, do not default to the most concrete or recently inspected artifact;
resolve the conflict against the active objective.
```

This candidate avoids:

- making tool calls suspicious by default
- making local evidence suspicious by default
- overfitting to CAD-specific wording
- using "preserve" as compatibility bait
- telling the agent to chase external compatibility unless the user asked for it

## Practical Patch Objective

Future goal-steering wording should keep the useful intent behind evidence-based
work:

- avoid false completion
- avoid stale memory
- inspect real current state when it is relevant
- verify completion against the actual objective

But it should add a source-authority guard:

- local artifacts are not automatically authoritative
- examples and demos are often integration guidance, not scope definitions
- documentation may describe old state that the goal is meant to replace
- structured domain/API tools may be the correct authoritative source
- the active objective decides which evidence matters

## Prompt Tone Refinement

After agreeing on the source-authority guard, the user paused on the tone of the
candidate wording. The technically precise version was useful, but it leaned
negative:

> don't do this, do this

The concern was that too many prohibitions can create a rigid or anxious agent
posture. The user described the balance as a tightrope: direct negative bumpers
can be helpful, but a dense document of do/don't instructions can cause agents
to spiral into over-constrained behavior.

The goal became to keep the same semantic guard while making the language feel
more like orientation than discipline.

## Positive Source-Authority Wording

The wording the user liked most was:

```md
Work from the sources that are authoritative for the current objective. Nearby
repository artifacts, examples, demos, tests, and existing callers are valuable
context for current integration patterns and historical behavior, but their
authority depends on their relevance to the active objective. Use them to inform
the work without letting proximity, concreteness, or recency narrow the
requested outcome. When sources point in different directions, choose the
interpretation that best serves the user's active objective.
```

This version preserves the core source-authority rule while avoiding a scolding
tone. It treats local artifacts as useful context rather than suspicious inputs,
but explicitly prevents proximity, concreteness, or recency from becoming
implicit authority.

## Re-Grounding With get_goal

The user then identified a second stabilizer: when the agent has spent a long
time inspecting local artifacts, the original goal can become less salient than
freshly inspected repo context. The proposed mitigation is to tactically
re-ground on the active goal.

The final wording the user approved:

```md
Work from the sources that are authoritative for the current objective. Nearby
repository artifacts, examples, demos, tests, and existing callers are valuable
context for current integration patterns and historical behavior, but their
authority depends on their relevance to the active objective. Use them to inform
the work without letting proximity, concreteness, or recency narrow the
requested outcome. When sources point in different directions, or after a long
investigation through local artifacts, call get_goal to re-ground on the active
objective before choosing the next implementation direction.
```

The user explicitly preferred not to say "if available" because this pinned
harness can assume `get_goal` exists. Making the instruction conditional would
create an unnecessary escape hatch and could become anxiety-inducing when the
agent is low on context.

The intended role of `get_goal` is not ritualistic churn. It is a quiet compass
for moments when local artifacts, docs, demos, callers, or tests have become
cognitively louder than the active objective.
