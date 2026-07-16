# Packet 06d5: Context Glossary Split Review

Status: closed.

## Purpose

Apply Packet 05 source-slice rules to the glossary source doc.

## Scope

This packet owns whole-doc versus heading-range disposition for:

- `CONTEXT.md`

It does not review test prep, readiness, AGENTS operations, README navigation,
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

`CONTEXT.md` can close as one whole-doc source slice.

Direct reading shows one dominant source role: glossary-only vocabulary for
the Goal authority corpus. The title and introductory prose define the file as
a glossary and explicitly state that it does not define implementation plans,
code ownership, or test requirements. The single `## Glossary` section then
defines shared terms that point readers toward the authority contracts without
owning those contracts.

Traceability records both the title/intro and `## Glossary` under `GLOSSARY`
with `Leave` status. The concept ledger also keeps navigation, glossary,
agents, and readiness surfaces out of behavior-engine ownership. That means
the cross-target nature of terms such as final request input, repair, cadence,
history key, evidence, extension, shim, and replacement test profile is a
reason to keep the glossary bounded as vocabulary, not a reason to split it
into behavior slices.

No `##` heading-range split is required. The title, introductory glossary
contract, and `## Glossary` section share the same source role and can be
audited together by one fresh agent. No below-heading split is required: term
entries are not independent authority subcontracts, and splitting by term
would invite target-owner or behavior decisions that belong to successor
target docs and later source-slice execution.

The future source slice should use:

| Source unit | Disposition | Reason |
| --- | --- | --- |
| Entire `CONTEXT.md` | Whole-doc slice | One glossary-only source role; title/intro and terms are vocabulary context, not behavior authority, implementation plan, or test contract. |

No unresolved split question carries to Packet 06d7. The rollup only needs to
record that `CONTEXT.md` is a whole-doc glossary slice.

## Output Expected

A compact split disposition for `CONTEXT.md`, with reasons grounded in Packet
05 criteria and direct source reading.

## Closure Criteria

- The assigned source doc has a disposition.
- Disposition: whole-doc slice.
- Split reasons keep glossary vocabulary from becoming behavior authority.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing source docs assigned to 06a, 06b, 06c, 06d1-06d4, or 06d6.
- Defining cutover gates.
- Consolidating all Packet 06d decisions.
- Starting rewrite execution.
