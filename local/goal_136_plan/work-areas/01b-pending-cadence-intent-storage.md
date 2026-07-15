# Work Area 01b: Pending Cadence Intent Storage

This ordered pass adds structured pending Initial, ObjectiveUpdated, and
BudgetLimit intent storage on top of the facts version from 01a. It exposes
storage primitives and exact-key cleanup, but it does not make production
callers create pending cadence intent yet.

## Direction Lock

Request:

- add durable pending cadence intent representation
- add exact-key consumption and supersedence cleanup helpers
- keep pending intent as structured state, not rendered text or model input

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/01a-durable-facts-version-plumbing.md`

Terrain:

- 01a adds `ThreadGoal.facts_version` and keeps facts-only writes versioned.
- there is no current pending intent table, row type, enum, or exact-key
  consume operation in `GoalStore`.
- `GoalStore` tests live beside the store implementation and can seed storage
  directly without involving model-input code.

Code-shape temptation:

- encode pending intent in rollout history, `<goal_context>`, or UI metadata
- treat ordinary rollout `ResponseItem`s, rollout trace payloads, or rendered
  Goal text as pending-intent storage or committed-delivery evidence
- use free-form strings at public API boundaries for intent kind
- consume by thread or kind only instead of exact key
- start writing pending intent from existing production callers before Work Area
  02 can consume it at final request input

Locked direction:

- pending cadence intent is structured durable state
- exact-key consumption requires thread id, goal id, kind, and facts version
- storage helpers return facts and intent metadata only
- pending intent storage is separate from recorded request evidence. It stores
  due Initial/ObjectiveUpdated/BudgetLimit work before delivery; evidence
  records a later committed finalized request attempt.
- state still does not render, select request cadence, or construct model input

Exclusions:

- no cadence-aware producer conversion
- no final request-input shaping
- no `ResponseEvent::Created` commit
- no `GoalRequestEvidence` carrier, item fingerprint, request-input
  fingerprint, replay pairing, or rollout trace policy
- no Continuation persisted intent
- no active steering repair or classifier work

## Code Terrain Read

Directly read:

- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/goals_migrations/0002_goal_cadence_state.sql` from 01a

Observed facts:

- `ThreadGoalRow` is crate-private and is the pattern for SQL row extraction.
- public model exports currently flow through `state/src/model/mod.rs` and
  `state/src/lib.rs`.
- existing `GoalStore` methods return one goal or an accounting outcome, so a
  cadence snapshot needs a new type instead of overloading facts-only methods.
- exact-key cleanup should be a simple SQL delete with all key columns in the
  `WHERE` clause.

## Pass Goal

Add pending intent types, snapshot reads, low-level insert/clear/consume
helpers, and tests that prove pending intent is stored and consumed by exact
key. Leave cadence-aware facts-plus-intent producer operations to 01c.

## Exact Files To Edit

- `codex-rs/state/goals_migrations/0002_goal_cadence_state.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/lib.rs`
- `codex-rs/state/src/runtime/goals.rs`

## Required Edits

Ensure the Work Area 01 migration includes the pending intent table:

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

Add model types equivalent to:

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

Do not add attempt ordinal, item index, item fingerprint,
request-input fingerprint, commit point, rendered prompt text, or rollout trace
payload fields to pending intent rows. Those belong to recorded request
evidence after a finalized request attempt reaches the commit point.

Add a crate-private row helper for pending intents, following the
`ThreadGoalRow` pattern.

Add kind conversion helpers:

- `ThreadGoalPendingIntentKind::as_str`
- `TryFrom<&str> for ThreadGoalPendingIntentKind`

Add store operations equivalent to:

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

The implementation may keep lower-level insert helpers private until 01c, but
tests may use a private helper to seed pending rows.

Exact consumption must use all key fields:

```sql
DELETE FROM thread_goal_pending_intents
WHERE thread_id = ?
  AND goal_id = ?
  AND kind = ?
  AND facts_version = ?;
```

Update existing facts-only delete/replace/status cleanup only where the helper
exists and the behavior is mechanical:

- deleting a Goal deletes all pending rows for the thread
- replacing a Goal clears pending rows for the thread before inserting new
  Goal facts or in the same transaction if the implementation has one
- terminal/manual statuses clear active-state pending intent that can no
  longer be delivered

Do not add pending intent creation to existing production-facing facts-only
methods. That belongs to 01c cadence-aware APIs and later caller conversion.

## Tests And Checks

Add focused tests in `codex-rs/state/src/runtime/goals.rs` with names such as:

- `goal_pending_intent_snapshot_reads_goal_and_intents`
- `goal_pending_intent_consume_requires_exact_key`
- `goal_pending_intent_clear_superseded_intents_is_goal_scoped`
- `goal_pending_intent_delete_goal_clears_thread_intents`
- `goal_pending_intent_facts_only_methods_do_not_create_intent`

The tests may seed pending rows through a private test helper. They should not
construct prompt text, model input, rollout items, recorded request evidence,
or legacy Goal artifacts.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_pending_intent
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, the branch should have:

- durable facts versioning from 01a
- pending intent schema and Rust model types
- snapshot reads that return facts plus pending intent metadata
- exact-key consume and mechanical cleanup helpers
- facts-only production callers still unchanged
- no structured request-evidence carrier or replay behavior

The next pass, 01c, inherits these storage primitives and adds atomic
facts-plus-intent operations for creation, objective update, and budget-limit
accounting.

## Non-Goals

This pass does not:

- select the due pending intent for a model request
- write pending intent from current production callers
- consume intent because a prompt was rendered
- commit delivery on `ResponseEvent::Created`
- record committed request-input evidence
- render internal Goal context
- construct or repair final request input
- persist Continuation intent
