---
name: finding-implementation-prep
description: Use when a Review Dedeluger remediation plan is too large to implement directly and should first be staged as a temporary local working copy, projected losslessly into bounded slice documents, and annotated with bounded repo terrain for later findings-guided implementation.
metadata:
  short-description: Preserve a Review Finding remediation plan as execution slices without dropping requirements
---

# Finding Implementation Prep

Use this skill when a Review Finding remediation plan is large enough that
implementation agents should not work directly from one long MCP body in model
context.

This is preservation work first and planning work second. The Review Dedeluger
remediation plan is authoritative. The prep agent's job is not to reinterpret,
compress, improve, or consolidate the plan into a smaller plan. The job is to
make bounded local execution packets that later agents can read one slice at a
time without losing any requirement from the MCP plan.

Do not implement product code under this skill. Create continuity artifacts
that preserve the route, make every requirement traceable, and add only bounded
terrain notes that help a later implementation agent execute the preserved
route.

## Source Order

Use sources in this order:

1. Current user instructions
2. The named Review Finding and remediation plan
3. Artifact treatments, linked findings, notes, discussions, concern areas, and
   accepted remediation-plan execution state
4. Existing code, generated files, parked diffs, and tests, but only after the
   MCP plan has been copied locally and projected into initial slices

`AGENTS.md` and repo-local instructions still constrain generated files and
future implementation work. They do not outrank the finding route.

## Non-Negotiable Preservation Rules

- The MCP remediation plan must be copied into the output directory before
  slice writing begins.
- That source-plan copy is temporary staging material. Delete it after the
  slices and coverage map have been audited, unless the user explicitly asks to
  keep it.
- Slice docs must be built from that copied plan text, not from memory or a
  compressed summary.
- Do not omit a plan requirement because it looks redundant, mechanical,
  obvious, already done, test-only, or better handled elsewhere.
- Do not consolidate separate requirements unless each original requirement is
  still visibly traceable to a slice.
- Do not read implementation code before the initial source-plan copy,
  requirement inventory, and first-pass slice projection exist.
- Terrain investigation may add anchors, stale-symbol notes, likely tests, and
  ordering details. It must not redefine the route or silently remove plan
  obligations.
- If terrain suggests a requirement is stale, impossible, contradictory, or
  already implemented, preserve the requirement in the slice and record the
  terrain result as a note, conflict, or verification status.
- Later implementation agents should not need to reread the MCP plan or a full
  local copy of it to know what to do. They may reread MCP for conflict checks,
  but the selected slice must already carry the operative requirements.

## Output Shape

Create a repo-root directory for the prepared route, for example:

`finding-<short-id>-implementation/`

Inside it, write:

- `source-remediation-plan.md`: temporary full working copy of the MCP
  remediation plan, deleted before closeout
- `plan-coverage.md`: requirement-to-slice coverage map
- `tasks.md`: sparse task index and resume point
- one numbered slice document per coherent implementation slice, for example
  `01-extension-steering-boundary.md`

Do not create a second remediation plan. The MCP remediation plan remains
authoritative; `source-remediation-plan.md` is only a faithful temporary
working copy used to prevent omissions while preparing bounded slice docs. It
should not remain as durable execution material because reading the full plan is
exactly what the slices are meant to avoid.

## Temporary Source Plan Copy

Write the MCP remediation plan body before writing slices.

Prefer this shape:

```markdown
# Source Remediation Plan

- Finding:
- Plan id:
- Retrieved from:
- Retrieved at:
- Last edited by:
- Plan updated at:
- Execution acceptance:

---

<full MCP remediation plan body>
```

Preserve headings, bullets, test lists, command lists, exclusions, artifact
treatments, and expected final state. Do not paraphrase this file.

If the MCP response is too large for one read, read it in chunks and assemble
the local copy from the complete body. Stop if you cannot confirm the copy is
complete.

After the final coverage audit, delete this temporary file unless the user
explicitly requested that it be kept. Durable artifacts should be bounded:
`tasks.md`, `plan-coverage.md`, and numbered slice packets.

## Requirement Inventory And Coverage

Before slice drafting, build a requirement inventory from the temporary local
`source-remediation-plan.md`.

The inventory is an omission check, not a second plan. Keep it brief, but
complete enough to prove that each plan section, bullet group, required change,
test, verification command, non-goal, exclusion, and expected final-state item
maps to at least one slice or shared artifact.

Prefer `plan-coverage.md`:

