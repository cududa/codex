# Packet 06b2: Final Request Input Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the final request-input and commit source
doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-final-request-input-and-commit.md`

It does not review durable state, history key, recorded evidence, authority
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

`goal-authority-final-request-input-and-commit.md` cannot close as one
whole-doc source slice. It must split by `##` heading or contiguous `##`
heading range.

Use these source units:

- Title, `Navigation Header`, `Purpose`, and `Code Terrain`.
- `Core Rule`.
- `Final Request-Input Shaping`, `Shaping Responsibilities`, and `Selection
  Order`.
- `Commit Metadata`.
- `Recorded Request Evidence`.
- `Commit Point`.
- `Retry And Follow-Up`.
- `Current-Turn Carry`.
- `` `goals.rs` Adapter ``.
- `Tests`.

Reason: the document has one dominant owner family, `T-FINAL`, but it carries
several independently risky final-input seams. The opening material establishes
the actual request path and the current terrain that must not be mistaken for
authority. `Core Rule` is the central proof rule: exactly one selected current
developer-role Goal item in final input, with helper output, injection,
reservation, and carry excluded as authority. The shaping range defines the
per-attempt function, required context, cleanup responsibilities, selection,
and eligibility gates. Those headings must be audited together so selection
order does not drift away from shaping.

The remaining headings each require their own source slice because they cross
different seam checks. `Commit Metadata` ties the selected item to exact
fingerprints and per-attempt identity. `Recorded Request Evidence` is the local
final-input obligation for `T-EVIDENCE`, including the rule that ordinary
rollout replay and best-effort traces are not enough. `Commit Point` owns the
Created-event timing and exact-key or watermark side effects. `Retry And
Follow-Up` owns per-attempt reshaping before and after commit, stale request
metadata, and full logical input despite WebSocket deltas. `Current-Turn
Carry` owns committed carry replacement and excludes pre-finalizer concrete
items. The `goals.rs` adapter section is an adapter-boundary slice, and
`Tests` is a focused proof-obligation slice.

Traceability and concept-ledger checks reinforce heading-range treatment. Rows
for this source doc stay centered on `T-FINAL`, but they name different
secondary checks for `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-IDLE`,
`T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-READINESS`, and `T-TEST-PREP`.
High-risk concepts include final request-input developer-role proof, final
request-input shaping, commit point, commit metadata, recorded request
evidence, pending-intent consumption, retry/follow-up behavior, same-turn
carry, repair boundaries, and previous-response/model-context proof limits. A
whole-doc slice would invite summary compression across those seams.

Below-`##` split: none. The assigned doc has no `###` subcontracts. The large
`Recorded Request Evidence` section is still a complete 06b2 source unit: a
later rewrite slice must account for that whole section as the final-input
seam's local obligation to produce commit identity and respect the evidence
boundary. Packet 06b4 separately reviews the full recorded-evidence source
doc; that does not make this 06b2 section provisional or optional.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its warning that helper output,
active-turn injection, reservation, and pre-finalizer carry are not commits
must be accounted for during later rewrite execution.

Packet 06b5 carry: no unresolved split-classification question remains for
this source doc. The 06b5 rollup should retain this as a heading-range
disposition and preserve the secondary seam checks named above without turning
them into target destinations or execution order.

## Output Expected

A compact split disposition for the final request-input and commit source doc,
with reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b1, 06b3, 06b4, 06c, or 06d.
- Deciding route-verification policy.
- Consolidating all Packet 06b decisions.
- Starting rewrite execution.
