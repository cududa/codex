# Work Area 03c: Goal Turn Request Metadata

This ordered pass adds metadata-only turn requests that let idle and same-turn
paths ask the WA02 request-input shaper to re-evaluate Goal cadence. The
metadata is not model input.

## Direction Lock

Request:

- split out the `GoalTurnRequest` metadata dependency discovered in the WA03
  appendage map
- replace WA03-owned concrete Goal input carry with metadata plumbing
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`

Route context:

- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`

Terrain:

- `TurnState` currently stores concrete `GoalSteeringCarryItem` values with
  `ResponseInputItem`
- `InputQueue::extend_goal_pending_input_for_turn_state(...)` and
  `inject_goal_response_items(...)` append prebuilt model input
- WA02 is expected to define `GoalRequestContext` and a submit-or-internal-abort
  outcome

Code-shape temptation:

- store rendered Goal prompt text in turn state
- keep concrete `ResponseInputItem` carry because compaction still reads it
- let same-turn metadata guarantee the originally requested kind instead of
  forcing a fresh durable-facts selection

Locked direction:

- add metadata-only `GoalTurnRequest` storage and adapters
- pass metadata into the request-input shaper context
- keep current-turn committed carry separate from uncommitted turn requests

Exclusions:

- no prebuilt `ResponseItem` or `ResponseInputItem`
- no rendered Goal prompt body
- no pending Continuation intent
- no idle scheduling behavior beyond metadata storage
- no Created-event commit side effects

## Code Terrain Read

Directly read:

- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs` for public adapter pressure

Observed facts:

- local turn state carries concrete Goal input before final request shaping.
- input queue helpers mix request metadata, pending model input, and carry.
- the request loop can read turn metadata per attempt only after WA02 adds the
  request context assembly point.
- same-turn and idle paths need one vocabulary but different lifecycle rules.

## Pass Goal

Add the typed metadata and adapters that later idle delivery and automatic
Continuation passes will use:

```rust
pub(crate) enum GoalTurnRequest {
    SameTurnCadenceRecheck(GoalPendingCadenceDelivery),
    IdlePendingCadence(GoalPendingCadenceDelivery),
    IdleAutomaticContinuation(GoalAutomaticContinuationRequest),
}
```

## Exact Files To Edit

- `codex-rs/core/src/goal_cadence/mod.rs`
- `codex-rs/core/src/goal_cadence/turn_request.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/codex_thread.rs` only if a public adapter is needed for
  same-turn recheck requests

## Required Edits

Add metadata types equivalent to:

```rust
pub(crate) struct GoalPendingCadenceDelivery {
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
}

pub(crate) struct GoalAutomaticContinuationRequest {
    pub goal_id: String,
    pub facts_version: i64,
    pub preflight_history_key: ModelVisibleHistoryKey,
}
```

Add turn-state accessors equivalent to:

- `TurnState::set_goal_turn_request(...)`
- `TurnState::goal_turn_request(...)`
- `TurnState::clear_goal_turn_request(...)`
- `Session::set_goal_turn_request_for_reserved_turn(...)`
- `Session::goal_turn_request_for_turn(...)`

Extend the WA02 `GoalRequestContext` assembly so each request attempt receives:

- fresh `ThreadGoalCadenceSnapshot`
- optional `GoalTurnRequest`
- latest Continuation watermark from state when available

Lifecycle rules:

- same-turn metadata asks for a fresh cadence recheck; it does not guarantee
  that the originally requested kind is delivered
- idle metadata exists only on Goal-owned reserved synthetic turns
- metadata survives retry before `ResponseEvent::Created`
- metadata is cleared or marked obsolete when `ResponseEvent::Created` commit
  records committed carry for the selected Goal item; post-commit same-turn
  follow-up attempts use fresh durable snapshots plus committed carry, not the
  stale `GoalTurnRequest`
- metadata is cleared when the active turn is cleared or a synthetic turn
  aborts before submit
- uncommitted metadata is not current-turn carry and must not support mid-turn
  compaction as authority

Do not delete old concrete injection helpers in this pass unless every caller
has been converted. WA06 owns final dead-code deletion.

## Tests And Checks

Add focused unit tests near turn state or input queue:

- `goal_turn_request_metadata_round_trips_without_pending_model_input`
- `goal_turn_request_metadata_survives_retry_until_cleared`
- `goal_turn_request_metadata_obsolete_after_created_commit`
- `goal_turn_request_metadata_cleared_with_active_turn`
- `goal_turn_request_metadata_is_not_committed_carry`

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_turn_request
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, the branch has a metadata route for WA03-owned Goal work, but
idle pending-intent delivery and automatic Continuation may still be inactive
or incomplete until later passes use the metadata.

Later Created-event commit wiring must convert successful delivery into
committed carry metadata and clear or obsolete the uncommitted
`GoalTurnRequest` so same-turn follow-up attempts do not replay stale
synthetic cadence requests.

This pass does not need to leave the whole Goal rewrite working.

## Non-Goals

This pass does not:

- select a pending intent
- launch an automatic Continuation
- consume pending intent
- advance the Continuation watermark
- construct active Goal model input
- finish compaction carry cleanup
- convert `ext/goal`
