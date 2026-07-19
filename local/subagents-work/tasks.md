# Subagents Documentation Population Tasks

This was the executable queue for turning `local/subagents/` into live
feature-area documentation. It is retained as retired operational scaffolding,
not as behavior authority or a normal reader path.

## Global Rules

- Edit live docs only in `local/subagents/`.
- Use `local/subagents-work/` only for temporary extraction, ledgers, slice
  briefs, and open decisions.
- Do not treat work-dir notes as behavior authority.
- Use current code as terrain until a fact is moved into an owning live doc.
- Use `task-alignment` for each slice or subslice and emit a Direction Lock
  before editing live docs.
- Every slice must update `concept-ledger.md` and `open-decisions.md`.
- Every slice must end with ownership, terminology, and whitespace checks.
- If a slice is too large or underspecified after terrain sampling, use the
  Slice Decomposition Checkpoint before drafting broad live prose.
- A decomposed parent slice is not complete until its consolidation subslice
  satisfies the parent definition of done.
- Do not run Rust validation for docs-only work unless code or generated
  contracts change.

## Queue

- [x] 00 Scope ledger
- [x] 01 Core trio
- [x] 02 Communication and results
- [x] 03 State and client projection
- [x] 04 Hooks and realtime
- [x] 05 Proof and hardening

## Slice Order

1. `slices/00-scope-ledger.md`
2. `slices/01-core-trio.md`
3. `slices/02-communication-results.md`
4. `slices/03-state-client-projection.md`
5. `slices/04-hooks-realtime.md`
6. `slices/05-proof-hardening.md`

## Subslice Protocol

Subslice work is optional and evidence-driven. Use it only when a parent slice
cannot be completed coherently in one pass after the target docs and terrain
have been sampled.

A decomposition must record:

- the concrete reason the parent slice is not feasible as written;
- the target live docs affected;
- the proposed subslices;
- what each subslice owns;
- what each subslice must not decide;
- the consolidation subslice that returns to the parent definition of done.

Naming convention:

- Parent slice: `slices/01-core-trio.md`.
- Subslice directory: `slices/01-core-trio/`.
- Subslice briefs: `01a-*.md`, `01b-*.md`, `01c-*.md`.
- Consolidation: `01z-consolidation.md`.

Do not create subslice directories preemptively. The listed naming convention
only applies after a parent slice records why decomposition is needed.

Do not mark a parent task checked until the consolidation subslice has
confirmed the parent definition of done.

## Final Readiness Gate

Before calling the documentation set complete, verify that a fresh reader can
answer:

- What docs are live authority?
- What is the authority order?
- What does each live doc own?
- What does each live doc explicitly not own?
- What must not be inferred from current code?
- Where are proof and review expectations defined?
- Which terrain anchors are relevant but non-authoritative?
- Which work-dir artifacts are temporary?
- What should stop implementation or planning?

## Current Notes

- The default scope is thread-spawn subagents.
- Realtime `background_agent` handoff is resolved as a sibling Adapter doc.
- v2 is canonical for thread-spawn docs; v1 is a compatibility surface unless
  a task explicitly targets legacy collab behavior.
