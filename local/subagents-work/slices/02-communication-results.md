# 02 Communication And Results

## Goal

Fill the authority doc for inter-agent communication, mailbox delivery, wait
behavior, and parent-visible result flow.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/communication-and-results.md`.
- `local/subagents/delegation-interface.md`.
- `local/subagents/runtime-architecture.md`.

## Target Live Docs

- `local/subagents/communication-and-results.md`
- `local/subagents/proof-and-readiness.md` only for proof notes that should not
  stay in the communication doc.

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_v2/message_tool.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs`
- `codex-rs/core/src/tools/handlers/multi_agents_v2/list_agents.rs`
- `codex-rs/core/src/tools/handlers/multi_agents/wait.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/context/environment_context.rs`
- `codex-rs/core/src/context/subagent_notification.rs`
- `codex-rs/core/src/context/session_prefix.rs`

## Decomposition Checkpoint

Do not create subslices upfront. Decompose only if messaging, wait behavior,
and completion notification each need a separate pass to keep ownership clear
after terrain sampling.

Likely subslices:

- `02a-message-delivery.md`: `send_message`, `followup_task`, targets, and
  turn triggering.
- `02b-wait-and-results.md`: wait timeouts, mailbox wake behavior, and what
  wait does not return.
- `02c-context-notifications.md`: parent completion forwarding and model
  context notification fragments.
- `02z-consolidation.md`: one communication model with no duplicated rules.

## Work Steps

1. Read the target communication doc and related core trio docs.
2. Extract communication facts into `concept-ledger.md`.
3. Resolve or record canonical result semantics.
4. Fill `send_message` versus `followup_task` behavior.
5. Fill mailbox, turn-trigger, and wait semantics.
6. Fill parent completion and notification behavior.
7. Add negative rules for what wait does not return.
8. Route proof expectations to `proof-and-readiness.md` or leave them for
   slice 05.
9. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- A reader can predict whether a message starts work.
- A reader can explain root-target rules for message and follow-up tools.
- A reader can explain what wakes `wait_agent`.
- A reader can explain what `wait_agent` does not report.
- A reader can explain how child completion becomes parent-visible.
- Legacy completion watcher behavior is identified without making it the v2
  owner.

## Verification

- `rg -n "TODO|TBD" local/subagents/communication-and-results.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
