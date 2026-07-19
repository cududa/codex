# 01c Runtime Architecture

## Goal

Fill the runtime architecture doc for the core Modules and seams behind
thread-spawn subagents.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/runtime-architecture.md`.
- Parent slice: `local/subagents-work/slices/01-core-trio.md`.

## Target Live Docs

- `local/subagents/runtime-architecture.md`
- `local/subagents/delegation-interface.md` only for Interface pointers.
- `local/subagents/spawn-context-lifecycle.md` only for lifecycle pointers.

## Terrain

- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`
- `codex-rs/core/src/agent/agent_resolver.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/session/mod.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Describe `AgentControl` as the runtime Module.
3. Describe `AgentRegistry` as the live tree and metadata Module.
4. Describe session source identity, path ownership, and Adapter roles.
5. Keep tool parameters and lifecycle rules as pointers to owning docs.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md`
   cursor.

## Definition Of Done

- A reader can identify the runtime Modules and their Interfaces.
- A reader can explain which seams handlers and downstream projections cross.
- Runtime inheritance is placed without duplicating lifecycle rules.
- The doc uses codebase-design vocabulary deliberately.

## Verification

- `rg -n "TODO|TBD" local/subagents/runtime-architecture.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
