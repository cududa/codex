# Goal v132 Integration Task List

Source plan: `local/goal_research/goal_132.md`

Last updated: 2026-06-30

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` done
- `[?]` blocked or waiting on an explicit decision

## Current Cursor

- `[x]` Extract implementation plan into this local task tracker.
- `[x]` Confirm the underlying intent and functional preservation strategy before implementation.
- `[x]` Start Patch 1: lock live v132 core steering and prompt wording.
- `[x]` Start Patch 2: keep `GoalStore` as storage/accounting substrate only.
- `[x]` Start Patch 3: contain extension skeleton as future owner, not live second contract.
- `[x]` Start Patch 4: prevent core/extension tool drift before extension tools are live.
- `[x]` Start Patch 5: align extension events with core/app-server ordering.
- `[x]` Start Patch 6: lock Ctrl+C and `/goal pause` behavior.
- `[x]` Start Patch 7: keep metrics observational.
- `[x]` Start Patch 8: record v133 forward-port checklist only.
- `[x]` Resolve the blocked-status decision before exposing or mirroring `blocked` in extension tooling.

## Underlying Intent

This implementation is not a mechanical upstream v132 merge. The point is to preserve the local
Codex cadence where `/goal` represents durable user intent plus runtime-owned steering, without
letting upstream prompt wording, message-role changes, hidden-context treatment, continuation
behavior, or extension refactors silently change how Codex interprets the active objective.

The failure mode being guarded against is artifact-proving drift: nearby repository artifacts,
tests, demos, docs, existing callers, or external state can become treated as automatically
authoritative, causing Codex to narrow the real task, over-audit completion, or mark ordinary
missing-local-evidence situations as blockers.

Functionally, preserve the behavior by keeping these boundaries explicit:

- Goal state is persisted data: objective, status, budget, and accounting.
- Goal steering is runtime model input: `Initial`, `Continuation`, `BudgetLimit`, and
  `ObjectiveUpdated`.
- `GoalSteeringRole` remains config/runtime policy and defaults to `developer` in this fork.
- `<goal_context>` is a role-neutral hidden runtime marker, not a synonym for user-role context.
- Raw objective text remains escaped task data inside `<untrusted_objective>`.
- Source-authority wording replaces current-worktree/artifact-proving authority wording.
- Core remains the live v132 steering owner until v133 moves ownership into `codex-rs/ext/goal`.
- Extension ownership, when it arrives, must carry the same typed steering contract instead of
  constructing raw hidden messages or alternate model-visible tool contracts.

## Direction Lock

- Preserve the maintained v131/v132 goal steering contract while integrating the useful upstream v132 goal changes.
- Treat `GoalStore` and state/protocol surfaces as storage/status terrain, not prompt or steering-policy owners.
- Keep `GoalSteeringRole`, `GoalSteeringMessage`, `<goal_context>`, `<untrusted_objective>`, hidden-context handling, and source-authority wording together as the live steering boundary.
- Keep `usageLimited` and `budgetLimited` system/accounting-owned. Model tools must not set them.
- Keep Ctrl+C as turn control. `/goal pause` is the explicit lifecycle control that pauses the goal and interrupts active work.
- Do not implement v133 ownership movement in the v132 patch; record the forward-port requirements only.

## Decision Gates

- `[x]` Decide whether `blocked` remains model-settable through prompt/tool discipline or requires runtime/client evidence.
  - Decision: accept `blocked` as model-settable through strict prompt/tool discipline.
  - Do not add a runtime/client evidence path for v132.
  - Keep strict blocked-audit wording in core and extension tool specs.
  - Add explicit wording that missing authoritative evidence is not itself a blocker; the agent should gather evidence or keep working.
- `[x]` Decide whether extension tools are gated from exposure until they can match the core tool contract.
  - Decision: implement core parity now instead of gating. Extension `update_goal` exposes `complete`/`blocked` only, and host backends must use `set_goal_status`.
- `[x]` Decide whether extension tests live under `src/*.rs` with library tests enabled or under `codex-rs/ext/goal/tests/`.
  - Decision: enable library unit tests and keep extension parity tests under `src/*.rs` so private spec/tool details can be tested without widening public API.

## Commit 1: `a80f07ec4aa9` Goal Extension Skeleton

Treatment: adapt.

Files:

- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/spec.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/ext/goal/BUILD.bazel`

Tasks:

- `[x]` Remove or rewrite the interrupt-pauses-goal TODO in extension lifecycle code.
  - 2026-06-30: Replaced rejected interrupt-to-pause TODO in `ext/goal/src/extension.rs`.
- `[x]` Document that generic abort handling accounts/clears runtime state without mutating goal status.
  - 2026-06-30: `on_turn_abort` now documents generic interrupts as turn control, not goal lifecycle control.
- `[x]` Keep extension accounting as scaffolding until host `GoalStore` persistence owns durable accounting/status.
  - 2026-06-30: Extension docs/TODOs now name host `GoalStore` persistence and status transitions as future parity requirements.
- `[x]` Add TODOs for typed steering requests/messages rather than raw hidden messages with ad hoc roles.
  - 2026-06-30: Added typed steering request TODO for Initial/Continuation/BudgetLimit/ObjectiveUpdated with host-applied role/marker/escaping/classification.
- `[x]` Ensure extension tool contribution cannot expose a divergent `update_goal` contract beside core.
  - 2026-06-30: Extension `update_goal` now exposes `complete`/`blocked` with core-aligned wording; backend trait now uses `set_goal_status`.
- `[x]` Add containment tests for extension tool contract exposure if tools can be installed.
  - 2026-06-30: Added extension spec tests for complete/blocked parity, create guidance, and rejected non-model-owned statuses.
- `[x]` Verify `NoGoalToolBackend` or any host backend path does not make extension the live authority prematurely.
  - 2026-06-30: `NoGoalToolBackend` still returns a missing-host-persistence error; host backend API now must express accepted status parity.

Acceptance:

- `[x]` Extension skeleton no longer encodes rejected interrupt-to-pause behavior.
- `[x]` Extension scaffolding names maintained v133 ownership semantics.
- `[x]` In-memory extension accounting is not treated as durable status/accounting authority.

## Commit 2: `7ee7fe239f8` GoalStore

Treatment: accept.

Files:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`

Tasks:

- `[x]` Route goal persistence through `state_db.thread_goals()` / `GoalStore`.
  - 2026-06-30: Audited core/app-server live paths; callers route through `state_db.thread_goals()`.
- `[x]` Preserve objective, status, budget, and accounting behavior.
  - 2026-06-30: `GoalStore` owns row mutation/status/accounting; existing named state tests cover budget/usage/paused/blocked semantics.
- `[x]` Keep steering role, prompt wording, hidden-context role, and visibility out of `GoalStore`.
  - 2026-06-30: Static audit found no steering/prompt/hidden-context/model-input terms in state/app-server storage/protocol surfaces.
- `[x]` Keep app-server/core external mutations triggering runtime side effects: accounting, objective-updated steering, active runtime refresh, clear runtime state, and events.
  - 2026-06-30: Audited `set_thread_goal`, app-server set/clear, usage-limit path, and `apply_external_thread_goal_status`; side effects remain outside storage.
- `[x]` Run static audit for direct legacy state methods.
  - 2026-06-30: Legacy method names are confined to `GoalStore`, wrappers/tests, and line-wrapped `thread_goals()` call chains; no separate live persistence owner found.

Acceptance:

- `[x]` No live direct calls remain to legacy goal persistence methods except intentional compatibility/wrapper sites.
- `[x]` `GoalStore` remains storage/accounting substrate only.
- `[x]` App-server/core mutation behavior remains equivalent.

## Commit 3: `500ef67ed1` Resumed Goal Metrics

Treatment: accept.

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/otel/src/metrics/names.rs`

Tasks:

- `[x]` Keep `GOAL_RESUMED_METRIC = "codex.goal.resumed"`.
- `[x]` Emit resumed metric on active persisted-goal restore.
- `[x]` Emit resumed metric on explicit `Paused` / `Blocked` / `UsageLimited` to `Active` transition if those statuses remain accepted.
- `[x]` Ensure metrics do not mutate state, inject steering, or determine initial steering.
  - 2026-06-30: Active-goal restore now marks initial steering pending independently before emitting the resumed metric.

Acceptance:

- `[x]` Removing telemetry would not change goal behavior.
- `[x]` Resume behavior is tested through status/steering assertions, not only metric assertions.
  - 2026-06-30: Runtime behavior fixed to decouple initial steering from resumed metric.
  - 2026-06-30: Added focused session test `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric` to assert resumed active goals emit initial steering text.

## Commit 4: `4ca60ef9ff` Extension Goal Events

Treatment: adapt.

Files:

- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/tool.rs`

Tasks:

- `[x]` Keep `GoalEventEmitter::thread_goal_updated`.
- `[x]` Emit create/update events only after successful backend mutation.
  - 2026-06-30: Added handler ordering coverage for update completion; create/update emit after backend returns.
- `[x]` Preserve event ordering relative to tool result and app-server/TUI listener expectations.
  - 2026-06-30: Added `extension_update_goal_completion_emits_after_backend_mutation`.
- `[x]` Gate or hook extension completion so final active-turn accounting and terminal metrics cannot be skipped once completion is live.
  - 2026-06-30: TODO now names pre-terminal-status host accounting; `NoGoalToolBackend` remains non-live until host persistence exists.
- `[x]` Keep `turn_id: None` as an explicit host API gap while `ToolCall` lacks current turn id.
  - 2026-06-30: Existing TODO retained at event emission site.
- `[x]` Add blocked event handling only as part of extension parity with the accepted core `blocked` contract.
  - 2026-06-30: `set_goal_status(status)` handles both `complete` and `blocked`; event emission remains post-mutation.

Acceptance:

- `[x]` Extension events cannot skip accounting or terminal metrics once extension completion is live.
- `[x]` Event ordering is mutation first, notification second.
- `[x]` Turn attribution gap is explicit and test-covered as current behavior.

## Commit 5: `0d344aca9b` Blocked And Usage-Limited Statuses

Treatment: adapt.

Files:

- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/migrations/0033_thread_goal_stopped_statuses.sql`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/README.md`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/tools/handlers/goal_spec.rs`
- `codex-rs/core/src/tools/handlers/goal/update_goal.rs`
- `codex-rs/core/templates/goals/continuation.md`
- `codex-rs/tui/src/app/thread_goal_actions.rs`
- `codex-rs/tui/src/chatwidget/goal_menu.rs`
- `codex-rs/tui/src/chatwidget/goal_status.rs`
- `codex-rs/tui/src/goal_display.rs`

Tasks:

- `[x]` Add/keep `blocked` and `usage_limited` state/protocol/app-server/TUI surfaces.
  - 2026-06-30: Existing v132 surfaces retained.
- `[x]` Keep `ThreadGoalStatus::is_active()` active-only.
- `[x]` Keep `Paused`, `Blocked`, and `UsageLimited` resumable through user/client action.
- `[x]` Keep `BudgetLimited` stopped and separately terminal for budget exhaustion.
- `[x]` Ensure usage-limit/API exhaustion transitions active or budget-limited goals to `UsageLimited`.
- `[x]` Ensure model tools cannot set `paused`, `active`, `budgetLimited`, or `usageLimited`.
  - 2026-06-30: Core and extension model-visible update schemas reject non-model-owned statuses.
- `[x]` Graft blocked-audit wording onto maintained continuation template with `<untrusted_objective>`.
  - 2026-06-30: Updated `codex-rs/core/templates/goals/continuation.md` and core prompt coverage.
- `[x]` Add wording that `blocked` must not be used merely because authoritative evidence has not yet been gathered; gather evidence or keep working.
  - 2026-06-30: Added the rule to the continuation prompt and core `update_goal` tool spec.
- `[x]` Reject incoming prompt shapes: `<objective>`, "Work from evidence", "current worktree and external state as authoritative", and "audit must prove completion".
  - 2026-06-30: Added/kept prompt assertions that reject these shapes; runtime template scan found only negative test assertions.
- `[x]` Align app-server docs/examples if API behavior changes.
  - 2026-06-30: No app-server API behavior or protocol shape change made in this pass.
- `[x]` Regenerate app-server schema only if protocol shapes change.
  - 2026-06-30: Not needed; no protocol shape change made.

Acceptance:

- `[x]` `usageLimited` and `budgetLimited` are non-model-settable stopped states.
- `[x]` `usageLimited` can supersede `budgetLimited`.
- `[x]` Continuation suppression applies to stopped states.
- `[x]` Blocked behavior follows the decision gate rather than drifting into extension by accident.

## Commit 6: `55f6bbc6672` Explicit Pause Transitions

Treatment: accept/adapt.

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/tui/src/chatwidget/interaction.rs`
- `codex-rs/tui/src/chatwidget/slash_dispatch.rs`
- `codex-rs/tui/src/app_event.rs`
- `codex-rs/tui/src/app/event_dispatch.rs`

Tasks:

- `[x]` Keep core generic abort accounting/cleanup without pausing active goals.
  - 2026-06-30: Ctrl+C TUI path no longer sends pause status; core abort behavior unchanged in this slice.
- `[x]` Ensure Ctrl+C does not set `Paused`.
  - 2026-06-30: Removed `pause_active_goal_for_interrupt`; updated test to assert no `SetThreadGoalStatus`.
- `[x]` Keep Ctrl+C using `AppCommand::interrupt_and_restore_prompt_if_no_output()` or equivalent.
  - 2026-06-30: This branch uses `AppCommand::interrupt()` as the local equivalent.
- `[x]` Preserve queued-message behavior after Ctrl+C: queued input may advance and the goal remains `Active`.
  - 2026-06-30: Existing queued Ctrl+C coverage remains; Ctrl+C no longer mutates goal status.
- `[x]` Make `/goal pause` set `Paused` and interrupt active running goal turns.
  - 2026-06-30: `/goal pause` now sends `SetThreadGoalStatus(Paused)` and then `Op::Interrupt` when an agent turn is running.
  - 2026-06-30: Alignment review tightened this from the broader Ctrl+C cancellable-work predicate so review-mode cancellation behavior does not become implicit goal-pause behavior.
- `[x]` Ensure `/goal pause` status mutation is enqueued before or atomically with interrupt.
  - 2026-06-30: Added test asserting status event is observed before interrupt.
- `[x]` Ensure queued/autonomous work does not drain under active goal pursuit after `/goal pause`.
  - 2026-06-30: Added queued-message `/goal pause` test asserting queued input remains queued and only interrupt is sent.
- `[x]` Keep `/goal resume` status-only; do not synthesize model tool calls.
  - 2026-06-30: Existing slash command status event path preserved for resume.
- `[x]` Keep paused-idle Ctrl+C as normal quit behavior.
  - 2026-06-30: Ctrl+C has no goal-status branch now; idle behavior remains the existing quit shortcut flow.

Acceptance:

- `[x]` Ctrl+C with queued input cancels current work and advances queued input while goal remains `Active`.
- `[x]` `/goal pause` during active work persists `Paused` and interrupts running work.
- `[x]` `/goal pause` with queued input does not continue under active goal pursuit.

## Cross-Patch Sequence

Patch 1: Core steering and prompt wording

- `[x]` Preserve `GoalSteeringRole`, `GoalSteeringKind`, and `GoalSteeringMessage`.
  - 2026-06-30: Kept all four steering kinds routed through `GoalSteeringMessage`; renamed coverage to `goal_steering_message_uses_configured_role_for_all_kinds`.
- `[x]` Route `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated` through the shared steering boundary.
  - 2026-06-30: Verified Patch 1 keeps the shared core boundary and exhaustive steering-kind coverage.
- `[x]` Preserve role-neutral `<goal_context>` wrapping/classification.
  - 2026-06-30: Kept `render_goal_context` wrapping in `GoalSteeringMessage::into_response_input_item` and removed temporary Review Dedeluger diff scaffolding comments.
- `[x]` Preserve `<untrusted_objective>` escaping.
  - 2026-06-30: Kept existing escaped-objective tests and maintained `<untrusted_objective>` prompt assertions.
- `[x]` Add/keep prompt tests for source-authority wording and rejected upstream phrases.
  - 2026-06-30: Updated continuation prompt test to cover strict blocked wording, missing-evidence-not-blocked, and rejected upstream prompt phrases.

Patch 2: GoalStore storage/accounting substrate

- `[x]` Apply GoalStore refactor.
  - 2026-06-30: Refactor is present; no Patch 2 code changes needed.
- `[x]` Audit for legacy direct persistence calls.
  - 2026-06-30: Completed static audit.
- `[x]` Confirm storage has no steering policy fields.
  - 2026-06-30: Completed steering/prompt leakage audit.

Patch 3: Extension skeleton containment

- `[x]` Rewrite extension TODOs to match maintained semantics.
  - 2026-06-30: Rewrote lifecycle/accounting/app-server/steering TODOs in extension skeleton.
- `[x]` Avoid incomplete extension accounting behavior.
  - 2026-06-30: Kept accounting behavior as in-memory scaffolding; no durable status mutation added.
- `[x]` Avoid extension being exposed as authoritative before parity.
  - 2026-06-30: Patch 4 aligned the model-visible update contract and backend status API.

Patch 4: Core/extension tool drift prevention

- `[x]` Compare tool names, create guidance, update descriptions, accepted statuses, and output behavior where practical.
  - 2026-06-30: Added extension spec tests for create/update guidance and accepted/rejected statuses.
- `[x]` Make extension `update_goal` match the accepted core `complete`/`blocked` contract before extension tools can be exposed.
  - 2026-06-30: Extension spec and handler accept `complete`/`blocked`; backend trait is no longer complete-only.
- `[x]` Keep model tools unable to set user/client/system-owned statuses.
  - 2026-06-30: Extension schema test rejects `paused`, `active`, `budgetLimited`, and `usageLimited`.

Patch 5: Extension event ordering

- `[x]` Keep post-mutation events.
- `[x]` Gate/hook completion accounting before completion events become live parity.
- `[x]` Test current turn attribution gap.
  - 2026-06-30: Event ordering test exercises current `turn_id: None` emission path.

Patch 6: Ctrl+C and `/goal pause`

- `[x]` Lock Ctrl+C as turn control.
- `[x]` Lock `/goal pause` as lifecycle pause plus interrupt.
- `[x]` Add TUI coverage for queued input behavior.

Patch 7: Metrics observational

- `[x]` Keep resumed metric.
- `[x]` Confirm telemetry does not influence state or steering.

Patch 8: v133 forward-port checklist only

- `[x]` Record extension-owned future modules: `steering.rs`, `runtime.rs`, `api.rs`, `tool.rs`, `spec.rs`, `events.rs`.
  - 2026-06-30: Forward-port checklist remains recorded in this task list and source plan.
- `[x]` State core must not remain a hidden second authority after v133.
  - 2026-06-30: Forward-port rule remains recorded; no v133 ownership move implemented in this v132 pass.
- `[x]` State extension ownership must still use typed steering requests and host-applied role/marker/escaping/classification.
  - 2026-06-30: Extension TODOs now name typed steering plus host-applied role, marker, escaping, timing, and hidden-context classification.

## Tests To Add Or Update

Core:

- `[x]` `goal_steering_message_uses_configured_role_for_all_kinds`
  - 2026-06-30: Test present/updated. Plain `cargo test -p codex-core goal_steering_message_uses_configured_role_for_all_kinds` timed out after 184s on the Parallels Windows VM; use the repo's local-profile test route for future runs.
- `[x]` `continuation_prompt_allows_complete_and_strict_blocked_updates`
  - 2026-06-30: Test present/updated and verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` prompt tests for `<untrusted_objective>` and absence of rejected upstream phrases
  - 2026-06-30: Covered in core prompt tests; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric` if missing
  - 2026-06-30: Added in `codex-rs/core/src/session/tests.rs`; focused `cargo test -p codex-core --profile ci-test resumed_active_goal_emits_initial_steering_independent_of_resumed_metric` timed out after 15 minutes on the Parallels Windows VM.
- `[x]` keep/update `interrupt_accounts_active_goal_without_pausing`
  - 2026-06-30: Existing test found in `codex-rs/core/src/session/tests.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` keep/update `shutdown_without_active_turn_keeps_active_goal_active`
  - 2026-06-30: Existing test found in `codex-rs/core/src/session/tests.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` keep/update `usage_limit_runtime_stops_active_goal_and_prevents_idle_continuation`
  - 2026-06-30: Existing test found in `codex-rs/core/src/session/tests.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` keep/update `budget_limited_accounting_steers_active_turn_without_aborting`
  - 2026-06-30: Existing test found in `codex-rs/core/src/session/tests.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` keep/update `update_goal_tool_rejects_pausing_goal`
  - 2026-06-30: Existing test found in `codex-rs/core/src/session/tests.rs`; verified by focused nextest local-profile runs in the Verification Queue.

State:

- `[x]` `usage_limit_active_thread_goal_updates_active_or_budget_limited_goals`
  - 2026-06-30: Test exists in `codex-rs/state/src/runtime/goals.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `pausing_budget_limited_goal_preserves_terminal_status`
  - 2026-06-30: Test exists in `codex-rs/state/src/runtime/goals.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `activating_goal_already_over_budget_keeps_it_budget_limited`
  - 2026-06-30: Test exists in `codex-rs/state/src/runtime/goals.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `blocking_budget_limited_goal_preserves_terminal_status`
  - 2026-06-30: Test exists in `codex-rs/state/src/runtime/goals.rs`; verified by focused nextest local-profile runs in the Verification Queue.

App-server:

- `[x]` `thread_resume_keeps_paused_goal_paused`
  - 2026-06-30: Existing test found in app-server v2 suite; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `thread_goal_set_preserves_budget_limited_same_objective`
  - 2026-06-30: Existing test found in app-server v2 suite; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `thread_goal_set_persists_resumable_stopped_statuses`
  - 2026-06-30: Existing test found in app-server v2 suite; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `thread_goal_set_edits_objective_without_resetting_usage`
  - 2026-06-30: Existing test found in app-server v2 suite; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `thread_goal_clear_deletes_goal_and_notifies`
  - 2026-06-30: Existing test found in app-server v2 suite; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `thread_goal_set_active_over_budget_remains_budget_limited` if missing
  - 2026-06-30: Exact name not present, but `thread_goal_set_preserves_budget_limited_same_objective` covers replacement/update over budget preserving `BudgetLimited`; state-level activation coverage also exists.

Extension:

- `[x]` `extension_update_goal_accepts_complete_and_blocked_with_core_parity`
  - 2026-06-30: Added in `codex-rs/ext/goal/src/spec.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `extension_create_goal_description_matches_core_contract`
  - 2026-06-30: Added in `codex-rs/ext/goal/src/spec.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `extension_update_goal_rejects_paused_active_budget_and_usage_limited`
  - 2026-06-30: Added in `codex-rs/ext/goal/src/spec.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `extension_update_goal_completion_emits_after_backend_mutation`
  - 2026-06-30: Added in `codex-rs/ext/goal/src/tool.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `turn_abort_stops_accounting_without_status_mutation`
  - 2026-06-30: Added accounting-layer test in `codex-rs/ext/goal/src/accounting.rs`; extension abort path has no status mutation hook.
- `[x]` `goal_tools_not_contributed_when_backend_contract_is_not_authoritative` if contribution gating is implemented
  - 2026-06-30: Gating not implemented because core parity was implemented instead.

TUI:

- `[x]` update `goal_control_slash_commands_emit_goal_events` if `/goal pause` emits status plus interrupt
  - 2026-06-30: Existing status-event coverage retained; interrupt-specific coverage added in `goal_pause_interrupts_active_turn_after_status_event`.
- `[x]` `goal_pause_interrupts_active_turn_after_status_event`
  - 2026-06-30: Added in `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`
  - 2026-06-30: Added in `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` replace `ctrl_c_interrupt_pauses_active_goal_turn`
  - 2026-06-30: Replaced with `ctrl_c_interrupts_active_turn_without_pausing_goal`.
- `[x]` `ctrl_c_interrupts_active_turn_without_pausing_goal`
  - 2026-06-30: Added/renamed in `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`
  - 2026-06-30: Added in `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` `paused_idle_ctrl_c_requests_quit_without_goal_mutation`
  - 2026-06-30: Added in `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`; verified by focused nextest local-profile runs in the Verification Queue.
- `[x]` keep blocked and usage-limited goal menu snapshots current
  - 2026-06-30: No goal menu UI text/snapshot change made in this pass.

## Verification Queue

Run from `codex-rs` unless noted.

Local VM note:

- `[x]` Exact local-profile test command
  - 2026-06-30: User said to use local-profile tests on the Parallels Windows VM. Command discovery did not find a `local-profile`/`profile-test` command in PATH or repo text. Plain local `cargo test` should remain avoided until the exact local-profile route is supplied.
  - 2026-06-30: Repo has Cargo profile `ci-test`; `cargo test -p codex-goal-extension --profile ci-test` passed, but a focused `codex-core` test under the same profile still timed out after 15 minutes.
  - 2026-06-30: CI uses `cargo nextest run --cargo-profile ci-test`, but `cargo nextest` is not installed on this VM.
  - 2026-06-30: Installed `cargo-nextest`; use `cargo nextest run -p <crate> --cargo-profile ci-test <filters...>` for focused local-profile validation on this VM.

Formatting:

- `[x]` `just fmt`
  - 2026-06-30: Passed after `sh` was added to PATH; output reported 64 files unchanged before cargo fmt/ruff steps.

Focused tests:

- `[x]` `cargo test -p codex-core goal_steering_message_uses_configured_role_for_all_kinds`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-core continuation_prompt_allows_complete_and_strict_blocked_updates`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-core interrupt_accounts_active_goal_without_pausing`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-core usage_limit_runtime_stops_active_goal_and_prevents_idle_continuation`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-core update_goal_tool_rejects_pausing_goal`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-core resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`
  - 2026-06-30: Verified via `cargo nextest run -p codex-core --cargo-profile ci-test ...`; focused core batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-state usage_limit_active_thread_goal_updates_active_or_budget_limited_goals`
  - 2026-06-30: Verified via `cargo nextest run -p codex-state --cargo-profile ci-test ...`; focused state batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-state pausing_budget_limited_goal_preserves_terminal_status`
  - 2026-06-30: Verified via `cargo nextest run -p codex-state --cargo-profile ci-test ...`; focused state batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-state activating_goal_already_over_budget_keeps_it_budget_limited`
  - 2026-06-30: Verified via `cargo nextest run -p codex-state --cargo-profile ci-test ...`; focused state batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-app-server thread_resume_keeps_paused_goal_paused`
  - 2026-06-30: Verified via `cargo nextest run -p codex-app-server --cargo-profile ci-test thread_resume_keeps_paused_goal_paused`; 1 test passed.
- `[x]` `cargo test -p codex-app-server thread_goal_set_preserves_budget_limited_same_objective`
  - 2026-06-30: Verified via `cargo nextest run -p codex-app-server --cargo-profile ci-test ...`; focused app-server goal-set batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-app-server thread_goal_set_persists_resumable_stopped_statuses`
  - 2026-06-30: Verified via `cargo nextest run -p codex-app-server --cargo-profile ci-test ...`; focused app-server goal-set batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-app-server thread_goal_clear_deletes_goal_and_notifies`
  - 2026-06-30: Verified via `cargo nextest run -p codex-app-server --cargo-profile ci-test ...`; focused app-server goal-set batch ran 3 tests, all passed.
- `[x]` `cargo test -p codex-goal-extension extension_update_goal_accepts_complete_and_blocked_with_core_parity`
  - 2026-06-30: Covered by `cargo test -p codex-goal-extension --profile ci-test`; all 5 extension tests passed.
- `[x]` `cargo test -p codex-goal-extension turn_abort_stops_accounting_without_status_mutation`
  - 2026-06-30: Covered by `cargo test -p codex-goal-extension --profile ci-test`; all 5 extension tests passed.
- `[x]` `cargo test -p codex-goal-extension extension_update_goal_completion_emits_after_backend_mutation`
  - 2026-06-30: Covered by `cargo test -p codex-goal-extension --profile ci-test`; all 5 extension tests passed.
- `[x]` `cargo test -p codex-tui goal_control_slash_commands_emit_goal_events`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-tui goal_pause_interrupts_active_turn_after_status_event`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-tui goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-tui ctrl_c_interrupts_active_turn_without_pausing_goal`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-tui ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.
- `[x]` `cargo test -p codex-tui paused_idle_ctrl_c_requests_quit_without_goal_mutation`
  - 2026-06-30: Verified via `cargo nextest run -p codex-tui --cargo-profile ci-test ...`; focused TUI goal batch ran 6 tests, all passed.

Schema/docs only if protocol or generated shapes change:

- `[x]` `just write-app-server-schema`
  - 2026-06-30: Not run because no app-server protocol/schema shape changed.
- `[x]` `cargo test -p codex-app-server-protocol`
  - 2026-06-30: Not run because no app-server protocol/schema shape changed.

Scoped fix commands after Rust edits:

- `[x]` `just fix -p codex-core`
  - 2026-06-30: Timed out after 15 minutes on the Parallels Windows VM; no background Rust processes remain.
  - 2026-06-30: Passed after local-profile/nextest warming; no tests rerun afterward per repo guidance.
- `[x]` `just fix -p codex-state`
  - 2026-06-30: Not run; no state crate code changed in this pass.
- `[x]` `just fix -p codex-app-server`
  - 2026-06-30: Not run; no app-server crate code changed in this pass.
- `[x]` `just fix -p codex-goal-extension`
  - 2026-06-30: Passed and applied clippy fixes in `ext/goal/src/tool.rs`.
- `[x]` `just fix -p codex-tui`
  - 2026-06-30: Passed; applied one mechanical clippy simplification in `tui/src/chatwidget/turn_runtime.rs`.
  - 2026-06-30: No tests rerun afterward per repo guidance.

Static audits from repository root:

- `[x]` `rg -n "get_thread_goal|replace_thread_goal|update_thread_goal|delete_thread_goal|pause_active_thread_goal|usage_limit_active_thread_goal|account_thread_goal_usage" codex-rs`
  - 2026-06-30: Completed for Patch 2 audit; hits are `GoalStore`, wrappers/tests, or `thread_goals()` callers.
- `[x]` `rg -n "steeringRole|GoalSteeringRole|goal_context|untrusted_objective|Work from evidence|current worktree|audit must prove" codex-rs/core codex-rs/ext/goal codex-rs/state codex-rs/app-server codex-rs/tui`
  - 2026-06-30: Completed during Patch 1/Patch 2 audits; rejected prompt phrases only remain in negative assertions.
- `[x]` `rg -n "pause_active_goal_for_interrupt|interrupt_and_restore_prompt_if_no_output|SetThreadGoalStatus|/goal pause" codex-rs/tui/src`
  - 2026-06-30: `pause_active_goal_for_interrupt` removed; `/goal pause` status event precedes interrupt.

## Update Notes

- Update `Current Cursor` before starting a new patch slice.
- Mark commit-level tasks and cross-patch tasks as done together when a change satisfies both.
- Add the exact test command and result under the relevant task when validation runs.
- Keep unresolved policy questions under `Decision Gates`; do not silently encode them in code.
