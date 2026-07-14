# Batch 02c: Pending Intent Selection And Insertion

This slice makes the finalizer select durable pending Initial,
ObjectiveUpdated, and BudgetLimit intent, then insert exactly one current
developer-role Goal item into final request input.

It depends on the module seam from 02a and per-attempt wiring from 02b. It does
not consume pending intent; 02d owns commit.

## Direction Lock

Request:

- split Batch 02 so cadence selection and final request-input insertion are
  separate from Created commit and producer conversion
- keep final request input as the only active Goal authority
- make the slice implementable from direct code and docs

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01b-pending-cadence-intent-storage.md`
- `local/goal_136_plan/batches/01c-cadence-aware-store-operations.md`
- `local/goal_136_plan/batches/02a-goal-cadence-module-types.md`
- `local/goal_136_plan/batches/02b-per-attempt-finalizer-wiring.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- Batch 01 state APIs provide facts, pending intent snapshots, and exact-key
  consumption.
- `goal_cadence.rs` is the only module that should construct final active
  Goal `ResponseItem`s.
- `run_sampling_request(...)` now passes finalized input to `build_prompt(...)`
  on every attempt.
- `goals.rs` still has prompt-body helpers but must not own final request
  input authority.
- old current-turn injection can still put pre-injected Goal-looking items in
  history/pending input until 02e converts producers.

Code-shape temptation:

- treat any active durable Goal as due
- trust old pre-injected `ResponseInputItem`s when they happen to be
  developer-role
- consume pending intent as soon as an item is inserted
- parse rendered Goal text to identify current facts
- make classifier output prove authority

Locked direction:

- select only durable pending BudgetLimit, ObjectiveUpdated, or Initial intent
  in the required priority order
- render from current durable Goal facts
- clean stale/wrong-role/duplicate/pre-injected Goal-looking items locally in
  final request input
- insert or verify exactly one selected outer developer-role `ResponseItem`
- return inert commit metadata for 02d

Exclusions:

- no pending-intent consumption
- no Created commit
- no committed carry metadata
- no core producer conversion
- no automatic Continuation
- no broad projection/raw/compaction classifier rewrite

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/tests/common/responses.rs`

Findings to preserve:

- `GoalSteeringMessage::into_response_input_item(...)` currently routes
  through `GoalContext`.
- `GoalContext` supports user or developer roles, but user-role active Goal
  steering is forbidden.
- `TurnState` stores old concrete Goal carry by purpose.
- Batch 02 cleanup is request-local and must require whole-message purity.

## Prerequisites And Dependencies

Required:

- 01a/01b/01c durable cadence state exists.
- 02a module/types exist.
- 02b per-attempt finalizer wiring exists.

This slice can land before 02d only if pending intent remains pending after
requests, and the branch is clearly incomplete until Created commit exists.

## Exact Files To Edit

Expected edits:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs` only for prompt-body helper visibility
- `codex-rs/core/tests/common/responses.rs` if helper inspection is needed

