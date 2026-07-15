# WA05g: WA05 Test Surface And Cross-Checks

This pass consolidates WA05-focused tests after the classifier, projection,
compaction, reconstruction, and app-server raw/materialized consumers have
been converted.

## Direction Lock

Request:

- audit and complete WA05-focused test coverage
- keep classifier/projection/raw/reconstruction tests separate from active
  Goal authority tests

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- local tests still name active `<goal_context>`, `GoalContextRole`, raw
  hiding, and concrete carry behavior
- WA00 owns initial false-pressure test deletion
- WA02/WA04/WA06 own final request payload authority coverage
- WA05 owns cleanup/projection/raw/reconstruction behavior

Code-shape temptation:

- convert every old active steering test into a classifier test
- use helper output, classifier matches, raw notifications, rollout response
  items, or rendered Goal text as proof that active Goal authority reached the
  model

Locked direction:

- WA05 tests prove cleanup and projection behavior only
- final request-input authority is tested by request payload and shaper tests
  outside this pass unless a WA05 consumer directly changed shaper cleanup

Exclusions:

- no Rust implementation beyond test updates in a later implementation pass
- no new product behavior
- no global WA06 stale-symbol audit

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Code Terrain Read

- `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`, for
  preview/materialized routes that call `codex_core::parse_turn_item(...)`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`, for
  summary/materialized routes that call `codex_core::parse_turn_item(...)`
- local old tests named by `local/goal_research/goal-test-deletion-map.md`

## Pass Goal

Make the WA05 test surface complete and correctly layered after the consumer
conversions.

## Exact Files To Edit

- classifier tests near `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- app-server request processor or summary tests only if materialized
  projection behavior through `codex_core::parse_turn_item(...)` is exposed
  there
- any remaining local fake-shim test files named by
  `goal-test-deletion-map.md` that are WA05-owned rather than WA06-owned

## Required Edits

- Verify every WA05 consumer conversion added focused tests for the behavior it
  changed.
- Remove or rewrite local tests that still require:
  - active `<goal_context>` steering
  - `GoalContextRole` role selection as active behavior
  - app-server raw hiding
  - concrete pre-shaper Goal `ResponseInputItem` carry through compaction
  - rendered marker text as authority or facts recovery
- Keep classifier tests limited to classification, purity, source validation,
  and fingerprints.
- Keep projection/history tests limited to user-visible hiding,
  preservation, and turn-boundary behavior.
- Keep compaction/reconstruction tests limited to cleanup, mixed-content
  preservation, no concrete carry, and no rendered-text recovery.
- Keep app-server raw tests limited to raw item emission equality and hook
  prompt raw behavior.
- Ensure tests reject these as active Goal authority or structured committed
  evidence substitutes:
  - helper output
  - ordinary rollout `ResponseItem`
  - rollout trace payload
  - raw notification
  - classifier match
  - rendered Goal text
- Do not duplicate final `/responses` payload tests that WA02, WA04, or WA06
  already own, except where a WA05 request-input cleanup path directly needs a
  final-input assertion.

## Tests And Checks

Focused validation candidates for the later implementation pass:

- `cargo test -p codex-core --lib goal_artifact`
- `cargo test -p codex-core --lib goal_artifact_projection`
- `cargo test -p codex-core --lib goal_artifact_compaction`
- `cargo test -p codex-core --lib goal_artifact_reconstruction`
- `cargo test -p codex-app-server --lib raw_response_item`
- `cargo test -p codex-app-server-protocol --lib goal_artifact`

Do not run broad Rust suites by default. Follow root `AGENTS.md` and
`local/how-we-test.md` for implementation validation.

## Branch Continuation State

After this pass:

- WA05 has focused coverage for classifier/projection/raw/reconstruction
  behavior
- old local tests no longer keep the fake active steering path alive through
  WA05-owned surfaces
- final rewrite acceptance and global stale-symbol audit remain WA06

## Non-Goals

- no new active Goal cadence tests
- no final acceptance declaration
- no upstream Goal product test deletion outside the test deletion map
- no snapshot churn unless an owned test intentionally changes user-visible
  output
