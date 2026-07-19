# 03a Persisted Thread Tree

## Goal

Fill persisted thread-spawn graph and metadata rules in
`state-and-client-projection.md` without taking ownership of app-server or TUI
presentation details.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/state-and-client-projection.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- `local/subagents/runtime-architecture.md`.
- Parent slice: `local/subagents-work/slices/03-state-client-projection.md`.

## Target Live Docs

- `local/subagents/state-and-client-projection.md`
- `local/subagents/spawn-context-lifecycle.md` only for short pointers if
  resume or close wording would otherwise duplicate lifecycle rules.
- `local/subagents/proof-and-readiness.md` only for proof notes that should
  not stay in the state/projection doc.

## Terrain

- `codex-rs/state/migrations/0021_thread_spawn_edges.sql`
- `codex-rs/state/src/model/graph.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/state/src/model/thread_metadata.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs` only for
  archive behavior that depends on persisted descendants.

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify the `thread_spawn_edges` schema and edge status model.
3. Fill open/closed edge behavior, direct child traversal, descendant
   traversal, and stable descendant order.
4. Fill metadata fields that identify thread-spawn subagents: source,
   nickname, role, and path.
5. Route resume and close lifecycle meaning to `spawn-context-lifecycle.md`
   while documenting the persisted state those lifecycle paths use.
6. Decide how much archive behavior belongs in the state/projection doc.
7. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can explain the durable thread-spawn graph.
- A reader can explain open versus closed edge state.
- A reader can identify direct child and descendant traversal rules.
- A reader can identify the metadata fields that mark a thread-spawn subagent.
- App-server and TUI projection details remain for later subslices.

## Verification

- `rg -n "TODO|TBD" local/subagents/state-and-client-projection.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
