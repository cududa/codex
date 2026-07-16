# Packet 13: Cutover Gates

Status: stub.

## Purpose

Define what must be true before successor docs replace current source docs.

Cutover is the point where successor docs become the working authority and the
old source docs can be retired, moved, or deleted. This is not a one-for-one doc
replacement requirement; it is a traced reshape of the current authority corpus
into clearer successor targets.

## Scope

This packet owns cutover gates and consistency checks.

## Required Grounding

- Packets 10, 11, and 12
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- Pass 2B and Pass 2B.5 inputs
- current `AGENTS.md`, `README.md`, and `CONTEXT.md`

## Decisions To Make

- Slice closure requirements before cutover.
- Cross-target consistency checks.
- Traceability closure requirements.
- Repeated-authority audit requirements.
- Navigation and operational doc update requirements.
- What source docs may be moved or retired only after gates pass.

## Output Expected

A cutover gate list. It must not perform cutover.

## Closure Criteria

- Gates require all source slices to be closed or explicitly deferred.
- Gates prevent old source docs from being removed before traceability and
  fidelity are proven.
- Navigation and operational surfaces stay pointer-only after behavior owners
  exist.

## Non-Goals

- Renaming, moving, archiving, or deleting source docs.
- Updating successor docs.
- Closing Pass 2C execution.
