# 04b Realtime Handoff Scope

## Goal

Resolve realtime scope and fill the realtime handoff sibling Adapter doc
without making realtime `background_agent` a thread-spawn subagent.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/realtime-background-agent-handoff.md`.
- `local/subagents/communication-and-results.md`.
- Parent slice: `local/subagents-work/slices/04-hooks-realtime.md`.

## Target Live Docs

- `local/subagents/realtime-background-agent-handoff.md`
- `local/subagents/proof-and-readiness.md` only for realtime proof notes that
  should not stay in the realtime doc.

## Terrain

- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/protocol_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_common.rs`
- `codex-rs/core/src/realtime_conversation.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Resolve realtime scope in `open-decisions.md`.
3. Verify v2 `background_agent` exposure and handoff parsing.
4. Fill handoff envelope, active-handoff state, output, completion, and
   acknowledgement behavior at Adapter level.
5. Fill explicit non-equivalence to thread-spawn subagents.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can explain why realtime `background_agent` is not a thread-spawn
  subagent.
- A reader can explain the local realtime handoff flow without reading
  websocket code.
- Realtime prose does not define thread-spawn lifecycle, tree state, mailbox,
  or TUI navigation behavior.

## Verification

- `rg -n "TODO|TBD" local/subagents/realtime-background-agent-handoff.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
