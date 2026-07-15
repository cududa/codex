# WA04e Extension BudgetLimit Cadence Intent

This implementation pass converts the extension post-tool BudgetLimit producer
to atomic BudgetLimit pending intent plus metadata-only cadence recheck.

Producer-side reported flags may suppress duplicate producer notifications.
They must not consume pending cadence intent.

## Direction Lock

Request:

- convert post-tool BudgetLimit reporting in `ext/goal`
- persist usage/status facts plus pending BudgetLimit intent atomically
- preserve BudgetLimit product accounting and events
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `GoalExtension::on_tool_finish(...)` accounts post-tool progress
- budget crossing currently calls `runtime.inject_active_turn_goal_steering(...)`
  with `GoalSteeringKind::BudgetLimit` and configured role
- `GoalRuntimeHandle::account_active_goal_progress(...)` is a shared helper
  currently calling facts-only accounting APIs from post-tool, mutation-prep,
  terminal update, turn-stop, and usage-limit paths
- `GoalAccountingState::mark_budget_limit_reported_if_new(...)` is producer
  duplicate suppression, not cadence delivery

Code-shape temptation:

- treat `mark_budget_limit_reported_if_new(...)` as if it delivered
  BudgetLimit steering
- keep active injection for BudgetLimit because it happens during a live turn
- make BudgetLimit a runtime-only notification rather than durable pending
  cadence intent

Locked direction:

- the post-tool BudgetLimit producer writes usage/status facts and pending
  BudgetLimit intent in one WA01 transaction only when the state outcome says
  wrap-up BudgetLimit cadence is newly due
- BudgetLimit delivery is selected by WA02 request-input shaping
- same-turn behavior uses WA04a metadata recheck only
- producer duplicate reporting never consumes pending intent
- shared accounting callers that merely preserve product accounting, terminal
  status, usage-limit behavior, or continued BudgetLimited accrual must not
  become implicit BudgetLimit cadence producers

Exclusions:

- no active model input construction in `ext/goal`
- no role selection
- no pending-intent consumption
- no recorded request evidence writer
- no Continuation watermark advancement

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/src/extension.rs`
  - `ToolLifecycleContributor::on_tool_finish(...)`
  - `GoalExtensionConfig.steering_role`
  - BudgetLimit TODOs
- `codex-rs/ext/goal/src/runtime.rs`
  - `account_active_goal_progress(...)`
  - `account_idle_goal_progress(...)`
  - `inject_active_turn_goal_steering(...)`
- `codex-rs/ext/goal/src/accounting.rs`
  - `BudgetLimitedGoalDisposition`
  - `mark_budget_limit_reported_if_new(...)`
- WA01 state accounting API
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - BudgetLimited and usage-limit tests

## Pass Goal

Replace the post-tool BudgetLimit producer path:

```text
account_thread_goal_usage(...)
  -> status is BudgetLimited
  -> mark producer reported
  -> build BudgetLimit GoalContext item
  -> active-turn injection
```

with:

```text
account_thread_goal_usage_with_budget_intent(...)
  -> state outcome says BudgetLimit cadence is newly due
  -> status/usage facts and pending BudgetLimit intent
  -> mark producer reported only for duplicate producer reporting
  -> metadata-only cadence recheck
```

## Exact Files To Edit

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/accounting.rs` only if outcome fields require
  producer-side state adjustment
- `codex-rs/core/src/codex_thread.rs` only for WA04a adapter callsite fallout
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

## Required Edits

1. Route the post-tool producer path that can create model wrap-up work through
   the WA01 cadence-aware budget/accounting API.
2. Ensure the state operation accounts progress, persists BudgetLimited facts,
   allocates facts version, and inserts pending BudgetLimit intent atomically
   only when the returned outcome represents newly due BudgetLimit cadence.
3. Preserve token/time accounting behavior.
4. Preserve BudgetLimited metrics/events.
5. Keep `mark_budget_limit_reported_if_new(...)` or equivalent only as
   producer duplicate suppression.
6. Ensure producer-side reported state does not clear or consume pending
   BudgetLimit intent.
7. Remove the BudgetLimit call to `inject_active_turn_goal_steering(...)`.
8. Request same-turn cadence recheck through WA04a metadata when appropriate.
9. Leave pending BudgetLimit intent intact when same-turn delivery is
   unavailable.
10. Keep `update_goal` tool excluded from normal post-tool progress counting.
11. Do not turn every caller of `account_active_goal_progress(...)` into a
    BudgetLimit cadence producer. Mutation prep, terminal update, usage-limit,
    turn-stop, and continued BudgetLimited accrual paths may update facts,
    allocate facts versions, or clear/supersede stale intent as their WA01
    outcomes require, but they must not create duplicate/new BudgetLimit
    cadence unless the outcome explicitly says model wrap-up work is due.

## Tests And Checks

Update extension tests:

- `budget_limited_goal_keeps_accruing_until_turn_stop`
  - preserve continued accrual behavior
  - assert continued accrual does not create duplicate BudgetLimit cadence
    after the producer already reported the pending intent
- `budget_limited_goal_keeps_accounting_after_later_tool_finish`
  - preserve later tool accounting
  - assert producer-side duplicate suppression does not consume pending intent
- `usage_limit_budget_limited_goal_accounts_remaining_progress`
  - preserve remaining progress accounting and UsageLimited transition
  - assert usage-limit handling does not create fresh BudgetLimit cadence

Add or update:

- `goal_extension_budget_limit_writes_pending_intent_not_model_input`
- a test proving producer-side reported flag does not consume pending
  BudgetLimit intent
- a test proving failed same-turn recheck leaves BudgetLimit pending
- a test proving shared accounting callers do not create duplicate BudgetLimit
  cadence after BudgetLimit was already pending or reported

Final payload coverage for BudgetLimit delivery belongs in 04h or a core
request test once converted producers exist.

## Branch Continuation State

After this pass:

- extension post-tool BudgetLimit producer writes durable pending intent when
  the WA01 outcome says BudgetLimit cadence is newly due
- extension BudgetLimit no longer injects concrete model input
- ObjectiveUpdated conversion from 04d and create conversion from 04c now cover
  all extension cadence producers
- steering role config and `steering.rs` cleanup still remain for 04f/04g

## Non-Goals

- do not remove all steering config
- do not delete `ext/goal/src/steering.rs`
- do not implement final payload tests for all WA04 scenarios
- do not change app-server Goal APIs
- do not consume pending BudgetLimit intent outside WA02 commit
