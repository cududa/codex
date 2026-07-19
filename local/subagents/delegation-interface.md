## Navigation Header

- Role: Behavior authority skeleton for the model-facing subagent Interface.
- Owns: Tool exposure, caller-facing parameters, addressing forms, usage
  hints, v1/v2 compatibility posture, and negative rules visible to agents.
- Does not own: Runtime fork Implementation, state persistence, hook payloads,
  client rendering, or realtime background-agent handoff.
- Primary pointers: `spawn-context-lifecycle.md`,
  `communication-and-results.md`, `runtime-architecture.md`,
  `proof-and-readiness.md`.
- Fidelity note: Skeleton only; fill exact tool semantics from terrain before
  relying on this as complete authority.

## Core Rule

TODO: State the canonical agent-facing Interface for thread-spawn subagents:
which tools exist, when agents should use them, what callers must provide, and
which legacy shapes are intentionally rejected.

## Owned Behavior To Fill

- v2 tool set: `spawn_agent`, `send_message`, `followup_task`, `wait_agent`,
  `list_agents`, and `close_agent`.
- Optional namespace exposure for v2 tools.
- v1 compatibility surface and when v1 remains relevant.
- `task_name`, agent path, nickname, role, and target addressing rules.
- Tool exposure through feature config and non-code-mode-only settings.
- Usage hint text for root agents and subagents.
- Error messages for legacy or unsupported caller shapes.

## Non-Ownership

This doc should not explain how forked history is assembled, how mail is
delivered, or how clients render tool calls except by pointing to the owning
docs.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/`
- `codex-rs/core/src/tools/handlers/multi_agents/`

## Proof Hooks To Fill

- Tests for v2 tool schema and rejected legacy parameters.
- Tests for namespace exposure and feature-gated tool planning.
- Tests for target resolution that matters to the Interface.
