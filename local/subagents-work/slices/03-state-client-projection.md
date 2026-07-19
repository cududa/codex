# 03 State And Client Projection

## Goal

Fill the authority doc for persisted thread-spawn state and downstream client
projections.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/state-and-client-projection.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- `local/subagents/communication-and-results.md`.

## Target Live Docs

- `local/subagents/state-and-client-projection.md`
- `local/subagents/proof-and-readiness.md` only for proof notes that should not
  stay in the state/projection doc.

## Terrain

- `codex-rs/state/migrations/0021_thread_spawn_edges.sql`
- `codex-rs/state/src/model/graph.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/state/src/model/thread_metadata.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/src/filters.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/tui/src/multi_agents.rs`
- `codex-rs/tui/src/chatwidget/tool_lifecycle.rs`
- `codex-rs/tui/src/app/agent_navigation.rs`
- `codex-rs/tui/src/app/session_lifecycle.rs`

## Decomposition Checkpoint

Do not create subslices upfront. Decompose only if persisted state, app-server
projection, and TUI projection start competing for behavior authority after
terrain sampling.

Likely subslices:

- `03a-persisted-thread-tree.md`: edges, metadata, resume, archive.
- `03b-app-server-projection.md`: thread source filters and event projection.
- `03c-tui-projection.md`: picker/history/navigation as downstream
  presentation.
- `03z-consolidation.md`: projection docs remain observers of core lifecycle
  behavior.

## Work Steps

1. Read the target state/projection doc and related lifecycle docs.
2. Extract state and projection facts into `concept-ledger.md`.
3. Resolve or record client projection authority scope.
4. Fill persisted edge and metadata behavior.
5. Fill resume/archive interactions that depend on persisted edges.
6. Fill app-server projection as an Adapter.
7. Fill TUI projection as an Adapter.
8. Keep client rendering specifics out unless they are needed for the seam.
9. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- A reader can explain the durable thread-spawn graph.
- A reader can explain open versus closed edge state.
- A reader can explain which metadata identifies a thread-spawn subagent.
- A reader can distinguish persisted state from app-server and TUI projection.
- A reader can identify which client details are terrain rather than behavior
  authority.

## Verification

- `rg -n "TODO|TBD" local/subagents/state-and-client-projection.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
