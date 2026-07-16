# Packet 06d4: README Navigation Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the README navigation source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `README.md`

It does not review test prep, readiness, AGENTS operations, glossary,
exclusion candidates, or source docs assigned to 06a, 06b, or 06c.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06d parent/index
- Packet 01 for future artifact boundaries
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- the assigned source doc, read directly top to bottom

## Decisions

`README.md` must not close as one whole-doc source slice.

The doc has one navigation role, but direct reading shows several distinct
reader-navigation functions: start-here map, authority spine, high-level
through-line, seam routing table, current terrain anchors, document role table,
and Pass 2 guardrails. Traceability marks `NAV-README` as navigation only, and
the concept ledger says navigation surfaces must not become behavior engines.
A whole-doc slice would crowd the audit for table-heavy routing sections and
make it too easy to treat README synthesis as behavior authority.

Use these source units:

| Source unit | Disposition | Reason |
| --- | --- | --- |
| Title, introductory navigation prose, and `Start with` list | One opening range slice | This text defines README as a navigation aid, states the direct-implementation and Pass 2C postures, and gives the start-here read order. It is the reader-map entry point. |
| `## Authority Spine` | One `##` slice | This section owns the reader-level spine list and the warning that repeated spine clauses remain authority reinforcement until Pass 2B.5 routing is applied during Pass 2C. |
| `## Core Through-Line` | One `##` slice | This section is a high-level synthesis of the two main seams and support seams. It must stay navigation-only and be checked against the concept ledger during rewrite. |
| `## Supporting Seams` | One `##` slice | This table maps questions to source docs. It is one navigation table and does not need below-heading splitting. |
| `## Current Terrain Anchors` | One `##` slice | This section is a code-anchor map. It must stay terrain, not mission, and should be audited as one navigation/terrain unit. |
| `## Document Roles` | One `##` slice | This table maps current docs to roles, owns, and does-not-own boundaries. It is one navigation table that later becomes or points to the successor target interface map. |
| `## Pass 2 Guardrails` | One `##` slice | This section owns rewrite guardrails: use traceability and ledgers, avoid weakened non-negotiables or current-broken-terrain promotion, and reconcile work-area route material during Pass 2C. |

No `##` section requires splitting below `##` under Packet 05. The tables are
large enough to justify separate heading slices, but each table has one
navigation function and no independent subheading contracts.

No unresolved split question carries to Packet 06d7. The rollup only needs to
record that `README.md` uses heading-range slices with no below-heading
splits.

## Output Expected

A compact split disposition for `README.md`, with reasons grounded in Packet
05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition: heading-range slices with no
  below-heading splits.
- Split reasons keep reader navigation from becoming behavior authority.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c, 06d1-06d3, 06d5, or 06d6.
- Defining cutover gates.
- Consolidating all Packet 06d decisions.
- Starting rewrite execution.
