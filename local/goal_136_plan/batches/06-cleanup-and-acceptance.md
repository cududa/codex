# Batch 06: Cleanup And Acceptance

This batch is the final Goal authority cleanup slice.

It removes dead active shim terrain left after Batches 01-05 and proves the
completed rewrite against final request payloads, recorded cadence state, raw
notifications, and typed/materialized projections.

It does not introduce a new architecture. If an implementation reaches this
batch and still needs new cadence policy, new classifier semantics, or new
extension ownership, stop and finish the earlier batch that owns that work.

## Direction Lock

Request:

- author the final cleanup and acceptance batch doc
- use `goal-test-deletion-map.md` heavily
- ground the plan in direct code reads around old active Goal terrain and the
  tests that still defend it
- do not implement Rust code in this planning pass

Authority:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
- `local/goal_136_plan/batches/AGENTS.md`
- `local/goal_136_plan/batches/00-test-prep-and-baseline-reset.md`
- `local/goal_136_plan/batches/01-durable-cadence-state.md`
- `local/goal_136_plan/batches/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/batches/03-history-key-and-idle-continuation.md`
- `local/goal_136_plan/batches/04-ext-goal-conversion.md`
- `local/goal_136_plan/batches/05-repair-classifiers-and-projections.md`

Terrain:

- current v136 still contains active `GoalContext` / `<goal_context>` rendering
  and `GoalContextRole`
- current v136 still contains `GoalSteeringRole` config and user-role steering
  tests
- core Goal producers still construct concrete `ResponseInputItem`s before the
  final request-input seam
- `Session`, `InputQueue`, `TurnState`, and `CodexThread` still expose
  Goal-specific concrete injection and carry APIs
- local and remote compaction still read concrete current-turn Goal items in
  the current tree
- app-server raw response handling still suppresses pure Goal context raw
  notifications in the current tree
- `ext/goal` still stores steering role config, builds `GoalContext`, and
  injects concrete model input through core
- local overlay tests still assert active `<goal_context>`, user-role steering,
  raw suppression, concrete carry, and resume-fabricated Initial behavior

Code-shape temptation:

- keep old symbols as compatibility wrappers because many callsites already
  compile against them
- treat a private `GoalContext` or `GoalSteeringRole::Developer` hard-map as
  harmless once the finalizer exists
- let Batch 06 add missing classifier or cadence behavior because the old
  callsites are still visible
- preserve local tests that pass today by rewriting them around the old marker
  transport

Locked direction:

- require Batches 01-05 replacement surfaces to exist before this batch starts
- delete reachable active producers and public exports for `GoalContext`,
  `GoalContextRole`, active `<goal_context>`, `GoalSteeringRole`, concrete
  Goal injection, concrete Goal carry, and raw Goal suppression
- leave legacy `<goal_context>` handling only behind the Batch 05 shared
  classifier and only for cleanup/projection/raw-contract tests
- keep active authority in `goal_cadence.rs` final request-input shaping and
  Created-event commit
- prove success with final `/responses` payload tests, state/commit tests,
  projection/raw tests, and final grep/audit commands

Exclusions:

- no new durable state shape beyond Batches 01 and 03
- no new cadence policy beyond Batches 02 and 03
- no new classifier architecture beyond Batch 05
- no app-server Goal product API redesign
- no persisted pending Continuation intent
- no rendered-text parsing to recover active Goal state, objective, pending
  intent, or watermark state
- no user-role active Goal steering compatibility

## Bounded Code Terrain Read

