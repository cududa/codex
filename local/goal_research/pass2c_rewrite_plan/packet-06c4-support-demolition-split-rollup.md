# Packet 06c4: Support Demolition Split Rollup

Status: closed.

## Purpose

Consolidate the closed Packet 06c child split reviews into one support and
demolition source-doc split disposition.

## Scope

This packet owns 06c rollup only. It merges child decisions, resolves duplicate
or conflicting dispositions, and records unresolved questions for Packet 06e or
user review.

It does not perform first-pass split review for the assigned support and
demolition source docs.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06c parent/index
- closed Packets 06c1, 06c2, and 06c3
- Packet 03 and Packet 04 only where a child decision conflicts with owner or
  source-feed boundaries

## Decisions

Consolidated 06c source-doc disposition:

| Source doc | Split disposition | Rollup notes |
| --- | --- | --- |
| `goal-authority-repair-classifier-integration.md` | Heading/range source slices. | Split into opening terrain, classifier/purity rules, final-input repair, typed projection, history boundaries, compaction, reconstruction/rollback/fork, raw notifications, ownership, and tests. |
| `goal-authority-ext-goal-ownership.md` | Heading/range source slices. | Split into opening purpose, terrain/upstream shape, ownership decision, replacement shape, configuration, reachability, file-specific work areas, and tests. |
| `goal-authority-fake-shim-removal-map.md` | Heading and below-heading source slices. | Split below `##` for active shim roots, shim-dependent consumers, and required work areas; other `##` sections remain whole. |

No duplicate or conflicting child dispositions require correction. The
intentional overlaps among cleanup, final input, extension, shim demolition,
cadence, readiness, and test-prep are secondary seam checks. They are not
target destinations or execution order.

Support and demolition source coverage is complete for Packet 06c. The three
source docs assigned by the Packet 06c parent all have closed split
dispositions.

Packet 06e does not yet have enough input to consolidate the full source-doc
split review because Packet 06d remains open. Once 06d closes, 06e can include
this 06c rollup directly.

## Output Expected

A compact consolidated 06c disposition table or list suitable for the Packet
06e split-review rollup.

## Closure Criteria

- Packets 06c1-06c3 are closed before this packet receives decisions.
- Every 06c child disposition is represented in the rollup.
- Missing, duplicated, or conflicting dispositions are resolved or explicitly
  assigned to user review.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Performing first-pass source reading for 06c1-06c3 source docs.
- Reviewing source docs assigned to 06a, 06b, or 06d.
- Choosing dependency order or ordered source slices.
- Choosing target destinations per slice.
- Starting rewrite execution.
