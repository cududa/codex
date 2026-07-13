# Batch 03: History Key And Idle Continuation

This batch completes the automatic Continuation side of Goal cadence:

- real `model_visible_history_key` projection
- persisted latest automatic Continuation watermark for resume/restart
- `MaybeContinueIfIdle` staging for pending work, pending durable cadence
  intent, then automatic Continuation
- finalizer-owned Continuation insertion and watermark commit through the
  Batch 02 final request-input seam

It does not implement `ext/goal` conversion, broad classifier/projection
cleanup, or final Goal shim deletion.

## Direction Lock

Request:

- translate the model-visible history key and idle Continuation contracts into
  an execution-ready batch
- ground the plan in current idle hook, pending-work, history, resume,
  compaction, and request construction code
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`

Terrain:

- `codex-rs/core/src/goals.rs`
  - `GoalRuntimeEvent::ThreadResumed` and
    `GoalRuntimeEvent::MaybeContinueIfIdle` already exist as distinct events
  - `maybe_continue_goal_if_idle_runtime()` currently calls pending-work
    scheduling before Goal continuation scheduling
  - `continuation_lock` already protects Goal-owned scheduling
  - `restore_thread_goal_runtime_after_resume()` currently marks Initial
    pending for any active Goal, which the contract forbids
  - `initial_steering_goal_id` is runtime-only Initial state, which Batch 01
    replaces with persisted pending cadence intent
  - `GoalContinuationCandidate` currently carries concrete
    `ResponseInputItem`s, which Batch 03 must replace with request intent
- `codex-rs/core/src/tasks/mod.rs`
  - `maybe_start_turn_for_pending_work*` already starts regular queued or
    trigger-turn mailbox work when idle
  - the helper currently returns `()`, so callers cannot tell whether Stage 1
    actually started work
- `codex-rs/core/src/session/input_queue.rs`
  - queued next-turn items and trigger-turn mailbox items are explicit pending
    non-Goal work sources
  - `extend_goal_pending_input_for_turn_state()` injects concrete Goal
    `ResponseInputItem`s into turn pending input
- `codex-rs/core/src/state/turn.rs`
  - `TurnState` stores concrete current-turn Goal steering items today
  - Batch 02 introduces committed carry metadata for finalized Goal items
- `codex-rs/core/src/session/turn.rs`
  - retry attempts rebuild prompt input from `clone_history().for_prompt(...)`
  - Batch 02 finalizer must run inside `run_sampling_request(...)` before
    `build_prompt(...)`
  - `ResponseEvent::Created` is the commit point for selected Goal delivery
- `codex-rs/core/src/client_common.rs`
  - `Prompt.input` is the logical final model request input
- `codex-rs/core/src/client.rs`
  - `build_responses_request(...)` copies `Prompt.input` into
    `ResponsesApiRequest.input`
- `codex-rs/core/src/context_manager/history.rs`
  - `record_items(...)` appends ordinary model-visible items without bumping
    `history_version`
  - `history_version()` is only a rewrite counter and is not a valid
    Continuation key
  - `for_prompt(...)` normalizes the history used for a sampling attempt
- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - reconstruction builds `ContextManager` from rollout items and compaction
    replacement history
  - legacy Goal context items are currently filtered during reconstruction
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
  - compaction replacement history changes the model-visible projection
  - mid-turn compaction currently pulls concrete current-turn Goal steering
    items, which is later cleanup terrain, not a key mechanism
- `codex-rs/core/tests/common/responses.rs`
  - `ResponseMock::single_request().input()`
  - `ResponseMock::requests()`
  - `ResponsesRequest::message_input_texts(...)`
  - `ResponsesRequest::message_input_text_groups(...)`
- existing tests in `codex-rs/core/src/session/tests.rs`
  - some prove useful pending-work precedence
  - some assert old `<goal_context>` and resume-Initial behavior and must be
    deleted or replaced under the Batch 00 posture

Code-shape temptation:

- keep `MaybeContinueIfIdle` as "build Goal item and inject pending input"
- keep runtime-only Initial because it is already near Continuation
- treat `ContextManager::history_version()` as the Continuation key
- let the idle hook advance the watermark when it selects or reserves a turn
- let a preflight key replace finalizer-owned per-attempt key computation
- send an empty synthetic Goal-owned request when a stale candidate is
  rejected late

Locked direction:

- put `ModelVisibleHistoryKey` and key projection in the Batch 02 cadence
  module, proposed as `codex-rs/core/src/goal_cadence.rs`
- compute the key from the same logical model-visible input used for the
  request attempt, before inserting a new Continuation item
- use a preflight key only to avoid unnecessary synthetic turn launches; the
  finalizer recomputes and owns the committed key
- persist the latest committed automatic Continuation watermark so resume does
  not permit duplicates for unchanged history and unchanged Goal facts
- refactor `MaybeContinueIfIdle` into the contracted stage order:
  pending non-Goal work first, pending durable cadence delivery second,
  automatic Continuation last
- replace idle-owned concrete Goal input injection with structured Goal idle
  request intent consumed by the Batch 02 finalizer

Exclusions:

- no `ext/goal` conversion
- no broad typed projection, raw notification, or classifier cleanup
- no final deletion of all `GoalContext` helpers
- no app-server Goal product API redesign
- no persisted pending Continuation intent
- no user-role active Goal steering compatibility
- no code implementation in this planning pass

## Ownership Split For This Batch

Batch 03 adds Continuation policy on top of the Batch 02 finalizer. Use this
file split while implementing:

- `codex-rs/core/src/goal_cadence.rs` owns `ModelVisibleHistoryKey`
  projection, finalizer recheck of structured idle requests, Continuation
  item construction, and Continuation commit metadata.
- `codex-rs/state/src/runtime/goals.rs` owns persisted Continuation watermark
  storage and clearing. It does not decide whether a request should emit
  Continuation.
- `codex-rs/core/src/goals.rs` owns the v136 idle lifecycle adapter:
  `MaybeContinueIfIdle` staging, resume hydration, and synthetic-turn
  reservation requests. It stores typed `GoalIdleRequest` metadata for the
  finalizer, not rendered prompt text or concrete model input.
- `codex-rs/core/src/session/turn.rs` continues to own finalizer placement and
  Created-event commit execution. It does not compute the key independently of
  `goal_cadence.rs`.
- `codex-rs/core/src/session/input_queue.rs`,
  `codex-rs/core/src/state/turn.rs`, and `codex-rs/core/src/session/mod.rs`
  may carry idle request metadata and pending-work state. They must not inject
  automatic Continuation as `ResponseInputItem`.

## Required Edits

### 1. Add `ModelVisibleHistoryKey` To Goal Cadence

Edit:

- `codex-rs/core/src/goal_cadence.rs`

Add a concrete key type equivalent to:

```rust
pub(crate) const MODEL_VISIBLE_HISTORY_KEY_SCHEMA_VERSION: u32 = 1;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct ModelVisibleHistoryKey {
    pub schema_version: u32,
    pub eligible_progress_count: u64,
    pub eligible_progress_fingerprint: String,
    pub latest_eligible_progress_fingerprint: Option<String>,
    pub compaction_basis_fingerprint: Option<String>,
}
```

Add conversion helpers:

```rust
impl ModelVisibleHistoryKey {
    pub(crate) fn from_finalizer_base_input(input: &[ResponseItem]) -> Self;
    pub(crate) fn as_storage_key(&self) -> String;
}
```

The storage key may be a digest of the structured fields, but the structured
fields must remain visible in code and tests. Do not store or compare only
`ContextManager::history_version()`.

Use existing repo hashing support such as `codex_utils_cache::sha1_digest` if
it avoids adding dependencies. The exact hash is not the contract. The ordered
projection inputs are.

### 2. Define The Eligible Progress Projection

Edit:

- `codex-rs/core/src/goal_cadence.rs`
- later Batch 05 classifier module only if it already exists by implementation
  time

Add a private projection type equivalent to:

```rust
struct ModelVisibleProgressProjection {
    entries: Vec<ModelVisibleProgressEntry>,
    compaction_entries: Vec<ModelVisibleProgressEntry>,
}
```

The projection is computed from the finalizer base input for this attempt,
after Batch 02 request cleanup has removed or ignored pure Goal-only artifacts,
and before the selected Goal item is inserted.

Include ordered model-visible items that can represent real work progress:

- ordinary user messages that are not pure contextual fragments
- assistant messages
- reasoning items
- function/tool calls
- function/tool outputs
- custom tool calls and outputs
- local shell calls
- tool-search calls and outputs
- web-search calls
- image-generation calls
- compaction and context-compaction items that alter model-visible summary
  state
- `ResponseItem::Other` only as a typed placeholder entry if it reaches prompt
  input, so unknown model-visible items do not silently disappear from the key

Exclude:

- the automatic Continuation Goal item being considered
- all pure current Goal internal-context items
- all pure legacy `<goal_context>` artifacts
- duplicate, stale, wrong-role, or pre-injected Goal-looking items
- pure contextual developer/user fragments that are not work progress
- raw response notification counts
- typed or materialized UI projection counts
- helper output that did not reach final request input
- `ContextManager::history_version()` as a standalone key component

Whole-message purity is required for exclusions. Mixed ordinary prose that
contains marker-like strings remains eligible progress.

`eligible_progress_fingerprint` is a digest of the ordered eligible entries.
`latest_eligible_progress_fingerprint` is the digest of the last eligible
entry, or `None` if there are no eligible entries.
`compaction_basis_fingerprint` is a digest of ordered explicit compaction
entries when such entries are available in the finalizer base input, otherwise
`None`. Compaction summaries converted into ordinary assistant messages still
participate in the main eligible progress fingerprint.

### 3. Persist Latest Automatic Continuation Watermark

Edit:

- `codex-rs/state/goals_migrations/0003_goal_continuation_watermarks.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`

Add migration:

```sql
CREATE TABLE thread_goal_continuation_watermarks (
    thread_id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    facts_version INTEGER NOT NULL,
    model_visible_history_key TEXT NOT NULL,
    model_visible_history_key_schema_version INTEGER NOT NULL,
    eligible_progress_count INTEGER NOT NULL,
    latest_eligible_progress_fingerprint TEXT,
    compaction_basis_fingerprint TEXT,
    committed_turn_id TEXT NOT NULL,
    item_fingerprint TEXT NOT NULL,
    committed_at_ms INTEGER NOT NULL
);

