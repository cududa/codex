# Batch 00: Test Prep And Baseline Reset

This batch prepares the test suite for the Goal authority rewrite.

It does not implement the new Goal authority path. It removes local test
pressure that protects the broken active steering overlay and restores upstream
Goal product behavior to the `rust-v0.136.0` baseline.

## Direction Lock

Request:

- author the first execution-ready batch doc for test prep and baseline reset
- do not implement code in this planning pass
- ground the plan in actual code reads

Authority:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`

Terrain:

- `rust-v0.136.0` exists locally and is the baseline tag for this batch.
- The listed Goal test files all differ from `rust-v0.136.0`.
- `codex-rs/core/src/goals.rs` also contains a local in-file test that pins
  configured user-role Goal steering and active `<goal_context>` emission.

Code-shape temptation:

- keep tests because current local code passes them
- delete upstream Goal product tests because the active steering path is being
  rewritten
- treat helper, classifier, or projection tests as replacement authority tests
- preserve `GoalSteeringRole`, `GoalContextRole`, or `<goal_context>` test
  coverage as compatibility pressure

Locked direction:

- remove local-only tests that defend the old active steering overlay
- restore upstream Goal product tests to the `rust-v0.136.0` baseline
- keep budget, usage, app-server Goal APIs, `/goal`, status/footer projection,
  pause/edit/clear, and upstream extension baseline behavior as product
  obligations
- add replacement authority/cadence tests only after the relevant replacement
  implementation slices exist

Exclusions:

- no durable cadence state implementation
- no final request-input shaping implementation
- no production deletion of `GoalContext`, `GoalContextRole`,
  `GoalSteeringRole`, concrete Goal injection, or extension steering
- no new replacement tests in this batch unless needed only to preserve an
  upstream baseline assertion

## Bounded Code Terrain Read

Commands and reads used to ground this batch:

- `git tag --list rust-v0.136.0`
- `git diff --name-status rust-v0.136.0 -- ...` for the test files named in
  `goal-test-deletion-map.md`
- `git diff --stat rust-v0.136.0 -- ...` for the same files
- `rg` for every local-only test named in `goal-test-deletion-map.md`
- direct reads of the relevant test sections in:
  - `codex-rs/core/src/goals.rs`
  - `codex-rs/core/src/config/config_tests.rs`
  - `codex-rs/app-server/src/bespoke_event_handling.rs`
  - `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Findings:

- `codex-rs/core/src/goals.rs` has
  `goal_steering_message_uses_configured_role_for_all_kinds`, which expects
  both `GoalSteeringRole::Developer` and `GoalSteeringRole::User` and expects
  the active item text to be `<goal_context>...`.
- `codex-rs/app-server/src/bespoke_event_handling.rs` has
  `suppresses_goal_context_raw_response_item_notifications`, which preserves
  the local raw-response suppression behavior rejected by the authority docs.
