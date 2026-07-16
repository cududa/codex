# Packet 01: Draft Workspace And Naming

Status: stub.

## Purpose

Choose where later Pass 2C execution artifacts should live and how they should
be named.

## Scope

This packet owns proposed locations and naming rules for future successor
drafts, source-slice records, and audit records.

## Required Grounding

- Packet 00
- `local/goal_research/PASS2C_PLANNING_HANDOFF.md`
- `local/goal_research/AGENTS.md`
- current `local/goal_research/` directory shape

## Decisions To Make

- Future execution workspace path.
- Future successor draft path.
- Future source-slice record path.
- Future audit and cutover record path.
- Naming conventions for draft docs, slice records, and audits.

## Output Expected

A small artifact-layout decision. Do not create the future workspace unless a
later user request explicitly starts execution.

## Closure Criteria

- Locations are named clearly enough for later packets to reference.
- No successor draft, slice record, or audit record is created.
- The names do not imply cutover or source-doc retirement.

## Non-Goals

- Choosing the full successor target set.
- Deciding source slice order.
- Defining record templates.
- Starting rewrite execution.