CREATE INDEX thread_goal_continuation_watermarks_goal_idx
ON thread_goal_continuation_watermarks(thread_id, goal_id);
```

This table is not pending cadence intent. It records that an automatic
Continuation already reached model execution for a specific
`{ goal_id, model_visible_history_key, durable_facts_version }` triple.

Add model types equivalent to:

```rust
pub struct ThreadGoalContinuationWatermark {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub facts_version: i64,
    pub model_visible_history_key: String,
    pub model_visible_history_key_schema_version: i64,
    pub eligible_progress_count: i64,
    pub latest_eligible_progress_fingerprint: Option<String>,
    pub compaction_basis_fingerprint: Option<String>,
    pub committed_turn_id: String,
    pub item_fingerprint: String,
    pub committed_at: DateTime<Utc>,
}

pub struct ThreadGoalContinuationWatermarkInput {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub facts_version: i64,
    pub model_visible_history_key: String,
    pub model_visible_history_key_schema_version: i64,
    pub eligible_progress_count: i64,
    pub latest_eligible_progress_fingerprint: Option<String>,
    pub compaction_basis_fingerprint: Option<String>,
    pub committed_turn_id: String,
    pub item_fingerprint: String,
}
```

Add store APIs equivalent to:

```rust
pub async fn get_thread_goal_continuation_watermark(
    &self,
    thread_id: ThreadId,
) -> anyhow::Result<Option<ThreadGoalContinuationWatermark>>;

