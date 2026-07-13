# Batch 01: Durable Cadence State

This batch adds the durable state primitives required by Goal cadence:

- monotonic Goal facts versioning
- structured pending Initial, ObjectiveUpdated, and BudgetLimit intent
- exact-key pending intent consumption
- state tests for atomic facts-plus-intent mutations

It does not change active Goal steering behavior. It does not switch producers
to consume or emit pending cadence intent. Those changes depend on the final
request-input shaping batch.

## Slice Index

Implement Batch 01 through these principled slices rather than as one large
state change:

- `01a-durable-facts-version-plumbing.md`
  - schema/model/query plumbing for `facts_version`
  - existing facts-only methods keep compiling and maintain the version
- `01b-pending-cadence-intent-storage.md`
  - pending Initial / ObjectiveUpdated / BudgetLimit storage primitives
  - exact-key consumption and supersedence cleanup helpers
- `01c-cadence-aware-store-operations.md`
  - atomic facts-plus-intent store operations
  - focused state tests for the complete durable cadence state contract

The parent Batch 01 file remains the overview contract. The slice docs are the
implementation units. If a slice cannot land alone, it must say so explicitly;
otherwise each slice should leave the tree compiling with existing production
callers still using facts-only behavior.

## Direction Lock

Request:

- translate the durable cadence state contract into an execution-ready batch
- ground the plan in current state code
- do not implement code in this planning pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`

Terrain:

- current durable Goal facts live in the dedicated goals DB:
  - `codex-rs/state/goals_migrations/0001_thread_goals.sql`
  - `codex-rs/state/src/model/thread_goal.rs`
  - `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/migrations.rs` embeds
  `sqlx::migrate!("./goals_migrations")`
- `codex-rs/state/BUILD.bazel` already includes `goals_migrations/**`
- production callers currently use facts-only methods from core, app-server,
  and `ext/goal`

Code-shape temptation:

- encode pending intent in rendered Goal text, rollout history, or UI metadata
- use `updated_at_ms` as the only durable facts identity
- let state decide cadence selection, model roles, prompt rendering, request
  repair, or Continuation policy
- switch production callers to create pending intent before final request-input
  shaping and commit exist

Locked direction:

- state owns durable facts and durable pending cadence intent
- state exposes facts snapshots and exact-key mutation operations
- state does not construct model input or decide when a request should carry
  Goal steering
- Batch 01 may add cadence-capable APIs and tests, but production callers that
  would create pending intent should be switched in later producer/conversion
  batches

Exclusions:

- no final request-input shaping
- no commit on `ResponseEvent::Created`
- no idle Continuation watermarking
- no request repair or classifier integration
- no `GoalContext` / `<goal_context>` production deletion
- no producer behavior switch in core, app-server, or `ext/goal`

## Bounded Code Terrain Read

Files read for this batch:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/migrations.rs`
- `codex-rs/state/BUILD.bazel`
- `codex-rs/state/Cargo.toml`
- state callers in:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`

Findings:

- `thread_goals` currently has no `facts_version`.
- there is no pending cadence intent table.
- `ThreadGoal` and `ThreadGoalRow` do not expose a facts version.
- `GoalStore` currently exposes:
  - `get_thread_goal`
  - `replace_thread_goal`
  - `insert_thread_goal`
  - `update_thread_goal`
  - `pause_active_thread_goal`
  - `usage_limit_active_thread_goal`
  - `delete_thread_goal`
  - `account_thread_goal_usage`
- `GoalStore` tests already live in `codex-rs/state/src/runtime/goals.rs` and
  are the right home for Batch 01 state tests.
- current production callers are not ready to create pending cadence intent
  because final request-input shaping and commit do not exist yet.

## Ownership Split For This Batch

Batch 01 adds durable primitives only. Use this file split while implementing:

- `codex-rs/state/src/runtime/goals.rs` owns SQL-backed Goal facts,
  `facts_version`, pending Initial/ObjectiveUpdated/BudgetLimit intent,
  exact-key consumption, and atomic facts-plus-intent mutation helpers.
- `codex-rs/state/src/model/thread_goal.rs` owns persisted model shape changes
  needed to expose facts version and pending intent data cleanly.
- `codex-rs/state/goals_migrations/*` owns schema changes for facts version
  and pending intent tables.
- Core, app-server, and extension callers remain facts-only until later
  batches switch producers. Do not add request cadence selection, model role
  choice, prompt rendering, or `ResponseItem` / `ResponseInputItem`
  construction to state.

## Required Edits

### 1. Add Goals Migration

Add:

- `codex-rs/state/goals_migrations/0002_goal_cadence_state.sql`

Required logical SQL:

```sql
ALTER TABLE thread_goals
ADD COLUMN facts_version INTEGER NOT NULL DEFAULT 1;

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

Notes:

- `facts_version` starts at `1` for existing rows.
- new inserted Goal rows start at `1`.
- replacement of an existing `thread_goals` row increments the previous row's
  `facts_version`.
- updates that change steering-relevant facts increment `facts_version`.
- accounting updates that change usage/status increment `facts_version`.
- the implementation must explicitly delete pending rows when clearing or
  replacing Goals. Do not rely on SQLite foreign-key behavior.

No Bazel build-data edit is expected because `state/BUILD.bazel` already
includes `goals_migrations/**`.

### 2. Extend Goal Model Types

Edit:

- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`

Add `facts_version: i64` to:

- `ThreadGoal`
- `ThreadGoalRow`
- row extraction in `ThreadGoalRow::try_from_row`
- `TryFrom<ThreadGoalRow> for ThreadGoal`

Add durable pending-intent model types. Suggested names:

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

The exact names may change, but the shape may not:

- pending intent is structured
- kind is an enum, not free-form caller text
- intent carries `thread_id`, `goal_id`, `kind`, `facts_version`, and
  `created_at`
- no model role, prompt text, rendered context, or rollout item is stored here

Export only what core/app-server/extension callers need. Keep row helpers
crate-private.

### 3. Update Existing Facts Queries

Edit:

- `codex-rs/state/src/runtime/goals.rs`

Every `SELECT` / `RETURNING` that materializes `ThreadGoalRow` must include
`facts_version`.

Every existing facts mutation that actually writes Goal facts should maintain
`facts_version`:

- `replace_thread_goal`
  - insert path: `facts_version = 1`
  - conflict update path: `facts_version = thread_goals.facts_version + 1`
  - clear pending rows for the replaced thread/old goal
- `insert_thread_goal`
  - insert path: `facts_version = 1`
- `update_thread_goal`
  - increment `facts_version` when the existing implementation writes
    `updated_at_ms`
  - clear pending intent when status changes make active-state intent
    impossible
- `pause_active_thread_goal`
- `usage_limit_active_thread_goal`
- `delete_thread_goal`
  - delete all pending rows for the thread
- `account_thread_goal_usage`
  - increment `facts_version` only when it returns `Updated`
  - leave unchanged outcomes unchanged

Batch 01 should keep existing facts-only methods available so current product
callers keep compiling before producer conversion. Do not make existing
production callers create pending Initial / ObjectiveUpdated / BudgetLimit
intent merely by calling their current methods.

### 4. Add Cadence-Aware Store Operations

Edit:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`

Add state APIs equivalent to:

```rust
pub async fn get_thread_goal_with_cadence(
    &self,
    thread_id: ThreadId,
) -> anyhow::Result<ThreadGoalCadenceSnapshot>;

pub async fn replace_thread_goal_with_initial_intent(
    &self,
    thread_id: ThreadId,
    objective: &str,
    status: ThreadGoalStatus,
    token_budget: Option<i64>,
) -> anyhow::Result<ThreadGoalCadenceSnapshot>;

pub async fn insert_thread_goal_with_initial_intent(
    &self,
    thread_id: ThreadId,
    objective: &str,
    status: ThreadGoalStatus,
    token_budget: Option<i64>,
) -> anyhow::Result<Option<ThreadGoalCadenceSnapshot>>;

pub async fn update_thread_goal_with_objective_intent(
    &self,
    thread_id: ThreadId,
    update: GoalUpdate,
) -> anyhow::Result<Option<ThreadGoalCadenceSnapshot>>;

pub async fn account_thread_goal_usage_with_budget_intent(
    &self,
    thread_id: ThreadId,
    time_delta_seconds: i64,
    token_delta: i64,
    mode: GoalAccountingMode,
    expected_goal_id: Option<&str>,
) -> anyhow::Result<GoalAccountingCadenceOutcome>;

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

The exact return type for accounting may vary, but it must distinguish:

- unchanged facts
- updated facts without pending BudgetLimit intent
- updated facts with pending BudgetLimit intent

All facts-plus-intent methods must use a single SQL transaction:

```text
begin transaction
  mutate thread_goals
  read returned facts_version / goal_id
  clear stale or superseded pending intent as required
  insert or replace pending intent when required
  read snapshot
commit
```

State must not choose between eligible pending intents for a request attempt.
Selection order belongs to final request-input shaping.

### 5. Pending Intent Mutation Rules

Implement these state-layer rules:

Creating or replacing an active Goal through the cadence-aware API:

- write Goal facts
- allocate facts version
- clear pending intent for the thread that belongs to replaced stale Goals
- insert pending Initial intent only when the resulting status is `Active`

Objective update through the cadence-aware API:

- update objective first
- allocate facts version
- insert or replace pending ObjectiveUpdated intent only when the resulting
  durable Goal status is `Active`

Budget accounting through the cadence-aware API:

- account usage first
- allocate facts version if usage/status changed
- insert or replace pending BudgetLimit intent when the resulting durable
  status is `BudgetLimited` and this update is the budget-limit transition that
  requires model wrap-up

Status updates that stop active Goal behavior:

- clear pending Initial and ObjectiveUpdated intent for that `goal_id` when the
  status no longer permits active-state steering
- BudgetLimit may clear older Initial / ObjectiveUpdated intent for the same
  Goal as superseded

Deleting or clearing a Goal:

- delete all pending intent rows for the thread in the same transaction

Exact-key consumption:

```sql
DELETE FROM thread_goal_pending_intents
WHERE thread_id = ?
  AND goal_id = ?
  AND kind = ?
  AND facts_version = ?;
```

Return `true` only when one row was deleted.

### 6. Production Caller Policy

Do not switch these production callers in Batch 01:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

Reason:

- current active steering still uses the old pre-finalizer path
- creating durable pending intent before final request-input shaping and commit
  exist can leave stale pending rows that later look undelivered

Later batches must switch callers deliberately:

- core Goal mutation and tool paths switch when final request-input shaping can
  consume pending intent
- app-server external Goal mutation switches when resume/idle ordering is
  aligned with the cadence contract
- `ext/goal` switches when extension steering is converted away from concrete
  Goal item injection

Batch 01 may add comments near new APIs saying they are for cadence-aware
producer conversion, but it should not scatter deferred-work notes through
production callers.

## Focused Tests

Add tests in:

- `codex-rs/state/src/runtime/goals.rs`

Use a shared prefix such as `goal_cadence_` so focused local validation can run
all Batch 01 tests with one Cargo filter.

Required tests:

- `goal_cadence_replace_active_goal_writes_initial_intent_atomically`
  - cadence-aware replace writes facts and pending Initial intent
  - snapshot contains matching `goal_id`, `facts_version`, and kind
- `goal_cadence_insert_active_goal_writes_initial_intent_atomically`
  - cadence-aware insert writes Initial intent only on successful insert
  - failed insert does not alter the existing pending intent
- `goal_cadence_objective_update_writes_objective_updated_intent`
  - objective update increments `facts_version`
  - pending ObjectiveUpdated intent uses the returned durable facts version
- `goal_cadence_budget_accounting_writes_budget_limit_intent`
  - budget-crossing accounting persists usage/status first
  - pending BudgetLimit intent uses current facts
- `goal_cadence_budget_limit_supersedes_active_state_intents`
  - BudgetLimit clears stale Initial and ObjectiveUpdated intent for the same
    Goal when required
- `goal_cadence_consume_pending_intent_requires_exact_key`
  - wrong goal, kind, or facts version does not consume
  - exact key consumes exactly one row
- `goal_cadence_replacing_or_deleting_goal_clears_stale_intents`
  - replacement clears old goal pending rows
  - delete clears all pending rows for the thread
- `goal_cadence_facts_only_methods_do_not_create_pending_intent`
  - existing production-facing facts-only methods remain non-cadence until
    later producer conversion

Update existing state tests for `ThreadGoal { facts_version, ... }` expectations
without weakening budget, usage, status, or concurrency behavior.

## Verification

Docs-only validation for this planning batch:

```powershell
git diff --check -- local/goal_136_plan
```

Implementation validation for Batch 01:

```powershell
cd codex-rs
just fmt
```

Focused state tests:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence
```

Optional compile check if public type/API churn causes broader risk:

```powershell
cd codex-rs
cargo check -p codex-state --lib
```

Do not run broad workspace or full crate suites by default on this workstation.

## Acceptance Criteria

Batch 01 is complete when:

- `0002_goal_cadence_state.sql` exists and migrates goals DB state
- `ThreadGoal` exposes `facts_version`
- pending Initial / ObjectiveUpdated / BudgetLimit intent is represented as
  structured state
- cadence-aware store APIs mutate Goal facts and pending intent in the same SQL
  transaction
- exact-key consumption cannot consume stale, wrong-goal, wrong-kind, or
  wrong-version intent
- delete/replace/terminal mutations clear stale pending intent as required
- existing product behavior tests remain product-equivalent after
  `facts_version` expectations are updated
- Batch 01 tests prove state behavior without relying on rendered Goal text,
  model roles, prompt construction, or rollout history
- production callers are not switched to create pending intent until a later
  batch owns final request-input shaping and commit

## Non-Goals

This batch does not:

- decide which pending intent is selected for a request
- render Goal steering prompt text
- construct `ResponseItem` or `ResponseInputItem`
- consume intent because a prompt was rendered
- advance automatic Continuation suppression
- create persisted Continuation intent
- repair request input
- classify current or legacy Goal items
- convert `ext/goal`
- delete the old active steering producer path

## Partial Landing Constraints

Batch 01 may land before active steering is rewritten only if it remains
state-additive:

- migrations and facts versioning are allowed
- cadence-aware APIs and state tests are allowed
- existing facts-only methods may maintain `facts_version` and cleanup stale
  pending rows
- existing production callers must not begin writing pending cadence intent
  until a later batch can consume it at the final request-input commit point

If implementation pressure makes production caller conversion appear necessary
inside Batch 01, stop and move that conversion to the later final
request-input/producers batch instead of landing a half-connected pending
intent path.
