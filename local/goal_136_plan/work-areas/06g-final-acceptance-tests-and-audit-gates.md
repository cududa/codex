# WA06g Final Acceptance Tests And Audit Gates

This pass adds or verifies final acceptance coverage and runs the final
stale-symbol audits after WA06 cleanup passes have landed.

## Direction Lock

- Request: prove the completed rewrite through final payloads, durable state,
  commit metadata where in scope, raw notifications, projections, compaction,
  reconstruction, and stale-symbol audits.
- Authority: final request input is active Goal authority; durable state owns
  live correctness; recorded request evidence is Created-event metadata only.
- Terrain: earlier passes delete old active shims and tests; this pass verifies
  that no old route remains reachable.
- Upstream terrain: v136 baseline/product tests remain useful; v140 typed replay
  informs metadata boundaries only.
- Code-shape temptation: assert helper output, classifier output, raw events, or
  rendered Goal text instead of the final request payload.
- Locked direction: acceptance uses the correct layer for each invariant.
- Exclusions: no new architecture, no broad service adoption, no hidden app
  server parser, no final cleanup of unrelated code.

## Authority Docs Read

- all `local/goal_research/goal-authority-*.md` docs used by WA01-WA06
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/00-test-prep-and-baseline-reset.md`
- WA01-WA05 parent docs, maps/readiness checks, and pass docs
- `06a` through `06f`
- `06-cleanup-and-acceptance.md`

## Code Terrain Read

- `codex-rs/core/tests/common/responses.rs`
- final-payload test homes introduced by WA02/WA04
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/core/config.schema.json` when config shape changed
- tests touched by WA01-WA06

## Pass Goal

Establish the final acceptance gate for the v136 Goal rewrite.

Acceptance must cover:

- final `/responses` payload authority
- durable pending intent and facts-version behavior
- Created-event commit and committed carry metadata
- Continuation watermark behavior
- recorded request evidence boundaries when the carrier is in scope
- extension/app-server producer conversion
- raw notifications
- typed/materialized projection
- compaction and reconstruction cleanup
- stale-symbol audits

## Exact Files To Edit

Likely test/edit owners:

- `codex-rs/core/tests/common/responses.rs`
- final-payload tests under `codex-rs/core/tests/` or the selected core test
  home from WA02/WA04
- focused state runtime tests
- focused goal cadence tests
- app-server tests for thread goal routes and raw notifications
- app-server-protocol tests for materialized/thread-history projection
- extension backend tests for producer state/runtime behavior
- compaction and reconstruction tests

Only edit production code if an acceptance test exposes a leftover cleanup miss
from 06b-06f.

## Required Edits

1. Final payload acceptance:
   - Initial delivery emits exactly one current Goal item in final `/responses`
     input with outer role `developer`
   - ObjectiveUpdated delivery has the same final-payload shape
   - BudgetLimit delivery has the same final-payload shape
   - automatic Continuation delivery has the same final-payload shape
   - ordinary active Goal with no due cadence emits no fresh Goal item
   - no active `<goal_context>` transport appears in final payload
   - old role config cannot make active Goal output use user role

2. Durable state and commit acceptance:
   - Initial / ObjectiveUpdated / BudgetLimit pending intent survives until
     exact Created-event commit
   - pending intent consumes only by exact key
   - retry before Created preserves uncommitted request metadata
   - retry or follow-up after Created uses committed carry plus fresh facts
   - stream failure after Created keeps durable commit effects and committed
     carry metadata, and later retry must not duplicate delivery for the same
     committed request
   - stale synthetic Goal-owned turn aborts before model submission
   - Continuation watermark advances only after selected Continuation reaches
     `ResponseEvent::Created`
   - resume hydration does not fabricate Initial from active facts

