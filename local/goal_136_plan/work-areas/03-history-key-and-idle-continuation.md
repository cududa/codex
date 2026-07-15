# Work Area 03: History Key And Idle Continuation

This Work Area completes the automatic Continuation side of Goal cadence:

- real `model_visible_history_key` projection
- state-owned latest automatic Continuation watermark for resume/restart
- `MaybeContinueIfIdle` staging for pending work, pending durable cadence
  intent, then automatic Continuation
- request-input-shaped Continuation insertion and watermark commit through the
  Work Area 02 final request-input seam

It does not implement `ext/goal` conversion, broad classifier/projection
cleanup, or final Goal shim deletion.

Recorded request evidence may be added by the Created-event commit path when
the typed carrier exists, but WA03's live duplicate-suppression correctness
uses the state-owned Continuation watermark table by default. Ordinary rollout
`ResponseItem`s, rollout trace payloads, raw notifications, classifier matches,
or rendered Goal text must not suppress automatic Continuation.

## Realignment Note

Read this Work Area with
`goal-work-area-coordination-note.md#accepted-v136-placement-default`.
Use the private `codex-rs/core/src/goal_cadence/` module directory for
request-input shaping and Continuation support. Continuation
request metadata must flow into `GoalTurnRequest` / `GoalRequestContext`, not
prebuilt model input. Stale Goal-owned synthetic turns must use the Work Area
02 submit-or-internal-abort outcome before model submission.

## Implementation Pass Index

Implement Work Area 03 through these implementation passes rather than as one
central idle rewrite:

- `03a-watermark-schema-store-apis.md`
  - Continuation watermark schema, state model, store APIs, cadence snapshot
    plumbing, and state tests
- `03b-model-visible-history-key-projection.md`
  - `ModelVisibleHistoryKey` type, eligible progress projection in
    `goal_cadence/`, and focused projection unit tests
- `03c-goal-turn-request-metadata.md`
  - metadata-only `GoalTurnRequest` storage/adapters and request-context
    plumbing; no rendered prompt text and no prebuilt model input
- `03d-idle-stage-order-refactor.md`
  - `MaybeContinueIfIdle` stage-order refactor and pending-work helpers that
    return whether work started
- `03e-idle-pending-durable-intent-delivery.md`
  - idle delivery of pending Initial / ObjectiveUpdated / BudgetLimit using
    typed metadata, not rendered model input
- `03f-automatic-continuation-preflight-shaper-recheck.md`
  - automatic Continuation candidate preflight and request-input shaper
    recheck before any synthetic request is submitted
- `03g-continuation-created-commit.md`
  - Created-event commit for automatic Continuation and watermark advancement
- `03h-resume-hydration-and-watermark-reconstruction.md`
  - resume hydration of durable Goal facts, pending intent, and Continuation
    suppression basis without fabricating Initial
- `03i-retry-failure-and-stale-synthetic-turn-tests.md`
  - retry, failure, stale candidate, and duplicate-suppression acceptance tests

The parent Work Area 03 file remains the overview contract. Implementation pass
docs are ordered units of work for the same rewrite branch. They should make
continuation state explicit for the next pass or compacted agent, not force
idle, key, watermark, and retry work into independently mergeable states.

Testing posture:

- each implementation pass should name focused validation for behavior it
  actually introduces
- state-only APIs should have focused state tests when that pass reaches a
  runnable state boundary
- projection logic should have direct unit tests before lifecycle tests depend
  on it
- `03i` is the representative failure/retry/stale synthetic-turn acceptance
  layer; it does not replace pass-local test plans for 03a-03h

## Direction Lock

Request:

- translate the model-visible history key and idle Continuation contracts into
  an execution-ready Work Area
