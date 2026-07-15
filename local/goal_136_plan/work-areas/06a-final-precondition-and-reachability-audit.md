# WA06a Final Precondition And Reachability Audit

This pass verifies that WA01 through WA05 replacement seams exist before WA06
deletes old active Goal surfaces. It is an audit gate, not a design pass and
not a standalone acceptance checkpoint.

## Direction Lock

- Request: classify remaining old Goal symbols before any final cleanup.
- Authority: `local/goal_research` wins on conflicts; WA01-WA05 route docs are
  prerequisite execution context.
- Terrain: the current local tree may still contain active `GoalContext`,
  configurable steering role, concrete Goal injection/carry, extension steering,
  local raw hiding, and tests that defend those old paths.
- Upstream terrain: `rust-v0.136.0` is baseline topology and raw behavior;
  `rust-v0.139.0` / `rust-v0.140.0` are migration pressure only.
- Code-shape temptation: make WA06 paper over a missing earlier replacement
  seam, or preserve a private hard-map around old active steering.
- Locked direction: if a replacement seam is missing, stop and return to the
  owning earlier work area. WA06 only deletes leftovers once the replacement
  path exists.
- Exclusions: no Rust implementation from this planning pass; no new cadence,
  state, classifier, evidence, extension, or service architecture.

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
- WA01-WA05 parent docs, prepass maps/readiness checks, and pass docs
- `local/goal_136_plan/work-areas/06-cleanup-and-acceptance.md`

## Code Terrain Read

Inspect, but do not edit by default:

- `codex-rs/state/goals_migrations/`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/context/`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/ext/goal/src/*.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- tests named by `goal-test-deletion-map.md`

## Pass Goal

Produce a deletion-ready classification of every remaining old active Goal
symbol before downstream WA06 passes make code changes.

Classify each match as:

- earlier-WA gap: replacement seam missing; stop and return to that work area
- WA06 deletion: old active-path leftover after replacement exists
- valid legacy fixture: classifier/projection/compaction/reconstruction/raw
  test fixture only

## Exact Files To Edit

No Rust file should be edited by this pass by default. If the audit reveals a
plan-doc contradiction, update the owning plan doc before implementation
continues.

If an implementation branch needs to record the classification, keep it in PR
notes or in a short local audit note under `local/goal_136_plan/work-areas/`
only after confirming the user wants that extra artifact.

## Required Edits

1. Verify WA01 replacement surfaces:
   - durable facts version
   - durable pending Initial / ObjectiveUpdated / BudgetLimit intent
   - exact-key pending-intent consumption and supersedence

2. Verify WA02 replacement surfaces:
   - private `core/src/goal_cadence/` request-input shaping
   - exactly one final outer developer-role Goal `ResponseItem` when cadence
     is selected
   - Created-event commit handler
   - committed carry metadata and optional Created-event evidence metadata

3. Verify WA03 replacement surfaces:
   - `model_visible_history_key` projection
   - `GoalTurnRequest` metadata lifecycle
   - idle pending durable delivery before automatic Continuation
   - state-owned latest automatic Continuation watermark or explicitly
     selected committed-delivery record/reconstruction basis
   - Continuation watermark advancement only after `ResponseEvent::Created`
   - resume hydration without fabricated Initial

4. Verify WA04 replacement surfaces:
   - v136 adapter/runtime conversion selected
   - app-server/core external mutation ordering converted
   - extension create/update, ObjectiveUpdated, and BudgetLimit producers use
     durable intent plus metadata-only wake/recheck
   - no planned thin facade or full later service adoption in v136

5. Verify WA05 replacement surfaces:
   - generic internal-context support and shared cleanup classifier
   - request-input cleanup integration subordinate to the shaper
   - typed/materialized projection and history boundary cleanup
   - compaction/reconstruction cleanup
   - raw-notification behavior is implemented, with any remaining app-server
     raw Goal hiding branch classified either as an earlier-WA gap or explicit
     WA06 leftover deletion under the parent work-area rule

6. Run the old-symbol audit from WA06 parent and classify every hit:

   ```powershell
   rg -n "GoalContext|GoalContextRole|GoalSteeringRole|steering_role|<goal_context>|goal_context|GOAL_CONTEXT" `
     codex-rs/core/src codex-rs/config/src codex-rs/ext/goal/src `
     codex-rs/app-server/src codex-rs/app-server-protocol/src `
     codex-rs/core/tests codex-rs/ext/goal/tests codex-rs/app-server/tests codex-rs/tui/src

   rg -n "inject_goal_response_items|inject_goal_steering_items_into_active_turn|extend_goal_pending_input_for_turn_state|current_turn_goal_steering_items|GoalSteeringCarry|GoalSteeringInjectionPhase|append_current_turn_goal_steering_items|close_goal_steering_injection" `
     codex-rs/core/src codex-rs/ext/goal/src codex-rs/core/tests codex-rs/ext/goal/tests codex-rs/app-server/tests
   ```

7. Do not continue to 06b-06g if a replacement path is absent. Return to the
   owning WA01-WA05 pass and repair the route.

## Tests And Checks

This pass is mostly inspection. It should not add new tests.

Run:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

If the implementation branch already contains WA01-WA05 code, prefer targeted
checks named by those owning pass docs. Do not run broad local suites by default.

## Branch Continuation State

Downstream WA06 passes may proceed only after the audit can say:

- old active symbols are either WA06 deletion targets or valid legacy fixtures
- no remaining match is an earlier-WA replacement gap
- final request-input authority, durable state, Created-event commit metadata,
  raw notification behavior, and projection cleanup are all represented by
  earlier replacement seams

## Non-Goals

- Do not delete code in this audit pass unless explicitly folded into a later
  implementation branch.
- Do not add new state tables, cadence rules, classifiers, replay carriers, or
  extension architecture.
- Do not treat upstream later service topology as required for v136 cleanup.
- Do not preserve old active steering by making it private or hard-mapped.
