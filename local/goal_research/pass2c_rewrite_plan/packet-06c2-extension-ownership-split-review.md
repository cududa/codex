# Packet 06c2: Extension Ownership Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the extension ownership source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `goal-authority-ext-goal-ownership.md`

It does not review repair/classifier integration, fake-shim removal, authority
spine, core seam, test, readiness, navigation, or operational docs.

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

`goal-authority-ext-goal-ownership.md` cannot close as one whole-doc source
slice. It must split by `##` heading or contiguous `##` heading range.

Use these source units:

- Title, `Navigation Header`, and `Purpose`.
- `Code Terrain` and `Upstream v136 Shape`.
- `Ownership Decision`.
- `Required Replacement Shape`.
- `Configuration`.
- `Reachability Rule`.
- `File-Specific Work Areas`.
- `Tests`.

Reason: the document has one dominant source role, `T-EXT`, but it carries
several distinct extension seam decisions. The opening material states the
core ownership boundary: `ext/goal` may own lifecycle, tools, accounting,
metrics, mutation entry points, and typed producer-facing data, but must not
own active model-input construction or final-input authority. `Code Terrain`
and `Upstream v136 Shape` are terrain/predecessor context and must be audited
without preserving current or upstream user-role helper output as desired
authority.

The remaining headings each require their own source unit. `Ownership
Decision` is the may-own/must-not-own boundary. `Required Replacement Shape`
is the structured cadence-request route for reachable extension mutation and
same-turn recheck behavior. `Configuration` owns steering-role compatibility
treatment. `Reachability Rule` owns the converted/removed/unreachable
outcomes for active extension steering. `File-Specific Work Areas` maps the
replacement across extension and core injection/carry files. `Tests` is the
focused proof list for extension-origin behavior.

Traceability and concept-ledger checks reinforce heading-range treatment. Rows
for this source doc stay centered on `T-EXT`, but they name secondary checks
for `T-FINAL`, `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-SHIM`,
`T-TEST-PREP`, `T-BEHAVIOR`, and `T-CLEANUP`. High-risk concepts include
developer-role active steering, pending ObjectiveUpdated/BudgetLimit intent,
metadata-only same-turn cadence recheck, extension reachability,
steering-role config compatibility, fake-shim removal, and the rule that
extension lifecycle ownership must not become model-input authority ownership.
A whole-doc slice would invite summary compression across those seams.

Below-`##` split: none. The assigned doc has no `###` subcontracts. Lists
inside ownership, file-specific work areas, and tests belong to their
enclosing `##` heading for source-slice purposes.

Title and navigation handling: the title and `Navigation Header` travel with
the first listed source unit. The navigation header is routing and fidelity
context, not standalone behavior authority, but its warning that extension
lifecycle ownership must not become model-input authority ownership must be
accounted for during later rewrite execution.

Packet 06c4 carry: no unresolved split-classification question remains for
this source doc. The 06c4 rollup should retain this as a heading-range
disposition and preserve the secondary seam checks named above without turning
them into target destinations or execution order.

## Output Expected

A compact split disposition for the extension ownership source doc, with
reasons grounded in Packet 05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Split reasons distinguish source granularity from target ownership.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c1, 06c3, or 06d.
- Defining repeated-authority compression gates.
- Consolidating all Packet 06c decisions.
- Starting rewrite execution.
