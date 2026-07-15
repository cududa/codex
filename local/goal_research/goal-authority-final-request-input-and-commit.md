# Goal Authority Final Request Input And Commit

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative.

- Role: central final model-input seam for active Goal authority.
- Owns: per-attempt request-input shaping, selected Goal item insertion or
  verification, stale/wrong-role/duplicate cleanup, commit metadata, commit
  point, retry/follow-up behavior, current-turn carry replacement, and the
  remaining `goals.rs` adapter scope.
- Does not own: durable mutation semantics, idle scheduling, extension
  lifecycle, or test prep deletion policy.
- Read after: `goal-authority-primary-cadence-contract.md` and
  `goal-authority-durable-cadence-state.md`.
- Read with: `goal-authority-model-visible-history-key.md` and
  `goal-authority-repair-classifier-integration.md`.
- Current terrain anchors: `codex-rs/core/src/session/turn.rs`,
  `codex-rs/core/src/client_common.rs`, `codex-rs/core/src/client.rs`,
  `codex-rs/codex-api/src/common.rs`, `codex-rs/core/src/goals.rs`, and
  `codex-rs/core/src/state/turn.rs`.
- Fidelity note: helper output, active-turn injection, reservation, and
  pre-finalizer carry are not commits.

## Purpose

This document defines the central implementation seam for active Goal
authority.

It consolidates the previous cadence-module, finalizer/commit, and
`goals.rs` adapter design notes. The replacement architecture is not a new
context helper layer. The replacement is per-attempt ownership of the actual
model request input.

## Code Terrain

The actual model request path is:

```text
codex-rs/core/src/session/turn.rs
  run_sampling_request(...)
  -> build_prompt(input, ...)

codex-rs/core/src/client_common.rs
  Prompt { input: Vec<ResponseItem> }

codex-rs/core/src/client.rs
  build_responses_request(...)
  -> let input = prompt.get_formatted_input()

codex-rs/codex-api/src/common.rs
  ResponsesApiRequest { input: Vec<ResponseItem> }
```

`ResponseItem::Message.role` is the model role. There is no deeper authority
layer after `Prompt.input`.

Important current terrain:

- `run_sampling_request(...)` receives an initial `Vec<ResponseItem>`, but
  later retry attempts rebuild prompt input from
  `sess.clone_history().await.for_prompt(...)`
- `build_prompt(...)` is the last local construction point before the model
  client receives request input
- `ResponseEvent::Created` currently has no Goal commit behavior
- current Goal steering builds concrete `ResponseInputItem`s through
  `GoalContext::into_response_input_item(...)`
- current same-turn injection and carry store concrete Goal
  `ResponseInputItem`s before final request shaping

The final request-input shaping point must run for every request attempt after
that attempt's base `Vec<ResponseItem>` is known and before `build_prompt(...)`
hands it to the model client.

## Core Rule

Active Goal authority is established only when the final request input contains
exactly one selected current Goal item:

```text
ResponseItem::Message {
  role: "developer",
  content: [ContentItem::InputText { text: current rendered Goal context }],
  ...
}
```

Rendering text, constructing a helper output, injecting a `ResponseInputItem`,
reserving a turn, or carrying current-turn metadata is not authority and is not
a commit.

## Final Request-Input Shaping

The shaping function owns Goal authority for a request attempt.

Logical signature:

```text
finalize_goal_request_input(
  attempt_context,
  base_input: Vec<ResponseItem>,
) -> FinalizedGoalRequestInput
```

`attempt_context` must include the logical equivalents of:

- thread id and turn id
- current durable Goal snapshot, including facts version
- pending Initial, ObjectiveUpdated, and BudgetLimit intent snapshot
- optional runtime Continuation request selected by the idle predicate
- collaboration/feature eligibility facts
- model-visible history key for this attempt
- transport context needed to account for full request versus WebSocket delta
- repair context for compaction, resume, rollback, reconstruction, retry, or
  previous-response/model-context transitions

`FinalizedGoalRequestInput` must include:

```text
input: Vec<ResponseItem>
commit: Option<GoalRequestCommit>
repair_report: GoalRepairReport
```

## Shaping Responsibilities

For every attempt, the shaping function must:

