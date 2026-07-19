# Subagents Documentation

This directory is the feature-area documentation home for thread-spawned
subagents. The current files are a skeleton for future authority docs, not a
finished behavior reference.

## Reader Route

- Start with `AGENTS.md` for authority order, scope, and documentation posture.
- Use `CONTEXT.md` only for glossary terms.
- Read `delegation-interface.md` for model-facing tool exposure and caller
  obligations.
- Read `spawn-context-lifecycle.md` for fresh sessions, full-history forks,
  partial-history forks, spawn, resume, and close behavior.
- Read `runtime-architecture.md` for the core Modules and seams behind
  subagent execution.
- Read `communication-and-results.md` for inter-agent messaging, mailbox
  delivery, wait behavior, result ingestion, and parent notification.
- Read `state-and-client-projection.md` for persisted thread tree state,
  app-server projection, and TUI presentation.
- Read `hooks-and-integrations.md` for hook exposure and integration-specific
  non-ownership.
- Read `realtime-background-agent-handoff.md` when voice/realtime delegation is
  in scope.
- Read `proof-and-readiness.md` for validation posture, test anchors, and
  cold-reader readiness.

## Terrain Anchors

These files are useful terrain for future documentation passes. They do not
own behavior by themselves.

- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/state/migrations/0021_thread_spawn_edges.sql`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/hooks/src/schema.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/tui/src/multi_agents.rs`
- `codex-rs/core/src/realtime_conversation.rs`
- `codex-rs/codex-api/src/endpoint/realtime_websocket/`

## Open Scope Decision

Realtime `background_agent` handoff is related delegation terrain but not the
same Module as thread-spawned subagents. The default documentation shape is to
keep it in its own adapter doc unless a later pass deliberately widens the
feature area.
