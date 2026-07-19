## Navigation Header

- Role: Behavior authority skeleton for spawn modes and thread-spawn lifecycle.
- Owns: Fresh session, full-history fork, partial-history fork, spawn
  validation, inherited runtime settings, resume, close, and depth/capacity
  rules.
- Does not own: Tool exposure wording, mailbox delivery, app-server/TUI
  rendering, hook payloads, or realtime handoff.
- Primary pointers: `delegation-interface.md`, `runtime-architecture.md`,
  `communication-and-results.md`, `state-and-client-projection.md`.
- Fidelity note: Skeleton only; fill exact lifecycle rules from terrain before
  relying on this as complete authority.

## Core Rule

TODO: State the canonical lifecycle rule for how a thread-spawn subagent is
created, what context it receives, what it may override, how it resumes, and
how it closes.

## Owned Behavior To Fill

- Fresh session behavior.
- Full-history fork behavior.
- Partial-history fork behavior.
- v1 `fork_context` compatibility and v2 `fork_turns` ownership.
- Role, model, reasoning, service tier, and runtime override rules.
- Rejection rules for full-history forks with role/model/reasoning overrides.
- Depth and concurrency limits, including v1/v2 differences.
- Resume from rollout and descendant reopening.
- Close behavior for a child and its live subtree.
- What history items are preserved or filtered in a fork.

## Non-Ownership

This doc should not decide how messages are delivered after spawn, how clients
present subagents, or how realtime handoff works.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/spawn.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_common.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/agent/registry.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/resume_agent.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/close_agent.rs`

## Proof Hooks To Fill

- Tests for fresh, full-history, and partial-history spawn modes.
- Tests for override rejection and accepted override cases.
- Tests for v1 depth limits and v2 concurrency behavior.
- Tests for resume and close tree behavior.