Files read directly for this batch:

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
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
- `codex-rs/core/src/stream_events_utils.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/item.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- named local overlay tests in `goal-test-deletion-map.md`
- `codex-rs/core/tests/common/responses.rs`

Findings:

- `goal_context.rs` is still both active renderer and legacy artifact
  detector. It defines markers, `GoalContext`, `GoalContextRole`,
  `into_response_input_item(...)`, `is_goal_context_text(...)`, and
  `is_goal_context_response_item(...)`.
- `context/mod.rs` publicly exports `GoalContext` and `GoalContextRole`, and
  crate-exports `is_goal_context_*` predicates.
- `goals.rs` still imports `GoalContext`, `GoalSteeringRole`,
  `GoalSteeringCarryPurpose`, and `ResponseInputItem`. `GoalSteeringMessage`
  delegates to `GoalContext::new(prompt).into_response_input_item(role.into())`.
- `goals.rs` still uses runtime-only Initial state through
  `initial_steering_goal_id`, `mark_initial_goal_steering_pending(...)`,
  `goal_steering_kind_for(...)`, and `take_initial_goal_steering(...)`.
- `goals.rs` still injects ObjectiveUpdated and BudgetLimit steering by
  building concrete `ResponseInputItem`s and calling
  `inject_goal_response_items(...)`.
- current idle continuation builds `GoalContinuationCandidate { items:
  Vec<ResponseInputItem> }` and extends pending input with
  `extend_goal_pending_input_for_turn_state(...)`.
- `run_sampling_request(...)` currently builds `Prompt` directly from the
  per-attempt `Vec<ResponseItem>`. Batch 02 must have inserted the finalizer at
  this seam before Batch 06 can remove old active paths.
- `TurnState` still stores `GoalSteeringCarryItem { purpose, item:
  ResponseInputItem }` and exposes `current_turn_goal_steering_items()`.
- `InputQueue`, `Session`, and `CodexThread` still expose Goal-specific
  concrete injection/carry methods.
- `compact.rs` and `compact_remote.rs` currently append
  `sess.current_turn_goal_steering_items()` during mid-turn compaction.
- `compact.rs`, `compact_remote.rs`, and `rollout_reconstruction.rs` still
  depend on `is_goal_context_response_item(...)` in the current tree.
- `event_mapping.rs`, `contextual_user_message.rs`, `history.rs`, and
  rollout truncation depend on contextual predicates that currently include
  Goal marker logic.
- `app-server/src/bespoke_event_handling.rs` has a duplicate local
  `is_goal_context_*` implementation and suppresses pure Goal context raw
  response item notifications.
- app-server typed/materialized preview and summary paths mostly consume
  `codex_core::parse_turn_item(...)`, so final projection behavior should be
  proven through core projection and app-server replay tests, not duplicated
  app-server classifiers.
- `ext/goal/src/steering.rs` directly imports `GoalContext`,
  `GoalContextRole`, and `ResponseInputItem`.
- `ext/goal/src/extension.rs` stores `GoalContextRole` in
  `GoalExtensionConfig`, accepts a `goal_steering_role` closure, and contains
  TODO text preserving `GoalSteeringRole`, role-neutral `<goal_context>`, and
  injection timing as future active design.
- `ext/goal/src/runtime.rs` accepts `GoalContextRole`, calls
  `goal_steering_item(...)`, and injects through
  `ThreadManager::inject_goal_steering_items_into_active_turn(...)`.
- `ext/goal/src/tool.rs` still creates active Goals through facts-only
  `insert_thread_goal(...)`; Batch 04 must have converted this to
  cadence-aware service/state APIs before final cleanup.
- `ResponsesRequest` test helpers already expose `input()`,
  `message_input_texts(...)`, and `message_input_text_groups(...)`, so final
  acceptance tests can inspect captured `/responses` payloads structurally.

## Ownership Split For This Batch

Batch 06 deletes dead ownership. It does not move behavior into new owners.

- `codex-rs/core/src/goal_cadence.rs` remains the deep module for active Goal
  authority. Batch 06 may update imports or tests around it, but must not split
  cadence selection, developer-role item construction, request cleanup, commit
  metadata, or Continuation watermark commit into new helper owners.
- `codex-rs/core/src/goal_artifacts.rs` or the Batch 05 equivalent remains the
  classifier module. Batch 06 may move the last legacy marker constants into it
  if needed, but must not add cadence decisions there.
- `codex-rs/core/src/context/internal_context.rs` or the Batch 05 equivalent
  owns source-tagged internal-context rendering and parsing.
- `codex-rs/ext/goal/src/api.rs` or the Batch 04 equivalent owns extension-side
  mutation/accounting service outcomes. It must not construct active model
  input.
- `codex-rs/core/src/goals.rs` remains transitional lifecycle/tool/runtime
  adapter terrain. It may retain prompt-body helpers and accounting adapters,
  but it must not retain active model-input construction or role choice.
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs` may retain non-Goal pending input and
  committed Goal metadata introduced by Batches 02-04. They must not retain
  concrete Goal `ResponseInputItem` carry as authority.