pub async fn upsert_thread_goal_continuation_watermark(
    &self,
    input: ThreadGoalContinuationWatermarkInput,
) -> anyhow::Result<ThreadGoalContinuationWatermark>;

pub async fn clear_thread_goal_continuation_watermark(
    &self,
    thread_id: ThreadId,
) -> anyhow::Result<bool>;
```

Extend the Batch 01 cadence snapshot or add a sibling snapshot so core can
load:

```rust
ThreadGoalCadenceSnapshot {
    goal,
    pending_intents,
    continuation_watermark,
}
```

Clear the watermark when:

- deleting a thread Goal
- replacing a Goal with a different `goal_id`
- clearing/stopping Goal state in a way that makes active Goal behavior
  ineligible

Leaving a stale row with a mismatched `goal_id` must not suppress a new Goal,
but cleanup should keep state reviewable.

### 4. Extend Batch 02 Finalizer Runtime Request

Edit:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`

Extend the Batch 02 request shape with structured idle intent:

```rust
pub(crate) enum GoalIdleRequest {
    PendingCadenceDelivery {
        goal_id: String,
        kind: GoalCadenceKind,
        facts_version: i64,
    },
    AutomaticContinuation {
        goal_id: String,
        facts_version: i64,
        preflight_history_key: ModelVisibleHistoryKey,
    },
}

pub(crate) struct GoalRuntimeRequest {
    pub cadence_snapshot: ThreadGoalCadenceSnapshot,
    pub idle_request: Option<GoalIdleRequest>,
}
```

