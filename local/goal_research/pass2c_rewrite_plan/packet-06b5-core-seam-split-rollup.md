# Packet 06b5: Core Seam Split Rollup

Status: closed.

## Purpose

Consolidate the closed Packet 06b child split reviews into one core seam
source-doc split disposition.

## Scope

This packet owns 06b rollup only. It merges child decisions, resolves duplicate
or conflicting dispositions, and records unresolved questions for Packet 06e or
user review.

It does not perform first-pass split review for the assigned core seam source
docs.

## Required Grounding

- Packet 05
- Packet 06 parent
- Packet 06b parent/index
- closed Packets 06b1, 06b2, 06b3, and 06b4
- Packet 03 and Packet 04 only where a child decision conflicts with owner or
  source-feed boundaries

## Decisions

Consolidated 06b source-doc disposition:

| Source doc | Split disposition | Rollup notes |
| --- | --- | --- |
| `goal-authority-durable-cadence-state.md` | Whole-doc source slice. | One dominant durable-state seam: facts, facts version, pending intent, exact-key consumption, supersedence, and state non-ownership. Secondary checks remain local reminders, not separate source slices. |
| `goal-authority-final-request-input-and-commit.md` | Heading/range source slices. | Split into opening terrain, core proof rule, shaping/selection range, commit metadata, local evidence obligation, commit point, retry/follow-up, current-turn carry, `goals.rs` adapter, and tests. |
| `goal-authority-model-visible-history-key.md` | Heading/range source slices. | Split into opening terrain, key shape, eligible progress projection, capture point, runtime watermark, resume/restart, compaction/reconstruction, and tests. |
| `goal-authority-recorded-request-evidence.md` | Heading/range source slices. | Split into opening terrain, evidence boundary/correctness split, carrier choice, shape/fingerprints, commit timing/failure policy, replay, resume/suppression, rollback/fork, compaction, projection, version notes, and tests. |

No duplicate or conflicting child dispositions require correction. The
intentional overlaps among final input, history key, durable state, and
recorded evidence are secondary seam checks. They are not target destinations
or execution order.

Core seam source coverage is complete for Packet 06b. The four source docs
assigned by the Packet 06b parent all have closed split dispositions.

Packet 06e does not yet have enough input to consolidate the full source-doc
split review because Packets 06c and 06d remain open. Once those close, 06e
can include this 06b rollup directly.

## Output Expected

A compact consolidated 06b disposition table or list suitable for the Packet
06e split-review rollup.

## Closure Criteria

- Packets 06b1-06b4 are closed before this packet receives decisions.
- Every 06b child disposition is represented in the rollup.
- Missing, duplicated, or conflicting dispositions are resolved or explicitly
  assigned to user review.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Performing first-pass source reading for 06b1-06b4 source docs.
- Reviewing source docs assigned to 06a, 06c, or 06d.
- Choosing dependency order or ordered source slices.
- Choosing target destinations per slice.
- Starting rewrite execution.