## Required Preconditions

Do this batch only after the following are true in code:

1. Batch 01 durable cadence state exists.

   Required evidence:

   - `ThreadGoal` exposes facts versioning or the accepted equivalent
   - pending Initial, ObjectiveUpdated, and BudgetLimit intent is structured
   - exact-key pending intent consumption exists

2. Batch 02 final request-input shaping exists.

   Required evidence:

   - `codex-rs/core/src/goal_cadence.rs` or the accepted equivalent is wired
     into every sampling attempt before `build_prompt(...)`
   - commit metadata refers to the exact final `ResponseItem`
   - commit happens on `ResponseEvent::Created`

3. Batch 03 idle Continuation is converted.

   Required evidence:

   - `ModelVisibleHistoryKey` or the accepted equivalent is structured
   - automatic Continuation uses typed idle request metadata
   - Continuation watermark commits only after Created
   - resume hydrates pending intent and does not fabricate Initial

4. Batch 04 extension/app-server producers are converted.

   Required evidence:

   - reachable `ext/goal` producers no longer construct `ResponseItem` or
     `ResponseInputItem` for active Goal steering
   - extension/app-server mutations write pending cadence intent through the
     shared service/state path
   - same-turn delivery requests carry metadata or wake/recheck intent only

5. Batch 05 classifier/projection cleanup exists.

   Required evidence:

   - shared classifier distinguishes current Goal internal context, legacy
     `<goal_context>`, non-Goal internal context, and mixed ordinary content
   - raw app-server Goal suppression has been removed or is explicitly being
     removed in this batch
   - compaction and reconstruction no longer use concrete pre-finalizer Goal
     carry

If any precondition is missing, do not land Batch 06. Finish the owning earlier
batch instead.

## Required Edits

### 1. Delete Core GoalContext Active Shim

Edit:

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/goal_artifacts.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`

Required outcome:

- delete `GoalContext`
- delete `GoalContextRole`
- delete `GoalContext::into_response_input_item(...)`
- delete active `<goal_context>` rendering from context infrastructure
- remove public exports of `GoalContext` and `GoalContextRole`
- remove crate exports of `is_goal_context_text(...)` and
  `is_goal_context_response_item(...)`
- move any remaining legacy marker constants or pure legacy artifact detection
  into the Batch 05 classifier module, not into `context`

Allowed remaining behavior:

- the shared classifier may recognize pure legacy `<goal_context>` artifacts
  for cleanup/projection/raw-contract tests
- tests in the classifier module may contain literal `<goal_context>` fixtures
  when they prove legacy artifact handling only

Not allowed:

- any active producer calling `GoalContext::new(...)`
- any role abstraction named `GoalContextRole`
- any conversion path from a Goal prompt body to `ResponseInputItem` outside
  `goal_cadence.rs`
- any `ContextualUserFragment` implementation for active Goal steering

### 2. Remove Goal Steering Role Config As Active API

Edit:

- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/core/config.schema.json`
- any generated TypeScript or schema fixtures affected by config generation
- any extension config tests that still vary active steering role

Required outcome:

- remove `GoalSteeringRole` as an exported active role type
- remove `GoalsToml::steering_role`
- remove `GoalsConfig::steering_role`
- remove config tests that assert `[goals] steering_role = "developer"` or
  `[goals] steering_role = "user"`