Store `GoalIdleRequest` as turn metadata, not as pending model input:

```rust
TurnState::set_goal_idle_request(...)
TurnState::goal_idle_request(...)
Session::set_goal_idle_request_for_reserved_turn(...)
Session::goal_idle_request_for_turn(...)
```

The exact names may change. The shape may not:

- no `ResponseInputItem`
- no rendered Goal text
- no role-bearing model item
- no durable pending Continuation
- only structured request intent for the Batch 02 finalizer

Batch 02 finalizer changes for Batch 03:

```text
receive base Vec<ResponseItem> for this attempt
clean or ignore Goal-only request artifacts under Batch 02 rules
compute ModelVisibleHistoryKey from the cleaned base input
load current durable Goal snapshot and latest Continuation watermark
select pending durable BudgetLimit / ObjectiveUpdated / Initial if due
else select AutomaticContinuation only when idle_request carries a matching
  candidate and the latest watermark does not match the recomputed triple
insert exactly one selected developer-role Goal ResponseItem when selected
return commit metadata containing the exact recomputed key for Continuation
```

If an automatic Continuation candidate's preflight key differs from the
recomputed per-attempt key, the finalizer must not insert Continuation.

If a Goal-owned synthetic turn has no selected pending intent and no valid
automatic Continuation after finalizer recheck, the implementation must abort
that synthetic request before model submission. Do not send an empty
Goal-owned request just because the scheduler reserved a turn.

The abort shape can be an internal finalizer outcome such as:

```rust
pub(crate) enum GoalFinalizationRequestDisposition {
    Submit(FinalizedGoalRequestInput),
    AbortSyntheticGoalTurn,
}
```

Do not expose this as a user-facing product error.

### 5. Commit Automatic Continuation Watermark On Created

Edit:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/state/src/runtime/goals.rs`

Extend `GoalRequestCommit` from Batch 02 so Continuation commits require:

```rust
pub model_visible_history_key: ModelVisibleHistoryKey,
```

for `GoalCadenceKind::Continuation`. Non-Continuation commits may still carry
`None` only if the Batch 02 partial state is being implemented before Batch
03; after Batch 03, the key is available for diagnostics but watermarking
uses it only for Continuation.

On `ResponseEvent::Created`, `commit_goal_request(...)` must:

- record the finalized developer-role Continuation item as model-visible Goal
  steering
- upsert `thread_goal_continuation_watermarks` with:
  - `thread_id`
  - `goal_id`
  - `facts_version`
  - `model_visible_history_key.as_storage_key()`
  - visible key component fields
  - `committed_turn_id`
  - `item_fingerprint`
  - current commit timestamp
- record committed current-turn carry metadata from Batch 02

Do not advance the watermark when:

- `MaybeContinueIfIdle` fires
- a candidate is selected
- a synthetic turn is reserved
- prompt text is rendered
- a `ResponseItem` is constructed
- request shaping fails
- final request input is built but no model client submission occurs
- submission or stream setup fails before `ResponseEvent::Created`

If a retryable stream failure happens after `ResponseEvent::Created`, the
watermark remains advanced. The retry must rebuild from committed
state/history and must not emit a duplicate automatic Continuation for the
same key.

### 6. Refactor Idle Hook Stage Order

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`

