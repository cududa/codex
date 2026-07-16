# Packet 06c: Support And Demolition Source Split Review

Status: closed as parent/index.

## Purpose

Split support and demolition source-doc review into bounded child packets.

## Scope

This parent packet owns the scaffold for applying Packet 05 source-slice rules
to support and demolition docs. It does not classify those docs itself.

- `goal-authority-repair-classifier-integration.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-authority-fake-shim-removal-map.md`

Packet 06c was too broad as one review because it grouped three independently
dense source docs: cleanup/repair/classifier integration, extension ownership,
and fake-shim demolition terrain. The fake-shim doc also contains nested
work-area sections. Closing all three in one packet would invite a summary
sketch instead of direct source-read split decisions.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packets 03 and 04 for owner and source-feed constraints
- `local/goal_research/README.md`

Direct top-to-bottom reading of the assigned source docs is required by the
06c child split-review packets, not by this parent scaffold correction.

## Decisions

Support and demolition source-doc split review is divided into these child
packets:

- `packet-06c1-repair-classifier-split-review.md`
  - repair/classifier integration source doc only
- `packet-06c2-extension-ownership-split-review.md`
  - extension ownership source doc only
- `packet-06c3-fake-shim-removal-split-review.md`
  - fake-shim removal map source doc only
- `packet-06c4-support-demolition-split-rollup.md`
  - consolidated 06c disposition after 06c1-06c3 close

Each child packet must apply Packet 05 directly to its assigned source doc.
Trace rows, concept rows, target keys, and source-feed maps may guide the
review, but they do not substitute for reading the assigned source text.

If a 06c child doc itself proves too large to close honestly in one focused
context window, that child must split before receiving source-disposition
decisions.

Packet 06c4 stays blocked until 06c1-06c3 close. Packet 06e stays blocked
until Packet 06a, Packet 06b5, Packet 06c4, and Packet 06d close. Packet 07
stays blocked until Packet 06e closes.

## Output Expected

A bounded Packet 06c child scaffold that lets later agents close support and
demolition source-doc split review one source doc at a time.

## Closure Criteria

- Packet 06c no longer asks one agent to classify all three support and
  demolition docs.
- Child packets 06c1-06c4 exist with required packet sections.
- Child packets name their assigned source docs without filling split tables.
- Packet 06c4 is explicitly blocked until 06c1-06c3 close.
- Packet 06e is explicitly blocked on the 06c4 rollup.
- The packet README reflects the 06c parent/child dependency chain.

## Non-Goals

- Classifying any support or demolition source doc as whole-doc or
  heading-range.
- Assigning source-slice IDs.
- Choosing dependency order or execution order.
- Creating successor drafts.
- Creating source-slice records.
- Closing traceability rows.
- Starting rewrite execution.
