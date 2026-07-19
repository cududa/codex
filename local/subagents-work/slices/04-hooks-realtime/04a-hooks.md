# 04a Hooks

## Goal

Fill hook exposure authority for thread-spawn subagents without taking
ownership of realtime handoff.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/hooks-and-integrations.md`.
- `local/subagents/runtime-architecture.md`.
- Parent slice: `local/subagents-work/slices/04-hooks-realtime.md`.

## Target Live Docs

- `local/subagents/hooks-and-integrations.md`
- `local/subagents/proof-and-readiness.md` only for proof notes that should
  not stay in the hook doc.

## Terrain

- `codex-rs/hooks/src/schema.rs`
- `codex-rs/hooks/src/events/common.rs`
- `codex-rs/hooks/src/events/session_start.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/core/src/hook_runtime.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify `SubagentStart` and `SubagentStop` input shapes.
3. Verify normal hook requests that include subagent context during
   thread-spawn turns.
4. Fill thread-spawn lifecycle hook exposure and internal/synthetic subagent
   exclusions.
5. Keep realtime handoff out of this doc except as explicit non-ownership.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can explain when `SubagentStart` runs.
- A reader can explain when `SubagentStop` runs.
- A reader can explain which normal hook requests carry subagent context.
- A reader can explain why internal/synthetic subagent sessions do not expose
  user-configured lifecycle hooks.

## Verification

- `rg -n "TODO|TBD" local/subagents/hooks-and-integrations.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