1. inspect the actual `Vec<ResponseItem>` that would otherwise become
   `Prompt.input`
2. classify pure current Goal internal-context items and pure legacy
   `<goal_context>` artifacts
3. remove, ignore, or replace stale, wrong-role, duplicate, legacy, or
   pre-injected Goal-looking items according to the authority contracts
4. select at most one Goal cadence item for this request
5. render selected Goal text from current durable Goal facts
6. insert or verify exactly one outer developer-role Goal `ResponseItem` when
   cadence-required authority is due
7. return commit metadata tied to that exact item

It must not insert Goal steering merely because an active durable Goal exists.

## Selection Order

When more than one item is due for the same request opportunity, selection
order is:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

Continuation never supersedes persisted pending intent.

## Commit Metadata

`GoalRequestCommit` must be inert until the request enters model execution.

Logical fields:

```text
GoalRequestCommit {
  thread_id,
  turn_id,
  goal_id,
  kind: Initial | ObjectiveUpdated | BudgetLimit | Continuation,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
  inserted_or_verified,
}
```

`item_fingerprint` must identify the exact developer-role Goal item in the
final request input. It may be a structured fingerprint rather than a persisted
copy of the whole item, but it must be enough for tests and commit logic to
prove the commit refers to the item actually sent.

## Recorded Request Evidence

Detailed recorded-evidence ownership lives in
`goal-authority-recorded-request-evidence.md`. This section records the final
request-input seam's obligation to produce the metadata used by that carrier.

Current rollout terrain does not already provide structured Goal request
evidence.

In v135, `rust-v0.136.0`, and `rust-v0.139.0`, normal thread replay history
persists `RolloutItem::ResponseItem(ResponseItem)`,
`RolloutItem::Compacted`, `RolloutItem::TurnContext`, and
`RolloutItem::EventMsg`. `rust-v0.140.0` adds typed replay precedent through
`RolloutItem::InterAgentCommunication`, but it still does not provide Goal
request commit identity. `record_conversation_items(...)` appends ordinary
response items to in-memory history, persists those response items to rollout,
and emits raw response item events. Rollout reconstruction replays ordinary
items, typed replay items where supported, and compaction checkpoints. It does
not record the full submitted `Prompt.input`, and it does not record
structured Goal commit metadata.

Rollout trace can record an upstream inference request, but that path is
best-effort diagnostic tracing, not normal session replay state. It may support
debugging or tests, but it must not become the durable Goal cadence evidence
or Continuation suppression carrier unless a later authority update explicitly
changes that persistence contract.

If an implementation or test plan uses recorded rollout evidence as replay
evidence, the evidence must be a structured committed Goal request record, not
an ordinary rollout `ResponseItem` by itself. The carrier is a replayable typed
thread-history metadata item, logically:

```text
RolloutItem::GoalRequestEvidence(CommittedGoalRequestEvidence)
```

or an equivalent storage-neutral thread-store item appended through the live
thread persistence seam.

Logical evidence shape:

```text
CommittedGoalRequestEvidence {
  schema_version,
  thread_id,
  turn_id,
  attempt_ordinal,
  goal_id,
  kind: Initial | ObjectiveUpdated | BudgetLimit | Continuation,
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

The ordinary Goal `ResponseItem` may still be recorded as model-visible
history when a cadence item is committed. That item records the model-visible
content. The structured evidence record ties the committed cadence decision to
the exact final request input and commit point. Neither record may be used to
recover current Goal facts by parsing rendered text.

The evidence record must be appended only from the same commit path that runs
after `ResponseEvent::Created`. It must not be written when shaping succeeds
but the request is not submitted, when stream setup fails, or when submission
fails before the commit point.

Default posture: pending intent consumption and automatic Continuation
suppression use durable state as the correctness owner.
`GoalRequestEvidence` is required only when recorded rollout/thread history is
used as replay evidence or as a reconstruction source.

Live correctness must not depend solely on best-effort rollout append. If
replay evidence matters, the committed Goal `ResponseItem` and
`GoalRequestEvidence` must be appended through the thread-history seam as one
logical batch, and append failure cannot be fire-and-log. A version plan may
choose non-best-effort rollout-derived evidence for correctness only with an
error policy as strong as the durable-state alternative.

## Commit Point

Commit happens only after the request is known to have entered model execution.

Expected commit point:

```text
ResponseEvent::Created
```

If code inspection later proves a more precise local point, the implementation
plan must name it. Until then, use `ResponseEvent::Created`.

Commit behavior:

- Initial, ObjectiveUpdated, and BudgetLimit commit consumes matching pending
  intent by exact key
- BudgetLimit commit may clear superseded Initial or ObjectiveUpdated intent
  for the same Goal
- Continuation commit advances runtime Continuation suppression for
  `{ goal_id, model_visible_history_key, facts_version }`
- committed carry may record that this turn already delivered a specific Goal
  item, but must not store pre-finalizer concrete `ResponseInputItem`s as
  authority

No commit occurs when:

- rendering succeeds but the item is not in final request input
- shaping returns an error before `build_prompt(...)`
- `build_prompt(...)` constructs a `Prompt` but the request is not submitted
- stream setup fails before model execution begins
- a helper output exists but the final request input did not contain the
  selected developer-role Goal item

## Retry And Follow-Up

The shaping function must run for every model request attempt.

This matters because `run_sampling_request(...)` may rebuild prompt input from
history inside its retry loop after the first attempt. The implementation must
not shape only the first pre-loop snapshot.

Rules:

- retry before commit leaves pending intent and Continuation watermark
  unchanged
- retry after commit reruns shaping against committed state/history
- same-turn follow-up after tool output or mailbox input reruns shaping
- uncommitted runtime cadence request metadata may survive retries before
  `ResponseEvent::Created`, but the Created-event commit must clear or make
  that metadata obsolete when it records committed carry for the selected Goal
  item
- same-turn follow-up attempts after Created must assemble fresh context from
  durable Goal state, pending intent or Continuation watermark state, optional
  new turn request metadata, and committed carry; they must not reuse stale
  pre-commit request metadata as if the original cadence request were still
  pending
- WebSocket incremental transport may send a delta, but shaping still attaches
  to the full logical request input used to derive that delta

## Current-Turn Carry

Current carry may preserve evidence that a finalized request already contained
a Goal item.

It must not carry prebuilt active Goal `ResponseInputItem`s as authority.

Uncommitted turn-local cadence request metadata, such as a same-turn recheck
request or a Goal-owned synthetic turn request, is not current-turn carry. It
is input to request shaping until the request commits or aborts. After a
Created-event commit, committed carry is the same-turn record of delivered Goal
authority and the source request metadata must no longer drive follow-up
shaping.

Replacement carry should be the logical equivalent of:

```text
CommittedGoalRequestCarry {
  turn_id,
  goal_id,
  kind,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
}
```

This carry can support mid-turn compaction repair. It cannot create new cadence
intent and cannot prove authority for a different request attempt.

## `goals.rs` Adapter

`codex-rs/core/src/goals.rs` should remain an adapter for Goal lifecycle and
tool/app-server-facing behavior.

It may own:

- tool command handling
- protocol/state conversion
- validation
- external Goal mutation entry points
- usage accounting entry points
- prompt body rendering helpers, if kept small

It must not own:

- per-attempt final request-input shaping
- repair decisions
- commit metadata construction
- pending-intent selection for a request attempt
- Continuation watermark policy
- pre-finalizer concrete Goal item injection as authority

## Tests

Focused tests must inspect captured final request input, not helper output.

Required coverage:

- Initial final request input contains exactly one current developer-role Goal
  item
- ObjectiveUpdated renders from persisted updated durable state
- BudgetLimit renders from persisted usage/status state
- Continuation appears only when selected by idle predicate
- stale, duplicate, wrong-role, legacy, and pre-injected Goal-looking items are
  removed, ignored, or replaced
- no active `<goal_context>` item reaches final request input
- no user-role Goal steering item reaches final request input
- pending intent is consumed only after the commit point
- retry before commit does not consume pending intent
- follow-up request reruns shaping from rebuilt prompt input
- `ResponseEvent::Created` commit updates pending intent or Continuation
  suppression as appropriate
- current-turn carry records committed metadata, not pre-finalizer model input
