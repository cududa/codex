# Packet 06: Source Doc Split Review

Status: stub.

## Purpose

Apply Packet 05 rules to decide which source docs are whole-doc slices and
which must be split by heading range.

## Scope

This packet owns source-by-source split decisions, not ordering.

## Required Grounding

- Packet 05
- `PASS2_SECTION_TRACEABILITY.md`
- source authority docs under `local/goal_research/`
- `goal-test-deletion-map.md`
- `AGENTS.md`, `README.md`, and `CONTEXT.md` for navigation and operations
  sources

## Decisions To Make

- Whole-doc versus heading-range disposition for each current source authority
  doc.
- Disposition for `goal-test-deletion-map.md`.
- Disposition for navigation and operational docs.
- Explicit exclusions for non-authority handoff material.

## Output Expected

A source-doc split review table. It may name proposed heading ranges, but it
should not assign execution order.

## Closure Criteria

- Every current source doc is classified as whole-doc, split-by-heading, or
  excluded with reason.
- Large or crosscutting docs are not left as broad whole-doc slices.
- The packet does not create slice IDs beyond provisional range labels unless
  Packet 05 requires them.

## Non-Goals

- Ordering slices.
- Assigning primary target per slice.
- Creating execution records.
