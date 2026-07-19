## Navigation Header

- Role: Runtime architecture doc for the core Modules and seams that execute
  thread-spawn subagents.
- Owns: `AgentControl`, `AgentRegistry`, session source identity, agent path
  ownership, runtime inheritance, and internal seams used by tool handlers.
- Does not own: Agent-facing tool wording, hook schemas, client rendering,
  realtime handoff, or proof matrix ownership.
- Primary pointers: `delegation-interface.md`,
  `spawn-context-lifecycle.md`, `communication-and-results.md`,
  `state-and-client-projection.md`.
- Fidelity note: Populated authority doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

Thread-spawn subagents should remain a deep runtime Module behind a small
agent-facing Interface. Model-facing handlers adapt caller input into runtime
requests; they should not own the full lifecycle, live tree, persistence, or
cross-thread communication mechanics.

`AgentControl` is the primary runtime Module for thread-spawn execution.
`AgentRegistry` is the live tree and capacity Module shared by agents in the
same user session. `SessionSource::SubAgent(ThreadSpawn)` is the runtime
identity shape that lets tool handlers, sessions, persistence, hooks, and
clients agree that a thread is a thread-spawn subagent.

## Runtime Modules

`AgentControl` owns runtime orchestration for spawning, forking, resuming,
sending input, sending inter-agent communication, interrupting, closing,
listing, status subscription, completion notification, and environment-context
formatting. Its Interface is intentionally broader than any single model-facing
tool because it hides the ThreadManager, state DB, shell snapshot, exec policy,
and registry coordination behind one runtime seam.

`AgentRegistry` owns the live in-memory agent tree. It tracks thread ids,
agent paths, nicknames, roles, last-task messages, root registration, spawned
thread counts, and path/nickname reservations. Spawn capacity is enforced at
reservation time so failed spawns can release the reserved slot and successful
spawns can commit metadata once a thread id exists.

`AgentPath` and `SessionSource::SubAgent(ThreadSpawn)` connect the two
Modules. Tool handlers request a task name or target reference, but runtime
path construction and resolution happen through the shared helper and
`AgentControl`/`AgentRegistry` state.

## Spawn Execution Shape

Tool handlers build the child config and `SessionSource`, then call
`AgentControl::spawn_agent_with_metadata`. From that point the runtime Module
owns the concrete spawn path:

- reserve a spawn slot;
- inherit parent shell snapshot and exec policy when the source is a
  thread-spawn subagent;
- prepare thread-spawn metadata, path, nickname, role, and depth;
- choose forked-thread creation or fresh thread creation;
- emit subagent session analytics;
- notify listeners that a new thread exists;
- persist the thread-spawn edge when state persistence is available;
- send the initial operation to the child;
- attach legacy completion watching only when the child is not using
  MultiAgentV2.

The lifecycle meaning of fresh, full-history, and partial-history spawn modes
is owned by `spawn-context-lifecycle.md`. This doc owns where that behavior is
implemented and which Module should remain the runtime seam.

## Identity And Paths

Thread-spawn identity is represented as:

- parent thread id;
- child depth;
- optional agent path;
- optional user-facing nickname;
- optional agent role.

Depth is computed from the spawning session source. At depth one, the parent
thread is registered as `/root` in the live registry. When a task name is
provided, the child path is derived by joining it to the spawning agent's path,
or to `/root` when the parent has no thread-spawn path.

Tool-facing target strings are adapted by `agent_resolver`: a target that
parses as a thread id resolves directly; otherwise the current agent path is
used to resolve a relative or canonical task reference through `AgentControl`.

## Runtime Inheritance

Runtime inheritance crosses the `AgentControl` seam. Thread-spawn children can
inherit the parent shell snapshot and exec policy from the parent thread. Spawn
and resume config construction also refreshes runtime-owned turn state before
the child thread is created, including model/provider selection, reasoning,
developer instructions, compact prompt, approval policy, sandbox settings, cwd,
permission profile, and selected environments.

`spawn-context-lifecycle.md` owns which inheritance and override combinations
are valid. This doc owns the runtime locality rule: config, shell, exec policy,
path, and metadata inheritance should remain concentrated behind the
`AgentControl`/`AgentRegistry` seam instead of being reimplemented in handlers.

## Adapter Roles

Model-facing multi-agent handlers are Adapters. They parse tool arguments,
perform caller-facing validation, emit collab lifecycle events, and call the
runtime Module. They should stay thin enough that future lifecycle changes do
not require parallel edits across v1, v2, and client projection code.

`agent_resolver` is an Adapter from model-facing target strings to runtime
thread ids.

App-server, TUI, hooks, and realtime handoff are downstream or sibling
Adapters. They may observe, render, or route subagent-related state, but they
do not own the core runtime lifecycle of thread-spawn subagents.

## Persistence And Notification

`AgentControl` is the runtime placement for persistence calls tied to
thread-spawn execution. It inserts thread-spawn edges from session source
metadata when state persistence is available, consults persisted open edges
during resume, and marks an incoming edge closed before live subtree shutdown.

Lifecycle meaning for resume and close is owned by
`spawn-context-lifecycle.md`. Durable graph shape and open/closed state
semantics are owned by `state-and-client-projection.md`.

MultiAgentV2 child completion forwarding is coordinated through session
runtime and `AgentControl::send_inter_agent_communication`. The communication
and result-ingestion semantics are owned by `communication-and-results.md`;
this doc owns only the runtime placement of the send operation.

## Depth, Leverage, And Locality

Future thread-spawn changes should prefer deepening the existing runtime
Modules over adding pass-through plumbing. A change belongs near
`AgentControl` or `AgentRegistry` when it affects spawn identity, live tree
state, runtime inheritance, path resolution, capacity, resume, close, or
cross-thread runtime coordination.

Handlers are the right seam only when the change is genuinely caller-facing:
tool names, tool parameters, tool output shape, model-visible errors, or collab
tool events.

## Owned Behavior

This doc currently owns:

- `AgentControl` as the runtime Module behind spawn, fork, resume, send,
  close, list, and completion forwarding placement;
- `AgentRegistry` as live tree, capacity, metadata, nickname, and path
  reservation owner;
- `SessionSource::SubAgent(ThreadSpawn)` as identity and metadata carrier;
- runtime inheritance placement for config, shell snapshot, exec policy, cwd,
  sandbox, approval, and selected environments;
- Adapter roles for tool handlers, app-server, hooks, TUI, and realtime
  handoff;
- Depth, Leverage, and Locality expectations for future subagent changes.

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

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- `AgentControl` behavior;
- handlers staying as Adapters over the core Module;
- registry capacity, path resolution, and metadata behavior.