```markdown
# Plan Coverage

## Coverage Table

| Plan section | Assigned to | Notes |
| --- | --- | --- |
| Direction Lock | 01, 03 | GoalContext terrain and core boundary carried in slices |
| Step 4.1 Filter Only Persisted Stale Goal Frames During Reconstruction | 04 | All bullets carried in slice |
| Verification Commands | tasks.md and slice verification sections | Shared fix commands retained |

## Unassigned Requirements

- None.
```

Use stable plan anchors such as heading names, bullet numbers inside a heading,
or short quoted phrases. Do not reproduce slice bodies in `plan-coverage.md`;
use it only to show assignment. The table should stay compact and does not need
to reproduce the entire plan, but it must prove that every part of the plan was
assigned somewhere.

If a requirement belongs to multiple slices, list all slices. If a requirement
is intentionally shared, name the shared artifact and explain the handoff.

## Slice Packet

Each slice document should be specific enough that a later agent can implement
the slice without rediscovering the entire remediation plan.

The most important section is `Plan Requirements`. It should carry the relevant
MCP plan language nearly verbatim. Use light formatting edits only to keep the
slice readable. Do not compress a long requirement into a short interpretation
when exact wording matters.

Prefer this shape:

```markdown
# Slice NN - <slice name>

## Direction Lock

- Finding:
- Plan route:
- Slice responsibility:
- Explicit exclusions:

## Plan Requirements

Copied or near-verbatim requirements from the MCP plan staging copy that this
slice owns.

## Requirement Coverage

| Source plan anchor | Local treatment |
| --- | --- |
| Step 2 / Required `extension.rs` changes | Carried in this slice |

## Established Facts

- Facts from the finding, plan, artifact treatments, or initial terrain check.

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
- Terrain conflicts or stale anchors:

## Verification

- Targeted commands:
- Required proof:

## Underspecification

None.
```

The `Plan Requirements` section may be long. That is acceptable. These files are
execution material, not a short executive summary.

## Sparse Task Index

`tasks.md` is an index and status file, not the plan body.

Prefer this shape:

```markdown
# Finding <short-id> Implementation Tasks

## Route

- Finding:
- Direction:
- Source plan:
- Coverage map:
- Prepared from:

## Status

- Overall: pending

## Slice Index

| Slice | Packet | Status | Notes |
| --- | --- | --- | --- |
| 01 | [Extension steering boundary](01-extension-steering-boundary.md) | pending | |

## Shared Verification

- Commands or checks from the MCP plan that apply after multiple slices.

## Open Questions

- None.

## Resume Point

Start with slice 01.
```

Statuses are `pending`, `in_progress`, `done`, or `blocked`.

The task index can be sparse because `plan-coverage.md` and the slice packets
carry the route.

## Workflow

### 1. Retrieve The Finding

Retrieve the Review Finding through the Review Dedeluger MCP before reading
implementation code.

Also retrieve the remediation plan. Gather artifact treatments, linked findings,
notes, discussions, maintained commits, concern areas, and execution acceptance
when they are relevant to preserving the route.

Capture:

- finding title
- guiding invariant or intent
- local contract
- explicit non-goals
- concern areas
- artifact treatments
- unresolved discussions or open questions
- remediation plan id, updated time, and execution acceptance

If the finding or remediation plan cannot be retrieved, pause and say the
lookup is blocked.

### 2. Prep Direction Lock

Before writing files or reading code, state the route from the user request,
finding, remediation plan, and artifact treatments.

Use this checkpoint:

```markdown
## Prep Direction Lock

- Request:
- Finding:
- Plan route:
- Preservation rule:
- Accepted terrain:
- Adapted terrain:
- Substrate artifacts that must not define policy:
- Future markers left alone:
- Output directory:
- Expected artifacts:
```

This lock keeps the mission visible while preserving the plan. It does not
replace the plan body.

### 3. Write The Temporary Source Plan Copy

Create the output directory and write `source-remediation-plan.md` with the full
MCP remediation plan body.

Do not draft slices until this file exists.

If an output directory already exists, inspect it first. Do not overwrite user
or prior-agent work unless the user asked for a rebuild. When rebuilding, keep
the same preservation rule: the temporary full source copy comes first, then it
is deleted after the final coverage audit.

### 4. Inventory The Plan

Read the temporary local source copy and create a requirement inventory.

Include:

- each implementation step and substep
- file/function lists
- required changes
- prompt, role, hiddenness, lifecycle, replay, compaction, and authority
  constraints
- explicit non-goals and exclusions
- artifact treatment decisions
- required tests and verification commands
- expected final-state bullets
- formatting/fix/schema/regeneration commands