- No `emits_goal_context_raw_response_item_notifications` test was found by
  `rg`; batch 00 therefore deletes the suppression test and leaves raw
  replacement coverage to the classifier/projection batch.
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs` has
  `thread_goal_set_active_schedules_developer_role_goal_steering`, and the
  test body searches for `<goal_context>`.
- `codex-rs/ext/goal/tests/goal_extension_backend.rs` still contains
  `GoalContextRole::User` and role-storage assertions.
- `codex-rs/core/src/config/config_tests.rs` contains `[goals]
  steering_role = ...` assertions.

## Implementation Order

1. Create a baseline audit before editing.

   Use `git diff rust-v0.136.0 -- <file>` for each file in this batch. Do not
   blindly reset files that contain unrelated local work. The goal is to remove
   Goal overlay hunks while preserving unrelated user changes.

2. Delete local-only fake context tests.

   Remove the named tests that defend `GoalContext`, `GoalContextRole`, active
   `<goal_context>`, fake hidden provenance, and local raw suppression.
   Remove test-only helpers and imports that become unused solely because those
   tests were deleted.

3. Delete local-only core overlay tests.

   Remove tests that encode the current broken resume, same-turn injection,
   configured role, or configured objective-limit overlay. Keep upstream Goal
   runtime/tool behavior tests.

4. Restore upstream baseline tests in modified upstream-owned files.

   For files that existed upstream, remove only local Goal overlay hunks and
   restore `rust-v0.136.0` behavior. This includes upstream Goal product tests,
   snapshots, and helpers.

5. Do snapshot cleanup only for deleted owner tests.

   Delete snapshots only when their owning local-only test is deleted. Restore
   upstream-owned Goal snapshots to the `rust-v0.136.0` baseline when local
   edits changed them.

6. Run diff-focused verification.

   Batch 00 is mostly test deletion and baseline reset. Per
   `local/how-we-test.md`, diff inspection is the default proof. Compile checks
   are optional and should be scoped only if import or helper churn creates
   real compile risk.

## Required Edits

### Delete Local-Only Fake Context Tests

Remove these tests:

| File | Tests |
| --- | --- |
| `codex-rs/core/src/context/contextual_user_message_tests.rs` | `detects_goal_context_fragment`; `goal_context_response_input_item_uses_explicit_steering_role` |
| `codex-rs/core/src/event_mapping_tests.rs` | `goal_context_does_not_parse_as_visible_turn_item`; `developer_goal_context_is_contextual_without_invalidating_by_itself`; `mixed_developer_goal_context_remains_non_contextual` |
| `codex-rs/core/src/context_manager/history_tests.rs` | `drop_last_n_user_turns_trims_developer_goal_context_above_rolled_back_turn`; `user_goal_context_is_not_a_user_turn_boundary` |
| `codex-rs/core/src/session/rollout_reconstruction_tests.rs` | `reconstruct_history_filters_pure_goal_context_from_replacement_history` |
| `codex-rs/app-server-protocol/src/protocol/thread_history.rs` | `ignores_goal_context_response_items_in_rollout_replay` |
| `codex-rs/app-server/src/bespoke_event_handling.rs` | `suppresses_goal_context_raw_response_item_notifications` |

Acceptance for this section:

- no remaining local test asserts that active Goal steering is a
  `<goal_context>` item
- no remaining local test asserts that raw Goal context notifications are
  specially suppressed
- mixed-content preservation coverage is not weakened when the upstream
  baseline already owns it

### Delete Local-Only Core Overlay Tests

Remove these tests:

| File | Tests |
| --- | --- |
| `codex-rs/core/src/session/tests.rs` | `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`; `late_goal_steering_injection_is_not_persisted_unsampled`; `configured_goal_objective_limit_allows_longer_goals` |
| `codex-rs/core/src/goals.rs` | `goal_steering_message_uses_configured_role_for_all_kinds` |

The `goals.rs` test is a batch-00 terrain correction. It was not named in
`goal-test-deletion-map.md`, but the code read shows it pins both rejected
active steering behaviors:

- user-role Goal steering through `GoalSteeringRole::User`
- active `<goal_context>` emission

Remove the test and any test-module imports that were used only by that test.
Do not remove production `GoalSteeringMessage` or `GoalSteeringRole` in this
batch.

### Delete Local-Only App-Server Steering Overlay

Remove this test:

| File | Tests |
| --- | --- |
| `codex-rs/app-server/tests/suite/v2/thread_resume.rs` | `thread_goal_set_active_schedules_developer_role_goal_steering` |

This test has the right product instinct but pins the wrong transport shape. It
asserts developer-role steering through the old marker path. Replacement
coverage belongs to the final request-input shaping batch.

### Delete Local-Only TUI Overlay Tests

Remove these tests:

| File | Tests |
| --- | --- |
| `codex-rs/tui/src/chatwidget/tests/goal_validation.rs` | `goal_slash_command_uses_configured_objective_limit` |
| `codex-rs/tui/src/chatwidget/tests/slash_commands.rs` | `goal_pause_interrupts_active_turn_after_status_event`; `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal` |
| `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs` | `ctrl_c_interrupts_active_turn_without_pausing_goal`; `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`; `paused_idle_ctrl_c_requests_quit_without_goal_mutation` |

These behaviors are not rejected product behavior. They are removed now because
they are local overlay tests. Replacement command, pause/resume, interruption,
and local objective-limit tests can return only after the replacement state
machine and command/config contracts exist.

### Revert Steering-Role Config Test Overlay

In `codex-rs/core/src/config/config_tests.rs`:

- remove `[goals] steering_role = "developer"` TOML parse assertions
- remove `[goals] steering_role = "user"` TOML parse assertions
- remove mixed `objective_max_chars` plus `steering_role` assertions
- remove `GoalSteeringRole` imports if no longer used by the tests

Do not remove production config parsing in this batch. Production config
removal or compatibility mapping belongs to the implementation slice that
removes active user-role Goal steering behavior.

### Restore Existing Test Files To Upstream Baseline

For these files, the execution action is hunk-level restoration of Goal test
behavior to `rust-v0.136.0`. Do not delete upstream Goal product tests.

| File | Baseline obligation |
| --- | --- |
| `codex-rs/core/src/session/tests.rs` | keep upstream Goal runtime/tool tests, including budget and usage behavior |
| `codex-rs/app-server/tests/suite/v2/thread_resume.rs` | keep upstream Goal API behavior tests |
| `codex-rs/tui/src/chatwidget/tests/goal_validation.rs` | keep upstream `/goal` validation tests |
| `codex-rs/tui/src/chatwidget/tests/slash_commands.rs` | keep upstream `/goal` command tests |
| `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs` | keep upstream status/footer/budget tests |
| `codex-rs/tui/src/chatwidget/tests/review_mode.rs` | keep upstream budget-limited review-mode snapshots/tests |
| `codex-rs/tui/src/app/thread_goal_actions.rs` | keep upstream Goal action and replace-confirmation tests |
| `codex-rs/ext/goal/tests/goal_extension_backend.rs` | restore upstream extension backend baseline; do not keep `GoalContextRole` or user-role active steering tests as local compatibility pressure |

If an upstream-baseline restoration fails to compile because local production
APIs have already diverged, record the exact compile issue in the implementation
PR and make the smallest test-side adaptation that preserves upstream product
behavior. Do not adapt the test back toward the old active steering overlay.

## Replacement Tests Reserved For Later Batches

Do not add these in batch 00. They belong after the implementation shape they
test exists:

- final request input contains exactly one selected current developer-role Goal
  `ResponseItem`
- no active `<goal_context>` reaches final request input
- no user-role active Goal steering reaches final request input
- Initial, ObjectiveUpdated, and BudgetLimit pending intent consume only at
  the commit point
- automatic Continuation is selected only by the idle predicate and suppresses
  duplicates by `{ goal_id, model_visible_history_key, durable_facts_version }`
- raw response item notifications remain raw for Goal-looking items
- typed/materialized projections hide only pure current internal-context items
  and pure legacy artifacts

## Verification

Required for the batch implementation:

```powershell
git diff --check -- `
  codex-rs/core/src/session/tests.rs `
  codex-rs/core/src/goals.rs `
  codex-rs/core/src/config/config_tests.rs `
  codex-rs/core/src/context/contextual_user_message_tests.rs `
  codex-rs/core/src/event_mapping_tests.rs `
  codex-rs/core/src/context_manager/history_tests.rs `
  codex-rs/core/src/session/rollout_reconstruction_tests.rs `
  codex-rs/app-server-protocol/src/protocol/thread_history.rs `
  codex-rs/app-server/src/bespoke_event_handling.rs `
  codex-rs/app-server/tests/suite/v2/thread_resume.rs `
  codex-rs/tui/src/chatwidget/tests/goal_validation.rs `
  codex-rs/tui/src/chatwidget/tests/slash_commands.rs `
  codex-rs/tui/src/chatwidget/tests/status_and_layout.rs `
  codex-rs/tui/src/chatwidget/tests/review_mode.rs `
  codex-rs/tui/src/app/thread_goal_actions.rs `
  codex-rs/ext/goal/tests/goal_extension_backend.rs
