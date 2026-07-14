# Goal Test Deletion Map

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative.

- Role: concrete test prep map for the Goal authority rewrite.
- Owns: local-only test deletions, upstream baseline restoration, replacement
  test profile, and snapshot handling posture.
- Does not own: product redesign, implementation architecture, or permission to
  delete upstream Goal behavior tests.
- Read after: the authority spine and before preparing implementation slices.
- Current terrain anchors: `codex-rs/core/src/session/tests.rs`,
  `codex-rs/app-server/tests/suite/v2/thread_resume.rs`,
  `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`,
  `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`,
  `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`, and
  `codex-rs/ext/goal/tests/goal_extension_backend.rs`.
- Fidelity note: the prep target is not fewer Goal tests; it is removal of
  false compatibility pressure while preserving upstream baseline obligations.

This document answers the prep question directly: which Goal tests should be
removed from the local overlay before the rewrite, which tests should revert to
the upstream baseline, and which replacement tests should be added after the
bad active steering path is removed.

The prep target is not "delete Goal tests." The prep target is:

```text
current local Goal test overlay
  -> remove false compatibility pressure from local-only tests
  -> return upstream/core Goal product behavior to baseline
  -> add replacement tests from the new authority and cadence contracts
```

For this planning pass, `rust-v0.136.0` is the upstream baseline.

Budget and usage are not local experiments. `token_budget`, `tokens_used`,
`time_used_seconds`, `UsageLimited`, and `BudgetLimited` are upstream Goal
facts and remain part of the replacement test profile.

## Prep Rule

Do this before implementing the Goal authority rewrite:

1. Revert Goal-related test hunks in upstream test files back to
   `rust-v0.136.0` behavior.
2. Delete local-only tests that defend the broken local Goal steering overlay.
3. Keep upstream Goal product tests active as the baseline profile.
4. Add new replacement tests for the authority/cadence contracts after the
   active steering implementation is replaced.

Do not keep a local test merely because current code passes it.
Do not delete an upstream Goal behavior test merely because current code fails
it after the fake active steering path is removed.

## Delete Local-Only Fake Context Tests

These tests are local false-compatibility pressure. Delete them during prep.
They defend `<goal_context>`, `GoalContext`, `GoalContextRole`, fake hidden
provenance, or Goal-specific raw/event suppression.

- `codex-rs/core/src/context/contextual_user_message_tests.rs`
  - `detects_goal_context_fragment`
  - `goal_context_response_input_item_uses_explicit_steering_role`
- `codex-rs/core/src/event_mapping_tests.rs`
  - `goal_context_does_not_parse_as_visible_turn_item`
  - `developer_goal_context_is_contextual_without_invalidating_by_itself`
  - `mixed_developer_goal_context_remains_non_contextual`
- `codex-rs/core/src/context_manager/history_tests.rs`
  - `drop_last_n_user_turns_trims_developer_goal_context_above_rolled_back_turn`
  - `user_goal_context_is_not_a_user_turn_boundary`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
  - `reconstruct_history_filters_pure_goal_context_from_replacement_history`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
  - `ignores_goal_context_response_items_in_rollout_replay`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
  - delete any old `suppresses_goal_context_raw_response_item_notifications`
    or equivalent Goal-specific raw-stream filtering assertion if present

After deletion, any remaining legacy `<goal_context>` coverage must be limited
to old artifact cleanup or typed projection hiding. It must not defend active
Goal steering.

Keep or adapt `emits_goal_context_raw_response_item_notifications` when it
proves the desired raw contract: raw response item notifications remain raw for
legacy Goal artifacts, current internal-context items, and mixed prose. That
test is not fake-shim preservation when it rejects local raw suppression.

## Delete Local-Only Core Overlay Tests

Delete these local-only tests during prep. They encode behavior that the new
contracts replace.

- `codex-rs/core/src/session/tests.rs`
  - `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`
  - `late_goal_steering_injection_is_not_persisted_unsampled`
  - `configured_goal_objective_limit_allows_longer_goals`

Replacement coverage comes later:

- resume hydration without fabricated Initial
- pending durable cadence intent surviving failed same-turn injection
- upstream objective limit behavior from the command/validation baseline