- keep objective limit behavior independent of steering role
- regenerate config schema if `ConfigToml` or nested config types change

Compatibility option:

- if the implementation deliberately accepts old config files for one
  transition, use a private ignored TOML field or private compatibility enum
  whose values have no active steering effect
- tests for that compatibility must assert the old key cannot make active Goal
  steering user-role
- do not keep the exported name `GoalSteeringRole`
- do not keep `GoalsConfig::steering_role`

Not allowed:

- active Goal steering role selected from config
- user-role active Goal steering under any compatibility setting
- extension config storing `GoalContextRole` or role-equivalent state

### 3. Delete Core Active Steering Producer Terrain

Edit:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/state/mod.rs`
- `codex-rs/core/src/lib.rs`
- `codex-rs/core/src/codex_thread.rs`

Delete these active old-path symbols when no replacement caller needs them:

- `GoalSteeringMessage`
- `GoalContinuationCandidate.items`
- runtime-only `initial_steering_goal_id`
- `mark_initial_goal_steering_pending(...)`
- `goal_steering_kind_for(...)`
- `take_initial_goal_steering(...)`
- `GoalSteeringInjectionPhase`
- `GoalSteeringCarryPurpose`
- `GoalSteeringCarryItem`
- `TurnState::append_current_turn_goal_steering_items(...)`
- `TurnState::current_turn_goal_steering_items(...)`
- `InputQueue::extend_goal_pending_input_for_turn_state(...)`
- `InputQueue::inject_goal_response_items(...)`
- `InputQueue::current_turn_goal_steering_items(...)`
- `InputQueue::close_goal_steering_injection_if_idle(...)`
- `Session::inject_goal_response_items(...)`
- `Session::current_turn_goal_steering_items(...)`
- `Session::close_goal_steering_injection_if_no_pending_input(...)` if it has
  no non-Goal replacement responsibility
- `CodexThread::inject_goal_steering_items_into_active_turn(...)`
- `pub use state::GoalSteeringCarryPurpose`

Replace old behavior with already-landed batch surfaces:

- Initial, ObjectiveUpdated, and BudgetLimit creation use durable pending
  cadence intent from Batch 01 and producer conversions from Batches 02/04.
- idle pending delivery and automatic Continuation use typed request metadata
  from Batch 03.
- same-turn delivery requests use Batch 04 metadata/wake/recheck plumbing.
- committed carry, if still needed for compaction or diagnostics, is metadata
  about the finalized item, not `ResponseInputItem`.
- prompt body helpers may remain in `goals.rs` only when they return body text
  and are called by `goal_cadence.rs` or the accepted prompt-body owner.

Audit carefully before deleting:

- `budget_limit_reported_goal_id` may remain only if it is strictly
  producer-side event or metric de-duplication and cannot consume, clear, or
  suppress durable BudgetLimit pending intent.
- `ResponseInputItem` may remain in `goals.rs` only for non-Goal tool/runtime
  behavior. A Goal prompt-body-to-`ResponseInputItem` path must be gone.

Not allowed:

- constructing a Goal `ResponseItem` or `ResponseInputItem` before the
  Batch 02 finalizer
- appending a rendered Goal prompt to turn pending input
- keeping current-turn concrete Goal items as compaction authority
- marking Initial pending in runtime because a durable active Goal exists on
  resume

### 4. Delete Or Reduce Extension Steering

Edit:

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Preferred outcome:

- delete `ext/goal/src/steering.rs`

Allowed fallback:

- reduce `steering.rs` to prompt-body helpers only if those helpers are still
  used by the Batch 02 finalizer or a shared prompt-body module

Required deletion:

- imports of `codex_core::context::GoalContext`
- imports of `codex_core::context::GoalContextRole`
- active `ResponseInputItem` / `ResponseItem` construction for Goal steering
- `GoalSteeringFrame`
- `goal_steering_item(...)` returning model input
- `GoalExtensionConfig.steering_role`
- `goal_steering_role` closure plumbing
- `runtime.inject_active_turn_goal_steering(...)`
- runtime calls to `ThreadManager::inject_goal_steering_items_into_active_turn(...)`
- TODO/comment text that preserves configured steering role,
  role-neutral `<goal_context>`, hidden-context classification, or concrete
  injection timing as active architecture

Required replacement posture:

- extension tool, runtime, and app-server adapters call the Batch 04
  `GoalService`-style interface
- service outcomes carry durable facts, previous facts, pending intent
  metadata, accounting effects, and cadence delivery requests
- extension-origin active Goal steering is proven only by final `/responses`
  payload tests through `goal_cadence.rs`

### 5. Finish Batch 05 Consumer Cleanup Audit

Edit only if earlier batches left reachable old callsites:

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/thread_rollout_truncation.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- app-server typed/materialized projection tests

Required outcome:

- no consumer imports `crate::context::is_goal_context_*`
- no consumer calls a Goal-only marker predicate outside the shared classifier
- typed/materialized projection hides pure current Goal internal context and
  pure legacy artifacts through Batch 05 classifier behavior
- raw response item notifications stay raw
- mixed marker-like ordinary prose remains ordinary visible content
- compaction and rollout reconstruction never parse rendered Goal text to
  recover state, objective, pending intent, or watermark

Not allowed:

- reintroducing a local mini-classifier in app-server
- hiding raw Goal response items because typed projection hides them
- preserving old `is_goal_context_*` functions under new names
- adding a helper named or shaped like `has_current_goal_authority(...)` outside
  the finalizer

### 6. Finish App-Server Raw Notification Cleanup

Edit:

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs` only if raw
  opt-in routing needs test adjustment