- ground the plan in current idle hook, pending-work, history, resume,
  compaction, and request construction code
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`

Terrain:

- `codex-rs/core/src/goals.rs`
  - `GoalRuntimeEvent::ThreadResumed` and
    `GoalRuntimeEvent::MaybeContinueIfIdle` already exist as distinct events
  - `maybe_continue_goal_if_idle_runtime()` currently calls pending-work
    scheduling before Goal continuation scheduling
  - `continuation_lock` already protects Goal-owned scheduling
  - `restore_thread_goal_runtime_after_resume()` currently marks Initial
    pending for any active Goal, which the contract forbids
  - `initial_steering_goal_id` is runtime-only Initial state, which Work Area 01
    replaces with persisted pending cadence intent
  - `GoalContinuationCandidate` currently carries concrete
    `ResponseInputItem`s, which Work Area 03 must replace with request intent
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
  - Work Area 02 introduces committed carry metadata for finalized Goal items
- `codex-rs/core/src/session/turn.rs`
  - retry attempts rebuild prompt input from `clone_history().for_prompt(...)`
  - Work Area 02 request-input shaper must run inside
    `run_sampling_request(...)` before `build_prompt(...)`
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
    deleted or replaced under the Work Area 00 posture

Code-shape temptation:

- keep `MaybeContinueIfIdle` as "build Goal item and inject pending input"
- keep runtime-only Initial because it is already near Continuation
- treat `ContextManager::history_version()` as the Continuation key
- let the idle hook advance the watermark when it selects or reserves a turn
- let a preflight key replace request-input-shaper-owned per-attempt key
  computation
- send an empty synthetic Goal-owned request when a stale candidate is
  rejected late

Locked direction:

- put `ModelVisibleHistoryKey` and key projection in the Work Area 02 cadence
  module directory at `codex-rs/core/src/goal_cadence/`
- compute the key from the same logical model-visible input used for the
  request attempt, before inserting a new Continuation item
- use a preflight key only to avoid unnecessary synthetic turn launches; the
  request-input shaper recomputes the key for the exact attempt, and the
  Created-event commit handler commits it
- persist the latest committed automatic Continuation watermark in state so
  resume does not permit duplicates for unchanged history and unchanged Goal
  facts
- refactor `MaybeContinueIfIdle` into the contracted stage order:
  pending non-Goal work first, pending durable cadence delivery second,
  automatic Continuation last
- replace idle-owned concrete Goal input injection with structured
  `GoalTurnRequest` metadata consumed by the Work Area 02 request-input shaper

Exclusions:

- no `ext/goal` conversion
- no broad typed projection, raw notification, or classifier cleanup
- no final deletion of all `GoalContext` helpers
- no app-server Goal product API redesign
- no persisted pending Continuation intent
- no user-role active Goal steering compatibility
- no code implementation in this planning pass

## Ownership Split For This Work Area

Work Area 03 adds Continuation policy on top of the Work Area 02 final
request-input seam. Use this file split while implementing:

- `codex-rs/core/src/goal_cadence/` owns `ModelVisibleHistoryKey`
  projection, request-input shaper recheck of structured turn requests,
  Continuation item construction, and Continuation commit metadata helpers. It
  does not perform durable watermark mutation by itself.
- `codex-rs/state/src/runtime/goals.rs` owns the state-backed Continuation
  watermark record and clearing. It does not decide whether a request should
  emit Continuation, and it is not a recorded request evidence carrier.
- `codex-rs/core/src/goals.rs` owns the v136 idle lifecycle adapter:
  `MaybeContinueIfIdle` staging, resume hydration, and synthetic-turn
  reservation requests. It stores typed `GoalTurnRequest` metadata for the
  request-input shaper, not rendered prompt text or concrete model input.
- `codex-rs/core/src/session/turn.rs` continues to own request-input shaper
  placement and Created-event commit execution. It does not compute the key
  independently of `goal_cadence/`.
- `codex-rs/core/src/session/input_queue.rs`,
  `codex-rs/core/src/state/turn.rs`, and `codex-rs/core/src/session/mod.rs`
  may carry Goal turn request metadata and pending-work state. They must not inject
  automatic Continuation as `ResponseInputItem`.

## Required Edits

### 1. Add `ModelVisibleHistoryKey` To Goal Cadence

Edit:

- `codex-rs/core/src/goal_cadence/`

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
    pub(crate) fn from_cleaned_base_input(input: &[ResponseItem]) -> Self;
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

- `codex-rs/core/src/goal_cadence/`
- later Work Area 05 classifier module only if it already exists by implementation
  time

Add a private projection type equivalent to:

```rust
struct ModelVisibleProgressProjection {
    entries: Vec<ModelVisibleProgressEntry>,
    compaction_entries: Vec<ModelVisibleProgressEntry>,
}
```

The projection is computed from the cleaned base input for this attempt, after
Work Area 02 request cleanup has removed or ignored pure Goal-only artifacts,
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
entries when such entries are available in the cleaned base input, otherwise
`None`. Compaction summaries converted into ordinary assistant messages still
participate in the main eligible progress fingerprint.

### 3. Persist Latest Automatic Continuation Watermark

Edit:

- `codex-rs/state/goals_migrations/<next>_thread_goal_continuation_watermarks.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`

Use the next available goals migration number after WA01 lands. The current
WA01 route shares `0002_goal_cadence_state.sql` between facts-version and
pending-intent DDL, so the watermark pass should normally use `0003` after that
shared migration. Use `0004` only if WA01 actually consumes `0003` before WA03
lands.

WA03 selects this state-owned watermark table as the default live correctness
owner for automatic Continuation suppression. Structured recorded request
evidence can be appended from the same Created-event commit path for replay or
audit, but it does not replace this table unless a later implementation pass
explicitly selects a non-best-effort evidence-backed reconstruction strategy
and carries the failure policy from
`goal-authority-recorded-request-evidence.md`.

Add migration:

```sql
CREATE TABLE thread_goal_continuation_watermarks (
    thread_id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    facts_version INTEGER NOT NULL,
    model_visible_history_key TEXT NOT NULL,
    model_visible_history_key_schema_version INTEGER NOT NULL,
    eligible_progress_count INTEGER NOT NULL,
    eligible_progress_fingerprint TEXT NOT NULL,
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
It is also not `GoalRequestEvidence`: it stores the suppression triple and
item fingerprint needed by the state-owned duplicate-suppression path, not the
full finalized request-input fingerprint, attempt ordinal, item index, or
replay pairing metadata.

Add model types equivalent to:

```rust
pub struct ThreadGoalContinuationWatermark {
    pub thread_id: ThreadId,
    pub goal_id: String,
    pub facts_version: i64,
    pub model_visible_history_key: String,
    pub model_visible_history_key_schema_version: i64,
    pub eligible_progress_count: i64,
    pub eligible_progress_fingerprint: String,
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
    pub eligible_progress_fingerprint: String,
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

Extend the Work Area 01 cadence snapshot or add a sibling snapshot so core can
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

Resume, rollback, fork, and compaction code must not reconstruct this
watermark by parsing rendered Goal text or by treating ordinary rollout
`ResponseItem`s as commit evidence. If structured `GoalRequestEvidence` is
later used to reconstruct a missing watermark, it must be paired by fingerprint
with the surviving committed Goal item and must come from a persistence path
stronger than current fire-and-log rollout append behavior.

### 4. Extend Work Area 02 Request-Input Shaper Runtime Request

Edit:

- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`

Extend the Work Area 02 request shape with shared structured turn request
metadata:

```rust
pub(crate) enum GoalTurnRequest {
    SameTurnCadenceRecheck(GoalPendingCadenceDelivery),
    IdlePendingCadence(GoalPendingCadenceDelivery),
    IdleAutomaticContinuation(GoalAutomaticContinuationRequest),
}

pub(crate) struct GoalPendingCadenceDelivery {
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
}

pub(crate) struct GoalAutomaticContinuationRequest {
    pub goal_id: String,
    pub facts_version: i64,
    pub preflight_history_key: ModelVisibleHistoryKey,
}

pub(crate) struct GoalRuntimeRequest {
    pub cadence_snapshot: ThreadGoalCadenceSnapshot,
    pub turn_request: Option<GoalTurnRequest>,
}
```

Store `GoalTurnRequest` as turn metadata, not as pending model input:

```rust
TurnState::set_goal_turn_request(...)
TurnState::goal_turn_request(...)
Session::set_goal_turn_request_for_reserved_turn(...)
Session::goal_turn_request_for_turn(...)
```

The exact names may change. The shape may not:

- no `ResponseInputItem`
- no rendered Goal text
- no role-bearing model item
- no durable pending Continuation
- only structured request intent for the Work Area 02 request-input shaper

Metadata lifecycle rules:

- Same-turn metadata is accepted only as a request to re-run cadence selection
  from fresh durable facts on the current regular turn. It must not guarantee
  the originally requested kind, and it must not be created when the current
  task cannot run another sampling opportunity; in that case durable pending
  intent remains for a later ordinary turn or idle delivery.
- Idle metadata is written only for a Goal-owned reserved synthetic turn:
  `IdlePendingCadence` for pending Initial / ObjectiveUpdated / BudgetLimit
  delivery, or `IdleAutomaticContinuation` for automatic Continuation.
- Turn metadata lives until the active turn is cleared, the synthetic turn is
  aborted before submit, or Created-event commit records committed carry and
  makes the uncommitted metadata obsolete. It is not consumed merely because
  one shaping attempt inspected it; retry before Created must be able to
  re-run shaping from the same metadata and fresh durable facts. Post-commit
  same-turn follow-up attempts use fresh durable snapshots plus committed
  carry, not the stale `GoalTurnRequest`.
- Metadata supersedence is handled by the request-input shaper's fresh
  selection order. If same-turn metadata was originally requested for
  ObjectiveUpdated but BudgetLimit becomes due before the next attempt, the
  shaper selects BudgetLimit and returns commit metadata for BudgetLimit.
- Metadata is not current-turn carry. Mid-turn compaction may preserve
  committed carry metadata for a Goal item that reached Created; it must not
  treat uncommitted `GoalTurnRequest` metadata as proof that model-visible Goal
  authority exists.
- If a synthetic Goal-owned turn becomes stale, the shaper returns
  `AbortSyntheticGoalTurn` or equivalent. The caller clears the reserved turn
  and metadata without consuming pending intent, advancing the watermark, or
  surfacing a user-facing model error.

Work Area 02 request-input shaper changes for Work Area 03:

```text
receive base Vec<ResponseItem> for this attempt
clean or ignore Goal-only request artifacts under Work Area 02 rules
compute ModelVisibleHistoryKey from the cleaned base input
receive a fresh cadence snapshot and latest Continuation watermark in
  GoalRequestContext assembled by the caller for this attempt
select pending durable BudgetLimit / ObjectiveUpdated / Initial if due
else select AutomaticContinuation only when turn_request carries a matching
  candidate and the latest watermark does not match the recomputed triple
insert exactly one selected developer-role Goal ResponseItem when selected
return commit metadata containing the exact recomputed key for Continuation
```

If an automatic Continuation candidate's preflight key differs from the
recomputed per-attempt key, the request-input shaper must not insert
Continuation.

If a Goal-owned synthetic turn has no selected pending intent and no valid
automatic Continuation after request-input shaper recheck, the implementation
must abort that synthetic request before model submission. Do not send an empty
Goal-owned request just because the scheduler reserved a turn.

The abort shape can be an internal request-input shaping outcome such as:

```rust
pub(crate) enum GoalFinalizationRequestDisposition {
    Submit(FinalizedGoalRequestInput),
    AbortSyntheticGoalTurn,
}
```

Do not expose this as a user-facing product error.

### 5. Commit Automatic Continuation Watermark On Created

Edit:

- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/state/src/runtime/goals.rs`

Extend `GoalRequestCommit` from Work Area 02 so Continuation commit metadata
requires:

```rust
pub model_visible_history_key: ModelVisibleHistoryKey,
```

for `GoalCadenceKind::Continuation`. Non-Continuation commit metadata may
still carry `None` only if the Work Area 02 continuation state is being
implemented before Work Area 03; after Work Area 03, the key is available for
diagnostics but watermarking uses it only for Continuation.

Continuation commits inherit the Work Area 02 exact request identity fields:
attempt ordinal, item index, selected item fingerprint, full finalized
request-input fingerprint, and inserted-or-verified placement. The watermark
table does not store every one of those evidence fields, but the Created-event
commit handler must receive them so it can verify that the watermark update
refers to the exact finalized request attempt.

On `ResponseEvent::Created`, `commit_goal_request(...)` must:

- verify the finalized request identity before side effects:
  - the selected Continuation item is still at `item_index`
  - the selected item still matches `item_fingerprint`
  - the logical finalized input still matches `request_input_fingerprint`
- record the finalized developer-role Continuation item as model-visible Goal
  steering through the same committed request path used by Work Area 02
- upsert `thread_goal_continuation_watermarks` with:
  - `thread_id`
  - `goal_id`
  - `facts_version`
  - `model_visible_history_key.as_storage_key()`
  - visible key component fields
  - `committed_turn_id`
  - `item_fingerprint`
  - current commit timestamp
- append structured `GoalRequestEvidence` or equivalent typed metadata from
  this same Created-event path when the typed evidence carrier is implemented
- record committed current-turn carry metadata from Work Area 02

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

Evidence relationship:

- durable watermark upsert is the live duplicate-suppression correctness path
  selected by this Work Area
- structured evidence, when implemented, is replay/audit metadata tied to the
  exact finalized request attempt
- ordinary rollout `ResponseItem`s, rollout trace payloads, raw response item
  notifications, classifier matches, and rendered Goal text must not be
  accepted as substitutes for the structured evidence record
- if replay evidence matters for resume, rollback, fork, or reconstruction,
  the committed Goal `ResponseItem` and typed evidence record must be appended
  as one logical thread-history batch with a non-best-effort failure policy
- evidence append failure must not silently weaken live duplicate suppression;
  either durable state remains the correctness owner, or the implementation
  explicitly chooses and tests a stronger evidence-backed path

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

After reserving a Goal-owned synthetic turn, check that the reservation still
points at the same `TurnState`, that no pending non-Goal work appeared, and
that the durable Goal snapshot still supports the stored `GoalTurnRequest`.
If any check fails, clear the reservation and return. A reservation is not a
commit and does not consume pending intent or advance the Continuation
watermark.

### 7. Deliver Pending Durable Cadence Intent From Idle

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/goal_cadence/`

When Stage 2 finds eligible pending Initial, ObjectiveUpdated, or BudgetLimit
intent:

```text
read ThreadGoalCadenceSnapshot
choose BudgetLimit > ObjectiveUpdated > Initial
reserve an ActiveTurn with no prebuilt Goal model input
store GoalTurnRequest::IdlePendingCadence as turn metadata
create a default TurnContext for the reserved turn
re-check the active Goal state, selected pending intent, same active-turn
  reservation, and pending non-Goal work
start Goal-owned task without draining newly arrived queued/mailbox work into
  the synthetic turn
```

The request-input shaper selects from durable pending cadence intent and
returns inert commit metadata. The Created-event commit handler consumes the
exact-key pending intent. The idle hook does neither.

The synthetic launch must not rely on a non-atomic pre-launch recheck followed
by the generic task start path if that path can drain newly arrived queued
next-turn or trigger-turn mailbox input into the active turn. The implementation
must either make the pending-work recheck and task start effectively atomic, or
use a Goal-owned start path that refuses or requeues late pending work before
model submission.

If the request-input shaper later finds the pending intent is gone, stale, or
superseded, it must abort the synthetic request before model submission unless
another valid cadence item is selected by normal supersedence.

Delivering pending durable cadence intent must not advance the automatic
Continuation watermark.

Remove idle-path use of:

- `mark_initial_goal_steering_pending(...)`
- `goal_steering_kind_for(...)`
- `take_initial_goal_steering(...)`
- `GoalContinuationCandidate.items`
- `extend_goal_pending_input_for_turn_state(...)`

for request-input-shaper-owned Goal work.

The old functions may remain temporarily only while reachable old producers
await later Work Areas, but WA03-owned idle lifecycle delivery must not use
them.

### 8. Launch Automatic Continuation With Preflight And Request-Input Shaper Recheck

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
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
  the request-input shaper
load latest Continuation watermark
if watermark matches { goal_id, preflight key, facts_version }, return
reserve ActiveTurn
store GoalTurnRequest::IdleAutomaticContinuation as turn metadata
re-read durable Goal and watermark
re-check the same active-turn reservation and pending non-Goal work
start Goal-owned task without draining newly arrived queued/mailbox work into
  the synthetic turn
```

The preflight key is a launch suppression check only. It is not committed.
As with Stage 2, a pending-work recheck before a generic task start is not
enough if the start path can drain late queued/mailbox work into the synthetic
turn.

During `run_sampling_request(...)`, the Work Area 02 request-input shaper
recomputes `ModelVisibleHistoryKey` from the actual per-attempt base input.
Automatic Continuation is inserted only if:

- the turn carries `GoalTurnRequest::IdleAutomaticContinuation`
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
- state APIs from this Work Area

Change `restore_thread_goal_runtime_after_resume()`:

- reload durable Goal facts
- reload pending Initial, ObjectiveUpdated, and BudgetLimit intent through the
  Work Area 01 cadence snapshot
- reload latest Continuation watermark through the Work Area 03 state API
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

If structured recorded request evidence is present during resume or
reconstruction, WA03 may treat it as replay metadata only. It must not create
durable Goal facts, pending intent, or a Continuation watermark from evidence
unless the implementation has explicitly selected a non-best-effort
evidence-backed reconstruction path. The default path is to load the
state-owned watermark record and compare it with the key recomputed from
reconstructed model-visible history.

### 10. Compaction, Rollback, Fork, And Reconstruction Key Behavior

Edit:

- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`

Work Area 03 does not finish broad compaction/projection cleanup. It must still
make the key correct for the model-visible input it sees.

Rules:

- compute the key from `for_prompt(...)` output or from the request-input
  shaper's cleaned base input, not from raw rollout counts
- pure current Goal internal-context items and pure legacy `<goal_context>`
  artifacts do not contribute
- compaction summaries or compaction items that alter the model-visible
  projection do contribute
- replacement-history changes contribute through the resulting model-visible
  item projection
- rollback and fork naturally compute keys from surviving reconstructed
  history
- structured `GoalRequestEvidence`, when present, may help replay committed
  Continuation metadata only under the recorded-evidence rules; it is not part
  of the eligible progress projection
- ordinary rollout `ResponseItem`s that happen to contain Goal text are not
  Continuation watermark evidence by themselves
- `ContextManager::history_version()` may be logged for diagnostics but must
  not suppress or permit Continuation by itself

If the implementation needs helper access to raw prompt-history items for unit
tests, add a narrowly named helper in `goal_cadence/` rather than changing
`ContextManager` into a Goal authority component.

Compaction must not synthesize or carry a new Continuation watermark merely
because it removed, summarized, or repaired Goal-looking items. The state-owned
watermark remains the correctness owner unless a later pass deliberately
implements the structured evidence carry-forward path described in
`goal-authority-recorded-request-evidence.md`.

### 11. Failure And Retry Semantics

Edit:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- state APIs from this Work Area

Required behavior:

- retry attempts recompute `ModelVisibleHistoryKey` from the rebuilt base input
  for that attempt
- retry attempts receive a fresh cadence snapshot and the latest persisted
  Continuation watermark before request-input shaping
- request construction failure before final request input contains the
  Continuation item does not advance the watermark
- client stream setup failure before `ResponseEvent::Created` does not advance
  the watermark
- stream error before `ResponseEvent::Created` does not advance the watermark
- stream error after `ResponseEvent::Created` leaves the watermark committed
- no structured request evidence is written before `ResponseEvent::Created`
- retry after Created does not insert another automatic Continuation for the
  same `{ goal_id, model_visible_history_key, facts_version }`

If the request-input shaper aborts a stale synthetic Goal-owned turn, clear the
reserved active turn and finish without emitting a user-visible error. Do not
convert the abort into a normal assistant request.

## Focused Test Coverage

Add or update these tests as the branch reaches the relevant runnable surfaces.
Do not add compatibility shims, no-op adapters, or old-path preservation solely
to make WA03 independently testable before WA04-WA06 finish the rewrite.

Likely test locations:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/tests/suite/mod.rs` when adding a new suite module
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
- `goal_cadence_continuation_watermark_is_not_request_evidence`
  - watermark rows do not store rendered prompt text, full finalized request
    input, ordinary rollout items, or rollout trace payloads

These tests must not render Goal prompt text or inspect model roles.

### Idle Lifecycle Tests

Replace old behavior tests that assert `<goal_context>` or resume-fabricated
Initial. Planned coverage:

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
  - idle hook later delivers it through the request-input shaper
- `goal_idle_delivers_pending_budget_limit_and_supersedes_older_intent`
  - pending BudgetLimit suppresses older Initial / ObjectiveUpdated for same
    Goal
  - final request payload renders current durable budget state
- `goal_idle_pending_durable_intent_suppresses_automatic_continuation`
  - active Goal and eligible history exist
  - pending durable cadence intent exists
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
  - reservation is cleared or late pending work is refused/requeued before
    model submission
  - no pending work is drained into a Goal-owned synthetic request
  - no intent is consumed; no watermark advances
- `goal_idle_automatic_continuation_preflight_mismatch_aborts_before_submit`
  - preflight key differs from the per-attempt recomputed key
  - no `/responses` request is submitted for the stale synthetic turn
  - no watermark or evidence is written
- `goal_idle_request_failure_before_created_does_not_advance_watermark`
  - stream fails before Created
  - retry or later idle opportunity can still deliver Continuation
  - no structured request evidence is written
- `goal_idle_retry_after_created_does_not_duplicate_continuation`
  - stream emits Created then retryable error
  - watermark remains committed
  - retry does not emit another Continuation for the same key
- `goal_idle_continuation_created_commit_records_evidence_metadata`
  - final request payload contains exactly one developer-role Continuation item
  - Created-event commit writes the state-owned watermark
  - if the typed evidence carrier and explicit failure policy exist, the
    evidence fingerprints match the exact item and full finalized logical
    request input
- `goal_idle_resume_ignores_ordinary_rollout_goal_text_for_watermark`
  - surviving ordinary rollout `ResponseItem` with Goal text does not
    reconstruct Continuation suppression by itself
  - resume uses the state-owned watermark, or an explicitly selected structured
    evidence path, never rendered text
- `goal_idle_rollback_recomputes_key_from_surviving_history`
  - rollback computes the key from surviving reconstructed prompt input
  - rolled-back Goal items, request evidence, rollout text, or trace payloads
    do not suppress or permit Continuation by themselves
- `goal_idle_fork_recomputes_key_from_surviving_history`
  - fork computes the key from the fork's surviving reconstructed prompt input
  - parent-only Goal items, request evidence, rollout text, or trace payloads
    do not suppress or permit Continuation by themselves

Tests that currently assert resumed active Goal emits Initial, active
`<goal_context>` output, or user-role Goal steering must be deleted or
rewritten according to `local/goal_research/goal-test-deletion-map.md`.

## Verification

Docs-only validation for this planning Work Area:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

When the branch reaches a runnable point for these surfaces, use focused
validation such as:

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
`all` integration test binary's suite modules:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle
cargo test -p codex-core --test all goal_authority
```

Do not run broad workspace or full crate suites by default on this
workstation.

## WA03-Owned Branch Continuation State

This state describes the branch after WA03-owned implementation work has been
applied. It is not a build, PR, merge, release, or final acceptance checkpoint;
later Work Areas may still be required before the whole Goal rewrite compiles,
runs, or satisfies acceptance.

- `ModelVisibleHistoryKey` exists as structured key data, not a
  `history_version()` alias
- the key is computed from the request-input shaper's cleaned base input before
  inserting a new Continuation item
- pure current Goal internal-context and pure legacy `<goal_context>` items do
  not change the Continuation key
- ordinary user, assistant, tool, reasoning, mailbox, and eligible compaction
  progress changes can change the key
- the automatic Continuation item itself does not change the key that permits
  another automatic Continuation
- latest automatic Continuation watermark is persisted in state and reloadable
  after resume/restart
- watermark advances only after the Continuation item reaches final request
  input and the stream reaches `ResponseEvent::Created`
- structured request evidence, when implemented, is written only from the same
  Created-event commit path and does not replace the state-owned watermark by
  default
- retry before Created does not advance the watermark
- retry after Created does not duplicate Continuation for the same key
- `MaybeContinueIfIdle` runs pending non-Goal work first, pending durable Goal
  cadence intent second, automatic Continuation last
- pending Initial, ObjectiveUpdated, and BudgetLimit delivery from idle uses
  durable pending cadence intent and the Work Area 02 request-input shaper, not
  prebuilt Goal input
- automatic Continuation launch uses structured `GoalTurnRequest` metadata and
  the Work Area 02 request-input shaper, not concrete `ResponseInputItem`
  injection
- resume hydrates durable state and pending intent without fabricating Initial
- final request payload tests prove automatic Continuation emits exactly one
  developer-role Goal item when due
- tests prove repeated idle hooks with unchanged
  `{ goal_id, model_visible_history_key, facts_version }` do not duplicate
  automatic Continuation

## Non-Goals

This Work Area does not:

- create persisted pending Continuation intent
- use recorded request evidence as the default live Continuation suppression
  owner
- change the upstream Goal product API surface
- convert `ext/goal`
- finish broad raw-response, typed projection, or materialized projection
  cleanup
- finish compaction carry conversion beyond key correctness for request-input
  shaper base input
- delete every `GoalContext` helper
- parse rendered Goal text to recover active Goal state, pending intent, or
  watermark state
- make repair the cadence mechanism
- emit Goal steering on ordinary user turns merely because durable Goal state
  exists

## Continuation Constraints

Work Area 03 should be implemented after Work Area 01 and Work Area 02 have established
durable cadence state, final request-input shaping, and the Created commit
seam.

Branch continuation state while later Work Areas remain:

- `goal_cadence/` owns the key projection and, after 03f, Continuation commit
  metadata helpers
- `session/turn.rs` owns Created-event commit execution and uses the exact
  commit metadata returned by request-input shaping
- state APIs own durable watermark mutation
- structured request evidence, if already implemented, is metadata written by
  the Created-event commit path; it is not the default watermark correctness
  owner
- `MaybeContinueIfIdle` uses durable pending cadence intent and structured
  `GoalTurnRequest` metadata
- `ext/goal` still awaits Work Area 04 conversion
- broad classifier/projection cleanup still awaits Work Area 05
- final dead-code deletion still awaits Work Area 06

Not allowed in WA03-owned idle and Continuation paths after this work:

- `ThreadResumed` marking Initial pending from active Goal state alone
- automatic Continuation selected from active durable Goal state alone
- automatic Continuation using `ContextManager::history_version()` as its key
- watermark advancing before `ResponseEvent::Created`
- synthetic Goal-owned turns injecting concrete Goal `ResponseInputItem`s as
  authority
- a stale/suppressed synthetic Goal-owned turn sending an empty model request
- tests that prove helper output but not final request input