Write `plan-coverage.md` with every requirement assigned to a slice, shared
verification, or explicit open question.

### 5. Draft First-Pass Slices From The Plan

Create slice documents from the copied plan and coverage map.

At this point, slices should be plan-faithful, even if terrain anchors are still
rough. Carry the MCP wording nearly verbatim in `Plan Requirements`. Preserve
test lists, exact command lists, non-goals, and "do not" constraints. The slice
documents, not the temporary source-plan copy, are the durable execution
material.

Split slices when plan sections have different:

- ownership boundaries
- model-input or authority boundaries
- replay, compaction, or lifecycle behavior
- artifact treatments
- file groups
- tests or verification commands
- handoff notes

Do not merge distinct workstreams into a broad bucket when they require
different files, tests, or invariants. Do not split merely to make the slice
documents short.

### 6. Bounded Terrain Enrichment

Only after the source copy, coverage map, and first-pass slices exist, inspect
repo terrain.

This is not a free-form investigation phase. Inspect only enough terrain to make
the already-preserved slice packets executable:

- confirm named files exist
- confirm named symbols, tests, or parked blocks where the plan depends on them
- identify obvious test locations
- catch stale file names or missing anchors
- identify ordering constraints between slices

Existing code informs slice mechanics and anchors. It does not replace the
finding route.

Add terrain results to the relevant slice under `Established Facts`, `Scope`,
`Terrain Notes`, or `Verification`. The terrain pass should give each slice
local execution coordinates: files, functions, modules, tests, stale anchors,
and cross-slice ordering notes.

Do not use terrain enrichment to:

- decide whether the plan requirement is still worth doing
- replace MCP plan language with a code-derived interpretation
- broaden scope because nearby code looks related
- chase architecture questions not needed to locate the slice work
- read enough code to start redesigning the route
- silently drop a requirement because terrain makes it awkward

If terrain contradicts the plan, preserve the requirement in the slice and mark
the contradiction as a terrain conflict, missing terrain, verification gap, or
underspecification.

### 7. Preserve Conflicts Instead Of Editing Them Away

Flag underspecification only when the missing answer would change scope,
behavior, authority, or meaning.

Examples that should be flagged:

- a required artifact treatment is absent or ambiguous
- the finding and plan directly contradict each other
- the plan depends on a file, symbol, or artifact that appears absent
- the plan requires a behavior decision not recoverable from the finding, plan,
  discussions, or repo terrain
- required verification has no plausible test location or command
- a plan requirement cannot be assigned to a slice without changing its meaning

Examples that should not be flagged:

- exact helper name
- exact placement inside a named module
- test body mechanics
- ordinary API shape choices inside a locked responsibility
- whether to reuse a helper after local inspection
- a simple slice that still needs normal code reading

Use direct language: `scope-changing ambiguity`, `missing artifact treatment`,
`direct contradiction`, `missing terrain`, `verification gap`, or
`coverage gap`.

### 8. Final Coverage Audit

Before deleting the temporary source copy and closing out, re-read:

1. `source-remediation-plan.md`
2. `plan-coverage.md`
3. `tasks.md`
4. every slice packet

Confirm:

- every plan section maps to a slice or shared artifact
- every required test and command appears in slice verification or shared
  verification
- every non-goal and exclusion appears where it can constrain implementation
- every expected final-state item is represented
- no slice silently converts plan language into a narrower interpretation
- terrain notes add detail without dropping requirements

If anything is unassigned, fix the local artifacts before closeout.

After this audit passes, delete `source-remediation-plan.md` unless the user
explicitly asked to keep it. Confirm that durable execution can proceed from
`tasks.md`, `plan-coverage.md`, and the selected slice without reading the full
plan.

### 9. Closeout

Report:

- output directory
- source plan copy disposition: deleted after coverage audit, or retained only
  because the user explicitly requested it
- coverage map path
- slice count
- task index path
- true underspecification or coverage gaps, if any
- tests not run
- recommended first implementation slice

If no true underspecification or coverage gaps were found, say so directly.

## Handoff To Implementation

Later implementation should use `findings-guided-implementation`.

The implementation agent should start from:

1. Current user request
2. `tasks.md`
3. The selected slice packet
4. `plan-coverage.md` when checking assignment or cross-slice context
5. The Review Finding and remediation plan for conflict checks only
6. Repo terrain for execution

If a prepared slice packet and the MCP remediation plan conflict, the MCP
finding and remediation plan win unless the user explicitly updates the local
route.
