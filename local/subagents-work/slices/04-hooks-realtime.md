# 04 Hooks And Realtime

## Goal

Fill hook integration authority and decide how far to populate realtime
background-agent handoff as a sibling adapter doc.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/hooks-and-integrations.md`.
- `local/subagents/realtime-background-agent-handoff.md`.
- `local/subagents/runtime-architecture.md`.

## Target Live Docs

- `local/subagents/hooks-and-integrations.md`
- `local/subagents/realtime-background-agent-handoff.md`
- `local/subagents/proof-and-readiness.md` only for proof notes that should not
  stay in integration docs.

## Terrain

- `codex-rs/hooks/src/schema.rs`
- `codex-rs/hooks/src/events/common.rs`
- `codex-rs/hooks/src/events/session_start.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/protocol_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_common.rs`
- `codex-rs/core/src/realtime_conversation.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

## Decomposition Checkpoint

Do not create subslices upfront. Decompose only if hooks and realtime handoff
need different proof paths or if realtime scope needs explicit decision work
before prose.

Likely subslices:

- `04a-hooks.md`: `SubagentStart`, `SubagentStop`, and hook context.
- `04b-realtime-handoff-scope.md`: realtime sibling Adapter scope and
  non-equivalence to thread-spawn subagents.
- `04z-consolidation.md`: integration docs do not redefine core lifecycle.

## Work Steps

1. Read the target integration docs and runtime architecture doc.
2. Extract hook and realtime facts into `concept-ledger.md`.
3. Resolve or reaffirm realtime scope in `open-decisions.md`.
4. Fill `SubagentStart`, `SubagentStop`, and normal hook context behavior.
5. Document internal/synthetic subagent hook exclusions.
6. If realtime stays in scope as sibling adapter, fill only the non-equivalence
   and handoff flow needed for subagents readers.
7. Route deeper realtime behavior out of thread-spawn subagents unless the
   scope decision changes.
8. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- A reader can explain which thread-spawn lifecycle events hooks observe.
- A reader can explain which internal subagent variants do not expose those
  hooks.
- A reader can explain why realtime `background_agent` is not a thread-spawn
  subagent.
- Any widened realtime scope is explicit in `open-decisions.md` and the owning
  live doc.

## Verification

- `rg -n "TODO|TBD" local/subagents/hooks-and-integrations.md local/subagents/realtime-background-agent-handoff.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
