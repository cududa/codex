# 02 Atomic Behavior Switch

This slice switches the active Goal authority behavior path.

It is atomic. After this slice is accepted, no active Goal steering producer may
remain on `GoalContext`, `GoalContextRole`, active `<goal_context>` emission,
user-role Goal steering, or Goal-only fake provenance machinery.

## Authority Inputs

Read first:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`

## Goals

- Add a distinct `model_visible_history_key`.
- Move Goal finalization inside the sampling retry loop.
- Commit cadence only on `ResponseEvent::Created`.
- Make the Goal cadence commit fallible, idempotent, and reconstructable.
- Replace concrete pre-finalizer Goal injection with turn-local cadence
  metadata.
- Convert all active Goal producers to generic developer-role internal context.
- Remove or hard-map all active role-selection configuration.

## Model Visible History Key

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
- `ContextManager::replace`, `replace_history`, and
  `replace_compacted_history` install a replacement history.
- `remove_last_item`, rollback, `drop_last_n_user_turns`, and
  `replace_last_turn_images` change the prompt-visible history.
- `record_completed_response_item_with_finalized_facts` records assistant,
  tool-call, reasoning, or other model output through
  `record_conversation_items`.
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

## Final Model Request Input Hook

Files:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- new `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/stream_events_utils.rs`

The finalizer belongs inside
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

## Commit Point

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

- If stream creation or transport submission fails before
  `ResponseEvent::Created`, do not record cadence, do not clear pending intent,
  and do not advance the Continuation watermark. A retry will run the finalizer
  again.
- If the stream closes or errors before `ResponseEvent::Created`, same
  behavior: pending intent remains pending.
- If `ResponseEvent::Created` is observed and the stream later errors before
  `response.completed`, keep the commit. A model response exists.
- If the commit transaction itself fails after `ResponseEvent::Created`, return
  an error from the sampling attempt and do not pretend pending intent was
  cleared or watermark advanced. Log this as a durable cadence commit failure.
- Do not use the existing `persist_rollout_items()` helper as the commit
  contract for Goal cadence items; that helper currently logs append failures
  and returns `()`. The Goal cadence commit path needs a fallible,
  Goal-specific persistence/reconciliation path.

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
`codex-rs/core/src/state/turn.rs` appends concrete Goal `ResponseInputItem`s
into turn pending input and carry before final request inspection. Replace that
with turn-local requested cadence metadata.

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
- If same-turn metadata exists but the phase closes before another model
  request uses it, drop the metadata and leave durable pending intent
  untouched.
- A closed active turn must not get a newly discovered durable pending intent
  merely because the finalizer can read the database.

Compaction carry:

- Only `committed_goal_cadence_items` may be carried across mid-turn compaction
  or used for request-local seam repair.
- `turn_start_pending_goal_intent` and `requested_goal_cadence` are not proof
  that the model saw Goal authority. They are not persisted in rollout and must
  not be projected as delivered cadence.

## Finalizer Selection Order

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
  hidden-context classification as the host boundary.
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

If config structs change, run `just write-config-schema` later in the
implementation.

## Verification

- first attempt and retry both run the finalizer
- failed submission before `ResponseEvent::Created` leaves pending intent
- stream close before `ResponseEvent::Created` leaves pending intent
- error after `ResponseEvent::Created` keeps the commit
- stale compare-delete does not clear a newer pending intent
- final `/responses` request contains exactly one developer-role generic Goal
  internal-context item
- Initial, ObjectiveUpdated, and BudgetLimit create durable pending intent
  atomically with Goal fact mutation
- ObjectiveUpdated remains pending when same-turn delivery is unavailable
- BudgetLimit remains pending when same-turn delivery is unavailable
- BudgetLimit supersedes older pending Initial or ObjectiveUpdated
- no active producer, including reachable extension producers, emits
  `<goal_context>` or user-role Goal steering

Suggested focused checks after Rust edits:

```text
cargo test -p codex-core initial_goal_steering
cargo test -p codex-core objective_updated_goal_steering
cargo test -p codex-core budget_limit_goal_steering
cargo test -p codex-app-server thread_goal_set
```
