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
- Fidelity note: Populated sibling Adapter doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

Realtime `background_agent` handoff remains a sibling Adapter doc. It is
related delegation terrain because a realtime model can ask a background agent
to do work, but it does not create a thread-spawn subagent and does not use
the thread-spawn Module.

Realtime handoff does not call the multi-agent tool Interface, does not enter
`AgentControl` or `AgentRegistry`, does not create
`SessionSource::SubAgent(ThreadSpawn)`, does not write `thread_spawn_edges`,
and does not participate in thread-spawn mailbox delivery, `wait_agent`,
`list_agents`, `close_agent`, or TUI subagent navigation.

## V2 Tool Exposure

In realtime v2 conversational sessions, the realtime session update exposes a
function tool named `background_agent`. The tool takes a delegated user request
as a prompt and is selected by the realtime model through the realtime
websocket, not through the Codex model-facing multi-agent Interface.

Realtime v2 transcription sessions omit this tool. V1 handoff behavior is
compatibility terrain that maps into the same internal `RealtimeHandoffRequested`
shape after parsing.

## Handoff Request Parsing

A v2 realtime handoff is parsed from a completed realtime conversation item
whose item type is `function_call` and whose name is `background_agent`. The
handoff id is the function call id when present, otherwise the item id. The
request also records the realtime item id, an input transcript, and an active
transcript window.

The parser chooses delegated text from the first non-empty string it finds in
these argument keys:

- `input_transcript`
- `input`
- `text`
- `prompt`
- `query`

If no structured value is available, the raw arguments string is used. Empty
handoff input can still route only when active transcript text is available.

The realtime websocket Adapter maintains a rolling transcript of user and
assistant realtime text. When a handoff request arrives, the active transcript
window is the transcript entries since the previous handoff. The handoff input
is appended to that window only if it is not already present as a user entry.

## Main-Session Routing

Core realtime fanout routes `RealtimeEvent::HandoffRequested` by building a
text envelope and submitting it back into the current session as user input:

```text
<realtime_delegation>
  <input>...</input>
  <transcript_delta>...</transcript_delta>
</realtime_delegation>
```

`input` prefers the handoff input transcript. If that is empty, it falls back
to the active transcript window formatted as `role: text` lines. The optional
`transcript_delta` is included when active transcript text exists. Envelope
text is XML-escaped.

This route is why realtime handoff can feel like delegation without being a
thread-spawn subagent. The routed envelope becomes ordinary user input on the
current session. It does not create a child thread, live tree node, persisted
edge, agent path, agent nickname, agent role, mailbox entry, or subagent
completion notification.

## Active Handoff State

Realtime handoff state tracks only realtime websocket coordination:

- active handoff id;
- last mirrored output text;
- realtime session kind;
- an output channel back to the realtime websocket task.

When v2 receives a handoff request and no handoff is active, it stores the
handoff id and clears the last output. When another handoff request arrives
while one is active, v2 treats it as steering for the existing work: it sends a
function-call output acknowledgement for the new call and requests a realtime
response, but it does not replace the active handoff id.

While a handoff id is active, main-session event text can be mirrored back to
the realtime conversation as progress. V2 prefixes mirrored backend text with
`[BACKEND]` before sending it to realtime as a conversation item. Stale
progress updates for a non-active handoff id are dropped.

When the main session turn completes, realtime completion sends a final
function-call output for the active handoff only if there was mirrored output.
The v2 final output is an acknowledgement telling realtime to use the previous
backend messages as the result; it is not the thread-spawn result-ingestion
path owned by `communication-and-results.md`. The active handoff id and last
output are then cleared.

## App-Server Projection

App-server bespoke event handling projects realtime handoff requests as
`ThreadRealtimeItemAdded` notifications with a realtime item payload shaped
like:

- `type: "handoff_request"`
- `handoff_id`
- `item_id`
- `input_transcript`
- `active_transcript`

This is realtime presentation data. It does not make app-server the owner of
thread-spawn lifecycle, persisted state, mailbox behavior, or client subagent
navigation.

## Non-Equivalence To Thread-Spawn Subagents

Use these checks when deciding where future behavior belongs:

- If the behavior needs child thread creation, context mode selection,
  `AgentControl`, `AgentRegistry`, `SessionSource::SubAgent(ThreadSpawn)`, or
  `thread_spawn_edges`, it belongs in the thread-spawn docs, not here.
- If the behavior is realtime function-call parsing, realtime transcript
  windowing, `<realtime_delegation>` envelope construction, realtime
  acknowledgement, or realtime websocket projection, it belongs here.
- If a future feature deliberately makes realtime handoff create a
  thread-spawn subagent, update `open-decisions.md` first and then move the
  owning behavior into the thread-spawn seam docs instead of duplicating it
  here.

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

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- transcript selection, `<realtime_delegation>` envelope construction, XML
  escaping, active-handoff clearing, and no-op behavior when no handoff is
  active;
- v2 `background_agent` tool exposure, v2 handoff parsing, active transcript
  windowing, progress output, final acknowledgement, and steering
  acknowledgement;
- realtime handoff request projection as realtime item data, not thread-spawn
  subagent state.
