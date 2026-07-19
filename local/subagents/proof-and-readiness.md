## Navigation Header

- Role: Proof and readiness doc for the subagents documentation set.
- Owns: Validation posture, test anchors, proof matrix, and cold-reader review
  expectations.
- Does not own: Behavior rules for tools, lifecycle, runtime, persistence,
  hooks, clients, or realtime handoff.
- Primary pointers: All behavior and lifecycle docs in this directory.
- Fidelity note: Populated proof and readiness doc; use cold-reader review
  before claiming the documentation set is complete.

## Core Rule

Proof validates the owning docs. It does not define behavior.

For any subagents change, first identify the owning live doc and the seam being
changed. Then choose the smallest proof cluster that exercises that seam
through its normal Interface or Adapter. If a test expectation conflicts with
the owning doc, fix the implementation or the test expectation; do not let the
test become a second behavior owner.

Docs-only changes do not require Rust validation unless they change generated
contracts, code, or test fixtures. Code changes should follow the root
`AGENTS.md` validation posture: prefer focused tests and avoid full local
crate or workspace suites unless the broader run is explicitly requested or
the change truly needs it.

## Proof Matrix

| Owning doc | Proof cluster | Terrain anchors |
| --- | --- | --- |
| `delegation-interface.md` | Model-facing tool exposure, argument validation, v2/v1 compatibility, path/target call shapes, and caller-visible tool output. | `codex-rs/core/src/tools/handlers/multi_agents_spec_tests.rs`; `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`; `codex-rs/core/src/tools/handlers/multi_agents_v2/`; `codex-rs/core/src/tools/handlers/multi_agents/` |
| `spawn-context-lifecycle.md` | Fresh/full/partial context behavior, fork override rejections, forked-history filtering, resume, close, depth, and capacity behavior. | `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`; `codex-rs/core/src/agent/control_tests.rs`; `codex-rs/core/src/agent/registry_tests.rs` |
| `runtime-architecture.md` | `AgentControl` and `AgentRegistry` behavior behind the handler Adapter seam: spawn execution, runtime inheritance placement, live tree state, capacity, path reservation, close/resume subtree behavior, and completion forwarding placement. | `codex-rs/core/src/agent/control_tests.rs`; `codex-rs/core/src/agent/registry_tests.rs`; `codex-rs/core/src/tools/handlers/multi_agents_tests.rs` |
| `communication-and-results.md` | `send_message` versus `followup_task`, root-target rules, mailbox wake/drain behavior, v2 wait summary semantics, v2 parent completion notification, and legacy v1 wait/status compatibility. | `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`; `codex-rs/core/src/agent/control_tests.rs`; `codex-rs/core/tests/suite/subagent_notifications.rs`; `codex-rs/core/tests/suite/snapshots/all__suite__model_visible_layout__model_visible_layout_environment_context_includes_one_subagent.snap`; `codex-rs/core/tests/suite/snapshots/all__suite__model_visible_layout__model_visible_layout_environment_context_includes_two_subagents.snap` |
| `state-and-client-projection.md` | Persisted `thread_spawn_edges`, open/closed traversal, descendant ordering, thread metadata projection, app-server source filtering, app-server thread views, TUI loaded-thread backfill, TUI navigation cache, and collab history rendering. | `codex-rs/state/src/runtime/threads.rs`; `codex-rs/state/src/model/thread_metadata.rs`; `codex-rs/app-server/src/filters.rs`; `codex-rs/app-server/src/request_processors/thread_processor_tests.rs`; `codex-rs/app-server/src/request_processors/thread_summary_tests.rs`; `codex-rs/tui/src/app/loaded_threads.rs`; `codex-rs/tui/src/app/agent_navigation.rs`; `codex-rs/tui/src/multi_agents.rs`; `codex-rs/tui/src/chatwidget/tests/app_server.rs`; `codex-rs/tui/src/snapshots/codex_tui__multi_agents__tests__collab_agent_transcript.snap` |
| `hooks-and-integrations.md` | `SubagentStart` and `SubagentStop` schema shape, optional normal-hook `agent_id`/`agent_type`, `SubagentStart` context-only output behavior, `SubagentStop` stop/block behavior, matcher support, and runtime dispatch/exclusion behavior. | `codex-rs/hooks/src/schema.rs`; `codex-rs/hooks/src/events/session_start.rs`; `codex-rs/hooks/src/events/stop.rs`; `codex-rs/hooks/src/events/common.rs`; `codex-rs/core/src/hook_runtime.rs`; `codex-rs/hooks/src/schema/generated/` |
| `realtime-background-agent-handoff.md` | Realtime v2 `background_agent` exposure, handoff parsing, transcript selection, `<realtime_delegation>` envelope construction, XML escaping, active handoff progress/final acknowledgement, steering acknowledgement, and app-server realtime item projection. | `codex-rs/core/src/realtime_conversation_tests.rs`; `codex-rs/core/tests/suite/realtime_conversation.rs`; `codex-rs/app-server/tests/suite/v2/realtime_conversation.rs`; `codex-rs/codex-api/src/endpoint/realtime_websocket/methods.rs`; `codex-rs/codex-api/src/endpoint/realtime_websocket/methods_v2.rs`; `codex-rs/codex-api/src/endpoint/realtime_websocket/protocol_v2.rs` |

