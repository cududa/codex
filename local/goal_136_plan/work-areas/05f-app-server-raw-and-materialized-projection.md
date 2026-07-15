# WA05f: App-Server Raw And Materialized Projection

This pass removes the app-server raw overlay and updates app-server
materialized/thread-history projection behavior.

## Direction Lock

Request:

- restore raw response item notifications to raw behavior
- keep typed/materialized projection hiding separate from raw streams
- do not add an app-server-only Goal classifier

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `bespoke_event_handling.rs::maybe_emit_raw_response_item_completed(...)`
  currently returns early for pure legacy Goal context
- `bespoke_event_handling.rs` duplicates Goal marker parsing locally
- `rust-v0.136.0` app-server raw handling emits raw response item
  notifications directly without this local overlay
- `thread_history.rs` has a local test that ignores Goal context response
  items during rollout replay

Code-shape temptation:

- preserve raw hiding because typed/materialized projection hides pure Goal
  artifacts
- introduce app-server-specific marker parsing to avoid depending on core
  projection behavior

Locked direction:

- raw notifications emit actual response items unchanged
- typed/materialized projection may hide pure artifacts through core
  projection or exact replay rules
- `GoalRequestEvidence` remains metadata and is not raw conversation content

Exclusions:

- no core classifier implementation
- no final request-input authority tests
- no app-server Goal product API redesign

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Code Terrain Read

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `rust-v0.136.0:codex-rs/app-server/src/bespoke_event_handling.rs`
- `rust-v0.136.0:codex-rs/app-server-protocol/src/protocol/thread_history.rs`

## Pass Goal

Remove local app-server raw hiding and align materialized thread history with
the shared classifier/projection rules.

## Exact Files To Edit

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- app-server request processor or summary tests only if materialized
  projection behavior through `codex_core::parse_turn_item(...)` is exposed
  there

## Required Edits

- Delete app-server-local Goal marker helpers from
  `bespoke_event_handling.rs`.
- Remove the early return in `maybe_emit_raw_response_item_completed(...)` for
  pure Goal-looking response items.
- Ensure raw response item notifications emit:
  - pure legacy `<goal_context>` response items
  - pure current Goal internal-context response items
  - mixed Goal-looking response items
  unchanged.
- Keep hook prompt raw behavior unchanged.
- Do not route `GoalRequestEvidence` through raw response item notifications.
- Do not add app-server-only Goal classifiers. App-server typed/materialized
  projection should use core projection behavior or exact rollout replay
  rules.
- Replace local materialized replay tests that preserve old active
  `<goal_context>` behavior with route-accurate coverage:
  - `ThreadHistoryBuilder::handle_response_item(...)` still rebuilds hook
    prompts from rollout `ResponseItem`s
  - pure legacy artifacts and pure current Goal internal-context items do not
    create user-visible thread items in rollout replay
  - plain or mixed non-hook user-role rollout `ResponseItem`s follow the
    existing replay baseline and do not become `ThreadItem::UserMessage`
    merely because they are mixed
  - app-server routes that call `codex_core::parse_turn_item(...)`, such as
    preview or summary projection, preserve mixed marker-like user prose where
    those routes otherwise expose user-visible content
  - structured Goal evidence, if present, remains metadata-only and is not
    materialized as conversation prose

## Tests And Checks

Add or update focused app-server tests:

- legacy Goal context raw item emits
  `RawResponseItemCompletedNotification`
- current source-tagged Goal raw item emits
  `RawResponseItemCompletedNotification`
- mixed Goal-looking raw item emits
  `RawResponseItemCompletedNotification`
- raw notification assertions compare the entire notification item
- hook prompt raw behavior remains unchanged
- app-server protocol rollout replay keeps its hook-prompt-only response-item
  behavior while proving pure current and legacy Goal artifacts do not create
  user-visible thread items
- mixed marker-like user prose remains visible through core projection or
  app-server preview/summary routes that actually materialize
  `parse_turn_item(...)` output

Delete or rewrite the old raw-hiding test named by
`goal-test-deletion-map.md`; do not keep the old raw overlay behind a renamed
helper.

## Branch Continuation State

After this pass:

- app-server raw streams are restored to raw behavior
- app-server materialized projection follows shared cleanup semantics
- raw notifications remain separate from typed/materialized projection hiding
- WA06 only verifies no leftover raw overlay remains

## Non-Goals

- no final request payload authority coverage
- no app-server Goal mutation ordering changes
- no evidence carrier implementation
- no app-server-only Goal parser
- no broad raw-response contract redesign
