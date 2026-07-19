# 01a Delegation Interface

## Goal

Fill the model-facing Interface doc for thread-spawn subagents without taking
ownership of spawn lifecycle or runtime Implementation.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/delegation-interface.md`.
- Parent slice: `local/subagents-work/slices/01-core-trio.md`.

## Target Live Docs

- `local/subagents/delegation-interface.md`
- `local/subagents/spawn-context-lifecycle.md` only for short pointers if
  Interface wording would otherwise duplicate lifecycle rules.
- `local/subagents/runtime-architecture.md` only for short pointers if
  Interface wording would otherwise duplicate runtime Module rules.

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/`
- `codex-rs/core/src/tools/handlers/multi_agents/`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify exact v2 tool names, parameters, and output commitments.
3. Resolve or default the v1 compatibility posture in `open-decisions.md`.
4. Fill the Interface core rule, owned behavior, and negative rules.
5. Keep fork mechanics and runtime inheritance as pointers to owning docs.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md`
   cursor.

## Definition Of Done

- A reader can name the v2 model-facing Interface.
- A reader can explain how v1 relates to v2.
- A reader can identify caller obligations for task naming, addressing, usage
  hints, and unsupported legacy shapes.
- Lifecycle and runtime rules are not duplicated here.

## Verification

- `rg -n "TODO|TBD" local/subagents/delegation-interface.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
