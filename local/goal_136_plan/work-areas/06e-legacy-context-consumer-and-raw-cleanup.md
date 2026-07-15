# WA06e Legacy Context Consumer And Raw Cleanup

This pass deletes the core `GoalContext` active shim and finishes WA05
consumer/raw leftovers after classifier/projection replacements exist.

## Direction Lock

- Request: remove legacy active context shim and consumer leftovers.
- Authority: classifiers/projections are cleanup-only; raw response item
  notifications remain raw; final request input remains active Goal authority.
- Terrain: local context, event mapping, history, compaction, reconstruction,
  app-server raw handling, and protocol projection still contain legacy marker
  handling.
- Upstream terrain: v136 raw path emits raw items directly; v140 typed replay is
  metadata-carrier precedent only.
- Code-shape temptation: keep `GoalContext` as a shared active helper or move
  app-server raw hiding behind a renamed parser.
- Locked direction: legacy marker handling survives only as WA05 classifier,
  projection, compaction, reconstruction, or raw test fixture terrain.
- Exclusions: no cadence selection, state mutation, pending intent consumption,
  watermark advancement, or evidence write from classifiers.

## Authority Docs Read

- `goal-authority-grounding-truth.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-model-visible-history-key.md`
- `goal-authority-recorded-request-evidence.md`
- `goal-authority-repair-classifier-integration.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-test-deletion-map.md`
- WA05 parent, surface map, and pass docs
- `06a-final-precondition-and-reachability-audit.md`
- `06-cleanup-and-acceptance.md`

## Code Terrain Read

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/context/internal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- related classifier/projection/raw/compaction/reconstruction tests

## Pass Goal

Remove `GoalContext` as active architecture while preserving only the strict
cleanup/projection behavior introduced by WA05.

## Exact Files To Edit

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/context/internal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- related tests

## Required Edits

1. Delete or fully retire `context/goal_context.rs`:
   - remove `GoalContext`
   - remove `GoalContextRole`
   - remove active marker rendering
   - remove conversion to prebuilt model input
   - remove exported `is_goal_context_*` helpers

2. Move any still-valid legacy marker detection to WA05 classifier ownership:
   - whole-message purity only
   - pure legacy artifact detection only
   - mixed marker-like prose preserved
   - cleanup/projection naming, not authority-shaped naming

3. Update contextual user parsing:
   - remove `GoalContext` as a contextual user fragment
   - preserve standard contextual-user behavior
   - preserve mixed ordinary prose

4. Update event mapping and materialized projection:
   - hide only pure current internal-context and pure legacy artifacts
   - do not parse rendered Goal text into facts, cadence, commit status, or
     Continuation suppression
   - do not materialize evidence metadata as conversation prose

5. Update history, compaction, and reconstruction consumers:
   - use WA05 classifier helpers
   - do not carry pre-shaper concrete Goal input through replacement history
   - do not reconstruct active Goal facts from rendered text
   - preserve mixed ordinary messages

6. Finish app-server raw cleanup:
   - raw response item notifications emit actual Goal-looking raw items
   - remove app-server-local marker parser
   - keep typed/materialized projection hiding separate from raw behavior
   - audit preview and summary projection routes that materialize
     `codex_core::parse_turn_item(...)` output; they should inherit core
     projection behavior and must not add app-server-only Goal parsing

7. Update tests:
   - rewrite classifier/projection/raw/compaction/reconstruction tests to use
     WA05 helper semantics
   - delete tests that defend active marker transport
   - keep raw equality tests for pure current, pure legacy, and mixed items
   - include app-server preview/summary projection tests when those routes
     expose mixed marker-like prose through `parse_turn_item(...)`

## Tests And Checks

Focused tests:

- classifier purity tests
- contextual parsing tests
- event mapping and thread-history projection tests
- history boundary tests
- compaction and reconstruction tests
- app-server raw item notification tests

Audits:

```powershell
rg -n "GoalContext|GoalContextRole|is_goal_context|<goal_context>" codex-rs/core/src codex-rs/app-server/src codex-rs/app-server-protocol/src
rg -n "RawResponseItemCompleted|maybe_emit_raw_response_item_completed" codex-rs/app-server/src codex-rs/app-server-protocol/src
rg -n "parse_turn_item|goal_context|<goal_context>" codex-rs/app-server/src/request_processors codex-rs/app-server-protocol/src/protocol
```

Remaining legacy marker hits must be classifier fixtures or projection tests
that explicitly preserve cleanup-only boundaries. App-server request-processor
hits are valid only when they inherit core projection behavior without adding a
Goal-specific marker parser.

## Branch Continuation State

After this pass:

- `GoalContext` is not active production architecture
- legacy marker handling is owned by WA05 classifier/projection cleanup
- raw notifications are raw
- compaction/reconstruction do not recover Goal authority from text
- app-server does not have an app-server-only Goal marker parser

## Non-Goals

- Do not change final request-input shaping or cadence selection.
- Do not write recorded request evidence from classifier/projection paths.
- Do not delete final acceptance tests; 06g owns acceptance.
- Do not remove valid legacy fixture strings needed to prove cleanup behavior.
