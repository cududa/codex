# Goal Authority Implementation Execution Plan

This plan converts the Goal authority contracts in this directory into ordered
implementation slices. It is execution guidance only. The authority order and
vocabulary remain in `local/goal_research/AGENTS.md` and the five Goal authority
documents read for this pass.

Existing Rust code is terrain. It identifies owners and hooks; it does not
change the target architecture.

## Direction Lock

- Request: produce a concrete, code-grounded implementation plan at this file.
- Authority: active Goal steering is a final model request input item with outer
  `developer` role, using generic role-bearing internal context; Initial,
  ObjectiveUpdated, and BudgetLimit use durable pending cadence intent;
  Continuation is idle-derived with runtime duplicate suppression; resume is
  hydration; repair and classifiers are not authority predicates.
- Terrain: current code still uses `GoalContext`, `GoalContextRole`,
  configurable `GoalSteeringRole`, runtime-only Initial state, concrete
  same-turn `ResponseInputItem` injection, and generic pending-input
  pre-recording before final request inspection.
- Code-shape temptation: reuse current `ContextManager::history_version()`,
  commit at stream acceptance, clear pending intent by a short key, or keep
  `<goal_context>` classifiers as active Goal proof because those seams already
  exist.
- Locked direction: implement the contracts through durable cadence state,
  retry-loop final model input finalization, `ResponseEvent::Created` commit,
  compare-and-delete pending intent clearing, a dedicated
  `model_visible_history_key`, a monotonic Goal facts revision, turn-local
  same-turn delivery metadata, and projection/cleanup-only classifiers.
- Exclusions: do not implement Rust during this planning pass; do not run broad
  Rust suites; do not revert unrelated local changes.

## Code-Grounded Decisions

### Durable Goal Facts Version

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
- All cadence APIs call this value `durable_facts_version`; do not keep the
  old plan's `durable_facts_version_ms` wording in new Rust names.

### Pending Cadence Intent Storage

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

### Atomic Goal Mutation APIs

Do not create pending intent after durable Goal mutation as a second logical
operation. Replace current callers of `insert_thread_goal`, `replace_thread_goal`,
`update_thread_goal`, and `account_thread_goal_usage` with transaction-shaped
APIs that mutate Goal facts and pending cadence intent together.

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

### Committed Cadence Records And Continuation Metadata

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
Continuation record for the current active goal has the same
`goal_id`, `model_visible_history_key`, and `durable_facts_version` as the
current candidate key. Do not create pending Continuation rows.

### Model Visible History Key

Owner: `codex-rs/core/src/context_manager/history.rs`, surfaced through
`Session`.

Add a distinct `model_visible_history_generation: u64` to `ContextManager` and
expose:

```rust
pub(crate) struct ModelVisibleHistoryKey(String);

impl ContextManager {
    pub(crate) fn model_visible_history_key(&self) -> ModelVisibleHistoryKey;
}
```

The serialized key can be `format!("mv:{}", model_visible_history_generation)`.
The important part is the increment policy, not the string format.

Increment `model_visible_history_generation` when model-visible rollout history
changes in a way that can justify another automatic Continuation:

- `ContextManager::record_items` records any API message that will participate
  in `for_prompt`, except Goal cadence items recorded through the finalizer's
  Goal-specific recording path.
- `ContextManager::replace`, `replace_history`, and `replace_compacted_history`
  install a replacement history.
- `remove_last_item`, rollback, `drop_last_n_user_turns`, and
  `replace_last_turn_images` change the prompt-visible history.
- `record_completed_response_item_with_finalized_facts` records assistant,
  tool-call, reasoning, or other model output through `record_conversation_items`.
- `drain_in_flight` records tool outputs.
- `record_user_prompt_and_emit_turn_item`, mailbox delivery, hook-added
  contextual items, and non-Goal queued response items record model-visible
  input through `record_conversation_items`.

Do not increment `model_visible_history_generation` for:

