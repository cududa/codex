---
name: findings-guided-implementation
description: Use when implementing a prepared Review Dedeluger finding slice in this repository. Work from tasks.md and the selected slice as the immediate route; use the MCP finding and remediation plan for conflict checks or missing authority; lock the direction, inspect bounded terrain, execute, verify, and keep route artifacts current.
metadata:
  short-description: Implement prepared Review Finding slices inside the locked route
---

# Findings-Guided Implementation

Use this skill to implement a Review Finding route, especially when
`finding-implementation-prep` has already created repo-local slice packets.

Use prepared `tasks.md` and the selected slice packet as the immediate route.
Use `plan-coverage.md` when checking cross-slice assignment or whether a plan
section landed somewhere. Use the MCP finding and remediation plan for conflict
checks, stale slice details, or missing authority. Use existing code as terrain.
Execute the selected slice inside the locked direction.

This skill is for execution. It should not try to carry a large remediation
plan, decompose the whole finding, and implement code all in one breath. When
prepared slice material exists, start there. When it does not, create only the
smallest route surface needed for the current coherent slice, then move.

## Source Order

Use sources in this order:

1. Current user instructions
2. Prepared `tasks.md` and the selected slice packet, when present
3. Prepared `plan-coverage.md`, when cross-slice assignment context is needed
4. The named Review Finding and remediation plan, only for conflict checks,
   missing authority, stale slice details, or when no prepared slice exists
5. Artifact treatments, linked findings, notes, discussions, and concern areas
6. Existing code, generated files, parked diffs, and tests as implementation
   terrain

Prepared files are the immediate work surface, not a smaller authority. If a
prepared slice conflicts with the MCP finding or remediation plan, the MCP
finding and plan win unless the user explicitly updates the local route.

`AGENTS.md` and repo-local instructions still constrain implementation and
verification. In this repository, they may also be terrain or source material
that the finding is deliberately adapting or superseding.

## Operating Posture

You are entering managed terrain with a prepared route. The job is not to solve
the whole forest before taking an ordinary step. The job is to keep the user's
mission visible, respect the route, inspect the local path, and complete the
selected slice steadily.

The useful frame is mission, authority, and terrain:

- user intent names the mission;
- the prepared slice, applicable instructions, finding contract, and MCP plan
  constrain the mission;
- existing code is terrain.

Existing code matters deeply. It shows mechanics, names, helper APIs, tests,
integration points, and current behavior. But terrain is not mission. A nearby
endpoint is not permission to change the task. A convenient helper is not proof
that the new responsibility belongs there. Notice code-shape temptation, name
it when useful, and return to the selected slice.

Most guidance in this skill is a sign: it helps you keep moving in the right
direction. Sirens are rarer. Stop or ask only when continuing would silently
change scope, behavior, authority, or meaning.

Ordinary implementation uncertainty is expected. Helper names, exact placement,
test body mechanics, and small API choices can usually be resolved from the
slice packet, nearby code, tests, and repo instructions.

Ask or pause only when the missing answer would change scope, behavior,
authority, or meaning.

Do not make the slice smaller by silently dropping the part that is hard to fit
into current code. Do not preserve old file layout, ownership, helper names, or
public surface merely because preservation feels calmer. When the finding
protects a behavior, invariant, or responsibility, preserve that substance in
the current repo terrain.

## Artifact Treatment Semantics

Use artifact treatments as route cues, not passive labels.

- `accepted` means integrate the artifact as route terrain for the selected
  slice. It does not mean no code work is required, and it does not mean the
  artifact defines local policy.
- `adapted` means carry the incoming terrain or intent through the finding's
  local contract. It is not a rejection of upstream and not a license to
  preserve the old local shape.
- `rejected` means historical context only unless the finding or user gives a
  narrower use.
- `needs_evaluation` means pause before implementation if the artifact affects
  the selected slice. Research or ask rather than guessing across a
  scope-changing gap.

The current live implementation is not automatically the preferred shape.
Parked incoming blocks, preserved diffs, generated files, historical
implementations, and future-upstream notes are also artifacts whose status
depends on the finding and plan.

## Prepared Route Material

When a repo-root prepared route directory exists, for example
`finding-<short-id>-implementation/`, use it.

