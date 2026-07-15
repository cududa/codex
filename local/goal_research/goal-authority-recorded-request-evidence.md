# Goal Authority Recorded Request Evidence

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative for the recorded-evidence seam.

- Role: structured commit and replay evidence seam for committed Goal request
  input.
- Owns: committed evidence carrier, persistence timing, replay semantics,
  fingerprint inputs, partial-failure policy, rollback/fork/compaction
  treatment, and focused evidence tests.
- Does not own: Goal authority, pending intent mutation, final request-input
  selection, prompt rendering, repair decisions, or idle scheduling.
- Read after: `goal-authority-final-request-input-and-commit.md` and
  `goal-authority-model-visible-history-key.md`.
- Read with: `goal-authority-durable-cadence-state.md` and
  `goal-authority-repair-classifier-integration.md`.
- Current terrain anchors: `codex-rs/protocol/src/protocol.rs`,
  `codex-rs/thread-store/src/live_thread.rs`,
  `codex-rs/thread-store/src/types.rs`,
  `codex-rs/rollout/src/policy.rs`,
  `codex-rs/core/src/session/mod.rs`,
  `codex-rs/core/src/session/rollout_reconstruction.rs`, and
  `codex-rs/core/src/session/turn.rs`.
- Fidelity note: evidence records a committed final request-input decision; it
  is not authority by itself and must not recover Goal facts from rendered
  text.

## Purpose

This document resolves the recorded rollout evidence design pass.

The authority spine already decides that active Goal authority exists only
when the selected current Goal item is present in final model request input as
an outer developer-role `ResponseItem`. This document answers the narrower
question:

```text
When recorded rollout or thread-history evidence is used as replay evidence,
what structured record captures the same logical final request input and
commit point?
```

It does not reopen durable pending intent, cadence selection, repair, model
role, or idle Continuation design.

## Code Terrain

Current v135 terrain:

- `run_sampling_request(...)` in `codex-rs/core/src/session/turn.rs` rebuilds
  prompt input inside its retry/follow-up loop.
- `build_prompt(...)` passes the selected `Vec<ResponseItem>` into
  `Prompt.input`.
- `Prompt::get_formatted_input()` clones `Prompt.input` into the Responses API
  request input.
- `ResponseEvent::Created` is the first local stream event indicating the
  request entered model execution; its current arm is empty.
- `record_conversation_items(...)` appends ordinary `ResponseItem`s to live
  history, persists them as `RolloutItem::ResponseItem`, and emits raw
  response item notifications.
- `RolloutItem` has no Goal request commit metadata.
- `rollout_reconstruction` replays ordinary response items, compaction
  checkpoints, turn context items, and event messages. It does not reconstruct
  a Goal request commit identity.
- rollout trace can record inference request payloads, but it is best-effort
  diagnostics and not normal thread replay state.

Upstream comparison:

- `rust-v0.136.0` and `rust-v0.139.0` have the same relevant request-loop,
  empty `ResponseEvent::Created`, ordinary rollout replay, and lack of Goal
  commit evidence.
- `rust-v0.140.0` still has the retry/follow-up request-loop shape and empty
  `ResponseEvent::Created` arm. It adds
  `RolloutItem::InterAgentCommunication`, a typed replay item that can
  reconstruct a domain-owned model-visible history item without parsing
  rendered text.
- `rust-v0.140.0` also moves more rollout persistence policy responsibility
  toward thread-store implementations. Version plans must account for where
  `persisted_rollout_items(...)` is applied in the target version.

The v140 typed replay item is useful precedent for the carrier shape, not a
Goal evidence solution.

## Core Rule

Recorded request evidence records a committed final request-input decision.

It is not:

- the source of current Goal facts
- the cadence selector
- pending intent storage
- a model-visible Goal item by itself
- a replacement for final request-input inspection
- a way to recover active Goals from rendered text

The evidence record is valid only when created by the same commit path that
runs after `ResponseEvent::Created` for the exact finalized request attempt.

## Correctness Split

Live correctness must not depend solely on best-effort rollout append.

Required split:

- durable Goal state owns current Goal facts, durable facts version, pending
  Initial/ObjectiveUpdated/BudgetLimit intent, exact-key consumption, and the
  durable or reconstructable automatic Continuation suppression watermark
- final request-input shaping owns selection, cleanup, rendering, insertion or
  verification, and commit metadata for the exact attempt
- recorded request evidence owns replayable evidence that a specific finalized
  request attempt reached the commit point

Recommended v135-v140 shape:

- use durable state operations for pending-intent consumption and automatic
  Continuation watermark correctness
- append structured request evidence for audit, final-payload-adjacent tests,
  resume/fork/rollback reconstruction support, and replay evidence that a
  recorded cadence item existed
- do not make evidence append failure silently weaken live duplicate
  suppression or pending-intent semantics

Default posture:

- durable state owns pending-intent consumption
- durable state owns automatic Continuation suppression
- `GoalRequestEvidence` is required only when recorded rollout/thread history
  is used as replay evidence or as a reconstruction source

An implementation may choose a rollout-derived Continuation watermark only if
the structured evidence write is not best-effort and the error policy is as
strong as the durable-state watermark alternative. Otherwise use the durable
watermark table described by
`goal-authority-model-visible-history-key.md` as the correctness owner.

## Carrier Choice

When recorded rollout evidence is used as replay evidence, the carrier should
be a typed replay metadata item:

```text
RolloutItem::GoalRequestEvidence(CommittedGoalRequestEvidence)
```

or an equivalent storage-neutral thread-history item exposed through the same
live thread persistence boundary.

Rationale:

- ordinary `RolloutItem::ResponseItem` records model-visible content but not
  commit identity
- rollout trace records request payloads best-effort and outside normal replay
  history
- a state-only table can own live correctness but cannot by itself record that
  the rollout/thread-history item stream contains the committed request
- v140 demonstrates that typed replay items can participate in persistent
  thread history without being plain rendered text

Unlike v140 `InterAgentCommunication`, Goal request evidence must remain
metadata-only. It must not materialize model input by itself or provide a
`to_model_input_item`-style active steering path.

Version plans may name the concrete enum variant differently, but the logical
carrier must be typed, replayable, and structured.

## Evidence Shape

Logical shape:

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

Field rules:

- `schema_version` must change when fingerprint inputs or replay meaning
  changes.
- `thread_id`, `turn_id`, and `attempt_ordinal` identify the exact sampling
  attempt. The ordinal is allocated immediately before per-attempt
  finalization and is reused by commit.
- `goal_id`, `kind`, and `facts_version` match the finalizer's
  `GoalRequestCommit`.
- `model_visible_history_key` is the key computed for this attempt before the
  selected Goal item is inserted.
- `item_fingerprint` identifies the exact selected developer-role Goal item in
  the finalized input.
- `request_input_fingerprint` identifies the entire finalized logical
  `Vec<ResponseItem>` that becomes `Prompt.input` and
  `ResponsesApiRequest.input`.
- `item_index` is the selected item's index in the finalized logical input.
- `inserted_or_verified` records whether the finalizer inserted the selected
  item or accepted an already-present exact item after cleanup.
- `commit_point` is `ResponseCreated` unless a later code walk proves a more
  precise model-execution point and updates this document.

The evidence record must not include parsed objective text, rendered prompt
body fields, budget facts recovered from text, or legacy marker-derived facts.

## Fingerprints

`item_fingerprint` is computed from the canonical serialized form of the exact
selected Goal `ResponseItem` as it appears in the finalized logical input.

It must include at least:

- outer `ResponseItem` variant
- role
- content
- message phase, if present
- all model-visible fields serialized into request input

`request_input_fingerprint` is computed from the canonical serialized form of
the whole finalized logical `Vec<ResponseItem>`.

It includes:

- the selected Goal item
- every non-Goal item actually sent in the finalized logical input
- repair changes that affected the final input

It excludes:

- stale, duplicate, wrong-role, legacy, or pre-injected Goal-looking items
  removed by final request-input shaping
- helper output that did not reach final input
- raw response item notifications
- typed/materialized projection state
- rollout trace payloads
- transport-only WebSocket deltas when those deltas omit the full logical
  request