This is idle lifecycle adapter work. It must not make `goals.rs` the active
Goal input owner or the Continuation watermark commit owner.

Rename or reframe the internal implementation around the semantic operation:

```text
run_idle_goal_lifecycle_if_idle
```

The external `GoalRuntimeEvent::MaybeContinueIfIdle` name may remain.

Modify pending-work helpers to return whether they started a turn:

```rust
pub(crate) async fn maybe_start_turn_for_pending_work(self: &Arc<Self>) -> bool;

pub(crate) async fn maybe_start_turn_for_pending_work_with_sub_id(
    self: &Arc<Self>,
    sub_id: String,
) -> bool;
```

Update existing callers that do not need the result to ignore it explicitly.

Implement stage order:

```text
MaybeContinueIfIdle
  -> if active turn exists, return
  -> if queued next-turn input or trigger-turn mailbox input exists:
       start regular pending-work turn, return
  -> acquire Goal idle scheduling lock
  -> re-check active turn and pending non-Goal work
  -> if pending durable Goal cadence intent is due:
       reserve Goal-owned synthetic cadence-delivery turn, return
  -> re-check active turn and pending non-Goal work
  -> maybe reserve automatic Continuation, return
```

Pending non-Goal work includes at least:

- `InputQueue::has_queued_response_items_for_next_turn()`
- `InputQueue::has_trigger_turn_mailbox_items()`
- future pending-work sources that use the same helper

After acquiring the Goal lock, re-check active turn and pending non-Goal work
before reading or selecting Goal cadence. If pending work appeared, release
the lock and return.

### 7. Deliver Pending Durable Cadence Intent From Idle

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/goal_cadence.rs`

When Stage 2 finds eligible pending Initial, ObjectiveUpdated, or BudgetLimit
intent:

```text
read ThreadGoalCadenceSnapshot
choose BudgetLimit > ObjectiveUpdated > Initial
reserve an ActiveTurn with no prebuilt Goal model input
store GoalIdleRequest::PendingCadenceDelivery as turn metadata
create a default TurnContext for the reserved turn
re-check active Goal state, pending intent, active turn, and pending non-Goal work
start a regular task with empty user input
```

The finalizer consumes the durable pending intent. The idle hook does not.

If the finalizer later finds the pending intent is gone, stale, or superseded,
it must abort the synthetic request before model submission unless another
valid cadence item is selected by normal supersedence.

Delivering pending durable cadence intent must not advance the automatic
Continuation watermark.

Remove idle-path use of:

- `mark_initial_goal_steering_pending(...)`
- `goal_steering_kind_for(...)`
- `take_initial_goal_steering(...)`
- `GoalContinuationCandidate.items`
- `extend_goal_pending_input_for_turn_state(...)`

for finalizer-owned Goal work.

The old functions may remain temporarily only while reachable old producers
await later batches, but a completed Batch 03 implementation must not use them
for core idle lifecycle delivery.

### 8. Launch Automatic Continuation With Preflight And Finalizer Recheck

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`

Stage 3 automatic Continuation candidate selection:

```text
require no active turn
require no queued next-turn input
require no trigger-turn mailbox input
require no due pending Initial / ObjectiveUpdated / BudgetLimit intent
require Goals feature enabled
require collaboration mode allows Goal steering
require durable Goal exists and status is Active
create candidate TurnContext so input modalities are known
compute preflight base input from clone_history().for_prompt(...)
compute preflight ModelVisibleHistoryKey using the same projection function as
  the finalizer
load latest Continuation watermark
if watermark matches { goal_id, preflight key, facts_version }, return
reserve ActiveTurn
store GoalIdleRequest::AutomaticContinuation as turn metadata
re-read durable Goal and watermark
re-check active turn and pending non-Goal work
start regular task with empty user input
```

