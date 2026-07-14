# Batch 02a: Goal Cadence Module Types

This slice introduces the core `goal_cadence.rs` module and its internal
interface types.

It does not wire the finalizer into the request loop yet. It establishes the
deep module seam that later Batch 02 slices will call.

## Direction Lock

Request:

- split Batch 02 by implementation seam and validation boundary
- create a self-contained slice for the final request-input authority module
- ground the module interface in the current request path and Goal terrain

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01a-durable-facts-version-plumbing.md`
- `local/goal_136_plan/batches/01b-pending-cadence-intent-storage.md`
- `local/goal_136_plan/batches/01c-cadence-aware-store-operations.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- `codex-rs/core/src/lib.rs` has no `goal_cadence` module today.
- `codex-rs/core/src/session/turn.rs` builds `Prompt { input }` from a
  `Vec<ResponseItem>` before the client serializes it.
- `codex-rs/core/src/client_common.rs` exposes `Prompt.input` and
  `Prompt::get_formatted_input()`.
- `codex-rs/core/src/client.rs` copies `Prompt.input` into
  `ResponsesApiRequest.input`.
- `codex-rs/core/src/goals.rs` currently owns prompt-body helpers and old
  `GoalContext`-backed active steering construction.
- `codex-rs/core/src/context/goal_context.rs` is deletion terrain for active
  steering, not a module to preserve as authority.

Code-shape temptation:

- put final request shaping in `goals.rs` because Goal prompts already live
  there
- put role/item construction in generic context rendering and treat source
  tags as authority
- define a broad finalizer interface that forces callers to understand every
  cadence and repair detail
- keep `ResponseInputItem` in the module types because the old producer path
  already uses it

Locked direction:

- add a narrow `goal_cadence.rs` module whose interface accepts final request
  input and typed attempt facts, then returns finalized input plus inert commit
  metadata
- define selected-item, fingerprint, repair report, and commit types that
  refer to the exact final `ResponseItem`
- keep prompt-body rendering either as private temporary helpers in
  `goal_cadence.rs` or small helpers imported from `goals.rs`
- do not wire, select, commit, or convert producers in this slice

Exclusions:

- no request-loop wiring
- no durable pending-intent selection
- no pending-intent consumption
- no current-turn carry changes
- no producer conversion
- no automatic Continuation selection or watermarking
- no broad classifier/projection rewrite

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/codex-api/src/common.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/tests/common/responses.rs`

Findings to preserve:

- `Prompt.input` is the last local logical request input.
- `ResponsesApiRequest.input` clones from `Prompt.input`.
- `ResponseEvent::Created` currently has no Goal commit behavior.
- old Goal steering creates `ResponseInputItem` through
  `GoalContext::into_response_input_item(...)`.
- old current-turn carry stores concrete `ResponseInputItem`s in `TurnState`.
- request tests can inspect final payload input through `ResponsesRequest`.

## Prerequisites And Dependencies

Required:

- Batch 00 test prep has removed false pressure to preserve old active
  `<goal_context>` behavior.
- Batch 01a/01b/01c are planned or implemented enough that type names can
  reference durable facts version and pending intent concepts.

This slice may land before 02b if it compiles unused or has only module-level
unit tests. It should be additive.

## Exact Files To Edit

Expected edits:

- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/goal_cadence.rs`

Possible support edits:

- `codex-rs/core/src/goals.rs` only if prompt-body helper visibility needs to
  become `pub(crate)`
- `codex-rs/core/tests/common/responses.rs` only if a small fingerprint or
  input inspection helper is needed by unit tests

Do not edit:

- `codex-rs/core/src/session/turn.rs` in this slice except for imports guarded
  by later slices
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

## Required Edits

### 1. Add The Module

Edit `codex-rs/core/src/lib.rs`:

```rust
mod goal_cadence;
```

Add:

- `codex-rs/core/src/goal_cadence.rs`

Keep it `pub(crate)` by default. This module is the internal seam for active
Goal authority, not a public crate interface.

### 2. Define Cadence Kinds And Placement

Add types equivalent to:

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
```

Requirements:

- `Continuation` exists as a type variant for Batch 03 integration, but this
  slice and Batch 02 must not select it automatically.
- placement describes what happened to final request input; it is not cadence
  authority by itself.

### 3. Define Fingerprint And Commit Types

Add types equivalent to:

```rust
pub(crate) struct GoalItemFingerprint {
    // digest or structured fields for the exact final developer-role item
}

