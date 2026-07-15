# Work Area 02: Final Request-Input Shaping And Commit

This Work Area adds the core authority seam for active Goal steering:

- per-attempt shaping of the actual `Vec<ResponseItem>` before `Prompt.input`
- selection of durable pending Initial, ObjectiveUpdated, and BudgetLimit
  intent
- insertion of exactly one selected current developer-role Goal `ResponseItem`
  when due
- commit metadata tied to that exact final request item and finalized logical
  request input
- commit on `ResponseEvent::Created`

It does not implement automatic idle Continuation policy. It does not convert
`ext/goal`. It does not finish broad classifier/projection cleanup.
Work Area 03 consumes this seam for the real `model_visible_history_key`,
automatic Continuation selection, and Continuation watermark commit behavior.

## Implementation Pass Planning Status

Work Area 02 should be split directly from targeted request-construction code
reads. It is not expected to need a separate prep-map layer. The relevant
pressure points are the request-loop seam, the Created-event commit seam,
current core producer conversion, committed carry metadata, and request-payload
tests.

Pre-pass validation is complete in
`02-direct-split-readiness-check.md`. That note confirms the direct split is
grounded in the actual local and `rust-v0.136.0` request loop, identifies the
Created-event commit hook, names the local fork concrete-carry terrain, and
records the core producers that still create pre-shaper Goal model input.

The old labels for module types, no-op request-input shaper wiring, pending
insertion, Created commit, producer conversion, and request-payload tests are
not authority by themselves. Reuse, rename, merge, or split them only after a
targeted direct read confirms the boundaries.

The parent Work Area 02 file remains the overview contract. Final implementation
pass docs should be ordered units of work for the same rewrite branch. They
exist so agents can continue the request/commit rewrite across compactions
without reopening the architecture. They should state handoff state and
downstream owner for intentionally incomplete work, not imply independent
mergeability.

Testing posture:

- each final implementation pass should include validation for behavior or
  interfaces it actually introduces
- pure module behavior, selection, commit primitives, and producer state
  effects should be tested near the pass that introduces them
- recorded-evidence fields and carrier behavior should be tested near the pass
  that introduces the Created-event commit writer or typed replay carrier
- avoid type-only or no-op passes unless the continuation state is explicit
  and no executable behavior exists yet
- the final integrated Work Area 02 target-state pass should prove full
  `/responses` payload, retry, follow-up, cleanup, and commit behavior; it does
  not replace pass-local tests for earlier behavior

## Direction Lock

Request:

- translate the final request-input authority contract into an execution-ready
  Work Area
