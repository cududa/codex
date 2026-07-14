# Implementation Pass Planning Rules

This file defines how to divide large Work Area docs into ordered implementation
passes. It is an execution-planning constraint, not Goal authority. The
authority docs under `local/goal_research` still win.

## Purpose

The problem to avoid is simple:

```text
Work Area docs too large for one agent window
  -> dumb split by headings or word count
  -> fake work units that do not match implementation seams
```

Implementation pass planning exists to avoid that failure. It is not a
separate planning program or a requirement to create prep artifacts before
every Work Area can be divided into workable tasks.

## Core Rule

Implementation passes are ordered units of work on one rewrite branch. They
exist so agents can pick up the next piece of the same branch after compaction
with enough local context to proceed.

Implementation passes are not individual PRs, release units, checkpoints, or
promises of independent mergeability. Do not distort architecture, add no-op
modules, create broad adapters, or invent test-only seams to make a pass look
self-contained.

## Direct Passes First

Default to direct implementation pass planning when the Work Area already has
clear implementation seams.

For example, Work Area 02 is mostly linear:

- final request-input shaping
- per-attempt request-loop placement
- Created-event commit
- committed carry metadata
- core producer conversion
- integrated request/retry tests

For a Work Area like this, read the authority docs, read the Work Area, do targeted
direct code reads around the request/producer/carry/test seams, and then write
implementation pass docs. Do not insert a prep-map session just because this
file mentions prep maps.

## Appendage Maps

Use a prep pass only when direct implementation pass planning would force the
next agent to reread a large cross-cutting Work Area and half the repo before doing
useful work.

The main expected case is Work Area 03. It has several appendages that touch
different subsystems:

- model-visible history key projection
- Continuation watermark storage
- idle stage ordering
- pending durable intent delivery from idle
- automatic Continuation preflight and finalizer recheck
- Continuation Created commit
- resume hydration
- retry/failure/stale synthetic-turn behavior
- compaction/reconstruction key correctness

For a Work Area like that, a prep output may be useful if it is an appendage map:

- what behavioral appendages exist
- where each appendage enters the code
- which appendages are coupled
- which appendages probably need separate passes
- which appendages can wait for a later Work Area

An appendage map is temporary context compression for the next agent. It is not
authority, not an implementation plan by itself, and not a read log.

## What Not To Produce

Do not produce prep outputs whose main content is:

- a broad list of files to read
- exhaustive observations with no implementation consequence
- a checklist that must be filled before any implementation pass can be written
- invented context budgets
- bureaucratic process artifacts
- a plan to plan the work

If the prep artifact does not let the next agent start a concrete
implementation pass or a targeted reread, it has failed.

## Splitting Standard

Before naming implementation pass boundaries:

- read the relevant authority docs directly
- read the Work Area doc directly
- read the code needed to understand the proposed seam
- split by implementation pressure, ownership boundary, and test boundary
- keep observed code facts separate from design inference when the difference
  matters

Grep can locate terrain, but grep results are not a substitute for direct file
reads around the relevant functions, data types, callers, and tests.

## Work Area Guidance

- Work Area 01: state terrain is narrow enough to plan direct passes around
  schema/model plumbing, pending intent storage, and cadence-aware store
  operations.
- Work Area 02: plan direct passes from targeted request construction, commit,
  producer, carry, and test reads. Do not require an appendage map.
- Work Area 03: likely benefits from an appendage map before final implementation
  pass docs because idle Continuation spans state, history projection, request
  finalization, resume, retry, and compaction/reconstruction.
- Work Area 04: use an appendage map only if reachable `ext/goal` ownership and
  current producers are unclear after a bounded code read.
- Work Area 05: may benefit from a surface map if classifier, projection,
  compaction/reconstruction, and raw/materialized behavior are too broad for
  direct implementation pass planning.
- Work Area 06: should usually be a final cleanup/audit pass. Divide it only if
  the deletion and acceptance audit proves too large for one pass.

## Implementation Pass Doc Shape

Each implementation pass doc should include enough local context for the next
agent to implement that pass without prior conversation memory:

- Direction Lock
- authority docs read
- code terrain read
- pass goal
- exact files to edit
- required edits
- tests and checks for introduced behavior
- branch continuation state
- non-goals

Use "branch continuation state" to describe handoff to the next ordered pass.
Avoid language that implies the pass must be independently merged, released,
accepted, or buildable as the full Work Area.
