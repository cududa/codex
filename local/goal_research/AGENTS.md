# Goal Research Instructions

This directory contains the current Goal research source docs, prep artifacts,
and operational instructions for this fork.

This file remains the operations container for successor topology work. Do not
split its operational posture into a long-lived
`goal-operations-and-authority-order.md` successor authority doc.

There are two working postures:

- Direct implementation or version planning: treat the current Goal authority
  docs as design contracts, not brainstorming notes, until successor docs are
  ready to replace them.
- Future successor-doc architecture design or concept-preserving rewrite
  planning: treat the current source docs as the required source corpus and
  concept record, not immutable sentence-level prose. A doc-worker authority
  violation is loss, weakening, or distortion of concepts, decisions,
  exceptions, or implementation-relevant detail, not the act of reorganizing
  old wording when those concepts are retained.

`README.md` and `CONTEXT.md` are navigation aids. They help agents find the
right source doc and shared terms, but they do not supersede the implementation
authority order below. If a navigation aid is incomplete for implementation
work, follow the source authority document and update the navigation aid.

Version-specific implementation-route plans may live outside this directory.
For direct implementation work, those plans are execution artifacts, not peer
authority, unless a later explicit authority update says otherwise. For future
successor-doc architecture design or concept-preserving rewrite planning,
relevant researched implementation-route material is a required reconciliation
input when a concept depends on implementation-shaped design details. When that
material is more precise or appears to conflict with older source-doc wording,
prefer the route decision if it preserves the underlying Goal concept and
represents the latest researched implementation design. Integrate that decision
into future successor docs instead of leaving future agents to cite the route
plan.

## 136 Absorption Posture

The v136 burn-down is tracked by `TEMP_136_ABSORPTION_POINTER.md` while an
absorption list is active. When that pointer is complete, successor drafting
starts from `SUCCESSOR_DOC_DRAFTING_PROTOCOL.md`, the corrected current
`goal_research` docs, and the topology/protocol artifacts as standalone
inputs.

Temporary v136 provenance records, including
`TEMP_136_ROUTE_DECISION_INVENTORY.md` and
`TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md` if present in a working copy, are
not required drafting inputs for every successor doc. Consult them only as
optional provenance when a source/route conflict or missing represented route
decision is suspected. Do not create a separate audit-log layer or make future
successor readers depend on temporary files. Rely on the owning current
`goal_research` docs directly so the local docs stand on their own.

If a temporary v136 decision appears to differ from existing `goal_research`
prose, use it only when it preserves the underlying Goal concept and
represents the latest researched v136 route. If applying the decision would
drop, invert, or weaken a current source concept, stop and name the
source/route conflict instead of guessing.

Before editing docs or implementing Goal authority work, read the applicable
files directly top to bottom. Do not rely on grep-only scans for these docs.

## Authority Order

For direct implementation or version planning before future successor docs
replace the current source docs, use this order when a task touches Goal
authority, cadence, steering shape, resume behavior, compaction repair, legacy
Goal artifacts, or Goal tests:

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

For future successor-doc architecture design or concept-preserving rewrite
planning, use the same list as the source read order, then validate affected
concepts against the relevant implementation-route material before treating the
coverage check as complete.

## Navigation And Document Roles

Use `README.md` for the reader map, document roles, supporting seams, terrain
anchors, and Pass 2 guardrails. Use `CONTEXT.md` for vocabulary.

For implementation work, those files are not peer authority and do not replace
top-to-bottom reading of the source contracts. If a navigation aid and a source
contract differ, follow the source contract and update the navigation aid.

For future successor-doc architecture design or concept-preserving rewrite
planning, they are still navigation aids, but the task is allowed to improve
the authority structure itself. Do not use navigation wording as a reason to
preserve duplicate old prose when the concepts are retained canonically,
locally, by pointer, or as operational/test reminders.

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

This gate constrains implementation planning. It does not forbid future
successor-doc architecture design from reorganizing the docs into successor
authority modules when the rewrite keeps the concepts traceable and validates
settled implementation-route details against current route material.

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

For future successor-doc architecture design or concept-preserving rewrite
planning, implementation-route material is not ordinary Rust terrain. It is a
researched implementation-design record to reconcile with the source docs
before successor prose is written. Current Rust code remains terrain unless the
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
