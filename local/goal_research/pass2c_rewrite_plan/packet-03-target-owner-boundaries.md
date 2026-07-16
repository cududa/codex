# Packet 03: Target Owner Boundaries

Status: stub.

## Purpose

Decide which target owns each major rule family and where local reminders are
allowed.

## Scope

This packet owns owner, shared-local, and pointer-only boundaries between
successor targets.

## Required Grounding

- Packet 02
- `PASS2_CONCEPT_LEDGER.md`
- Pass 2B target-interface packets
- Pass 2B.5 repeated-authority canonicalization workspace
- relevant source docs for any contested owner boundary

## Decisions To Make

- Canonical owner for each high-risk repeated rule family.
- Targets that require local reminders because their seam can violate the rule.
- Targets that should be pointer-only.
- Boundaries that remain unresolved and need user review.

## Output Expected

A compact owner-boundary table or list. Do not include full repeated-authority
compression mechanics.

## Closure Criteria

- Each listed rule family has one owner or an explicit split owner.
- Local reminders are justified by local seam risk.
- Pointer-only targets do not silently own behavior.

## Non-Goals

- Mapping source docs to targets.
- Writing canonical successor prose.
- Defining audit checklists.
