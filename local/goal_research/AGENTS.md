# Goal Research Instructions

This directory contains the drafted Goal successor docs, older Goal research
source corpus, prep artifacts, and operational instructions for this fork.

This file remains the operations container for successor topology work. Do not
split its operational posture into a long-lived
`goal-operations-and-authority-order.md` successor authority doc.

Current working posture:

- Successor docs have been drafted and are the intended Goal authority surface
  to harden in place.
- The next `goal_research` docs work is reader-compression, navigation cutover,
  and deletion of superseded source, prep, and temporary artifacts after the
  successor docs stand on their own.
- Older source docs, Pass 2 prep, topology/protocol/cursor artifacts, and
  temporary route records are source corpus, provenance, and coverage aids
  during this transition. Do not treat their existence as a reason to preserve
  duplicate reader surface.
- Until navigation cutover and deletion are complete, direct implementation or
  version planning should start from the successor docs and consult older
  source/prep artifacts only for provenance, coverage, or named conflict
  checks.

`README.md` and `CONTEXT.md` are navigation aids. They help agents find the
right owning document and shared terms, but they do not supersede the
implementation authority order below. If a navigation aid is incomplete for
implementation work, follow the owning successor/source document and update
the navigation aid.

Version-specific implementation-route plans may live outside this directory.
For direct implementation work, those plans are execution artifacts, not peer
authority, unless a later explicit authority update says otherwise. For
successor-doc hardening, relevant researched implementation-route material is a
required reconciliation input when a concept depends on implementation-shaped
design details. When that material is more precise or appears to conflict with
older source-doc wording, prefer the route decision if it preserves the
underlying Goal concept and represents the latest researched implementation
design. Integrate that decision into the owning successor or source doc instead
of leaving future agents to cite the route plan.

## Route-Decision Absorption Posture

The v136 route decisions have been absorbed into the owning `goal_research`
docs and successor-design inputs. There is no active burn-down pointer.

Temporary v136 provenance records, if present in a working copy, are not common
inputs for successor-doc hardening or implementation planning. Consult them
only when a source/route conflict or missing represented route decision is
suspected. Do not create a separate audit-log layer or make future readers
depend on temporary files. Rely on the owning `goal_research` docs directly so
the local docs stand on their own.

If a temporary v136 decision appears to differ from existing `goal_research`
prose, use it only when it preserves the underlying Goal concept and
represents the latest researched v136 route. If applying the decision would
drop, invert, or weaken a current source concept, stop and name the
source/route conflict instead of guessing.

Before editing docs or implementing Goal authority work, read the applicable
files directly top to bottom. Do not rely on grep-only scans for these docs.

## Successor Reader Order

For successor-doc hardening, navigation cutover, and future implementation
planning after cutover, start with the relevant successor docs:

1. `goal-authority-behavior.md`
2. `goal-cadence-contract.md`
3. `goal-durable-state-and-pending-intent.md`
4. `goal-final-request-input.md`
5. `goal-idle-history-lifecycle.md`
6. `goal-recorded-request-evidence.md`
7. `goal-request-repair-and-artifact-classification.md`
8. `goal-projection-reconstruction-and-raw-history.md`
9. `goal-extension-lifecycle-and-reachability.md`
10. `goal-test-prep-and-replacement-proof.md`
11. `goal-readiness-and-execution-handoff.md`

Read affected successor docs top to bottom. If successor docs appear to
conflict, stop and name the conflict. Do not silently choose an implementation
shape that weakens the active authority model.

## Legacy Source-Corpus Order

Until older source docs are deleted, use this order only for provenance,
coverage, or named conflict checks when a task touches Goal authority, cadence,
steering shape, resume behavior, compaction repair, legacy Goal artifacts, or
Goal tests:

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

If these files appear to conflict with successor docs or each other, stop and
name the conflict. Do not use legacy source-corpus wording to preserve duplicate
or superseded reader surface during lean-state cleanup.

## Navigation And Document Roles

Use `README.md` for the reader map, document roles, supporting seams, terrain
anchors, and Pass 2 guardrails. Use `CONTEXT.md` for vocabulary.

For implementation work, those files are not peer authority and do not replace
top-to-bottom reading of the owning docs. If a navigation aid and an owning doc
differ, follow the owning doc and update the navigation aid.

For successor-doc hardening, they are still navigation aids, but the task is
allowed to improve the authority structure itself. Do not use navigation
wording as a reason to preserve duplicate old prose when the concepts are
retained canonically, locally, by pointer, or as operational/test reminders.

A complete implementation plan usually needs the authority order above plus
the supporting seam docs named by `README.md`. Do not rely on this file as a
summary of those owning contracts.

## Design Deliverables

Before writing or executing a Goal implementation plan, read
`goal-readiness-and-execution-handoff.md`.

That checklist is the operational gate for whether the design inputs are Ready.
Ready means ready as implementation-design input; it does not mean the work has
already been translated into concrete files, functions, migrations, tests, or
implementation order.

Use `goal-authority-open-design-deliverables.md` only as older source-corpus
provenance until it is retired. Do not reopen the core architecture unless a
code walk finds a direct conflict with the successor docs or a later authority
update explicitly supersedes them.

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
- automatic Continuation uses a state-owned latest watermark, or an equivalent
  durable/reconstructable suppression record, not persisted pending
  Continuation intent
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

Follow `goal-test-prep-and-replacement-proof.md`. Use
`goal-test-deletion-map.md` only as older source-corpus provenance until it is
retired:

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

For successor-doc hardening, implementation-route material is not ordinary Rust
terrain. It is a researched implementation-design record to reconcile with the
source docs and successor docs. Current Rust code remains terrain unless the
source docs or route record explicitly adopt it.

Known terrain that must not become the design:

- resume fabricating Initial for any active Goal
- runtime-only Initial pending state as the durable cadence model
- ObjectiveUpdated or BudgetLimit intent being dropped when old concrete
  same-turn injection terrain fails instead of remaining pending after
  unavailable or rejected metadata-only same-turn cadence recheck
- pre-shaper concrete Goal `ResponseInputItem` carry as proof of authority
- Goal-only fake provenance machinery as active steering machinery
- special local raw-response suppression for Goal context
- final stale-symbol audits as architecture instead of review gates

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