- `codex-rs/app-server-protocol/src/protocol/v2/item.rs` only if tests require
  additional builders; no wire shape change is expected

Required outcome:

- remove app-server-local `is_goal_context_response_item(...)`
- remove app-server-local `is_goal_context_text(...)`
- remove the early return from `maybe_emit_raw_response_item_completed(...)`
  for Goal-looking items
- keep hook prompt special handling unchanged when raw events are disabled
- raw notifications emit pure current Goal internal context, pure legacy
  `<goal_context>`, and mixed Goal-looking items unchanged

Do not change `RawResponseItemCompletedNotification` wire shape.

### 7. Complete Test Deletion Map

Use `local/goal_research/goal-test-deletion-map.md` as the checklist.

Delete or verify already deleted local-only fake context tests:

| File | Tests |
| --- | --- |
| `codex-rs/core/src/context/contextual_user_message_tests.rs` | `detects_goal_context_fragment`; `goal_context_response_input_item_uses_explicit_steering_role` |
| `codex-rs/core/src/event_mapping_tests.rs` | `goal_context_does_not_parse_as_visible_turn_item`; `developer_goal_context_is_contextual_without_invalidating_by_itself`; `mixed_developer_goal_context_remains_non_contextual` |
| `codex-rs/core/src/context_manager/history_tests.rs` | `drop_last_n_user_turns_trims_developer_goal_context_above_rolled_back_turn`; `user_goal_context_is_not_a_user_turn_boundary` |
| `codex-rs/core/src/session/rollout_reconstruction_tests.rs` | `reconstruct_history_filters_pure_goal_context_from_replacement_history` |
| `codex-rs/app-server-protocol/src/protocol/thread_history.rs` | `ignores_goal_context_response_items_in_rollout_replay` |
| `codex-rs/app-server/src/bespoke_event_handling.rs` | `suppresses_goal_context_raw_response_item_notifications` |

Delete or verify already deleted local-only core overlay tests:

| File | Tests |
| --- | --- |
| `codex-rs/core/src/session/tests.rs` | `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`; `late_goal_steering_injection_is_not_persisted_unsampled`; `configured_goal_objective_limit_allows_longer_goals` |
| `codex-rs/core/src/goals.rs` | `goal_steering_message_uses_configured_role_for_all_kinds` |

