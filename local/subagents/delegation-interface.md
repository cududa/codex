## Navigation Header

- Role: Behavior authority doc for the model-facing subagent Interface.
- Owns: Tool exposure, caller-facing parameters, addressing forms, usage
  hints, v1/v2 compatibility posture, and negative rules visible to agents.
- Does not own: Runtime fork Implementation, state persistence, hook payloads,
  client rendering, or realtime background-agent handoff.
- Primary pointers: `spawn-context-lifecycle.md`,
  `communication-and-results.md`, `runtime-architecture.md`,
  `proof-and-readiness.md`.
- Fidelity note: Populated authority doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

The canonical agent-facing Interface for thread-spawn subagents is the
MultiAgentV2 tool set exposed to the model: `spawn_agent`, `send_message`,
`followup_task`, `wait_agent`, `list_agents`, and `close_agent`.

This doc owns what an agent must know to call those tools correctly: exposure,
required and optional caller-facing parameters, addressing forms, usage hints,
v1 compatibility posture, and caller-visible rejection rules. It does not own
how forked history is assembled, how messages are delivered through the
mailbox, or how runtime Modules execute the request.

## MultiAgentV2 Tool Set

`spawn_agent` creates a thread-spawn subagent for a well-scoped task. The v2
Interface requires `task_name` and `message`. `task_name` is the caller-facing
label used to form the child agent path, and `message` is the initial
plain-text task. Optional caller-facing fields are `agent_type`, `model`,
`reasoning_effort`, `service_tier`, and `fork_turns`.

`send_message` sends a plain-text message to an existing agent and does not
trigger a new turn in the target. Its required fields are `target` and
`message`.

`followup_task` sends a plain-text message to an existing non-root target agent
and triggers work in that target. If the target is already mid-turn, the
message queues for the target's next turn. Its required fields are `target`
and `message`.

`wait_agent` waits for a mailbox update from any live agent. It accepts an
optional `timeout_ms`. The v2 Interface reports only whether waiting completed
or timed out; content delivery and result ingestion are owned by
`communication-and-results.md`.

`list_agents` lists live agents in the current root thread tree. It accepts an
optional `path_prefix` filter.

`close_agent` closes a spawned agent and any open descendants. Its required
field is `target`; closing the root agent is rejected because the root is not a
spawned agent.

## Addressing

V2 spawned agents have canonical task names derived from the spawning agent's
path and the requested `task_name`. Tool callers can use the task reference
forms accepted by the target tool: relative or canonical task paths where the
tool exposes path targeting, and thread ids where the tool exposes id
targeting. Runtime path resolution is owned by `runtime-architecture.md`.

`spawn_agent` returns the new `task_name`, and normally also returns a
user-facing nickname when one is available. When spawn metadata is hidden by
configuration, the return value omits nickname and role/model override
surfaces from the tool schema.

## Exposure And Configuration

MultiAgentV2 tools are exposed when the MultiAgentV2 feature path is active.
When `features.multi_agent_v2.tool_namespace` is configured and namespace
tools are enabled, the v2 function tools are wrapped into that namespace.
Otherwise they are exposed as direct function tools.

When `features.multi_agent_v2.non_code_mode_only` is enabled, v2 tools are
planned as model-only direct tools for non-code mode instead of ordinary direct
tools. Wait timeout defaults and bounds come from the MultiAgentV2 wait-timeout
configuration. The exact wait behavior is owned by
`communication-and-results.md`.

Usage-hint configuration can add model-facing guidance to the tool
description. Root agents and thread-spawn subagents can also receive separate
usage hint text. These hints can guide when to delegate and how to shape
delegated work, but they do not replace the tool schemas or the owning
behavior docs.

## Delegation Obligations

The default spawn guidance authorizes delegation only for explicit user asks
for subagents, delegation, or parallel agent work. Requests for depth,
thoroughness, investigation, or codebase analysis do not by themselves
authorize spawning.

Delegated work should be concrete, bounded, self-contained, and materially
useful to the main task. Agents should prefer sidecar tasks that can run in
parallel with local work, avoid handing off the immediate critical-path
blocker, avoid duplicate work between parent and child, and keep code-edit
delegations to disjoint write scopes when possible.

After spawning, the parent agent should continue useful non-overlapping work
instead of reflexively waiting. `wait_agent` should be used sparingly, when the
next critical-path step is blocked on a mailbox update.

## V1 Compatibility

The v1 tool surface is a compatibility Interface used when collaboration tools
are enabled but MultiAgentV2 is not active. V1 tools live under the
`multi_agent_v1` namespace and use id-based targeting. The v1 surface includes
`spawn_agent`, `send_input`, `resume_agent`, `wait_agent`, and `close_agent`.

V1 differs from v2 in caller-facing shape:

- v1 `spawn_agent` accepts `message` or structured `items`; v2 `spawn_agent`
  accepts plain-text `message`.
- v1 uses `fork_context`; v2 uses `fork_turns`.
- v1 `send_input` can queue or interrupt by id; v2 splits plain-text
  communication into `send_message` and `followup_task`.
- v1 `wait_agent` targets explicit agent ids and may return final statuses;
  v2 `wait_agent` waits for mailbox updates without returning content.
- v1 has `resume_agent`; v2 does not expose a resume tool in the model-facing
  tool set.

New documentation for thread-spawn behavior should treat v2 as canonical and
v1 as compatibility surface unless a task explicitly targets legacy collab
behavior.

## Caller-Visible Rejections

V2 rejects legacy or malformed caller shapes rather than silently translating
them:

- `spawn_agent` rejects `fork_context`; callers must use `fork_turns`.
- `spawn_agent` rejects unknown fields, including legacy `items`.
- `fork_turns` must be `none`, `all`, or a positive integer string.
- empty messages are rejected.
- `followup_task` rejects root-agent targets.
- `close_agent` rejects root-agent targets.

Full-history fork override rules are owned by
`spawn-context-lifecycle.md`; this doc only records that those rejections are
caller-visible through the Interface.

## Owned Behavior

This doc currently owns:

- the canonical v2 model-facing tool set;
- v2 caller-facing parameters and return commitments;
- v2 exposure, namespace, metadata-hiding, and usage-hint posture;
- v1 compatibility posture;
- caller-facing addressing expectations;
- caller-visible negative rules for legacy and malformed shapes.

## Non-Ownership

This doc should not explain how forked history is assembled, how mail is
delivered, or how clients render tool calls except by pointing to the owning
docs.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/tools/spec_plan.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/session/multi_agents.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/`
- `codex-rs/core/src/tools/handlers/multi_agents/`

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- v2 tool schema and rejected legacy parameters;
- namespace exposure and feature-gated tool planning;
- target resolution that matters to the Interface.
