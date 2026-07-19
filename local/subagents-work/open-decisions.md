# Open Decisions

This file tracks decisions that should not be silently resolved by source
shape. Each item should say what it blocks and which slice owns resolution.

If a slice is decomposed because a decision blocks only part of the work, keep
the decision here and name the subslice that owns resolution. Do not create a
second decision tracker inside a subslice directory.

## Decision States

- `open`: needs user or reviewer decision.
- `defaulted`: a default direction exists, but final prose should still name
  the choice.
- `resolved`: decision has been recorded in the owning live doc.

## Realtime Scope

- State: defaulted.
- Slice: `slices/04-hooks-realtime.md`.
- Question: Is realtime `background_agent` handoff part of subagents authority
  or only a sibling adapter doc?
- Default: Keep it as a sibling adapter doc.
- Blocks: Comprehensive realtime prose. Does not block thread-spawn subagents
  docs.
- Owning live doc: `local/subagents/realtime-background-agent-handoff.md`.

## v1 Compatibility Posture

- State: open.
- Slice: `slices/01-core-trio.md`.
- Question: Should v1 multi-agent tools be documented as compatibility terrain,
  historical behavior, or active parallel Interface?
- Default: Treat v2 as canonical and v1 as compatibility surface unless terrain
  or user intent says otherwise.
- Blocks: Final wording in `delegation-interface.md` and
  `spawn-context-lifecycle.md`.
- Owning live doc: `local/subagents/delegation-interface.md`.

## Canonical Result Semantics

- State: open.
- Slice: `slices/02-communication-results.md`.
- Question: Which result delivery path should be considered the canonical v2
  parent-visible completion behavior, and which legacy watcher behavior should
  be documented only as compatibility terrain?
- Default: Treat v2 parent completion forwarding as canonical for v2
  thread-spawn subagents.
- Blocks: Final wording in `communication-and-results.md`.
- Owning live doc: `local/subagents/communication-and-results.md`.

## Client Projection Authority

- State: defaulted.
- Slice: `slices/03-state-client-projection.md`.
- Question: How much app-server and TUI detail belongs in the state/projection
  doc before it becomes client-specific behavior authority?
- Default: Document persisted state and projection roles; keep rendering layout
  specifics as terrain or proof unless a client seam requires authority.
- Blocks: Amount of TUI/app-server prose in
  `state-and-client-projection.md`.
- Owning live doc: `local/subagents/state-and-client-projection.md`.
