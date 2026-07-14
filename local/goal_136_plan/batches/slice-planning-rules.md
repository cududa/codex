# Slice Planning Rules

This file defines how to split batch docs into smaller ordered work packets.
It is an execution-planning constraint, not Goal authority. The authority docs
under `local/goal_research` still win.

## Core Rule

Slices are ordered work packets on one rewrite branch. They exist so an agent
can pick up the next piece of work after compaction with enough local context
to proceed.

Slices are not individual PRs, release units, or promises of independent
mergeability. Do not distort the architecture, add no-op modules, create broad
adapters, or invent test-only seams to make a slice look independently
complete.

## Required Prep

Before naming slice boundaries for a batch:

1. Read the relevant authority docs directly.
2. Read the unsliced batch doc directly.
3. Walk the code paths named by the batch doc.
4. Record observed code facts separately from inferred implementation pressure.
5. Split only where the code terrain supports an actual implementation seam.

Grep can locate terrain, but grep results are not a substitute for direct file
reads around the relevant functions, data types, callers, and tests.

## Boundary Tests

Use these questions to evaluate a proposed slice boundary:

- What concrete code ownership seam does this boundary follow?
- What exact files or functions did the tree-walk identify for this packet?
- What state should the next packet inherit after this packet is done?
- Which tests or checks belong with the behavior introduced here?
- What remains intentionally unfinished until a later packet?
- Does this packet avoid claiming batch acceptance before the batch is complete?

If the answer is mostly document structure, chronology, or a plausible design
guess, the boundary is not ready.

## Large Batch Prep Maps

Large batches may need a prep-map packet before writing slice docs. The prep
map should identify the code touch-points for each behavioral appendage, the
cross-cutting files, and the places where the initial read is still uncertain.

For example, Batch 03 should start with a code touch-point map for the history
key, continuation watermark, idle ordering, resume hydration, retry behavior,
and tests before final slice boundaries are written. That prep map can be the
whole session if the terrain is large enough.

## Slice Doc Shape

Each slice doc should include:

- Direction Lock
- authority docs read
- code terrain read
- packet goal
- exact files to edit
- required edits
- tests and checks for the introduced behavior
- branch continuation state
- non-goals

Use "branch continuation state" to describe handoff to the next ordered packet.
Avoid language that implies the packet must be independently merged, released,
or accepted as the full batch.
