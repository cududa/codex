# Goal Test Prep And Replacement Proof

## Navigation Header

This successor doc is the test-prep and replacement-proof contract for the
Goal authority rewrite. It answers which local tests are reset, deleted,
retained, replaced, or snapshotted, and which proof layer must verify each
replacement invariant.

- Role: canonical test prep, upstream baseline, replacement matrix, snapshot,
  and final acceptance proof index.
- Owns: local-only overlay deletion; upstream baseline restoration;
  replacement proof matrix; extension baseline caveat; snapshot handling;
  final acceptance proof layers; and stale-symbol audit gates as review gates.
- Does not own: behavior contracts, cadence semantics, durable storage
  design, final request-input shaping, idle/history scheduling, evidence
  persistence, classifier/projection semantics, extension lifecycle,
  implementation architecture, product redesign, module names, migration
  names, test filenames for new replacement tests, or readiness/handoff
  status.
- Read with: all behavior and seam successors. This doc collects proof
  obligations; those successors own the behavior being proved.
- Fidelity note: the prep target is not fewer Goal tests. It is removal of
  false compatibility pressure while preserving upstream product baseline and
  adding replacement tests from the corrected authority contracts.

## Core Rule

Test prep removes tests that defend the broken local Goal steering overlay,
restores upstream Goal product behavior to the selected baseline, and then
adds replacement tests that prove the successor authority contracts.

Tests are proof obligations. They do not define Goal behavior, product
behavior, architecture, cadence, durable state, final request input, evidence,
cleanup, extension reachability, or readiness. If a test expectation conflicts
with a behavior or seam successor, the successor controls and the test must be
changed.

For this prep route, the upstream baseline is:

```text
rust-v0.136.0
```

Budget and usage are upstream Goal facts, not local experiments. The
replacement profile must keep these facts visible:

```text
token_budget
tokens_used
time_used_seconds
UsageLimited
BudgetLimited
```

## Prep Sequence

Before implementing the active Goal authority rewrite:

1. Revert Goal-related test hunks in upstream-owned test files back to
   `rust-v0.136.0` behavior.
2. Delete local-only tests that defend fake context, bad cadence, user-role
   active steering, local raw suppression, configured steering role, or local
   overlay behavior.
3. Keep upstream Goal product tests active as the baseline profile.
4. Add replacement tests from the behavior and seam successors after the
   replacement implementation shape exists.

Do not keep a local test merely because current code passes it. Do not delete
an upstream Goal behavior test merely because current local code would fail it
after active fake-shim removal. Use file-specific diffs against
`rust-v0.136.0`; do not blindly reset unrelated work in upstream test files.

Replacement tests must prove behavior through the correct proof layer:

- final `/responses` payload or equivalent final request-input capture for
  active authority and role
- durable state tests for facts, pending intent, exact-key consumption, and
  state-owned Continuation suppression records
- Created-event commit tests for pending-intent consumption, committed carry,
  Continuation suppression advancement, and evidence emission when in scope
- idle/history tests for wake ordering, pending-work precedence, synthetic
  metadata, model-visible history keys, and suppression comparison
- classifier, projection, raw, compaction, reconstruction, rollback, and fork
  tests for cleanup support behavior
- structured recorded request evidence tests when replay, audit, or
  reconstruction evidence is in scope
- extension/app-server tests for durable mutation outcomes, metadata-only
  wake/recheck, reachability, and the selected extension proof route

Do not accept helper output, classifier output, projection hiddenness, raw
notification output, ordinary rollout items, rollout trace payloads, rendered
Goal text, request metadata, reservations, or pre-finalizer carry as
substitutes for final payload assertions or structured recorded request
evidence.

## Delete Local-Only Fake Context Tests

Delete these local-only tests during prep. They defend `<goal_context>`,
`GoalContext`, `GoalContextRole`, fake hidden provenance, or Goal-specific
raw/event suppression.

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
to old artifact cleanup or typed/materialized projection hiding. It must not
defend active Goal steering.

