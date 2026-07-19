## Navigation Header

- Role: Lifecycle/interface doc for inter-agent communication and result
  ingestion.
- Owns: Message delivery modes, mailbox semantics, wait behavior, completion
  notification, and parent-visible result flow.
- Does not own: Spawn configuration, persisted thread graph rules, TUI layout,
  realtime handoff, or hook schemas.
- Primary pointers: `delegation-interface.md`, `spawn-context-lifecycle.md`,
  `runtime-architecture.md`, `state-and-client-projection.md`.
- Fidelity note: Populated authority doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

Thread-spawn agents communicate by enqueueing `InterAgentCommunication`
envelopes into another agent's mailbox. The envelope is the communication
Interface between model-facing tools and session runtime: it carries the
author path, recipient path, optional additional recipients, message content,
and whether the mailbox delivery should trigger work in the recipient.

`send_message` is queue-only delivery. `followup_task` is turn-triggering
delivery. `wait_agent` observes mailbox activity and reports only whether a
mailbox update arrived before timeout; it does not return message content,
agent statuses, or final results.

For MultiAgentV2 thread-spawn subagents, parent-visible completion is owned by
the v2 completion forwarding path: when a child turn reaches a final status,
the child sends a completion notification envelope to its direct parent's
mailbox. Legacy watcher behavior is compatibility terrain, not the canonical
v2 result owner.

## Message Delivery Modes

`send_message` and `followup_task` share the same plain-text delivery seam.
Both resolve the target through the runtime path/id resolver, reject empty
messages, and send one `InterAgentCommunication` envelope through
`AgentControl::send_inter_agent_communication`.

`send_message` sets `trigger_turn` to `false`. The recipient mailbox is
notified and the message remains queued until the recipient's session next
drains mailbox input. This is the right tool for status notes, passive
updates, or sending a message to the root agent without assigning new work.

`followup_task` sets `trigger_turn` to `true`. After the message enters the
mailbox, session runtime may start a regular turn for the recipient if the
recipient is idle. If the recipient is already in a turn, the message remains
pending until the active turn can consume mailbox input or until a later turn.

`followup_task` rejects root-agent targets. Assigning a task to the root agent
would reverse the parent/child work model; a child that needs to notify the
root should use `send_message`, or let completion forwarding report the child
turn's final status.

The caller-facing tool names, arguments, and rejection messages are owned by
`delegation-interface.md`. This doc owns what those calls mean after they
become inter-agent communication.

## Mailbox Semantics

Each session owns a mailbox queue and a mailbox watch signal. Enqueueing an
`InterAgentCommunication` appends the envelope to the pending mailbox and
notifies mailbox subscribers. A later model request drains pending mailbox
items into response input items in delivery order.

Mailbox input is model-visible as assistant commentary containing the
serialized `InterAgentCommunication`. The model receives the sender, recipient,
content, and `trigger_turn` value as structured message content rather than as
ordinary user text.

Mailbox delivery is coordinated with the active turn:

- A turn normally starts in a phase that can consume mailbox input.
- After user-visible terminal answer text is recorded, late mailbox input is
  left queued for the next turn instead of extending an answer that has already
  been shown.
- Explicit same-turn work, such as steered user input or a tool-follow-up path,
  reopens mailbox delivery so queued mail can be folded into the continuing
  turn.

The queue does not treat `trigger_turn` as content priority. It only answers
whether queued mail should start work when the recipient is idle. Delivery
order remains mailbox order.

## Wait Behavior

V2 `wait_agent` is mailbox-oriented. It accepts an optional `timeout_ms`, uses
the configured default when omitted, and rejects explicit values outside the
configured minimum and maximum. A configured zero timeout can complete
immediately.

Waiting subscribes to the caller session's mailbox signal. Already queued mail
marks the subscription as changed so the wait can complete immediately.
Otherwise, `wait_agent` waits until any mailbox notification arrives or the
deadline passes.

The v2 result shape is intentionally small:

- `{ "message": "Wait completed.", "timed_out": false }` when mailbox activity
  arrives before timeout.
- `{ "message": "Wait timed out.", "timed_out": true }` when no mailbox
  activity arrives before timeout.

`wait_agent` does not drain the mailbox. It does not return message content,
which agent sent the notification, which agent completed, final output, or
status maps. The next eligible model request receives queued mailbox content
according to the normal mailbox delivery rules.

`wait_agent` wakes on any mailbox notification for the caller session, not only
on completion and not only on a selected target. This keeps waiting cheap as an
attention mechanism rather than a second result ingestion path.

## Completion Notifications

For MultiAgentV2 thread-spawn subagents, each child turn that reaches a final
status sends a standard completion notification to the direct parent path. The
notification is built from the child agent path and final `AgentStatus`, then
sent to the parent thread as an `InterAgentCommunication` with
`trigger_turn` set to `false`.

Completion forwarding therefore makes results parent-visible without forcing a
new parent turn. A parent can call `wait_agent` to be woken by the mailbox
notification, but the wait output remains only a wake summary. The actual
completion notification is consumed through mailbox delivery on the next
eligible model request.

The notification content uses the `<subagent_notification>` contextual marker
with a JSON body containing `agent_path` and `status`. That marker is
model-context state, not client projection authority. Client and persisted
state projection rules belong in `state-and-client-projection.md`.

## Environment Context

Turn context may include a `<subagents>` section listing open thread-spawn
children by reference and optional nickname. This exposes current child-agent
state to the model at turn start, but it does not deliver results and does not
replace mailbox communication.

`runtime-architecture.md` owns the `AgentControl` placement that formats this
context. This doc owns the communication meaning: environment context is a
state hint, while mailbox delivery is the result and message ingestion path.

## Legacy Compatibility

V1 `wait_agent` is a compatibility Interface. It targets explicit agent ids,
waits for final statuses, and returns a status map plus `timed_out`. That
shape is not the v2 result model.

Legacy completion watcher terrain can inject a formatted notification into the
parent path for non-v2 or compatibility cases. For v2 thread-spawn subagents,
session-level completion forwarding is the canonical parent-visible completion
behavior.

## Owned Behavior

This doc currently owns:

- `InterAgentCommunication` as the message envelope used by thread-spawn
  communication;
- queue-only delivery for `send_message`;
- turn-triggering delivery for `followup_task`;
- mailbox enqueue, wake, drain, and delivery-phase semantics;
- v2 `wait_agent` timeout and summary-only behavior;
- v2 child completion forwarding to the direct parent mailbox;
- the difference between completion notification, wait output, and environment
  context hints;
- legacy wait/status behavior as compatibility terrain.

## Non-Ownership

This doc should not define how a subagent is spawned, how history is forked, or
how thread edges are persisted. Route those rules to the owning docs.

This doc should not define hook payloads, realtime handoff routing, app-server
projection, or TUI rendering. Those adapters may observe communication events
or render subagent state, but they do not own the mailbox or result-ingestion
rules.

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
- `codex-rs/core/src/session_prefix.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/wait.rs`

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- v2 message delivery and wait behavior;
- result forwarding versus wait output;
- downstream app-server or TUI display without making those projections
  behavior authority.