Delete or verify already deleted local-only app-server steering overlay:

| File | Tests |
| --- | --- |
| `codex-rs/app-server/tests/suite/v2/thread_resume.rs` | old marker-based `thread_goal_set_active_schedules_developer_role_goal_steering` body |

The app-server scenario may remain, but it must assert final `/responses`
payload shape:

- exactly one current Goal steering item when cadence is due
- outer role is `developer`
- text uses current `source="goal"` internal-context representation
- no active `<goal_context>` item is emitted
- no user-role Goal steering item is emitted

Delete or verify already deleted local-only TUI overlay tests:

| File | Tests |
| --- | --- |
| `codex-rs/tui/src/chatwidget/tests/goal_validation.rs` | `goal_slash_command_uses_configured_objective_limit` |
| `codex-rs/tui/src/chatwidget/tests/slash_commands.rs` | `goal_pause_interrupts_active_turn_after_status_event`; `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal` |
| `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs` | `ctrl_c_interrupts_active_turn_without_pausing_goal`; `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`; `paused_idle_ctrl_c_requests_quit_without_goal_mutation` |

Do not delete upstream baseline Goal product tests from:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/tui/src/chatwidget/tests/goal_validation.rs`
- `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
- `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
- `codex-rs/tui/src/chatwidget/tests/review_mode.rs`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

If these files still contain local overlay hunks, restore only those hunks to
the `rust-v0.136.0` baseline or rewrite them to the replacement contract from
Batches 02-05. Do not reset unrelated work.

### 8. Add Final Acceptance Tests

Do not add broad tests that merely prove helper text. Use final request input,
state, projection, or raw notification outputs.

Required final payload coverage:

- Initial steering reaches `/responses` as exactly one developer-role current
  Goal internal-context item.
- ObjectiveUpdated steering reaches `/responses` as exactly one developer-role
  item rendered from persisted updated durable state.
- BudgetLimit steering reaches `/responses` as exactly one developer-role item
  rendered from persisted usage/status state.
- automatic Continuation reaches `/responses` as exactly one developer-role
  item only from the idle predicate.
- ordinary user turn with active durable Goal and no due cadence emits no fresh
  Goal item.
- no final `/responses` input contains active `<goal_context>`.
- no final `/responses` input contains user-role active Goal steering.

Required state/commit coverage:

- pending Initial, ObjectiveUpdated, and BudgetLimit intent survives until
  Created-event commit.
- pending intent consumption requires exact goal id, kind, and facts version.
- retry before Created leaves pending intent intact.
- retry after Created does not duplicate delivery.
- automatic Continuation watermark advances only after Created.
- resume hydrates existing pending intent but does not create Initial from
  active durable Goal state alone.

Required projection/raw coverage:

- typed/materialized projection hides pure current Goal internal context.
- typed/materialized projection hides pure legacy `<goal_context>`.
- typed/materialized projection preserves mixed marker-like user prose.
- raw response item notifications emit pure current Goal internal context.
- raw response item notifications emit pure legacy `<goal_context>`.
- raw response item notifications emit mixed Goal-looking items.

Required cleanup coverage:

- compaction does not reinsert pre-finalizer concrete Goal input.
- reconstruction does not recover active Goal state from legacy marker text.
- old extension/app-server-origin mutations deliver through finalizer payload
  tests, not prompt helper assertions.
- old `goals.steering_role = "user"` config, if still accepted for
  compatibility, cannot affect final payload role.

## Final Audit Commands

Run these audits after implementation and inspect every match. These are
review gates, not blind deletion scripts.

### Active Shim Symbol Audit

```powershell
rg -n "GoalContext|GoalContextRole|GoalSteeringRole|steering_role|<goal_context>|goal_context|GOAL_CONTEXT" `
  codex-rs/core/src `
  codex-rs/config/src `
  codex-rs/ext/goal/src `
  codex-rs/app-server/src `
  codex-rs/app-server-protocol/src `
  codex-rs/core/tests `
  codex-rs/ext/goal/tests `
  codex-rs/app-server/tests `
  codex-rs/tui/src
```

