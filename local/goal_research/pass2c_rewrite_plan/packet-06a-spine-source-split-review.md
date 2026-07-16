# Packet 06a: Spine Source Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the authority spine docs.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-grounding-truth.md`
- `goal-authority-primary-cadence-contract.md`
- `goal-authority-idle-continuation-contract.md`

It does not review core seam, support, demolition, test, readiness,
navigation, or operational docs.

## Required Grounding

- Packet 05
- Packet 06 parent
- `local/goal_research/AGENTS.md`
- `local/goal_research/README.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source docs, read directly top to bottom

## Decisions

None of the three spine docs can close as one whole-doc source slice.

Whole-doc treatment fails Packet 05 because each doc is either too broad for a
single fresh-agent rewrite slice or carries multiple independent owner seams
that must be audited without summary-mode compression. Traceability reinforces
that conclusion: the spine rows repeatedly mark `Split`, `Canonicalize`, or
high-risk review treatment for final input, cadence, durable state, idle
lifecycle, cleanup, evidence, history, test, and readiness clauses.

### `goal-authority-grounding-truth.md`

Disposition: split by `##` heading or contiguous `##` heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Core Truth`.
- `Required Active Steering Shape`.
- `Terminology`.
- `Primary Cadence`.
- `Ordinary User Turns`.
- `Durable State`.
- `Legacy Goal Artifact Handling`.
- `Request Repair` through `Repair Decision Table`.
- `Anti-Patterns`.
- `Acceptance Standard`.
- `Conformance Requirements`.

Reason: the doc is the behavioral spine, but it is not one executable rewrite
unit. It moves from top-level authority proof into concrete final-input shape,
local definitions, cadence events, ordinary-turn limits, durable-state
negative rules, legacy-artifact cleanup, repair, anti-patterns, tests, and
version-plan readiness. Those clauses cross several owner seams and repeated
authority families.

Below-`##` split: none. The `Anti-Patterns` `###` subsections are short
members of one forbidden-pattern section and should stay together unless a
later source-slice audit finds a concrete fidelity conflict.

### `goal-authority-primary-cadence-contract.md`

Disposition: split by `##`, with below-`##` splits for the two dense sections
whose `###` subsections are separable contracts.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Non-Negotiable Shape`.
- `Cadence State Model` intro plus `Durable Goal Facts`.
- `Pending Cadence Intent`.
- `Runtime Continuation Accounting`.
- `Current-Turn Carry`.
- `Cadence Is Primary`.
- `Steering Kinds` intro plus `Initial`.
- `Continuation`.
- `ObjectiveUpdated`.
- `BudgetLimit`.
- `Supersedence Rules`.
- `Final Model Request Input`.
- `Ordinary User Turns`.
- `Current Authority`.
- `Proving Current Authority`.
- `Request Repair` through `Repair Decision Table`.
- `Legacy Goal Artifact`.
- `Fake-Shim Deletion Target`.
- `Shared Classification`.
- `Ordering With Pending Work`.
- `Verification Checklist`.
- `Version Plan Requirements`.

Reason: this doc is the broad implementable cadence contract. A whole-doc
slice would force one later agent to reconcile durable facts, pending intent,
runtime Continuation accounting, final-input commit timing, steering-kind
supersedence, user-turn limits, proof sources, repair, legacy artifacts,
fake-shim deletion, classifiers, pending-work ordering, test proof, and
readiness requirements at once. Packet 05 requires splitting that shape.

Below-`##` split: required inside `Cadence State Model` and `Steering Kinds`.
Their `###` subsections are distinct subcontracts with different seam checks.
No other below-`##` split is chosen here; later slices should keep each
remaining `##` intact unless a direct source-read fidelity conflict appears.

### `goal-authority-idle-continuation-contract.md`

Disposition: split by `##` heading or contiguous `##` heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, `Non-Negotiables`, and `Semantic
  Contract`.
- `Legal Callers`.
- `Required Stage Order`.
- `Stage 1: Pending Non-Goal Work`.
- `Stage 2: Pending Durable Goal Cadence Intent`.
- `Stage 3: Automatic Continuation`.
- `Lock And Reservation`.
- `Resume Behavior`.
- `External Goal Mutation Behavior`.
- `Request Repair Interaction`.
- `Current Terrain To Replace`.
- `Acceptance Tests`.

Reason: the doc is focused on the idle lifecycle, but it is still too large
and stage-sensitive for one whole-doc slice. Its stage order, pending-work
precedence, pending durable intent delivery, automatic Continuation,
reservation/stale-candidate semantics, resume hydration, external mutation
ordering, repair interaction, terrain replacement, and tests each need direct
clause accounting.

Below-`##` split: none. The assigned doc has no `###` subcontracts; Packet 05
does not justify sentence-level splitting here.

## Title And Navigation Handling

For all three assigned docs, the title and `Navigation Header` travel with the
first listed source unit. The navigation header is routing metadata and
fidelity context, not standalone behavior authority.

## Output Expected

A compact split disposition for the assigned spine docs, with reasons grounded
in Packet 05 criteria and direct source reading.

## Closure Criteria

- Every assigned source doc has a disposition.
- Any proposed heading range is contiguous and source-text based.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.
- No actual source-slice IDs are assigned here; Packet 08 can assign ordered
  rows after Packet 06e and Packet 07 close.

## Non-Goals

- Reviewing source docs assigned to 06b1-06b4, 06c, or 06d.
- Consolidating all Packet 06 decisions.
- Choosing target destinations per slice.
- Starting rewrite execution.

## Packet 06e Carry

No unresolved split-classification question remains for the three spine docs.
Packet 06e should consolidate these dispositions with 06b-06d and ensure the
rollup keeps the title/navigation-header handling consistent across source
families.
