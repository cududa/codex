# Batch 02: Final Request-Input Shaping And Commit

This batch adds the core authority seam for active Goal steering:

- per-attempt shaping of the actual `Vec<ResponseItem>` before `Prompt.input`
- selection of durable pending Initial, ObjectiveUpdated, and BudgetLimit
  intent
- insertion of exactly one selected current developer-role Goal item when due
- commit metadata tied to that exact final request item
- commit on `ResponseEvent::Created`

It does not implement automatic idle Continuation policy. It does not convert
`ext/goal`. It does not finish broad classifier/projection cleanup.
Batch 03 consumes this seam for the real `model_visible_history_key`,
automatic Continuation selection, and Continuation watermark commit behavior.

## Slice Index

Implement Batch 02 through these slices rather than as one large request-loop
change:

- `02a-goal-cadence-module-types.md`
  - introduce `goal_cadence.rs`, core types, item fingerprinting, repair
    report shape, selected-item metadata, and a private renderer if shared
    internal-context helpers do not exist yet
- `02b-per-attempt-finalizer-wiring.md`
  - wire a no-op or cleanup-only finalizer into every
    `run_sampling_request(...)` attempt after base input is known and before
    `build_prompt(...)`
- `02c-pending-intent-selection-and-insertion.md`
  - select durable pending Initial / ObjectiveUpdated / BudgetLimit intent and
    insert exactly one current developer-role Goal item in final request input
- `02d-created-commit-and-carry.md`
  - commit on `ResponseEvent::Created`, consume pending intent by exact key,
    and record committed current-turn carry metadata
- `02e-core-producer-conversion.md`
  - convert core Initial / ObjectiveUpdated / BudgetLimit producers away from
    pre-finalizer concrete Goal injection and toward durable cadence intent
    plus typed wake/recheck metadata
- `02f-request-payload-and-retry-tests.md`
  - add request-payload, cleanup, commit, and retry-before/after-Created
    acceptance tests that inspect final `/responses` input

The parent Batch 02 file remains the overview contract. The slice docs are
ordered work packets for the same rewrite branch. They exist so agents can
continue the request/commit rewrite across compactions without reopening the
architecture. They should state their handoff state and downstream owner for
intentionally incomplete work, not imply independent mergeability.

Testing posture:

- each slice should include focused validation for behavior it actually
  introduces
- unit tests are enough for pure types, selection, commit primitives, and
  producer state effects when they prove the slice contract
- compile-only validation is acceptable only for an intentionally no-op or
  type-only slice with no executable behavior to assert
- `02f` is the representative full-flow acceptance layer for final
  `/responses` payloads and retry behavior; it does not replace slice-local
  tests for 02a-02e

## Direction Lock

Request:

- translate the final request-input authority contract into an execution-ready
  batch
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
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`

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
- leave old concrete Goal carry as proof that the final request contained
  current Goal authority

Locked direction:

- add a dedicated core finalizer module, proposed as
  `codex-rs/core/src/goal_cadence.rs`
- run final request-input shaping inside `run_sampling_request(...)` for every
  attempt, after that attempt's base prompt input is known and before
  `build_prompt(...)`
- make `ResponseEvent::Created` the commit point for the selected request item
- use Batch 01 durable pending intent APIs for Initial, ObjectiveUpdated, and
  BudgetLimit
- keep `goals.rs` as lifecycle/tool/app-server adapter and prompt-body helper,
  not final request-input authority owner
- replace current-turn concrete Goal carry with committed metadata for the
  finalized item

Exclusions:

- no automatic Continuation selection, reservation, or watermark policy; Batch
  03 owns that
- no `ext/goal` producer conversion; Batch 04 owns that
- no broad projection/raw/compaction classifier replacement; Batch 05 owns that
- no final deletion of all `GoalContext` terrain; Batch 06 owns final cleanup
- no user-role active Goal steering compatibility

## Bounded Code Terrain Read

Files read for this batch:

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
- `codex-rs/core/tests/common/responses.rs`
- request-capture examples in `codex-rs/core/tests/suite/client.rs`

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
- the replacement carry must be committed metadata, not a pre-finalizer
  model-input item

## Ownership Split For This Batch

This batch introduces the active Goal authority seam but does not move the
whole Goal runtime into core. Use this file split while implementing:

- `codex-rs/core/src/goal_cadence.rs` is the finalizer module for this batch.
  It owns cleanup of active Goal artifacts, pending-intent selection,
  developer-role `ResponseItem` construction, and commit metadata for the
  exact final request item.
- `codex-rs/core/src/session/turn.rs` is only the sampling placement owner. It
  passes the actual per-attempt base input into the finalizer before
  `build_prompt(...)` and passes commit metadata to the Created-event commit
  point.
- Batch 01 APIs in `codex-rs/state/src/runtime/goals.rs` own durable facts,
  pending intent snapshots, and exact-key intent consumption. They do not
  choose the model role or render Goal prompt text.
- `codex-rs/core/src/goals.rs` is edited only to convert existing core
  Initial, ObjectiveUpdated, and BudgetLimit producers into durable intent
  producers and, if useful, to provide prompt-body helpers. It is not the
  long-lived cadence service, finalizer, scheduler, or active model-input
  owner.
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs` may introduce committed carry metadata for
  finalized Goal delivery. They must not keep `ResponseInputItem` carry as
  proof of authority.