## Validation Posture

Use the proof matrix as a routing tool:

- Docs-only edits: run text checks for placeholders, terminology, whitespace,
  and `git diff --check`.
- Interface or handler changes: run focused `codex-core` multi-agent handler
  tests that exercise the changed tool path.
- Runtime Module changes: run focused `AgentControl` or `AgentRegistry` tests
  that cross the runtime Interface under change.
- State changes: run focused `codex-state` tests around thread metadata or
  thread-spawn edge traversal.
- App-server projection changes: run focused app-server processor or filter
  tests that cover the changed projection.
- TUI projection or rendering changes: run the focused TUI unit or snapshot
  test that renders the affected history, navigation, or picker surface.
- Hook schema changes: regenerate schema fixtures if schema shape changes, and
  run focused hook schema/event tests.
- Realtime handoff changes: run focused core realtime or app-server realtime
  tests for the changed websocket or handoff path.

Do not use a narrow green test as evidence for a broad seam unless the test
actually crosses the affected Interface or Adapter. When a change spans
multiple owning docs, collect one proof cluster per affected owner.

## Readiness Checklist

- A fresh reader can name the live authority docs.
- A fresh reader can distinguish thread-spawn subagents from internal subagent
  variants.
- A fresh reader can explain fresh, full-history, and partial-history spawn
  modes without reading source files.
- A reviewer can map each durable rule to exactly one owning doc.
- Implementation prompts can name a bounded seam, relevant terrain, and stop
  conditions.
- Proof expectations route to this doc while behavior questions route to the
  owning seam doc.
- Remaining proof gaps are named as review posture, not silently treated as
  behavior decisions.

## Cold-Reader Review

Cold-reader review is a required final hardening gate for the documentation
set. The reviewer should read only the live docs in this directory. They should
not use source code, prior conversation, planning notes, ledgers, or other
support artifacts to answer normal behavior questions.

Use this prompt:

```text
Read only the live docs in local/subagents/.

Produce a concise cold-reader review with these sections:

1. Authority map: list the live authority docs, their authority order, and what
   each doc owns.
2. Scope check: explain what is in scope, what is explicitly out of scope, and
   what must not be inferred from current code terrain.
3. Seam check: explain where fresh session, full-history fork,
   partial-history fork, runtime execution, message delivery, persisted state,
   client projection, hooks, realtime handoff, and proof expectations are
   owned.
4. Proof check: map each owning doc to the proof cluster or validation posture
   that would apply if that seam changed.
5. Stop conditions: name what should stop implementation or planning.
6. Findings: list any ambiguity, duplicated authority, missing owner, stale
   scaffold wording, or place where source/proof terrain seems to define
   behavior instead of a live doc.
```

If the reviewer needs support artifacts outside this directory to answer those
questions, the documentation set is not ready. Any finding must be fixed in
the owning live doc or recorded as explicit readiness posture here.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_spec_tests.rs`
- `codex-rs/core/src/agent/control_tests.rs`
- `codex-rs/core/src/agent/registry_tests.rs`
- `codex-rs/core/tests/suite/subagent_notifications.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/state/src/model/thread_metadata.rs`
- `codex-rs/app-server/src/filters.rs`
- `codex-rs/app-server/src/request_processors/thread_processor_tests.rs`
- `codex-rs/app-server/src/request_processors/thread_summary_tests.rs`
- `codex-rs/tui/src/app/loaded_threads.rs`
- `codex-rs/tui/src/app/agent_navigation.rs`
- `codex-rs/tui/src/multi_agents.rs`
- `codex-rs/tui/src/chatwidget/tests/app_server.rs`
- `codex-rs/hooks/src/schema.rs`
- `codex-rs/hooks/src/events/session_start.rs`
- `codex-rs/hooks/src/events/stop.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/core/src/realtime_conversation_tests.rs`
- `codex-rs/core/tests/suite/realtime_conversation.rs`
- `codex-rs/app-server/tests/suite/v2/realtime_conversation.rs`
