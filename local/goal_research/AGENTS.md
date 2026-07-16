# Goal Research Instructions

This directory contains local authority docs for Goal behavior in this fork.
Treat them as design contracts, not brainstorming notes.

`README.md` and `CONTEXT.md` are navigation aids. They help agents find the
right authority doc and shared terms, but they do not supersede the authority
order below. If a navigation aid is incomplete, follow the source authority
document.

Version-specific implementation plans may live outside this directory, such as
`local/goal_136_plan`. Those plans are execution artifacts, not peer authority.
They must conform to the authority order here.

Before editing docs or implementing Goal authority work, read the applicable
files directly top to bottom. Do not rely on grep-only scans for these docs.

## Authority Order

Use this order when a task touches Goal authority, cadence, steering shape,
resume behavior, compaction repair, legacy Goal artifacts, or Goal tests:

1. `goal-authority-grounding-truth.md`
   - Behavioral truth and anti-patterns.
   - Highest-level contract for all version plans and implementations.
2. `goal-authority-primary-cadence-contract.md`
   - Implementable cadence, durable intent, repair, and consumption contract.
3. `goal-authority-idle-continuation-contract.md`
   - Dedicated `MaybeContinueIfIdle` contract.
   - Defines the idle hook as pending work first, pending durable cadence
     intent second, automatic Continuation last.
4. `goal-authority-fake-shim-removal-map.md`
   - Terrain map for deleting the active Goal-only context path.
   - Not architecture to keep alive.
5. `goal-test-deletion-map.md`
   - Concrete test prep map.
   - Defines which local overlay tests to delete, which files to return to
     `rust-v0.136.0` baseline, and which replacement tests to add after the
     active steering rewrite.

If these files appear to conflict, stop and name the conflict. Do not silently
choose an implementation shape that weakens the grounding truth.

## Navigation And Document Roles

Use `README.md` for the reader map, document roles, supporting seams, terrain
anchors, and Pass 2 guardrails. Use `CONTEXT.md` for vocabulary.

Those files are not peer authority and do not replace top-to-bottom reading of
the source contracts. If a navigation aid and a source contract differ, follow
the source contract and update the navigation aid.

A complete implementation plan usually needs the authority order above plus
the supporting seam docs named by `README.md`. Do not rely on this file as a
summary of those source contracts.

## Design Deliverables

Before writing or executing a Goal implementation plan, read
`goal-authority-open-design-deliverables.md`.

That checklist is the operational gate for whether the design inputs are
Ready. Ready means ready as implementation-design input; it does not mean the
work has already been translated into concrete files, functions, migrations,
tests, or slice order.

When the checklist marks all required deliverables Ready, the next step is an
implementation execution plan. Do not reopen the core architecture unless a
code walk finds a direct conflict with these authority docs or a later
authority update explicitly supersedes them.

## Non-Negotiables

Keep these decisions intact:

- active Goal steering is developer-role model input
- active Goal authority is established only by the final model request input
  containing the selected developer-role Goal `ResponseItem`
- generic internal context may provide Goal text rendering, provenance, and
  cleanup classification; it is not an authority mechanism by itself
- active Goal steering does not use `GoalContext`, `GoalContextRole`, or
  `<goal_context>`
- Initial, ObjectiveUpdated, and BudgetLimit use persisted pending cadence
  intent until final model request input contains the matching developer-role
  Goal item
- automatic Continuation uses runtime-only watermarking
- ordinary user turns are not cadence events
- active durable Goal state alone must not emit Goal steering
- active durable Goal state alone is not cadence-required authority
- request repair is request-local by default and is not cadence
- resume is hydration, not cadence
- legacy `<goal_context>` is artifact handling only
- raw response item notifications remain raw unless the general raw-response
  contract is explicitly changed
- budget and usage are upstream Goal facts, not local experiments
- app-server Goal APIs, `/goal`, status/footer projection, pause/edit/clear,
  and budget/usage tests return to upstream baseline unless a later product
  change explicitly replaces that behavior

## Test Prep Posture

When preparing the Goal rewrite, do not let the current local test overlay keep
the broken active steering path alive.

Follow `goal-test-deletion-map.md`:

- delete local-only tests that defend `<goal_context>`, `GoalContext`,
  `GoalContextRole`, user-role Goal steering, rendered-marker authority, or
  bad cadence
- revert Goal-related hunks in upstream test files to the `rust-v0.136.0`
  baseline
- keep upstream Goal product behavior active as the baseline profile
- add replacement tests from the authority contracts after the active steering
  implementation is replaced

Treat upstream Goal product surfaces as baseline obligations during test prep.
A separate product change is required to replace that behavior.

## Working Posture

Existing Rust code is terrain, not mission. It can show where implementation
will land, but it must not override the local authority docs.

Known terrain that must not become the design:

- resume fabricating Initial for any active Goal
- runtime-only Initial pending state as the durable cadence model
- ObjectiveUpdated or BudgetLimit intent being dropped when old concrete
  same-turn injection terrain fails instead of remaining pending after
  unavailable or rejected metadata-only same-turn cadence recheck
- pre-finalizer concrete Goal `ResponseInputItem` carry as proof of authority
- Goal-only fake provenance machinery as active steering machinery
- special local raw-response suppression for Goal context

Before execution, lock the direction explicitly:

```text
Request:
Authority:
Terrain:
Code-shape temptation:
Locked direction:
Exclusions:
```

## Verification

For docs-only work, run a cheap whitespace check such as:

```text
git diff --check -- local/goal_research
```

For Rust implementation work, follow the repository root `AGENTS.md` validation
rules and keep tests focused on final model payloads, structured recorded
request evidence, or the specific Goal behavior being changed.
