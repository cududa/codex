# 01 Prep And Infrastructure

This slice removes false test pressure and adds the infrastructure required by
the active behavior switch.

It must not partially convert active Goal producers. Producer conversion
belongs to `02-atomic-behavior-switch.md`.

## Authority Inputs

Read first:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Goals

- Remove local tests that defend fake active Goal context behavior.
- Restore upstream Goal product test pressure where local overlay hunks drifted.
- Restore/adapt generic internal-context infrastructure with explicit role
  conversion.
- Split current internal-context classification from legacy `<goal_context>`
  classification.
- Add durable cadence state: facts revision, pending intent, and committed
  cadence records.

## Test Prep

Files:

- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Delete local-only fake-context tests:

- `detects_goal_context_fragment`
- `goal_context_response_input_item_uses_explicit_steering_role`
- `goal_context_does_not_parse_as_visible_turn_item`
- `developer_goal_context_is_contextual_without_invalidating_by_itself`
- `mixed_developer_goal_context_remains_non_contextual`
- `drop_last_n_user_turns_trims_developer_goal_context_above_rolled_back_turn`
- `user_goal_context_is_not_a_user_turn_boundary`
- `reconstruct_history_filters_pure_goal_context_from_replacement_history`
- `ignores_goal_context_response_items_in_rollout_replay`

Delete local-only steering overlay tests:

- `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`
- `late_goal_steering_injection_is_not_persisted_unsampled`
- `configured_goal_objective_limit_allows_longer_goals`
- `thread_goal_set_active_schedules_developer_role_goal_steering`

Delete local-only TUI overlay tests:

- `goal_slash_command_uses_configured_objective_limit`
- `goal_pause_interrupts_active_turn_after_status_event`
- `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`
- `ctrl_c_interrupts_active_turn_without_pausing_goal`
- `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`
- `paused_idle_ctrl_c_requests_quit_without_goal_mutation`

Remove local config test assertions for `[goals] steering_role`.

Revert Goal-related hunks in these upstream test files to `rust-v0.136.0`
baseline, without resetting unrelated work:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Baseline checks already show:

- the local-only delete tests above are absent from `rust-v0.136.0`
- upstream app-server Goal product tests such as
  `thread_goal_get_rejects_unmaterialized_thread`,
  `thread_resume_keeps_paused_goal_paused`,
  `thread_goal_set_preserves_budget_limited_same_objective`,
  `thread_goal_set_persists_resumable_stopped_statuses`,
  `thread_goal_set_edits_objective_without_resetting_usage`, and
  `thread_goal_clear_deletes_goal_and_notifies` are present in
  `rust-v0.136.0`
- upstream core Goal runtime/tool tests named in
  `goal-test-deletion-map.md` are present in `rust-v0.136.0`
- upstream TUI Goal validation, status, budget, review, and action tests named
  in `goal-test-deletion-map.md` are present in `rust-v0.136.0`

Keep or adapt `emits_goal_context_raw_response_item_notifications` when it
proves the desired raw contract: raw response item notifications remain raw for
legacy Goal artifacts, current internal-context items, and mixed prose. Delete
old `suppresses_goal_context_raw_response_item_notifications` or equivalent
Goal-specific raw-stream filtering assertions if present.

Snapshot handling:

- delete snapshots only when deleting their local-only owner test
- restore upstream-owned Goal snapshots to `rust-v0.136.0` only when local Goal
  hunks changed them
- do not delete upstream snapshots merely because they mention Goal, budget,
  usage, statuses, or `/goal`

## Generic Internal-Context Role Support

Files:

- `codex-rs/core/src/context/internal_model_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/fragment.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/goal_context.rs` or replacement
  `legacy_goal_context.rs`

Upstream `rust-v0.136.0` already had a generic `internal_model_context.rs`.
Use that as terrain to restore/adapt, not as an authority-preserving shape to
copy blindly: upstream conversion was still user-role through
`ContextualUserFragment`, and its internal-context matching also accepted
legacy `<goal_context>` text.

Required edits:

- restore/adapt upstream generic internal-context terrain
- add explicit role-bearing conversion to `ResponseInputItem` and
  `ResponseItem`
- validate source names such as `goal`
- render `<codex_internal_context source="goal">...</codex_internal_context>`
- parse and classify pure internal-context items
- keep current internal-context classification separate from legacy
  `<goal_context>` artifact classification
