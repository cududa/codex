---
name: finding-implementation-prep
description: Use when a Review Dedeluger remediation plan is too large to implement directly and should first be decomposed into repo-local slice documents and a sparse task index for later findings-guided implementation.
metadata:
  short-description: Prepare large Review Finding remediation plans as implementation slices
---

# Finding Implementation Prep

Use this skill when a Review Finding or remediation plan is large enough that
implementation should not start from one long plan body in the model context.
This is preparation work. It turns the Review Dedeluger route into repo-local
slice packets and a sparse task index that later implementation agents can use
without re-compressing the whole finding.

Do not implement product code under this skill. Create continuity artifacts
that preserve the finding route, make ordinary slices visible, and identify
only the missing answers that would change scope or behavior.

## Source Order

Use sources in this order:

1. Current user instructions
2. The named Review Finding and remediation plan
3. Artifact treatments, linked findings, notes, discussions, concern areas, and
   accepted remediation-plan execution state
4. Existing code, generated files, parked diffs, and tests as terrain for
   locating slice boundaries, not for redefining the route

`AGENTS.md` and repo-local instructions still constrain generated files and
future implementation work. They do not outrank the finding route when this
workflow is preparing a finding-guided implementation.

## Output Shape

Create a repo-root directory for the prepared route, for example:

`finding-<short-id>-implementation/`

Inside it, write:

- `tasks.md` as the sparse task index
- one numbered slice document per coherent implementation slice, for example
  `01-extension-steering-boundary.md`

The task index tracks progress. The slice documents carry the route.

Do not create a second remediation plan. The Review Finding and remediation
plan remain authoritative. The prepared files are a local work surface that
preserves the route in smaller packets.

## Slice Packet

Each slice document should be specific enough that a later agent can implement
the slice without rediscovering the entire remediation plan.

Prefer this shape:

```markdown
# Slice NN - <slice name>

## Direction Lock

- Finding:
- Plan route:
- Slice responsibility:
- Explicit exclusions:

## Established Facts

- ...

## Artifact Posture

- Accepted:
- Adapted:
- Rejected or stale:
- Future markers left alone:

## Scope

- Files/functions:
- Concrete work:
- Preserve:
- Avoid:

## Terrain Notes

- Named anchors:
- Likely tests:
- Related slices:

## Verification

- Targeted commands:
- Required proof:

## Underspecification

None.
```

Keep the direction and facts short, but include the concepts that prevent drift:
authority boundary, replay distinction, ownership boundary, non-goal, role
boundary, prompt contract, hiddenness rule, or lifecycle invariant.

## Sparse Task Index

`tasks.md` is an index and status file, not the plan body.

Prefer this shape:

```markdown
# Finding <short-id> Implementation Tasks

## Route

- Finding:
- Direction:
- Source plan:
- Prepared from:

## Slice Index

| Slice | Packet | Status | Notes |
| --- | --- | --- | --- |
| 01 | [Extension steering boundary](01-extension-steering-boundary.md) | pending | |

## Open Questions

- None.

## Resume Point

Start with slice 01.
```

Statuses are `pending`, `in_progress`, `done`, or `blocked`.

The task index can be sparse because the slice packets carry the implementation
route. Do not duplicate every detail from every slice into `tasks.md`.

## Workflow

### 1. Retrieve The Finding

Retrieve the Review Finding through the Review Dedeluger MCP before reading
implementation code.

Also retrieve the remediation plan when one exists.

Capture:

- finding title
- guiding invariant or intent
- local contract
- explicit non-goals
- concern areas
- artifact treatments
- unresolved discussions or open questions
- whether the remediation plan has been accepted or is still draft

If the finding or remediation plan cannot be retrieved, pause and say the
finding lookup or plan lookup is blocked.

### 2. Prep Direction Lock

Before reading broad code, state the route from the user request, finding,
remediation plan, and artifact treatments.

Use this checkpoint:

```markdown
## Prep Direction Lock

- Request:
- Finding:
- Plan route:
- Accepted terrain:
- Adapted terrain:
- Substrate artifacts that must not define policy:
- Future markers left alone:
- Output directory:
```

This lock keeps the mission visible while decomposing the plan. It does not
need final implementation mechanics.

### 3. Decompose The Plan

Split the remediation plan into coherent implementation slices.

A good slice has one primary responsibility, one local route, and a focused set
of files or tests. It should be small enough for an implementation agent to
complete or intentionally stop with a clear next point.

Split slices when plan sections have different:

- ownership boundaries
- model-input or authority boundaries
- replay, compaction, or lifecycle behavior
- artifact treatments
- file groups
- tests or verification commands
- handoff notes

Do not split merely because a section is long if the work is one coherent
responsibility.

Do not merge distinct workstreams into a broad bucket when they require
different files, tests, or invariants.

### 4. Bounded Terrain Check

Inspect only enough repo terrain to make the slice packets concrete:

- confirm named files exist
- confirm named symbols, tests, or parked blocks where the plan depends on them
- identify obvious test locations
- catch stale file names or missing anchors
- avoid broad implementation reading that would tempt route changes

Existing code informs slice mechanics and anchors. It does not replace the
finding route.

### 5. Write The Prepared Artifacts

Create the output directory, `tasks.md`, and numbered slice packets.

For each slice, preserve:

- the relevant part of the Direction Lock
- established facts that matter for the slice
- artifact posture
- concrete scope
- preserve/avoid constraints
- targeted verification
- related slices or ordering

Keep the files readable. A slice packet should be detailed enough to resume
from, but not so large that it becomes the whole remediation plan again.

### 6. Mark True Underspecification

Flag underspecification only when the missing answer would change scope,
behavior, authority, or meaning.

Examples that should be flagged:

- a required artifact treatment is absent or ambiguous
- the finding and plan directly contradict each other
- the plan depends on a file, symbol, or artifact that appears absent
- the plan requires a behavior decision not recoverable from the finding, plan,
  discussions, or repo terrain
- required verification has no plausible test location or command

Examples that should not be flagged:

- exact helper name
- exact placement inside a named module
- test body mechanics
- ordinary API shape choices inside a locked responsibility
- whether to reuse a helper after local inspection
- a simple slice that still needs normal code reading

Use direct language: `scope-changing ambiguity`, `missing artifact treatment`,
`direct contradiction`, `missing terrain`, or `verification gap`.

Avoid anxiety framing such as unsafe, dangerous, risky, protect, least
invasive, or safer unless the finding or user explicitly uses that domain.

### 7. Closeout

Report:

- output directory
- slice count
- task index path
- true underspecification, if any
- tests not run
- recommended first implementation slice

If no true underspecification was found, say so directly.

## Handoff To Implementation

Later implementation should use `findings-guided-implementation`.

The implementation agent should start from:

1. Current user request
2. The prepared `tasks.md`
3. The selected slice packet
4. The Review Finding and remediation plan for verification or conflict checks
5. Repo terrain for execution

If the prepared slice packet and the MCP remediation plan conflict, the MCP
finding and plan win unless the user explicitly updates the local route.
