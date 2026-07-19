## Navigation Header

- Role: Adapter doc for realtime delegation that resembles subagent
  delegation but does not create a thread-spawn subagent.
- Owns: The local relationship between realtime `background_agent` handoff and
  thread-spawn subagents documentation.
- Does not own: Thread-spawn spawn lifecycle, agent tree state, mailbox
  delivery between thread-spawn agents, or TUI subagent navigation.
- Primary pointers: `delegation-interface.md`,
  `communication-and-results.md`, `runtime-architecture.md`,
  `state-and-client-projection.md`.
- Fidelity note: Skeleton only; fill exact realtime behavior only if this
  adapter is deliberately included in scope.

## Core Rule

TODO: State whether realtime `background_agent` handoff remains a sibling
adapter doc or becomes part of a broader delegation documentation area.

## Owned Behavior To Fill

- Realtime v2 `background_agent` tool exposure.
- Handoff request parsing and transcript selection.
- `<realtime_delegation>` envelope construction.
- Active handoff progress, steering, completion, and acknowledgement behavior.
- App-server sideband projection for realtime handoff items.
- Relationship to thread-spawn subagents and explicit non-equivalence.

## Non-Ownership

This doc should not define thread-spawn subagent behavior. It should only
document realtime-specific delegation behavior and point back to thread-spawn
docs for actual subagent tree semantics.

## Terrain Anchors

- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/protocol_v2.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_common.rs`
- `codex-rs/core/src/realtime_conversation.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

## Proof Hooks To Fill

- Core realtime conversation tests for delegation envelope construction.
- App-server tests for realtime handoff projection.
- Realtime websocket tests for function-call output behavior.
