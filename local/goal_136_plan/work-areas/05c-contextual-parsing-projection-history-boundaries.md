# WA05c: Contextual Parsing, Projection, And History Boundaries

This pass converts contextual parsing, typed/materialized projection, and
history boundary behavior to use the shared cleanup classifier.

## Direction Lock

Request:

- convert contextual user parsing, event mapping, typed/materialized
  projection, and history boundary handling
- preserve mixed ordinary prose
- do not treat projection hiding as active Goal authority

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `contextual_user_message.rs` currently treats `is_goal_context_text(...)` as
  contextual user content and skips it during hook prompt parsing
- `event_mapping.rs` hides user-role Goal marker text through contextual user
  parsing and treats developer marker text as contextual developer content
- `ContextManager::drop_last_n_user_turns(...)` and
  `trim_pre_turn_context_updates(...)` inherit Goal behavior from contextual
  predicates

Code-shape temptation:

- keep text-level marker checks because they are near the existing contextual
  infrastructure
- hide any message that merely contains marker-looking text

Locked direction:

- use the shared classifier for pure Goal artifacts only
- preserve mixed messages and existing non-Goal contextual behavior
- keep history boundary logic as projection/history support, not cadence logic

Exclusions:

- no request-input authority tests
- no compaction or rollout reconstruction conversion
- no app-server raw notification changes

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Code Terrain Read

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`

## Pass Goal

Replace old Goal marker predicates in contextual/projection/history callsites
with strict pure-artifact classification while keeping user-visible and
rollback boundary behavior precise.

## Exact Files To Edit

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`

## Required Edits

- Replace direct `is_goal_context_text(...)` use in contextual parsing with a
  classifier adapter that only recognizes pure current Goal internal-context
  text and pure legacy `<goal_context>` text.
- Do not preserve the current content-item `any(...)` behavior for Goal
  artifacts when a caller hides, drops, or treats an entire message as a
  contextual boundary. Projection and history-boundary decisions must first
  know whether the complete `ResponseItem::Message` is a pure Goal artifact:
  exactly one text content item, no images, no output text, no additional text
  spans, and no ordinary prose outside the recognized representation.
- A single Goal-looking text span inside a multi-span user or developer message
  is mixed/ordinary content. It must remain visible where that surface normally
  shows user prose, and it must remain a user-turn boundary when it is a user
  message that would otherwise be a boundary.
- Keep standard contextual user fragments and hook prompt parsing unchanged.
- Ensure `parse_visible_hook_prompt_message(...)` skips pure Goal artifacts
  only as explicit contextual fragments alongside hook prompt fragments. Mixed
  text in the same content item, or multi-span ordinary prose with a
  Goal-looking span, must reject hook prompt parsing as ordinary mixed content.
- Update `event_mapping::parse_turn_item(...)` behavior so typed projection:
  - hides pure current Goal internal-context items
  - hides pure legacy `<goal_context>` artifacts
  - preserves mixed marker-like user prose
  - does not classify pure non-Goal internal context as Goal
- Update contextual developer checks so pure Goal artifacts remain
  rollback-trimmable context while mixed developer content continues to
  invalidate reference context when existing behavior requires it.
- Update `ContextManager` boundary logic so pure current/legacy Goal artifacts
  are not ordinary user-turn boundaries, while mixed marker-like user messages
  remain boundaries.
- Do not add durable Goal fact reads or cadence selection to these modules.

## Tests And Checks

Add or rewrite focused tests:

- pure current Goal internal-context item is hidden from typed projection
- pure legacy `<goal_context>` artifact is hidden from typed projection
- mixed marker-like user prose remains visible
- multi-span user content with one Goal-looking span and one ordinary text span
  remains visible as a mixed/ordinary user message
- pure current Goal item is not a user-turn boundary
- pure legacy Goal artifact is not a user-turn boundary
- mixed marker-like user prose remains a user-turn boundary
- multi-span user content with one Goal-looking span and one ordinary text span
  remains a user-turn boundary
- rollback trims pure Goal artifacts only in trimmable positions
- mixed developer content preserves the existing reference-context
  invalidation behavior

Delete or rewrite local-only fake-shim tests named by
`goal-test-deletion-map.md`; do not preserve tests that require active
`<goal_context>` behavior.

## Branch Continuation State

After this pass:

- typed/materialized projection and history boundary behavior use shared
  classifier semantics
- compaction, reconstruction, and app-server raw/protocol replay may still
  require conversion in later WA05 passes
- final request-input authority tests remain outside this pass

## Non-Goals

- no final `/responses` authority coverage
- no model-visible history key redesign
- no durable Goal state reads
- no compaction replacement-history cleanup
- no app-server raw overlay deletion