- raw response item notifications
- typed UI or app-server projection changes
- token usage, status/footer, or `ThreadGoalUpdated` events
- rendering prompt text
- constructing `ResponseInputItem`
- selected but uncommitted Goal cadence metadata
- Goal cadence items recorded by the finalizer, including Initial,
  ObjectiveUpdated, BudgetLimit, and Continuation

The finalizer captures the candidate `model_visible_history_key` from the
history snapshot before adding any selected Goal cadence item. The automatic
Continuation item itself must not be the history change that justifies another
Continuation.

### Generic Role-Bearing Internal Context

Owner: `codex-rs/core/src/context/internal_model_context.rs`.

Upstream `rust-v0.136.0` already had a generic `internal_model_context.rs`.
Use that as terrain to restore/adapt, not as an authority-preserving shape to
copy blindly: upstream conversion was still user-role through
`ContextualUserFragment`, and its internal-context matching also accepted
legacy `<goal_context>` text. The replacement must split those concerns.

The core context module owns generic rendering and role conversion:

```rust
pub struct InternalContextSource;
pub struct InternalModelContextFragment;
pub enum InternalModelContextRole {
    User,
    Developer,
}
```

Required responsibilities:

- validate source names such as `goal`
- render `<codex_internal_context source="goal">...</codex_internal_context>`
- parse and classify pure internal-context items
- convert to `ResponseInputItem` and `ResponseItem` with an explicit outer role
- keep current internal-context classification separate from legacy
  `<goal_context>` classification; a pure legacy Goal wrapper must not match as
  current generic internal context
- ensure `source = "goal"` remains provenance only; the outer `developer` role
  is the authority carrier

Because `codex-rs/ext/goal` remains a separate compiled crate that currently
constructs Goal steering, export only the narrow generic API it needs from
`codex_core::context`. Do not leave `GoalContext` or `GoalContextRole` as the
active steering API.

Goal-specific code owns cadence selection, durable Goal lookup, prompt
rendering, and objective escaping. Generic internal context owns only source,
rendering, classification, and role-bearing conversion.

## Final Model Request Input Hook

### Hook Location

The finalizer belongs inside the retry loop in
`codex-rs/core/src/session/turn.rs::run_sampling_request()`.

Current terrain:

- `run_turn()` builds initial request input from
  `sess.clone_history().await.for_prompt(...)`.
- `run_sampling_request()` receives that input, then on retries rebuilds input
  again from history inside its loop.
- `try_run_sampling_request()` receives a `Prompt` and handles
  `ResponseEvent::Created`.

Required shape:

```rust
loop {
    let prompt_input = if let Some(input) = initial_input.take() {
        input
    } else {
        sess.clone_history()
            .await
            .for_prompt(&turn_context.model_info.input_modalities)
    };

    let finalized = sess
        .finalize_goal_model_request_input_for_attempt(
            turn_context.as_ref(),
            prompt_input,
        )
        .await?;

    let prompt = build_prompt(
        finalized.input,
        router.as_ref(),
        turn_context.as_ref(),
        base_instructions.clone(),
    );

    let err = match try_run_sampling_request(
        ...,
        &prompt,
        finalized.goal_commit,
        ...
    ).await { ... };
}
```

This finalizer must run for the first attempt, every retry, and every follow-up
request that is rebuilt from history. Do not finalize only in `run_turn()`.

### Commit Point

Commit is not stream acceptance. It must not happen after
`client.stream_request(...).await` returns `Ok(stream)`.

Thread a `GoalRequestCommit` into `try_run_sampling_request()`. Commit exactly
once when `ResponseEvent::Created` is observed:

```rust
match event {
    ResponseEvent::Created => {
        if let Some(commit) = goal_commit.take() {
            sess.commit_goal_request_on_response_created(
                turn_context.as_ref(),
                commit,
            ).await?;
        }
    }
    ...
}
```

Failure policy:

- If stream creation or transport submission fails before `ResponseEvent::Created`,
  do not record cadence, do not clear pending intent, and do not advance the
  Continuation watermark. A retry will run the finalizer again.