- ground the plan in current request construction, retry, stream, and Goal
  injection code
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`

Terrain:

- `codex-rs/core/src/session/turn.rs`
  - `run_turn(...)` builds `sampling_request_input` from
    `sess.clone_history().await.for_prompt(...)`
  - `run_sampling_request(...)` accepts an initial `Vec<ResponseItem>`
  - retry attempts inside `run_sampling_request(...)` rebuild prompt input from
    history
  - `build_prompt(...)` creates `Prompt { input, ... }`
  - `try_run_sampling_request(...)` currently treats `ResponseEvent::Created`
    as a no-op
- `codex-rs/core/src/client_common.rs`
  - `Prompt.input` is the model request input
  - `Prompt::get_formatted_input()` clones `Prompt.input`
- `codex-rs/core/src/client.rs`
  - `build_responses_request(...)` copies `prompt.get_formatted_input()` into
    `ResponsesApiRequest.input`
  - HTTP and WebSocket transports both call `build_responses_request(...)`
  - WebSocket delta compression derives from the same logical full request
- `codex-rs/codex-api/src/common.rs`
  - `ResponsesApiRequest.input` is `Vec<ResponseItem>`
  - `ResponseCreateWsRequest::from(&ResponsesApiRequest)` preserves that input
- `codex-rs/core/src/session/mod.rs`
  - `record_conversation_items(...)` appends ordinary `ResponseItem`s to
    history, persists them as rollout response items, and emits raw response
    item events
  - `persist_rollout_items(...)` currently logs append failures
- `codex-rs/protocol/src/protocol.rs`
  - `RolloutItem` has no Goal request commit metadata in the v136 terrain
- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - replay reconstructs ordinary response items, compaction checkpoints, turn
    context, and event messages, not Goal request commit identity
- `codex-rs/thread-store/src/live_thread.rs`
  - live thread append applies rollout persistence filtering before storage
- `codex-rs/rollout/src/policy.rs`
  - ordinary `RolloutItem::ResponseItem` persistence is content persistence,
    not structured Goal commit evidence
- old Goal steering terrain currently builds and carries concrete
  `ResponseInputItem`s before this seam

Code-shape temptation:

- shape only the first request input before the retry loop
- treat a developer-role `ResponseInputItem` as authority because role is
  mechanically preserved
- consume pending intent when prompt text is rendered or a helper item exists
- commit before the stream reaches `ResponseEvent::Created`
- hide final request shaping inside `goals.rs`, generic context rendering, or
  classifier code
- leave old concrete Goal carry as evidence that the final request contained
  current Goal authority
- treat ordinary rollout `ResponseItem`s, rollout trace payloads, raw response
  notifications, classifier matches, or rendered Goal text as structured
  recorded request evidence

Locked direction:

- add a dedicated private core request-input shaping module directory at
  `codex-rs/core/src/goal_cadence/`
- run final request-input shaping inside `run_sampling_request(...)` for every
  attempt, after that attempt's base prompt input is known and before
  `build_prompt(...)`
- make `ResponseEvent::Created` the commit point for the selected request item
- use Work Area 01 durable pending intent APIs for Initial, ObjectiveUpdated, and
  BudgetLimit
- keep `goals.rs` as lifecycle/tool/app-server adapter and prompt-body helper,
  not final request-input authority owner
- replace current-turn concrete Goal carry with committed metadata for the
  finalized item
- keep recorded request evidence as typed commit/replay metadata written only
  from the Created-event commit handler, with durable state remaining the live
  correctness owner unless a non-best-effort evidence path is explicitly chosen

Exclusions:

- no automatic Continuation selection, reservation, or watermark policy; Work Area
  03 owns that
- no `ext/goal` producer conversion; Work Area 04 owns that
- no broad projection/raw/compaction classifier replacement; Work Area 05 owns that
- no final deletion of all `GoalContext` terrain; Work Area 06 owns final cleanup
- no user-role active Goal steering compatibility

## Bounded Code Terrain Read

Files read for this Work Area:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/src/client.rs`
- `codex-rs/codex-api/src/common.rs`
- `codex-rs/core/src/responses_retry.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/thread-store/src/live_thread.rs`
- `codex-rs/rollout/src/policy.rs`
- `codex-rs/core/tests/common/responses.rs`
- request-capture examples in `codex-rs/core/tests/suite/client.rs`
- targeted upstream `rust-v0.136.0`, `rust-v0.139.0`, `rust-v0.140.0`, and
  `upstream/main` `RolloutItem` shape checks for typed replay precedent

Findings:

- final request input is the `Vec<ResponseItem>` passed to `build_prompt(...)`
  and then copied unchanged into `Prompt.input`
- `Prompt::get_formatted_input()` clones `Prompt.input`
- `build_responses_request(...)` copies that clone into
  `ResponsesApiRequest.input`
- `ResponseInputItem::Message { role, ... }` preserves its `role` when
  converted to `ResponseItem::Message`, so the old path is not wrong because it
  downgrades developer to user
- the old path is wrong because it injects and records concrete Goal-looking
  model input before final cadence selection and commit
- retry attempts in `run_sampling_request(...)` rebuild base prompt input from
  history after the first attempt
- `ResponseEvent::Created` is currently the first local stream event suitable
  for committing pending intent delivery
- `ResponseMock::single_request().input()` and related helpers already support
  final `/responses` payload assertions
- current mid-turn compaction reads concrete current-turn Goal
  `ResponseInputItem`s from `TurnState`
- the replacement carry must be committed metadata, not a pre-request-shaping
  model-input item
- current rollout history has no typed Goal request evidence carrier; ordinary
  `RolloutItem::ResponseItem` records model-visible content but not attempt
  ordinal, item index, full request-input fingerprint, or Created-event commit
  identity
- current `Session::persist_rollout_items(...)` is fire-and-log on append
  failure, so it is not sufficient as the sole correctness path for pending
  intent consumption or Continuation suppression
- `rust-v0.140.0` and `upstream/main` show typed replay metadata/items can live
  beside ordinary `ResponseItem` rollout content, but that is only precedent
  for a structured carrier; it does not make rendered text or model-visible
  items into Goal evidence

## Ownership Split For This Work Area

