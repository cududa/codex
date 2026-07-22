# Work Area 02d: Created-Event Commit And Evidence

This ordered pass makes `ResponseEvent::Created` the commit point for selected
Goal delivery. It consumes exact-key pending intent, records committed
current-turn carry metadata, and defines the typed evidence boundary without
making evidence the live correctness owner unless the implementation
deliberately chooses and tests a non-best-effort path.

## Direction Lock

Request:

- execute Goal request commit side effects only after `ResponseEvent::Created`
- consume pending Initial, ObjectiveUpdated, and BudgetLimit intent by exact key
- record metadata-only current-turn carry for committed Goal delivery
- write or explicitly defer structured request evidence with the correct
  metadata boundary

Authority:

- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02c-per-attempt-request-loop-wiring.md`

Terrain:

- `try_run_sampling_request(...)` in `core/src/session/turn.rs` has an existing
  `ResponseEvent::Created` arm.
- `Session::record_conversation_items(...)` appends ordinary `ResponseItem`s
  and emits raw response item events.
- `Session::persist_rollout_items(...)` currently logs append failures.
- local `TurnState.current_turn_goal_steering_items` carries concrete
  `ResponseInputItem`s and needs a committed metadata replacement.
- current rollout history has no typed Goal request evidence carrier.

Code-shape temptation:

- commit when the stream is created rather than when `ResponseEvent::Created`
  arrives
- consume intent when prompt text is rendered
- reselect cadence inside the commit handler
- treat ordinary rollout items, raw notifications, classifier matches, or
  rendered text as structured evidence

Locked direction:

- `GoalRequestCommit` is inert until the Created-event arm consumes it
- commit verifies exact finalized request identity, then performs side effects
- durable state remains the live correctness owner unless a non-best-effort
  evidence-backed path is explicitly implemented and tested

Exclusions:

- no Continuation watermark advance
- no cadence reselection
- no request rebuilding
- no evidence through raw response item notifications
- no parsing committed Goal text to recover facts or cadence

## Code Terrain Read

Directly read:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/thread-store/src/live_thread.rs`
- `codex-rs/rollout/src/policy.rs`
- Work Area 01 state exact-key consume APIs

Observed facts:

- `ResponseEvent::Created` is the first local stream event suitable for
  committing pending intent delivery.
- ordinary rollout `ResponseItem` content is not structured Goal commit
  evidence.
- fire-and-log persistence is not enough for evidence-backed correctness.
- committed carry must be metadata for a Created-event request, not a
  pre-request-shaping `ResponseInputItem`.

## Pass Goal

Commit selected Goal delivery exactly once when the stream reaches
`ResponseEvent::Created`.

## Exact Files To Edit

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/goals.rs` only for narrow adapters if needed
- `codex-rs/protocol/src/protocol.rs`, `codex-rs/thread-store`, and
  `codex-rs/rollout` only if this pass implements typed replay evidence

## Required Edits

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

- verify the selected item is still at `item_index`
- verify the selected item matches `item_fingerprint`
- verify the logical finalized input matches `request_input_fingerprint`
- record the finalized developer-role Goal `ResponseItem` as model-visible
  cadence item when delivery committed, whether placement was `Inserted` or
  `VerifiedExisting`
- consume pending Initial, ObjectiveUpdated, or BudgetLimit intent with
  `consume_pending_intent_exact(...)`
- clear superseded Initial or ObjectiveUpdated intent after committed
  BudgetLimit when required
- store committed current-turn carry metadata for this turn
- do not advance Continuation watermark in Work Area 02

Add committed carry shape equivalent to:

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

Carry rules:

- carry means one finalized sampling attempt for the current turn contained the
  selected Goal item and the Created-event commit ran
- carry does not store rendered prompt text, `ResponseInputItem`, or full
  `ResponseItem`
- carry does not create cadence intent, select cadence, or stand in for
  structured request evidence
- the commit path clears or obsoletes uncommitted turn request metadata that
  produced the committed item
- same-turn follow-up shaping must not replay stale synthetic cadence intent

No commit occurs when:

- the shaper returns no selected item
- `client_session.stream(...)` fails before returning a stream
- the stream returns an error or closes before `ResponseEvent::Created`
- `build_prompt(...)` was constructed but no model execution event occurs

If a stream fails after `ResponseEvent::Created`, the commit remains. The retry
must rerun shaping against committed state and history.

Evidence rules:

- the Created-event commit handler is the only legal writer for structured
  committed request evidence
- do not write evidence before `ResponseEvent::Created`
- do not emit evidence through raw response item notifications
- do not treat ordinary `RolloutItem::ResponseItem`, rollout trace payloads,
  raw notifications, classifier matches, or rendered Goal text as evidence
- do not recover Goal facts, cadence kind, pending intent, or Continuation
  suppression by parsing committed Goal item text
- if evidence is only audit/test metadata, durable pending-intent consumption
  and later durable Continuation watermark state remain live correctness paths
- if evidence is used for resume, rollback/fork, reconstruction, or
  Continuation suppression correctness, use a non-best-effort thread-history
  write or surface and recover from append failure

When implemented, the handler enriches `GoalRequestCommit` with:

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

Paired-write rule:

- when replay evidence matters, the committed Goal `ResponseItem` and typed
  evidence record must be appended as one logical thread-history batch
- partial append of only the `ResponseItem` or only the evidence record must be
  rejected, retried, or made explicitly unreplayable
- durable correctness mutation happens before evidence append
- evidence must not claim delivery for pending intent that durable state still
  considers pending unless recovery is documented and tested

## Tests And Checks

Add focused tests for:

- pending intent is consumed only after `ResponseEvent::Created`
- Created-event commit records committed carry metadata
- committed carry does not expose or store pre-request-shaping
  `ResponseInputItem`
- failure before Created writes no evidence and leaves pending intent intact
- retry after Created does not duplicate pending delivery
- evidence, if implemented, contains attempt ordinal, item index, item
  fingerprint, and full request-input fingerprint
- raw response item notifications and ordinary rollout items are not accepted
  as evidence

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority_created_commit
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

These checks are the local confidence bar for the 02d slice.

## Branch Continuation State

After this pass, selected pending Initial, ObjectiveUpdated, and BudgetLimit
intent should commit only on Created, and current-turn committed carry should
store metadata instead of concrete Goal input. Evidence may be implemented or
explicitly deferred, but the commit metadata fields needed for evidence must
exist.

The next pass, 02e, converts old core producer paths and concrete carry
authority away from pre-request-shaping Goal input.

## Non-Goals

This pass does not:

- select cadence
- rebuild Goal items
- advance Continuation watermarking
- persist Continuation intent
- convert `ext/goal`
- perform broad replay/reconstruction cleanup beyond any typed carrier this
  pass intentionally adds
