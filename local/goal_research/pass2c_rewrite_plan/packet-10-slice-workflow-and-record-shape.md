# Packet 10: Slice Workflow And Record Shape

Status: stub.

## Purpose

Define the repeatable workflow and small record shape for one future source
slice.

## Scope

This packet owns per-slice workflow, slice record fields, and closure status
values.

## Required Grounding

- Packets 08 and 09
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- Pass 2B target-interface packets
- Pass 2B.5 repeated-authority workspace
- representative source docs for record-field sanity checks

## Decisions To Make

- Per-slice read order.
- Minimum slice record fields.
- Source-to-target trace entry shape.
- Source/route reconciliation note shape.
- Fidelity debt note shape.
- Allowed closure statuses.

## Output Expected

A workflow and record template small enough for later agents to use without
inventing fields.

## Closure Criteria

- The workflow starts from source text.
- The record shape distinguishes copied, translated, canonicalized, local,
  pointer-only, deferred, and obsolete material.
- It does not create actual slice records.

## Non-Goals

- Executing a slice.
- Updating successor drafts.
- Closing traceability rows.
