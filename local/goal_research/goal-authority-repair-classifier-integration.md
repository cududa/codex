# Goal Authority Repair And Classifier Integration

## Purpose

This document maps how strict Goal item classifiers integrate with repair,
cleanup, projection, compaction, and reconstruction.

Classifiers are cleanup tools. They do not decide cadence and they do not
prove authority.

Active Goal authority is still established only by final request-input shaping
placing or verifying exactly one selected current developer-role Goal
`ResponseItem` in the actual request input.

## Code Terrain

Current local classifier terrain is scattered:

- `codex-rs/core/src/context/goal_context.rs`
  - `GoalContext`
  - `GoalContextRole`
  - `is_goal_context_text`
  - `is_goal_context_response_item`
- `codex-rs/core/src/context/contextual_user_message.rs`
  - treats legacy Goal context as contextual user content
  - skips legacy Goal context while parsing hook prompt fragments
- `codex-rs/core/src/event_mapping.rs`
  - hides legacy Goal context from typed/materialized turn items
  - treats legacy Goal context as contextual developer content
- `codex-rs/core/src/context_manager/history.rs`
  - user-turn boundary detection depends on contextual message predicates
  - rollback trimming depends on contextual developer/user predicates
- `codex-rs/core/src/compact.rs`
  - user-message collection filters legacy Goal context
  - mid-turn compaction currently reinjects current-turn concrete Goal items
- `codex-rs/core/src/compact_remote.rs`
  - remote compaction output filtering drops legacy Goal context
  - mid-turn compaction currently includes current-turn concrete Goal items
- `codex-rs/core/src/compact_remote_v2.rs`
  - retains developer/user/system messages, then relies on shared compact
    filtering
- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - filters legacy Goal context from replacement history and rollout replay
- `codex-rs/app-server/src/bespoke_event_handling.rs`
  - has local raw-response suppression for legacy Goal context
- app-server typed/materialized history surfaces
  - rely on `codex_core::parse_turn_item(...)` and related projection helpers

The replacement must consolidate classification semantics while keeping
callsite behavior explicit.

## Classifier Outputs

The shared classifier must distinguish at least:

```text
GoalItemClassification =
  CurrentGoalInternalContext {
    role,
    source: "goal",
    body_fingerprint,
    is_pure_item,
  }
  LegacyGoalContextArtifact {
    role,
    body_fingerprint,
    is_pure_item,
  }
  NonGoalInternalContext {
    role,
    source,
    is_pure_item,
  }
  MixedOrOrdinary
```

`CurrentGoalInternalContext` identifies the new source-tagged Goal internal
context representation. It is not authority unless final request input also
contains the selected item as an outer developer-role message matching current
durable Goal facts.

`LegacyGoalContextArtifact` identifies old pure `<goal_context>` messages for
cleanup and projection only.

`MixedOrOrdinary` is the default for any message that contains ordinary prose
plus marker-like text.

## Purity Rules

A pure Goal/internal-context item must be:

- a `ResponseItem::Message`
- role `user` or `developer` for cleanup classification
- exactly one text content item
- text that wholly matches the current internal-context representation or
  legacy `<goal_context>` representation after trimming outer whitespace
- no mixed visible prose outside the recognized representation

Mixed content must not be hidden, dropped, deduplicated, or treated as Goal
authority merely because it contains marker-like text.

Wrong-role current Goal items may be classified for cleanup, but classification
must not make them valid authority. Final request-input shaping decides whether
to remove or replace them.

## Final Request-Input Repair

The only callsite that may use classifiers to repair active Goal authority is
the final request-input shaping path.

At that point classifiers may support:

- removing stale current Goal internal-context items
- removing duplicate current Goal items
- replacing wrong-role current Goal items with the selected developer-role item
- removing legacy `<goal_context>` artifacts from active request input
- reporting repair details for tests and diagnostics

Classifiers must not:

- select Initial, ObjectiveUpdated, BudgetLimit, or Continuation
- consume pending cadence intent
- advance Continuation suppression
- infer active Goal state
- parse rendered objective text
- create durable Goal facts

