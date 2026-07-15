# WA06f Test Deletion Map Closeout

This pass closes `goal-test-deletion-map.md` by deleting or rewriting stale
tests that still defend old active Goal transport.

## Direction Lock

- Request: complete stale test cleanup after replacement behavior exists.
- Authority: tests must prove final request input, durable state, commit
  metadata, raw behavior, and projection behavior at the correct layer.
- Terrain: local tests still name active marker transport, user-role steering,
  concrete carry, raw hiding, and resume-fabricated Initial behavior.
- Upstream terrain: upstream product tests remain valid unless a separate
  product change replaces them.
- Code-shape temptation: convert every old active-steering test into a
  classifier test or keep snapshots because deletion is noisy.
- Locked direction: delete false-pressure tests, preserve product tests, and
  add only replacement tests with the right ownership layer.
- Exclusions: no production implementation beyond test cleanup; no new
  behavior design.

## Authority Docs Read

- `goal-authority-grounding-truth.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-durable-cadence-state.md`
- `goal-authority-recorded-request-evidence.md`
- `goal-authority-repair-classifier-integration.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-test-deletion-map.md`
- WA00 through WA06 route docs
- `06a-final-precondition-and-reachability-audit.md`
- `06b` through `06e` if already completed

## Code Terrain Read

Use `goal-test-deletion-map.md` as the route. At minimum inspect:

- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- any snapshots owned by deleted tests

## Pass Goal

Remove old tests that defend:

- active `<goal_context>` transport
- `GoalContext` or `GoalContextRole` active construction
- user-role Goal steering
- `GoalSteeringRole` config behavior
- concrete pre-shaper Goal injection/carry
- app-server raw hiding of Goal-looking items
- resume-fabricated Initial delivery
- rendered-text recovery for Goal facts, cadence, commit status, or
  Continuation suppression

## Exact Files To Edit

- `local/goal_research/goal-test-deletion-map.md` only if the closeout status
  needs to be updated and the user wants the map maintained
- tests listed by `goal-test-deletion-map.md`
- snapshots paired with deleted tests
- focused replacement tests only when the owning WA01-WA05 pass did not already
  add coverage

## Required Edits

1. Work through `goal-test-deletion-map.md` entry by entry.

2. For each test, classify it as:
   - delete: local-only false pressure for old active shim behavior
   - rewrite: valuable product scenario with stale transport assertion
   - preserve: upstream product behavior that still applies
   - moved: already covered by WA01-WA05 focused replacement test

3. Delete tests that only assert:
   - active marker wrapping
   - user/developer steering role configurability
   - raw hiding of Goal-looking items
   - concrete carry in session/input queue/state
   - helper output as a replacement for final payload assertions

4. Rewrite valuable product scenarios:
   - assert captured final `/responses` input where active authority matters
   - assert durable pending intent/state where producer behavior matters
   - assert raw equality where raw behavior matters
   - assert typed/materialized hiding only in projection tests
   - keep TUI `/goal`, status/footer, review, and action tests focused on
     product UI behavior rather than active steering transport

5. Preserve upstream product tests unless the local authority docs explicitly
   replace the behavior.

6. Remove snapshots only when the owning test is deleted or intentionally
   rewritten. Restore upstream-owned Goal snapshots to the v136 baseline when
   local overlay text changed them. Do not churn unrelated snapshots.

## Tests And Checks

Run focused tests for files touched by deletion/rewrite. Prefer filters over
full crate suites.

Audits:

```powershell
rg -n "goal_context|GoalContext|GoalContextRole|GoalSteeringRole|steering_role|current_turn_goal_steering_items|inject_goal_response_items|raw.*goal" codex-rs/core/src codex-rs/ext/goal/tests codex-rs/app-server/tests codex-rs/app-server/src codex-rs/app-server-protocol/src codex-rs/tui/src
```

Remaining hits must be production deletion targets already owned by 06b-06e,
valid cleanup fixtures, or local planning docs.

## Branch Continuation State

After this pass:

- stale local tests no longer require old active Goal transport
- replacement behavior is covered in the owning layer
- upstream product tests are preserved or explicitly replaced
- `goal-test-deletion-map.md` can be considered closed for WA06

## Non-Goals

- Do not add broad acceptance coverage here; 06g owns final acceptance.
- Do not use classifier matches, raw notifications, rollout text, or helper
  output as substitutes for final request payload assertions.
- Do not delete product behavior tests merely because their old assertion text
  mentions Goal.
- Do not run broad local suites by default.