```

Required audit after implementation:

```powershell
rg -n "goal_steering_message_uses_configured_role_for_all_kinds|GoalSteeringRole::User|GoalContextRole::User|<goal_context>|suppresses_goal_context_raw_response_item_notifications|thread_goal_set_active_schedules_developer_role_goal_steering" `
  codex-rs/core/src/goals.rs `
  codex-rs/core/src/session/tests.rs `
  codex-rs/core/src/config/config_tests.rs `
  codex-rs/core/src/context/contextual_user_message_tests.rs `
  codex-rs/core/src/event_mapping_tests.rs `
  codex-rs/core/src/context_manager/history_tests.rs `
  codex-rs/core/src/session/rollout_reconstruction_tests.rs `
  codex-rs/app-server-protocol/src/protocol/thread_history.rs `
  codex-rs/app-server/src/bespoke_event_handling.rs `
  codex-rs/app-server/tests/suite/v2/thread_resume.rs `
  codex-rs/tui/src/chatwidget/tests/goal_validation.rs `
  codex-rs/tui/src/chatwidget/tests/slash_commands.rs `
  codex-rs/tui/src/chatwidget/tests/status_and_layout.rs `
  codex-rs/tui/src/chatwidget/tests/review_mode.rs `
  codex-rs/tui/src/app/thread_goal_actions.rs `
  codex-rs/ext/goal/tests/goal_extension_backend.rs