The canonicalization must be stable across live commit and replay tests. The
implementation may store a digest string, but tests must be able to construct
the same digest from the captured finalized input.

## Commit Timing

Evidence is appended only after the request reaches the commit point:

```text
ResponseEvent::Created
```

No evidence record is written when:

- finalization succeeds but the request is not submitted
- prompt construction fails
- stream setup fails before `ResponseEvent::Created`
- submission fails before `ResponseEvent::Created`
- an idle hook reserves a turn
- a same-turn recheck request is accepted
- a helper renders Goal text
- a raw response item notification is emitted

If the stream fails after `ResponseEvent::Created`, the evidence remains valid
because the model request entered execution. Pending intent and Continuation
watermark updates follow the same commit-point rule.

## Commit Ordering And Failure Policy

The finalizer returns inert commit metadata. The `ResponseEvent::Created`
commit path executes the side effects.

Recommended commit ordering:

```text
ResponseEvent::Created
  -> verify the finalized request still matches GoalRequestCommit fingerprints
  -> apply durable correctness mutation
       Initial/ObjectiveUpdated/BudgetLimit: consume exact pending intent
       Continuation: advance durable or reconstructable watermark
  -> append committed Goal ResponseItem and RolloutItem::GoalRequestEvidence
     through the thread-history seam as one logical batch when replay evidence
     matters
  -> update current-turn committed carry metadata
```

Durable correctness mutation must happen before evidence append. An evidence
record must not claim delivery for an intent that durable state still considers
pending unless the durable state operation failed after the request was already
created and the implementation has an explicit recovery path.

If evidence append fails:

- live pending-intent and Continuation suppression correctness must continue
  to rely on durable state
- the failure must be observable in logs or diagnostics
- tests that use recorded evidence as replay evidence must use a persistence
  path where the append succeeds
- when replay evidence matters, the paired committed Goal `ResponseItem` and
  `GoalRequestEvidence` append must be one logical thread-history write; a
  partial append must be rejected, retried, or made unreplayable
- if the implementation chooses evidence as a reconstruction source for a
  behavior, append failure must become a surfaced commit failure or a retried
  durable write, not a fire-and-log side effect

`Session::persist_rollout_items(...)` currently logs append errors. That is
acceptable only for audit/test evidence when durable state remains the
correctness fallback. It is not acceptable as the sole correctness path for
resume duplicate suppression.

## Replay Semantics

Replay treats evidence as structured metadata.

Rules:

- ordinary `RolloutItem::ResponseItem` remains the model-visible history item
  carrier
- `GoalRequestEvidence` does not append rendered text to history by itself
- replay may use evidence to reconstruct committed Goal delivery metadata,
  current-turn carry metadata, and latest committed Continuation suppression
  triples
- replay must never parse the paired Goal item's rendered text to recover
  current Goal facts, objective, budget state, cadence kind, or pending intent
- replay must require fingerprint consistency when pairing evidence with a
  surviving model-visible Goal item

Pairing rule:

```text
evidence.item_index and evidence.item_fingerprint
  must match a surviving ResponseItem in the finalized request input or
  recorded model-visible history representation before replay treats the
  evidence as commit evidence for a recorded cadence item
```

If the ordinary Goal item is absent but structured evidence records that a
cadence item was previously committed and lost by the seam, request repair may
reconstruct the recorded item only according to the repair contract. It must
render from current durable Goal facts when repairing current authority, not
from historical rendered text.

## Resume And Continuation Suppression

Resume must load durable Goal facts and pending intent from state. Evidence
must not create an active Goal when durable Goal state is absent.

For automatic Continuation suppression, resume uses this precedence:

1. durable `thread_goal_continuation_watermarks` or equivalent state table
2. structured committed Continuation evidence from surviving replay history,
   only when the implementation explicitly supports rollout-derived
   reconstruction with non-best-effort persistence
3. no reconstructed Continuation watermark

The third case must not resurrect active Goal state from history. If durable
Goal state exists but no watermark can be reconstructed, the implementation
must rely on the durable-state design or treat the absence as a known
best-effort evidence gap. It must not parse rendered Goal text to infer a
watermark.

