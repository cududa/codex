# Work Area 03f: Automatic Continuation Preflight And Shaper Recheck

This ordered pass implements automatic Continuation candidate preflight and the
per-attempt request-input shaper recheck. It does not advance the watermark;
that commit happens in 03g.

## Direction Lock

Request:

- add automatic Continuation preflight and exact-attempt shaper recheck
- keep preflight subordinate to final request-input shaping
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`

Route context:

- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03a-watermark-schema-store-apis.md`
- `local/goal_136_plan/work-areas/03b-model-visible-history-key-projection.md`
- `local/goal_136_plan/work-areas/03c-goal-turn-request-metadata.md`
- `local/goal_136_plan/work-areas/03d-idle-stage-order-refactor.md`
- `local/goal_136_plan/work-areas/03e-idle-pending-durable-intent-delivery.md`

Terrain:

- `goal_continuation_candidate_if_active(...)` currently renders a concrete
  Goal item and chooses Initial versus Continuation from runtime state
- the WA02 shaper runs inside `run_sampling_request(...)` for every attempt
- `clone_history().for_prompt(...)` gives the base input used for preflight and
  later exact-attempt shaping
- the watermark table from 03a is the default duplicate-suppression owner
- rendered Goal text, ordinary rollout items, rollout trace payloads, raw
  notifications, classifier matches, structured evidence, and
  `history_version()` are not live Continuation suppression authority

Code-shape temptation:

- treat preflight as commit evidence
- use the preflight key without recomputing inside the request-input shaper
- launch Continuation while pending durable cadence intent is due
- send an empty synthetic request when the candidate becomes stale
- assume a pending-work recheck before generic `start_task(...)` is enough even
  though generic task start can drain newly arrived queued/mailbox work into
  the synthetic Goal-owned turn

Locked direction:

- preflight only avoids launching clearly suppressed synthetic turns
- the request-input shaper recomputes the key from the exact attempt input
- stale or superseded synthetic turns abort before model submission
- synthetic Continuation launch must not absorb newly arrived pending non-Goal
  work; late queued/mailbox work remains regular pending work
- Stage 3 should not be considered enabled for correctness until 03g commits
  the Created-event watermark update

Exclusions:

- no watermark advancement
- no pending intent consumption
- no recorded evidence write
- no active model input construction outside `goal_cadence/`
- no use of `history_version()` or artifact counts as the Continuation key

## Code Terrain Read

Directly read:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/context_manager/history.rs`

Observed facts:

- the current candidate path rechecks active turn and pending work but still
  builds model input too early.
- the generic task start path can drain queued next-turn items and mailbox
  input into the active turn after a pre-launch recheck.
- retry attempts may have different base input, so the shaper must recompute
  `ModelVisibleHistoryKey` per attempt.
- pending durable Initial / ObjectiveUpdated / BudgetLimit intent outranks
  automatic Continuation.

## Pass Goal

Implement metadata-only automatic Continuation preflight and shaper recheck:

```text
Stage 3 preflight:
  no active turn
  no pending non-Goal work
  no pending durable cadence intent
  active durable Goal exists
  preflight key is not suppressed by latest watermark
  reserve turn with GoalTurnRequest::IdleAutomaticContinuation
  launch without draining newly arrived queued/mailbox work into the synthetic
    turn

Request-input shaper:
  recompute key from exact attempt input
  reject if durable facts changed
  reject if pending durable intent became due
  reject if key mismatches preflight
  reject if latest watermark now suppresses the triple
  otherwise insert exactly one developer-role Continuation item
```

Preflight and reservation are launch filters only. They are not delivery,
commit metadata, recorded evidence, or a durable suppression update.

## Exact Files To Edit

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/state/src/runtime/goals.rs`

## Required Edits

Replace `goal_continuation_candidate_if_active(...)` for the WA03-owned path
with a metadata candidate that:

- checks feature and collaboration-mode eligibility
- rejects when pending non-Goal work exists
- rejects when pending durable cadence intent is due
- reads durable active Goal facts and facts version
- computes preflight base input from `clone_history().for_prompt(...)`
- computes `ModelVisibleHistoryKey` through the same projection as the shaper
- loads latest watermark and rejects a matching triple
- reserves a synthetic turn and stores
  `GoalTurnRequest::IdleAutomaticContinuation`
- rechecks reservation, pending work, durable Goal facts, pending intent, and
  watermark before launch
- makes the pending-work recheck and task start effectively atomic for
  queued/mailbox work, or uses a Goal-owned launch path that refuses or
  requeues newly arrived pending work before model submission
- does not compute the suppression decision from rendered Goal text, ordinary
  rollout items, rollout trace payloads, raw notifications, classifier
  matches, structured evidence, or `ContextManager::history_version()`

Extend request-input shaping so a synthetic automatic Continuation turn returns
an internal abort-before-submit outcome when the candidate is stale,
suppressed, or superseded.

The shaper must recompute `ModelVisibleHistoryKey` from the exact cleaned base
input for the attempt before inserting the Continuation item. The preflight key
may be compared to detect staleness, but it must not be reused as a substitute
for per-attempt projection.

If shaping succeeds and 03g later commits the Continuation at
`ResponseEvent::Created`, the uncommitted `IdleAutomaticContinuation`
metadata must be cleared or made obsolete in favor of committed carry before
any same-turn follow-up attempt.

The implementation may keep Stage 3 launch disconnected until 03g is ready to
commit the watermark. Do not re-enable old concrete Goal input injection to
make this pass look complete.

## Tests And Checks

Add focused tests:

- `goal_idle_automatic_continuation_requires_changed_history_key`
- `goal_idle_assistant_output_after_continuation_permits_later_continuation`
  as a preflight/shaper test only when it seeds an existing committed
  watermark from 03a state; end-to-end Created commit behavior belongs to
  03g/03i
- `goal_idle_goal_facts_version_change_permits_later_continuation` as a
  preflight/shaper test only when it seeds an existing committed watermark from
  03a state; end-to-end Created commit behavior belongs to 03g/03i
- `goal_idle_automatic_continuation_preflight_mismatch_aborts_before_submit`
- `goal_idle_candidate_rejected_if_pending_work_appears_after_reservation`

Tests that assert model submission should use captured `/responses` input.
Abort tests should assert no request is submitted and no pending intent or
watermark state changes.
Late pending-work tests should assert queued next-turn or trigger-turn mailbox
input is not drained into a Goal-owned synthetic Continuation request.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle_automatic_continuation
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, automatic Continuation can be selected and rechecked as
metadata, and stale synthetic turns can abort before submit. The watermark must
still not advance until 03g wires the Created-event commit.

This pass is not independent acceptance for automatic Continuation.

## Non-Goals

This pass does not:

- update `thread_goal_continuation_watermarks`
- consume pending Initial / ObjectiveUpdated / BudgetLimit intent
- write structured request evidence
- use `history_version()` as the key
- parse rendered Goal text
- make ordinary user turns Continuation events
