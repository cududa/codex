# Work Area 01c: Cadence-Aware Store Operations

This ordered pass adds the atomic state APIs that later producer and
request-input commit paths will call. These APIs mutate Goal facts and pending
Initial, ObjectiveUpdated, or BudgetLimit intent in one SQL transaction. They
still do not construct model input or decide final request cadence.

## Direction Lock

Request:

- complete Work Area 01 durable cadence state primitives
- add facts-plus-intent store operations and state tests
- leave production producer conversion to later Work Areas

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
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
- make cadence-aware state operations append or interpret recorded request
  evidence because they already know the facts version and intent key

Locked direction:

- cadence-aware state APIs return facts and pending-intent metadata only
- every facts-plus-intent mutation is atomic
- pending Initial, ObjectiveUpdated, and BudgetLimit intent survives until a
  later final request-input commit consumes it by exact key
- production callers stay facts-only until the request-input shaping/commit
  and producer conversion passes can use the new APIs coherently

Exclusions:

- no Work Area 02 final request-input shaping
- no producer conversion in core, app-server, or `ext/goal`
- no same-turn concrete Goal item injection
- no `GoalRequestEvidence` append, request-input fingerprinting, replay
  pairing, rollout trace policy, or raw response notification behavior
- no Continuation persisted intent
- no request repair, compaction, projection, or classifier work

## Code Terrain Read

Directly read:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/lib.rs`
- downstream caller surfaces, read to keep producer conversion out of this pass:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
  - `codex-rs/ext/goal/src/tool.rs`
  - `codex-rs/ext/goal/src/runtime.rs`
- request/replay terrain from the parent Work Area, only to keep cadence-aware
  mutations from absorbing final request-input commit or replay duties:
  - `codex-rs/protocol/src/protocol.rs`
  - `codex-rs/core/src/session/mod.rs`
  - `codex-rs/core/src/session/turn.rs`
  - `codex-rs/core/src/session/rollout_reconstruction.rs`
  - `codex-rs/thread-store/src/live_thread.rs`
  - `codex-rs/rollout/src/policy.rs`

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
- recorded request evidence is not present in current state code, rollout
  item shape, or reconstruction. It belongs to the later Created-event commit
  and replay integration, not to these state mutations.
- state may later own default automatic Continuation watermark durability, but
  Work Area 01c does not advance Continuation suppression and does not create
  persisted Continuation intent.

## Pass Goal

Add cadence-aware GoalStore operations that atomically update durable facts and
pending intent. Prove the durable cadence state contract in focused state
tests. Leave caller conversion as a later ordered pass.

## Exact Files To Edit

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/model/thread_goal.rs` if additional outcome types belong
  with the model

Do not edit these production callers except for direct public type fallout from
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
- state does not store request-input fingerprints, item fingerprints, attempt
  ordinals, `ResponseEvent::Created` evidence, or rollout trace payloads

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
- `pause_active_thread_goal`
- `usage_limit_active_thread_goal`
- `delete_thread_goal`
- `account_thread_goal_usage`

They may maintain facts version and mechanical stale-intent cleanup, but they
must not create new pending Initial, ObjectiveUpdated, or BudgetLimit intent.

Do not scatter deferred-work notes through production callers. If comments are
needed, keep them near the new cadence-aware APIs and frame them as APIs for
later cadence-aware producer conversion.

## Tests And Checks

Add one focused state test:

- `goal_cadence_mutations_write_current_pending_intent`

It should prove:

- active create/replace writes pending Initial intent with the returned
  durable facts version, while non-active create/replace does not
- duplicate insert does not mutate existing facts or pending intent
- active objective update writes pending ObjectiveUpdated intent with the
  returned durable facts version
- budget-limit transition writes pending BudgetLimit intent with the returned
  durable facts version
- already-budget-limited accounting does not create a fresh BudgetLimit intent
- BudgetLimit clears stale Initial and ObjectiveUpdated intent for the same
  Goal when the supersedence rule applies
- existing facts-only methods still do not create pending cadence intent

Split out the smallest BudgetLimit-specific test only if the implemented flow
becomes difficult to read as one test.

This test should inspect state snapshots and pending-intent rows. It should
not inspect rendered Goal text, model roles, request payloads, rollout history,
raw notifications, or recorded request evidence. Request payload tests belong
to Work Area 02.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence
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

These checks are the local confidence bar for the Work Area 01 state slice.
They do not mean the full route, product runtime, or every downstream test must
be usable after 01c. Broad build or workspace validation belongs later in the
ordered Work Areas unless a focused state API change creates a specific reason
to run it.

## Branch Continuation State

After this pass, Work Area 01 durable state work should be ready for later
producer and request-input commit passes to consume:

- Goal facts expose and maintain `facts_version`
- pending Initial / ObjectiveUpdated / BudgetLimit intent is structured state
- cadence-aware state APIs write facts and pending intent atomically
- exact-key consumption is available for the Work Area 02 commit path
- existing production callers are still not switched to cadence-aware APIs
- no recorded request evidence is appended, replayed, or used as a state
  correctness source

The next Work Area, Work Area 02, owns selection, final request-input shaping,
commit-time consumption, and evidence metadata.

Later producer conversion must remain deliberate:

- core Goal mutation and tool paths switch when final request-input shaping can
  consume pending intent
- app-server external Goal mutation switches when resume/idle ordering is
  aligned with the cadence contract
- `ext/goal` switches when extension steering is converted away from concrete
  Goal item injection

If implementation pressure suggests switching production callers during 01c,
stop and move that work into the later producer conversion pass.

## Non-Goals

This pass does not:

- decide which pending intent is selected for a request attempt
- render Goal steering prompt text
- construct `ResponseItem` or `ResponseInputItem`
- consume pending intent before final request input contains the selected
  developer-role Goal item
- record committed request-input evidence
- advance Continuation watermarking
- persist Continuation intent
- repair request input
- classify current or legacy Goal items
- convert core, app-server, or `ext/goal` producers
- delete `GoalContext`, `GoalContextRole`, or active `<goal_context>` paths