- If the stream closes or errors before `ResponseEvent::Created`, same behavior:
  pending intent remains pending.
- If `ResponseEvent::Created` is observed and the stream later errors before
  `response.completed`, keep the commit. A model response exists.
- If the commit transaction itself fails after `ResponseEvent::Created`, return
  an error from the sampling attempt and do not pretend pending intent was
  cleared or watermark advanced. This must be logged as a durable cadence commit
  failure.
- Do not use the existing `persist_rollout_items()` helper as the commit
  contract for Goal cadence items; that helper currently logs append failures
  and returns `()`. The Goal cadence commit path needs a fallible,
  Goal-specific persistence/reconciliation path.

### Commit Contents

`GoalRequestCommit` contains:

```rust
struct GoalRequestCommit {
    thread_id: ThreadId,
    turn_id: String,
    goal_id: String,
    kind: GoalSteeringKind,
    durable_facts_version: i64,
    model_visible_history_key: ModelVisibleHistoryKey,
    delivery_source: GoalDeliverySource,
    response_item: ResponseItem,
    pending_intent_key: Option<PendingGoalSteeringIntentKey>,
    runtime_watermark: Option<AutoContinuationWatermark>,
}
```

At `ResponseEvent::Created`, in this order:

1. In one goals-state transaction, insert `thread_goal_steering_records` with
   `response_item_json` and, when this delivered pending Initial,
   ObjectiveUpdated, or BudgetLimit, clear pending intent with the full
   compare-and-delete key:
   `thread_id + goal_id + kind + durable_facts_version`.
2. If the goals-state transaction fails, return an error and leave runtime
   watermark/carry state untouched.
3. Record the exact Goal cadence item into in-memory history and rollout
   through a Goal-specific path that does not increment
   `model_visible_history_key` and does not swallow rollout append errors.
4. If rollout append fails after the goals-state record exists, keep the
   committed steering record; its `response_item_json` is the source for
   reconciliation or structured reconstruction. Do not recreate the item from
   current durable facts.
5. If this delivered automatic Continuation, update the runtime
   `AutoContinuationWatermark`.
6. Add committed current-turn carry metadata to `TurnState`.

The goals-state transaction is the durable cadence commit. It must be
idempotent under retry by using the unique record key and full pending-intent
compare-delete key. A duplicate insert of the same committed record must not
erase a newer pending intent or advance the Continuation watermark twice.

Rendering, selecting, reserving, constructing `ResponseInputItem`, or setting
turn-local requested metadata must not record cadence or consume pending
intent.

## Same-Turn Delivery Metadata

Current code in `codex-rs/core/src/session/input_queue.rs` and
`codex-rs/core/src/state/turn.rs` appends concrete Goal
`ResponseInputItem`s into turn pending input and carry before final request
inspection. Replace that with turn-local requested cadence metadata.

### Turn State Shapes

In `codex-rs/core/src/state/turn.rs` replace `GoalSteeringCarryPurpose` and
`GoalSteeringCarryItem` with explicit request and committed-carry types:

```rust
pub enum TurnGoalCadenceRequest {
    PendingIntent {
        key: PendingGoalSteeringIntentKey,
        origin: PendingGoalCadenceOrigin,
    },
    AutoContinuation {
        goal_id: String,
        durable_facts_version: i64,
        model_visible_history_key: ModelVisibleHistoryKey,
    },
}

pub enum PendingGoalCadenceOrigin {
    TurnStart,
    SameTurn,
    IdleReserved,
}

pub struct CommittedGoalCadenceCarryItem {
    pub goal_id: String,
    pub kind: GoalSteeringKind,
    pub durable_facts_version: i64,
    pub model_visible_history_key: ModelVisibleHistoryKey,
    pub item: ResponseInputItem,
}
```

`TurnState` owns:

- `turn_start_pending_goal_intent: Option<PendingGoalSteeringIntentKey>`
- `requested_goal_cadence: Option<TurnGoalCadenceRequest>`
- `committed_goal_cadence_items: Vec<CommittedGoalCadenceCarryItem>`
- the existing injection/open phase, renamed if useful but preserving the
  closed/open lifecycle