This Work Area introduces the active Goal authority seam but does not move the
whole Goal runtime into core. Use this file split while implementing:

- `codex-rs/core/src/goal_cadence/` is the request-input shaping module
  directory for this Work Area. It owns cleanup of active Goal artifacts,
  pending-intent selection, developer-role `ResponseItem` construction, and
  commit metadata for the exact final request item.
- `codex-rs/core/src/session/turn.rs` is only the sampling placement owner. It
  passes the actual per-attempt base input into the request-input shaper before
  `build_prompt(...)` and passes commit metadata to the Created-event commit
  point.
- Work Area 01 APIs in `codex-rs/state/src/runtime/goals.rs` own durable facts,
  pending intent snapshots, and exact-key intent consumption. They do not
  choose the model role or render Goal prompt text.
- `codex-rs/core/src/goals.rs` is edited only to convert existing core
  Initial, ObjectiveUpdated, and BudgetLimit producers into durable intent
  producers and, if useful, to provide prompt-body helpers. It is not the
  long-lived cadence service, request-input shaper, scheduler, or active
  model-input owner.
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs` may introduce committed carry metadata for
  finalized Goal delivery. They must not keep `ResponseInputItem` carry as
  authority evidence.
- `codex-rs/protocol/src/protocol.rs`, `codex-rs/thread-store`, and
  `codex-rs/rollout` own any typed replay carrier and persistence filtering
  needed for recorded request evidence. They do not select cadence, render
  Goal text, consume pending intent, or materialize active model input.

## Required Edits

### 1. Add Core Goal Cadence Module Directory

Edit:

- `codex-rs/core/src/lib.rs`

Add:

- `mod goal_cadence;`

Add:

- `codex-rs/core/src/goal_cadence/mod.rs`
- private submodules as needed, such as `prompt.rs`, `repair.rs`, or
  `fingerprint.rs`

This module owns final request-input Goal authority. It must not live in
generic context code and should not be absorbed into `goals.rs`.

Required public-to-core types:

```rust
pub(crate) enum GoalCadenceKind {
    Initial,
    ObjectiveUpdated,
    BudgetLimit,
    Continuation,
}

pub(crate) enum GoalItemPlacement {
    Inserted,
    VerifiedExisting,
}

pub(crate) struct GoalItemFingerprint {
    // Stable digest or structured fields sufficient to identify the exact
    // final developer-role Goal item.
}

pub(crate) struct GoalRequestInputFingerprint {
    // Stable digest or structured fields sufficient to identify the full
    // finalized logical request input.
}

pub(crate) struct GoalRequestCommit {
    pub thread_id: ThreadId,
    pub turn_id: String,
    pub attempt_ordinal: u64,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
    pub request_input_fingerprint: GoalRequestInputFingerprint,
    pub item_index: usize,
    pub placement: GoalItemPlacement,
    pub item: ResponseItem,
}

pub(crate) struct GoalRepairReport {
    pub removed_legacy_goal_context_items: usize,
    pub removed_wrong_role_goal_items: usize,
    pub removed_duplicate_goal_items: usize,
    pub removed_stale_goal_items: usize,
}

pub(crate) struct FinalizedGoalRequestInput {
    pub input: Vec<ResponseItem>,
    pub commit: Option<GoalRequestCommit>,
    pub repair_report: GoalRepairReport,
}

pub(crate) enum GoalFinalizationOutcome {
    Submit(FinalizedGoalRequestInput),
    AbortSyntheticGoalTurn,
}
```

The exact field representation may change, but the semantics may not:

- commit metadata refers to the exact `ResponseItem` in final request input
- `attempt_ordinal` is allocated immediately before per-attempt request-input
  shaping and reused by the Created-event commit handler
- `item_index`, `item_fingerprint`, and `request_input_fingerprint` identify
  the exact finalized logical `Vec<ResponseItem>` and selected item that become
  `Prompt.input` / `ResponsesApiRequest.input`
- pending intent is not consumed when the struct is created
- `item` is a finalized `ResponseItem`, not a pre-request-shaping
  `ResponseInputItem`; it may be carried for model-visible history append, but
  the fingerprint fields are the commit identity
- `VerifiedExisting` is valid only when this attempt's cleaned request input
  already contains exactly one selected current developer-role `ResponseItem`
  matching the durable facts and cadence kind
- `model_visible_history_key` may be `None` only for non-Continuation commits
  before Work Area 03; Continuation commits must require a real key
- repair report is diagnostic/test support, not a cadence decision source
- `commit_point` and `committed_at_ms` are not shaper outputs. The
  Created-event commit handler adds those fields when it materializes
  `CommittedGoalRequestEvidence` or equivalent typed metadata.

### 2. Add Final Request-Input Shaping Function

Edit:

- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`