## Delete Local-Only App-Server Steering Overlay

Delete this local-only test during prep:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - `thread_goal_set_active_schedules_developer_role_goal_steering`

It has the right instinct, but it pins the old marker transport and scheduling
shape. Replace it later with a final model request input test that proves:

- exactly one current Goal steering item is present
- its outer role is `developer`
- its text uses the current Goal internal-context representation
- no active `<goal_context>` item is emitted
- no user-role Goal steering item is emitted

## Delete Local-Only TUI Overlay Tests

Delete these local-only tests during prep. They are not upstream baseline.

- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
  - `goal_slash_command_uses_configured_objective_limit`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
  - `goal_pause_interrupts_active_turn_after_status_event`
  - `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
  - `ctrl_c_interrupts_active_turn_without_pausing_goal`
  - `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`
  - `paused_idle_ctrl_c_requests_quit_without_goal_mutation`

These behaviors are not rejected as product behavior. They are removed from the
prep suite because they are local overlay tests. Add replacement tests later
from the new command, pause/resume, and interruption contracts.

## Revert Steering-Role Config Overlay

Remove local config tests and assertions for `GoalSteeringRole`.

- `codex-rs/core/src/config/config_tests.rs`
  - remove `[goals] steering_role = "developer"` assertions
  - remove `[goals] steering_role = "user"` assertions
  - remove mixed `objective_max_chars` plus `steering_role` assertions

The replacement must not preserve user-role Goal steering. Objective limit tests
must have no steering-role configuration dependency.

## Revert Existing Test Files To Upstream Baseline

For these files, the prep action is to remove local Goal test overlay hunks and
return Goal tests to the `rust-v0.136.0` baseline. Do not delete the upstream
Goal product tests from these files.

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Use file-specific diffs against `rust-v0.136.0`; do not blindly reset unrelated
work in these files.

## Upstream Baseline Tests That Remain Active

These tests are upstream baseline. They should remain after prep, though their
internals may be updated later when the replacement architecture requires a new
helper or assertion style.

Core Goal runtime/tool behavior:

- `codex-rs/core/src/session/tests.rs`
  - `interrupt_accounts_active_goal_without_pausing`
  - `shutdown_without_active_turn_keeps_active_goal_active`
  - `active_goal_continuation_runs_again_after_no_tool_turn`
  - `pending_request_user_input_does_not_spawn_extra_goal_continuation`
  - `create_thread_goal_fills_empty_thread_preview`
  - `budget_limited_accounting_steers_active_turn_without_aborting`
  - `usage_limit_runtime_stops_active_goal_and_prevents_idle_continuation`
  - `external_goal_mutation_accounts_active_turn_before_status_change`
  - `external_active_goal_set_marks_current_turn_for_accounting`
  - `create_goal_tool_rejects_existing_goal`
  - `update_goal_tool_rejects_pausing_goal`
  - `update_goal_tool_marks_goal_blocked`
  - `update_goal_tool_rejects_usage_limited_goal`
  - `update_goal_tool_marks_goal_complete`

App-server Goal API behavior:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - `thread_goal_get_rejects_unmaterialized_thread`
  - `thread_resume_keeps_paused_goal_paused`
  - `thread_goal_set_preserves_budget_limited_same_objective`
  - `thread_goal_set_persists_resumable_stopped_statuses`
  - `thread_goal_set_edits_objective_without_resetting_usage`
  - `thread_goal_clear_deletes_goal_and_notifies`

TUI `/goal` command and validation behavior:

- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
  - `goal_slash_command_accepts_objective_at_limit`
  - `goal_slash_command_accepts_multiline_objective_after_blank_first_line`
  - `goal_slash_command_rejects_oversized_objective`
  - `goal_slash_command_rejects_large_paste_using_expanded_length`
  - `goal_slash_command_giant_paste_uses_goal_specific_error`
  - `queued_goal_slash_command_rejects_oversized_objective_and_drains_next_input`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
  - `goal_slash_command_drops_attached_images`
  - `goal_slash_command_uses_plain_text_for_mentions`
  - `bare_goal_slash_command_drains_pending_submission_state`
  - `goal_control_slash_commands_emit_goal_events`
  - `goal_edit_slash_command_opens_goal_editor`
  - `queued_goal_slash_command_emits_set_goal_event_after_thread_starts`
  - `queued_goal_slash_command_preserves_current_draft_metadata`
  - `restored_queued_goal_slash_command_emits_set_goal_event`
  - `active_goal_without_follow_up_suppresses_agent_turn_complete_notification`

TUI status, budget, review, and action behavior:

- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
  - `status_line_goal_active_token_budget_footer_snapshot`
  - `status_line_goal_complete_elapsed_footer_snapshot`
  - `session_configured_clears_goal_status_footer`
  - `thread_goal_update_for_other_thread_is_ignored`
  - `goal_status_indicator_formats_statuses_and_budgets`
  - `goal_status_indicator_line_formats_goal_text`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
  - `interrupted_turn_after_goal_budget_limited_uses_budget_message_snapshot`
  - `direct_budget_limited_turn_uses_budget_message_snapshot`
  - `budget_limited_turn_restores_queued_input_without_submitting`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
  - `thread_goal_error_message_explains_temporary_session`
  - `thread_goal_ephemeral_error_message_renders_snapshot`
  - `thread_goal_error_message_preserves_generic_failure_context`
  - `completed_goal_does_not_require_replace_confirmation`
  - `unfinished_goals_require_replace_confirmation`

Extension backend baseline:

- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - restore the file to the upstream baseline during prep

An implementation slice that removes or converts `ext/goal` active Goal
steering must update or remove extension tests in that same slice. Do not let
the old extension tests keep `GoalContext` or `<goal_context>` alive.

## Replacement Test Profile To Add After Prep

Add these tests after the implementation shape exists. These are not optional
items to debate later; they are the new tests that replace the deleted local
overlay.

Final model request input:

- Initial steering is one outer developer-role Goal item.
- ObjectiveUpdated steering is one outer developer-role Goal item rendered from
  persisted updated durable state.
- BudgetLimit steering is one outer developer-role Goal item rendered from
  persisted budget/status state.
- Automatic Continuation steering is one outer developer-role Goal item and is
  launched only by the idle predicate.
- No replacement steering test requires active `<goal_context>`.
- No user-role Goal steering item is emitted.

Durable pending cadence intent:

- creating an active Goal persists pending Initial intent
- Initial intent is consumed only when final model request input contains the
  matching developer-role item
- ObjectiveUpdated intent remains pending when same-turn injection is unavailable
- BudgetLimit intent remains pending when same-turn injection is unavailable
- BudgetLimit supersedes older Initial or ObjectiveUpdated intent for the same
  Goal

Resume and idle lifecycle:

- resume reloads durable Goal facts and pending intent
- resume does not create Initial merely because a durable active Goal exists
- already-consumed Initial is not re-emitted after resume
- pending non-Goal work runs before Goal-owned synthetic turns
- trigger-turn mailbox work runs before Goal-owned synthetic turns
- automatic Continuation does not repeat for unchanged Goal, history, and
  durable facts versions
- a new non-Continuation model-visible history change permits a later
  automatic Continuation

Repair and legacy artifacts:

- request-local repair can restore missing developer-role Goal authority at a
  seam without creating a new cadence event
- duplicate current Goal items are deduplicated
- wrong-role current Goal items are replaced or rejected
- legacy `<goal_context>` alone does not create durable Goal state or cadence
  intent
- raw response item notifications are not specially suppressed for Goal context

Local behavior re-additions:

- Ctrl+C during an active turn interrupts without mutating Goal state
- Ctrl+C with queued input preserves predictable queue behavior
- pause/resume command behavior is tested from the replacement state machine
- the local configured objective limit extension is re-added only from a
  specific replacement command/config contract

## Snapshot Handling

During prep:

- delete snapshots only when deleting their local-only owner test
- restore upstream-owned Goal snapshots to `rust-v0.136.0` baseline when local
  edits changed them
- do not delete upstream snapshots merely because they mention Goal, budget,
  usage, statuses, or `/goal`

During replacement implementation:

- update snapshots only when the user-visible output intentionally changes
- add new snapshots for replacement UI behavior introduced by the rewrite