### Lifecycle

Turn start:

- When a regular turn is started in `codex-rs/core/src/tasks/mod.rs`, call a
  Goal cadence helper that reads the current durable pending intent and stores
  its key in `turn_start_pending_goal_intent` when it is eligible.
- A turn-start pending key makes that pre-existing pending intent eligible for
  delivery by the finalizer on that regular turn.

Same-turn Goal mutation:

- The state mutation API atomically writes the pending intent first.
- The producer then calls a new input-queue/session method such as
  `request_goal_cadence_delivery_for_active_turn(key)`.
- If there is an active turn and the injection phase is open, set
  `requested_goal_cadence = PendingIntent { key, origin: SameTurn }`.
- If there is no active turn or the phase is closed, do not set metadata. The
  durable pending intent remains for a later ordinary user turn or idle-hook
  cadence-delivery turn.

Idle pending-intent turn:

- The idle hook reserves an active turn and sets
  `requested_goal_cadence = PendingIntent { key, origin: IdleReserved }`.
- The idle hook does not append a concrete Goal item to pending input.

Automatic Continuation turn:

- The idle hook reserves an active turn and sets
  `requested_goal_cadence = AutoContinuation { ... }`.
- The watermark is not advanced until commit on `ResponseEvent::Created`.

Supersedence:

- `BudgetLimit` replaces `ObjectiveUpdated` or `Initial` requested metadata.
- `ObjectiveUpdated` replaces `Initial`.
- `Initial` does not replace `ObjectiveUpdated` or `BudgetLimit`.
- Any metadata whose `goal_id` or `durable_facts_version` no longer matches
  durable pending intent is stale and must be ignored by the finalizer.
- A lower-priority stale request must not block a higher-priority durable
  pending intent that is eligible through turn-start or idle reservation.

Injection-closed behavior:

- Closing the injection phase prevents new same-turn request metadata.
- If same-turn metadata exists but the phase closes before another model request
  uses it, drop the metadata and leave durable pending intent untouched.
- A closed active turn must not get a newly discovered durable pending intent
  merely because the finalizer can read the database.

Compaction carry:

- Only `committed_goal_cadence_items` may be carried across mid-turn compaction
  or used for request-local seam repair.
- `turn_start_pending_goal_intent` and `requested_goal_cadence` are not proof
  that the model saw Goal authority. They are not persisted in rollout and must
  not be projected as delivered cadence.

### Finalizer Selection Order

For each request attempt, the finalizer:

1. Reads the current durable Goal and current durable pending intent.
2. Validates `requested_goal_cadence` against durable state.
3. Validates `turn_start_pending_goal_intent` against durable state.
4. Selects a pending intent only if it is eligible by `IdleReserved`,
   `SameTurn` while injection remains open, or `TurnStart`.
5. Applies supersedence order: BudgetLimit, ObjectiveUpdated, Initial.
6. If no pending intent is selected, selects AutoContinuation only from an
   idle-reserved `AutoContinuation` request.
7. Applies request-local repair only to preserve, replace, or deduplicate the
   cadence item required for this request or a committed carry item required by
   a seam.
8. Ensures final input contains exactly one current Goal item when cadence is
   required, with outer role `developer` and generic internal-context source
   `goal`.

The finalizer must not infer cadence merely from active durable Goal state or
from classifier results.

## Cadence Producers

Owner terrain:

- core: `codex-rs/core/src/goals.rs`
- app-server: `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- extension: `codex-rs/ext/goal/src/tool.rs`,
  `codex-rs/ext/goal/src/runtime.rs`,
  `codex-rs/ext/goal/src/steering.rs`,
  `codex-rs/ext/goal/src/extension.rs`

Required mutation points:

- `Session::create_thread_goal()` uses
  `insert_thread_goal_with_cadence_intent`; if the resulting goal is active,
  pending Initial is created in the same transaction.
- `Session::set_thread_goal()` uses
  `replace_thread_goal_with_cadence_intent` or
  `update_thread_goal_with_cadence_intent`; the state API creates Initial,
  ObjectiveUpdated, or BudgetLimit according to durable before/after facts.
- `ThreadGoalRequestProcessor::thread_goal_set_inner()` uses the same
  transaction-shaped state APIs for app-server `/goal` mutations before
  sending responses/events.
- `Session::apply_external_thread_goal_status()` stops creating concrete Goal
  input items. It uses the pending intent returned by state mutation and only
  attempts same-turn request metadata.
- `Session::account_thread_goal_progress()` uses
  `account_thread_goal_usage_with_cadence_intent`; if the transaction produces
  BudgetLimit intent, it attempts same-turn request metadata and leaves intent
  pending if unavailable.
- `Session::account_thread_goal_wall_clock_usage()` uses the same accounting
  API; wall-clock BudgetLimit must be pending durable cadence, not a dropped
  injection attempt.
- `ext/goal` active steering producers must be converted to the generic
  developer-role internal-context path or proven unreachable and removed in the
  same implementation slice. They must not keep `GoalContextRole` or user-role
  active steering alive.
- Delete or rewrite stale `ext/goal/src/extension.rs` comments that describe
  `GoalSteeringRole`, role-neutral `<goal_context>` wrapping, or
  hidden-context classification as the host boundary. Those comments encode the
  architecture being removed.
- Remove or hard-map reachable extension configuration surfaces such as
  `GoalExtensionConfig.steering_role` and `goal_steering_role` so they cannot
  select user-role active Goal steering. If a compatibility field remains, it
  must be ignored, rejected, or mapped to developer-role behavior with tests.

Remove active use of:

- `GoalRuntimeState.initial_steering_goal_id`
- `mark_initial_goal_steering_pending`
- `goal_steering_kind_for`
- `take_initial_goal_steering`
- `budget_limit_reported_goal_id` as a steering delivery guard
- `GoalSteeringMessage::into_response_input_item` delegating to `GoalContext`
- active `[goals] steering_role` behavior
- extension `GoalExtensionConfig.steering_role` / `goal_steering_role` as an
  active role-selection API

## Resume Behavior

Owner terrain:

- `codex-rs/core/src/goals.rs::restore_thread_goal_runtime_after_resume`
- `codex-rs/core/src/codex_thread.rs::apply_goal_resume_runtime_effects`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs::emit_resume_goal_snapshot_and_continue`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs::handle_pending_thread_resume_request`

Required behavior:

- Resume reloads durable Goal facts.
- Resume reloads pending Initial, ObjectiveUpdated, or BudgetLimit intent.
- Resume initializes accounting for an active goal.
- Resume seeds the runtime auto-Continuation watermark from committed
  Continuation records only when the current candidate key matches.
- Resume does not create Initial merely because a durable active Goal exists.
- Resume does not emit active steering.
- Resume does not consume pending intent.
- If pending Initial existed before resume, keep it pending until a later final
  model request contains the matching developer-role Goal item.
- If Initial was already committed before resume and no pending intent exists,
  do not re-emit Initial.
- If pending ObjectiveUpdated or BudgetLimit exists, it outranks automatic
  Continuation after app-server resume response/snapshot/replay ordering.

Keep app-server ordering:

- Cold resume applies runtime effects before sending resume response; sends
  token usage and Goal snapshot; then calls `continue_active_goal_if_idle()`.
- Running-thread resume applies runtime effects before response; sends response,
  usage snapshot, Goal snapshot, and replay; then calls
  `continue_active_goal_if_idle()`.

## Idle Lifecycle

Owner terrain:

- `codex-rs/core/src/goals.rs::maybe_continue_goal_if_idle_runtime`
- `codex-rs/core/src/goals.rs::maybe_start_goal_continuation_turn`
- `codex-rs/core/src/tasks/mod.rs::maybe_start_turn_for_pending_work`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`

Replace the current sequence with:

```text
MaybeContinueIfIdle
  -> if active turn exists, return
  -> start_pending_work_if_idle(); if Started or ActiveTurnPresent, return
  -> acquire Goal idle scheduling lock
  -> re-check active turn and pending non-Goal work
  -> if eligible pending durable cadence intent exists:
       reserve Goal-owned cadence-delivery turn, then return
  -> re-check active turn and pending non-Goal work
  -> if Continuation candidate key is not suppressed:
       reserve Goal-owned automatic Continuation turn
```

Implementation requirements:

- Change `maybe_start_turn_for_pending_work()` or add a wrapper with a concrete
  result type:

  ```rust
  pub(crate) enum PendingWorkStartOutcome {
      Started,
      Idle,
      ActiveTurnPresent,
  }
  ```

  `Started` means queued response items or trigger-turn mailbox work claimed a
  regular turn. `Idle` means no pending non-Goal work was waiting.
  `ActiveTurnPresent` means the idle hook lost the idle race or a turn already
  existed. `MaybeContinueIfIdle` returns immediately for `Started` and
  `ActiveTurnPresent`; it proceeds to Goal-owned scheduling only for `Idle`.
- Use `GoalRuntimeState::continuation_lock`, or rename it to an idle scheduling
  lock, to protect both pending durable cadence delivery and automatic
  Continuation reservation.
- Re-check active turn, queued next-turn response items, and trigger-turn
  mailbox input after acquiring the lock.
- Pending durable cadence delivery reserves `ActiveTurn::default()`, sets
  `TurnGoalCadenceRequest::PendingIntent { origin: IdleReserved }`, starts a
  regular default turn, and returns.
- Automatic Continuation computes candidate key
  `{ goal_id, model_visible_history_key, durable_facts_version }`, compares it
  with runtime watermark, reserves `ActiveTurn::default()`, re-reads durable
  Goal and pending-work state, sets `TurnGoalCadenceRequest::AutoContinuation`,
  starts a regular default turn, and returns.
- If pending non-Goal work appears after reservation but before launch, clear
  the reserved turn and return.
- If durable Goal changes after reservation but before launch, clear the
  reserved turn and return.
- Do not consume pending intent or update the Continuation watermark during
  selection, rendering, reservation, or launch.
- Update the Continuation watermark only from the finalizer commit on
  `ResponseEvent::Created`.
- If a Goal-owned request fails before `ResponseEvent::Created`, the next idle
  hook may retry because pending intent and watermark state were not advanced.

## Repair And Classifiers

Request repair is a final-input seam backstop. Put it in the same finalizer
that inspects final model request input.

Use this language and implementation boundary:

- Classifiers are projection/cleanup tools, not authority predicates.
- Current developer-role Goal input is a model input item, not an artifact.
- Legacy `<goal_context>` is artifact cleanup/projection handling only.

Shared classifiers should live with generic internal context and legacy Goal
artifact helpers:

- pure current Goal internal-context item
- pure legacy `<goal_context>` artifact
- non-Goal internal-context item
- mixed visible prose containing marker-like text

Replacement callsites:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

Required behavior:

- Omit pure current Goal internal-context model input items from
  typed/materialized UI or app-server projections.
- Continue hiding pure legacy `<goal_context>` artifacts from typed/materialized
  projections.
- Keep raw response item notifications raw; do not add special Goal suppression
  to raw streams.
- Drop stale or duplicate pure Goal internal-context items during compaction or
  rollout reconstruction only as cleanup, unless preserving the single current
  cadence item required by final-input repair.
- Preserve mixed ordinary user/developer prose.
- Never reconstruct active Goal state by parsing current internal-context text
  or legacy `<goal_context>` text.

Repair may insert, replace, or deduplicate a Goal item only when:

- pending durable cadence intent is selected for this request
- automatic Continuation was selected by the idle predicate for this request
- a seam would otherwise lose or duplicate a committed current-turn cadence
  item
- structured reconstruction is restoring a previously committed cadence record