Add a function equivalent to:

```rust
pub(crate) fn finalize_request_input(
    base_input: Vec<ResponseItem>,
    context: GoalRequestContext,
) -> GoalFinalizationOutcome;
```

`GoalRequestContext` must include:

- thread id
- turn id
- attempt ordinal allocated immediately before request-input shaping for this
  sampling attempt
- current durable Goal cadence snapshot from Work Area 01
- optional turn request metadata that asks the shaper to re-run cadence
  selection from fresh facts for this attempt; it must not contain rendered
  Goal text or a prebuilt model input item
- optional automatic Continuation request, initially `None` in Work Area 02
- optional model-visible history key for this attempt
- Goals feature and collaboration-mode eligibility facts for this attempt
- request/transport facts needed for diagnostics and repair
- request-local repair context, if the shaper needs to distinguish cleanup
  from cadence delivery

`GoalRequestContext` must not contain `&Session`, `StateDbHandle`, or
`TurnContext`. `session/turn.rs` or a nearby adapter assembles a fresh context
for each request attempt before calling this function. The shaper does not
load durable state itself.

The shaper must treat feature-disabled or collaboration-ineligible attempts
as selecting no active Goal item and consuming no pending intent. These typed
eligibility facts are gates on delivery; they are not cadence authority by
themselves.

Work Area 02 must not invent a fake history key. If the full key projection is not
implemented until Work Area 03, non-Continuation commits may carry
`model_visible_history_key: None`. Continuation remains inactive until a real
key exists. Do not use `ContextManager::history_version()` as a Continuation
key.

Shaping order:

```text
receive base Vec<ResponseItem> for this attempt
classify/remove pure legacy <goal_context> artifacts from active request input
classify/remove stale, wrong-role, duplicate, or pre-injected Goal-looking items
apply feature/collaboration eligibility gates for active Goal delivery
capture real model_visible_history_key before inserting selected Goal item,
  when the Work Area 03 key implementation already exists; otherwise keep None
  for non-Continuation commits
select cadence request from the durable snapshot and turn metadata in order:
  pending BudgetLimit
  pending ObjectiveUpdated
  pending Initial
  runtime Continuation request (not active until Work Area 03)
render selected Goal text from durable state
insert exactly one developer-role Goal `ResponseItem` when selected
return FinalizedGoalRequestInput { input, commit, repair_report }
```

Selection rules:

- pending BudgetLimit supersedes ObjectiveUpdated and Initial for the same
  request opportunity
- pending ObjectiveUpdated supersedes Initial
- pending Initial is selected only when no higher-priority pending intent is
  due
- Continuation is not selected in Work Area 02
- Continuation is never persisted pending cadence intent
- active durable Goal state alone selects nothing
- historical rendered Goal items select nothing
- same-turn or idle turn metadata never guarantees that its originally
  requested kind is delivered; the shaper rechecks durable facts, pending
  intent, eligibility, and supersedence for this exact attempt
- turn metadata may survive retries before `ResponseEvent::Created`, but once
  Created-event commit records committed carry for the selected Goal item, the
  uncommitted request metadata must be cleared or treated as obsolete. Later
  same-turn follow-up shaping uses fresh durable snapshots plus committed
  carry, not stale `GoalTurnRequest` metadata.

### 3. Wire Shaping Into Every Sampling Attempt

Edit:

- `codex-rs/core/src/session/turn.rs`

Required placement:

- inside `run_sampling_request(...)`
- inside the retry loop
- after this code has chosen `prompt_input`
- before `build_prompt(...)`

Target shape:

```rust
let attempt_ordinal = next_goal_request_attempt_ordinal();
let base_prompt_input = if let Some(input) = initial_input.take() {
    input
} else {
    sess.clone_history()
        .await
        .for_prompt(&turn_context.model_info.input_modalities)
};

let goal_request_context =
    assemble_goal_request_context_for_attempt(attempt_ordinal, ...).await?;
let finalized_goal_input = match goal_cadence::finalize_request_input(
    base_prompt_input,
    goal_request_context,
) {
    GoalFinalizationOutcome::Submit(finalized) => finalized,
    GoalFinalizationOutcome::AbortSyntheticGoalTurn => {
        return Ok(SamplingRequestResult::synthetic_goal_turn_aborted());
    }
};

let prompt = build_prompt(
    finalized_goal_input.input,
    router.as_ref(),
    turn_context.as_ref(),
    base_instructions.clone(),
);
```

