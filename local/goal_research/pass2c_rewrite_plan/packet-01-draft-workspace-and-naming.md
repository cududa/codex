# Packet 01: Draft Workspace And Naming

Status: closed.

## Purpose

Choose where later Pass 2C execution artifacts should live and how they should
be named.

## Scope

This packet owns proposed locations and naming rules for future successor
drafts, source-slice records, audit records, and cutover-readiness records.
It does not create those paths or decide the target, slice, audit, workflow,
or cutover content that later packets own.

## Required Grounding

- `local/goal_research/PASS2C_PLANNING_HANDOFF.md`
- `local/goal_research/AGENTS.md`
- `local/goal_research/PASS2C_REWRITE_PLAN.md`
- `local/goal_research/pass2c_rewrite_plan/README.md`
- `local/goal_research/pass2c_rewrite_plan/packet-00-planning-boundary-and-packet-rules.md`
- current `local/goal_research/` directory shape

Directory shape checked for this packet:

- `local/goal_research/` contains the current source corpus and Pass 2 prep
  artifacts.
- `local/goal_research/pass2b_target_interfaces/` contains completed Pass 2B
  and Pass 2B.5 inputs.
- `local/goal_research/pass2c_rewrite_plan/` contains planning packets only.

## Decisions

The future Pass 2C execution workspace is:

```text
local/goal_research/pass2c_rewrite/
```

This keeps execution artifacts beside the planning workspace instead of inside
it. The name marks execution-phase work, not cutover authority.

Proposed subpaths:

- Successor drafts: `local/goal_research/pass2c_rewrite/successor_drafts/`
- Source-slice records: `local/goal_research/pass2c_rewrite/slice_records/`
- Audit records: `local/goal_research/pass2c_rewrite/audits/`
- Cutover-readiness records: `local/goal_research/pass2c_rewrite/cutover/`

Naming rules:

- Directories use lower snake case.
- Markdown files use lower hyphenated slugs.
- Successor draft files use:

```text
draft-<target-slug>.md
```

- Source-slice record files use:

```text
<slice-id>.md
```

- Audit files use:

```text
audit-<audit-slug>.md
```

- Cutover-readiness files use:

```text
cutover-<gate-slug>.md
```

Deferred slug owners:

- Packet 02 and target-boundary packets decide `<target-slug>`.
- Source-slice packets decide `<slice-id>`.
- Workflow, repeated-authority, and fidelity-audit packets decide
  `<audit-slug>`.
- The cutover-gates packet decides `<gate-slug>`.

The `draft-` prefix stays until cutover so filenames do not imply standing
authority or source-doc retirement before cutover gates close. Packet 01 does
not mark any source doc retired, archived, moved, renamed, or deleted.

## Output Expected

A small artifact-layout decision that later packets can reference without
creating the future workspace.

## Closure Criteria

- Locations are named clearly enough for later packets to reference.
- No successor draft, slice record, or audit record is created.
- The names do not imply cutover or source-doc retirement.
- Target keys, slice IDs, audit categories, and cutover gate names remain owned
  by their later packets.

## Non-Goals

- Choosing the full successor target set.
- Choosing target owner boundaries.
- Deciding source slice order.
- Defining record templates.
- Defining audit categories.
- Defining cutover gates.
- Starting rewrite execution.