Structured reconstruction means restoring the exact serialized
`response_item_json` from `thread_goal_steering_records`. If no committed record
with exact item material exists, repair remains request-local unless the normal
cadence path is consuming pending intent. Do not synthesize recorded historical
cadence by re-rendering from current durable Goal state.

Repair must not emit Goal steering merely because durable active Goal state
exists.

## Ordered Implementation Slices

### 1. Test Prep

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
- upstream core Goal runtime/tool tests named in `goal-test-deletion-map.md`
  are present in `rust-v0.136.0`
- upstream TUI Goal validation, status, budget, review, and action tests named
  in `goal-test-deletion-map.md` are present in `rust-v0.136.0`

Snapshot handling:

- delete snapshots only when deleting their local-only owner test
- restore upstream-owned Goal snapshots to `rust-v0.136.0` only when local Goal
  hunks changed them
- do not delete upstream snapshots merely because they mention Goal, budget,
  usage, statuses, or `/goal`

Verification after implementation exists:

- targeted tests for restored upstream behavior
- no replacement test may require active `<goal_context>` or user-role Goal
  steering
- keep or adapt `emits_goal_context_raw_response_item_notifications` as the
  raw-stream regression guard. Delete old suppression/filtering assertions if
  present, but do not delete the guard that proves raw response item
  notifications remain raw for legacy Goal artifacts and mixed prose.

### 2. Generic Internal-Context Role Support

Files:

- `codex-rs/core/src/context/internal_model_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/fragment.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/goal_context.rs` or replacement
  `legacy_goal_context.rs`

Edits:

- restore/adapt upstream generic internal-context terrain, then add explicit
  role-bearing conversion and strict split classifiers
- export only the generic API needed by `ext/goal`
- keep current internal-context classification separate from legacy
  `<goal_context>` artifact classification
- keep legacy pure `<goal_context>` detection only for artifact cleanup
- prove mixed marker-like prose remains ordinary text
- do not convert or preserve active Goal producers in this slice; producer
  conversion belongs to Slice 5 and must land atomically there

Verification:

- unit tests for source validation, developer-role conversion, pure current
  Goal internal-context classification, legacy pure artifact classification,
  non-Goal source preservation, and mixed prose preservation
- tests proving legacy `<goal_context>` does not classify as current generic
  internal context

### 3. Durable Cadence State

Files:

- `codex-rs/state/goals_migrations/0002_thread_goal_cadence.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/lib.rs`

Edits:

- add `facts_revision`
- add pending intent model/table/API
- add committed cadence record model/table/API
- replace non-atomic mutation APIs at callsites or introduce new APIs before
  switching callsites
- delete pending intent and records when deleting a thread goal
- keep `codex-rs/state/BUILD.bazel` as-is unless the migration glob changes;
  it already includes `goals_migrations/**`

Verification:

- focused `codex-state` tests for monotonic facts revision, atomic mutation
  plus pending intent creation, supersedence, compare-and-delete clearing,
  delete cleanup, and committed Continuation record lookup

### 4. Final Request Input Finalizer And Commit

Files:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- new `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/stream_events_utils.rs`

Edits:

- add `model_visible_history_key`
- move Goal finalization inside `run_sampling_request()` retry loop
- thread `GoalRequestCommit` into `try_run_sampling_request()`
- commit on `ResponseEvent::Created`
- add Goal-specific history/rollout recording that does not bump
  `model_visible_history_key`
- stop routing Goal cadence through generic pending input recording before
  final request inspection
- add committed current-turn carry only after Created commit

Verification:

- first attempt and retry both run the finalizer
- failed submission before `ResponseEvent::Created` leaves pending intent
- stream close before `ResponseEvent::Created` leaves pending intent
- error after `ResponseEvent::Created` keeps the commit
- stale compare-delete does not clear a newer pending intent
- final `/responses` request contains exactly one developer-role generic Goal
  internal-context item