pub(crate) struct GoalRequestCommit {
    pub thread_id: ThreadId,
    pub turn_id: String,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
    pub placement: GoalItemPlacement,
    pub item: ResponseItem,
}
```

If `ModelVisibleHistoryKey` does not exist yet, use a narrow placeholder type
or `Option<()>` only if the slice docs and code clearly mark it as a temporary
Batch 03 integration point. Do not use `ContextManager::history_version()` as
a stand-in Continuation key.

Requirements:

- commit metadata is inert until Created commit
- `item` is a finalized `ResponseItem`
- `item_fingerprint` identifies the exact item in the final input
- no `ResponseInputItem` appears in commit metadata

### 4. Define Finalizer Output And Repair Report

Add types equivalent to:

```rust
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
```

Requirements:

- repair report is diagnostic and test support
- repair report must not decide cadence
- `FinalizedGoalRequestInput.input` is the exact vector to pass to
  `build_prompt(...)`

### 5. Define Attempt Context Shape

Add an attempt context type equivalent to:

```rust
pub(crate) struct GoalRequestAttemptContext {
    pub thread_id: ThreadId,
    pub turn_id: String,
    pub cadence_snapshot: Option<codex_state::ThreadGoalCadenceSnapshot>,
    pub continuation_request: Option<GoalContinuationRequest>,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub goals_enabled: bool,
    pub collaboration_allows_goal_steering: bool,
    pub transport_context: GoalRequestTransportContext,
    pub repair_context: GoalRequestRepairContext,
}
```

The exact names may change. `GoalRequestTransportContext` and
`GoalRequestRepairContext` may be small enums or structs; they are typed facts
for diagnostics and request-local repair, not authority mechanisms.

Requirements:

- include durable facts and pending intent snapshot data
- include optional Continuation request for Batch 03, but keep it inactive in
  Batch 02
- include Goals feature and collaboration-mode eligibility facts for this
  request attempt
- include transport and repair facts needed by final request-input cleanup
- include only typed facts, not rendered prompt text or model items from
  callers
- feature/collaboration eligibility may prevent delivery, but it must not
  prove cadence by itself

### 6. Add A Private Renderer If Needed

If Batch 05 shared internal-context helpers do not exist yet, add a private
temporary renderer in `goal_cadence.rs`.

Required logical shape:

```text
source = "goal"
body = rendered Goal prompt body
outer ResponseItem::Message.role = "developer"
```

Do not use:

- `GoalContext`
- `GoalContextRole`
- `<goal_context>`
- `ContextualUserFragment::into(...)`

The private renderer may later move to Batch 05 shared infrastructure. That
future move must not change authority: outer developer-role final request item
remains the source of authority.

### 7. Add Unit Tests For Pure Types

Add narrow `goal_cadence` module tests for any executable behavior introduced
in this slice:

- fingerprint differs when item text differs
- fingerprint includes or otherwise distinguishes role
- private renderer returns developer-role `ResponseItem`
- private renderer text does not contain `<goal_context>`

If the slice lands as type definitions only, document that there is no
executable behavior to assert yet and use the focused compile check as the
cheap proof for this slice. Do not rely on 02f to prove these type-level
invariants later.

Do not write integration request-payload tests in this slice; 02f owns those.

## Focused Tests

Preferred unit test filter:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_cadence
```

If no executable tests are added, run a focused compile check only when useful:

```powershell
cd codex-rs
cargo check -p codex-core --lib
```

Always run `just fmt` after Rust edits.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-core --lib goal_cadence
```

Do not run broad workspace suites by default.

## Acceptance Criteria

This slice is complete when:

- `goal_cadence.rs` exists and is wired from `core/src/lib.rs`
- finalizer result, commit, fingerprint, placement, and repair report types
  exist
- commit metadata refers to finalized `ResponseItem`, not
  `ResponseInputItem`
- temporary renderer, if added, produces developer-role current internal
  context and not `<goal_context>`
- no request-loop behavior changes are required to compile
- no pending intent is selected or consumed

## Non-Goals

This slice does not:

- call the finalizer from `run_sampling_request(...)`
- select pending Initial, ObjectiveUpdated, or BudgetLimit intent
- consume pending intent
- record committed carry metadata
- convert producers
- add request-payload acceptance tests
- implement automatic Continuation

## Partial Landing Constraints

02a may land independently as an additive module/type slice.

If finalizer wiring is added in the same PR, the PR must satisfy 02b. If
pending-intent selection is added, the PR must satisfy 02c. If commit behavior
is added, the PR must satisfy 02d.
