---
name: findings-guided-implementation
description: Use when implementing a Review Dedeluger finding or remediation plan in this repository, especially when the user provides a Review Finding ID. Retrieve the finding and plan first, classify artifact treatments, sketch the ledger for large plans, do bounded terrain triage, lock direction, then inspect and edit the repo terrain.
metadata:
  short-description: Implement Review Findings from their researched plan and artifact map
---

# Findings-Guided Implementation

Review Findings are researched signposts for this repository. They carry the
intent, local contract, non-goals, concern areas, artifact treatments, and often
an implementation plan that explains how the work should move through layered
repo terrain.

Use the Review Finding as the route sheet. Use artifact treatments as the map
legend. Use existing code as terrain.

The current live implementation is not automatically the preferred shape.
Parked incoming blocks, preserved diffs, generated files, historical
implementations, and future-upstream notes are also artifacts whose status
depends on the finding and plan.

## Source Order

Use sources in this order:

1. Current user instructions
2. The named Review Finding and its remediation plan
3. Artifact treatments, linked findings, notes, discussions, and concern areas
4. Existing code, generated files, parked diffs, and historical artifacts as
   implementation terrain

`AGENTS.md` and repo-local instructions may still matter as terrain,
constraints, or source material, but they do not outrank the finding route in
this workflow. In this repository, they may reflect upstream defaults that the
finding is deliberately adapting or superseding.

The finding and plan do not make the repo simple. They make the route visible.

## Artifact Treatment Semantics

Use artifact treatments as route cues, not as passive labels.

- `accepted` means integrate the incoming artifact into the implementation
  route. It does not mean no code work is required, and it does not mean the
  artifact defines local policy.
- `adapted` means accept the incoming terrain or intent, but modify its
  integration so it satisfies the finding's local contract. It is not a
  rejection of upstream and not a license to preserve the old local shape.
- `rejected` means do not carry the artifact's behavior forward except as
  historical context.
- `needs_evaluation` means pause before implementation if the artifact affects
  the route. Research or ask rather than guessing.

When a finding says to accept incoming code represented as parked or commented
blocks, implementation usually starts from integrating that incoming terrain
unless the finding or treatment says otherwise.

## Large Finding Rule

Some findings are wider than one agent can comfortably hold in working memory.
When a finding spans multiple concern areas, many commits, or cross-cutting
surfaces such as prompt roles, compaction, app-server history, runtime
injection, storage, tool schemas, hidden context, or model-input conversion,
fan out focused research before broad implementation.

Assign disjoint questions where useful: artifact map, live code embodiment,
tests, hidden/replay surfaces, extension/runtime path, and future-version or
non-goal boundaries. The parent coordinates retrieval, initial ledger,
bounded triage, Direction Lock, synthesis, and implementation after the first
summaries return.

For a large finding, do not spend the parent context walking implementation
files before this route is sketched. First retrieve the finding, plan, and
artifact treatments; fan out focused research where useful; create the initial
ledger; then inspect terrain through that route. A brief file inventory or
exact-symbol check is fine when it helps write the ledger or subagent prompts.

## Implementation Ledger

For large remediation plans, create a sparse implementation ledger in the repo
root before broad terrain inspection or code edits, for example:

`finding-<short-id>-implementation-ledger.md`

The ledger is a working continuity artifact, not a second plan and not a
replacement for the Review Finding or remediation plan. It lets the work move
in ordinary slices without asking one context window to carry the whole route.
Sparse means compact, not high-level: the ledger should be short enough to scan
and specific enough that a resumed agent can continue without rediscovering the
remediation plan.
Keep it brief, but make it resumable:

- Direction lock summary
- Ordered task slices from the plan, preferably one item per numbered plan step
  or plan substep
- Files/functions for each slice
- Concrete work to do
- Artifact treatment posture
- Status: `pending` / `in_progress` / `done` / `blocked`
- One-line completion notes
- Verification run or still needed
- Next resume point

For plans with numbered implementation steps, include a short coverage matrix
before task slices:

```markdown
| Plan section | Ledger slice | Status |
| --- | --- | --- |
| Step 1 | Extension steering boundary | pending |
| Step 2 | Extension config/runtime role propagation | pending |
```

If the plan has substeps, represent substeps when they carry distinct behavior,
files, tests, or handoff notes.

For each slice, prefer this shape:

```markdown
### <plan section> - <slice name>
- Artifact posture:
- Files/functions:
- Concrete work:
- Preserve:
- Avoid:
- Verification:
- Status:
- Notes:
```

For large findings, `Preserve`, `Avoid`, and `Verification` are required for
each slice. These fields are what keep the ledger from becoming only a file
checklist.

The ledger should capture the plan's core concepts, not only its file list. If a
plan section exists because of a subtle invariant, replay distinction, role
boundary, ownership boundary, or non-goal, name that in the slice.

Do not collapse distinct workstreams into one broad bucket when they require
different files, tests, or handoff notes.

Before editing, compare the ledger to the remediation plan:

- every numbered implementation step is represented;
- every adapted artifact has a task or explicit note;
- every major verification category is represented;
- non-goals and future markers are captured briefly;
- no broad slice hides multiple independent workstreams without child tasks.

Update the ledger after each completed slice, before any intentional stop, and
after resuming from compaction. Use it to re-ground before reading more code or
continuing implementation.