Then pass `finalized_goal_input.commit` into `try_run_sampling_request(...)`.

`assemble_goal_request_context_for_attempt(...)` is illustrative placement, not
a required function name. The important split is that `session/turn.rs` or a
nearby adapter loads durable snapshots and turn request metadata, while
`goal_cadence::finalize_request_input(...)` remains a pure request-input
shaper over `Vec<ResponseItem>` plus typed facts. Turn request metadata is an
input to selection, not a stored prompt, preselected cadence item, or authority
record.

Do not shape `sampling_request_input` only in `run_turn(...)`; that would miss
retry attempts that rebuild prompt input from history.

Do not move the seam into `client.rs`; that is after `Prompt` construction and
would make Goal authority a client serialization side effect.

Attempt ordinal rules:

- allocate the ordinal before calling `goal_cadence::finalize_request_input(...)`
  for each sampling attempt
- reuse the same ordinal in `GoalRequestCommit` and any
  `CommittedGoalRequestEvidence`
- do not allocate ordinals only for attempts that select Goal cadence; evidence
  tests need stale failed attempts to be distinguishable from committed attempts
- retry and follow-up requests get new ordinals because their base prompt input
  is rebuilt and re-shaped

### 4. Commit On `ResponseEvent::Created`

Edit:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/goals.rs`
- Work Area 01 state APIs in `codex-rs/state/src/runtime/goals.rs`

Change `try_run_sampling_request(...)` to accept:

```rust
goal_request_commit: Option<GoalRequestCommit>
```

On `ResponseEvent::Created`:

```rust
if let Some(commit) = goal_request_commit.take() {
    goal_cadence::commit_goal_request_on_response_created(
        sess.as_ref(),
        turn_context.as_ref(),
        commit,
    ).await?;
}
```

Commit behavior:

- verify the finalized request identity before side effects:
  - the selected item is still at `item_index`
  - the selected item still matches `item_fingerprint`
  - the logical finalized input still matches `request_input_fingerprint`
- record the finalized developer-role Goal `ResponseItem` as a model-visible
  cadence item when the commit represents cadence delivery, whether placement
  was `Inserted` or `VerifiedExisting`
- consume pending Initial, ObjectiveUpdated, or BudgetLimit intent with
  `consume_pending_intent_exact(...)`
- clear superseded Initial or ObjectiveUpdated intent after committed
  BudgetLimit when required
- when recorded rollout/thread history is used as replay evidence, append the
  committed Goal `ResponseItem` and typed `GoalRequestEvidence` as one logical
  thread-history write
- store committed current-turn carry metadata for this turn
- do not advance Continuation watermark in Work Area 02

No commit occurs when:

- the request-input shaper returns no selected item
- `client_session.stream(...)` fails before returning a stream
- stream returns an error or closes before `ResponseEvent::Created`
- `build_prompt(...)` was constructed but no model execution event occurs

If a stream fails after `ResponseEvent::Created`, the commit remains. The retry
must rerun shaping against committed state/history.

This commit handler is separate from
`goal_cadence::finalize_request_input(...)`. The handler may call session and
state adapters to record committed carry metadata and consume exact-key pending
intent, but it must not reselect cadence, rebuild the Goal item, or treat
classifier output as authority. Its commit metadata must identify the exact
final `ResponseItem` and full logical request input that reached the
Created-event request.

The Created-event commit handler is the only legal writer for structured
committed request evidence. If a concrete implementation pass defers the typed
carrier, it must leave that deferral explicit while still producing the
`GoalRequestCommit` fields needed below. When the carrier is implemented, the
Created-event handler enriches `GoalRequestCommit` with:

```text
commit_point: ResponseCreated
committed_at_ms
```

and writes the logical equivalent of:

```text
CommittedGoalRequestEvidence {
  schema_version,
  thread_id,
  turn_id,
  attempt_ordinal,
  goal_id,
  kind,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
  request_input_fingerprint,
  item_index,
  inserted_or_verified,
  commit_point: ResponseCreated,
  committed_at_ms,
}
```

Evidence rules:

- do not write evidence before `ResponseEvent::Created`
- do not emit evidence through raw response item notifications
- do not treat ordinary `RolloutItem::ResponseItem`, rollout trace payloads,
  raw response notifications, classifier matches, or rendered Goal text as
  structured evidence
- do not recover Goal facts, cadence kind, pending intent, or Continuation
  suppression by parsing the committed Goal item text
- if evidence is only audit/test metadata, durable pending-intent consumption
  and later durable Continuation watermark state remain the live correctness
  paths
- if evidence is used for resume, rollback/fork, reconstruction, or
  Continuation suppression correctness, `Session::persist_rollout_items(...)`
  is not enough by itself because it currently logs append failures. The
  implementation must use a non-best-effort thread-history write or surface and
  recover from append failure.

Paired-write rule:

- when replay evidence matters, the committed Goal `ResponseItem` and typed
  evidence record must be appended as one logical thread-history batch
- partial append of only the `ResponseItem` or only the evidence record must be
  rejected, retried, or made explicitly unreplayable
- durable correctness mutation happens before evidence append; an evidence
  record must not claim delivery for pending intent that durable state still
  considers pending unless a recovery path is documented and tested

### 5. Record Finalized Cadence Items, Not Pre-Request-Shaping Items

Edit:

- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`