## Event Mapping And Typed Projection

Files:

- `codex-rs/core/src/event_mapping.rs`
- app-server typed/materialized turn projection surfaces that call
  `codex_core::parse_turn_item(...)`

Required behavior:

- omit pure current Goal internal-context items from typed/materialized
  user-visible turn items
- omit pure legacy `<goal_context>` artifacts from typed/materialized
  user-visible turn items
- keep mixed ordinary user/developer prose visible
- do not treat projection hiding as proof of Goal authority
- do not add special suppression to raw response item notifications

The app-server local raw-response Goal suppression in
`bespoke_event_handling.rs` is local behavior to remove, not a preservation
baseline.

## Contextual Parsing And History Boundaries

Files:

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context_manager/history.rs`

Required behavior:

- pure current Goal internal-context items do not become ordinary user-turn
  boundaries
- pure legacy `<goal_context>` artifacts do not become ordinary user-turn
  boundaries
- ordinary user messages still count as user-turn boundaries
- rollback trimming may remove pure contextual Goal/internal-context fragments
  when they sit in rollback-trimmable context positions
- mixed messages must remain ordinary messages

These predicates are projection and history-shaping support. They are not
cadence predicates.

## Compaction

Files:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`

Required behavior:

- pure legacy `<goal_context>` artifacts are filtered from compacted history
- stale or duplicate pure current Goal internal-context items are filtered when
  they are not the selected current cadence item for the final request
- mid-turn compaction preserves only committed Goal carry metadata for an item
  already included in final request input
- compaction must not carry pre-finalizer concrete Goal `ResponseInputItem`s as
  authority
- compaction must not turn active durable Goal state alone into a new Goal item

Compaction repair of a cadence-required Goal item is request-local unless
structured reconstruction proves a previously recorded cadence item was lost.

## Rollout Reconstruction, Rollback, And Fork

Files:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- rollback/fork callers that use reconstructed history

Required behavior:

- filter pure legacy `<goal_context>` artifacts from replacement history and
  replayed rollout response items
- filter or deduplicate pure current Goal internal-context items according to
  final request-input repair rules
- preserve mixed ordinary messages
- never reconstruct active Goal facts, pending cadence intent, or current
  objective text by parsing rendered Goal artifacts
- if structured committed Goal metadata says a recorded cadence item was lost,
  repair may reconstruct that recorded item according to the cadence contract

## Raw Response Notifications

Files:

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- raw response item notification tests

Required behavior:

- raw response item notifications remain raw
- do not suppress current Goal internal-context raw items specially
- do not suppress legacy `<goal_context>` raw items specially unless the
  general raw-response contract changes for all hidden/internal items
- typed/materialized projections may hide pure Goal context; raw notifications
  must not use that hiding rule

The current local test that expects raw Goal suppression should be deleted or
rewritten according to `goal-test-deletion-map.md`.

## Classifier Ownership

Preferred ownership:

```text
generic internal-context code:
  source validation
  current internal-context rendering
  pure internal-context parsing
  source extraction

legacy Goal artifact code:
  pure `<goal_context>` detection only

Goal cadence/final request-input shaping:
  current durable Goal matching
  stale/wrong-role/duplicate cleanup decisions
  repair report construction
  commit metadata construction
```

Do not place cadence decisions in generic classifier code.

## Tests

Focused tests must prove:

- pure current Goal internal-context item is classified by source `goal`
- pure legacy `<goal_context>` item is classified as legacy artifact
- non-Goal internal context is not classified as Goal
- mixed marker-like ordinary prose is preserved
- user-role current Goal internal context is cleanup-classified but not valid
  authority
- duplicate current Goal items are cleaned in final request-input shaping
- wrong-role current Goal item is replaced only when cadence-required authority
  is due
- typed/materialized projections hide pure current and legacy Goal items
- raw response item notifications emit Goal items unchanged
- compaction filters pure legacy artifacts without creating Goal steering
- rollout reconstruction filters pure legacy artifacts without recovering Goal
  state
- current-turn carry contains committed metadata, not prebuilt model input