## Required Edits

### 1. Add Core Goal Cadence Module

Edit:

- `codex-rs/core/src/lib.rs`

Add:

- `mod goal_cadence;`

Add:

- `codex-rs/core/src/goal_cadence.rs`

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

pub(crate) struct GoalRequestCommit {
    pub thread_id: ThreadId,
    pub turn_id: String,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
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
```

The exact field representation may change, but the semantics may not:

- commit metadata refers to the exact `ResponseItem` in final request input
- pending intent is not consumed when the struct is created
- `item` is a finalized `ResponseItem`, not a pre-finalizer
  `ResponseInputItem`
- `model_visible_history_key` may be `None` only for non-Continuation commits
  before Batch 03; Continuation commits must require a real key
- repair report is diagnostic/test support, not a cadence decision source

### 2. Add Final Request-Input Shaping Function

Edit:

- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/session/turn.rs`

Add a function equivalent to:

```rust
pub(crate) async fn finalize_goal_request_input(
    sess: &Session,
    turn_context: &TurnContext,
    base_input: Vec<ResponseItem>,
    runtime_request: GoalRuntimeRequest,
) -> CodexResult<FinalizedGoalRequestInput>;
```

`GoalRuntimeRequest` must include:

- thread id
- turn id
- current durable Goal cadence snapshot from Batch 01
- optional automatic Continuation request, initially `None` in Batch 02
- optional model-visible history key for this attempt
- Goals feature and collaboration-mode eligibility facts for this attempt
- request/transport facts needed for diagnostics and repair
- request-local repair context, if the finalizer needs to distinguish cleanup
  from cadence delivery

The finalizer must treat feature-disabled or collaboration-ineligible attempts
as selecting no active Goal item and consuming no pending intent. These typed
eligibility facts are gates on delivery; they are not cadence authority by
themselves.

Batch 02 must not invent a fake history key. If the full key projection is not
implemented until Batch 03, non-Continuation commits may carry
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
  when the Batch 03 key implementation already exists; otherwise keep None
  for non-Continuation commits
read/select pending durable intent in order:
  BudgetLimit
  ObjectiveUpdated
  Initial
  Continuation (not active until Batch 03)
render selected Goal text from durable state
insert exactly one developer-role Goal ResponseItem when selected
return FinalizedGoalRequestInput { input, commit, repair_report }
```

Selection rules:

- pending BudgetLimit supersedes ObjectiveUpdated and Initial for the same
  request opportunity
- pending ObjectiveUpdated supersedes Initial
- pending Initial is selected only when no higher-priority pending intent is
  due
- Continuation is not selected in Batch 02
- active durable Goal state alone selects nothing
- historical rendered Goal items select nothing

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
let base_prompt_input = if let Some(input) = initial_input.take() {
    input
} else {
    sess.clone_history()
        .await
        .for_prompt(&turn_context.model_info.input_modalities)
};

let finalized_goal_input = goal_cadence::finalize_goal_request_input(
    sess.as_ref(),
    turn_context.as_ref(),
    base_prompt_input,
    runtime_request,
).await?;

let prompt = build_prompt(
    finalized_goal_input.input,
    router.as_ref(),
    turn_context.as_ref(),
    base_instructions.clone(),
);
```

Then pass `finalized_goal_input.commit` into `try_run_sampling_request(...)`.

Do not shape `sampling_request_input` only in `run_turn(...)`; that would miss
retry attempts that rebuild prompt input from history.

Do not move the seam into `client.rs`; that is after `Prompt` construction and
would make Goal authority a client serialization side effect.

### 4. Commit On `ResponseEvent::Created`

Edit:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence.rs`
- `codex-rs/core/src/goals.rs`
- Batch 01 state APIs in `codex-rs/state/src/runtime/goals.rs`

Change `try_run_sampling_request(...)` to accept:

```rust
goal_request_commit: Option<GoalRequestCommit>
```

On `ResponseEvent::Created`:

```rust
if let Some(commit) = goal_request_commit.take() {
    goal_cadence::commit_goal_request(sess.as_ref(), turn_context.as_ref(), commit).await?;
}
```

Commit behavior:

- record the finalized developer-role Goal `ResponseItem` as a model-visible
  cadence item when it was newly inserted for cadence delivery
- consume pending Initial, ObjectiveUpdated, or BudgetLimit intent with
  `consume_pending_intent_exact(...)`
- clear superseded Initial or ObjectiveUpdated intent after committed
  BudgetLimit when required
- store committed current-turn carry metadata for this turn
- do not advance Continuation watermark in Batch 02

No commit occurs when:

- finalizer returns no selected item
- `client_session.stream(...)` fails before returning a stream
- stream returns an error or closes before `ResponseEvent::Created`
- `build_prompt(...)` was constructed but no model execution event occurs

If a stream fails after `ResponseEvent::Created`, the commit remains. The retry
must rerun shaping against committed state/history.

### 5. Record Finalized Cadence Items, Not Pre-Finalizer Items

Edit:

- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`

Add a committed carry shape equivalent to:

```rust
pub(crate) struct CommittedGoalRequestCarry {
    pub turn_id: String,
    pub goal_id: String,
    pub kind: GoalCadenceKind,
    pub facts_version: i64,
    pub model_visible_history_key: Option<ModelVisibleHistoryKey>,
    pub item_fingerprint: GoalItemFingerprint,
}
```

Add methods equivalent to:

```rust
TurnState::record_committed_goal_request_carry(...)
TurnState::committed_goal_request_carry(...)
Session::record_committed_goal_request_carry(...)
Session::committed_goal_request_carry(...)
```

This carry records that the final request input already contained the selected
Goal item for the current turn. It does not store `ResponseInputItem`. It does
not create cadence intent.

Batch 02 should not yet delete all old concrete carry consumers. It should
introduce the replacement carry and switch finalizer-owned commits to use it.
Batch 05 handles compaction/projection classifier conversion, and Batch 06
removes the dead old carry once no reachable producer depends on it.

### 6. Convert Core Pending Producers For Durable Intent

Edit:

- `codex-rs/core/src/goals.rs`

This is producer adapter work in the current v136 file, not a new service
home. Do not introduce a parallel core `GoalService`, and do not move final
request-input shaping or commit ownership into `goals.rs`.

After Batch 01 exists, switch core Goal mutation/accounting paths for these
kinds to cadence-aware state APIs:

- Initial
- ObjectiveUpdated
- BudgetLimit

Required replacements:

- newly active Goal creation/resume of paused Goal writes pending Initial
  intent in durable state
- objective update writes pending ObjectiveUpdated intent in durable state
- budget-limit accounting writes pending BudgetLimit intent in durable state
- same-turn injection failure must not drop intent because there is no
  same-turn concrete item to inject
- `GoalSteeringMessage::into_response_input_item` must not be used for these
  core producer paths after conversion

Allowed to remain for later batches:

- automatic Continuation selection and reservation until Batch 03
- `ext/goal` pre-finalizer producer path until Batch 04, if the branch is not
  accepted as a completed rewrite before Batch 04
- legacy artifact classifiers until Batch 05

Do not leave a converted core Initial, ObjectiveUpdated, or BudgetLimit path
also injecting concrete Goal `ResponseInputItem`s as active steering.

### 7. Render Current Goal Text From Durable State

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence.rs`
- generic internal-context rendering helper module chosen by Batch 05, if it
  already exists by implementation time

Keep prompt body helpers in `goals.rs` if useful:

- Initial prompt body
- ObjectiveUpdated prompt body
- BudgetLimit prompt body

But final `ResponseItem` construction belongs to `goal_cadence.rs`.

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

If generic rendering helpers are not ready yet, Batch 02 may add a narrow
private renderer in `goal_cadence.rs` with the same wire shape and move it to
shared classifier infrastructure in Batch 05. It must not use `GoalContext`.

### 8. Final Request Cleanup In This Batch

Edit:

- `codex-rs/core/src/goal_cadence.rs`

Batch 02 finalizer must remove or replace Goal-looking items from the active
request input before inserting selected cadence:

- pure legacy `<goal_context>` items
- user-role current Goal internal-context items
- duplicate current Goal internal-context items
- stale current Goal internal-context items that do not match current durable
  Goal facts or selected kind
- pre-injected Goal-looking items from old producer/carry paths

This cleanup is local to final request-input shaping. It is not the broad typed
projection/raw/compaction classifier conversion from Batch 05.

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
  - first `/responses` request contains exactly one developer-role current Goal
    internal-context item
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
- `goal_authority_follow_up_reruns_finalizer_from_rebuilt_history`
  - tool call response causes a follow-up sampling request
  - follow-up shaping runs from rebuilt history
  - stale/pre-injected Goal-looking items are not trusted as authority
- `goal_authority_removes_wrong_role_duplicate_and_legacy_goal_items`
  - seed request history with pure user-role current Goal item, duplicate
    developer Goal item, and pure legacy `<goal_context>`
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
  - carry does not expose or store pre-finalizer `ResponseInputItem`

Update existing local tests that assert:

- active `<goal_context>` emission
- `GoalContextRole` active behavior
- user-role active Goal steering
- current-turn carry of concrete Goal `ResponseInputItem`s

Those tests should have been deleted or reset by Batch 00. If any remain,
Batch 02 implementation must remove or rewrite them rather than preserving the
old path.

## Verification

Docs-only validation for this planning batch:

```powershell
git diff --check -- local/goal_136_plan
```

Implementation validation for Batch 02:

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

## Acceptance Criteria

Batch 02 is complete when:

- `goal_cadence.rs` owns final request-input shaping and commit metadata
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
- current-turn carry for finalizer-owned Goal delivery stores committed
  metadata, not pre-finalizer model input
- core Initial, ObjectiveUpdated, and BudgetLimit producers no longer depend on
  active `GoalContext` construction or concrete Goal `ResponseInputItem`
  injection
- request payload tests inspect captured `ResponsesApiRequest.input`

## Non-Goals

This batch does not:

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

Batch 02 may be developed after Batch 01 state support exists.

Batch 02 may be completed before Batches 03-06 only if the branch clearly
tracks the remaining work and does not present the active Goal path as fully
accepted.

Allowed continuation state:

- finalizer module wired for Initial, ObjectiveUpdated, and BudgetLimit
- Created commit for durable pending intent
- committed metadata carry introduced
- old Continuation implementation still awaiting Batch 03
- `ext/goal` still awaiting Batch 04
- projection/compaction cleanup still awaiting Batch 05

Not allowed in a completed Batch 02 implementation:

- converted core Initial, ObjectiveUpdated, or BudgetLimit producers still
  injecting active `GoalContext` / `<goal_context>` items
- pending intent consumed before Created
- shaping only the first attempt while retry attempts bypass the finalizer
- tests that prove helper output but not final request input
- claiming completed active Goal authority rewrite while reachable producers
  still use the old path
