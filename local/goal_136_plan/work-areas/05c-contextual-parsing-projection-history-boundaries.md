# WA05c: Contextual Parsing, Projection, And History Boundaries

This pass converts contextual parsing, typed/materialized projection, and
history boundary behavior to use the shared cleanup classifier. These surfaces
may hide or trim pure artifacts for cleanup, but they must not infer active
Goal facts, cadence, pending intent, Continuation suppression, recorded
evidence, or model authority.

## Direction Lock

Request:

- convert contextual user parsing, event mapping, typed/materialized
  projection, and history boundary handling
- preserve mixed ordinary prose
- do not treat projection hiding as active Goal authority

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `contextual_user_message.rs` currently treats `is_goal_context_text(...)` as
  contextual user content and skips it during hook prompt parsing
- `event_mapping.rs` hides user-role Goal marker text through contextual user
  parsing and treats developer marker text as contextual developer content
- `ContextManager::drop_last_n_user_turns(...)` and
  `trim_pre_turn_context_updates(...)` inherit Goal behavior from contextual
  predicates
- tests still name old fake-context behavior and can preserve the wrong
  pressure if rewritten as one-for-one replacement tests

Code-shape temptation:

- keep text-level marker checks because they are near the existing contextual
  infrastructure
- hide any message that merely contains marker-looking text
- treat typed projection hiddenness or user-turn-boundary treatment as evidence
  that final model input carried active Goal steering

Locked direction:

- use the shared classifier for pure Goal artifacts only
- preserve mixed messages and existing non-Goal contextual behavior
- keep history boundary logic as projection/history support, not cadence logic
- keep typed/materialized projection hiding separate from raw response item
  behavior owned by later WA05 passes

Exclusions:

- no request-input authority tests
- no compaction or rollout reconstruction conversion
- no app-server raw notification changes
- no evidence persistence or evidence materialization

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`

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
rollback boundary behavior precise. Pure current Goal internal context and
pure legacy `<goal_context>` are cleanup artifacts for these surfaces; mixed
ordinary prose remains visible and boundary-forming.

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
- If a text-level adapter is needed for contextual-user parsing, keep it
  semantically equivalent to whole-message purity for the caller. It must not
  become a broad substring predicate that hides marker-looking prose.
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
- Keep raw response item notification behavior out of this pass. Typed
  projection may hide pure artifacts, but raw notifications must remain raw
  until WA05f deletes the app-server raw overlay.
- Update contextual developer checks so pure Goal artifacts remain
  rollback-trimmable context while mixed developer content continues to
  invalidate reference context when existing behavior requires it.
- Update `ContextManager` boundary logic so pure current/legacy Goal artifacts
  are not ordinary user-turn boundaries, while mixed marker-like user messages
  remain boundaries.
- Do not add durable Goal fact reads, cadence selection, pending-intent reads,
  Continuation watermark checks, recorded-evidence writes, or rendered-text
  recovery to these modules.

## Tests And Checks

Use `local/how-we-test.md` and the cleanup triage doc. This pass should burn
down tests that defend active `<goal_context>`, active `GoalContextRole`,
user-role steering, projection hiddenness as authority, or implementation
sequence after those code paths are removed. Delete those fake-context tests
with no replacement by default. Keep or add focused projection/history-boundary
coverage only when this pass changes a real current contract and no existing
boundary validates it.

Only keep or add focused boundary cases when they protect a real current
projection/history contract and are not already covered:

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

Delete local-only fake-shim tests named by the cleanup triage doc unless one
contains the only useful assertion for a current durable contract. In that rare
case, keep only the boundary assertion and remove the old fake-shim transport
pressure. Do not preserve tests that require active `<goal_context>` behavior
or convert them one-for-one into classifier tests. Assertions should inspect
typed projection output, contextual parsing output, or history-boundary
behavior, not classifier matches alone. For docs/test-deletion-only work, diff
inspection is valid validation.

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