Add a committed carry shape equivalent to:

```rust
pub(crate) struct CommittedGoalRequestCarry {
    pub turn_id: String,
    pub attempt_ordinal: u64,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
    pub request_input_fingerprint: GoalRequestInputFingerprint,
    pub item_index: usize,
}
```

Add methods equivalent to:

```rust
TurnState::record_committed_goal_request_carry(...)
TurnState::committed_goal_request_carry(...)
Session::record_committed_goal_request_carry(...)
Session::committed_goal_request_carry(...)
```

This carry records that one finalized sampling attempt for the current turn
already contained the selected Goal item and that the Created-event commit ran.
It does not store rendered prompt text, `ResponseInputItem`, or a full
`ResponseItem`. It does not create cadence intent, select cadence, or stand in
for structured request evidence. The fingerprint fields let compaction or
repair code identify the committed item/request pair without reconstructing
Goal facts from rendered text.
The same commit path must clear or obsolete the uncommitted turn request
metadata that produced the committed item, so a later same-turn follow-up does
not replay stale synthetic cadence intent.

Work Area 02 should not yet delete all old concrete carry consumers. It should
introduce the replacement carry and switch Created-event Goal commits to use it.
Work Area 05 handles compaction/projection classifier conversion, and Work Area 06
removes the dead old carry once no reachable producer depends on it.

### 6. Convert Core Pending Producers For Durable Intent

Edit:

- `codex-rs/core/src/goals.rs`

This is producer adapter work in the current v136 file, not a new service
home. Do not introduce a parallel core `GoalService`, and do not move final
request-input shaping or commit ownership into `goals.rs`.

After Work Area 01 exists, switch core Goal mutation/accounting paths for these
kinds to cadence-aware state APIs:

- Initial
- ObjectiveUpdated
- BudgetLimit

Required replacements:

- newly active Goal creation or explicit paused-to-active Goal mutation writes
  pending Initial intent in durable state; thread resume hydration does not
  fabricate Initial
- objective update writes pending ObjectiveUpdated intent in durable state
- budget-limit accounting writes pending BudgetLimit intent in durable state
- same-turn recheck or wake unavailability must not drop intent; there should
  be no same-turn concrete Goal item to inject
- `GoalSteeringMessage::into_response_input_item` must not be used for these
  core producer paths after conversion

Allowed to remain for later Work Areas:

- automatic Continuation selection and reservation until Work Area 03
- `ext/goal` pre-request-shaping producer path until Work Area 04, if the
  branch is not being presented as final rewrite behavior before Work Area 04
- legacy artifact classifiers until Work Area 05

Do not leave a converted core Initial, ObjectiveUpdated, or BudgetLimit path
also injecting concrete Goal `ResponseInputItem`s as active steering.

### 7. Render Current Goal Text From Durable State

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- generic internal-context rendering helper module chosen by Work Area 05, if it
  already exists by implementation time

Keep prompt body helpers in `goals.rs` if useful:

- Initial prompt body
- ObjectiveUpdated prompt body
- BudgetLimit prompt body

But final `ResponseItem` construction belongs to `goal_cadence/`.