The preflight key is a launch suppression check only. It is not committed.

During `run_sampling_request(...)`, the Batch 02 finalizer recomputes
`ModelVisibleHistoryKey` from the actual per-attempt base input. Automatic
Continuation is inserted only if:

- the turn carries `GoalIdleRequest::AutomaticContinuation`
- the durable Goal still matches `goal_id`
- durable facts version still matches
- no pending durable Initial, ObjectiveUpdated, or BudgetLimit intent is due
- recomputed key equals the preflight key
- latest persisted watermark does not match the recomputed triple

If any condition fails, abort the synthetic request before submission.

The Continuation item itself must not feed the key used for this request. A
later user item, mailbox item, assistant item, reasoning item, tool call, tool
output, or eligible compaction change may change the key and permit a later
automatic Continuation.

### 9. Resume Hydration

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- state APIs from this batch

Change `restore_thread_goal_runtime_after_resume()`:

- reload durable Goal facts
- reload pending Initial, ObjectiveUpdated, and BudgetLimit intent through the
  Batch 01 cadence snapshot
- reload latest Continuation watermark through the Batch 03 state API
- refresh accounting baselines for current active Goal
- clear stopped-goal runtime state when durable status is not active
- do not mark Initial pending merely because a durable active Goal exists
- do not emit active Goal steering
- do not consume pending intent
- do not advance Continuation watermark

`codex_thread.rs` may keep the current caller order:

```text
apply_goal_resume_runtime_effects()
continue_active_goal_if_idle()
```

The first call is hydration. The later idle hook is allowed to:

- start pending non-Goal work
- deliver pending Initial / ObjectiveUpdated / BudgetLimit that already exists
- launch automatic Continuation only when the key/watermark predicate allows
  it

Resume must not reconstruct active Goal state, pending intent, or watermark by
parsing rendered Goal text.

### 10. Compaction, Rollback, Fork, And Reconstruction Key Behavior

Edit:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`

Batch 03 does not finish broad compaction/projection cleanup. It must still
make the key correct for the model-visible input it sees.

Rules:

- compute the key from `for_prompt(...)` output or from the finalizer's
  cleaned base input, not from raw rollout counts
- pure current Goal internal-context items and pure legacy `<goal_context>`
  artifacts do not contribute
- compaction summaries or compaction items that alter the model-visible
  projection do contribute
- replacement-history changes contribute through the resulting model-visible
  item projection
- rollback and fork naturally compute keys from surviving reconstructed
  history
- `ContextManager::history_version()` may be logged for diagnostics but must
  not suppress or permit Continuation by itself

If the implementation needs helper access to raw prompt-history items for unit
tests, add a narrowly named helper in `goal_cadence.rs` rather than changing
`ContextManager` into a Goal authority component.

### 11. Failure And Retry Semantics

Edit:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`
- state APIs from this batch

Required behavior:

- retry attempts recompute `ModelVisibleHistoryKey` from the rebuilt base input
  for that attempt
- request construction failure before final request input contains the
  Continuation item does not advance the watermark
- client stream setup failure before `ResponseEvent::Created` does not advance
  the watermark
- stream error before `ResponseEvent::Created` does not advance the watermark
- stream error after `ResponseEvent::Created` leaves the watermark committed
- retry after Created does not insert another automatic Continuation for the
  same `{ goal_id, model_visible_history_key, facts_version }`

If finalizer aborts a stale synthetic Goal-owned turn, clear the reserved
active turn and finish without emitting a user-visible error. Do not convert
the abort into a normal assistant request.

## Focused Tests

