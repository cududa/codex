# Packet 00: Planning Boundary And Packet Rules

Status: stub.

## Purpose

Define what this planning scaffold may create and how small packets must stay.

## Scope

This packet owns planning boundaries, packet size rules, required packet
sections, closeability gates, and blocked-packet discipline.

Pass 2C is planning replacement authority, not a meta layer over the current
source docs. The current source docs stay as the source corpus until traced
rewrite slices and cutover gates prove the successor docs can replace them
without concept loss.

## Required Grounding

- `local/goal_research/PASS2C_PLANNING_HANDOFF.md`
- `local/goal_research/AGENTS.md`
- `local/goal_research/PASS2C_REWRITE_PLAN.md`
- `local/goal_research/pass2c_rewrite_plan/README.md`

## Decisions To Make

- What this planning workspace may create.
- What this planning workspace must not create.
- How the scaffold keeps replacement-authority work distinct from a meta layer.
- Packet length and split rules.
- Required packet sections.
- What it means for one fresh agent to close one packet.
- How blocked packets remain blocked until prerequisites close.

## Output Expected

A concise rule set that later packets can point to instead of restating
planning boundaries.

## Closure Criteria

- The packet answers only planning-boundary questions.
- It does not decide target docs, source slices, route checks, workflow
  templates, repeated-authority policy, audits, or cutover gates.
- It names docs-only verification.

## Non-Goals

- Creating successor drafts.
- Creating source-slice records.
- Starting rewrite execution.
- Moving or deleting source docs.
- Editing Rust.