Allowed matches:

- legacy `<goal_context>` fixtures in `goal_artifacts` classifier tests
- legacy `<goal_context>` fixtures in projection, compaction, reconstruction,
  and raw notification tests that prove artifact cleanup or raw emission
- comments in this implementation plan are not part of code audit

Disallowed matches:

- active production construction of `GoalContext`
- production `GoalContextRole`
- production `GoalSteeringRole`
- active `<goal_context>` rendering
- tests asserting active `<goal_context>` final payload
- tests asserting user-role Goal steering
- app-server raw suppression helpers

### Concrete Injection And Carry Audit

```powershell
rg -n "inject_goal_response_items|inject_goal_steering_items_into_active_turn|extend_goal_pending_input_for_turn_state|current_turn_goal_steering_items|GoalSteeringCarry|GoalSteeringInjectionPhase|append_current_turn_goal_steering_items|close_goal_steering_injection" `
  codex-rs/core/src `
  codex-rs/ext/goal/src `
  codex-rs/core/tests `
  codex-rs/ext/goal/tests `
  codex-rs/app-server/tests
```

Expected result:

- no matches for old concrete active Goal injection or concrete carry
- matches for committed metadata types are allowed only if names make clear
  they are committed/finalized metadata and do not expose `ResponseInputItem`

### Pre-Finalizer Goal Model-Input Construction Audit

```powershell
rg -n "ResponseInputItem|ResponseItem|into_response_input_item|Message \\{ role" `
  codex-rs/core/src/goals.rs `
  codex-rs/ext/goal/src `
  codex-rs/core/src/session/input_queue.rs `
  codex-rs/core/src/state/turn.rs
```

Expected result:

- no Goal prompt-body-to-model-input construction outside `goal_cadence.rs`
- `ResponseInputItem` matches in these files must be unrelated to active Goal
  steering or removed

### Raw Suppression Audit

```powershell
rg -n "is_goal_context_response_item|is_goal_context_text|RawResponseItemCompleted|maybe_emit_raw_response_item_completed" `
  codex-rs/app-server/src `
  codex-rs/app-server-protocol/src
```

Expected result:

- no app-server-local Goal marker helper
- no raw Goal suppression branch
- raw notification type remains unchanged

### Request Payload Acceptance Audit

Use focused request-capture tests and inspect failures at the payload helper
level. Tests should use:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`
- `ResponsesRequest::message_input_texts("user")`

Do not accept tests that inspect only prompt helper output or classifier output
for active authority.

## Focused Tests

Implementation validation should reuse the focused tests introduced by earlier
batches plus the final cleanup tests added here.

Run formatting first:

```powershell
cd codex-rs
just fmt
```

If `ConfigToml`, `GoalsToml`, `GoalsConfig`, or generated config schema
changed:

```powershell
cd codex-rs
just write-config-schema
```

Focused state tests:

```powershell
cd codex-rs
cargo test -p codex-state --lib goal_cadence
cargo test -p codex-state --lib goal_cadence_continuation_watermark
```

Focused core final request and idle tests:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority
cargo test -p codex-core --test suite goal_idle
cargo test -p codex-core --lib goal_history_key
```

Focused classifier/projection tests:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_artifact
cargo test -p codex-core --lib goal_artifact_projection
cargo test -p codex-core --lib goal_artifact_compaction
cargo test -p codex-core --lib goal_artifact_reconstruction
```

Focused extension tests:

```powershell
cd codex-rs
cargo test -p codex-goal-extension --test goal_extension_backend goal_extension_
```

Focused app-server tests:

