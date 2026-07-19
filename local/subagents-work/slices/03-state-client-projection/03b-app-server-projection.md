# 03b App-Server Projection

## Goal

Fill app-server projection rules in `state-and-client-projection.md` as an
Adapter over persisted state and runtime events.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/state-and-client-projection.md`.
- Completed `03a` persisted-state rules.
- Parent slice: `local/subagents-work/slices/03-state-client-projection.md`.

## Target Live Docs

- `local/subagents/state-and-client-projection.md`
- `local/subagents/proof-and-readiness.md` only for app-server proof notes
  that should not stay in the state/projection doc.

## Terrain

- `codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/src/filters.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify `SessionSource`, `ThreadSourceKind`, and thread metadata projection.
3. Fill source-kind filtering for `SubAgentThreadSpawn` and related variants.
4. Fill thread read/list/search/loaded-list behavior only where it matters to
   thread-spawn projection.
5. Fill collab event and thread-history projection as downstream display data.
6. Keep app-server request/response shapes as Adapter behavior, not lifecycle
   authority.
7. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can explain how app-server identifies thread-spawn subagents.
- A reader can explain source-kind filtering versus interactive defaults.
- A reader can distinguish app-server thread/event projection from persisted
  graph ownership.
- App-server prose does not redefine spawn, close, resume, or mailbox rules.

## Verification

- `rg -n "TODO|TBD" local/subagents/state-and-client-projection.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