3. Recorded request evidence acceptance, if in scope:
   - evidence metadata is written only by the Created-event commit path
   - item index, item fingerprint, request-input fingerprint, cadence kind,
     goal id, facts version, and history key are tied to the finalized request
   - evidence is not raw response item data
   - evidence is not rendered as conversation prose
   - evidence is not used to recover facts or current objective from text
   - stream failure after Created keeps committed evidence and durable commit
     effects for the finalized request attempt
   - paired write policy is covered when replay evidence matters

4. Producer acceptance:
   - app-server `thread/goal/set` and `clear` use WA01 durable state and WA04
     metadata wake/recheck
   - extension `create_goal`, ObjectiveUpdated, and BudgetLimit paths produce
     durable intent/accounting without active model-input construction
   - terminal extension `update_goal` preserves complete/blocked product
     behavior and final usage reporting without creating active cadence intent

5. Projection/raw acceptance:
   - typed/materialized projection hides pure current internal context and pure
     legacy artifacts only
   - mixed marker-like prose remains visible
   - raw response item notifications emit pure current, pure legacy, and mixed
     Goal-looking items unchanged

6. Compaction/reconstruction acceptance:
   - compaction replacement history does not carry pre-shaper concrete Goal
     input
   - reconstruction filters only pure artifacts
   - rollback/fork behavior preserves key and evidence boundaries from WA03/WA05
   - no rendered-text recovery of facts, cadence, commit status, or
     Continuation suppression

7. Final stale-symbol audits:
   - run the WA06 parent audits
   - inspect every hit
   - allow only valid cleanup fixtures, migration comments, local planning docs,
     or explicit rejection comments

## Tests And Checks

Run targeted tests named by the implementation branch. Prefer:

- focused `codex-state` tests for durable state behavior
- focused `codex-core` final-payload and goal cadence tests
- focused app-server route/raw tests
- focused app-server-protocol projection tests
- focused extension backend tests
- focused compaction/reconstruction tests

Required formatting/schema checks when applicable:

- `just fmt` from `codex-rs` after Rust edits
- `just write-config-schema` if config shape changed
- verify generated schema no longer exposes active `GoalSteeringRole` or
  `steering_role` config influence when steering-role config is removed

Final audits:

```powershell
rg -n "GoalContext|GoalContextRole|GoalSteeringRole|steering_role|<goal_context>|goal_context|GOAL_CONTEXT" `
  codex-rs/core/src codex-rs/config/src codex-rs/ext/goal/src `
  codex-rs/app-server/src codex-rs/app-server-protocol/src `
  codex-rs/core/tests codex-rs/ext/goal/tests codex-rs/app-server/tests codex-rs/tui/src `
  codex-rs/core/config.schema.json

rg -n "inject_goal_response_items|inject_goal_steering_items_into_active_turn|extend_goal_pending_input_for_turn_state|current_turn_goal_steering_items|GoalSteeringCarry|GoalSteeringInjectionPhase|append_current_turn_goal_steering_items|close_goal_steering_injection" `
  codex-rs/core/src codex-rs/ext/goal/src codex-rs/core/tests codex-rs/ext/goal/tests codex-rs/app-server/tests

rg -n "RawResponseItemCompleted|maybe_emit_raw_response_item_completed|is_goal_context_response_item|is_goal_context_text" `
  codex-rs/app-server/src codex-rs/app-server-protocol/src
```

## Branch Continuation State

After this pass:

- final request payload tests cover all active cadence kinds
- durable state and commit behavior are covered
- recorded evidence boundaries are covered when implemented
- raw/projection/compaction/reconstruction cleanup is covered
- stale-symbol audits have no unclassified production hits
- WA06 can be treated as final cleanup/acceptance for the v136 rewrite

## Non-Goals

- Do not run full local workspace suites by default.
- Do not use helper output, classifier matches, raw notifications, ordinary
  rollout items, rollout trace payloads, or rendered Goal text as substitutes
  for final payload assertions.
- Do not accept later upstream service topology as an unstated requirement.
- Do not leave any old active steering surface reachable because tests pass.