### 5. Cadence Producers

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`

Edits:

- switch core and app-server Goal mutations to transaction-shaped cadence APIs
- create turn-local same-turn request metadata, not concrete injected Goal
  response items
- replace active Goal item construction with generic developer-role internal
  context
- remove or hard-map active `GoalSteeringRole` configuration so no user-role
  active Goal item can be emitted
- remove or hard-map extension `GoalExtensionConfig.steering_role` and
  `goal_steering_role`; delete stale extension comments that describe
  `GoalSteeringRole`, role-neutral `<goal_context>`, or hidden-context
  classification as the intended boundary
- if config structs change, later implementation must run
  `just write-config-schema`

Verification:

- Initial, ObjectiveUpdated, and BudgetLimit create durable pending intent
  atomically with Goal fact mutation
- ObjectiveUpdated remains pending when same-turn delivery is unavailable
- BudgetLimit remains pending when same-turn delivery is unavailable
- BudgetLimit supersedes older pending Initial or ObjectiveUpdated
- no active producer, including reachable extension producers, emits
  `<goal_context>` or user-role Goal steering

### 6. Resume And Idle Continuation

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`

Edits:

- make resume hydration-only for Goal steering
- seed accounting and Continuation watermark from durable state/records
- implement pending-work-first idle sequence
- add pending durable cadence delivery turns
- add automatic Continuation candidate key and runtime suppression
- clear reservations without consuming pending intent or watermark when stale

Verification:

- resume with active goal and no pending intent does not create Initial
- resume with pending Initial keeps it pending until final request delivery
- already consumed Initial is not re-emitted after resume
- pending queued input outranks Goal-owned synthetic turns
- trigger-turn mailbox input outranks Goal-owned synthetic turns
- pending Initial/ObjectiveUpdated/BudgetLimit idle delivery is not
  Continuation
- repeated idle hook with unchanged
  `{ goal_id, model_visible_history_key, durable_facts_version }` does not
  launch duplicate Continuation
- non-Goal-cadence model-visible history change or facts revision change permits
  later Continuation

### 7. Repair And Legacy Cleanup

Files:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

Edits:

- replace active `is_goal_context_*` dependencies with shared classifiers
- keep classifiers projection/cleanup-only
- keep raw response item notifications raw
- update compaction and reconstruction cleanup for pure current Goal internal
  context and pure legacy artifacts
- preserve mixed ordinary prose

Verification:

- typed/materialized projections omit pure current Goal input items and pure
  legacy artifacts
- raw response item notifications are not specially suppressed for Goal context
- compaction/reconstruction drops stale pure current Goal internal-context items
  and pure legacy artifacts without treating cleanup as cadence delivery
- mixed prose is retained
- classifiers are never accepted as proof of Goal authority

### 8. App-Server And TUI Replacement Tests

Files:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- relevant `*.snap` files owned by changed UI tests

Edits:

- add replacement final-payload tests for developer-role generic Goal internal
  context
- keep upstream Goal API, `/goal`, status/footer projection,
  pause/edit/clear, budget/usage, and review-mode tests active
- re-add local Ctrl+C, pause/resume, and queue behavior tests only from the
  replacement command/state contract
- update snapshots only for intentional user-visible changes

Verification:

- focused `codex-core` tests for final model payload, cadence state, retry, and
  idle behavior
- focused `codex-app-server` tests for app-server Goal set/resume ordering
- focused `codex-tui` snapshot tests for changed UI behavior
- no full crate or workspace suite unless explicitly requested

## Later Implementation Validation Profile

After Rust edits, run `just fmt` from `codex-rs`.

Use focused checks, for example:

- `cargo test -p codex-state pending_goal_steering`
- `cargo test -p codex-core initial_goal_steering`
- `cargo test -p codex-core objective_updated_goal_steering`
- `cargo test -p codex-core budget_limit_goal_steering`
- `cargo test -p codex-core idle_goal_continuation`
- `cargo test -p codex-app-server thread_goal_set`
- `cargo test -p codex-tui goal_status_indicator`

Snapshot workflow for implementation:

- run the focused snapshot-producing test
- inspect pending `*.snap.new`
- accept only intended snapshots with `cargo insta accept -p codex-tui`

Do not run broad Rust suites during the planning pass.
