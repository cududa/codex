# Batch 01a: Durable Facts Version Plumbing

This slice adds durable `facts_version` plumbing for existing Goal facts.

It is the first implementation slice of Batch 01. It is intentionally
schema/model/query compatible and does not add pending cadence intent yet.

## Direction Lock

Request:

- split Batch 01 by implementation seam and validation boundary
- make this slice self-contained and implementable by an agent with only the
  docs and current v136 tree
- ground the slice in the current state code rather than a prose-only split

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`

Terrain:

- `thread_goals` currently has no `facts_version`.
- `ThreadGoal` and `ThreadGoalRow` currently expose only product facts and
  timestamps.
- `GoalStore` materializes `ThreadGoalRow` from several explicit `SELECT` and
  `RETURNING` column lists.
- Existing production callers in core, app-server, and `ext/goal` use
  facts-only store methods and are not ready to write pending cadence intent.

Code-shape temptation:

- use `updated_at_ms` as the cadence facts identity
- make this a schema-only migration and defer query/test fallout
- start converting production callers because the state model changed

Locked direction:

- add a durable monotonic `facts_version` to the goals database and Rust model
- keep existing facts-only methods available and product-equivalent
- update every existing facts read/write path that materializes `ThreadGoal`
  so callers always see a facts version
- prove version behavior with focused state tests

Exclusions:

- no pending cadence intent table
- no cadence-aware facts-plus-intent mutation APIs
- no request-input shaping or commit behavior
- no producer conversion in core, app-server, or `ext/goal`
- no model role, prompt rendering, `ResponseItem`, or `ResponseInputItem`

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/migrations.rs`
- `codex-rs/state/BUILD.bazel`
- compile fallout only:
  - `codex-rs/state/src/extract.rs`
  - state tests or helper literals that construct `codex_state::ThreadGoal`
  - caller conversion helpers that destructure or convert `ThreadGoal`

Code findings to preserve:

- `sqlx::migrate!("./goals_migrations")` already embeds the goals migrations.
- `state/BUILD.bazel` already includes `goals_migrations/**`.
- `GoalStore::replace_thread_goal(...)` uses `INSERT ... ON CONFLICT ... DO
  UPDATE ... RETURNING`.
- `GoalStore::insert_thread_goal(...)` uses `ON CONFLICT DO NOTHING ...
  RETURNING`.
- `GoalStore::update_thread_goal(...)` has multiple SQL branches and then
  re-reads through `get_thread_goal(...)`.
- `GoalStore::account_thread_goal_usage(...)` builds SQL dynamically and uses
  `RETURNING`.
- Existing state tests compare whole `ThreadGoal` objects in several places.

## Prerequisites And Dependencies

This slice may land after Batch 00 and before any other Batch 01 slice.

It is independently landable if:

- the migration is complete
- all existing `ThreadGoal` reads include `facts_version`
- existing facts-only methods still compile
- focused version tests pass

If an implementer chooses to combine the facts-version and pending-intent SQL
into a single migration file, then 01a and 01b must land together. Do not land
Rust that expects a pending-intent table in 01a alone.

## Exact Files To Edit

Expected edits:

- `codex-rs/state/goals_migrations/0002_thread_goal_facts_version.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`

Possible compile fallout:

- `codex-rs/state/src/extract.rs`
- tests that construct `codex_state::ThreadGoal` literals

No Bazel edit is expected for a new goals migration because
`codex-rs/state/BUILD.bazel` already globs `goals_migrations/**`.

## Required Edits

### 1. Add Facts Version Migration

Add the next goals migration. Preferred name:

- `codex-rs/state/goals_migrations/0002_thread_goal_facts_version.sql`

Required SQL:

```sql
ALTER TABLE thread_goals
ADD COLUMN facts_version INTEGER NOT NULL DEFAULT 1;
```

Rules:

- existing rows start at `1`
- newly inserted rows start at `1`
- replacing an existing row increments from the previous row
- facts writes increment the version when the existing implementation writes
  `updated_at_ms`
- read-only operations and unchanged accounting outcomes do not increment

### 2. Extend Model Types

Edit `codex-rs/state/src/model/thread_goal.rs`.

Add `facts_version: i64` to:

