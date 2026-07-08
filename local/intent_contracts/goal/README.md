# Goal Intent Contract

## Contract

A thread goal is durable user intent. It exists so the user can name an objective once and have
Codex continue orienting around that objective across turns, interruptions, compaction,
resumptions, edits, client changes, and incidental conversation.

Goal steering is the runtime mechanism that makes that durable intent useful to the model. On
relevant turns, the harness converts goal state into hidden model-facing context that tells the
agent how to continue pursuing, revise, budget, or complete the active goal. The functional
behavior this fork protects is the 130-like experience where goal steering is delivered as
runtime-owned developer guidance by default, while the user's objective remains escaped
user-provided data inside that frame.

Preserve this invariant:

```text
The runtime-owned goal steering frame may be developer-role; the raw objective inside it remains
escaped user-provided task data.
```

That is the heart of the local design. The harness may speak with runtime authority when it says an
active goal should continue. The user's objective text inside that frame must still be treated as
user-provided task data, not as privileged developer-authored instruction text.

## Why This Exists

Codex behavior is shaped by more than visible chat messages. The harness continuously decides which
state, roles, hidden context, summaries, synthetic user messages, tools, and lifecycle events the
model sees.

Small changes in those surfaces can change whether the agent keeps working from the user's intended
objective or quietly narrows the task to whatever is most recent, concrete, nearby, already
implemented, or easiest to verify.

The local `/goal` work exists to make that intent surface explicit and durable. It is not trying to
make the model blindly obedient. It is trying to preserve the user's active mission while still
letting the agent inspect the repo, use tools, adapt to real evidence, report concrete blockers,
and reject impossible or unsafe execution paths.

This contract is collaborative, not discovered by an agent acting alone. The preferred goal
modality came out of repeated back-and-forth between the user and agents while investigating where
otherwise useful upstream changes disrupted an established working cadence. The point is not to
protect artifacts for their own sake. The point is to protect the execution behavior: whether the
agent keeps pursuing the user's intended final state, across harness and client changes, without
silently collapsing into a weaker user-context interpretation of the goal.

Future review should keep that posture: identify the behavioral effect of a change, compare it to
this agreed operating model, and discuss ambiguous cases with the user instead of assuming the
official upstream shape or the current local shape is automatically right.

## Mental Model

Keep goal state separate from goal steering.

```text
goal state
  durable objective, status, budget, accounting
  persisted outside the prompt transcript
  not itself a model instruction role

goal steering frame
  runtime-generated hidden context
  injected into model input when needed
  sent as user or developer role according to runtime policy
  contains escaped user objective data
```

Goal state answers "what is the active objective and lifecycle state?" Goal steering answers "what
does the model need to see now so it acts on that state correctly?"

The role decision must be applied at the steering boundary where a rendered prompt becomes a model
input item. That is the behavioral point that determines whether hidden goal context reaches the
model as developer-role or user-role guidance.

Storage rows, app-server payloads, slash-command history, preview metadata, usage accounting, and
the raw objective text are not allowed to bypass or redefine that boundary. Future work may decide
to expose or persist steering policy through one of those surfaces, but only as a deliberate design
choice that preserves the runtime steering invariant.

## Preferred Operating Modality

When a goal is active, the agent should treat it as the current mission until the user changes it,
the goal reaches a terminal state, or concrete evidence requires a deliberate adjustment.

The expected posture is:

- Keep the full objective intact across turns.
- Make concrete progress instead of redefining success around a smaller visible subset.
- Use repository evidence and tools to understand execution details.
- Re-ground with `get_goal` when long investigation makes local artifacts louder than the active
  objective.
- Mark the goal complete only when authoritative evidence shows the full objective is achieved.
- Leave the goal active when meaningful work remains.

The goal should make persistence feel natural. It should not make the agent anxious, ritualistic, or
unable to adapt.

## Source Authority

Evidence matters, but evidence is not automatically authority.

Nearby repository artifacts, examples, demos, tests, docs, and existing callers are valuable context
for current integration patterns and historical behavior. Their authority depends on their
relevance to the active objective.

