## Navigation Header

- Role: Lifecycle/interface doc for inter-agent communication and result
  ingestion.
- Owns: Message delivery modes, mailbox semantics, wait behavior, completion
  notification, and parent-visible result flow.
- Does not own: Spawn configuration, persisted thread graph rules, TUI layout,
  realtime handoff, or hook schemas.
- Primary pointers: `delegation-interface.md`, `spawn-context-lifecycle.md`,
  `runtime-architecture.md`, `state-and-client-projection.md`.
- Fidelity note: Skeleton only; fill behavior from the terrain anchors before
  relying on this as complete authority.

## Core Rule

TODO: State the canonical rule for how agents communicate, when communication
starts a turn, and how parents learn about child progress or completion.

## Owned Behavior To Fill

- `send_message` queue-only delivery.
- `followup_task` turn-triggering delivery.
- Root-target rules for messages and follow-up tasks.
- Mailbox wake and drain behavior.
- Wait timeout behavior and what wait does not return.
- Parent completion notification for v2 thread-spawn subagents.
- Legacy completion watcher behavior and why it is not the v2 owner.
- Environment context or notification fragments that expose subagent state to
  model context.

## Non-Ownership

This doc should not define how a subagent is spawned, how history is forked, or
how thread edges are persisted. Route those rules to the owning docs.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_v2/message_tool.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/context/environment_context.rs`
- `codex-rs/core/src/context/subagent_notification.rs`

## Proof Hooks To Fill

- Focused tests for v2 message delivery and wait behavior.
- Tests that distinguish result forwarding from wait output.
- Any app-server or TUI projection tests that prove downstream display without
  making those projections behavior authority.
