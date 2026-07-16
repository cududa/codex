# Packet 04: Target Source Feed Map

Status: stub.

## Purpose

Name which source docs likely feed each successor target without deciding
rewrite slice order.

## Scope

This packet owns target-to-source feed mapping and required secondary target
checks.

## Required Grounding

- Packets 02 and 03
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- source authority docs named by `AGENTS.md` and `README.md`
- Pass 2B target-interface packets

## Decisions To Make

- Canonical source feeds for each target.
- Supporting source feeds for each target.
- Secondary target checks required when a source feed crosses owner seams.
- Source docs that should not feed successor authority, with reason.

## Output Expected

A target-centered source-feed map. It should help later slice planning without
becoming a source-slice table.

## Closure Criteria

- Each target from Packet 02 has source feeds or an explicit exclusion.
- Source feeds are grounded in direct source reading, not filenames alone.
- No source slice IDs or ordered execution table are introduced.

## Non-Goals

- Deciding slice unit.
- Deciding source order.
- Closing traceability rows.
