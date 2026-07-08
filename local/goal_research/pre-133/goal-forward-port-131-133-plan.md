# Goal Forward-Port Plan: 0.131 Through 0.133

This plan tracks the upstream changes most likely to affect the pinned build's `/goal` workflow as
it moves from the current 0.130-shaped baseline toward 0.131, 0.132, and 0.133.

The central local objective is to keep upstream's useful goal persistence and completion discipline
while avoiding an artifact-proving failure mode where nearby repository artifacts, demos, tests,
docs, or existing callers silently redefine the user's active objective.

## Executive Summary

The primary concern lands in 0.131:

- `96836e15ed` rewrites goal continuation around "Work from evidence," makes the current worktree
  and external state authoritative, strengthens requirement-by-requirement completion auditing, and
  moves hidden goal steering from developer-role messages to hidden user-context messages.

0.132 and 0.133 mostly amplify the same concern:

- 0.132 adds blocked and usage-limited goal states plus strict blocked-audit behavior.
- 0.132 stops ordinary interruption from implicitly pausing active goals.
- 0.133 makes goals default-on/stable and moves more goal behavior into extension-backed storage,
  tools, and accounting.

The local patch strategy should therefore be durable across both core-owned and extension-owned goal
steering paths.

## Amplifier Map

| Release | Change Area | Commit(s) | What Changed | Why It Matters | Local Treatment |
|---|---|---|---|---|---|
| 0.131 | Goal prompt wording | `96836e15ed` | Adds "Work from evidence," current worktree/external state authority, stronger completion audit, and "audit must prove completion." | Primary artifact-proving source. Can make local demos, tests, docs, or existing callers into accidental requirements. | Patch source-authority wording. |
| 0.131 | Goal steering role | `96836e15ed` | Hidden developer steering becomes hidden user-context wrapped in `<goal_context>`. | Changes authority and compaction behavior compared with the 0.130 cadence. | Preserve configurable steering-role policy. |
| 0.131 | Objective edit steering | `1e65b3e0af` | Adds `/goal edit` and an objective-updated hidden steering frame. | Good feature, but another prompt path that must carry the same role and source-authority policy. | Accept, route through same steering boundary. |
| 0.131 | Goal-first history/preview | `2229c8daf2`, `f10ddc3f13` | Persists `/goal` commands and improves goal-first thread preview metadata. | Mostly helpful, but changes how old goal text appears in history and thread surfaces. | Accept; verify no duplicate steering confusion. |
| 0.132 | Blocked and usage-limited states | `0d344aca9b` | Adds `blocked` and `usageLimited`; `update_goal` can mark blocked after repeated impasse. | Missing local artifact proof could become a repeated-blocker loop if prompt wording is too proof-heavy. | Keep feature, align blocked wording with source-authority policy. |
| 0.132 | Explicit pause transitions | `55f6bbc667` | Interruption no longer implicitly pauses active goals. | More active goals remain eligible for automatic continuation after interruption. | Preserve Ctrl+C as turn control; keep goal pausing on explicit `/goal pause`. |
| 0.132 | Tool search exposure | `daa11820b0`, `b3ae3de405` | Removes `tool_search` feature toggle and defers some tools behind search. | More discovery-mediated behavior; not bad, but can amplify artifact seeking. | Watch; do not treat tools as the problem. |
| 0.133 | Goals default-on | `0e9d222178` | Goals become stable and enabled by default. | More sessions experience the goal prompt contract. | Accept only with local prompt/role policy carried. |
| 0.133 | Dedicated goal DB | `ba57aab13a` | Moves goal data to `goals_1.sqlite`. | Goal state becomes more isolated/durable; existing rows are not backfilled. | Accept; document migration expectation. |
| 0.133 | Goal extension tools/storage | `b555dd5d1` | Goal extension tools use the dedicated goal store. | Goal behavior begins moving out of core. | Move local policy with the steering/tool boundary. |
| 0.133 | Extension goal accounting | `d4f842f3b3` | Goal extension accounts progress from tool/turn lifecycle. | Accounting is more durable and extension-owned. | Accept; verify completion/budget reporting still matches local cadence. |
| 0.131-0.133 | Extension/tool lifecycle | multiple | Extension tools, tool lifecycle contributors, dynamic schemas, and deferred tools grow. | Broader runtime surfaces can influence tool discovery and execution. | Watch as amplifiers, not root causes. |
| 0.131-0.133 | Permission/workspace roots | multiple | Permission profiles, workspace roots, managed requirements, and runtime refresh evolve. | Changes what the model sees as readable/writable/current workspace. | Watch; validate pinned config repair/install scripts. |
| 0.131-0.133 | In-repo context durability | multiple | AGENTS/global instructions, compaction prefixes, hooks, and subagent fork baselines become more durable. | Existing repo instructions can stay louder for longer. | Track separately; do not solve in goal patch unless directly involved. |