- ensure pure legacy Goal wrappers do not match as current generic internal
  context
- ensure `source = "goal"` remains provenance only; outer `developer` role is
  the authority carrier
- export only the narrow generic API needed by `ext/goal`
- keep legacy pure `<goal_context>` detection only for artifact cleanup
- prove mixed marker-like prose remains ordinary text
- do not convert or preserve active Goal producers in this slice

Goal-specific code owns cadence selection, durable Goal lookup, prompt
rendering, and objective escaping. Generic internal context owns only source,
rendering, classification, and role-bearing conversion.

## Durable Goal Facts Version

Use a dedicated facts revision, not `thread_goals.updated_at_ms`, so same
millisecond mutations cannot produce the same durable facts version.

State migration:

```sql
ALTER TABLE thread_goals
ADD COLUMN facts_revision INTEGER NOT NULL DEFAULT 1;
```

Required behavior in `codex-rs/state/src/runtime/goals.rs`:

- `replace_thread_goal` creates a new logical goal with `facts_revision = 1`.
- `insert_thread_goal` creates a new logical goal with `facts_revision = 1`.
- `update_thread_goal`, `pause_active_thread_goal`,
  `usage_limit_active_thread_goal`, and `account_thread_goal_usage` increment
  `facts_revision = facts_revision + 1` only when they mutate the stored Goal
  row.
- `ThreadGoalRow` and `ThreadGoal` in
  `codex-rs/state/src/model/thread_goal.rs` expose `facts_revision: i64`.
- All cadence APIs call this value `durable_facts_version`; do not keep
  `durable_facts_version_ms` wording in new Rust names.

## Pending Cadence Intent Storage

Owner: `codex-rs/state`.

Add a goals migration, for example
`codex-rs/state/goals_migrations/0002_thread_goal_cadence.sql`:

```sql
CREATE TABLE thread_goal_pending_steering_intents (
    thread_id TEXT PRIMARY KEY NOT NULL,
    goal_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN (
        'initial',
        'objective_updated',
        'budget_limit'
    )),
    durable_facts_version INTEGER NOT NULL,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL
);
```

Use one pending row per thread because a thread has one durable Goal row and
cadence kinds supersede each other. Supersedence inside the state transaction:

```text
BudgetLimit
ObjectiveUpdated
Initial
```

Exact Rust model shapes in `codex-rs/state/src/model/thread_goal.rs`:

```rust
pub enum PendingGoalSteeringIntentKind {
    Initial,
    ObjectiveUpdated,
    BudgetLimit,
}

pub struct PendingGoalSteeringIntent {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub kind: PendingGoalSteeringIntentKind,
    pub durable_facts_version: i64,
    pub created_at_ms: i64,
    pub updated_at_ms: i64,
}

pub struct PendingGoalSteeringIntentKey {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub kind: PendingGoalSteeringIntentKind,
    pub durable_facts_version: i64,
}
```

Required `GoalStore` APIs:

- `get_pending_goal_steering_intent(thread_id)`
- `upsert_pending_goal_steering_intent(tx, key)` as a transaction-internal
  helper that applies supersedence
- `clear_pending_goal_steering_intent_if_matches(thread_id, goal_id, kind, durable_facts_version) -> bool`
- `delete_thread_goal_and_cadence(thread_id) -> bool`

The clear method must be compare-and-delete:

```sql
DELETE FROM thread_goal_pending_steering_intents
WHERE thread_id = ?
  AND goal_id = ?
  AND kind = ?
  AND durable_facts_version = ?;
```

This full key is required so an old commit cannot erase a newer
ObjectiveUpdated or BudgetLimit intent.

## Atomic Goal Mutation APIs

Do not create pending intent after durable Goal mutation as a second logical
operation. Replace current callers of `insert_thread_goal`,
`replace_thread_goal`, `update_thread_goal`, and `account_thread_goal_usage`
with transaction-shaped APIs that mutate Goal facts and pending cadence intent
together.

Add state-layer outcome shapes:

