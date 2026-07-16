# Packet 06b4: Recorded Request Evidence Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the recorded request evidence source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-recorded-request-evidence.md`

It does not review durable state, final request input, history key, authority
spine, support, demolition, test, readiness, navigation, or operational docs.

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

`goal-authority-recorded-request-evidence.md` cannot close as one whole-doc
source slice. It must split by `##` heading or contiguous `##` heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Code Terrain`.
- `Core Rule` and `Correctness Split`.
- `Carrier Choice`.
- `Evidence Shape` and `Fingerprints`.
- `Commit Timing` and `Commit Ordering And Failure Policy`.
- `Replay Semantics`.
- `Resume And Continuation Suppression`.
- `Rollback And Fork`.
- `Compaction`.
- `Raw And Typed Projection`.
- `Version Plan Notes`.
- `Tests`.

Reason: the document has one dominant source role, `T-EVIDENCE`, but the
contract is not one executable rewrite slice. The opening material resolves
the recorded-rollout design pass and names current/v140 terrain that must not
be mistaken for authority. `Core Rule` and `Correctness Split` belong together
because they define the evidence boundary and the live-correctness split among
durable state, final shaping, and recorded evidence. `Carrier Choice` is its
own typed replay carrier decision.

The identity and commit headings require separate source units because their
fidelity risks differ. `Evidence Shape` and `Fingerprints` define the record
fields and exact identity inputs. `Commit Timing` and `Commit Ordering And
Failure Policy` define when evidence may be written, durable mutation ordering,
paired append behavior, and what append failure may or may not prove.

The replay/reconstruction headings must stay separate because they cross
different secondary seam checks. `Replay Semantics` owns metadata replay and
fingerprint pairing. `Resume And Continuation Suppression` owns durable-first
suppression precedence and the limited role of non-best-effort structured
evidence. `Rollback And Fork` owns surviving-history rules. `Compaction` owns
replacement-history and carry-forward-evidence limits. `Raw And Typed
Projection` owns the raw/projection boundary. `Version Plan Notes` is the
version-specific implementation-route reminder, and `Tests` is the focused
evidence proof list.

Traceability and concept-ledger checks reinforce heading-range treatment. Rows
for this source doc stay centered on `T-EVIDENCE`, but they name secondary
checks for `T-FINAL`, `T-DURABLE`, `T-HISTORY`, `T-CLEANUP`,
`T-TEST-PREP`, and `T-READINESS`. High-risk concepts include structured
recorded request evidence, commit metadata and item fingerprints, pending
intent correctness when evidence is absent or best-effort, Continuation
watermark reconstruction, compaction, rollback/fork, replay semantics, and raw
notification boundaries. A whole-doc source slice would invite summary
compression across those seams.

Below-`##` split: none. The assigned doc has no `###` subcontracts. Long lists
inside `Evidence Shape`, `Fingerprints`, commit policy, and tests belong to
their enclosing `##` heading or contiguous heading range for source-slice
purposes.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its rule that evidence is not
authority and must not recover facts from rendered text must be accounted for
during later rewrite execution.

Packet 06b5 carry: no unresolved split-classification question remains for
this source doc. The 06b5 rollup should retain this as a heading-range
disposition and preserve the secondary seam checks named above without turning
them into target destinations or execution order.

## Output Expected

A compact split disposition for the recorded request evidence source doc, with
reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b1, 06b2, 06b3, 06c, or 06d.
- Deciding route-verification policy.
- Consolidating all Packet 06b decisions.
- Starting rewrite execution.
