# Work Area 03g: Continuation Created Commit

This ordered pass commits automatic Continuation delivery at
`ResponseEvent::Created` and advances the state-owned watermark for the exact
finalized request attempt.

## Direction Lock

Request:

- add Created-event commit behavior for automatic Continuation
- update the durable watermark only after the final request input reaches
  model execution
- do not implement Rust code in this planning session

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-recorded-request-evidence.md`

Route context:

- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03a-watermark-schema-store-apis.md`
- `local/goal_136_plan/work-areas/03f-automatic-continuation-preflight-shaper-recheck.md`

Terrain:

- `try_run_sampling_request(...)` has an empty `ResponseEvent::Created` arm
- WA02 passes inert commit metadata into that function for the exact attempt
- `GoalRequestCommit` carries item/request fingerprints and item index
- state watermark APIs from 03a upsert the latest committed triple

Code-shape temptation:

- commit after stream setup succeeds
- trust preflight instead of verifying the finalized request identity
- use ordinary rollout `ResponseItem`, rollout trace, raw notification, or
  rendered text as commit metadata
- treat optional structured evidence as the default live duplicate-suppression
  owner

Locked direction:

- commit only in the `ResponseEvent::Created` arm
- verify the commit metadata still matches the finalized request input
- upsert the durable Continuation watermark for the exact selected item and
  key
- keep recorded evidence metadata-only and optional unless the typed carrier
  and explicit failure policy already exist
- preserve durable state as the default live correctness owner even when
  evidence is appended

Exclusions:

- no pre-Created commit
- no evidence-as-authority behavior
- no pending Continuation intent
- no request shaping in the commit handler
- no commit based on rendered Goal text, rollout trace payloads, raw
  notifications, classifier matches, ordinary rollout items, or
  `history_version()`

## Code Terrain Read

Directly read:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

Observed facts:

- stream construction can succeed and still fail before `ResponseEvent::Created`.
- Created is the current local commit point named by the authority docs.
- `persist_rollout_items(...)` logs errors and is not a live correctness owner
  for duplicate suppression.

## Pass Goal

Wire automatic Continuation commit side effects to `ResponseEvent::Created`:

```text
Created-event commit:
  verify selected item fingerprint and request-input fingerprint
  upsert thread_goal_continuation_watermarks
  append typed evidence only if that carrier exists and policy is explicit
  record committed carry metadata
  clear or obsolete the uncommitted GoalTurnRequest metadata for this turn
```

The commit handler consumes the inert metadata produced by final request-input
shaping. It does not reselect cadence, render Goal text, or treat preflight as
a durable commit.

## Exact Files To Edit

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/state/turn.rs`

## Required Edits

Extend `GoalRequestCommit` so Continuation commit metadata includes:

- `model_visible_history_key`
- visible key component fields
- `facts_version`
- `goal_id`
- selected item fingerprint
- full finalized request-input fingerprint
- item index
- attempt ordinal
- inserted-or-verified placement

In `ResponseEvent::Created`:

- verify the selected item still matches the commit metadata
- upsert the watermark row with the storage key and visible key fields
- keep pending Initial / ObjectiveUpdated / BudgetLimit consumption on the
  WA02 exact-key path
- record committed carry metadata
- clear or mark the committed turn's uncommitted `GoalTurnRequest` metadata
  obsolete so same-turn follow-up shaping uses committed carry plus fresh
  durable snapshots instead of replaying the stale synthetic request
- append `GoalRequestEvidence` only if the typed carrier and failure policy
  have already been implemented
- never use a best-effort evidence append as the only reason a Continuation is
  suppressed after resume or retry

Do not advance the watermark when:

- the idle hook fires
- preflight selects a candidate
- a turn is reserved
- prompt text is rendered
- the shaper constructs a `ResponseItem`
- stream setup succeeds but no Created event arrives
- a retryable error occurs before Created

After Created, a retryable stream failure leaves the watermark committed and
the retry must not duplicate Continuation for the same triple.

## Tests And Checks

Add focused tests:

- `goal_idle_continuation_created_commit_writes_watermark`
- `goal_idle_continuation_created_commit_obsoletes_turn_request_metadata`
- `goal_idle_request_failure_before_created_does_not_advance_watermark`
- `goal_idle_retry_after_created_does_not_duplicate_continuation`
- `goal_idle_continuation_created_commit_records_evidence_metadata` when the
  typed evidence carrier and explicit failure policy exist

Tests must inspect final `/responses` input and durable watermark state. They
must not use ordinary rollout items, raw notifications, classifier matches, or
rendered Goal text as structured commit metadata.

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --test all goal_idle_continuation_created
cargo test -p codex-state --lib goal_cadence_continuation_watermark
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, automatic Continuation duplicate suppression has a live
Created-event correctness path. Resume hydration, rollback/fork reconstruction,
and broad retry/failure coverage still come later.

This is not final WA03 acceptance by itself.

## Non-Goals

This pass does not:

- select automatic Continuation
- compute the key independently of `goal_cadence/`
- persist pending Continuation intent
- make recorded evidence the default live correctness owner
- parse rendered Goal text
- finish resume or compaction behavior