It is normal for large findings to span compactions. Keep the route steady
rather than shrinking the work to fit a single context window. Complete coherent
slices, leave the ledger accurate, and continue from the ledger plus the MCP
finding and plan after compaction.

Large findings often benefit from two ledger passes. The initial ledger is a
route sketch after MCP retrieval and artifact classification, before broad code
reading. The settled ledger comes after bounded terrain triage and the Direction
Lock; update it before implementation so it reflects the actual files,
functions, tests, and route decisions.

## Workflow

### 1. Finding Retrieval

When the user provides a Review Finding ID, retrieve the finding through the
Review Dedeluger MCP before reading implementation code.

Also retrieve the finding remediation plan when one exists.

Capture:

- the finding title
- the guiding invariant or intent
- the local contract
- explicit non-goals
- concern areas
- unresolved discussions or open questions
- whether the remediation plan has been accepted or is still draft

If the finding cannot be retrieved, pause and say the finding lookup is blocked.

### 2. Plan Grounding

Treat the remediation plan as the implementation route for this work when it is
present and matches the user's request.

Summarize the plan's intended direction, primary files, sequencing, exclusions,
and targeted verification.

If the plan already includes a Direction Lock, reuse it or restate it. Do not
quietly replace it with a direction inferred from live code.

### 3. Artifact Status

Before editing, classify the relevant artifacts named by the finding or plan.

Name whether each important artifact is source material, current executable
terrain, accepted incoming shape, rejected incoming shape, stale terrain,
future-upstream marker, generated output, background context, or out of scope.

Do not treat live code as the default winner. Treat it as one artifact whose
status depends on the requested direction.

Do not treat parked incoming code as automatically authoritative merely because
it exists. Its status comes from the finding, plan, artifact treatments, and
current user request.

For large findings, create the initial implementation ledger after artifact
status and before broad terrain inspection. It can be revised after the terrain
is warmer.

### 4. Bounded Terrain Triage

Inspect the terrain named by the finding and plan first. For large findings,
keep this first pass bounded: confirm named files, symbols, parked blocks,
tests, and ownership boundaries needed for the Direction Lock and ledger. Save
deeper code reading for after the locked direction is visible.

Look for relevant live code, parked incoming blocks, preserved diffs, generated
files, tests, templates, schemas, routes, tools, and ownership boundaries.

Existing code can inform mechanics, naming, helper reuse, and integration
points. Keep the implementation shape tied to the finding's route.

### 5. Direction Lock

After retrieval, plan grounding, artifact classification, and bounded terrain
triage, state the locked direction visibly before broader planning or file
edits.

Use this checkpoint:

```markdown
## Direction Lock

- Request:
- Finding:
- Plan:
- Authority:
- Terrain:
- Incoming terrain to accept:
- Adapted artifacts:
- Rejected or stale artifacts:
- Substrate artifacts that must not define policy:
- Future markers explicitly left alone:
- Code-shape temptation:
- Locked direction:
- Exclusions:
- Verification:
```

The locked direction is the decision point. Ordinary implementation choices can
still happen, but they stay inside the locked shape.

### 6. Execution

Carry out the plan inside the locked direction.

Implementation generally means integrating accepted or adapted incoming terrain
through the finding's contract. Existing local code and incoming blocks are both
terrain; let the finding decide how they fit together.

Resolve, adapt, or explicitly supersede parked incoming blocks according to the
finding and artifact treatments. Do not route around them merely because the
current live implementation still works.

Likewise, do not import future-upstream architecture merely because the finding
mentions it as sequencing context. Future markers can guide shape without
becoming current scope.

When the plan says to preserve a behavior, invariant, or contract, preserve that
substance. Do not assume it requires preserving the current file layout, helper
shape, ownership shape, or public surface unless the plan says so.

When the plan protects a responsibility rather than a file shape, implement the
responsibility in the current upstream terrain. Do not preserve old local
ownership, helper names, or module layout unless the finding explicitly requires
them.

When context gets tight, keep the remediation route visible. Finish the current
coherent slice if possible, update the implementation ledger with exact
remaining work, and let the next context resume from that state.

### 7. Pause And Report Conflict

Pause when proceeding would require changing the finding-guided route rather
than executing it:

- current user instructions conflict with the finding or accepted plan
- the finding, plan, or applicable authority docs directly contradict each other
- a required artifact is missing and guessing would change behavior or scope
- artifact treatments are absent or ambiguous for a shape the plan depends on
- the locked direction is impossible as stated in the current repo
- unresolved discussions or open questions materially affect the implementation

Use direct language: conflict, impossible as stated, scope-changing ambiguity,
directly contradicted, missing artifact treatment, or would change the
requested route.

Avoid anxiety framing such as unsafe, dangerous, risky, protect, least
invasive, safer approach, or preserve current behavior unless the finding or
user explicitly scopes the work that way.

### 8. Verification

Verify against:

- the user's request
- the finding's invariant and local contract
- the remediation plan checklist
- artifact treatments and explicit exclusions
- applicable repository instructions
- targeted tests or commands named by the plan

Do not treat "it matches live code" or "it compiles" as sufficient verification
when the finding requires a specific boundary, role, ownership, schema, prompt,
or behavior.

For docs-only updates, report files changed, tests not run, and unresolved
assumptions.

For implementation work, run the targeted verification named by the plan unless
the user explicitly asks not to or the command is unavailable in the current
environment.