The active item text must use the current source-tagged internal-context
representation, not `<goal_context>`.

Required logical shape:

```text
ResponseItem::Message {
  role: "developer",
  content: [ContentItem::InputText {
    text: render_internal_context(source = "goal", body = rendered_goal_prompt)
  }],
  ...
}
```

If generic rendering helpers are not ready yet, Work Area 02 may add a narrow
private renderer in `goal_cadence/prompt.rs` with the same wire shape and move it to
shared classifier infrastructure in Work Area 05. It must not use `GoalContext`.

### 8. Final Request Cleanup In This Work Area

Edit:

- `codex-rs/core/src/goal_cadence/`

The Work Area 02 request-input shaper must remove or replace Goal-looking items
from the active request input before inserting selected cadence:

- pure legacy `<goal_context>` items
- wrong-role source-tagged Goal-looking messages
- duplicate current developer-role Goal `ResponseItem`s
- stale source-tagged Goal-looking messages that do not match current durable
  Goal facts, selected kind, or the expected final `ResponseItem` shape
- pre-injected Goal-looking items from old producer/carry paths

This cleanup is local to final request-input shaping. It is not the broad typed
projection/raw/compaction classifier conversion from Work Area 05.

Whole-message purity is required. Mixed ordinary prose that contains marker-like
strings must remain in request input.

## Focused Tests

Add tests in one or both of:

- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/src/session/tests.rs`

Prefer integration-style request payload tests under `core/tests/suite` when
the behavior needs to prove `ResponsesApiRequest.input`. Use
`core/tests/common/responses.rs` helpers:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

Required tests:

- `goal_authority_initial_reaches_final_request_as_single_developer_item`
  - create active Goal through the core path
  - first `/responses` request contains exactly one current Goal
    `ResponseItem` with outer `role: "developer"`
  - no `<goal_context>` item reaches the request
  - pending Initial intent is consumed only after `ResponseEvent::Created`
- `goal_authority_objective_updated_renders_from_persisted_state`
  - update objective
  - captured request uses persisted objective, not request-body archaeology
  - pending ObjectiveUpdated intent is consumed by exact key after Created
- `goal_authority_budget_limit_renders_from_persisted_usage_state`
  - budget crossing writes durable status/usage first
  - captured request renders BudgetLimit from durable facts
  - stale Initial or ObjectiveUpdated intent for the same Goal is cleared after
    committed BudgetLimit
- `goal_authority_retry_before_created_keeps_pending_intent`
  - first stream attempt fails before `ResponseEvent::Created`
  - retry request still contains the selected developer-role Goal item
  - pending intent is not consumed until a later Created event
- `goal_authority_retry_after_created_does_not_duplicate_pending_item`
  - stream emits Created and then fails retryably
  - pending intent is consumed
  - retry rebuilds from committed state/history and does not emit a second
    pending Initial/ObjectiveUpdated/BudgetLimit item
- `goal_authority_follow_up_reruns_request_shaper_from_rebuilt_history`
  - tool call response causes a follow-up sampling request
  - follow-up shaping runs from rebuilt history
  - stale/pre-injected Goal-looking items are not trusted as authority
- `goal_authority_removes_wrong_role_duplicate_and_legacy_goal_items`
  - seed request history with a pure wrong-role source-tagged Goal-looking
    message, a duplicate developer-role Goal `ResponseItem`, and pure legacy
    `<goal_context>`
  - final request input contains only the selected current developer-role item
    when cadence is due
  - mixed ordinary prose containing marker-like text remains
- `goal_authority_active_goal_without_pending_intent_does_not_emit`
  - active durable Goal exists
  - no pending Initial/ObjectiveUpdated/BudgetLimit intent
  - no automatic Continuation request
  - ordinary user turn does not receive a fresh Goal item
- `goal_authority_created_commit_records_committed_carry_metadata`
  - after Created, current-turn carry stores committed metadata
  - carry does not expose or store pre-request-shaping `ResponseInputItem`
- `goal_authority_created_commit_records_structured_request_evidence`
  - evidence is written only after `ResponseEvent::Created`
  - evidence contains the attempt ordinal, item index, item fingerprint, and
    full request-input fingerprint for the finalized logical input
  - evidence is not emitted as a raw response item
- `goal_authority_failed_pre_created_attempt_records_no_evidence`
  - stream setup or stream failure before Created writes no evidence
  - ordinary rollout `ResponseItem`s and rollout trace payloads are not
    accepted as substitute evidence
- `goal_authority_retry_records_evidence_only_for_committed_attempt`
  - a failed pre-Created attempt and a later committed attempt have distinct
    attempt ordinals
  - only the attempt that reaches Created has structured evidence

Update existing local tests that assert:

- active `<goal_context>` emission
- `GoalContextRole` active behavior
- user-role active Goal steering
- current-turn carry of concrete Goal `ResponseInputItem`s

Those tests should have been deleted or reset by Work Area 00. If any remain,
Work Area 02 implementation must remove or rewrite them rather than preserving the
old path.

## Verification

Docs-only validation for this planning Work Area:

```powershell
git diff --check -- local/goal_research local/goal_136_plan
```

Implementation validation for Work Area 02:

```powershell
cd codex-rs
just fmt
```

Focused tests:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority
```