## Source-Authority Patch

Carry this wording, or a close variant, into the goal continuation prompt:

```text
Work from the sources that are authoritative for the current objective. Nearby repository artifacts, examples, demos, tests, and existing callers are valuable context for current integration patterns and historical behavior, but their authority depends on their relevance to the active objective. Use them to inform the work without letting proximity, concreteness, or recency narrow the requested outcome. When sources point in different directions, or after a long investigation through local artifacts, call get_goal to re-ground on the active objective before choosing the next implementation direction.
```

This should not discourage tool use. Domain documentation tools, API schemas, MCP tools, tests,
source files, examples, and demos may all be authoritative depending on the active objective. The
point is to avoid treating the most local or most recently inspected artifact as automatically
authoritative.

## Release Notes

### 0.131

Accept with local changes:

- `/goal edit` is useful and should be kept.
- Goal prompt hidden-context handling should remain hidden in transcript/history mapping.
- The persistence and "do not shrink the objective" intent is useful.

Patch or review:

- Replace the "current worktree and external state as authoritative" framing with source-authority
  wording tied to the active objective.
- Preserve the local configurable goal steering role rather than accepting a hardcoded hidden
  user-context role.
- Ensure continuation, budget-limit, and objective-updated steering use the same role/source policy.

### 0.132

Accept with wording alignment:

- `blocked` and `usageLimited` are useful stop states.
- Usage-limit handling and repeated-impasse handling are directionally good.

Patch or review:

- Blocked audit should not convert "I cannot prove this from nearby artifacts" into "blocked."
- Ctrl+C remains turn control: interrupt cancellable work, keep the goal active, and allow queued
  input to advance. `/goal pause` is the lifecycle control that pauses the goal and interrupts
  active work.

### 0.133

Accept with boundary movement:

- Default-on goals are acceptable only after local prompt/role policy is carried forward.
- Dedicated goal DB and extension-backed accounting are useful, but they move the patch target.

Patch or review:

- Apply source-authority and role policy in `codex-rs/ext/goal/src/steering.rs` and any remaining
  legacy core paths.
- Keep core and extension goal tool descriptions aligned, especially around `blocked`.
- Verify install/config repair scripts still set the intended local goal defaults.

## Validation Checklist

- Fresh `/goal <objective>` while idle receives the intended initial/continuation steering.
- `/goal resume` uses the same source-authority and role policy.
- `/goal edit` injects objective-updated steering without reverting to upstream-only wording.
- Long local-artifact investigation followed by continuation triggers `get_goal` re-grounding.
- Completion audit does not treat local demos/tests/callers as authoritative unless they are relevant
  to the active objective.
- Missing example/demo coverage is not treated as a blocker when the active objective is to build new
  capability.
- Domain/API documentation tools can remain primary evidence when the active objective depends on
  external or specialized API behavior.
- `update_goal complete` still requires real completion evidence.
- `update_goal blocked` is used only for genuine impasse, not weak artifact proof.
- Goal context remains hidden from normal transcript display and compaction-visible user history.
- Core and extension goal prompts/tool specs do not drift into different contracts.

## Open Decisions

- Should the local build default `goal.steering_role` to `developer`, or should the install/config
  repair path set it while upstream-compatible defaults remain `user`?
- Should initial goal steering continue to exist as a local durability feature when upstream has only
  continuation/objective-updated/budget-limit steering?
- How much of the broader in-repo-context weighting should be patched outside goal prompts in a later
  pass?
