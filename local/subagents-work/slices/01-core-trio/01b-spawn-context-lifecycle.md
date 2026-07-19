# 01b Spawn Context Lifecycle

## Goal

Fill the lifecycle doc for spawn modes, inherited context, validation,
resume, close, and depth/capacity behavior.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- Parent slice: `local/subagents-work/slices/01-core-trio.md`.

## Target Live Docs

- `local/subagents/spawn-context-lifecycle.md`
- `local/subagents/delegation-interface.md` only for caller-facing pointers.
- `local/subagents/runtime-architecture.md` only for Module ownership pointers.

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/resume_agent.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/close_agent.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify fresh, full-history, and partial-history spawn behavior.
3. Verify override, fork, depth, capacity, resume, and close rules.
4. Fill lifecycle core rule, owned behavior, and negative rules.
5. Keep exact tool-surface wording in `delegation-interface.md`.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md`
   cursor.

## Definition Of Done

- A reader can explain fresh, full-history, and partial-history spawn modes.
- A reader can explain accepted and rejected overrides by spawn mode.
- A reader can explain lifecycle behavior for resume and close.
- Runtime Module details are only included where needed to explain lifecycle
  ownership.

## Verification

- `rg -n "TODO|TBD" local/subagents/spawn-context-lifecycle.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