Add or update tests in:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/common/responses.rs` only if small helper methods are
  needed
- `codex-rs/state/src/runtime/goals.rs`

Use request payload assertions through:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

### Key Projection Tests

Add focused core unit tests with names like:

- `goal_history_key_ignores_context_manager_history_version_alone`
  - append ordinary model-visible output without a rewrite
  - key changes even though `history_version()` would not
- `goal_history_key_changes_for_user_assistant_and_tool_progress`
  - user message, assistant message, tool call, and tool output each affect the
    projection
- `goal_history_key_ignores_current_goal_internal_context`
  - pure current Goal internal-context item does not change the key
- `goal_history_key_ignores_legacy_goal_context`
  - pure legacy `<goal_context>` item does not change the key
- `goal_history_key_keeps_mixed_marker_like_prose`
  - mixed ordinary prose containing marker-like text remains eligible
- `goal_history_key_continuation_item_does_not_permit_next_continuation`
  - adding only an automatic Continuation Goal item leaves the key unchanged
    for Continuation suppression purposes
- `goal_history_key_compaction_changes_only_when_projection_changes`
  - compaction summary/replacement history changes affect the key through
    model-visible projection, not through raw event counts

### State Watermark Tests

Add state tests with names like:

- `goal_cadence_continuation_watermark_upsert_round_trips_key_components`
- `goal_cadence_continuation_watermark_replaced_for_new_commit`
- `goal_cadence_continuation_watermark_cleared_when_goal_deleted`
- `goal_cadence_continuation_watermark_does_not_consume_pending_intent`

These tests must not render Goal prompt text or inspect model roles.

### Idle Lifecycle Tests

Replace old behavior tests that assert `<goal_context>` or resume-fabricated
Initial. Required tests:

- `goal_idle_starts_queued_next_turn_work_before_goal_owned_turn`
  - queued response item exists
  - `MaybeContinueIfIdle` starts regular pending work and no Goal-owned
    Continuation is launched
- `goal_idle_starts_trigger_turn_mailbox_before_goal_owned_turn`
  - trigger-turn mailbox item exists
  - request input contains mailbox work before any automatic Continuation
- `goal_idle_delivers_pending_initial_as_initial_not_continuation`
  - durable pending Initial exists and no pending non-Goal work exists
  - idle hook starts synthetic cadence-delivery turn
  - final request payload contains exactly one developer-role Initial item
  - Continuation watermark is unchanged
- `goal_idle_delivers_pending_objective_updated_after_injection_unavailable`
  - pending ObjectiveUpdated survives unavailable same-turn delivery
  - idle hook later delivers it through finalizer
- `goal_idle_delivers_pending_budget_limit_and_supersedes_older_intent`
  - pending BudgetLimit suppresses older Initial / ObjectiveUpdated for same
    Goal
  - final request payload renders current durable budget state
- `goal_idle_pending_durable_intent_suppresses_automatic_continuation`
  - active Goal and eligible history exist
  - pending durable intent exists
  - idle hook delivers pending intent, not Continuation
- `goal_idle_automatic_continuation_requires_changed_history_key`
  - first automatic Continuation commits watermark on Created
  - repeated idle hook with unchanged key does not launch another request
- `goal_idle_assistant_output_after_continuation_permits_later_continuation`
  - assistant output after the committed Continuation changes key
  - later idle hook may launch another Continuation
- `goal_idle_goal_facts_version_change_permits_later_continuation`
  - durable Goal facts version changes
  - same history key no longer suppresses Continuation
- `goal_idle_resume_does_not_fabricate_initial`
  - active Goal exists with no pending Initial intent
  - `ThreadResumed` plus idle hook does not emit Initial
- `goal_idle_resume_preserves_existing_pending_initial`
  - pending Initial existed before resume
  - idle hook delivers it after resume
- `goal_idle_resume_unchanged_watermark_suppresses_duplicate_continuation`
  - persisted watermark matches reconstructed key and facts version
  - resume plus idle hook does not duplicate Continuation
- `goal_idle_candidate_rejected_if_pending_work_appears_after_reservation`
  - pending work appears after Goal-owned reservation
  - reservation is cleared; no intent is consumed; no watermark advances
- `goal_idle_request_failure_before_created_does_not_advance_watermark`
  - stream fails before Created
  - retry or later idle opportunity can still deliver Continuation
- `goal_idle_retry_after_created_does_not_duplicate_continuation`
  - stream emits Created then retryable error
  - watermark remains committed
  - retry does not emit another Continuation for the same key

Tests that currently assert resumed active Goal emits Initial, active
`<goal_context>` output, or user-role Goal steering must be deleted or
rewritten according to `local/goal_research/goal-test-deletion-map.md`.

## Verification

Docs-only validation for this planning batch:

```powershell
git diff --check -- local/goal_136_plan
```

Implementation validation for Batch 03:

```powershell
cd codex-rs
just fmt
```

Focused state tests:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence_continuation_watermark
```

