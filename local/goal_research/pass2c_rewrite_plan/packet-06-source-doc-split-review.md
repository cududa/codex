# Packet 06: Source Doc Split Review

Status: closed as parent/index.

## Purpose

Split the source-doc split review into bounded child packets.

## Scope

This parent packet owns the scaffold for applying Packet 05 source-slice rules
source by source. It does not classify source docs itself.

Packet 06 was originally too broad because it asked one agent to classify every
current source doc as whole-doc, heading-range, or excluded. That requires
direct source reading across authority spine docs, core seam docs, support and
demolition docs, test prep, readiness, navigation, and operational material.
That is more than one fresh agent can close honestly in one focused context
window.

## Required Grounding

- Packet 00
- Packet 05
- `local/goal_research/AGENTS.md`
- `local/goal_research/README.md`
- the active Packet 06 split-correction passforward

Direct top-to-bottom reading of every source doc is required by the child
split-review packets, not by this parent scaffold correction.

## Decisions

Source-doc split review is divided into these child packets:

- `packet-06a-spine-source-split-review.md`
  - authority spine docs: grounding truth, primary cadence, idle continuation
- `packet-06b-core-seam-source-split-review.md`
  - parent/index for the core seam split-review subpackets
- `packet-06b1-durable-cadence-state-split-review.md`
  - durable cadence state
- `packet-06b2-final-request-input-split-review.md`
  - final request input and commit
- `packet-06b3-model-visible-history-key-split-review.md`
  - model-visible history key
- `packet-06b4-recorded-request-evidence-split-review.md`
  - recorded request evidence
- `packet-06b5-core-seam-split-rollup.md`
  - consolidated core seam disposition after 06b1-06b4 close
- `packet-06c-support-and-demolition-source-split-review.md`
  - repair/classifier integration, extension ownership, fake-shim removal
- `packet-06d-test-nav-readiness-source-split-review.md`
  - test deletion, open design deliverables, AGENTS, README, CONTEXT, and
    explicit exclusion candidates
- `packet-06e-split-review-rollup.md`
  - consolidated split-review disposition after 06a, 06b5, 06c, and 06d close

Each child packet must apply Packet 05 directly to its assigned source docs.
Trace rows, concept rows, target keys, and source-feed maps may guide the
review, but they do not substitute for reading the assigned source text.

Packet 06b5 stays blocked until 06b1-06b4 close. Packet 06e stays blocked
until 06a, 06b5, 06c, and 06d close. Packet 07 source-dependency-order work
stays blocked until Packet 06e has consolidated the child decisions.

## Output Expected

A bounded Packet 06 child scaffold that lets later agents close source-doc
split review in small source-family batches.

## Closure Criteria

- Packet 06 no longer asks one agent to classify every source doc.
- Child packets 06a, 06b1-06b5, 06c, 06d, and 06e exist with required packet
  sections.
- Child packets name their source family without filling split tables.
- Packet 06e is explicitly blocked until 06a, 06b5, 06c, and 06d close.
- Packet 07 is blocked on the Packet 06e rollup.
- The packet README reflects the parent/child dependency chain.

## Non-Goals

- Classifying any source doc as whole-doc, heading-range, or excluded.
- Assigning source-slice IDs.
- Choosing dependency order or execution order.
- Creating successor drafts.
- Creating source-slice records.
- Closing traceability rows.
- Moving, renaming, archiving, or deleting source docs.