```

That audit must have no matches for deleted local overlay tests or active
user-role steering assertions. A match for upstream-owned product text is not
automatically a failure; inspect it before changing it.

Optional focused compile checks if import/helper churn creates real compile
risk:

```powershell
cargo check -p codex-core --lib
cargo check -p codex-app-server-protocol --lib
cargo check -p codex-app-server --lib
```

Do not run broad crate or workspace test suites by default on this workstation.
Per `local/how-we-test.md`, test deletion and hunk-level baseline restoration
can be validated by diff inspection unless the implementation introduces real
compile risk.

## Acceptance Criteria

Batch 00 is complete when:

- every local-only test named above is deleted
- `codex-rs/core/src/goals.rs` no longer has a test that accepts
  `GoalSteeringRole::User` or active `<goal_context>` as expected active
  steering output
- local raw-response suppression coverage for Goal context is deleted
- upstream Goal product tests remain active for budget, usage, app-server Goal
  APIs, `/goal`, status/footer projection, pause/edit/clear, and extension
  baseline behavior
- modified upstream-owned test files have Goal-related hunks restored to
  `rust-v0.136.0` behavior unless a concrete local compile issue requires a
  narrow test-side adaptation
- snapshots are deleted only with their local-only owner tests or restored to
  upstream baseline
- no replacement authority/cadence tests are added before their implementation
  slice exists
- no production Goal authority code is removed in this batch except incidental
  test-only import/helper cleanup

## Non-Goals

This batch does not:

- implement durable pending cadence intent
- implement final request-input shaping or commit
- implement `model_visible_history_key`
- implement idle Continuation scheduling
- convert `ext/goal`
- remove `GoalContext`, `GoalContextRole`, `GoalSteeringRole`, or concrete Goal
  injection from production code
- decide raw/typed projection implementation details beyond deleting the local
  raw suppression test
- add the replacement final request-input tests

## Partial Landing Constraints

This batch may land before the behavior rewrite only if it remains a prep
change:

- deleting false local tests is allowed
- restoring upstream baseline tests is allowed
- production behavior changes are not allowed
- failed attempts to restore a whole file must not revert unrelated user work

If hunk-level restoration exposes a concrete source/test API mismatch, stop and
name the file and symbol. Do not preserve the old active Goal overlay just to
make the batch compile.