```powershell
cd codex-rs
cargo test -p codex-app-server --test suite thread_goal_set_active_schedules_developer_role_goal_steering
cargo test -p codex-app-server --lib raw_response_item
cargo test -p codex-app-server-protocol --lib goal_artifact
```

Run additional exact filters only for final tests added under different names.
Do not run broad crate or workspace suites by default on this workstation.

If dependencies changed unexpectedly:

```powershell
just bazel-lock-update
just bazel-lock-check
```

No dependency change is expected for Batch 06.

## Acceptance Criteria

Batch 06 is complete when:

- no reachable active producer imports or constructs `GoalContext`
- no reachable active producer imports or applies `GoalContextRole`
- no reachable active producer uses active `<goal_context>` rendering
- no active Goal steering role is configurable
- no active Goal steering item can be user-role
- no active Goal prompt body is converted to `ResponseInputItem` outside the
  finalizer
- no concrete pre-finalizer Goal `ResponseInputItem` is injected into active
  turns
- no concrete pre-finalizer Goal `ResponseInputItem` is stored as current-turn
  carry
- runtime-only Initial state is gone or cannot affect cadence
- resume cannot fabricate Initial from durable active Goal state alone
- `ext/goal` reachable producers route through service/state cadence outcomes
  and not model input
- app-server external Goal mutation does not bypass shared mutation/accounting
  ordering
- app-server raw response item notifications emit Goal-looking raw items
  unchanged
- typed/materialized projections hide only pure current Goal internal context
  and pure legacy artifacts
- mixed marker-like ordinary messages remain visible/preserved
- compaction and reconstruction do not parse rendered Goal artifacts to
  recover active Goal state
- the only code/test `<goal_context>` matches are legacy artifact classifier,
  projection, compaction, reconstruction, or raw notification fixtures
- final `/responses` payload tests prove developer-role Goal authority for
  Initial, ObjectiveUpdated, BudgetLimit, and Continuation
- final `/responses` payload tests prove ordinary user turns do not get blind
  Goal reminders
- pending Initial, ObjectiveUpdated, and BudgetLimit intent consumes only at
  the final request-input commit point
- automatic Continuation watermark advances only after Created
- upstream Goal product tests for budget, usage, app-server Goal APIs,
  `/goal`, status/footer projection, pause/edit/clear, and extension baseline
  remain active unless explicitly replaced by a product change

## Non-Goals

This batch does not:

- implement durable pending cadence intent
- implement final request-input shaping
- implement `model_visible_history_key`
- implement idle Continuation scheduling
- introduce `GoalService`
- design or implement classifier semantics
- change app-server Goal API wire contracts
- change TUI `/goal` product behavior
- add persisted pending Continuation intent
- keep user-role Goal steering as compatibility
- keep `GoalContext` as a compatibility wrapper for active steering
- parse legacy rendered text to recover Goal facts or objective text
- make repair emit Goal on every ordinary active-Goal turn

## Continuation Constraints

Batch 06 has stricter continuation rules than earlier batches.

Allowed before Batch 06 starts:

- old symbols may still exist while Batches 01-05 are incomplete
- old tests may still exist before their owning earlier batch deletes or
  rewrites them

Allowed inside a Batch 06 implementation branch before final review:

- temporary compile failures while deleting old symbols and updating imports
- temporary audit matches while the same branch is removing those matches
- legacy marker fixtures in replacement tests before whitelist review

Not allowed in a completed Batch 06 implementation:

- any reachable active Goal path using old concrete injection or carry
- any reachable `ext/goal` path constructing active model input
- any production `GoalContextRole` or `GoalSteeringRole`
- any active `<goal_context>` final payload
- any raw Goal suppression branch
- any test that asserts active marker transport, user-role active steering, or
  resume-fabricated Initial
- any claim that the rewrite is complete while the final audit commands still
  show uninspected or disallowed matches

If the final audit finds an old active path that cannot be removed without new
architecture, stop and return to the earlier owning batch. Do not make Batch 06
the place where new architecture is invented.
