# 01 Core Trio

## Goal

Fill the first authoritative pass for the model-facing Interface, spawn/context
lifecycle, and runtime Module architecture.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/delegation-interface.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- `local/subagents/runtime-architecture.md`.

## Target Live Docs

- `local/subagents/delegation-interface.md`
- `local/subagents/spawn-context-lifecycle.md`
- `local/subagents/runtime-architecture.md`

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/close_agent.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/resume_agent.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`
- `codex-rs/core/src/agent/agent_resolver.rs`
- `codex-rs/protocol/src/protocol.rs`

## Decomposition Checkpoint

This is the most likely slice to decompose, but do not create subslices
upfront. Decompose only if the Interface, lifecycle, and runtime Module docs
cannot be filled coherently in one pass after terrain sampling.

Likely subslices:

- `01a-delegation-interface.md`: model-facing tools and caller obligations.
- `01b-spawn-context-lifecycle.md`: fresh, full-history, and partial-history
  spawn behavior.
- `01c-runtime-architecture.md`: `AgentControl`, `AgentRegistry`, and Adapter
  roles.
- `01z-consolidation.md`: cross-doc ownership and parent definition of done.

The parent slice remains incomplete until `01z-consolidation.md` confirms the
three docs agree.

## Work Steps

1. Read the three target docs and their navigation headers.
2. Extract tool, spawn, and runtime facts into `concept-ledger.md`.
3. Sort facts by owning doc.
4. Resolve or record the v1 compatibility posture.
5. Draft concise core rules for each target doc.
6. Fill owned behavior and negative rules.
7. Keep proof details out unless local to the seam.
8. Update cross-doc pointers only where needed.
9. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- A reader can name the v2 model-facing Interface and how v1 relates to it.
- A reader can explain fresh, full-history, and partial-history spawn modes.
- A reader can explain which overrides are accepted or rejected by spawn mode.
- A reader can identify `AgentControl` and `AgentRegistry` as core runtime
  Modules.
- Tool handlers are described as Adapters where that is the intended seam.
- No durable rule is owned by more than one target doc.

## Verification

- `rg -n "TODO|TBD" local/subagents/delegation-interface.md local/subagents/spawn-context-lifecycle.md local/subagents/runtime-architecture.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