Possible tests:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`

## Required Edits

### 1. Read Durable Cadence Snapshot

The finalizer attempt context must include a current durable cadence snapshot:

- current `ThreadGoal`
- `facts_version`
- pending Initial / ObjectiveUpdated / BudgetLimit intents

Use Batch 01 state APIs such as:

```rust
get_thread_goal_with_cadence(thread_id)
```

Rules:

- if Goals are disabled or collaboration mode disallows Goal steering for this
  attempt, select no Goal item and consume nothing
- if the thread is ephemeral or state DB is unavailable, select no Goal item
- if no durable Goal exists, select no Goal item
- if no pending intent exists and no Continuation request exists, select no
  Goal item
- active durable Goal state alone selects nothing
- feature/collaboration eligibility gates delivery, but does not prove cadence
  authority by itself

### 2. Select Pending Intent By Priority

Implement selection order:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

For this slice:

- BudgetLimit, ObjectiveUpdated, and Initial may be selected from durable
  pending intent
- Continuation remains inactive until Batch 03

Selection requirements:

- intent `goal_id` must match the current durable Goal
- intent `facts_version` must match the current durable facts version unless a
  documented supersedence rule applies
- the attempt must be feature-enabled and collaboration-eligible for active
  Goal steering
- BudgetLimit may supersede stale Initial/ObjectiveUpdated for the same Goal
  at commit time, but this slice must not consume anything yet
- stale pending intent must not produce a model-visible item

### 3. Render From Durable Facts

Render selected Goal prompt body from durable state:

- Initial from current durable Goal objective, status, budget, and usage
- ObjectiveUpdated from current durable Goal objective and budget/usage
- BudgetLimit from current durable Goal status/usage and objective

Use small prompt-body helpers from `goals.rs` if they are kept, or move/copy
private helpers into `goal_cadence.rs` if that keeps ownership clearer.

Do not render from:

- tool request body
- app-server request body
- rendered old Goal item
- `<goal_context>`
- UI projection

### 4. Construct Developer-Role Final ResponseItem

Create the active item in `goal_cadence.rs`.

Required logical shape:

```text
ResponseItem::Message {
  role: "developer",
  content: [ContentItem::InputText {
    text: render_internal_context(source = "goal", body = rendered_goal_prompt)
  }]
}
```

Requirements:

- outer role is always `developer`
- text identifies `source = "goal"` using the current internal-context
  representation
- text does not use `<goal_context>`
- objective is escaped as untrusted text
- no `ResponseInputItem` is used as authority

### 5. Clean Existing Goal-Looking Items In Final Input

Before inserting the selected item, inspect `base_input`.

For pure whole-message Goal-looking items:

- remove pure legacy `<goal_context>` items
- remove user-role current Goal internal-context items
- remove stale current Goal items
- remove duplicate current Goal items
- remove pre-injected old Goal-looking items from concrete carry paths

Rules:

- mixed ordinary prose containing marker-like strings must remain
- cleanup does not recover Goal facts
- cleanup does not prove authority
- cleanup does not create cadence when no pending intent is due

If Batch 05 shared classifier does not exist, implement a narrow private
classifier in `goal_cadence.rs` and mark it as request-local cleanup terrain.

### 6. Return Commit Metadata Without Committing

When a selected item is inserted or verified, return `GoalRequestCommit` with:

- thread id
- turn id
- goal id
- kind
- facts version
- item fingerprint
- placement
- finalized `ResponseItem`

Do not call:

- `consume_pending_intent_exact(...)`
- `clear_superseded_intents(...)`
- current-turn carry recording
- Continuation watermark updates

## Focused Tests

Add cheap unit tests in `goal_cadence.rs` for the selection and cleanup logic
introduced by this slice:

- `goal_cadence_selects_budget_limit_before_objective_updated_before_initial`
- `goal_cadence_active_goal_without_pending_intent_selects_nothing`
- `goal_cadence_inserts_developer_internal_context_item`
- `goal_cadence_removes_legacy_wrong_role_duplicate_and_stale_goal_items`
- `goal_cadence_preserves_mixed_marker_like_ordinary_prose`

Integration request-payload tests may be started here, but 02f owns the full
acceptance matrix.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-core --lib goal_cadence
```

If integration tests are added:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority
```

Do not run broad workspace suites by default.

## Acceptance Criteria

This slice is complete when:

- finalizer reads durable cadence snapshots
- pending BudgetLimit / ObjectiveUpdated / Initial selection follows priority
- active durable Goal without pending intent emits no Goal item
- selected Goal item is an outer developer-role `ResponseItem`
- selected item uses current internal-context representation, not
  `<goal_context>`
- stale/wrong-role/duplicate/legacy pure Goal-looking items are cleaned from
  final input
- finalizer returns inert commit metadata
- pending intent remains pending because 02d has not committed it

## Non-Goals

This slice does not:

- consume pending intent
- record rollout/history commit
- store committed carry metadata
- convert producers
- implement Continuation selection
- advance Continuation watermarking
- finish projection, raw, compaction, or reconstruction cleanup

## Partial Landing Constraints

02c may land before 02d only as an incomplete rewrite. The branch must not
claim pending intent delivery is complete until Created commit consumes exact
pending intent.

If Created commit is added in the same PR, satisfy 02d.
