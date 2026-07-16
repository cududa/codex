# Packet 06d3: AGENTS Operations Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the operational AGENTS source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `AGENTS.md`

It does not review test prep, readiness, README navigation, glossary, exclusion
candidates, or source docs assigned to 06a, 06b, or 06c.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06d parent/index
- Packet 01 for future artifact boundaries
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source doc, read directly top to bottom

## Decisions

`AGENTS.md` must not close as one whole-doc source slice.

The doc has one operational role, but direct reading shows distinct operational
functions that future rewrite slices must not flatten together: source-corpus
posture, authority order, navigation/document roles, readiness gate,
non-negotiable operational reminders, test-prep posture, working posture, and
verification. The trace rows also say `OP-AGENTS` remains an operational
surface while behavior-owning targets carry canonical authority. A whole-doc
slice would make it too easy for `OP-AGENTS` to become a behavior engine or
for the non-negotiables list to be copied mechanically instead of routed by
owner/local/pointer rules during successor rewrite.

Use these source units:

| Source unit | Disposition | Reason |
| --- | --- | --- |
| Title and introductory operational prose before `## Authority Order` | One opening range slice | This text defines the directory's two working postures, the source-corpus posture for Pass 2C, route-material reconciliation, and the top-to-bottom reading rule. It is the front-door operational frame for the directory. |
| `## Authority Order` | One `##` slice | This section owns current source read order and conflict posture for implementation/version planning before successor cutover, plus the Pass 2C doc-worker read-order note. |
| `## Navigation And Document Roles` | One `##` slice | This section owns README/CONTEXT navigation limits and the distinction between implementation authority and Pass 2C rewrite freedom. |
| `## Design Deliverables` | One `##` slice | This section owns the operational readiness gate: read the open-design deliverables checklist before Goal implementation planning, and do not treat Ready as concrete file/function/slice planning. |
| `## Non-Negotiables` | One `##` slice | This is one operational pointer list. It must be preserved as operational guidance, while successor behavior targets own the canonical rules. No below-heading split is needed because the source has no separable subheading contracts. |
| `## Test Prep Posture` | One `##` slice | This section points implementation prep to the test deletion map and upstream baseline posture. It is operational/test-prep guidance, not test execution. |
| `## Working Posture` | One `##` slice | This section owns terrain-versus-mission guidance, Pass 2C route-material posture, known bad terrain warnings, and the required direction-lock form. |
| `## Verification` | One `##` slice | This section owns docs-only and Rust verification posture for this directory. |

No `##` section requires splitting below `##` under Packet 05. The
non-negotiables list is cross-target, but in this source file it functions as
an operational pointer list; behavior ownership and local reminders are
handled by Packet 03 and later rewrite/audit packets.

No unresolved split question carries to Packet 06d7. The rollup only needs to
record that `AGENTS.md` uses heading-range slices with no below-heading
splits.

## Output Expected

A compact split disposition for `AGENTS.md`, with reasons grounded in Packet
05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition: heading-range slices with no
  below-heading splits.
- Split reasons keep operational instructions from becoming behavior authority.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c, 06d1, 06d2, or 06d4-06d6.
- Defining cutover gates.
- Consolidating all Packet 06d decisions.
- Starting rewrite execution.
