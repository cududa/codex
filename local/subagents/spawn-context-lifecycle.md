## Navigation Header

- Role: Behavior authority doc for spawn modes and thread-spawn lifecycle.
- Owns: Fresh session, full-history fork, partial-history fork, spawn
  validation, inherited runtime settings, resume, close, and depth/capacity
  rules.
- Does not own: Tool exposure wording, mailbox delivery, app-server/TUI
  rendering, hook payloads, or realtime handoff.
- Primary pointers: `delegation-interface.md`, `runtime-architecture.md`,
  `communication-and-results.md`, `state-and-client-projection.md`.
- Fidelity note: Populated authority doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

Thread-spawn lifecycle authority starts when a model-facing spawn request has
been accepted and ends when the spawned agent is closed, resumed, or handed to
communication/result-ingestion seams. This doc owns which context the child
receives, which overrides are valid by spawn mode, how v1 and v2 lifecycle
rules differ, and what close/resume mean for the thread-spawn tree.

The caller-facing tool names and parameters are owned by
`delegation-interface.md`. The runtime Modules that implement these rules are
owned by `runtime-architecture.md`.

## Spawn Modes

Fresh session spawn creates a thread-spawn subagent without forking parent
rollout history. In v2 this is requested with `fork_turns = "none"`. In v1
this is the default when `fork_context` is false. A fresh child still receives
the inherited runtime/configuration snapshot described below; it simply starts
without parent thread history.

Full-history fork creates the child from a forked copy of parent stored
history. In v2 this is requested with `fork_turns = "all"` and is the v2
default when `fork_turns` is omitted or empty. In v1 this is requested with
`fork_context = true`.

Partial-history fork is v2-only and is requested with a positive integer
string in `fork_turns`, such as `"3"`. It forks only the recent parent turns
selected by the rollout truncation logic. Partial-history forks are not the
same as full-history forks with a shorter prompt: they intentionally drop
reference-context items that only full-history forks can preserve.

Invalid v2 `fork_turns` values are rejected. Valid values are `none`, `all`,
or a positive integer string.

## Inherited Context And Runtime Settings

All thread-spawn subagents start from the spawning turn's effective
configuration, not from a stale static config file. Spawn config construction
refreshes the child model/provider selection, reasoning settings, developer
instructions, compact prompt, approval policy, shell environment policy,
sandbox executable, cwd, permission profile, and selected environments from
the live turn.

Role, model, reasoning, and service-tier overrides are then applied according
to spawn mode. Runtime ownership of the config snapshot and shell/exec policy
inheritance belongs to `runtime-architecture.md`; this doc owns only the
lifecycle-level rule that children inherit the live parent turn's execution
posture unless a valid spawn override changes it.

## Override Rules

Full-history forks inherit the parent agent type, model, and reasoning effort.
Callers must omit `agent_type`, `model`, and `reasoning_effort` for a
full-history fork. If any of those fields are present, spawn is rejected before
the child is created.

Fresh and partial-history spawns may request `agent_type`, `model`, and
`reasoning_effort` overrides. Model and reasoning overrides are validated
against the model manager, and role overrides are applied to the child config
before spawn.

`service_tier` is validated separately against the selected child model. When
no service tier is requested or inherited, the child service tier is unset.

## Forked History Filtering

Before a forked child is created, the parent rollout is flushed so the fork can
read durable parent history. Full-history and partial-history forks both
filter the parent rollout before it becomes child history.

Forked history keeps system, developer, user, and final assistant messages. It
drops non-final assistant chatter, reasoning items, tool calls, tool outputs,
web/image/custom tool activity, compaction triggers, and other transient
response items. Compacted history and session metadata remain durable rollout
items, with MultiAgentV2 usage-hint messages filtered out where needed.

Only full-history forks preserve the reference-context item used for durable
baseline/diff context. Full-history MultiAgentV2 children also receive the
child subagent usage hint when configured.

## Depth And Capacity

V1 lifecycle rules enforce `agent_max_depth`. A v1 spawn or resume whose child
depth would exceed the configured max depth is rejected with an instruction to
solve the task locally. A v1 child created at the configured max depth is
allowed, but further collaboration/spawn capability is disabled for that child
by lifecycle config overrides.

V2 lifecycle rules do not use `agent_max_depth` as the spawn limit. When
MultiAgentV2 is enabled, `agents.max_threads` is rejected by config validation
and the effective spawned-agent capacity comes from
`features.multi_agent_v2.max_concurrent_threads_per_session`, with the root
thread counted in that configured limit.

The live spawned-thread count is enforced by `AgentRegistry`, which is shared
across agents in the same user session.

## Resume

Resume is exposed only by the v1 compatibility Interface. A v1 resume targets
an agent id. If the target is already live, resume returns its current status.
If the target is not live, runtime attempts to resume it from stored rollout
history.

Resuming a thread-spawn agent also reopens persisted descendants whose
thread-spawn edges are still open. Descendants explicitly closed through
`close_agent` are not reopened by resuming an ancestor.

Resume uses the live parent turn's runtime/configuration posture, but keeps
base instructions sourced from the resumed rollout/session metadata rather
than replacing them with the current parent's base instructions.

## Close

Closing a thread-spawn agent marks the target's incoming thread-spawn edge as
closed when state persistence is available, then shuts down the live target and
any live descendants reachable from the in-memory spawn tree.

Close returns the target's previous status before shutdown was requested. The
v2 Interface rejects attempts to close the root agent because the root is not a
spawned agent.

Closing an ancestor does not make its explicitly closed subtree eligible for
automatic reopening; persisted open/closed edge behavior is owned in more
detail by `state-and-client-projection.md`.

## Owned Behavior

This doc currently owns:

- fresh session, full-history fork, and partial-history fork behavior;
- v1 `fork_context` and v2 `fork_turns` lifecycle meaning;
- accepted and rejected spawn overrides by spawn mode;
- lifecycle-level runtime inheritance rules;
- forked history filtering rules;
- v1 depth behavior and v2 capacity behavior;
- resume from rollout and descendant reopening;
- close behavior for a target and its live subtree.

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

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- fresh, full-history, and partial-history spawn modes;
- override rejection and accepted override cases;
- v1 depth limits and v2 concurrency behavior;
- resume and close tree behavior.
