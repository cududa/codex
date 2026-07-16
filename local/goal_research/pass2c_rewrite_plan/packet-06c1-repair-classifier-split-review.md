# Packet 06c1: Repair Classifier Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the repair/classifier integration source
doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-repair-classifier-integration.md`

It does not review extension ownership, fake-shim removal, authority spine,
core seam, test, readiness, navigation, or operational docs.

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

`goal-authority-repair-classifier-integration.md` cannot close as one
whole-doc source slice. It must split by `##` heading or contiguous `##`
heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Code Terrain`.
- `Classifier Outputs` and `Purity Rules`.
- `Final Request-Input Repair`.
- `Event Mapping And Typed Projection`.
- `Contextual Parsing And History Boundaries`.
- `Compaction`.
- `Rollout Reconstruction, Rollback, And Fork`.
- `Raw Response Notifications`.
- `Classifier Ownership`.
- `Tests`.

Reason: the document has one dominant owner family, `T-CLEANUP`, but it carries
several independently risky cleanup seams. The opening material establishes
the current scattered callsites and the rule that classifiers are cleanup
tools, not cadence or authority. `Classifier Outputs` and `Purity Rules`
belong together because the classification variants only make sense with the
whole-message purity constraints.

The remaining headings each need separate source units because they apply the
classifier contract at different seams. `Final Request-Input Repair` is the
only place classifiers may support active authority repair, and it crosses
`T-FINAL`. `Event Mapping And Typed Projection` owns user-visible projection
hiding. `Contextual Parsing And History Boundaries` owns user-turn and
rollback-trimming predicates. `Compaction` owns local and remote compaction
behavior and committed-carry limits. `Rollout Reconstruction, Rollback, And
Fork` owns replay/reconstruction behavior and structured-evidence repair
limits. `Raw Response Notifications` owns the raw-remains-raw boundary.
`Classifier Ownership` separates generic internal-context code, legacy
artifact detection, and Goal cadence/final shaping. `Tests` is a focused proof
list for those seams.

Traceability and concept-ledger checks reinforce heading-range treatment. Rows
for this source doc stay centered on `T-CLEANUP`, but they name secondary
checks for `T-FINAL`, `T-CADENCE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`,
`T-SHIM`, `T-TEST-PREP`, and `GLOSSARY`. High-risk concepts include request
repair, classifier outputs, purity rules, projection hiding, raw response item
notifications, compaction, rollout reconstruction, rollback/fork, runtime
archaeology, current-turn carry, and the rule that helper/classifier output is
not authority. A whole-doc slice would invite summary compression across
those seams.

Below-`##` split: none. The assigned doc has no `###` subcontracts. Lists
inside the classifier, compaction, reconstruction, ownership, and test
sections belong to their enclosing `##` heading or contiguous heading range
for source-slice purposes.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its rule that classifiers do
not decide cadence or prove authority must be accounted for during later
rewrite execution.

Packet 06c4 carry: no unresolved split-classification question remains for
this source doc. The 06c4 rollup should retain this as a heading-range
disposition and preserve the secondary seam checks named above without turning
them into target destinations or execution order.

## Output Expected

A compact split disposition for the repair/classifier integration source doc,
with reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c2, 06c3, or 06d.
- Defining repeated-authority compression gates.
- Consolidating all Packet 06c decisions.
- Starting rewrite execution.
