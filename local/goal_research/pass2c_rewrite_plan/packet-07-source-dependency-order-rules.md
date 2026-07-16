# Packet 07: Source Dependency Order Rules

Status: stub.

## Purpose

Define the dependency principles that should order source slices.

## Scope

This packet owns order rules, not the final ordered table.

## Required Grounding

- Packets 03, 05, and 06
- source authority spine
- supporting seam docs
- Pass 2B target-interface packets
- Pass 2B.5 repeated-authority batches

## Decisions To Make

- Which source concepts must be translated before other concepts can point to
  them.
- Which support docs must wait for behavior/seam owners.
- Where test, readiness, navigation, and glossary work should fall.
- Which dependencies require route verification before ordering is final.

## Output Expected

A small set of ordering principles. Do not produce the ordered slice table.

## Closure Criteria

- The rules explain why behavior/cadence/state/final/idle/history/evidence/
  cleanup/extension/shim/test/navigation work is sequenced.
- Support targets are not allowed to become early behavior owners.
- Packet 08 has enough policy to build a table.

## Non-Goals

- Source-slice table.
- Route-verification matrix.
- Workflow or audit templates.