```rust
pub struct GoalMutationWithCadence {
    pub goal: ThreadGoal,
    pub previous_goal: Option<ThreadGoal>,
    pub pending_intent: Option<PendingGoalSteeringIntent>,
}

pub enum GoalAccountingWithCadenceOutcome {
    Unchanged(Option<ThreadGoal>),
    Updated(GoalMutationWithCadence),
}
```

Required transaction-shaped APIs:

- `insert_thread_goal_with_cadence_intent(thread_id, objective, status, token_budget)`
- `replace_thread_goal_with_cadence_intent(thread_id, objective, status, token_budget)`
- `update_thread_goal_with_cadence_intent(thread_id, GoalUpdate)`
- `account_thread_goal_usage_with_cadence_intent(thread_id, time_delta_seconds, token_delta, mode, expected_goal_id)`
- `delete_thread_goal_and_cadence(thread_id)`

Keep `codex-rs/state/BUILD.bazel` as-is unless the migration glob changes; it
already includes `goals_migrations/**`.

Intent selection inside the same SQL transaction:

- New logical active Goal creates pending Initial.
- Same active Goal objective change creates pending ObjectiveUpdated.
- A mutation that results in BudgetLimited creates pending BudgetLimit.
- BudgetLimit supersedes ObjectiveUpdated and Initial.
- ObjectiveUpdated supersedes Initial.
- Inactive or terminal statuses that do not require BudgetLimit steering clear
  stale pending intent for the same thread/goal in the same transaction.

This transaction boundary is the crash and race policy. There is no acceptable
state where durable Goal facts changed but the required pending cadence intent
was not persisted.

## Committed Cadence Records

Automatic Continuation does not get persisted pending intent.

It does need committed delivery metadata so resume can reconstruct runtime
duplicate suppression without parsing rendered Goal text. Store committed
cadence records in the goals DB:

```sql
CREATE TABLE thread_goal_steering_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT NOT NULL,
    turn_id TEXT,
    goal_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN (
        'initial',
        'continuation',
        'objective_updated',
        'budget_limit'
    )),
    durable_facts_version INTEGER NOT NULL,
    model_visible_history_key TEXT NOT NULL,
    delivery_source TEXT NOT NULL CHECK(delivery_source IN (
        'pending_intent',
        'auto_continuation',
        'repair_reconstruction'
    )),
    response_item_json TEXT NOT NULL,
    response_created_at_ms INTEGER NOT NULL,
    recorded_at_ms INTEGER NOT NULL,
    UNIQUE(
        thread_id,
        goal_id,
        kind,
        durable_facts_version,
        model_visible_history_key,
        delivery_source
    )
);
```

Required APIs:

- `insert_thread_goal_steering_record(record)`
- `latest_thread_goal_steering_record(thread_id, goal_id)`
- `latest_thread_goal_steering_record_by_kind(thread_id, goal_id, kind)`

`response_item_json` stores the exact serialized `ResponseItem` that reached
the final model request input. It is not optional metadata. Structured repair
or reconstruction must restore this exact item from the committed record; it
must not re-render a historical cadence record from current durable Goal facts,
because those facts may have changed after the original request.

Runtime state in `codex-rs/core/src/goals.rs` or a new cadence module:

```rust
struct AutoContinuationWatermark {
    goal_id: String,
    model_visible_history_key: ModelVisibleHistoryKey,
    durable_facts_version: i64,
}
```

On resume, seed the in-memory watermark only when the latest committed
Continuation record for the current active goal has the same `goal_id`,
`model_visible_history_key`, and `durable_facts_version` as the current
candidate key. Do not create pending Continuation rows.

## Verification

Test prep:

- targeted tests for restored upstream behavior
- no replacement test may require active `<goal_context>` or user-role Goal
  steering
- raw-stream regression guard proves raw notifications remain raw

Generic internal context:

- source validation accepts `goal`
- malformed source values are rejected
- developer-role conversion produces developer-role model input
- user-role conversion is not used by active Goal steering
- pure current Goal internal-context classification works
- pure legacy artifact classification works
- non-Goal source preservation works
- mixed prose is preserved
- legacy `<goal_context>` does not classify as current generic internal context

State:

- monotonic facts revision
- atomic mutation plus pending intent creation
- supersedence
- compare-and-delete clearing
- delete cleanup
- committed Continuation record lookup

Suggested focused check after Rust edits:

```text
cargo test -p codex-state pending_goal_steering
```