Keep or adapt raw-emits coverage only when it proves the desired raw contract:
raw response item notifications remain raw for legacy artifacts, current
internal-context items, and mixed prose. That coverage is not fake-shim
preservation when it rejects local raw suppression.

## Delete Local-Only Core Overlay Tests

Delete these local-only tests during prep. They encode behavior that the
successor contracts replace.

- `codex-rs/core/src/session/tests.rs`
  - `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`
  - `late_goal_steering_injection_is_not_persisted_unsampled`
  - `configured_goal_objective_limit_allows_longer_goals`
- `codex-rs/core/src/goals.rs`
  - `goal_steering_message_uses_configured_role_for_all_kinds`

Replacement coverage comes from the owning successors:

- resume hydration without fabricated Initial
- pending durable cadence intent surviving unavailable or rejected same-turn
  metadata
- upstream objective-limit behavior from the command/validation baseline
- active Goal role compatibility unable to make final payload steering
  user-role
- no replacement test accepting active `<goal_context>` or pre-shaper concrete
  Goal input as authority

## Delete Local-Only App-Server Steering Overlay

Delete this local-only test during prep:

- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - `thread_goal_set_active_schedules_developer_role_goal_steering`

It pins the old marker transport and scheduling shape. Replace it later with
final model request-input coverage that proves:

- exactly one current Goal steering item is present
- its outer role is `developer`
- its text uses the current Goal internal-context representation
- no active `<goal_context>` item is emitted
- no user-role Goal steering item is emitted

## Delete Local-Only TUI Overlay Tests

Delete these local-only tests during prep. They are not upstream baseline:

- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
  - `goal_slash_command_uses_configured_objective_limit`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
  - `goal_pause_interrupts_active_turn_after_status_event`
  - `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
  - `ctrl_c_interrupts_active_turn_without_pausing_goal`
  - `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`
  - `paused_idle_ctrl_c_requests_quit_without_goal_mutation`

These behaviors are not rejected as product behavior. They are removed from
the prep suite because they are local overlay tests. Add replacement tests
later from the corrected command, pause/resume, queue, and interruption
contracts.

## Revert Steering-Role Config Overlay

Remove local config tests and assertions for `GoalSteeringRole`.

- `codex-rs/core/src/config/config_tests.rs`
  - remove `[goals] steering_role = "developer"` assertions
  - remove `[goals] steering_role = "user"` assertions
  - remove mixed `objective_max_chars` plus `steering_role` assertions

Replacement tests must not preserve user-role active Goal steering.
Objective-limit tests must have no steering-role configuration dependency.
Compatibility deserialization, if any, must be proven unable to affect active
Goal steering role.

## Revert Existing Test Files To Upstream Baseline

For these files, prep removes local Goal test overlay hunks and restores Goal
tests to the `rust-v0.136.0` baseline. Do not delete upstream Goal product
tests from these files, and do not reset unrelated work.

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

## Upstream Baseline Tests That Remain Active

These tests are upstream baseline and remain active after prep. Their internals
may later adapt to replacement helpers or assertion style, but their product
behavior is not deleted by the authority rewrite.

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
old extension tests keep `GoalContext`, `GoalContextRole`, active
`<goal_context>`, user-role active steering, or pre-finalizer concrete Goal
input alive.

## Replacement Proof Matrix

Replacement tests are added after the implementation shape exists. They are
not optional debate items and they are not behavior owners. Each cluster below
points to the successor that owns the behavior being proved.

### Final Model Request Input

Owned by `goal-authority-behavior.md` and `goal-final-request-input.md`, with
cadence kind selection from `goal-cadence-contract.md`.

Replacement coverage must prove:

- Initial steering is exactly one current outer developer-role Goal item.
- ObjectiveUpdated steering is exactly one current outer developer-role Goal
  item rendered from persisted updated durable state.
- BudgetLimit steering is exactly one current outer developer-role Goal item
  rendered from persisted budget/status state.
- Automatic Continuation steering is exactly one current outer developer-role
  Goal item and is launched only by the idle predicate.
- No replacement steering test requires active `<goal_context>`.
- No user-role Goal steering item is emitted.
- App-server-origin Goal create or objective-update scenarios prove captured
  final `/responses` input contains exactly one current outer developer-role
  Goal item, no active `<goal_context>` item, and no user-role active Goal
  item.
- Compatibility steering-role config, if still parseable, cannot make active
  Goal steering user-role.

### Durable Pending Cadence Intent

Owned by `goal-durable-state-and-pending-intent.md`, with commit timing from
`goal-final-request-input.md` and cadence ranking from
`goal-cadence-contract.md`.

Replacement coverage must prove:

- creating an active Goal persists pending Initial intent
- Initial intent is consumed only when final model request input contains the
  matching developer-role item
- ObjectiveUpdated intent remains pending when same-turn metadata is
  unavailable or rejected
- BudgetLimit intent remains pending when same-turn metadata is unavailable
  or rejected
- BudgetLimit supersedes older Initial or ObjectiveUpdated intent for the same
  Goal only under the durable/final supersedence rules
- exact-key consumption matches thread, Goal, kind, and facts version
- stale consumption attempts do not consume newer, different-kind,
  different-goal, or different-version pending intent

### Resume And Idle Lifecycle

Owned by `goal-idle-history-lifecycle.md`, with state reload from
`goal-durable-state-and-pending-intent.md` and final payload proof from
`goal-final-request-input.md`.

Replacement coverage must prove:

- resume reloads durable Goal facts and pending intent
- resume does not create Initial merely because a durable active Goal exists
- already-consumed Initial is not re-emitted after resume
- pending non-Goal queued work runs before Goal-owned synthetic turns
- trigger-turn mailbox work runs before Goal-owned synthetic turns
- pending Initial, ObjectiveUpdated, or BudgetLimit delivery from idle is not
  automatic Continuation
- automatic Continuation launches only when no active turn, no pending
  non-Goal work, and no pending non-Continuation intent exist
- automatic Continuation does not repeat for unchanged Goal, model-visible
  history key, and durable facts version
- a new non-Continuation model-visible history change permits a later
  automatic Continuation when all lifecycle requirements still hold
- stale reservations or stale Goal-owned synthetic requests clear before
  submission without model send, pending-intent consumption, suppression
  advancement, evidence write, or user-facing request failure

### Model-Visible History And Continuation Suppression

Owned by `goal-idle-history-lifecycle.md` and its history-key section.

Replacement coverage must prove:

- `ContextManager::history_version()` or an equivalent rewrite counter is not
  used as the sole Continuation key
- eligible user, assistant, reasoning, tool, shell, web-search,
  image-generation, mailbox, hook-prompt, and relevant compaction progress can
  change the key
- the automatic Continuation item itself does not change the key that permits
  another Continuation
- pure current Goal items, pure legacy artifacts, stale/wrong/pre-injected
  Goal-looking items, non-progress fragments, raw/UI counts, and helper output
  do not change the key
- durable facts version changes can permit automatic Continuation when the
  eligible history key is unchanged
- resume suppression uses durable/state-owned records first and structured
  evidence only through the evidence successor's non-best-effort policy

### Repair, Classifier, Projection, Raw, And Legacy Artifacts

Owned by `goal-request-repair-and-artifact-classification.md` and
`goal-projection-reconstruction-and-raw-history.md`, with active final-input
effects owned by `goal-final-request-input.md`.

Replacement coverage must prove:

- request-local repair can restore missing developer-role Goal authority at a
  seam without creating a new cadence event
- duplicate current Goal items are deduplicated
- wrong-role current Goal items are replaced or rejected only through final
  request input when cadence-required authority is due
- pure current Goal internal-context items are classified by source `goal`
- pure legacy `<goal_context>` items are classified as legacy artifacts
- pure non-Goal internal context is not classified as Goal
- mixed marker-like ordinary prose remains visible and ordinary
- legacy `<goal_context>` alone does not create durable Goal state, pending
  intent, cadence, objective text, evidence, user-role steering, or
  Continuation suppression
- raw response item notifications are not specially suppressed for Goal
  context
- typed/materialized projection hides only pure current internal-context and
  pure legacy artifacts
- compaction does not reinsert or preserve pre-shaper concrete Goal input as
  authority
- reconstruction filters pure artifacts without recovering Goal facts,
  objective text, pending intent, evidence, committed carry, or watermarks from
  rendered text

### Recorded Request Evidence

Owned by `goal-recorded-request-evidence.md`, with finalized-input identity
from `goal-final-request-input.md` and suppression reconstruction boundaries
from `goal-idle-history-lifecycle.md`.

Replacement coverage must prove:

- structured Goal request evidence is appended only after
  `ResponseEvent::Created`
- retry or stream setup failure before `ResponseEvent::Created` records no
  stale evidence and consumes no pending intent
- stream failure after `ResponseEvent::Created` preserves committed evidence
  and durable commit effects
- evidence fingerprints match the exact developer-role Goal item and the full
  finalized logical request input
- ordinary `RolloutItem::ResponseItem` and rollout trace payloads are not
  accepted as structured Goal commit evidence
- replay pairs evidence with a surviving model-visible Goal item by index and
  fingerprint before treating it as committed evidence
- resume, rollback, fork, and compaction use structured evidence only as
  replay evidence and never parse rendered Goal text for Goal facts or
  Continuation suppression
- classifier matches, raw notifications, ordinary rollout items, rollout trace
  payloads, and rendered Goal text are not accepted as evidence substitutes
- evidence append failure is observable and cannot silently weaken live
  pending-intent or Continuation suppression correctness

### Extension And App-Server Paths

Owned by `goal-extension-lifecycle-and-reachability.md`, with final payload
proof owned by `goal-final-request-input.md`.

Replacement coverage must prove:

- extension-origin `create_goal` remains a valid mutation path when no Goal
  exists and writes durable active Goal facts plus pending Initial intent
- duplicate extension-origin `create_goal` remains a product error
- ObjectiveUpdated and BudgetLimit from extension/app-server producers persist
  durable facts and pending intent before delivery is requested
- unavailable or rejected same-turn metadata leaves pending intent intact
- accepted same-turn metadata is not delivery or consumption
- app-server mutation paths use durable operations and metadata-only wake or
  recheck requests without requiring a `codex-goal-extension` dependency
- no reachable extension path emits `GoalContext`, `GoalContextRole`, active
  `<goal_context>`, user-role active internal context, or pre-finalizer
  concrete `ResponseItem`/`ResponseInputItem` values as active authority
- configuration compatibility cannot make active Goal steering user-role
- extension-related final payload coverage uses either true extension-origin
  integration through a real core request path with mock Responses, or paired
  coverage where extension tests prove durable pending intent, accounting,
  events, and metadata request outcomes while app-server/core tests prove the
  shared request shaper from equivalent pending intent
- paired coverage is identified as paired coverage, not end-to-end
  extension-origin payload coverage
- true extension-origin final payload proof, when selected, shows the same
  exact outer developer-role current Goal item shape required of core-origin
  steering

### Local Behavior Re-Additions

Local overlay tests removed during prep may return only from corrected product
or command/state-machine contracts, not from the broken active steering
overlay.

Replacement coverage may re-add:

- Ctrl+C during an active turn interrupts without mutating Goal state
- Ctrl+C with queued input preserves predictable queue behavior
- pause/resume command behavior tested from the replacement state machine
- local configured objective-limit behavior only from a specific replacement
  command/config contract

## Final Acceptance Proof Layers

WA06 is cleanup and acceptance only. If final acceptance exposes missing
cadence policy, state shape, classifier semantics, extension routing,
evidence behavior, or final-input ownership, the work returns to the owning
earlier successor surface instead of inventing new architecture in acceptance.

Final acceptance proof must use the correct layer for each invariant:

- final `/responses` payload tests for active Goal authority and role
- durable state tests for facts, pending intent, exact-key consumption, and
  Continuation suppression records
- Created-event commit tests for pending-intent consumption, committed carry,
  suppression advancement, and evidence emission when evidence is in scope
- projection/raw tests for typed hiding and raw emission boundaries
- compaction/reconstruction tests for cleanup without concrete carry or
  rendered-text recovery
- extension/app-server tests for durable mutation outcomes and metadata-only
  wake/recheck, plus final payload proof through the selected true-extension
  or paired shared-shaper route

Final stale-symbol audits are review gates, not architecture. Run them after
implementation, inspect every match, and classify matches as deleted terrain,
allowed legacy cleanup fixtures, migration comments, local planning docs, or
explicit rejection comments. Audit regexes must not become blind deletion
scripts or new source-of-truth behavior rules. A match that reveals missing
cadence, classifier, extension, or evidence behavior sends the work back to
the owning earlier successor.

## Snapshot Handling

During prep:

- delete snapshots only when deleting their local-only owner test
- restore upstream-owned Goal snapshots to the `rust-v0.136.0` baseline when
  local edits changed them
- do not delete upstream snapshots merely because they mention Goal, budget,
  usage, statuses, or `/goal`

During replacement implementation:

- update snapshots only when user-visible output intentionally changes
- add new snapshots for replacement UI behavior introduced by the rewrite

Root snapshot-test requirements still apply for any Rust/UI change. This doc
only records the Goal-specific prep and replacement posture.

## Cross-Doc Boundaries

`goal-authority-behavior.md` owns the behavior-level authority shape and the
negative rule that tests are proof, not authority.

`goal-cadence-contract.md` owns steering kinds, cadence-required authority,
ordinary user-turn limits, supersedence, same-turn metadata limits, and repair
not being cadence. This doc indexes cadence tests.

`goal-durable-state-and-pending-intent.md` owns durable facts, facts version,
pending non-Continuation intent, exact-key consumption, mechanical cleanup,
and state-owned Continuation suppression records. This doc indexes state
tests.

`goal-final-request-input.md` owns final request-input shaping, selected item
identity, cleanup inside final input, commit metadata, Created-event commit,
retry/follow-up, committed carry, fingerprints, and final payload proof. This
doc indexes final payload and commit tests.

`goal-idle-history-lifecycle.md` owns idle ordering, pending-work precedence,
Goal-owned synthetic metadata, stale reservations, resume hydration,
model-visible history key, eligible progress, and Continuation suppression.
This doc indexes lifecycle and history-key tests.

`goal-recorded-request-evidence.md` owns structured evidence persistence,
fingerprints, replay pairing, rollback/fork/compaction treatment, raw/typed
projection treatment, and evidence failure policy. This doc indexes evidence
tests.

`goal-request-repair-and-artifact-classification.md` owns classifier outputs,
purity, mixed ordinary preservation, wrong-role cleanup, request-local repair,
and helper non-ownership. This doc indexes classifier and repair tests.

`goal-projection-reconstruction-and-raw-history.md` owns typed/materialized
projection, raw notifications, compaction, rollout reconstruction, rollback,
fork, history-boundary behavior, and legacy artifact cleanup. This doc indexes
projection/raw/history tests.

`goal-extension-lifecycle-and-reachability.md` owns extension/app-server
lifecycle, mutation/accounting participation, metadata-only wake/recheck,
configuration treatment, reachability, and extension proof route. This doc
keeps the baseline caveat and indexes extension proof requirements.

`goal-readiness-and-execution-handoff.md` owns readiness and handoff posture.
This doc does not define readiness status.

## Source Inputs And Coverage

This test-prep surface was synthesized from the accepted successor topology,
architecture requirements, test deletion map, grounding-truth acceptance
standard, primary cadence verification checklist, final request-input tests,
idle continuation tests, model-visible history-key tests, recorded request
evidence tests, repair/classifier tests, extension ownership tests, fake-shim
work-area test bullets, open-design readiness boundary, completed successor
local proof obligations, and Pass 2 / Pass 2B coverage and compression
artifacts.

The Pass 2 and Pass 2B artifacts are coverage, interface, traceability, and
compression checks. They are not the writing order and are not successor
authority by themselves.
