# Packet 06b: Core Seam Source Split Review

Status: closed as parent/index.

## Purpose

Split the core seam source-doc split review into bounded child packets.

## Scope

This parent packet owns the scaffold for applying Packet 05 source-slice rules
to core seam docs. It does not classify those docs itself.

Packet 06b was too broad as one review because it grouped four independently
dense seam contracts:

- `goal-authority-durable-cadence-state.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-model-visible-history-key.md`
- `goal-authority-recorded-request-evidence.md`

Each doc has a different owner/audit pressure. Closing all four in one packet
would invite a heading sketch instead of direct source-read split decisions.

## Required Grounding

- Packet 00
- Packet 05
- Packet 06 parent
- closed Packet 06a
- `local/goal_research/README.md`
- the active Packet 06b split-correction passforward

Direct top-to-bottom reading of the four core seam source docs is required by
the 06b child split-review packets, not by this parent scaffold correction.

## Decisions

Core seam source-doc split review is divided into these child packets:

- `packet-06b1-durable-cadence-state-split-review.md`
  - durable cadence state source doc only
- `packet-06b2-final-request-input-split-review.md`
  - final request-input and commit source doc only
- `packet-06b3-model-visible-history-key-split-review.md`
  - model-visible history key source doc only
- `packet-06b4-recorded-request-evidence-split-review.md`
  - recorded request evidence source doc only
- `packet-06b5-core-seam-split-rollup.md`
  - consolidated 06b disposition after 06b1-06b4 close

Each child packet must apply Packet 05 directly to its assigned source doc.
Trace rows, concept rows, target keys, and source-feed maps may guide the
review, but they do not substitute for reading the assigned source text.

If a 06b child doc itself proves too large to close honestly in one focused
context window, that child must split before receiving source-disposition
decisions.

Packet 06b5 stays blocked until 06b1-06b4 close. Packet 06e stays blocked
until Packet 06a, Packet 06b5, Packet 06c, and Packet 06d close. Packet 07
stays blocked until Packet 06e closes.

## Output Expected

A bounded Packet 06b child scaffold that lets later agents close core seam
source-doc split review one source doc at a time.

## Closure Criteria

- Packet 06b no longer asks one agent to classify all four core seam docs.
- Child packets 06b1-06b5 exist with required packet sections.
- Child packets name their assigned source docs without filling split tables.
- Packet 06b5 is explicitly blocked until 06b1-06b4 close.
- Packet 06e is explicitly blocked on the 06b5 rollup.
- The packet README reflects the 06b parent/child dependency chain.

## Non-Goals

- Classifying any core seam source doc as whole-doc or heading-range.
- Assigning source-slice IDs.
- Choosing dependency order or execution order.
- Creating successor drafts.
- Creating source-slice records.
- Closing traceability rows.
- Starting rewrite execution.
