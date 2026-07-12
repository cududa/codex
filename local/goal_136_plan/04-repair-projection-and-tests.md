# 04 Repair Projection And Tests

This slice finishes seam repair, projection cleanup, legacy artifact handling,
raw-stream behavior, and replacement tests.

It must not turn repair into cadence. It must not preserve the fake Goal
wrapper as active architecture.

## Authority Inputs

Read first:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`

## Goals

- Implement request-local repair in the final-input seam.
- Restore recorded cadence history only from exact committed record material.
- Replace active `is_goal_context_*` dependencies with shared classifiers.
- Keep classifiers projection/cleanup-only.
- Keep raw response item notifications raw.
- Update compaction and reconstruction cleanup for pure current Goal internal
  context and pure legacy artifacts.
- Preserve mixed ordinary prose.
- Add replacement tests for final payloads, cadence state, resume/idle,
  repair, legacy artifacts, app-server, and TUI behavior.

## Repair And Classifiers

Request repair is a final-input seam backstop. Put it in the same finalizer
that inspects final model request input.

Use this language and implementation boundary:

- Classifiers are projection/cleanup tools, not authority predicates.
- Current developer-role Goal input is a model input item, not an artifact.
- Legacy `<goal_context>` is artifact cleanup/projection handling only.

Shared classifiers should live with generic internal context and legacy Goal
artifact helpers:

- pure current Goal internal-context item
- pure legacy `<goal_context>` artifact
- non-Goal internal-context item
- mixed visible prose containing marker-like text

Replacement callsites:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`

Required behavior:

- Omit pure current Goal internal-context model input items from
  typed/materialized UI or app-server projections.
- Continue hiding pure legacy `<goal_context>` artifacts from
  typed/materialized projections.
- Keep raw response item notifications raw; do not add special Goal suppression
  to raw streams.
- Drop stale or duplicate pure Goal internal-context items during compaction or
  rollout reconstruction only as cleanup, unless preserving the single current
  cadence item required by final-input repair.
- Preserve mixed ordinary user/developer prose.
- Never reconstruct active Goal state by parsing current internal-context text
  or legacy `<goal_context>` text.

Repair may insert, replace, or deduplicate a Goal item only when:

- pending durable cadence intent is selected for this request
- automatic Continuation was selected by the idle predicate for this request
- a seam would otherwise lose or duplicate a committed current-turn cadence
  item
- structured reconstruction is restoring a previously committed cadence record

Structured reconstruction means restoring the exact serialized
`response_item_json` from `thread_goal_steering_records`. If no committed
record with exact item material exists, repair remains request-local unless the
normal cadence path is consuming pending intent. Do not synthesize recorded
historical cadence by re-rendering from current durable Goal state.

Repair must not emit Goal steering merely because durable active Goal state
exists.

## Event And UI Hiding

Current dependency:

- legacy Goal wrapper text is hidden from typed/materialized user-visible turn
  items or classified as contextual content

Required replacement:

- omit pure current `<codex_internal_context source="goal">` model-input items
  from typed/materialized user-visible turn projections
- continue hiding pure legacy `<goal_context>` artifacts from typed/materialized
  user-visible turn projections
- do not add special Goal suppression to raw response item notifications; raw
  response item streams should remain raw unless a version plan explicitly
  changes the general raw-response contract
- do not hide mixed ordinary user/developer prose merely because it contains a
  marker-like string
- do not treat typed/materialized projection hiding as proof that Goal
  authority exists

Implementation pitfalls:

- deleting `is_goal_context_*` callsites without replacing strict
  classification can expose Goal steering in typed UI or app-server projections
- carrying forward local-only raw-response suppression would preserve fake-shim
  behavior instead of removing the active shim
- calling current developer-role Goal input an artifact can make future code
  clean up the active cadence item instead of preserving or repairing it
  according to the cadence contract

## Compaction

Files:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- related compact tests

Required replacement:

- filter pure legacy `<goal_context>` artifacts from reconstructed history
- drop stale or duplicate pure Goal internal-context items when they are not
  the single current cadence item for the final request
- preserve or repair the single current cadence item only according to the
  primary cadence contract
- do not treat filtering as model authority delivery
- do not convert active durable Goal state alone into a current Goal item

Mid-turn compaction may preserve a cadence item already included in final model
request input through committed carry. It must not convert carry into durable
Goal facts or new pending cadence intent.

## Rollout Reconstruction

