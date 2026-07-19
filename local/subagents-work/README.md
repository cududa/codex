# Subagents Documentation Work Packet

This directory is retired operational scaffolding for the population pass that
created the live docs in `local/subagents/`.

The live docs live in `local/subagents/`. Files in this directory are work
notes, extraction queues, slice briefs, and decision tracking. They are not
behavior authority and should not remain part of the normal reader path once
the feature-area docs are complete.

Use this packet only for provenance or for deliberately reopening
documentation-population work. Normal readers should start in
`local/subagents/`.

## Use Order

This order applies only if the retired packet is deliberately reopened:

1. Read `local/subagents/AGENTS.md`.
2. Read `local/subagents/README.md`.
3. Open `tasks.md` and choose the next unchecked slice.
4. Read the matching `slices/*.md` brief.
5. Use `task-alignment` and emit a Direction Lock for the slice or subslice.
6. Extract facts into `concept-ledger.md` before drafting live prose.
7. Record scope or behavior questions in `open-decisions.md`.
8. Edit only the owning live docs in `local/subagents/`.
9. Return to `tasks.md` and update the slice status.

## File Roles

- `tasks.md`: executable queue and global completion checks.
- `slice-template.md`: template for adding or revising a bounded slice.
- `concept-ledger.md`: temporary extraction table for source-derived facts.
- `open-decisions.md`: unresolved decisions that should not be smoothed over.
- `slices/*.md`: bounded, agent-ready work briefs.

## Operating Rules

- Treat current code as terrain until a fact is written into an owning live doc.
- Use `task-alignment` for each slice or subslice before editing live docs.
- Keep one durable rule in one owning doc.
- Use `Module`, `Interface`, `Implementation`, `Seam`, `Adapter`, `Depth`,
  `Leverage`, and `Locality` deliberately.
- Prefer concise core rules in live docs over broad narrative summaries.
- Move proof-only facts to `proof-and-readiness.md` or leave them in the
  ledger until the proof pass.
- Keep realtime `background_agent` handoff as a sibling adapter unless
  `open-decisions.md` records a deliberate scope change.

## Slice Decomposition Checkpoint

Slices are intended to be executable in one focused pass. If a slice proves too
large or underspecified after sampling its target docs and terrain, decompose it
before drafting broad live prose.

Decomposition is allowed only when the agent can name the concrete reason the
parent slice is not feasible as written. Valid reasons include:

- the parent slice contains more than one real ownership seam;
- required terrain is much larger than the slice brief implied;
- an open decision blocks part of the slice but not all of it;
- one target doc can be drafted confidently while another would require
  hand-waving;
- proof or client projection work needs a separate pass to avoid mixing
  behavior authority with verification.

Do not decompose merely because the topic is complicated, the source tree has
many files, or smaller files feel tidier. Do not decompose by source-file list.
Decompose by ownership seam, reader job, or blocking decision.

A decomposed slice should use a child directory under `slices/`, for example:

```text
slices/
  01-core-trio.md
  01-core-trio/
    01a-delegation-interface.md
    01b-spawn-context-lifecycle.md
    01c-runtime-architecture.md
    01z-consolidation.md
```

Do not create subslice directories preemptively. Create them only when the
checkpoint has been reached and the parent slice records why decomposition is
needed.

The parent slice remains accountable for its original definition of done. The
final subslice should always be a consolidation pass that removes drift,
checks duplicated ownership, and confirms the parent slice can be marked
complete.

## Retirement Rule

This packet is outside the normal reader path. If it becomes distracting,
archive or remove it in a separate cleanup change; repository history is
enough for later provenance questions.
