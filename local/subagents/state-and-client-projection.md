## Navigation Header

- Role: Lifecycle/interface doc for persisted subagent state and downstream
  client projections.
- Owns: Thread-spawn edge persistence, thread metadata projection, app-server
  event/thread views, and TUI subagent presentation as downstream adapters.
- Does not own: Core spawn validation, mailbox delivery, hook schemas, or
  realtime handoff behavior.
- Primary pointers: `runtime-architecture.md`,
  `spawn-context-lifecycle.md`, `communication-and-results.md`,
  `proof-and-readiness.md`.
- Fidelity note: Skeleton only; fill state and projection rules from terrain
  before relying on this as complete authority.

## Core Rule

TODO: State how the durable thread-spawn graph is represented, which client
surfaces project it, and which projections are observers rather than behavior
owners.

## Owned Behavior To Fill

- `thread_spawn_edges` open/closed state.
- Direct child and descendant traversal.
- Resume/archival behavior that relies on persisted edges.
- Thread metadata fields for source, nickname, role, and path.
- App-server thread source filtering and event mapping.
- TUI history cells, agent picker rows, stable navigation order, and closed
  thread visibility.

## Non-Ownership

This doc should not define how a child is spawned or what messages it receives.
It should describe persisted state and client projection after core lifecycle
behavior has occurred.

## Terrain Anchors

- `codex-rs/state/migrations/0021_thread_spawn_edges.sql`
- `codex-rs/state/src/model/graph.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/state/src/model/thread_metadata.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/src/filters.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/tui/src/multi_agents.rs`
- `codex-rs/tui/src/app/agent_navigation.rs`
- `codex-rs/tui/src/app/session_lifecycle.rs`

## Proof Hooks To Fill

- State DB tests for edge insertion, update, descendants, and resume.
- App-server tests for thread source filtering and event projection.
- TUI snapshot tests for visible subagent presentation changes.
