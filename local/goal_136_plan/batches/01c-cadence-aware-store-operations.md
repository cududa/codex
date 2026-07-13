# Batch 01c: Cadence-Aware Store Operations

This slice adds the atomic `GoalStore` operations that mutate durable Goal
facts and pending Initial / ObjectiveUpdated / BudgetLimit intent together.

It depends on 01a and 01b. It still does not switch core, app-server, or
extension production callers to use these operations.

## Direction Lock

Request:

- finish the principled Batch 01 split with a self-contained implementation
  slice for cadence-aware state operations
- base the split on actual state/runtime seams and validation boundaries
- keep tests with the behavior they prove

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`
- `local/goal_136_plan/batches/01a-durable-facts-version-plumbing.md`
- `local/goal_136_plan/batches/01b-pending-cadence-intent-storage.md`

Terrain:

- after 01a, Goal facts expose monotonic `facts_version`
- after 01b, pending intent has structured storage and exact-key cleanup
- existing `GoalStore` facts-only methods are still used by production callers
- core/app-server/extension producer paths still rely on old runtime steering
  and must not be switched before Batch 02/04

Code-shape temptation:

- let state select which pending intent should be delivered on the next
  request
- return prebuilt `ResponseItem` or `ResponseInputItem` values from state
- mark intent consumed as soon as a mutation renders or queues prompt text
- switch production callers to the new APIs immediately

Locked direction:

- add narrow store operations that atomically update facts and pending intent
- return factual snapshots/outcomes only
- preserve exact-key consumption for the later final request-input commit
- leave producer conversion to later batches

Exclusions:

- no final request-input shaping
- no prompt rendering or model role choice
- no active Goal model-input construction
- no automatic Continuation policy
- no classifier/projection cleanup
- no production caller conversion

## Bounded Code Terrain Read

Read these files directly before implementing:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime/goals/cadence.rs` if introduced by 01b
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime.rs`
- compile/API pressure only:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`

Code findings to preserve:

- `replace_thread_goal(...)`, `insert_thread_goal(...)`,
  `update_thread_goal(...)`, and `account_thread_goal_usage(...)` are the
  existing facts-only product methods
- `account_thread_goal_usage(...)` already distinguishes `Updated(...)` from
  `Unchanged(...)`
- production callers currently need facts-only behavior to avoid stale pending
  intent before Batch 02 can consume it
- `GoalStore` is the state seam; state should return facts and intent
  metadata, not active model input

## Prerequisites And Dependencies

Required:

- 01a has landed
- 01b has landed

This slice may land independently after 01a and 01b if:

- new cadence-aware methods are additive
- production callers are not switched to them
- focused tests prove atomic facts-plus-intent behavior

If an implementation combines 01b and 01c, the combined change must satisfy
both docs and keep the caller policy intact.

## Exact Files To Edit

Expected edits:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime/goals/cadence.rs` if introduced by 01b
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`

Compile fallout only:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

## Required Edits

### 1. Add Cadence-Aware Outcome Types

Add outcome types that carry durable facts and pending intent metadata only.

Suggested shapes:

```rust
pub enum GoalAccountingCadenceOutcome {
    Unchanged(Option<ThreadGoalCadenceSnapshot>),
    Updated {
        snapshot: ThreadGoalCadenceSnapshot,
        budget_limit_intent_created: bool,
    },
}
```

The exact names may change, but outcomes must distinguish:

- unchanged facts
- updated facts with no pending BudgetLimit intent
- updated facts with pending BudgetLimit intent

Do not include:

- `ResponseItem`
- `ResponseInputItem`
- rendered Goal prompt text
- model role
- rollout items

### 2. Add Atomic Facts-Plus-Intent Methods

Add `GoalStore` methods equivalent to:

```rust
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
```

Each method must use one SQL transaction for the facts and pending intent
changes:

```text
begin transaction
  mutate thread_goals
  read returned goal_id and facts_version
  clear stale or superseded pending intent as needed
  insert or replace pending intent when required
  read cadence snapshot
commit
```

Do not implement these by calling the existing facts-only method first and then
writing pending intent outside that operation.

### 3. Implement Initial Intent Mutations

`replace_thread_goal_with_initial_intent(...)`:

- writes durable facts
- allocates the new facts version
- clears stale pending intent for the thread/replaced goal
- inserts pending `Initial` only when the resulting status is `Active`
- returns a `ThreadGoalCadenceSnapshot`

`insert_thread_goal_with_initial_intent(...)`:

- on successful insert, writes facts with `facts_version = 1`
- inserts pending `Initial` only when the resulting status is `Active`
- returns `Some(snapshot)`
- on conflict, returns `None` and does not alter the existing pending intent

If a budget of zero or another existing rule immediately produces
`BudgetLimited`, do not create pending `Initial`.

