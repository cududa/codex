---
name: findings-guided-implementation
description: Use when implementing a Review Dedeluger finding or remediation plan in this repository, especially when the user provides a Review Finding ID. Retrieve the finding and plan first, classify artifact treatments, lock direction, then inspect and edit the repo terrain.
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
3. Applicable `AGENTS.md` files and user-named authority docs
4. Artifact treatments, linked findings, notes, discussions, and concern areas
5. Existing code, generated files, parked diffs, and historical artifacts as
   implementation terrain

The finding and plan do not make the repo simple. They make the route visible.

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

### 4. Terrain Inspection

Inspect the terrain named by the finding and plan first.

Look for relevant live code, parked incoming blocks, preserved diffs, generated
files, tests, templates, schemas, routes, tools, and ownership boundaries.

Existing code can inform mechanics, naming, helper reuse, and integration
points. Keep the implementation shape tied to the finding's route.

### 5. Direction Lock

After retrieval, plan grounding, artifact classification, and initial terrain
inspection, state the locked direction visibly before broader planning or file
edits.

Use this checkpoint:

```markdown
## Direction Lock

- Request:
- Finding:
- Plan:
- Authority:
- Terrain:
- Artifact status:
- Code-shape temptation:
- Locked direction:
- Exclusions:
- Verification:
```

The locked direction is the decision point. Ordinary implementation choices can
still happen, but they stay inside the locked shape.

### 6. Execution

Carry out the plan inside the locked direction.

Resolve, adapt, or explicitly supersede parked incoming blocks according to the
finding and artifact treatments. Do not route around them merely because the
current live implementation still works.

Likewise, do not import future-upstream architecture merely because the finding
mentions it as sequencing context. Future markers can guide shape without
becoming current scope.

When the plan says to preserve a behavior, invariant, or contract, preserve that
substance. Do not assume it requires preserving the current file layout, helper
shape, ownership shape, or public surface unless the plan says so.

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
