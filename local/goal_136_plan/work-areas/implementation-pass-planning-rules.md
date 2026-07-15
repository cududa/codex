# Implementation Pass Split Instructions

This file defines how to write actual implementation pass docs after any
required pre-pass work has been completed.

It is execution guidance only. The authority docs under `local/goal_research`
still win.

If the question is "what map, validation, or remediation work must happen
before we split this Work Area?", use
`local/goal_136_plan/work-areas/implementation-prepass-planning-rules.md`
first. This file starts after the active Work Area is ready to be split into
implementation passes.

## Purpose

The problem to avoid is:

```text
large Work Area doc
  -> split by headings, word count, or plausible vibes
  -> fake work units that do not match runtime seams
```

Implementation pass split instructions exist to convert a ready Work Area, or
a completed pre-pass map, into ordered implementation pass docs that a later
agent can execute after compaction.

## Authority And Terrain

Before writing or revising implementation pass docs, read:

- `local/goal_research/AGENTS.md`
- `local/goal_136_plan/AGENTS.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- the active Work Area doc
- any completed pre-pass deliverable for that Work Area
- the specific authority docs named by the active Work Area or pre-pass
  deliverable

Then walk the bounded code terrain named by the Work Area or pre-pass
deliverable. Existing local code and upstream tags are terrain, not mission.
Use them to find real files, hooks, state shapes, call order, and tests.

Version terrain should be used this way:

- local code: current fork terrain to replace, preserve, or delete
- `rust-v0.136.0`: landing topology and upstream product baseline
- `rust-v0.139.0` and `rust-v0.140.0`: migration pressure, especially
  `ext/goal` ownership and typed replay precedent
- `upstream/main`: drift clarification only when needed

When upstream conflicts with `local/goal_research`, local authority wins.

## Core Rule

Implementation passes are ordered units of work on one rewrite branch. They
exist so agents can continue through compaction with enough local context to
execute the next slice.

Implementation passes are not:

- individual PRs
- release units
- standalone acceptance checkpoints
- promises that the branch fully compiles or works after every pass
- reasons to add no-op modules, broad adapters, or test-only seams

When a pass states prerequisites or branch continuation state, read that as
task ordering for one branch, not as mergeability pressure.

## Direction Lock Required

Every split-planning session must include a visible Direction Lock after
authority reading and code terrain inspection, before naming pass boundaries:

```text
Request:
Authority:
Terrain:
Code-shape temptation:
Locked direction:
Exclusions:
```

The lock must name the code-shape temptation. Common wrong paths include:

- preserving `GoalContext`, `GoalContextRole`, active `<goal_context>`, or
  pre-shaper concrete Goal injection because current code has them
- turning `core/src/goals.rs` into a long-lived cadence service because it is
  nearby
- moving active model-input construction into `ext/goal` because later
  upstream versions move more Goal ownership there
- using classifier output, raw notifications, rollout text, or recorded
  evidence as authority
- creating independent PR-style checkpoints because a Work Area is large

## Splitting Standard

Before naming implementation pass boundaries:

- confirm any required pre-pass deliverable has been completed or explain why
  the active Work Area is ready for direct split planning
- read the relevant authority docs directly
- read the Work Area doc directly
- read the code needed to understand the proposed seam
- split by implementation pressure, ownership boundary, and test boundary
- keep observed code facts separate from design inference when the difference
  matters
- name exact files, functions, types, state records, and tests for each pass

Grep can locate terrain. Grep is not enough. Read around the relevant
functions, data types, callers, and tests before deciding the split.

Good split boundaries usually line up with all three of these:

- one main owner or narrow owner set
- one coherent behavioral seam
- focused verification that proves the behavior introduced by that pass

Bad split boundaries usually come from:

- Work Area headings alone
- line count
- broad "frontend/backend" buckets that do not match this codebase
- temporary compatibility layers that exist only to make a pass look complete
- postponing the actual model request seam while building helper machinery

## Direct Splits

A direct split planning session writes the implementation pass docs
themselves. It does not create a separate map first.

Use a direct split only when the active Work Area or pre-pass deliverable
already makes these clear:

- the files and function hooks
- the state or runtime owner
- the behavior each pass introduces
- the focused verification for each pass
- what remains for the next pass

Work Area 02 is the clearest expected direct split. The request terrain gives
the pass spine:

```text
run_sampling_request(...)
  -> rebuild input per retry or follow-up attempt
  -> request-input shaper before build_prompt(...)
  -> try_run_sampling_request(...)
  -> ResponseEvent::Created commit handler
```

That terrain supports direct pass docs around `core/src/goal_cadence/`,
per-attempt placement, Created-event commit, evidence/fingerprints where in
scope, committed carry metadata, producer conversion, and final-payload tests.

## Using Completed Maps

If a pre-pass produced an appendage, reachability, ordering, or surface map,
do not copy the whole map into every pass doc.

Use the map to:

- choose pass boundaries
- name exact code entry points
- preserve coupling constraints
- decide what must wait for a later pass
- define branch continuation state

The pass doc should reference the map and include only the context needed to
execute that pass.

## Recorded Evidence In Splits

Recorded request evidence is structured Created-event metadata. It is not
authority, durable Goal facts, repair authority, raw output, or rendered-text
recovery.

When a pass touches commit, replay, reconstruction, rollback, fork, compaction,
or final acceptance tests, it must say whether recorded evidence is in scope.
If it is in scope, the pass must keep these boundaries:

- evidence is written only by the Created-event commit path
- evidence must refer to the exact finalized request input and selected item
- ordinary rollout `ResponseItem`s, rollout trace payloads, raw notifications,
  classifier matches, and rendered Goal text are not structured commit evidence
- live correctness uses durable state unless the Work Area explicitly selects
  and tests a non-best-effort evidence-backed path

Do not create a pass that writes evidence without the matching commit metadata
and final request input fingerprints.

## Implementation Pass Doc Shape

Each implementation pass doc should include enough context for the next agent
to implement that pass without prior conversation memory:

- Direction Lock
- authority docs read
- code terrain read
- pass goal
- exact files to edit
- required edits
- tests and checks for introduced behavior
- branch continuation state
- non-goals

The `code terrain read` section must name concrete files and functions, not
just directories.

The `required edits` section should avoid broad "wire everything" language.
Name the owner and the mutation point.

The `tests and checks` section should focus on behavior introduced by the
pass. Final rewrite acceptance belongs to Work Area 06.

The `branch continuation state` section should tell the next pass what now
exists, what deliberately remains incomplete, and what must not be mistaken
for a standalone accepted state.

## Validation

For docs-only edits to Work Area or pass-planning documents, run:

```text
git diff --check -- local/goal_research local/goal_136_plan
```

For Rust implementation, follow the root `AGENTS.md` validation rules and the
focused validation named by the active implementation pass. Do not run broad
Rust suites for planning-only work.
