# Packet 00: Planning Boundary And Packet Rules

Status: closed.

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

This planning workspace may create:

- the compact top-level Pass 2C planning index,
- bounded planning packet files,
- passforward notes for the next bounded packet, and
- planning-only updates to packet status or prerequisite order.

This planning workspace may propose, but must not create, future successor
draft paths, source-slice record paths, audit paths, or cutover paths. Packet
01 owns those proposed locations.

This planning workspace must not create:

- successor authority docs or draft authority files,
- source-slice execution records,
- traceability closure records,
- cutover artifacts,
- archived, moved, renamed, or deleted source docs, or
- Rust/code implementation changes.

Pass 2C creates replacement authority, not a meta layer. Planning packets may
describe how successor docs will replace the current source corpus, but they
must not make future agents depend on a permanent overlay that explains old
docs from the side. The current source docs stay in force as the source corpus
until source-bounded rewrite slices, fidelity checks, and cutover gates prove
that successor docs can replace them without loss.

Packet size and split rules:

- Prefer 60-120 lines. This is guidance, not a hard cap.
- Split before 180 lines unless a small owned table or the concrete answer to
  one owned decision justifies the extra length.
- Split immediately when a packet starts answering another packet's question.
- Do not paste long source summaries into packet bodies.
- Use file lists as grounding instructions, not as substitute decisions.
- Do not use size pressure as a reason to leave the active packet's own
  decision unresolved.

Required packet sections:

- Purpose
- Scope
- Required Grounding
- Decisions To Make or Decisions
- Output Expected
- Closure Criteria
- Non-Goals
- Status

One fresh agent can close one packet only when the packet's named decision can
be read, understood, edited, and verified in a single focused context window.
If closing the packet requires holding unrelated target maps, source tables,
route policy, workflow templates, repeated-authority rules, audit categories,
and cutover gates at once, the packet is too broad and must split.

When the named decision is still one closeable question, the packet should
spend the lines needed to answer it. Splitting is for overbroad decision shape,
not for avoiding a dense but tractable answer.

Blocked packets stay blocked until their prerequisite packets are closed. A
blocked packet may be edited only to fix status, prerequisites, or obvious
scaffold errors. It must not be filled with provisional decisions while its
inputs are still open.

Unblocked active packets should not carry questions forward by default. Carry
forward only a concrete conflict, missing prerequisite, or user decision found
after grounding.

## Output Expected

A concise rule set that later packets can point to instead of restating
planning boundaries.

## Closure Criteria

- The packet answers only planning-boundary questions.
- It does not decide target docs, source slices, route checks, workflow
  templates, repeated-authority policy, audits, or cutover gates.
- It names docs-only verification.
- It leaves artifact-location decisions to Packet 01.

## Non-Goals

- Creating successor drafts.
- Creating source-slice records.
- Starting rewrite execution.
- Moving or deleting source docs.
- Editing Rust.