- `ThreadGoal`
- `ThreadGoalRow`
- `ThreadGoalRow::try_from_row(...)`
- `TryFrom<ThreadGoalRow> for ThreadGoal`

Keep the model factual:

- no cadence kind
- no model role
- no prompt text
- no rendered context
- no rollout item

Update re-exports only if needed. `ThreadGoal` already exports through
`model/mod.rs` and `lib.rs`; this slice should not add unrelated public types.

### 3. Update Existing GoalStore Queries

Edit `codex-rs/state/src/runtime/goals.rs`.

Every query that materializes a `ThreadGoalRow` must include
`facts_version`:

- `get_thread_goal(...)`
- `replace_thread_goal(...) RETURNING`
- `insert_thread_goal(...) RETURNING`
- `account_thread_goal_usage(...) RETURNING`
- any helper added while updating existing state tests

Every facts mutation that writes durable Goal facts must maintain
`facts_version`:

- `replace_thread_goal(...)`
  - insert path sets `facts_version = 1`
  - conflict update path sets
    `facts_version = thread_goals.facts_version + 1`
- `insert_thread_goal(...)`
  - insert path sets `facts_version = 1`
- `update_thread_goal(...)`
  - increment `facts_version` in each SQL branch that writes
    `updated_at_ms`
  - keep the no-op read path unchanged
- `pause_active_thread_goal(...)` and
  `usage_limit_active_thread_goal(...)`
  - increment through `update_active_thread_goal_status(...)` only when a row
    is updated
- `account_thread_goal_usage(...)`
  - increment only when the update returns `Updated`
  - leave `Unchanged(...)` outcomes unchanged

Do not add pending-intent cleanup in this slice unless 01b is landing in the
same change. With 01a alone, the pending-intent table does not exist.

### 4. Keep Production Callers Facts-Only

Do not switch these callers:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

Allowed caller fallout:

- updating conversions or tests that need the new `ThreadGoal` field
- leaving runtime/product behavior unchanged

Forbidden caller fallout:

- creating pending cadence intent
- constructing or carrying active Goal model input
- interpreting `facts_version` as request cadence by itself

## Focused Tests

Add or update tests in `codex-rs/state/src/runtime/goals.rs`.

Use the prefix `goal_cadence_facts_version_` for new tests.

Required coverage:

- `goal_cadence_facts_version_starts_at_one`
  - `replace_thread_goal(...)` and `insert_thread_goal(...)` return version
    `1` for new rows
- `goal_cadence_facts_version_increments_on_replace_update_and_accounting`
  - replacement conflict increments
  - objective/status/budget update increments
  - accounting `Updated(...)` increments
- `goal_cadence_facts_version_unchanged_when_accounting_is_unchanged`
  - zero-delta or filtered accounting returns `Unchanged(...)`
  - persisted version stays the same

Update existing whole-object assertions by carrying `facts_version` through
the expected `ThreadGoal` value. Do not weaken those tests to field-by-field
assertions just to avoid the new field.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-state --lib goal_cadence_facts_version
```

Optional compile check if the public model field causes broader fallout:

```powershell
cd codex-rs
cargo check -p codex-state --lib
```

Do not run broad workspace or full crate suites by default.

## Acceptance Criteria

This slice is complete when:

- the goals DB has a durable `facts_version` column
- `ThreadGoal` exposes `facts_version`
- every existing `ThreadGoalRow` materialization includes `facts_version`
- existing facts-only methods maintain monotonic facts versions
- no production caller writes pending cadence intent
- focused state tests prove version behavior
- no model input, prompt text, rollout history, or `<goal_context>` appears in
  the state model

## Non-Goals

This slice does not:

- add pending Initial, ObjectiveUpdated, or BudgetLimit intent
- select cadence for a request
- consume pending intent
- decide supersedence between pending intents
- add Continuation watermarking
- render Goal steering
- construct model input
- convert core, app-server, or extension producers

## Partial Landing Constraints

01a may land alone only as a schema/model/query compatibility slice.

If pending-intent code is added in the same PR, that PR must also satisfy 01b.
If cadence-aware mutation APIs are added in the same PR, that PR must satisfy
01b and 01c as well.

