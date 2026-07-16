# Packet 08: Ordered Slice Table

Status: blocked until Packets 04, 06, and 07 close.

## Purpose

Create an ordered source-slice table after target feeds, source split
decisions, and dependency-order rules are closed.

## Scope

This packet owns the first ordered table of future source slices.

## Required Grounding

- Packet 04
- Packet 06
- Packet 07
- source docs for any disputed row
- Pass 2B and Pass 2B.5 inputs needed for target checks

## Decisions To Make

- Stable slice ID for each source slice.
- Exact source file and heading range.
- Primary target destination.
- Secondary target checks.
- Route-verification question family, if any.
- Expected audit category.
- Explicit deferrals or exclusions.

## Output Expected

An ordered table only after prerequisites close.

## Closure Criteria

- Every included source slice has a bounded range and target routing.
- Every current source doc is included or explicitly excluded.
- The table is not used to start rewrite execution.

## Non-Goals

- Writing successor drafts.
- Creating slice records.
- Defining the workflow template.