Focused core tests:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_history_key
cargo test -p codex-core --lib goal_idle
```

Focused integration tests when request payload behavior is covered under the
suite:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_idle
cargo test -p codex-core --test suite goal_authority
```

Do not run broad workspace or full crate suites by default on this
workstation.

## Acceptance Criteria

Batch 03 is complete when:

- `ModelVisibleHistoryKey` exists as structured key data, not a
  `history_version()` alias
- the key is computed from the finalizer base input before inserting a new
  Continuation item
- pure current Goal internal-context and pure legacy `<goal_context>` items do
  not change the Continuation key
- ordinary user, assistant, tool, reasoning, mailbox, and eligible compaction
  progress changes can change the key
- the automatic Continuation item itself does not change the key that permits
  another automatic Continuation
- latest automatic Continuation watermark is persisted or otherwise
  reconstructable after resume/restart
- watermark advances only after the Continuation item reaches final request
  input and the stream reaches `ResponseEvent::Created`
- retry before Created does not advance the watermark
- retry after Created does not duplicate Continuation for the same key
- `MaybeContinueIfIdle` runs pending non-Goal work first, pending durable Goal
  cadence intent second, automatic Continuation last
- pending Initial, ObjectiveUpdated, and BudgetLimit delivery from idle uses
  durable pending intent and the Batch 02 finalizer, not prebuilt Goal input
- automatic Continuation launch uses structured idle request intent and the
  Batch 02 finalizer, not concrete `ResponseInputItem` injection
- resume hydrates durable state and pending intent without fabricating Initial
- final request payload tests prove automatic Continuation emits exactly one
  developer-role Goal item when due
- tests prove repeated idle hooks with unchanged
  `{ goal_id, model_visible_history_key, facts_version }` do not duplicate
  automatic Continuation

## Non-Goals

This batch does not:

- create persisted pending Continuation intent
- change the upstream Goal product API surface
- convert `ext/goal`
- finish broad raw-response, typed projection, or materialized projection
  cleanup
- finish compaction carry conversion beyond key correctness for finalizer base
  input
- delete every `GoalContext` helper
- parse rendered Goal text to recover active Goal state, pending intent, or
  watermark state
- make repair the cadence mechanism
- emit Goal steering on ordinary user turns merely because durable Goal state
  exists

## Partial Landing Constraints

Batch 03 may land after Batch 01 and Batch 02 only if durable cadence state,
Batch 02's final request-input shaping, and the Created commit seam exist.

Allowed partial state while later batches remain:

- `goal_cadence.rs` owns the key projection and Continuation commit
- `MaybeContinueIfIdle` uses durable pending intent and structured idle request
  metadata
- `ext/goal` still awaits Batch 04 conversion
- broad classifier/projection cleanup still awaits Batch 05
- final dead-code deletion still awaits Batch 06

Not allowed in a completed Batch 03 implementation:

- `ThreadResumed` marking Initial pending from active Goal state alone
- automatic Continuation selected from active durable Goal state alone
- automatic Continuation using `ContextManager::history_version()` as its key
- watermark advancing before `ResponseEvent::Created`
- synthetic Goal-owned turns injecting concrete Goal `ResponseInputItem`s as
  authority
- a stale/suppressed synthetic Goal-owned turn sending an empty model request
- tests that prove helper output but not final request input
