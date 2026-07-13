# Batch 01b: Pending Cadence Intent Storage

This slice adds structured pending Goal cadence intent storage and exact-key
cleanup primitives.

It depends on 01a facts-version plumbing. It still does not switch production
callers to create pending cadence intent.

## Direction Lock

Request:

- split Batch 01 into implementation slices based on real state seams
- make this slice self-contained and code-grounded
- keep tests with the storage behavior they prove

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`
- `local/goal_136_plan/batches/01a-durable-facts-version-plumbing.md`

Terrain:

- after 01a, `ThreadGoal` has a durable `facts_version`
- current v136 has no `thread_goal_pending_intents` table
- `GoalStore` has no exact-key pending intent consumption operation
- existing production callers still use facts-only methods
- `GoalStore` is already large, so new cadence storage helpers should avoid
  making it harder to navigate

Code-shape temptation:

- store pending intent as rendered prompt text, rollout text, or UI metadata
- add a loose delete-by-thread operation and call it "consumption"
- expose a broad public intent writer that production callers could use before
  Batch 02 can commit delivery
- let pending intent storage select which item should be sent in a request

Locked direction:

- add a structured pending intent table and Rust model types
- add exact-key consumption and mechanical cleanup primitives
- keep pending intent storage separate from request cadence selection
- keep production callers facts-only until later producer conversion slices

Exclusions:

- no high-level facts-plus-intent mutation APIs; 01c owns those
- no final request-input shaping
- no prompt rendering or model role
- no producer conversion
- no persisted Continuation intent

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- the 01a facts-version migration
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/migrations.rs`
- `codex-rs/state/BUILD.bazel`
- compile/API pressure only:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`

Code findings to preserve:

- pending intent has no current table, row type, or cleanup API
- tests in `runtime/goals.rs` can exercise private helpers if needed
- current callers should not be made to understand pending intent yet
- `delete_thread_goal(...)` currently deletes only from `thread_goals`
- `replace_thread_goal(...)` currently replaces facts without stale-intent
  cleanup because no pending table exists yet

## Prerequisites And Dependencies

Required:

- 01a has landed, or this slice lands together with 01a
- `ThreadGoal.facts_version` exists and all facts reads include it

This slice may land independently after 01a if:

- pending intent storage is added
- existing facts-only production callers still do not create pending intent
- cleanup primitives are tested
- no request cadence selection is introduced

## Exact Files To Edit

Expected edits:

- `codex-rs/state/goals_migrations/0003_thread_goal_pending_intents.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`

Preferred new module if the implementation would otherwise grow
`runtime/goals.rs` substantially:

- `codex-rs/state/src/runtime/goals/cadence.rs`

If adding the module, wire it from `runtime/goals.rs` with a private
`mod cadence;`. Keep the external interface on `GoalStore`.

No Bazel edit is expected for the SQL migration or new Rust source under the
crate source tree.

## Required Edits

### 1. Add Pending Intent Migration

Add the next goals migration. Preferred name:

- `codex-rs/state/goals_migrations/0003_thread_goal_pending_intents.sql`

Required SQL:

```sql
CREATE TABLE thread_goal_pending_intents (
    thread_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN (
        'initial',
        'objective_updated',
        'budget_limit'
    )),
    facts_version INTEGER NOT NULL,
    created_at_ms INTEGER NOT NULL,
    PRIMARY KEY (thread_id, kind)
);

CREATE INDEX thread_goal_pending_intents_thread_goal_idx
ON thread_goal_pending_intents(thread_id, goal_id);
```

Rules:

- pending intent is structured state
- pending intent is not rollout history, rendered text, UI metadata, or raw
  event data
- multiple kinds may exist for a thread until supersedence or exact-key commit
  clears them
- replacing or deleting a Goal must not leave pending rows for stale goals

### 2. Add Pending Intent Model Types

Edit `codex-rs/state/src/model/thread_goal.rs`.

Add types equivalent to:

```rust
pub enum ThreadGoalPendingIntentKind {
    Initial,
    ObjectiveUpdated,
    BudgetLimit,
}

pub struct ThreadGoalPendingIntent {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub kind: ThreadGoalPendingIntentKind,
    pub facts_version: i64,
    pub created_at: DateTime<Utc>,
}

pub struct ThreadGoalCadenceSnapshot {
    pub goal: Option<ThreadGoal>,
    pub pending_intents: Vec<ThreadGoalPendingIntent>,
}
```

Add row conversion helpers as crate-private implementation detail.

Requirements:

- `kind` is an enum, not caller-provided free-form text
- parsing rejects unknown database values
- conversion to SQL strings is centralized
- the model contains no rendered Goal prompt or model input

Update exports in:

- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`

Export only the public types needed by later core/app-server/extension code:

- `ThreadGoalPendingIntentKind`
- `ThreadGoalPendingIntent`
- `ThreadGoalCadenceSnapshot`