Treat `tasks.md` as the progress ledger. Treat slice packets as the route for
each coherent work unit. Treat `plan-coverage.md` as an assignment check when
cross-slice context matters, not as a second plan. Keep these artifacts current
as part of execution, not as cleanup.

Start with `tasks.md`:

- select the user-named slice, or the next `pending` slice when the user asks
  you to continue;
- read the selected slice packet before broad code inspection;
- use the slice packet as the immediate route surface;
- consult `plan-coverage.md` only when you need to confirm where a plan section
  was assigned or how slices relate;
- verify surprising, stale, or conflicting slice details against the MCP
  finding and remediation plan;
- update `tasks.md` and the slice notes after completion, before stopping, and
  after resuming from compaction.

The task index tracks progress. The slice packet carries the route. The
coverage map checks assignment. Keep the next agent on the same managed
terrain, not on your memory of it.

If the prepared route directory has multiple slices, complete coherent slices
rather than shrinking the route to whatever fits in one context window.

## Continuity Across Compactions

Large findings are expected to continue across compactions and agent handoffs.
The prepared route directory is the continuity surface.

At the start of a turn:

- read `tasks.md` before broad code inspection;
- read the selected slice packet;
- use the task index and slice notes to resume, not memory.

During work:

- keep the current slice status accurate;
- record route-relevant discoveries in the slice notes;
- do not rely on the final response as the only handoff.

Before stopping or when context gets tight:

- update `tasks.md`;
- update the selected slice packet with what changed, what remains,
  verification run, and the exact next resume point.

The next agent should be able to continue from `tasks.md`, the selected slice
packet, and `plan-coverage.md` when needed. The MCP finding and plan remain the
authority for conflict checks, but they should not be required for ordinary
slice execution.

## Finding Retrieval

When the user provides a Review Finding ID, retrieve the finding through the
Review Dedeluger MCP unless the current task is explicitly limited to editing
already-prepared local skill or slice files.

When prepared route material exists and the selected slice is sufficient, do
not retrieve or reread the full remediation plan by default. Retrieve the MCP
remediation plan when:

- there is no prepared slice material;
- the selected slice is stale, surprising, incomplete, or internally
  contradictory;
- the selected slice conflicts with `plan-coverage.md`, artifact treatments, or
  the finding contract;
- a missing authority answer would change scope, behavior, authority, or
  meaning;
- the user explicitly asks you to audit or compare against the MCP plan.

Capture only the context needed for the selected slice:

- finding title
- guiding invariant or intent
- local contract
- explicit non-goals
- concern areas relevant to the slice
- artifact treatments relevant to the slice
- unresolved discussions or open questions that affect the slice
- whether the remediation plan has been accepted or is still draft

If the finding cannot be retrieved, pause and say the finding lookup is
blocked.

## Slice Direction Lock

Before file edits, confirm the selected slice direction visibly. If prepared
slice material exists, this can be brief. If no prepared slice exists, derive
the lock from the finding, remediation plan, and artifact treatments.

Use this checkpoint:

```markdown
## Slice Direction Lock

- Request:
- Finding:
- Slice:
- Route:
- Terrain:
- Artifact posture:
- Code-shape temptation:
- Locked direction:
- Exclusions:
- Verification:
```

The direction lock is the decision point. Ordinary implementation choices can
still happen, but they stay inside the locked shape.

If terrain contradicts the locked direction, report the conflict rather than
silently changing the route.

## Slice-Scoped Terrain Check

Inspect the terrain named by the selected slice first:

- files and functions named by the slice packet, or by the remediation plan
  only when no prepared slice exists or a conflict check required retrieving
  it;
- relevant live code, parked incoming blocks, preserved diffs, generated files,
  tests, templates, schemas, routes, tools, and ownership boundaries;
- adjacent code needed to understand mechanics and local conventions;
- targeted test locations and verification commands.

Keep the first pass bounded. Broad archaeology is useful only when the slice
requires it. Existing code can inform mechanics, naming, helper reuse, and
integration points. Keep the implementation shape tied to the slice route.

If a nearby artifact starts pulling the work toward a different task, name the
code-shape temptation and return to the direction lock.

## Execution

Carry out the selected slice inside the locked direction.