If tests are added to `session/tests.rs` instead of the integration suite:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority
```

Optional focused client/request checks:

```powershell
cd codex-rs
cargo test -p codex-core --test suite retry_before_created
```

Do not run broad workspace suites by default on this workstation.

## Target State

This Work Area's target state is:

- `core/src/goal_cadence/` owns final request-input shaping and commit metadata
- `run_sampling_request(...)` invokes shaping for every attempt inside its
  retry loop before `build_prompt(...)`
- `try_run_sampling_request(...)` commits selected Goal delivery on
  `ResponseEvent::Created`
- final request input contains exactly one selected current developer-role Goal
  `ResponseItem` when pending Initial, ObjectiveUpdated, or BudgetLimit intent
  is due
- active durable Goal state alone emits no Goal steering
- constructing or injecting a `ResponseInputItem` is not a commit path
- pending Initial, ObjectiveUpdated, and BudgetLimit intent is consumed by
  exact key only after Created
- retry before Created leaves pending intent intact
- retry after Created does not duplicate pending intent delivery
- current-turn carry for request-shaped Goal delivery stores committed
  metadata, including attempt ordinal and fingerprints, not
  pre-request-shaping model input
- `GoalRequestCommit` includes the exact item index, item fingerprint, and full
  request-input fingerprint for the finalized logical request
- structured request evidence, when the replay carrier is implemented, is
  written only from the Created-event commit handler and is not replaced by
  ordinary rollout `ResponseItem`s, rollout trace payloads, raw notifications,
  classifier matches, or rendered Goal text
- durable state remains the live correctness owner for pending-intent
  consumption unless an implementation pass explicitly chooses a
  non-best-effort evidence-backed path
- core Initial, ObjectiveUpdated, and BudgetLimit producers no longer depend on
  active `GoalContext` construction or concrete Goal `ResponseInputItem`
  injection
- request payload tests inspect captured `ResponsesApiRequest.input`

## Non-Goals

This Work Area does not:

- implement automatic idle Continuation selection
- define the full `model_visible_history_key` projection for Continuation
  suppression
- advance Continuation watermarking
- convert `ext/goal`
- complete generic classifier/projection/raw-response cleanup
- finish compaction and rollout reconstruction rewrite
- delete every old `GoalContext` helper or legacy artifact predicate
- change upstream Goal product surfaces such as app-server APIs, `/goal`,
  status/footer projection, pause/edit/clear, budget, or usage

## Continuation Constraints

Work Area 02 may be developed after Work Area 01 state support exists.

Work Area 02 may be implemented before Work Areas 03-06 only while the branch
clearly tracks the remaining work and does not present the active Goal path as
final rewrite behavior.

Allowed continuation state:

- `core/src/goal_cadence/` wired for Initial, ObjectiveUpdated, and BudgetLimit
- Created commit for durable pending intent
- committed metadata carry introduced
- Created-event commit metadata includes attempt ordinal, item index, item
  fingerprint, and request-input fingerprint
- old Continuation implementation still awaiting Work Area 03
- `ext/goal` still awaiting Work Area 04
- projection/compaction cleanup still awaiting Work Area 05

Not allowed for this Work Area's target state:

- converted core Initial, ObjectiveUpdated, or BudgetLimit producers still
  injecting active `GoalContext` / `<goal_context>` items
- pending intent consumed before Created
- shaping only the first attempt while retry attempts bypass the request-input
  shaper
- tests that prove helper output but not final request input
- claiming completed active Goal authority rewrite while reachable producers
  still use the old path