Keep row structs crate-private.

### 3. Add Pending Intent Read And Cleanup Primitives

Edit `codex-rs/state/src/runtime/goals.rs`, or the new private
`runtime/goals/cadence.rs` module.

Add public `GoalStore` APIs equivalent to:

```rust
pub async fn get_thread_goal_with_cadence(
    &self,
    thread_id: ThreadId,
) -> anyhow::Result<ThreadGoalCadenceSnapshot>;

pub async fn consume_pending_intent_exact(
    &self,
    thread_id: ThreadId,
    goal_id: &str,
    kind: ThreadGoalPendingIntentKind,
    facts_version: i64,
) -> anyhow::Result<bool>;

pub async fn clear_superseded_intents(
    &self,
    thread_id: ThreadId,
    goal_id: &str,
    kinds: &[ThreadGoalPendingIntentKind],
) -> anyhow::Result<u64>;
```

Add private helpers as needed for 01c:

- read pending intents for a thread ordered deterministically
- insert or replace a pending intent for a `(thread_id, kind)`
- delete all pending intents for a thread
- delete pending intents for a stale `goal_id`

Exact-key consumption must use the full key:

```sql
DELETE FROM thread_goal_pending_intents
WHERE thread_id = ?
  AND goal_id = ?
  AND kind = ?
  AND facts_version = ?;
```

Return `true` only when one row was deleted.

### 4. Add Mechanical Cleanup To Existing Facts-Only Methods

Once the pending-intent table exists, existing facts-only methods must not
leave impossible rows behind.

Update:

- `delete_thread_goal(...)`
  - delete all pending intents for the thread in the same transaction or in a
    single ordered operation that cannot leave stale rows on success
- `replace_thread_goal(...)`
  - clear pending intents for the thread when replacing the row
  - if the implementation needs to distinguish insert from conflict update,
    keep that logic private to state
- terminal or stopped status updates
  - clear pending `Initial` and `ObjectiveUpdated` rows for the same goal when
    active-state steering can no longer be delivered
- `BudgetLimited` status changes
  - may clear older `Initial` and `ObjectiveUpdated` rows for the same goal as
    mechanical supersedence

Do not make existing facts-only methods create new pending intent in this
slice.

### 5. Preserve Production Caller Behavior

Do not switch production callers in:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

These callers may continue to read `ThreadGoal` with the new facts version.
They must not start writing pending intent until later batches can deliver and
commit it at final request-input shaping.

## Focused Tests

Add tests near the `GoalStore` tests, or in the new cadence submodule if that
module owns the helper implementation.

Use the prefix `goal_cadence_pending_intent_`.

Required tests:

- `goal_cadence_pending_intent_round_trips_structured_state`
  - private insertion helper or a narrow test helper writes each kind
  - `get_thread_goal_with_cadence(...)` returns structured intents with
    matching `thread_id`, `goal_id`, `kind`, `facts_version`, and timestamp
- `goal_cadence_pending_intent_consume_requires_exact_key`
  - wrong goal, wrong kind, and wrong facts version do not consume
  - exact key consumes exactly one row
- `goal_cadence_pending_intent_clear_superseded_kinds`
  - clears only requested kinds for the matching thread and goal
  - leaves other kinds and other goals alone
- `goal_cadence_pending_intent_facts_only_methods_do_not_create_intent`
  - existing `replace`, `insert`, `update`, and `account` methods do not write
    pending intent
- `goal_cadence_pending_intent_replace_and_delete_clear_stale_rows`
  - manually inserted stale rows are cleared by replacement and deletion

Tests may use private helpers because they live in the same Rust module tree.
Do not add a broad public writer solely for tests.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-state --lib goal_cadence_pending_intent
```

Optional compile check if exports or module placement cause churn:

```powershell
cd codex-rs
cargo check -p codex-state --lib
```

Do not run broad workspace or full crate suites by default.

## Acceptance Criteria

This slice is complete when:

- the goals DB has a structured pending-intent table
- Rust model types represent pending cadence intent without prompt text or
  model input
- `get_thread_goal_with_cadence(...)` returns facts plus pending intents
- exact-key consumption cannot consume stale, wrong-goal, wrong-kind, or
  wrong-version intent
- mechanical cleanup removes impossible stale pending rows
- existing production callers still do not create pending intent
- focused tests prove storage and cleanup behavior

## Non-Goals

This slice does not:

- create Initial, ObjectiveUpdated, or BudgetLimit intent from production
  mutations
- choose which pending intent a request should deliver
- consume intent because prompt text was rendered
- construct active Goal steering
- add automatic Continuation watermarking
- convert core, app-server, or extension producers
- repair request input

## Partial Landing Constraints

01b may land after 01a without 01c if pending-intent rows can only be created
by private/test helpers and if existing production callers remain facts-only.

If public facts-plus-intent mutation methods are added in the same PR, that PR
must also satisfy 01c.

