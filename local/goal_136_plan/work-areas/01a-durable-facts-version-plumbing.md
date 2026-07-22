# Work Area 01a: Durable Facts Version Plumbing

This ordered pass adds the durable facts identity that later pending-intent
and commit code will key against. It does not introduce cadence-aware producer
behavior and it does not make state choose request cadence.

## Direction Lock

Request:

- start Work Area 01 by adding durable Goal facts versioning
- keep current facts-only Goal APIs available for existing callers
- do not switch active steering behavior in this pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`

Terrain:

- `thread_goals` currently has product facts but no `facts_version`.
- `ThreadGoalRow::try_from_row` is the central row extraction point.
- `GoalStore` materializes rows through explicit `SELECT` / `RETURNING`
  column lists.
- goals migrations are embedded by `sqlx::migrate!("./goals_migrations")`,
  and Bazel already includes `goals_migrations/**`.
- current production callers in core, app-server, and `ext/goal` use facts-only
  `GoalStore` methods.

Code-shape temptation:

- use `updated_at_ms` as the only cadence identity
- switch production callers to pending cadence intent before the final request
  commit path exists
- add request cadence selection to state because facts version is nearby
- treat the facts version as recorded request evidence or as a substitute for
  the later request-input item/request fingerprints

Locked direction:

- state owns monotonic durable facts versioning
- existing facts-only methods keep working and maintain `facts_version`
- this pass creates a durable facts identity for pending-intent exact keys and
  Continuation watermark comparison; it does not record committed request-input
  evidence
- pending-intent selection, prompt rendering, model roles, and final request
  shaping stay out of state

Exclusions:

- no pending-intent API usage by production callers
- no `ResponseItem` or `ResponseInputItem` construction
- no final request-input commit
- no Continuation watermarking
- no `GoalRequestEvidence`, item fingerprint, request-input fingerprint, or
  rollout replay work
- no active steering producer conversion

## Code Terrain Read

Directly read:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/migrations.rs`
- `codex-rs/state/BUILD.bazel`
- compile-pressure callers in:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`

Observed facts:

- `thread_goals` has `thread_id`, `goal_id`, objective, status, budget, usage,
  and timestamps only.
- `ThreadGoal` and `ThreadGoalRow` do not currently carry facts identity.
- every row projection in `GoalStore` must be updated because the SQL column
  lists are explicit.
- `replace_thread_goal`, `insert_thread_goal`, `update_thread_goal`,
  `update_active_thread_goal_status`, and `account_thread_goal_usage` are the
  write surfaces that must maintain a facts version.
- existing callers convert `ThreadGoal` into protocol types and should not need
  new arguments to keep compiling.

## Pass Goal

Add `facts_version` to durable Goal facts and keep it correct for existing
facts-only read/write paths. This gives later passes a durable identity for
pending intent without changing cadence behavior.

## Exact Files To Edit

- `codex-rs/state/goals_migrations/0002_goal_cadence_state.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`

Caller files are read for compile pressure only. Do not switch them to new
cadence-aware APIs in this pass:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

## Required Edits

Add the Work Area 01 migration file:

```text
codex-rs/state/goals_migrations/0002_goal_cadence_state.sql
```

The migration should add `facts_version` and may also include the pending
intent table DDL required by Work Area 01 so the Work Area has one schema migration.
If this pass includes the pending-intent table DDL, do not expose or use that
table until 01b.

Required `facts_version` DDL:

```sql
ALTER TABLE thread_goals
ADD COLUMN facts_version INTEGER NOT NULL DEFAULT 1;
```

Add `facts_version: i64` to:

- `ThreadGoal`
- `ThreadGoalRow`
- `ThreadGoalRow::try_from_row`
- `TryFrom<ThreadGoalRow> for ThreadGoal`

Update every `SELECT` and `RETURNING` in `GoalStore` that materializes
`ThreadGoalRow` to include `facts_version`.

Maintain facts version in existing facts-only writes:

- `replace_thread_goal`
  - insert path starts at `facts_version = 1`
  - conflict update path increments from the previous row
- `insert_thread_goal`
  - insert path starts at `facts_version = 1`
- `update_thread_goal`
  - any successful facts write increments `facts_version`
  - the no-update branch that only returns the current row must not increment
- `pause_active_thread_goal` / `usage_limit_active_thread_goal`
  - successful status update increments `facts_version`
- `account_thread_goal_usage`
  - `GoalAccountingOutcome::Updated` increments `facts_version`
  - `GoalAccountingOutcome::Unchanged` does not
- `delete_thread_goal`
  - no facts version update is needed because the row is removed

Do not add request cadence selection here. This pass only makes the facts
identity durable and visible.

## Tests And Checks

Update existing `codex-rs/state/src/runtime/goals.rs` tests to account for the
new `facts_version` field when constructing expected `ThreadGoal` values.

Add one focused state test:

- `goal_cadence_facts_version_tracks_facts_only_mutations`

It should prove:

- new inserted Goals start at `facts_version = 1`
- replacing, updating, status-changing, and usage/status accounting writes
  increment `facts_version`
- unchanged reads and unchanged accounting outcomes do not increment
  `facts_version`
- get and accounting paths return the current durable facts version

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence_facts_version
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, the branch should have durable facts versioning on the
existing Goal facts path. Pending intent may have schema DDL if included in the
shared migration file, but it is not yet represented by Rust model types or
store APIs.

The next pass, 01b, inherits:

- `ThreadGoal.facts_version`
- facts-only `GoalStore` methods that maintain the version
- the same unswitched production callers
- no recorded-evidence carrier or replay behavior

## Non-Goals

This pass does not:

- add pending Initial / ObjectiveUpdated / BudgetLimit storage APIs
- consume pending intent
- choose which intent is due for a request
- render Goal prompt text
- construct model input
- record committed request-input evidence
- alter core/app-server/extension producer behavior
- delete old active steering paths