The local source-authority rule is:

```text
Work from the sources that are authoritative for the current objective. Nearby repository
artifacts, examples, demos, tests, and existing callers are valuable context for current integration
patterns and historical behavior, but their authority depends on their relevance to the active
objective. Use them to inform the work without letting proximity, concreteness, or recency narrow
the requested outcome. When sources point in different directions, or after a long investigation
through local artifacts, call get_goal to re-ground on the active objective before choosing the next
implementation direction.
```

This is not a rule against reading local code, tests, examples, demos, docs, or tool output. Those
may be exactly the right sources. The rule is against letting the most concrete or recently
inspected artifact silently become the mission.

## Steering Kinds

All goal steering kinds should pass through one role-aware boundary before they become model input:

- `Initial`: first steering frame for a newly active or resumed goal.
- `Continuation`: follow-up steering when the agent should keep working toward an active goal.
- `BudgetLimit`: steering when the goal budget is exhausted and the agent should summarize rather
  than continue substantive work.
- `ObjectiveUpdated`: steering after the user edits the active objective.

The exact implementation can move as upstream moves goal behavior between core code, state storage,
app-server APIs, or extensions. The contract should move with the boundary where the runtime turns
goal state into hidden model-facing steering.

## Role And Trust Boundary

The local fork preserves a configurable steering role:

- `developer`: local preferred policy for stronger runtime-owned steering.
- `user`: upstream-compatible policy when the hidden context should be delivered as user-role
  context.

Both modes must preserve objective safety:

- Escape objective text before embedding it in steering prompts.
- Label the objective as user-provided data.
- Keep objective wrappers such as `<untrusted_objective>`.
- Treat `<goal_context>` as a hidden runtime marker, not visible user conversation.
- Keep user-role and developer-role goal context hidden from normal transcript display and ordinary
  rollback/history behavior.

Developer-role delivery means the runtime steering frame is trusted. It does not mean the raw
objective is trusted.

## Completion And Budget Semantics

Completion is a lifecycle claim, not a courtesy closeout.

The agent should call `update_goal` with `status = "complete"` only when the active objective is
actually achieved and no required work remains. A goal should not be marked complete because the
turn is ending, the budget is almost exhausted, the agent made partial progress, or the final answer
sounds plausible.

When budget is exhausted, the goal may become budget-limited. The agent should then summarize
progress and remaining work instead of starting new substantive work. Budget pressure should not
redefine the objective.

If later upstream goal states such as `blocked` or `usageLimited` exist, keep them orthogonal to the
steering-role contract. They are lifecycle/accounting states, not places to smuggle role policy.

## Preserve During Upstream Merges

When rebasing or forward-porting upstream Codex changes, preserve these behavioral invariants even
if filenames, crates, or extension boundaries move:

- Goal steering role is runtime policy applied where steering becomes model input.
- The active objective remains escaped user-provided task data.
- `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated` use the same steering boundary.
- Source-authority wording prevents artifact proximity from becoming task authority.
- `<goal_context>` remains hidden runtime context for both user-role and developer-role delivery.
- Preview metadata, slash history, app-server payloads, storage rows, and usage accounting are not
  active objective authority.
- Initial steering for newly active or resumed goals remains a local durability feature unless a
  later design provides an explicit equivalent.
- Core-owned and extension-owned goal paths do not drift into different intent contracts.

Upstream behavior should be reviewed as candidate terrain, not accepted by category. Changes to
goal lifecycle, editing, storage, history, accounting, APIs, prompts, roles, or hidden context may
be improvements, regressions, or mixed shapes depending on how they affect the agreed operating
modality. Preserve the parts that strengthen that modality, adapt the parts that are useful but
cross the steering boundary, reject shapes that weaken objective durability, and bring genuinely
ambiguous tradeoffs back to the user for discussion.

## Forward Looking Requirements

In the current 0.131-shaped branch, the local implementation is not cosmetic and is not TUI-only.
The TUI sets goals through app-server, app-server persists and coordinates the live thread, and the
core runtime turns goal state into `ResponseInputItem::Message` hidden context. The current repair
therefore reaches the behavioral boundary that controls whether hidden goal steering is delivered
as `developer` or `user`.

