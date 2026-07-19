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
- Fidelity note: Populated authority doc; realtime handoff remains outside
  this doc and broad proof posture lives in `proof-and-readiness.md`.

## Core Rule

Only thread-spawn subagents expose the subagent lifecycle hook events in this
doc. A thread-spawn child startup runs `SubagentStart`; a thread-spawn child
turn stop runs `SubagentStop`; ordinary hook requests running inside a
thread-spawn child can carry subagent context fields.

Internal and synthetic subagent sessions do not expose user-configured
subagent lifecycle hooks. Treat them as related terrain unless their behavior
is explicitly documented by their own owning seam.

## Lifecycle Hook Exposure

`SubagentStart` and `SubagentStop` are hook Adapter surfaces over the
thread-spawn lifecycle. They observe runtime-selected thread-spawn starts and
stops; they do not decide when an agent is spawned, forked, resumed, closed,
or listed.

Hook handler matching for both lifecycle events uses `agent_type` as the
matcher input. `agent_type` is the child role when one is present, otherwise
the default agent role name. `agent_id` is the child thread id.

## `SubagentStart`

`SubagentStart` runs when pending session-start hook work is dispatched for a
new thread-spawn child at startup. The input includes:

- `session_id`
- `turn_id`
- `transcript_path`
- `cwd`
- `hook_event_name: "SubagentStart"`
- `model`
- `permission_mode`
- `agent_id`
- `agent_type`

`SubagentStart` shares the `SessionStart` output shape for warning and
additional-context handling, but it is context-injection only. Plain stdout can
become additional model context. JSON output can provide
`hookSpecificOutput.additionalContext`. `continue:false` and `stopReason` do
not stop the child startup for `SubagentStart`; only `SessionStart` honors that
stop behavior.

## `SubagentStop`

`SubagentStop` runs for a thread-spawn child turn stop. The input includes:

- `session_id`
- `turn_id`
- `transcript_path`
- `agent_transcript_path`
- `cwd`
- `hook_event_name: "SubagentStop"`
- `model`
- `permission_mode`
- `stop_hook_active`
- `agent_id`
- `agent_type`
- `last_assistant_message`

`SubagentStop` follows stop-style output semantics. `continue:false` can stop
processing and record a stop reason. `decision:"block"` can block with a
continuation prompt when paired with a non-empty `reason`; exit code `2` can
also block when stderr contains the continuation prompt. A block without a
non-empty reason is invalid. This is hook control over the child turn stop; it
is not close semantics and does not redefine the thread-spawn lifecycle.

## Transcript Paths

For `SubagentStop`, `agent_transcript_path` points to the child agent
transcript. `transcript_path` points to the parent transcript when runtime can
resolve the parent thread. If parent transcript lookup fails, `transcript_path`
can be null while `agent_transcript_path` still comes from the child session.

For `SubagentStart` and normal hooks running inside the child,
`transcript_path` is the active child session transcript path.

## Normal Hook Context

Normal hook requests that run inside a thread-spawn subagent can include
optional flat subagent context fields:

- `agent_id`
- `agent_type`

Those fields are omitted for root turns and for non-thread-spawn session
sources. They are available on these hook input shapes when the request runs
inside a thread-spawn child:

- `PreToolUse`
- `PermissionRequest`
- `PostToolUse`
- `UserPromptSubmit`
- `PreCompact`
- `PostCompact`

Normal hook context identifies where the hook ran. It does not make those hook
events lifecycle owners for thread-spawn behavior.

## Internal And Synthetic Exclusions

Only `SessionSource::SubAgent(ThreadSpawn)` maps to the subagent hook exposure
documented here. Other subagent sources are internal or synthetic work and do
not dispatch `SubagentStart` or `SubagentStop` as user-configured lifecycle
hooks.

Do not infer lifecycle hook parity from shared names, shared hook runtime
helpers, or nearby hook schema fields. The thread-spawn identity shape is the
criterion for this doc.

## Non-Ownership

This doc should not define when an agent is spawned or closed. It should only
define what hook and integration surfaces observe after core lifecycle
behavior has selected the thread-spawn path.

This doc does not own realtime `background_agent` handoff behavior. Realtime is
a sibling Adapter. Future scope changes must first be recorded in
`open-decisions.md` and then moved into the owning live doc.

## Terrain Anchors

- `codex-rs/hooks/src/schema.rs`
- `codex-rs/hooks/src/events/common.rs`
- `codex-rs/hooks/src/events/session_start.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/core/src/hook_runtime.rs`

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- hook schema fixtures and schema tests for `SubagentStart`, `SubagentStop`,
  and optional normal-hook `agent_id`/`agent_type` fields;
- runtime dispatch distinction between thread-spawn lifecycle hooks and
  internal or synthetic subagent sessions;
- `SubagentStart` context-injection-only behavior;
- `SubagentStop` block, stop, and invalid-output semantics.