Files:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`

Required replacement:

- retain cleanup behavior for pure legacy artifacts
- clean up stale or duplicate pure Goal internal-context messages without
  treating cleanup as cadence delivery
- retain mixed-content retention
- never reconstruct active Goal state by parsing a rendered artifact
- reconstruct recorded cadence history only from exact committed record
  material when structured reconstruction is allowed

Removing legacy artifact classification entirely can make old `<goal_context>`
items look like ordinary user/developer prose in reconstructed history. Do not
do that.

## History And User-Turn Boundaries

Files:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`

Required replacement:

- pure Goal internal-context items must not become visible user-turn markers
- legacy `<goal_context>` artifacts must remain non-user cleanup artifacts
- ordinary user messages must still count normally

A generic internal-context classifier that is too broad can erase real user
messages. One that is too narrow can leave stale Goal authority as user prose.

## App-Server And TUI Replacement Tests

Files:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- relevant `*.snap` files owned by changed UI tests

Add replacement final model request input tests:

- Initial steering is one outer developer-role Goal item.
- ObjectiveUpdated steering is one outer developer-role Goal item rendered from
  persisted updated durable state.
- BudgetLimit steering is one outer developer-role Goal item rendered from
  persisted budget/status state.
- Automatic Continuation steering is one outer developer-role Goal item and is
  launched only by the idle predicate.
- No replacement steering test requires active `<goal_context>`.
- No user-role Goal steering item is emitted.

Add durable pending cadence intent tests:

- creating an active Goal persists pending Initial intent
- Initial intent is consumed only when final model request input contains the
  matching developer-role item
- ObjectiveUpdated intent remains pending when same-turn injection is
  unavailable
- BudgetLimit intent remains pending when same-turn injection is unavailable
- BudgetLimit supersedes older Initial or ObjectiveUpdated intent for the same
  Goal

Add resume and idle lifecycle tests:

- resume reloads durable Goal facts and pending intent
- resume does not create Initial merely because a durable active Goal exists
- already-consumed Initial is not re-emitted after resume
- pending non-Goal work runs before Goal-owned synthetic turns
- trigger-turn mailbox work runs before Goal-owned synthetic turns
- automatic Continuation does not repeat for unchanged Goal, history, and
  durable facts versions
- a new non-Continuation model-visible history change permits a later
  automatic Continuation

Add repair and legacy artifact tests:

- request-local repair can restore missing developer-role Goal authority at a
  seam without creating a new cadence event
- duplicate current Goal items are deduplicated
- wrong-role current Goal items are replaced or rejected
- legacy `<goal_context>` alone does not create durable Goal state or cadence
  intent
- raw response item notifications are not specially suppressed for Goal context

Keep upstream Goal API, `/goal`, status/footer projection, pause/edit/clear,
budget/usage, and review-mode tests active.

Re-add local Ctrl+C, pause/resume, and queue behavior tests only from the
replacement command/state contract:

- Ctrl+C during an active turn interrupts without mutating Goal state
- Ctrl+C with queued input preserves predictable queue behavior
- pause/resume command behavior is tested from the replacement state machine
- the local configured objective limit extension is re-added only from a
  specific replacement command/config contract

Snapshot workflow:

- run the focused snapshot-producing test
- inspect pending `*.snap.new`
- accept only intended snapshots with `cargo insta accept -p codex-tui`
- update snapshots only when user-visible output intentionally changes

## Verification

Repair and projection:

- typed/materialized projections omit pure current Goal input items and pure
  legacy artifacts
- raw response item notifications are not specially suppressed for Goal context
- compaction/reconstruction drops stale pure current Goal internal-context
  items and pure legacy artifacts without treating cleanup as cadence delivery
- mixed prose is retained
- classifiers are never accepted as proof of Goal authority

Replacement behavior:

- focused `codex-core` tests for final model payload, cadence state, retry, and
  idle behavior
- focused `codex-app-server` tests for app-server Goal set/resume ordering
- focused `codex-tui` snapshot tests for changed UI behavior
- no full crate or workspace suite unless explicitly requested

Suggested focused checks after Rust edits:

```text
cargo test -p codex-core initial_goal_steering
cargo test -p codex-core objective_updated_goal_steering
cargo test -p codex-core budget_limit_goal_steering
cargo test -p codex-core idle_goal_continuation
cargo test -p codex-app-server thread_goal_set
cargo test -p codex-tui goal_status_indicator
```