### 4. Implement ObjectiveUpdated Intent Mutation

`update_thread_goal_with_objective_intent(...)`:

- updates durable facts first
- increments facts version on writes
- inserts or replaces pending `ObjectiveUpdated` only when:
  - the objective changed or an objective update is explicitly requested
  - the resulting durable Goal status is `Active`
- clears active-state pending intent when the resulting status no longer
  permits active Goal steering
- returns the snapshot for the resulting row, or `None` on expected-goal
  mismatch/no row

This method must render from durable facts later. It must not store the update
request body as prompt text.

### 5. Implement BudgetLimit Intent Mutation

`account_thread_goal_usage_with_budget_intent(...)`:

- accounts usage first
- increments facts version only on `Updated(...)`
- inserts or replaces pending `BudgetLimit` only when this update transitions
  the durable Goal into `BudgetLimited` and model wrap-up is required
- clears stale `Initial` and `ObjectiveUpdated` rows for the same goal when
  BudgetLimit supersedes them
- returns an outcome that distinguishes updated-with-budget-intent from
  updated-without-budget-intent

The method must not create BudgetLimit intent on unchanged accounting outcomes.

### 6. Keep Exact-Key Commit Separate

Do not consume pending intent inside these mutation methods.

Consumption remains:

```rust
consume_pending_intent_exact(thread_id, goal_id, kind, facts_version)
```

Later Batch 02 final request-input commit will call exact-key consumption only
after the selected developer-role Goal item is present in the final model
request input.

### 7. Preserve Existing Facts-Only Methods

Keep these methods available and facts-only:

- `get_thread_goal(...)`
- `replace_thread_goal(...)`
- `insert_thread_goal(...)`
- `update_thread_goal(...)`
- `pause_active_thread_goal(...)`
- `usage_limit_active_thread_goal(...)`
- `delete_thread_goal(...)`
- `account_thread_goal_usage(...)`

Existing production callers must keep compiling against them.

Do not switch callers in:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

## Focused Tests

Add tests with prefix `goal_cadence_store_`.

Required tests:

- `goal_cadence_store_replace_active_goal_writes_initial_intent_atomically`
  - facts and pending Initial are visible together in the returned snapshot
  - pending intent references the returned `goal_id` and `facts_version`
- `goal_cadence_store_insert_active_goal_writes_initial_intent_atomically`
  - successful insert writes Initial
  - duplicate insert returns `None` and leaves existing pending intent intact
- `goal_cadence_store_objective_update_writes_objective_updated_intent`
  - objective update increments `facts_version`
  - pending ObjectiveUpdated uses the new durable facts version
- `goal_cadence_store_budget_accounting_writes_budget_limit_intent`
  - budget crossing persists usage/status first
  - pending BudgetLimit uses the returned durable facts version
- `goal_cadence_store_budget_limit_supersedes_active_state_intents`
  - BudgetLimit clears stale Initial and ObjectiveUpdated for the same goal
- `goal_cadence_store_terminal_updates_clear_active_state_intents`
  - terminal/stopped durable state clears pending active-state intents
- `goal_cadence_store_facts_only_methods_remain_non_cadence`
  - existing production-facing methods do not create pending intent

Keep exact-key consumption tests in 01b unless the implementation lands 01b
and 01c together. If combined, keep a distinct exact-key test name so Batch 02
implementers can find the commit primitive.

## Verification

Implementation verification:

```powershell
cd codex-rs
just fmt
cargo test -p codex-state --lib goal_cadence_store
```

Optional state compile check:

```powershell
cd codex-rs
cargo check -p codex-state --lib
```

Do not run broad workspace or full crate suites by default.

## Acceptance Criteria

This slice is complete when:

- cadence-aware store operations mutate facts and pending intent atomically
- Initial intent is pending after active create/replace through the new API
- ObjectiveUpdated intent is pending after active objective update through the
  new API
- BudgetLimit intent is pending only when accounting creates the budget-limit
  wrap-up condition
- exact-key consumption remains separate from mutation
- facts-only production methods remain available and do not create pending
  intent
- state returns facts, intent metadata, and outcomes only
- focused tests prove the durable cadence state contract without rendered
  Goal text or model input

## Non-Goals

This slice does not:

- select which pending intent to deliver for a request
- consume pending intent at mutation time
- render Goal prompt text
- choose model role
- construct `ResponseItem` or `ResponseInputItem`
- advance automatic Continuation watermarks
- repair request input
- convert core, app-server, or extension production callers

## Partial Landing Constraints

01c may land after 01a and 01b as an additive state interface.

If implementation pressure makes a production caller conversion appear
necessary, stop and move that conversion to Batch 02 or Batch 04. A half-wired
pending intent producer without final request-input commit would violate the
cadence contract.