## Rollback And Fork

Rollback and fork operate on surviving replay history.

Rules:

- evidence in a rolled-back turn segment is ignored for reconstructed
  Continuation suppression and recorded-cadence repair
- evidence whose paired model-visible Goal item was rolled back is ignored
- evidence for a surviving Goal item may be used as commit evidence for the
  prior request, subject to fingerprint matching
- forked threads must not inherit active Goal facts from evidence; they must
  load or create durable Goal state through the normal state path

If rollback removes a committed Continuation evidence record, the next
Continuation decision uses the surviving durable watermark or surviving replay
evidence. It does not scan old rendered Goal text.

## Compaction

`GoalRequestEvidence` is not a `ResponseItem` and is not part of compaction
`replacement_history`.

Rules:

- compaction must not synthesize a new evidence record merely because it
  removed or summarized Goal-looking items
- compaction must not turn durable active Goal state alone into evidence or
  steering
- pure Goal internal-context items and legacy artifacts excluded from the
  eligible progress projection do not change the history key by themselves
- evidence older than a replacement-history checkpoint may be outside the
  replay suffix used to rebuild model-visible history

Therefore, correctness across compaction must use durable state or an explicit
carry-forward evidence checkpoint. The recommended v135-v140 design uses
durable Continuation watermark state for correctness and treats
carry-forward evidence as optional replay/audit enhancement.

If a later implementation claims rollout-only Continuation suppression across
compaction, it must add a structured carry-forward record for the latest
committed Continuation triple. It must not copy rendered Goal text into
replacement history to recover that triple.

## Raw And Typed Projection

Evidence is not a raw response item.

Rules:

- `GoalRequestEvidence` must not be emitted through raw response item
  notifications
- raw response item notifications for actual Goal `ResponseItem`s remain raw
  according to the repair/classifier contract
- typed/materialized user-visible projections may hide pure current Goal
  internal-context items and legacy artifacts, but projection hiding does not
  establish evidence or authority
- thread-history or rollout debug surfaces that expose raw `RolloutItem`s may
  expose the typed evidence variant as replay metadata, not as user-visible
  conversation prose

## Version Plan Notes

For v135, `rust-v0.136.0`, and `rust-v0.139.0`:

- add the typed evidence variant to `RolloutItem`
- update rollout persistence policy to persist the new variant
- update live thread append/replay tests where canonical filtering happens
- update rollout reconstruction to collect evidence metadata without
  appending it as a `ResponseItem`

For `rust-v0.140.0` and later:

- account for store-side application of `persisted_rollout_items(...)`
- use `RolloutItem::InterAgentCommunication` as precedent only for typed
  replay storage, while keeping Goal evidence metadata-only because it records
  commit identity
- update reconstruction alongside the existing typed replay handling

No version plan may rely on rollout trace as the durable Goal evidence carrier
unless a later authority update changes the trace persistence contract.

## Tests

Focused replacement tests should cover:

- final captured request input contains the selected developer-role Goal item
  and the evidence fingerprint matches that exact item
- evidence is appended only after `ResponseEvent::Created`
- stream setup failure before `ResponseEvent::Created` writes no evidence and
  consumes no pending intent
- retry before `ResponseEvent::Created` leaves no stale evidence for the failed
  attempt and records evidence only for the committed attempt
- stream failure after `ResponseEvent::Created` keeps the committed evidence
  and durable commit effects
- ordinary `RolloutItem::ResponseItem` alone is not accepted as structured
  Goal commit evidence
- rollout trace request payloads are not accepted as durable Goal evidence
- replay pairs evidence with the surviving Goal item by fingerprint, not by
  parsing rendered text
- rollback/fork ignore evidence whose paired Goal item is not in surviving
  history
- compaction does not turn Goal cleanup into a new evidence record
- resume reconstructs automatic Continuation suppression from durable
  watermark state or explicitly supported structured evidence, never from
  rendered Goal text
- raw response item notifications remain raw for actual Goal `ResponseItem`s
  and do not emit evidence as a raw response item
