# Work Area 01c: Cadence-Aware Store Operations

This ordered pass adds the atomic state APIs that later producer and finalizer
work will call. These APIs mutate Goal facts and pending Initial,
ObjectiveUpdated, or BudgetLimit intent in one SQL transaction. They still do
not construct model input or decide final request cadence.

## Direction Lock

Request:

- complete Work Area 01 durable cadence state primitives
- add facts-plus-intent store operations and state tests
- leave production producer conversion to later Work Areas

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/01a-durable-facts-version-plumbing.md`
- `local/goal_136_plan/work-areas/01b-pending-cadence-intent-storage.md`

Terrain:

- 01a provides `ThreadGoal.facts_version` and versioned facts-only writes.
- 01b provides pending intent types, snapshot reads, exact-key consume, and
  cleanup helpers.
- current `GoalStore` writes are facts-only and are called by core, app-server,
  and `ext/goal`.
- current active steering still uses old runtime pending state, `GoalContext`,
  and concrete injection paths outside state.

Code-shape temptation:

- switch production callers to cadence-aware APIs before Work Area 02 can consume
  pending intent at final request input
- let state choose which pending intent is due for a request attempt
- return rendered Goal prompts or prebuilt model input from state outcomes
- use a non-exact consume helper as a convenience

Locked direction:

- cadence-aware state APIs return facts and pending-intent metadata only
- every facts-plus-intent mutation is atomic
- pending Initial, ObjectiveUpdated, and BudgetLimit intent survives until a
  later final request-input commit consumes it by exact key
- production callers stay facts-only until the finalizer and producer
  conversion passes can use the new APIs coherently

Exclusions:

- no Work Area 02 final request-input shaping
- no producer conversion in core, app-server, or `ext/goal`
- no same-turn concrete Goal item injection
- no Continuation persisted intent
- no request repair, compaction, projection, or classifier work

## Code Terrain Read

Directly read:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/lib.rs`
- compile-pressure callers in:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`

Observed facts:

- `GoalStore` is the correct ownership boundary for durable facts and pending
  intent.
- current production callers call `replace_thread_goal`, `insert_thread_goal`,
  `update_thread_goal`, `usage_limit_active_thread_goal`,
  `delete_thread_goal`, and `account_thread_goal_usage`.
- those current callers also have old active steering and runtime state nearby,
  so switching them inside Work Area 01 would create pending intent without the
  Work Area 02 final request commit path.
- accounting must distinguish unchanged facts, updated facts without
  BudgetLimit intent, and updated facts with BudgetLimit intent.

## Pass Goal

Add cadence-aware GoalStore operations that atomically update durable facts and
pending intent. Prove the durable cadence state contract in focused state
tests. Leave caller conversion as a later ordered pass.

## Exact Files To Edit

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/model/thread_goal.rs` if additional outcome types belong
  with the model

Do not edit these production callers except for compile fallout from public
type changes:

- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

## Required Edits

Add public operations equivalent to:

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

The exact names may change if the local implementation reads better, but the
responsibilities may not:

- create/replace active Goal writes pending Initial intent
- objective update writes pending ObjectiveUpdated intent
- budget-limit transition writes pending BudgetLimit intent
- all returned intent metadata uses the durable facts version from the same
  transaction
- state does not choose the request-attempt steering kind
- state does not build prompt text or model input

Add an accounting outcome type that distinguishes:

- unchanged facts
- updated facts without pending BudgetLimit intent
- updated facts with pending BudgetLimit intent

Every cadence-aware mutation must use one SQL transaction:

```text
begin transaction
  read previous facts when the outcome depends on a transition
  mutate thread_goals
  read returned facts_version / goal_id
  clear stale or superseded pending intent
  insert or replace pending intent when required
  read cadence snapshot or return outcome
commit
```

Intent creation rules:

- creating or replacing an active Goal inserts pending Initial intent
- creating or replacing a non-active Goal does not insert Initial intent
- objective update inserts pending ObjectiveUpdated only when the durable
  resulting Goal status is `Active`
- BudgetLimit inserts pending BudgetLimit when accounting changes durable facts
  into the BudgetLimited state that requires model wrap-up
- budget accounting must compare previous and resulting status inside the same
  transaction so already-budget-limited accounting does not create a new wrap-up
  intent by accident
- BudgetLimit may clear stale Initial and ObjectiveUpdated intent for the same
  goal as superseded
- deleting or clearing a Goal deletes all pending intent rows for the thread

Keep facts-only methods available and non-cadence:

- `replace_thread_goal`
- `insert_thread_goal`
- `update_thread_goal`
- `account_thread_goal_usage`

They may maintain facts version and mechanical stale-intent cleanup, but they
must not create new pending Initial, ObjectiveUpdated, or BudgetLimit intent.

## Tests And Checks

Add focused state tests in `codex-rs/state/src/runtime/goals.rs` with a shared
prefix such as `goal_cadence_`:

- `goal_cadence_replace_active_goal_writes_initial_intent_atomically`
- `goal_cadence_insert_active_goal_writes_initial_intent_atomically`
- `goal_cadence_insert_duplicate_does_not_mutate_existing_intent`
- `goal_cadence_objective_update_writes_objective_updated_intent`
- `goal_cadence_budget_accounting_writes_budget_limit_intent`
- `goal_cadence_budget_limit_supersedes_active_state_intents`
- `goal_cadence_consume_pending_intent_requires_exact_key`
- `goal_cadence_replacing_or_deleting_goal_clears_stale_intents`
- `goal_cadence_facts_only_methods_do_not_create_pending_intent`

These tests should inspect state snapshots and pending-intent rows. They should
not inspect rendered Goal text, model roles, request payloads, or rollout
history. Request payload tests belong to Work Area 02.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence
cargo test -p codex-state --lib goal_pending_intent
cargo test -p codex-state --lib goal_facts_version
```

Optional compile check if exports or outcome types churn:

```powershell
cd codex-rs
cargo check -p codex-state --lib
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, Work Area 01 durable state work should be ready for later
producer and finalizer passes to consume:

- Goal facts expose and maintain `facts_version`
- pending Initial / ObjectiveUpdated / BudgetLimit intent is structured state
- cadence-aware state APIs write facts and pending intent atomically
- exact-key consumption is available for the Work Area 02 commit path
- existing production callers are still not switched to cadence-aware APIs

The next Work Area, Work Area 02, owns selection, final request-input shaping, and
commit-time consumption. If implementation pressure suggests switching
production callers during 01c, stop and move that work into the later producer
conversion pass.

## Non-Goals

This pass does not:

- decide which pending intent is selected for a request attempt
- render Goal steering prompt text
- construct `ResponseItem` or `ResponseInputItem`
- consume pending intent before final request input contains the selected
  developer-role Goal item
- advance Continuation watermarking
- persist Continuation intent
- convert core, app-server, or `ext/goal` producers
- delete `GoalContext`, `GoalContextRole`, or active `<goal_context>` paths
