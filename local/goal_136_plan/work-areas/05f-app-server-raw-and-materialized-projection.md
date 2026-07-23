# WA05f: App-Server Raw And Materialized Projection

This pass removes the app-server raw overlay and updates app-server
materialized/thread-history projection behavior. Raw response item
notifications remain raw even when typed/materialized projection hides pure
Goal artifacts.

## Direction Lock

Request:

- restore raw response item notifications to raw behavior
- keep typed/materialized projection hiding separate from raw streams
- do not add an app-server-only Goal classifier

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `bespoke_event_handling.rs::maybe_emit_raw_response_item_completed(...)`
  currently returns early for pure legacy Goal context
- `bespoke_event_handling.rs` duplicates Goal marker parsing locally
- `rust-v0.136.0` app-server raw handling emits raw response item
  notifications directly without this local overlay
- `thread_history.rs` has a local test that ignores Goal context response
  items during rollout replay
- preview and summary projection routes consume `codex_core::parse_turn_item(...)`
  where those routes materialize typed user-visible content

Code-shape temptation:

- preserve raw hiding because typed/materialized projection hides pure Goal
  artifacts
- introduce app-server-specific marker parsing to avoid depending on core
  projection behavior
- treat raw notification emission or suppression as active Goal authority

Locked direction:

- raw notifications emit actual response items unchanged
- typed/materialized projection may hide pure artifacts through core
  projection or exact replay rules
- `GoalRequestEvidence` remains metadata and is not raw conversation content
- app-server does not duplicate Goal artifact classification

Exclusions:

- no core classifier implementation
- no final request-input authority tests
- no app-server Goal product API redesign
- no evidence materialization as prose, hook prompt, raw item, or typed thread
  item

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`

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
the shared classifier/projection rules. Raw behavior is deletion of the local
fork overlay; materialized behavior relies on core projection semantics or
exact rollout replay rules.

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

Use `local/how-we-test.md` and the cleanup triage doc. This pass should burn
down tests that defend the app-server raw hiding overlay or app-server-local
Goal marker parsing after those code paths are removed. Delete the old
raw-hiding test with no replacement by default. Keep or add focused raw-emits
or materialized-projection coverage only if a real current app-server contract
would otherwise have no useful boundary validation. Do not add app-server tests
merely to show the old suppression test disappeared.

Only keep or add focused boundary cases when they protect a real current
app-server raw/materialized contract and are not already covered:

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

Delete the old raw-hiding test named by the cleanup triage doc unless it is the
only practical home for a current raw-emits boundary assertion. Do not keep the
old raw overlay behind a renamed helper. For docs/test-deletion-only work, diff
inspection is valid validation.

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
