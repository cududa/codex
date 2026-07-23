# WA05g: WA05 Test Surface And Cross-Checks

This pass burns down the old WA05 fake-shim test surface after the classifier,
projection, compaction, reconstruction, and app-server raw/materialized
consumers have been converted. It is not a replacement-test backlog.

## Direction Lock

Request:

- audit and remove WA05-owned tests that keep removed fake-shim code alive
- keep only focused classifier/projection/raw/reconstruction boundary coverage
  when a real current contract would otherwise be unvalidated
- keep cleanup tests separate from active Goal authority tests

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- local tests still name active `<goal_context>`, `GoalContextRole`, raw
  hiding, and concrete carry behavior
- WA02/WA04/WA06 own final request payload authority coverage
- WA05 owns deletion of tests that defend cleanup/projection/raw/
  reconstruction fake-shim behavior after the corresponding code is removed

Code-shape temptation:

- convert every old active steering test into a classifier test
- treat each removed fake-shim test as requiring a replacement test
- use helper output, classifier matches, raw notifications, rollout response
  items, or rendered Goal text as authority validation

Locked direction:

- WA05 removes old failed-prototype tests by default after their code paths are
  removed
- WA05 keeps or adds focused cleanup/projection/raw/reconstruction boundary
  coverage only when a real current contract remains and no existing boundary
  validates it
- final request-input authority is tested by request payload and shaper tests
  outside this pass unless a WA05 consumer directly changed shaper cleanup

Exclusions:

- no Rust implementation beyond test updates in a later implementation pass
- no new product behavior
- no global WA06 stale-symbol audit

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
- local old tests named by the cleanup triage doc

## Pass Goal

Burn down the WA05-owned fake-shim tests after consumer conversions, keeping
only the small boundary tests that protect real current cleanup contracts.

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
- any remaining local fake-shim test files named by the cleanup triage doc
  that are WA05-owned rather than WA06-owned

## Required Edits

- Start from deletion. Remove local tests that still require:
  - active `<goal_context>` steering
  - `GoalContextRole` role selection as active behavior
  - app-server raw hiding
  - concrete pre-shaper Goal `ResponseInputItem` carry through compaction
  - rendered marker text as authority or facts recovery
- Do not keep or adapt those tests unless one contains the only practical
  assertion for a real current durable contract after the old code path is
  removed.
- When a real contract still needs coverage, keep the smallest boundary:
  - classifier tests: classification, purity, source validation, fingerprints
  - projection/history tests: user-visible hiding, preservation, boundaries
  - compaction/reconstruction tests: cleanup, mixed-content preservation, no
    concrete carry, no rendered-text recovery
  - app-server raw tests: raw item emission equality and hook prompt raw
    behavior
- Ensure no retained test accepts these as active Goal authority or structured
  committed evidence substitutes:
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

Implementation validation should usually be diff inspection for test deletion
and low-risk cleanup. Run Rust tests only when retained or new boundary coverage
is actually changed and the cheapest useful filter is clear.

Candidate focused filters if a retained boundary test is changed:

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

- WA05-owned fake-shim tests have been removed by default
- any remaining WA05 tests protect real classifier/projection/raw/
  reconstruction cleanup contracts rather than failed prototype transport
  behavior
- old local tests no longer keep the fake active steering path alive through
  WA05-owned surfaces
- final acceptance and global stale-symbol audit remain WA06

## Non-Goals

- no new active Goal cadence tests
- no final acceptance declaration
- no upstream Goal product test deletion outside the cleanup triage doc
- no snapshot churn unless an owned test intentionally changes user-visible
  output