0.132 should be treated as lifecycle/status evolution, not as a reason to weaken the steering
contract. If blocked, usage-limited, budget, storage, or accounting behavior changes, keep those
states orthogonal to the role boundary. They may decide when steering happens; they must not
silently decide that goal steering is user-role.

0.133 is different because goals become a stable app-server feature. App-server formalizes goal
lifecycle through `thread/goal/set`, `thread/goal/get`, `thread/goal/clear`, and the corresponding
notifications. That does not, by itself, formalize the local goal steering theory. Upstream 0.133
still needs to be reviewed for whether every app-server-initiated goal path reaches the same
configured model-input steering boundary.

The 0.133 forward-port must preserve these requirements:

- `developer` remains the default effective `GoalSteeringRole`.
- App-server-initiated goal creation, update, clear, resume, continuation, and budget/status paths
  must not reintroduce hardcoded user-role `<goal_context>` steering.
- If steering construction moves from core into `codex-rs/ext/goal` or another runtime component,
  the configured role boundary moves with it.
- App-server may expose the effective steering policy through typed config, capability metadata,
  protocol fields, or persisted metadata if that becomes the right design. It must not create a
  separate app-client path whose behavior is only accidentally aligned with TUI behavior.
- Do not add `steeringRole` to `ThreadGoal` merely because `ThreadGoal` is the formal app-server
  lifecycle object. Add per-goal steering policy only if the intended design is that different
  goals can execute under different steering policies.
- If the policy is uniform for all goals, prefer a runtime/config/capability representation over a
  per-goal field. The key requirement is that every client path gets the same developer-role
  behavior by default and future agents can verify that fact from code.
- Ambiguous storage or app-server protocol decisions should be brought back to the user. The
  mission is preserving the functional Goal experience, not protecting an inherited protocol shape.

## Relationship To Plan Handoff

The goal contract and Plan Handoff contract solve the same class of problem from different entry
points.

Plan Handoff preserves an approved assistant-authored plan as active user intent at the moment the
agent switches from planning to implementation.

Goal steering preserves a user-authored durable objective as active intent across turns and runtime
lifecycle changes.

Both contracts reject the same weak pattern: relying on earlier transcript proximity and model
memory when the harness can inject the intended source of scope directly at the moment the model
needs to act.

## Review Basis

This document consolidates the intent behind PR 1 in `cududa/codex`, the local goal research notes,
and the baseline goal commits:

- `60346ef501345e97d2021d8a833bc81e5fecfbd9`: Make goal steering role configurable.
- `7bd45429d714c20bd9526d60936106c1cb2cb7ef`: Fix goal steering follow-up build issues.
- `5cfe837ca4814e4c07ee1778b502df90904a634a`: Add initial goal steering frame.
- `1d5fa70362103c841fad95a2812ff8274bf7691c`: Preserve local goal steering contract across 0.131.

The working theory is that the useful local behavior came from runtime-owned hidden steering being
delivered through a stronger, explicit boundary, especially on initial/resume/continuation paths.
The durable fix is not to freeze upstream goal work. It is to keep that boundary explicit as goal
features evolve.

## Non-Goals

This contract does not require blind execution of a goal. Concrete correctness, feasibility,
security, data-loss risk, explicit compatibility conflicts, or impossible requirements can still
change implementation direction.

This contract does not make nearby repository artifacts suspicious by default. They are often
essential context. They simply do not become authoritative merely because they are local, polished,
fresh, or easy to test.

This contract does not require `steeringRole` to be stored on `ThreadGoal`. `ThreadGoal` currently
represents objective lifecycle, budget, and accounting; per-goal role policy should be added only
if that is an intentional feature.

This contract also does not forbid app-server or persistent surfaces from representing steering
policy. As goals become formal across app-server clients, those surfaces may be exactly where the
effective policy should be visible. What is forbidden is accidental bypass: no client, extension,
storage row, or protocol shape should cause hidden goal steering to fall back to user-role when the
configured/default policy is developer-role.
