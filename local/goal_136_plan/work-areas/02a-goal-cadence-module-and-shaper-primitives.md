# Work Area 02a: Goal Cadence Module And Shaper Primitives

This ordered pass creates the private core module and pure data shapes for final
request-input Goal authority. It does not wire the shaper into the request loop
and it does not consume pending intent.

## Direction Lock

Request:

- start Work Area 02 by adding the core request-input shaping module
- define commit metadata, fingerprints, repair reporting, context, and pure
  finalization outcome types
- keep the pass as executable as possible without pretending the branch is
  fully usable after this slice

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`

Terrain:

- `codex-rs/core/src/lib.rs` is the module declaration owner.
- `codex-rs/core/src/goal_cadence/` does not exist yet.
- `codex-rs/core/src/client_common.rs` proves `Prompt.input` is the final
  model request input.
- `codex-rs/core/src/client.rs` copies `Prompt.input` into
  `ResponsesApiRequest.input` for HTTP and WebSocket paths.
- `codex-rs/codex-api/src/common.rs` carries `ResponsesApiRequest.input` and
  `ResponseCreateWsRequest.input` as `Vec<ResponseItem>`.
- Work Area 01 state exposes durable facts snapshots, pending intent, and
  exact-key intent consumption.

Code-shape temptation:

- put final request shaping in `goals.rs` because Goal prompt helpers are there
- create no-op scaffolding without the commit identity fields later passes need
- let classifier, rollout text, raw notifications, or rendered Goal text stand
  in for final request evidence

Locked direction:

- `codex-rs/core/src/goal_cadence/` owns request-local Goal cadence selection,
  cleanup, developer-role item construction, fingerprints, and inert commit
  metadata
- `goals.rs` remains a lifecycle/tool/app-server adapter and prompt-body helper
- shaper output is pure data; pending intent is not consumed until the
  Created-event commit pass

Exclusions:

- no request-loop wiring
- no Created-event side effects
- no automatic Continuation selection, reservation, or watermarking
- no `ext/goal` conversion
- no broad classifier/projection/raw/compaction cleanup
- no user-role active Goal steering compatibility

## Code Terrain Read

Directly read:

- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/codex-api/src/common.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/context/goal_context.rs`
- Work Area 01 state APIs in `codex-rs/state/src/runtime/goals.rs`

Observed facts:

- final request input is the `Vec<ResponseItem>` passed to `build_prompt(...)`
  and copied unchanged into `Prompt.input`.
- `Prompt::get_formatted_input()` clones `Prompt.input`.
- old Goal steering is wrong because it creates concrete Goal-looking model
  input before final cadence selection and commit, not because developer role
  is mechanically lost.
- current rollout history has no typed Goal request evidence carrier.

## Pass Goal

Add the core-private request-input cadence module and pure types needed by the
later shaper, retry-loop wiring, Created-event commit, committed carry, and
final-payload tests.

## Exact Files To Edit

- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/goal_cadence/mod.rs`
- optional private files under `codex-rs/core/src/goal_cadence/`, such as
  `prompt.rs`, `repair.rs`, or `fingerprint.rs`

## Required Edits

Add:

```rust
mod goal_cadence;
```

Define core-private types equivalent to:

```rust
pub(crate) enum GoalCadenceKind {
    Initial,
    ObjectiveUpdated,
    BudgetLimit,
    Continuation,
}

pub(crate) enum GoalItemPlacement {
    Inserted,
    VerifiedExisting,
}

pub(crate) struct GoalItemFingerprint {
    // Stable digest or structured fields for the exact final Goal item.
}

pub(crate) struct GoalRequestInputFingerprint {
    // Stable digest or structured fields for the finalized logical input.
}

pub(crate) struct GoalRequestCommit {
    pub thread_id: ThreadId,
    pub turn_id: String,
    pub attempt_ordinal: u64,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
    pub request_input_fingerprint: GoalRequestInputFingerprint,
    pub item_index: usize,
    pub placement: GoalItemPlacement,
    pub item: ResponseItem,
}

pub(crate) struct GoalRepairReport {
    pub removed_legacy_goal_context_items: usize,
    pub removed_wrong_role_goal_items: usize,
    pub removed_duplicate_goal_items: usize,
    pub removed_stale_goal_items: usize,
}

pub(crate) struct FinalizedGoalRequestInput {
    pub input: Vec<ResponseItem>,
    pub commit: Option<GoalRequestCommit>,
    pub repair_report: GoalRepairReport,
}

pub(crate) enum GoalFinalizationOutcome {
    Submit(FinalizedGoalRequestInput),
    AbortSyntheticGoalTurn,
}
```

Add `GoalRequestContext` with the logical fields needed by later passes:

- thread id
- turn id
- attempt ordinal
- current durable Goal cadence snapshot
- optional turn request metadata that asks selection to rerun from fresh facts
- optional automatic Continuation request, initially always absent in Work Area
  02
- optional model-visible history key
- Goals feature and collaboration-mode eligibility facts
- request/transport diagnostics and request-local repair context

`GoalRequestContext` must not contain `&Session`, `StateDbHandle`, or
`TurnContext`; `session/turn.rs` assembles it later.

Semantic constraints:

- `GoalRequestCommit` refers to the exact `ResponseItem` in final request input.
- `attempt_ordinal` is allocated immediately before shaping and reused by the
  Created-event commit handler.
- `item_index`, `item_fingerprint`, and `request_input_fingerprint` identify
  the finalized logical `Vec<ResponseItem>`.
- `item` is a finalized `ResponseItem`, not a pre-request-shaping
  `ResponseInputItem`.
- `VerifiedExisting` is valid only when the cleaned request input already
  contains exactly one selected current developer-role Goal item matching the
  durable facts and cadence kind.
- `model_visible_history_key` may be `None` only for non-Continuation commits
  before Work Area 03; Continuation commits require a real key.
- `commit_point` and `committed_at_ms` are not shaper outputs. The Created-event
  commit handler adds them when it materializes typed evidence.

## Tests And Checks

Add focused pure tests only if the implementation introduces nontrivial
fingerprint or repair-report logic in this pass.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_cadence
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

These checks are the local confidence bar for the 02a slice. The route does not
need to produce a generally usable product runtime or broad test pass after
this pass.

## Branch Continuation State

After this pass, the branch should have the `goal_cadence` module and pure
types needed by later Work Area 02 passes. No request attempt is shaped yet, no
pending intent is consumed, and no producer conversion has happened.

The next pass, 02b, wires pure shaping and cleanup behavior into the module.

## Non-Goals

This pass does not:

- wire `run_sampling_request(...)`
- consume pending intent
- commit on `ResponseEvent::Created`
- append typed request evidence
- store committed current-turn carry
- convert core producers
- render or preserve `<goal_context>`
- implement automatic Continuation
- convert `ext/goal`
