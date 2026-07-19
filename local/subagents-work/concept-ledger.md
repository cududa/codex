# Concept Ledger

Use this table as the temporary extraction surface while filling
`local/subagents/`. Do not treat ledger rows as authority until the fact has
been moved into the owning live doc.

## Status Values

- `candidate`: extracted from terrain but not yet sorted.
- `ready`: accepted for a specific owning doc.
- `moved`: written into the owning live doc.
- `pointer-only`: useful context, but not owned by the target doc.
- `conflict`: current terrain and intended doc shape need user or reviewer
  resolution.
- `rejected`: not part of thread-spawn subagents authority.

## Ledger

| Concept | Fact | Source terrain | Owning doc | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Scope | Thread-spawn subagents are the primary subject of this doc set. | `local/subagents/AGENTS.md` | `local/subagents/AGENTS.md` | moved | Keep internal subagent variants as related terrain only. |
| Realtime handoff | Realtime `background_agent` is related delegation terrain but not equivalent to thread-spawn subagents. | `local/subagents/README.md` | `local/subagents/realtime-background-agent-handoff.md` | ready | Confirm during slice 04 before expanding prose. |
| v2 Interface | v2 exposes `spawn_agent`, `send_message`, `followup_task`, `wait_agent`, `list_agents`, and `close_agent`. | `codex-rs/core/src/tools/handlers/multi_agents_spec.rs` | `local/subagents/delegation-interface.md` | candidate | Verify exact naming and namespace behavior in slice 01. |
| Context modes | Spawn supports fresh, full-history, and partial-history modes. | `codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs` | `local/subagents/spawn-context-lifecycle.md` | candidate | Verify v1 compatibility language in slice 01. |
| Runtime Module | `AgentControl` concentrates spawn, fork, resume, communication, close, list, and completion behavior. | `codex-rs/core/src/agent/control.rs` | `local/subagents/runtime-architecture.md` | candidate | Use codebase-design Module language. |
| Live registry | `AgentRegistry` owns live tree metadata, path reservation, and capacity. | `codex-rs/core/src/agent/registry.rs` | `local/subagents/runtime-architecture.md` | candidate | Verify exact capacity semantics in slice 01. |
| Message delivery | `send_message` and `followup_task` differ by whether delivery triggers work. | `codex-rs/core/src/tools/handlers/multi_agents_v2/message_tool.rs` | `local/subagents/communication-and-results.md` | candidate | Verify root-target rules in slice 02. |
| Wait behavior | v2 wait is mailbox-oriented and does not return final content. | `codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs` | `local/subagents/communication-and-results.md` | candidate | Verify timeout details in slice 02. |
| Persisted tree | Thread-spawn edges persist parent-child relationship and open/closed state. | `codex-rs/state/migrations/0021_thread_spawn_edges.sql` | `local/subagents/state-and-client-projection.md` | candidate | Verify archive/resume interactions in slice 03. |
| Hook exposure | Thread-spawn subagents have specific start/stop hook exposure; internal variants do not inherit all hook behavior. | `codex-rs/core/src/hook_runtime.rs` | `local/subagents/hooks-and-integrations.md` | candidate | Verify exact hook rules in slice 04. |

## Extraction Notes

Add rows freely during slice work. Before finishing a slice, change each touched
row to `ready`, `moved`, `pointer-only`, `conflict`, or `rejected`.

If a parent slice is decomposed, use the `Notes` column to name the subslice
that owns the next action. Do not add new ledger columns unless the table stops
being readable.
