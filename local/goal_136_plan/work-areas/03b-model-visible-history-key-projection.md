# Work Area 03b: Model Visible History Key Projection

This ordered pass adds the structured `ModelVisibleHistoryKey` and eligible
progress projection used by automatic Continuation duplicate suppression.

## Direction Lock

Request:

- add the WA03 history-key projection pass
- compute the key from model-visible request input, not `history_version()`
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`

Route context:

- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`

Terrain:

- `ContextManager::record_items(...)` appends model-visible items without
  bumping `history_version`
- `ContextManager::history_version()` is a rewrite counter
- `ContextManager::for_prompt(...)` produces the model-bound input consumed by
  the WA02 request-input shaper
- WA05 later owns the shared strict classifiers; this pass may use narrow
  temporary pure-item helpers only as projection support

Code-shape temptation:

- use `history_version()` as the suppression key
- compute the key from rollout counts, raw notifications, or UI projections
- let the automatic Continuation Goal item change the key that permits another
  Continuation

Locked direction:

- put the key and projection in `core/src/goal_cadence/`
- compute from the cleaned base input before the selected Goal item is
  inserted
- keep classifier use cleanup-only and subordinate to WA05's later shared
  classifier work

Exclusions:

- no idle scheduling
- no watermark mutation
- no Created-event commit
- no broad projection/raw-notification cleanup
- no recorded evidence carrier

## Code Terrain Read

Directly read:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/protocol/src/models.rs`
- `codex-rs/core/src/context/goal_context.rs` as current legacy terrain only

Observed facts:

- retries rebuild prompt input from `clone_history().for_prompt(...)`.
- ordinary history appends are invisible to `history_version()`.
- replacement history and compaction affect the prompt input that should feed
  the projection.
- current Goal-only helpers are deletion/cleanup terrain, not authority.

## Pass Goal

Add structured key data and deterministic projection helpers that can be used
by both automatic Continuation preflight and per-attempt request-input shaping.

## Exact Files To Edit

- `codex-rs/core/src/goal_cadence/mod.rs`
- `codex-rs/core/src/goal_cadence/history_key.rs`
- `codex-rs/core/src/goal_cadence/tests.rs` or colocated module tests

If `core/src/goal_cadence/` does not yet exist because WA02 has not been
implemented, create the private module directory in the WA02-compatible shape
expected by the WA02 pass docs.

## Required Edits

Add:

```rust
pub(crate) const MODEL_VISIBLE_HISTORY_KEY_SCHEMA_VERSION: u32 = 1;

pub(crate) struct ModelVisibleHistoryKey {
    pub schema_version: u32,
    pub eligible_progress_count: u64,
    pub eligible_progress_fingerprint: String,
    pub latest_eligible_progress_fingerprint: Option<String>,
    pub compaction_basis_fingerprint: Option<String>,
}
```

Add helpers equivalent to:

- `ModelVisibleHistoryKey::from_cleaned_base_input(input: &[ResponseItem])`
- `ModelVisibleHistoryKey::as_storage_key()`

Add private projection entries that serialize ordered eligible progress. Include
model-visible work items such as user messages, assistant messages, reasoning,
tool calls and outputs, local shell calls, search/image generation calls,
compaction items, and unknown model-visible placeholders that reach prompt
input.

Exclude:

- the automatic Continuation item being considered
- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts
- stale, duplicate, wrong-role, or pre-injected Goal-looking items removed by
  request-input cleanup
- pure contextual fragments that are not work progress
- raw notification counts
- typed/materialized projection counts
- helper output that never reached final request input

Whole-message purity controls exclusions. Mixed ordinary prose with marker-like
text remains eligible progress.

The key helper must not read durable Goal state, choose cadence, consume
pending intent, advance watermarks, or append evidence.

## Tests And Checks

Add focused unit tests:

- `goal_history_key_ignores_context_manager_history_version_alone`
- `goal_history_key_changes_for_user_assistant_and_tool_progress`
- `goal_history_key_ignores_current_goal_internal_context`
- `goal_history_key_ignores_legacy_goal_context`
- `goal_history_key_keeps_mixed_marker_like_prose`
- `goal_history_key_continuation_item_does_not_permit_next_continuation`
- `goal_history_key_compaction_changes_only_when_projection_changes`

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_history_key
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, `goal_cadence/` can compute a structured
`ModelVisibleHistoryKey` from cleaned prompt input. No lifecycle code should
yet rely on it until turn metadata, idle preflight, and Created-event commit
passes land.

This is not a standalone acceptance point.

## Non-Goals

This pass does not:

- use `ContextManager::history_version()` as the key
- decide whether Continuation is due
- store or mutate the watermark
- construct active Goal model input
- treat classifier output as authority
- use recorded evidence or rendered text as suppression state
