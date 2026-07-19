## Navigation Header

- Role: Integration doc for hooks and other surfaces that observe or annotate
  thread-spawn subagents.
- Owns: Hook exposure, hook context fields, and integration-specific
  non-ownership rules.
- Does not own: Core spawn lifecycle, inter-agent communication, client
  rendering, or realtime handoff behavior.
- Primary pointers: `runtime-architecture.md`,
  `spawn-context-lifecycle.md`, `state-and-client-projection.md`,
  `proof-and-readiness.md`.
- Fidelity note: Skeleton only; fill exact hook semantics from terrain before
  relying on this as complete authority.

## Core Rule

TODO: State which thread-spawn subagent lifecycle events are exposed to hooks
and which internal subagent variants are intentionally not exposed.

## Owned Behavior To Fill

- `SubagentStart` input shape and matching behavior.
- `SubagentStop` input shape and matching behavior.
- Normal hook context fields for turns running inside thread-spawn subagents.
- Parent transcript path versus agent transcript path ownership.
- Internal/synthetic subagent variants that do not run user-configured
  lifecycle hooks.

## Non-Ownership

This doc should not define when an agent is spawned or closed. It should only
define what hook and integration surfaces observe after core lifecycle
behavior has selected the thread-spawn path.

## Terrain Anchors

- `codex-rs/hooks/src/schema.rs`
- `codex-rs/hooks/src/events/common.rs`
- `codex-rs/hooks/src/events/session_start.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/core/src/hook_runtime.rs`

## Proof Hooks To Fill

- Hook schema tests or snapshots that prove thread-spawn fields.
- Runtime tests that distinguish thread-spawn hooks from internal subagent
  sessions.
