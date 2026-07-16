# Packet 06c3: Fake Shim Removal Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the fake-shim removal map source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-fake-shim-removal-map.md`

It does not review repair/classifier integration, extension ownership,
authority spine, core seam, test, readiness, navigation, or operational docs.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06c parent/index
- Packets 03 and 04 only where owner or source-feed seams affect split size
- `local/goal_research/README.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source doc, read directly top to bottom

## Decisions

`goal-authority-fake-shim-removal-map.md` cannot close as one whole-doc source
slice. It must split by `##` heading and by `###` subheading inside the dense
demolition sections.

Use these source units:

- Title, `Navigation Header`, and `Purpose`.
- `Active Shim Roots To Remove` / `Core GoalContext Shim`.
- `Active Shim Roots To Remove` / `Core Goal Steering Producer`.
- `Active Shim Roots To Remove` / `Extension Goal Steering Producer`.
- `Shim-Dependent Consumers To Replace Carefully` introduction.
- `Shim-Dependent Consumers To Replace Carefully` / `Event And UI Hiding`.
- `Shim-Dependent Consumers To Replace Carefully` / `Compaction`.
- `Shim-Dependent Consumers To Replace Carefully` / `Rollout
  Reconstruction`.
- `Shim-Dependent Consumers To Replace Carefully` / `History And User-Turn
  Boundaries`.
- `Shim-Dependent Consumers To Replace Carefully` / `Contextual Fragment
  Infrastructure`.
- `What To Remove`.
- `Required Legacy Artifact Handling`.
- `What To Replace With`.
- `Required Work Areas` introduction.
- `Required Work Areas` / `Work Area 1: Final Request-Input Goal Shaping`.
- `Required Work Areas` / `Work Area 2: Generic Internal Context Helpers`.
- `Required Work Areas` / `Work Area 3: Classifiers And Legacy Handling`.
- `Required Work Areas` / `Work Area 4: Active Core Steering`.
- `Required Work Areas` / `Work Area 5: Extension Steering`.
- `Required Work Areas` / `Work Area 6: Cleanup Consumers`.
- `Integration With Cadence Contract`.

Reason: this document is demolition terrain, not one executable rewrite slice.
It has one dominant owner family, `T-SHIM`, but it deliberately enumerates
multiple active shim roots, dependent cleanup consumers, legacy handling,
replacement responsibilities, and work areas. A whole-doc slice would make it
too easy to preserve the fake shim as compatibility architecture or to flatten
separate removal obligations into a generic "delete GoalContext" summary.

The `Active Shim Roots To Remove` section must split below `##` because core
`GoalContext`, core Goal steering producer, and extension steering producer
have different replacement and reachability checks. The `Shim-Dependent
Consumers To Replace Carefully` section must split below `##` because event/UI
projection, compaction, rollout reconstruction, history boundaries, and
generic contextual infrastructure each feed different cleanup or final-input
seams. The `Required Work Areas` section must split below `##` because each
work area names a different proof or replacement family.

Traceability and concept-ledger checks reinforce this split. Rows for this
source doc center on `T-SHIM`, with secondary checks for `T-FINAL`,
`T-CLEANUP`, `T-EXT`, `T-CADENCE`, `T-TEST-PREP`, `T-READINESS`, and
`T-BEHAVIOR`. High-risk concepts include fake-shim removal, developer-role
active steering, internal-context provenance, legacy artifact handling,
classifier outputs, purity rules, projection hiding, raw notifications,
compaction, rollout reconstruction, extension reachability, current-turn
carry, and the rule that helper output is not authority. Those concepts need
bounded source units rather than one large demolition summary.

Below-`##` split: required inside `Active Shim Roots To Remove`,
`Shim-Dependent Consumers To Replace Carefully`, and `Required Work Areas`, as
listed above. Other `##` sections stay whole because their lists are cohesive
demolition, legacy, replacement, or cadence-boundary statements.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its warning that this map is
not architecture to preserve under compatibility language must be accounted
for during later rewrite execution.

Packet 06c4 carry: no unresolved split-classification question remains for
this source doc. The 06c4 rollup should retain this as a below-`##`
disposition for the dense demolition sections and preserve the secondary seam
checks named above without turning them into target destinations or execution
order.

## Output Expected

A compact split disposition for the fake-shim removal map source doc, with
reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c1, 06c2, or 06d.
- Defining repeated-authority compression gates.
- Consolidating all Packet 06c decisions.
- Starting rewrite execution.
