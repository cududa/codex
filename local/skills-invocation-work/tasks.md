# Skills Invocation Research Tasks

This is the executable queue for the skill/plugin/app invocation authority
pre-pass.

## Global Rules

- Keep this packet aligned to the five locked deliverables in `README.md`.
- Do not write Rust implementation plans until the readiness gate says the
  design inputs are ready.
- Use current source as terrain, not authority.
- Every slice must update at least one of:
  - `source-corpus-map.md`
  - `concept-ledger.md`
  - `open-decisions.md`
  - `authority-map.md`
  - `proof-and-readiness.md`
- Use `task-alignment` for each slice and emit a Direction Lock.
- If a slice is too large after terrain sampling, decompose it by ownership
  seam or reader job, not by source-file list.
- Do not run Rust validation for docs-only work.

## Queue

- [ ] 01 Source corpus map
- [ ] 02 Concept ledger
- [ ] 03 Open-decision log
- [ ] 04 Authority map
- [ ] 05 Proof and readiness

## Slice Order

1. `slices/01-source-corpus-map.md`
2. `slices/02-concept-ledger.md`
3. `slices/03-open-decisions.md`
4. `slices/04-authority-map.md`
5. `slices/05-proof-readiness.md`

## Completion Standard

The packet is ready to feed implementation planning only when a fresh agent can
answer:

- What source categories can produce turn input or model-visible request input?
- Which categories are candidate invocation-bearing sources?
- Which categories are model-visible-only, quoted evidence, replay, projection,
  or tool output?
- What is the difference between structured skill selection, plain text skill
  mention, linked skill mention, plugin mention, app mention, and injected
  guidance?
- Which future live doc would own each durable rule?
- What decisions remain open and what do they block?
- What proof cluster would demonstrate correct invocation and non-invocation?
- What should stop implementation planning?

## Current Notes

- The motivating bug is recorded in `local/skill_invocation_bug.md`.
- The current local code shape has version drift around `ResponseInputItem` and
  `ResponseItem`; treat both as terrain until the source corpus map is filled.
- The initial hypothesis is that the hard problem is provenance and operative
  authority, not text extraction.
- Plugin and app mention behavior should be researched alongside skills because
  the current runtime collection is adjacent and a partial fix could produce
  inconsistent tool exposure semantics.