Implementation generally means integrating accepted or adapted incoming terrain
through the finding's contract. Existing local code and incoming blocks are
both terrain; let the finding decide how they fit together.

Resolve, adapt, or explicitly supersede parked incoming blocks according to the
selected slice packet, finding contract, artifact treatments, and MCP plan only
when it has been retrieved for conflict or missing-authority checks. Do not
route around them merely because the current live implementation still works.

Likewise, do not import future-upstream architecture merely because the finding
mentions it as sequencing context. Future markers can guide shape without
becoming current scope.

When the selected slice's carried plan requirements say to preserve a behavior,
invariant, or contract, preserve that substance. Do not assume it requires
preserving the current file layout, helper shape, ownership shape, or public
surface unless the carried requirements say so.

When the plan protects a responsibility rather than a file shape, implement the
responsibility in the current upstream terrain. Do not preserve old local
ownership, helper names, or module layout unless the finding explicitly
requires them.

Update prepared route artifacts as you work:

- mark the current slice `in_progress` when beginning substantial work;
- mark it `done` only after implementation and targeted verification are
  complete, or note what verification remains;
- record one-line completion notes and the exact next resume point;
- if blocked, name the conflict or scope-changing ambiguity in both the final
  response and the task index.

When context gets tight, finish the current coherent slice if possible. If not,
leave the task index and slice notes accurate enough for the next agent to
continue without rediscovering the route.

## Pause And Report Conflict

Pause when proceeding would require changing the finding-guided route rather
than executing it.

Pause for true sirens:

- current user instructions conflict with the finding, remediation plan, or
  selected slice;
- prepared slice material and the MCP finding or remediation plan materially
  conflict;
- the finding, plan, or applicable authority docs directly contradict each
  other;
- a required artifact is missing and guessing would change behavior or scope;
- artifact treatments are absent or ambiguous for a shape the selected slice
  depends on;
- the locked direction is impossible as stated in the current repo;
- unresolved discussions or open questions materially affect implementation.

Do not pause for ordinary implementation choices:

- exact helper name;
- exact placement inside a named module;
- small API shape choices inside a locked responsibility;
- test body mechanics;
- whether to reuse a local helper after inspecting the terrain.

Use direct language: conflict, impossible as stated, scope-changing ambiguity,
directly contradicted, missing artifact treatment, missing terrain, or would
change the requested route.

Avoid anxiety framing such as unsafe, dangerous, risky, protect, least
invasive, safer approach, or preserve current behavior unless the finding or
user explicitly scopes the work that way.

## Verification

Verify the selected slice against:

- the user's request;
- prepared `tasks.md` and the selected slice packet, when present;
- the finding's invariant and local contract;
- the selected slice's carried plan requirements and verification checklist;
- `plan-coverage.md` when assignment or cross-slice context matters;
- artifact treatments and explicit exclusions;
- applicable repository instructions;
- targeted tests or commands named by the slice or plan.

Do not treat "it matches live code" or "it compiles" as sufficient
verification when the finding requires a specific boundary, role, ownership,
schema, prompt, hiddenness rule, or behavior.

Run the targeted verification named by the slice or plan unless the user
explicitly asks not to or the command is unavailable in the current
environment. Do not run broad crate or workspace suites by default.

For docs-only updates, report files changed, tests not run, and unresolved
assumptions.

For implementation work, update the prepared task index with commands run,
commands not run, and any verification still needed.

## Fallback: No Prepared Slices

This skill can still operate when no prepared route directory exists.

If the finding is small, derive the Slice Direction Lock directly from the
Review Finding, remediation plan, and artifact treatments, then implement the
coherent slice.

If the finding is large, prefer prepared route material. When the user asks for
prep, use `finding-implementation-prep`. When the user asks to implement a
large finding and no prepared route exists, do not improvise from the whole MCP
plan unless the user explicitly asks to skip prep or the current request is
clearly limited to one coherent slice. Otherwise, pause and say the route needs
prep first.

For a large finding, fallback route material must still create a task index or
slice note for the current coherent slice before broad terrain inspection. Do
not implement a large finding from memory alone, and do not shrink the route to
the easiest nearby code shape.

Do not let the absence of prepared slices become a reason to carry the entire
finding in memory.

