# Packet 05: Source Slice Unit Rules

Status: stub.

## Purpose

Define what counts as one executable source slice.

## Scope

This packet owns slice-unit rules and heading-range split criteria in abstract.

## Required Grounding

- Packet 00
- `local/goal_research/AGENTS.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- representative source authority docs from the authority spine and seam docs

## Decisions To Make

- Default source slice unit.
- When a whole source doc is acceptable as one slice.
- When a source doc must be split by heading or heading range.
- How source titles and navigation headers are accounted for.
- Stable slice ID format.

## Output Expected

Rules for evaluating a source doc as a future slice. Do not evaluate every
source doc here.

## Closure Criteria

- The rules are specific enough for Packet 06 to apply source by source.
- The rules prevent a later agent from closing broad mixed-topic slices from
  memory.
- No ordered source-slice table is created.

## Non-Goals

- Source-by-source split decisions.
- Slice workflow templates.
- Source rewrite execution.
