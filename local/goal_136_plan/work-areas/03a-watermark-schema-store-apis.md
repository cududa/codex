# Work Area 03a: Watermark Schema And Store APIs

This ordered pass adds the state-owned latest automatic Continuation
watermark. It is durable duplicate-suppression state, not pending cadence
intent and not recorded request evidence.

## Direction Lock

Request:

- add the Continuation watermark storage pass for WA03
- keep state durable-only
- do not implement request shaping, idle scheduling, or Rust code in this
  planning session

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-recorded-request-evidence.md`

Route context:

- `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md#accepted-v136-placement-default`
- `local/goal_136_plan/work-areas/01-durable-cadence-state.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md`

Terrain:

- current local and `rust-v0.136.0` Goal state stores are facts-only
- WA01 adds `facts_version`, pending Initial / ObjectiveUpdated /
  BudgetLimit intent, and cadence snapshots
- WA02 adds final request-input commit metadata and Created-event commit
  timing, but the watermark remains state-owned suppression state
- `codex-rs/state/src/runtime/goals.rs` is the existing `GoalStore` owner and
  focused state-test home

Code-shape temptation:

- persist automatic Continuation as another pending intent kind
- make `GoalStore` choose Continuation eligibility because the watermark row
  is nearby
- store rendered Goal text or request evidence fields in the watermark table
- reconstruct suppression from ordinary rollout items, raw notifications,
  classifier matches, rollout trace payloads, or rendered Goal text

Locked direction:

- add a durable latest committed Continuation watermark row keyed by thread
- expose load/upsert/clear operations and snapshot plumbing only
- leave eligibility, request input, commit timing, and recorded evidence to
  later passes
- keep recorded request evidence optional metadata from the Created-event
  commit path, not the default live suppression owner

Exclusions:

- no pending Continuation intent
- no model input construction
- no prompt rendering
- no Created-event commit wiring
- no recorded request evidence carrier
- no idle lifecycle rewrite
- no resume/reconstruction path that parses rendered Goal text into a
  watermark

## Code Terrain Read

Directly read:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`
- WA01 pass docs `01a`, `01b`, and `01c`

Observed facts:

- `thread_goals` currently has no `facts_version` until WA01 lands.
- there is no current watermark table or committed-delivery record.
- `GoalStore` tests already live beside SQL operations in
  `state/src/runtime/goals.rs`.
- goals migrations are already included by the state crate migration setup.

## Pass Goal

Add durable storage and state APIs for the latest committed automatic
Continuation suppression triple:

```text
thread_id
goal_id
facts_version
model_visible_history_key and visible key components
committed_turn_id
item_fingerprint
committed_at_ms
```

## Exact Files To Edit

- `codex-rs/state/goals_migrations/<next>_thread_goal_continuation_watermarks.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/model/mod.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/lib.rs`

Use the next available migration number after WA01 lands. The current WA01
route shares `0002_goal_cadence_state.sql` between facts-version and
pending-intent DDL, so this pass should normally use `0003` after that shared
migration. Use `0004` only if WA01 actually consumes `0003` before WA03 lands.

## Required Edits

Add a table equivalent to:

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

Add public model types equivalent to:

- `ThreadGoalContinuationWatermark`
- `ThreadGoalContinuationWatermarkInput`

The row stores the suppression triple and supporting key components. It must
not store rendered prompt text, full finalized request input, request-input
fingerprint, attempt ordinal, item index, replay pairing metadata, ordinary
rollout items, rollout trace payloads, or raw notification payloads. Those
belong to typed request evidence when such evidence is implemented.

Expose store operations equivalent to:

- `get_thread_goal_continuation_watermark(thread_id)`
- `upsert_thread_goal_continuation_watermark(input)`
- `clear_thread_goal_continuation_watermark(thread_id)`

Extend `ThreadGoalCadenceSnapshot` or a sibling snapshot so core can load the
latest watermark with durable Goal facts and pending intent.

Clear stale watermark rows when:

- a Goal is deleted
- a thread Goal is replaced with a different `goal_id`
- Goal status changes to a state where active Goal behavior is ineligible

The state layer must not decide whether a candidate Continuation is due. It
stores and returns data only.

Resume, rollback, fork, and compaction code must not reconstruct this
watermark by parsing rendered Goal text or by treating ordinary rollout
`ResponseItem`s as commit evidence. If structured `GoalRequestEvidence` is
later used to reconstruct a missing watermark, it must be paired by
fingerprint with the surviving committed Goal item and follow the
recorded-evidence failure policy; that is not the default Work Area 03 live
correctness path.

## Tests And Checks

Add focused state tests in `codex-rs/state/src/runtime/goals.rs`:

- `goal_cadence_continuation_watermark_upsert_round_trips_key_components`
- `goal_cadence_continuation_watermark_replaced_for_new_commit`
- `goal_cadence_continuation_watermark_cleared_when_goal_deleted`
- `goal_cadence_continuation_watermark_does_not_consume_pending_intent`
- `goal_cadence_continuation_watermark_is_not_request_evidence`
  - watermark rows do not store rendered prompt text, full finalized request
    input, request-input fingerprints, attempt ordinals, item indexes,
    ordinary rollout items, or rollout trace payloads

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence_continuation_watermark
```

Run formatting after Rust edits:

```powershell
cd codex-rs
just fmt
```

## Branch Continuation State

After this pass, state can persist and reload the latest committed
Continuation watermark. Nothing in core should yet select automatic
Continuation from this row, and no request commit should write it until the
Created-event commit pass lands.

This is not a standalone acceptance point. WA03 still needs key projection,
turn metadata, idle ordering, shaper recheck, Created commit, resume hydration,
and retry/failure coverage.

## Non-Goals

This pass does not:

- persist pending Continuation intent
- select cadence
- render Goal prompt text
- construct `ResponseItem` or `ResponseInputItem`
- append `GoalRequestEvidence`
- parse rendered Goal text
- advance a watermark before `ResponseEvent::Created`
