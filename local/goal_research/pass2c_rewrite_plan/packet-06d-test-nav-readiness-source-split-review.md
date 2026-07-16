# Packet 06d: Test Nav Readiness Source Split Review

Status: closed as parent/index.

## Purpose

Split test, readiness, navigation, operations, and exclusion review into
bounded child packets.

## Scope

This parent packet owns the scaffold for applying Packet 05 source-slice rules
to test, readiness, navigation, operations, and exclusion candidates. It does
not classify those docs itself.

- `goal-test-deletion-map.md`
- `goal-authority-open-design-deliverables.md`
- `AGENTS.md`
- `README.md`
- `CONTEXT.md`

It also owns the scaffold for explicit exclusion review of non-source-corpus
handoff, prep, planning, or design-pass material under `local/goal_research/`.

Packet 06d was too broad as one review because it grouped five docs plus
exclusion candidates. Those docs have different roles: test prep, readiness,
operational instructions, reader navigation, glossary vocabulary, and
non-source-corpus artifact exclusion. Closing them together would invite a
navigation summary instead of direct source-read split decisions.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 01 for future artifact boundaries
- `local/goal_research/AGENTS.md`
- `local/goal_research/README.md`
- `local/goal_research/CONTEXT.md`

Direct top-to-bottom reading of assigned source docs and direct review of
candidate exclusion docs is required by the 06d child packets, not by this
parent scaffold correction.

## Decisions

Test, readiness, navigation, operations, and exclusion review is divided into
these child packets:

- `packet-06d1-test-deletion-map-split-review.md`
  - test deletion map source doc only
- `packet-06d2-open-design-readiness-split-review.md`
  - open design deliverables source doc only
- `packet-06d3-agents-operations-split-review.md`
  - `AGENTS.md` operations source doc only
- `packet-06d4-readme-navigation-split-review.md`
  - `README.md` navigation source doc only
- `packet-06d5-context-glossary-split-review.md`
  - `CONTEXT.md` glossary source doc only
- `packet-06d6-exclusion-candidates-review.md`
  - explicit exclusions from source-slice execution
- `packet-06d7-test-nav-readiness-split-rollup.md`
  - consolidated 06d disposition after 06d1-06d6 close

Each source-doc child packet must apply Packet 05 directly to its assigned
source doc. The exclusion child must identify non-source-corpus docs with
reasons and must not hide source authority. Trace rows, concept rows, target
keys, and source-feed maps may guide the review, but they do not substitute
for reading the assigned source text or candidate exclusion docs.

Packet 06d7 stays blocked until 06d1-06d6 close. Packet 06e stays blocked
until Packet 06a, Packet 06b5, Packet 06c4, and Packet 06d7 close. Packet 07
stays blocked until Packet 06e closes.

## Output Expected

A bounded Packet 06d child scaffold that lets later agents close test,
readiness, navigation, operations, glossary, and exclusion review one document
family at a time.

## Closure Criteria

- Packet 06d no longer asks one agent to classify five docs plus exclusions.
- Child packets 06d1-06d7 exist with required packet sections.
- Child packets name their assigned source doc or exclusion scope without
  filling split tables.
- Packet 06d7 is explicitly blocked until 06d1-06d6 close.
- Packet 06e is explicitly blocked on the 06d7 rollup.
- The packet README reflects the 06d parent/child dependency chain.

## Non-Goals

- Classifying any test, readiness, navigation, operations, glossary, or
  exclusion source now.
- Assigning source-slice IDs.
- Choosing dependency order or execution order.
- Creating successor drafts.
- Creating source-slice records.
- Closing traceability rows.
- Defining cutover gates.
- Starting rewrite execution.
