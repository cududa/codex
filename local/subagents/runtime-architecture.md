## Navigation Header

- Role: Architecture doc for the core Modules and seams that execute
  thread-spawn subagents.
- Owns: `AgentControl`, `AgentRegistry`, session source identity, agent path
  ownership, runtime inheritance, and internal seams used by tool handlers.
- Does not own: Agent-facing tool wording, hook schemas, client rendering,
  realtime handoff, or proof matrix ownership.
- Primary pointers: `delegation-interface.md`,
  `spawn-context-lifecycle.md`, `communication-and-results.md`,
  `state-and-client-projection.md`.
- Fidelity note: Skeleton only; fill Module/Interface descriptions from
  terrain before relying on this as complete authority.

## Core Rule

TODO: State the deep Module shape: model-facing handlers should stay thin, and
core subagent behavior should concentrate behind `AgentControl` and
`AgentRegistry` seams where possible.

## Owned Behavior To Fill

- `AgentControl` as the runtime Module behind spawn, fork, resume, send,
  close, list, and completion forwarding.
- `AgentRegistry` as live tree, capacity, metadata, and path reservation
  owner.
- `SessionSource::SubAgent(ThreadSpawn)` as identity and metadata carrier.
- Runtime inheritance of cwd, sandbox, approval, environment, model provider,
  and shell snapshot.
- Adapter roles for tool handlers, app-server, hooks, and TUI.
- Depth and locality expectations for future subagent changes.

## Non-Ownership

This doc should not restate every tool parameter or every persisted table
field. It should explain which Module owns behavior and route seam-specific
details elsewhere.

## Terrain Anchors

- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`
- `codex-rs/core/src/agent/agent_resolver.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/session/mod.rs`

## Proof Hooks To Fill

- Unit tests around `AgentControl` behavior.
- Tests that prove handlers stay as Adapters over the core Module.
- Tests for registry capacity, path resolution, and metadata behavior.
