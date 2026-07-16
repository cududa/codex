# Packet 06b3: Model Visible History Key Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the model-visible history key source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-model-visible-history-key.md`

It does not review durable state, final request input, recorded evidence,
authority spine, support, demolition, test, readiness, navigation, or
operational docs.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06b parent/index
- Packets 03 and 04 only where owner or source-feed seams affect split size
- `local/goal_research/README.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source doc, read directly top to bottom

## Decisions

`goal-authority-model-visible-history-key.md` cannot close as one whole-doc
source slice. It must split by `##` heading or contiguous `##` heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Code Terrain`.
- `Key Shape`.
- `Eligible Progress Projection`.
- `Capture Point`.
- `Runtime Watermark`.
- `Resume And Restart`.
- `Compaction And Reconstruction`.
- `Tests`.

Reason: the document has one main owner family, `T-HISTORY`, but its clauses
cross several high-risk seam checks that a later rewrite slice should audit
separately. The opening material and terrain establish why
`ContextManager::history_version()` is insufficient. `Key Shape` and
`Eligible Progress Projection` define the key and its included/excluded
inputs. `Capture Point` binds the key to final request-input shaping.
`Runtime Watermark` binds duplicate suppression to commit timing.
`Resume And Restart` crosses durable-state and structured-evidence
reconstruction. `Compaction And Reconstruction` crosses cleanup,
reconstruction, rollback, and fork behavior. `Tests` is a focused proof list
for those seams.

Traceability and concept-ledger checks reinforce the split. Rows for this
source doc stay centered on `T-HISTORY`, but they name different secondary
checks for `T-FINAL`, `T-IDLE`, `T-DURABLE`, `T-EVIDENCE`, `T-CLEANUP`, and
`T-TEST-PREP`. Concept rows for model-visible history key, eligible progress
projection, Continuation watermark, compaction, and rollout reconstruction
are all high-risk or test-critical. A whole-doc slice would invite summary
compression across those seams.

Below-`##` split: none. The assigned doc has no `###` subcontracts, and each
list belongs to its enclosing `##` heading for source-slice purposes.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its warning that the
Continuation steering item itself must not justify another Continuation must
be accounted for during later rewrite execution.

Packet 06b5 carry: no unresolved split-classification question remains for
this source doc. The 06b5 rollup should retain this as a heading-range
disposition and preserve the secondary seam checks named above without turning
them into target destinations or execution order.

## Output Expected

A compact split disposition for the model-visible history key source doc, with
reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b1, 06b2, 06b4, 06c, or 06d.
- Deciding route-verification policy.
- Consolidating all Packet 06b decisions.
- Starting rewrite execution.
