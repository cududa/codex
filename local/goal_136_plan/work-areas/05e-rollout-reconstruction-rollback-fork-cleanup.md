# WA05e: Rollout Reconstruction, Rollback, And Fork Cleanup

This pass converts rollout reconstruction, rollback, and fork cleanup to use
the shared classifier and to reject rendered-text recovery. Reconstruction may
filter or route pure artifacts, but it must not recover active Goal facts,
pending intent, cadence, committed carry, structured evidence, or Continuation
suppression from ordinary history artifacts.

## Direction Lock

Request:

- convert rollout reconstruction and rollback/fork cleanup behavior
- preserve mixed ordinary messages
- keep structured evidence metadata-only if it is in scope

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- `rollout_reconstruction.rs::filter_goal_context_response_items(...)`
  filters only old pure legacy Goal context
- replay currently skips old pure legacy Goal context response items
- legacy compactions without `replacement_history` rebuild history through
  `compact::collect_user_messages(...)` and
  `compact::build_compacted_history(...)`, so this pass depends on WA05d's
  classifier-backed compaction helpers for that fallback path
- rollback/fork rebuild surviving history from rollout suffix and compaction
  checkpoints
- v140 typed replay materializes `InterAgentCommunication` into model input,
  but Goal request evidence must not copy that materialization shape
- evidence/carry may be absent in the target branch; absence is not permission
  to parse rendered Goal text as a fallback

Code-shape temptation:

- reconstruct active Goal facts or cadence from rendered Goal text in history
- accept ordinary rollout `ResponseItem`, rollout trace, classifier match, or
  raw notification as structured commit evidence
- copy v140 typed replay materialization so Goal evidence becomes model input

Locked direction:

- filter pure artifacts and preserve mixed messages
- use structured committed evidence only as metadata and only with fingerprint
  pairing when the evidence carrier exists
- never recover active Goal facts, pending intent, or Continuation suppression
  by parsing rendered Goal text
- when evidence/carry is unavailable, leave recorded-history repair to WA06
  acceptance instead of inventing unstructured reconstruction

Exclusions:

- no evidence carrier implementation unless already provided by WA02/WA03
- no new compaction conversion beyond depending on WA05d's already-converted
  helper behavior for legacy compaction fallback replay
- no app-server raw behavior change

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`

## Code Terrain Read

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- rollback/fork integration tests only if helper-level coverage is insufficient
- `rust-v0.140.0:codex-rs/core/src/session/rollout_reconstruction.rs`

## Pass Goal

Convert reconstruction cleanup from old Goal marker filtering to strict
current/legacy artifact classification while maintaining replay and rollback
boundaries. Rollback and fork operate on surviving history plus durable state
or explicitly supported evidence-derived metadata, not on rendered Goal
artifacts from discarded or unrelated history.

## Exact Files To Edit

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- focused rollback/fork tests only if needed

## Required Edits

- Replace `filter_goal_context_response_items(...)` with a classifier-backed
  filter for pure current Goal internal-context items and pure legacy
  `<goal_context>` artifacts.
- Apply the same strict filtering to replacement history and replayed rollout
  `ResponseItem`s where they are cleanup artifacts.
- For legacy compactions without `replacement_history`, rely on the WA05d
  classifier-backed `collect_user_messages(...)` path before rebuilding
  compacted history. If WA05d has not converted that helper yet, stop and fix
  ordering instead of keeping a stale reconstruction-only fallback.
- Preserve mixed ordinary messages, including marker-like prose.
- Do not reconstruct current Goal facts, objective text, pending cadence
  intent, cadence kind, or Continuation watermark state from rendered text.
- If structured committed Goal request evidence exists in the target branch,
  require pairing by item fingerprint and surviving history before treating it
  as replay metadata.
- If structured evidence is not available, leave recorded-history repair as a
  later WA06 acceptance item. Do not fall back to rendered text parsing.
- Keep rollback/fork behavior based on surviving history and durable state, not
  on old rendered Goal artifacts.
- Ignore rolled-back evidence and evidence whose paired model-visible Goal item
  no longer survives the reconstruction/rollback/fork boundary.
- Do not materialize structured evidence as a `ResponseItem`, hook prompt, raw
  notification, typed projection item, or model input.

## Tests And Checks

Use `local/how-we-test.md` and the cleanup triage doc. This pass should burn
down tests that defend rendered-text recovery, ordinary rollout artifacts,
classifier matches, raw notifications, or fake-shim evidence substitutes after
those code paths are removed. Delete old rendered-text recovery or fake-shim
tests with no replacement by default. Keep or add focused
reconstruction/rollback/fork boundary coverage only where a current cleanup
contract remains and no existing boundary validates it; do not create tests
just to confirm old tests were removed.

Only keep or add focused boundary cases when they protect a real current
reconstruction/rollback/fork cleanup contract and are not already covered:

- reconstruction filters pure current Goal internal-context items
- reconstruction filters pure legacy `<goal_context>` artifacts
- reconstruction preserves mixed marker-like messages
- legacy compaction-without-replacement-history replay uses the same
  classifier-backed compaction helper behavior as WA05d
- reconstruction does not recover Goal state from legacy text
- rollback/fork ignore artifacts outside surviving history
- ordinary rollout `ResponseItem`, rollout trace payload, raw notification,
  classifier match, and rendered Goal text are rejected as substitutes for
  structured committed Goal request evidence
- if structured evidence is available, reconstruction pairs evidence by
  fingerprint before using it as metadata

Assertions should inspect reconstructed history, surviving-history boundaries,
or metadata pairing outcomes. They should not rely on classifier matches or
rendered Goal text alone as validation. For docs/test-deletion-only work, diff
inspection is valid validation.

## Branch Continuation State

After this pass:

- reconstruction cleanup no longer depends on old active Goal marker helpers
- rendered artifacts cannot recover active Goal state or cadence metadata
- evidence-backed recorded repair may still be deferred if the structured
  carrier is not present
- WA06 still owns global stale-symbol and final acceptance audit

## Non-Goals

- no app-server materialized thread-history conversion
- no compaction replacement-history conversion
- no evidence carrier or persistence design
- no durable Goal state mutation
- no request-input selection changes
