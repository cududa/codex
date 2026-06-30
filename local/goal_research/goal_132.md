# Goal v132 Review Finding Handoff

This file is a working handoff for the v132 Goal review. It records the evidence needed to rewrite the v132 Review Finding in the same factual style as the v131 finding: implementation surfaces, accepted/adapted/rejected shapes, and concrete remediation obligations.

The previous v132 writeup was too high level. Treat this file as the replacement direction.

## MCP Coordinates

Current v132 review version:

```text
379ea2ff-b283-4188-950e-813aa7175907
```

Current v132 finding:

```text
4b815ebf-52b7-426a-af4d-f52ecd118f7f
Resolve incoming goals.rs shape against maintained intent
```

Linked v131 finding:

```text
ef76fd1d-88f9-4620-bfc0-8f25dc73b0a7
b87af2a8-558d-40f6-a57a-74a6161462c1
Canonical local goal steering contract conflicts with upstream 0.131 role and artifact-proving shapes
```

Important ReviewCommit ids:

| Commit | ReviewCommit id | Title |
|---|---|---|
| `a80f07ec4aa9dd311091b91d41945043765a1caa` | `1a05dc39-2e57-4271-beec-9e681143148f` | `chore: goal ext skeleton (#23288)` |
| `7ee7fe239f8bd2f478a30c369c2566004769a3da` | `d746624f-b2d3-49f1-ad89-a6b3b39f2682` | `chore: isolate thread goal storage behind GoalStore (#23295)` |
| `500ef67ed15fae5148d5cfcdf42973ffead19b12` | `96294ee1-3cb0-4fe8-9a9c-a82b8bb116df` | `chore: goal resumed metrics (#23301)` |
| `4ca60ef9fffe76fb4f86d606f7d4a2f727f6cd25` | `7722d11a-60ed-4bbb-8bc8-21b2cf653d91` | `Emit goal update events from goal extension tools (#23306)` |
| `0d344aca9b0caee4e5a508ee10d8a72f4d416896` | `47a76d4c-daa2-412d-8ac5-6e2ec292ddd5` | `goal: pause continuation loops on usage limits and blockers (#23094)` |
| `55f6bbc6672a97efe1321318120b2054bf6b841f` | `668055ea-de97-411a-809c-bb0c0c7c1ef1` | `goals: keep pause transitions explicit (#23088)` |

## What v131 Actually Protects

The v131 finding is not a general preference for "goals feel persistent." It protects exact shapes:

- goal state and goal steering are separate concepts
- `GoalSteeringRole` is config/runtime policy, defaulting to `developer` in this fork
- steering role is applied where rendered goal steering becomes `ResponseInputItem::Message`
- `GoalSteeringMessage` is the single boundary for `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated`
- `<goal_context>` is a role-neutral hidden runtime marker, not a synonym for user-role context
- both user-role and developer-role `<goal_context>` are hidden from normal transcript/history/event treatment
- raw objective text is escaped inside `<untrusted_objective>`
- source-authority wording replaces current-worktree/artifact-proving authority wording
- `/goal edit`, slash history, preview metadata, app-server APIs, persistence, and accounting are accepted only as carriers of the contract, not as alternate authority surfaces

Maintained commits to read for any implementation:

- `60346ef501345e97d2021d8a833bc81e5fecfbd9` - `Make goal steering role configurable`
- `7bd45429d714c20bd9526d60936106c1cb2cb7ef` - `Fix goal steering follow-up build issues`
- `5cfe837ca4814e4c07ee1778b502df90904a634a` - `Add initial goal steering frame`
- `1d5fa70362103c841fad95a2812ff8274bf7691c` - `Preserve local goal steering contract across 0.131`

Concrete maintained files:

- `codex-rs/config/src/config_toml.rs`: `GoalSteeringRole`, `GoalsToml`
- `codex-rs/core/src/config/mod.rs`: resolved `GoalsConfig`
- `codex-rs/core/src/goals.rs`: `GoalSteeringKind`, `GoalSteeringMessage`, initial steering state, objective-updated injection, continuation selection, budget-limit steering
- `codex-rs/core/src/context/goal_context.rs`: role-neutral `<goal_context>` rendering/classification
- `codex-rs/core/src/context/contextual_user_message.rs`: user-role goal context hidden treatment
- `codex-rs/core/src/event_mapping.rs`: developer-role goal context hidden treatment
- `codex-rs/core/templates/goals/*.md`: source-authority wording and `<untrusted_objective>`

## v132 Tree-Walk Findings

### a80f07ec4aa9 - Goal Extension Skeleton

Files added:

- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/spec.rs`
- `codex-rs/ext/goal/src/tool.rs`

Workspace/build wiring:

- `codex-rs/Cargo.toml`
- `codex-rs/Cargo.lock`
- `codex-rs/ext/goal/BUILD.bazel`

This commit creates the destination ownership terrain for Goal, even though v132 does not yet make it the sole live owner.

Concrete behavior added:

- `GoalExtension` installs thread lifecycle, config, turn lifecycle, token usage, and tool contributors.
- `GoalToolBackend` abstracts goal persistence operations behind `get_goal`, `create_goal`, and `complete_goal`.
- `NoGoalToolBackend` returns "goal tools are not connected to host goal persistence yet".
- `GoalAccountingState` records in-memory per-turn token deltas and an unflushed thread delta.
- extension `get_goal`, `create_goal`, and `update_goal` tool specs are created in `ext/goal/src/spec.rs`.
- extension `GoalToolExecutor` validates objective and token budget and returns structured `goal`, `remainingTokens`, and completion-budget report data.

Concrete conflicts/gaps against maintained intent:

- extension `update_goal` initially accepts only `complete`, while v132 core later accepts `complete` and `blocked`.
- extension `GoalToolBackend` itself only has `complete_goal`; there is no `block_goal` or general `set_goal_status`, so the backend API encodes the same drift as the tool schema.
- extension tool descriptions become model-visible behavior. If core and extension tools are both live, schemas and status rules can drift.
- extension lifecycle `on_turn_abort` contains a TODO saying interrupted turns should pause the active goal. That is later contradicted by `55f6bbc`, which removes generic abort-driven pausing.
- extension accounting is in-memory scaffolding only. It does not persist to `GoalStore`, does not trigger budget-limit status changes, and does not inject budget-limit steering.
- extension has no steering boundary at all in v132: no `GoalSteeringRole`, no `GoalSteeringMessage`, no `Initial`, no `ObjectiveUpdated`, no source-authority prompt rendering.

Treatment: adapt.

Required adaptation:

- keep `ext/goal` as ownership terrain, not out-of-scope scaffolding
- remove or rewrite the interrupt-pauses-goal TODO so the skeleton does not encode a pre-`55f6` policy
- make extension tool schemas and core tool schemas equivalent while both paths exist
- extend or replace `GoalToolBackend` so the backend can express every accepted `update_goal` status, not only `complete`
- carry `blocked` into extension `update_goal` if extension tools can be exposed in v132/v133
- make the extension backend/lifecycle delegate into the existing maintained runtime path until the real refactor lands
- when v133 moves ownership into `ext/goal`, move the maintained steering boundary into extension code instead of leaving core as a shadow authority

### 7ee7fe239f - GoalStore

Files touched:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`
- tests in app-server/core/state

Concrete behavior changed:

- goal persistence methods move from direct `StateRuntime` methods to `StateRuntime::thread_goals() -> GoalStore`
- app-server set/get/clear, core runtime, resume snapshots, thread deletion, and tests route through `GoalStore`
- storage behavior is intended to stay identical

Treatment: accept.

Reason:

- this is a storage boundary refactor, not a steering-authority change
- it supports the future dedicated goal storage boundary without changing wire behavior

Required preservation:

- `GoalStore` persists objective/status/budget/accounting
- `GoalStore` does not own `GoalSteeringRole`
- `GoalStore` does not own prompt wording
- `GoalStore` does not decide hidden-context role or visibility
- app-server/core callers must still trigger the runtime side effects around external mutation, objective-updated steering, resume restoration, accounting, and events

Implementation check:

- search for direct `state_db.get_thread_goal`, `replace_thread_goal`, `update_thread_goal`, `delete_thread_goal`, `pause_active_thread_goal`, and `account_thread_goal_usage`; remaining live callsites should use `state_db.thread_goals()`

### 500ef67ed1 - Resumed Goal Metrics

Files touched:

- `codex-rs/core/src/goals.rs`
- `codex-rs/otel/src/metrics/names.rs`

Concrete behavior changed:

- adds `GOAL_RESUMED_METRIC = "codex.goal.resumed"`
- emits resumed metric when runtime restore sees an active persisted goal after resume
- later v132 status work in `0d344aca9b` adds `emit_goal_resumed_metric_if_status_changed`, which emits resumed metrics on explicit transition from `Paused`, `Blocked`, or `UsageLimited` to `Active`

Treatment: accept.

Reason:

- telemetry is not steering authority
- resumed metrics are useful for lifecycle visibility

Required preservation:

- metric emission must not inject steering
- metric emission must not change persisted status
- metric emission must not replace `Initial` steering on resumed active goals
- metric emission must not cause paused/blocked/usage-limited goals to resume automatically

### 4ca60ef9fffe - Extension Goal Events

Files touched:

- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/src/tool.rs`

Concrete behavior changed:

- adds `GoalEventEmitter`
- threads an extension event sink into `GoalExtension` and `GoalToolExecutor`
- emits `EventMsg::ThreadGoalUpdated` after successful extension `create_goal`
- emits `EventMsg::ThreadGoalUpdated` after successful extension `update_goal`
- event id is the tool call id
- `turn_id` is `None` because `ToolCall` does not expose current turn submission id
- the extension event path is post-backend-mutation only: `backend.create_goal` / `backend.complete_goal` returns, then `GoalToolExecutor` emits
- the extension completion path does not flush final active-turn accounting before completion except for a TODO
- there is no extension blocked path in this commit shape

Treatment: adapt.

Reason:

- extension tool mutations must notify app-server/TUI listeners, so event emission is directionally right
- current event shape is not equivalent to core/app-server ordering and attribution

Required adaptation:

- keep event emission on extension-owned create/update paths
- preserve ordering relative to tool result and app-server/TUI listener expectations
- eventually provide the actual turn id, not `None`, for in-turn model tool mutations
- make event emission follow the core sequence before claiming parity: `ToolCompletedGoal` accounting with budget steering suppressed, persisted status mutation, then event emission
- do not allow extension events to become a separate lifecycle path that skips objective-updated steering or accounting

### 0d344aca9b - Blocked and Usage-Limited Statuses

Files touched:

- app-server protocol schemas and TypeScript status definitions
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/README.md`
- app-server goal processor and resume tests
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/turn.rs`
- core goal tool handler/spec
- `codex-rs/core/templates/goals/continuation.md`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/state/migrations/0033_thread_goal_stopped_statuses.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- TUI goal actions, footer, goal menu, goal status, interaction, display, and snapshots

Concrete behavior changed:

- adds statuses `blocked` and `usage_limited` to state/protocol/app-server/TUI surfaces
- `ThreadGoalStatus::is_active()` remains active-only
- stopped/resumable set becomes `paused`, `blocked`, `usage_limited`; `budget_limited` is stopped but treated separately
- usage-limit response/API errors trigger `GoalRuntimeEvent::UsageLimitReached`
- `usage_limit_active_thread_goal_for_turn` accounts progress, transitions active goal to `UsageLimited`, emits terminal metrics, clears accounting, and sends `ThreadGoalUpdated`
- `GoalStore::usage_limit_active_thread_goal` updates active goals and can supersede `budget_limited`
- continuation selection skips `Paused`, `Blocked`, `UsageLimited`, `BudgetLimited`, and `Complete`
- core `update_goal` accepts `complete` and `blocked`
- core tool spec adds strict blocked guidance: same blocking condition repeated for at least three consecutive goal turns, fresh audit after resume, never merely hard/slow/uncertain
- continuation prompt adds a "Blocked audit" section with the same model-facing constraints
- incoming `0d344aca9b` prompt text also carries shapes rejected by the v131 finding: `<objective>`, "Work from evidence", "current worktree and external state as authoritative", and "audit must prove completion"
- TUI displays `blocked`, `usage limited`, and `limited by budget`
- TUI menu allows resume from `Paused`, `Blocked`, and `UsageLimited`
- TUI editing a `BudgetLimited` or `Complete` goal reactivates it, while editing `Paused`, `Blocked`, or `UsageLimited` preserves that stopped status

Treatment: adapt.

Accepted:

- `budgetLimited` is a system/accounting stopped state for goal token budget exhaustion
- `usageLimited` is a system/API/account stopped state for usage exhaustion
- `usageLimited` may supersede `budgetLimited`; current SQL deliberately allows this because account/system exhaustion is the stronger reason automatic continuation cannot proceed
- usage-limit and budget-limit states should terminate automatic goal continuation
- `Paused`, `Blocked`, and `UsageLimited` are resumable through `/goal resume`

Still needs user decision:

- whether `blocked` remains model-settable through prompt/tool discipline or requires runtime/client evidence

Concrete blocked facts:

- `blocked` is model-settable through core `update_goal`
- the three-turn audit is not runtime-enforced
- current enforcement is tool schema text plus continuation prompt text
- after resume, the blocked audit starts fresh by prompt contract, not by persisted blocker identity
- core accepts `blocked` mechanically in `core/src/tools/handlers/goal/update_goal.rs`; there is no persisted blocker identity, no runtime turn counter, and no repeated-condition evidence object

Required adaptation:

- keep `budgetLimited` and `usageLimited`
- keep usage-limit handling system-owned; the model must not set `usageLimited`
- keep `budgetLimited` accounting-owned; the model must not set `budgetLimited`
- keep continuation suppression for `Blocked` only if `blocked` is accepted as a stopped/resumable state
- graft the blocked-audit wording onto the maintained `1d5fa703` continuation template with `<untrusted_objective>` and source-authority wording; do not accept the incoming `0d344aca9b` prompt wholesale
- if `blocked` is accepted, extension `update_goal` must expose `blocked` with the same strict wording
- if `blocked` is not accepted as purely model-settable, replace prompt-only enforcement with a runtime/client evidence path or remove model-settable `blocked`

### 55f6bbc6672 - Explicit Pause Transitions

Files touched:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/tests.rs`

Concrete behavior changed:

- removes `TurnAbortReason` from `GoalRuntimeEvent::TaskAborted`
- removes the path where `TurnAbortReason::Interrupted` caused `pause_active_thread_goal`
- `handle_thread_goal_task_abort` now accounts/clears runtime turn state but does not mutate goal status to paused
- `abort_all_tasks` and `abort_turn_if_active` still report `TaskAborted`, but only for accounting and cleanup
- test changes from `interrupt_accounts_active_goal_before_pausing` to `interrupt_accounts_active_goal_without_pausing`
- adds `shutdown_without_active_turn_keeps_active_goal_active`
- `Session::interrupt_task` no longer comments that even idle interrupts pause active goals

Treatment: adapt/accept.

Accepted:

- generic core aborts must not implicitly pause active goals
- stale shutdown, guardian circuit breakers, steering interrupts, and generic task replacement should not mutate goal status as a side effect
- pause must come from an explicit user/client/runtime action that is semantically a pause

Required adaptation:

- keep the core abort behavior from `55f6`
- ensure extension skeleton does not retain or implement its earlier "interrupted turns should pause" TODO as generic abort policy
- preserve incoming/new Ctrl+C as a turn interrupt, including the queued-message behavior where interrupting the current turn can immediately advance pending input
- move "pause the goal and stop execution" to the explicit `/goal pause` user action, which must set the goal to `Paused` and interrupt any active running turn

Current and incoming Ctrl+C facts:

`55f6bbc6672` only removes implicit core abort-driven pausing. It does not itself define the full TUI key behavior. In upstream/main / v133-shaped code, `ChatWidget::on_ctrl_c` submits `AppCommand::interrupt_and_restore_prompt_if_no_output()` for cancellable work. Core interrupt handling can then drain pending work through `maybe_start_turn_for_pending_work()`, so a queued message can become the next turn after the current one is canceled.

The previously recorded maintained/current TUI pause-before-interrupt behavior came from later maintained history, including `07298a948c` (`Pause active goals before TUI interrupts (#28813)`). For v132/v133 planning, that is no longer the desired Ctrl+C contract.

- `DOUBLE_PRESS_QUIT_SHORTCUT_ENABLED` is `false`
- `ChatWidget::on_ctrl_c` interrupts when `is_cancellable_work_active()`
- upstream/main uses `interrupt_and_restore_prompt_if_no_output()` for that interrupt path
- core `abort_all_tasks(... Interrupted)` can call `maybe_start_turn_for_pending_work()` after an interrupted turn, allowing queued input to advance
- if no cancellable work is active, Ctrl+C calls `request_quit_without_confirmation`
- if the goal is paused and idle, Ctrl+C follows normal quit behavior and does not clear/delete/complete the persisted goal

Locked contract from the 2026-06-30 discussion:

- active goal plus running turn plus queued input: Ctrl+C interrupts the current turn; queued input may immediately start; the goal remains `Active`
- active goal plus running turn without queued input: Ctrl+C interrupts the current turn; the goal remains `Active`
- `/goal pause` is the explicit hard stop: set the goal to `Paused` and interrupt any active running turn
- paused/blocked/usage-limited goal plus idle TUI: Ctrl+C quits/ends the TUI interaction and leaves the goal resumable
- model `update_goal` must not learn to pause/resume; pause remains user/client/system-owned

## Cross-Surface Remediation Obligations

### State and Storage

Accept `GoalStore` as storage owner for objective/status/budget/accounting rows.

Do not put steering policy in `ThreadGoal`, `GoalStore`, SQL migrations, or app-server protocol fields unless there is an explicit design decision to make steering per-goal. Current maintained intent prefers runtime/config policy.

Preserve status precedence:

- active + over budget => `budget_limited`
- active + usage limit => `usage_limited`
- budget-limited + usage limit => `usage_limited`
- paused/blocked/usage-limited/budget-limited are stopped for continuation
- paused/blocked/usage-limited are resumable through `Active`
- requested `Paused` or `Blocked` preserves an existing `budget_limited` row rather than downgrading it to a merely paused/blocked state
- requested `Active` becomes or remains `budget_limited` when `tokens_used >= token_budget`
- `usage_limit_active_thread_goal` can move `active` or `budget_limited` to `usage_limited`
- requested `Complete` can still complete a budget-limited goal

### Core Runtime

Core still owns live Goal behavior in v132:

- turn start captures token baseline and active goal
- tool completions account progress
- `update_goal` suppresses budget-limit steering while finalizing
- objective updates inject `ObjectiveUpdated`
- budget limit injects budget-limit steering once
- resume restores active runtime state and emits resumed metrics
- idle continuation injects `Initial` or `Continuation`
- usage-limit errors transition to `UsageLimited`
- generic aborts account/clear but do not pause

Do not let v132 status changes collapse the v131 steering boundary. `GoalSteeringMessage` still needs to wrap all steering kinds and apply configured `GoalSteeringRole`.

### Model Tools

Core tool contract after v132:

- `get_goal`: read current goal and usage
- `create_goal`: only when explicitly requested by user or system/developer instructions
- `update_goal`: `complete` or `blocked` only
- model cannot set `paused`, `active`, `budgetLimited`, or `usageLimited`

Extension tool contract after a80/4ca:

- duplicates `get_goal`, `create_goal`, `update_goal`
- currently accepts only `complete` in extension `update_goal`
- backend only exposes `complete_goal`, so parity with core requires changing the backend/service API too
- emits `ThreadGoalUpdated` after extension create/update

Remediation:

- one authoritative tool contract
- while duplicated, core and extension specs must match exactly on status enum, descriptions, output shape, and budget-report behavior
- if `blocked` is accepted, extension must accept `blocked`
- if extension delegates to core, it must invoke the same accounting/metrics/events/steering hooks, not only mutate storage

### Extension Runtime

The extension skeleton must be corrected to carry maintained ownership concepts:

- `GoalToolBackend` should become or delegate to the real host goal service, not bypass it
- lifecycle hooks must persist accounting through `GoalStore`
- token accounting must trigger budget-limit status and steering through the same policy as core
- turn stop must schedule continuation only after pending user/mailbox work checks
- turn abort must not generically pause
- app-server set/clear must be observed so objective-updated steering, accounting-before-mutation, and clear-runtime-state behavior are preserved
- event emission must use the same ordering and turn attribution as core/app-server

### App-Server and Protocol

Accept protocol expansion for `blocked` and `usageLimited` only insofar as it reflects the accepted lifecycle states.

App-server set/get/clear remain lifecycle/RPC surfaces. They must:

- validate objective and budgets
- persist through `GoalStore`
- emit ordered `ThreadGoalUpdated` / `ThreadGoalCleared`
- call live thread hooks for external mutation starting/set/clear
- preserve objective-updated steering when changing an active goal
- not define steering role or prompt authority

### TUI

Accept UI labels and menus for the new states:

- active
- paused
- blocked
- usage limited
- limited by budget
- complete

Accept resume affordance for `Paused`, `Blocked`, and `UsageLimited`.

Lock the split between turn interrupt and goal pause:

- Ctrl+C is a turn-control gesture. It interrupts cancellable work and preserves the incoming queued-message UX where pending input can run next.
- Ctrl+C must not set `Paused` merely because an active goal exists.
- `/goal pause` is the goal lifecycle gesture. When issued during active work, it must set the goal status to `Paused` and interrupt the running turn.
- `/goal pause` should not be implemented as a model tool affordance; `ext/goal/src/tool.rs` remains correct to reject model-requested `paused`/`active` status changes.
- paused-idle Ctrl+C quits/ends interaction without clearing, deleting, or completing the persisted goal.

### Metrics

Accept:

- `codex.goal.resumed`
- `codex.goal.blocked`
- `codex.goal.usage_limited`
- existing complete/budget/token/duration metrics

Metrics are observational. They must not own status, steering, or prompt behavior.

### Tests Required For Implementation

Core/state tests:

- `GoalSteeringMessage` wraps all steering kinds with role-neutral `<goal_context>` and configured role
- objective-updated steering uses configured role
- initial steering remains one-shot after create/resume/reactivation
- generic interrupt accounts active goal without pausing
- usage limit transitions active and budget-limited goals to `UsageLimited`
- blocked status suppresses continuation if accepted
- usage/budget/blocked precedence is explicit

Tool tests:

- core and extension `update_goal` specs match while both exist
- extension emits events after create/update
- extension update accepts exactly the statuses accepted by core

TUI tests:

- active running Ctrl+C sends interrupt without `SetThreadGoalStatus::Paused`
- active running Ctrl+C with queued input allows the queued message to start next while the goal remains active
- `/goal pause` during a running goal sends/commits `SetThreadGoalStatus::Paused` and interrupts the active turn
- `/goal pause` with queued input does not allow the queued message or autonomous continuation to proceed under an active goal after the pause
- paused idle Ctrl+C quits/ends interaction without clearing goal
- menu resumes `Paused`, `Blocked`, and `UsageLimited`
- menu does not resume `BudgetLimited` as if it were merely paused unless budget rules permit

Forward-port tests for v133:

- `ext/goal/src/steering.rs` or equivalent preserves `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated`
- `goals.steering_role` is applied in extension-owned model input
- `<untrusted_objective>` and source-authority wording survive the move
- hidden goal context classification still applies for both user and developer roles

## v133 Architecture Fact

Upstream/main confirms that `ext/goal` becomes the real Goal home. The decisive upstream commit is:

```text
479a14cf59 [2 of 2] Finish moving goal runtime to extension (#26548)
```

That commit deletes `codex-rs/core/src/goals.rs` and core goal tool handlers. Ownership moves into:

- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/api.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/spec.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/accounting.rs`

`codex-state` remains storage substrate through `state/src/runtime/goals.rs`.

Forward-port rule:

Do not preserve the v131 contract by keeping core as a hidden second authority. Move the maintained semantics into the extension architecture through a real refactor.

## Artifact Treatment Draft

Accepted:

- `7ee7fe239f`: `GoalStore` storage boundary
- `500ef67ed1`: resumed-goal metrics
- v132 protocol/schema/UI representation of `usageLimited`
- v132 protocol/schema/UI representation of `budgetLimited`
- `55f6bbc`: generic abort no longer pauses goal

Adapted:

- `a80f07ec`: extension skeleton becomes destination terrain but must carry maintained tool/lifecycle/steering ownership
- `4ca60ef`: extension events are needed but must match core/app-server ordering and turn attribution
- `0d344ac`: status expansion accepted for budget/usage; `blocked` remains policy decision; continuation suppression must match final policy
- TUI pause ownership moves to `/goal pause`: Ctrl+C remains a turn interrupt/queued-message advance path, while `/goal pause` must set `Paused` and interrupt active work

Rejected:

- any extension/core duplication that exposes different model-visible goal tool contracts
- generic interrupted-turn pause in extension lifecycle TODO or implementation
- Ctrl+C implicitly setting `Paused` as a side effect of interrupting an active goal
- any move of steering authority into `ThreadGoal`, `GoalStore`, protocol schemas, metrics, or UI labels
- prompt-only high-level claim that `ext/goal` will later be fixed without wiring the maintained semantics into the skeleton/refactor plan

Needs discussion:

- `blocked`: prompt/tool discipline versus runtime/client evidence

## Implementation Plan

This is the implementation plan for the v132 Goal remediation. It is not a discussion guide. The next implementation session should follow the patch sequence in order and stop only at the explicit `blocked` gate.

### 1. Objective

End state for v132:

- `/goal` remains durable user intent plus runtime-owned hidden steering.
- Goal state remains storage/app-server/UI data: objective, status, budget, accounting.
- Goal steering remains runtime model input: `Initial`, `Continuation`, `BudgetLimit`, `ObjectiveUpdated`, role-selected by `GoalSteeringRole`, wrapped as role-neutral hidden `<goal_context>`, with the objective escaped in `<untrusted_objective>`.
- `GoalSteeringRole` remains config/runtime policy and defaults to `developer` in this fork.
- Core remains the live v132 steering owner until v133 moves ownership into `codex-rs/ext/goal`.
- If `codex-goal-extension` eventually owns goal runtime/prompting, it must not construct raw hidden messages with ad hoc roles. It must emit a typed goal steering request/message, or ask the host to inject one. The host/runtime remains the final authority applying configured steering role, marker wrapping, objective escaping, injection timing, and hidden-context classification.
- `GoalStore` is accepted as persistence for state and accounting only.
- `budgetLimited` and `usageLimited` are accepted stopped states. `budgetLimited` is accounting-owned; `usageLimited` is system/API/account-owned. The model cannot set either.
- Generic aborts do not pause goals.
- Ctrl+C is turn control: interrupt/cancel the current turn, allow queued input to advance immediately when present, leave goal status `Active`, and keep the next queued turn in goal pursuit mode.
- `/goal pause` is lifecycle control: set `Paused` and interrupt active running work so queued/autonomous continuation does not proceed under active goal pursuit after the pause.
- Extension goal code is treated as destination terrain and must not encode a competing tool, lifecycle, accounting, event, or steering contract.

### 2. Non-Goals

- Do not implement Rust code in this documentation pass.
- Do not implement v133 code while remediating v132. v133 requirements are carried as a forward-port checklist only.
- Do not preserve the v131 contract by keeping `codex-rs/core/src/goals.rs` as a hidden authority after v133 makes `ext/goal` the owner.
- Do not add `steeringRole` to `ThreadGoal`, SQL rows, app-server payloads, metrics, or UI labels as an accidental way to carry steering authority.
- Do not let extension tools go live with a different model-visible contract from core tools.
- Do not use metrics to drive goal status, continuation, or steering.
- Do not implement new runtime/client evidence for `blocked` until the user decides the blocked policy.
- Do not expand model authority beyond the imported v132 core candidate terrain. `complete` is accepted; current core `blocked` remains gated; extension `blocked` must not be added until the user decides.

### 3. Blocked Decision Gate

Do not implement `blocked` beyond this line until the user decides:

- Keep the imported v132 representation of `blocked` in protocol/state/TUI and the current core prompt/tool text visible as candidate terrain.
- Keep continuation suppression for persisted `Blocked` goals because v132 can already encounter that state.
- Do not add extension `blocked` support, extension blocked events, runtime blocker identity, runtime turn counters, or client evidence objects yet.
- Do not make extension `update_goal` accept `blocked` until the user decides prompt/tool self-certification is acceptable.
- Do not remove `blocked` from core/state/protocol/TUI until the user decides to reject prompt-only blocked.

When the user decides:

- If accepted as prompt/tool discipline: propagate `blocked` into `codex-rs/ext/goal/src/spec.rs`, `tool.rs`, `extension.rs`, and `events.rs`; keep the strict three-turn wording; add parity tests.
- If rejected as prompt-only discipline: remove model-settable `blocked` from core and extension tool specs/handlers, or add a runtime/client evidence path before mutation; update protocol/TUI semantics and tests in the same patch.

### 4. Patch Sequence

#### Patch 1: Lock live v132 core steering and prompt wording

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/templates/goals/initial.md`
- `codex-rs/core/templates/goals/continuation.md`
- `codex-rs/core/templates/goals/budget_limit.md`
- `codex-rs/core/templates/goals/objective_updated.md`
- `codex-rs/core/src/tools/handlers/goal_spec.rs`
- `codex-rs/core/src/tools/handlers/goal/update_goal.rs`

Expected changes:

- Keep `GoalSteeringKind::{Initial, Continuation, BudgetLimit, ObjectiveUpdated}` exhaustive.
- Keep all model-facing steering construction routed through `GoalSteeringMessage::into_response_input_item`.
- Keep `apply_external_thread_goal_status` using `GoalSteeringKind::ObjectiveUpdated`.
- Keep `goal_continuation_candidate_if_active` returning no continuation for `Paused`, `Blocked`, `UsageLimited`, `BudgetLimited`, and `Complete`.
- Keep all templates on `<untrusted_objective>` and source-authority wording.
- Reject reintroduced `<objective>`, "Work from evidence", "current worktree and external state as authoritative", and "audit must prove completion".
- Keep core `update_goal` rejection for `paused`, `active`, `budgetLimited`, and `usageLimited`.
- Leave core `blocked` exactly as current candidate terrain under the decision gate; do not extend it.

Acceptance criteria:

- All four steering kinds use the configured role.
- Hidden goal context remains role-neutral.
- Prompt text treats the user objective as escaped data, not authority.
- No status/metric/storage path decides the steering role.

#### Patch 2: Keep `GoalStore` as storage/accounting substrate only

Files:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/README.md`

Expected changes:

- Keep app-server/core callers routed through `state_db.thread_goals()`.
- Do not add steering role, prompt wording, hidden-context policy, or model-input construction to `ThreadGoal`, `GoalStore`, migrations, or protocol payloads.
- Preserve `status_after_budget_limit`.
- Preserve `usage_limit_active_thread_goal` moving `active` or `budget_limited` to `usage_limited`.
- Preserve requested `Paused`/`Blocked` over an existing `budget_limited` row as `budget_limited`.
- Preserve requested `Active` over budget as `budget_limited`.
- Preserve requested `Complete` completing a budget-limited goal.

Acceptance criteria:

- Storage changes cannot change model-facing steering behavior.
- App-server set/clear still coordinates live runtime hooks before/after persistence.
- Protocol and README document lifecycle statuses without defining steering authority.

#### Patch 3: Contain extension skeleton as future owner, not live second contract

Files:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/Cargo.toml`

Expected changes:

- Rewrite the `on_turn_abort` TODO. It must say generic abort stops in-memory turn accounting only and must not pause goals.
- Keep `on_turn_abort` implementation as `accounting_state(...).stop_turn(...)` only until host storage/accounting APIs exist.
- Rewrite turn stop/token usage TODOs to name required host capabilities exactly:
  - persisted `GoalStore` accounting
  - budget-limit status transition
  - budget-limit steering injection
  - ordered `ThreadGoalUpdated`
  - pending user/mailbox work check before continuation
- Rewrite app-server set/clear TODO to name accounting-before-mutation, objective-updated steering, active runtime refresh, and clear-runtime-state.
- Add or rewrite extension steering TODOs so future extension-owned prompting is a typed steering request path, not raw hidden message construction.
- Do not wire incomplete extension accounting into behavior yet.
- Do not expose extension as authoritative unless a host backend is installed and tool parity is implemented.
- If adding source-file unit tests under `ext/goal/src`, remove `test = false` from `codex-rs/ext/goal/Cargo.toml` or add integration tests under `codex-rs/ext/goal/tests/` instead.

Acceptance criteria:

- Extension skeleton no longer carries the rejected "interrupted turns pause goals" policy.
- Skeleton documents the actual maintained ownership model that must move into `ext/goal` in v133.
- No in-memory extension accounting is treated as durable status/accounting authority.

#### Patch 4: Prevent core/extension tool drift before extension tools are live

Files:

- `codex-rs/ext/goal/src/spec.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/Cargo.toml`
- `codex-rs/core/src/tools/handlers/goal_spec.rs`
- `codex-rs/core/src/tools/handlers/goal/update_goal.rs`

Expected changes:

- Add explicit tests comparing core and extension tool names, create guidance, update descriptions, accepted statuses, and output behavior where the types permit comparison.
- Keep extension `update_goal` complete-only while `blocked` remains undecided, or gate extension tool installation so complete-only extension tools cannot be exposed alongside core complete-or-blocked tools.
- If implementing the gate, change `GoalExtension::tools` or install path so `update_goal` is not contributed unless backend/tool status coverage matches the core accepted status set.
- Rename/reshape `GoalToolBackend` only after deciding whether extension needs `set_goal_status(status)` or separate `complete_goal` / `block_goal`. Do not add `block_goal` under the unresolved blocked gate.
- Keep model tools unable to set `paused`, `active`, `budgetLimited`, or `usageLimited`.

Acceptance criteria:

- There is no production path where the model sees two different `update_goal` contracts.
- The plan does not quietly implement `blocked` in extension.
- If extension tools remain unavailable because `NoGoalToolBackend` is the only installer, tests should assert that containment condition.
- If tests live in `src/*.rs`, enable library tests in `codex-rs/ext/goal/Cargo.toml`; otherwise place them in `codex-rs/ext/goal/tests/goal_tools.rs`.

#### Patch 5: Align extension events with core/app-server ordering

Files:

- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/extension.rs`

Expected changes:

- Keep `GoalEventEmitter::thread_goal_updated`.
- Keep create/update events after successful backend mutation.
- Add a host-backend hook before `complete_goal` for final active-turn accounting with budget steering suppressed, or explicitly gate completion events until the host backend can perform that sequence.
- Keep the `turn_id: None` TODO as a tracked capability gap only if `ToolCall` still lacks current turn id.
- Do not add blocked event handling until the blocked decision is resolved.

Acceptance criteria:

- Extension events cannot skip accounting or terminal metrics once extension completion is live.
- Event ordering is mutation first, notification second.
- Turn attribution gap is explicit and test-covered as current behavior, not forgotten.

#### Patch 6: Lock Ctrl+C and `/goal pause` behavior

Files:

- `codex-rs/tui/src/chatwidget/interaction.rs`
- `codex-rs/tui/src/chatwidget/slash_dispatch.rs`
- `codex-rs/tui/src/app_event.rs`
- `codex-rs/tui/src/app/event_dispatch.rs`

Expected changes:

- Ensure `ChatWidget::on_ctrl_c` remains turn control only.
- Remove or avoid any `pause_active_goal_for_interrupt()` call from Ctrl+C.
- Keep Ctrl+C using `AppCommand::interrupt_and_restore_prompt_if_no_output()` or equivalent.
- Preserve the queued-message behavior: if input is queued when Ctrl+C cancels the current turn, the queued input may be submitted immediately and the goal remains `Active`.
- For `/goal pause`, after sending `AppEvent::SetThreadGoalStatus { status: Paused }`, also submit an interrupt when cancellable work is active.
- Ensure pause is enqueued before or atomically with interrupt so pending work cannot drain under an active goal after `/goal pause`.
- Keep `/goal resume` as status-only; it should not synthesize model tool calls.
- Keep paused-idle Ctrl+C as normal quit behavior.

Acceptance criteria:

- Ctrl+C with queued input cancels current work and advances queued input while the goal remains `Active`; the queued turn is still in goal pursuit mode.
- `/goal pause` during active work both persists `Paused` and interrupts running work.
- `/goal pause` with queued input does not let queued/autonomous work run under active goal pursuit after the pause.

#### Patch 7: Metrics remain observational

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/otel/src/metrics/names.rs`

Expected changes:

- Keep `GOAL_RESUMED_METRIC`.
- Keep resumed metric on active persisted-goal restore.
- Keep resumed metric on explicit `Paused`/`Blocked`/`UsageLimited` -> `Active` transition if those statuses remain accepted.
- Do not use metrics to mutate state, inject steering, or determine initial steering.

Acceptance criteria:

- Removing telemetry would not change goal behavior.
- Resume behavior is tested through status/steering assertions, not only metric assertions.

#### Patch 8: Record v133 forward-port checklist, but do not implement v133 in this v132 patch

Files:

- `local/goal_research/goal_132.md`
- hosted Review Finding remediation plan

Expected changes:

- Keep the forward-port requirement explicit:
  - `ext/goal/src/steering.rs` owns typed steering requests/messages for `Initial`, `Continuation`, `BudgetLimit`, and `ObjectiveUpdated`
  - the host/runtime remains final authority for configured role selection, `<goal_context>` marker wrapping, `<untrusted_objective>` escaping, injection timing, and hidden-context classification
  - `ext/goal/src/runtime.rs` owns continuation, budget-limit steering requests, usage-limit stopping, generic abort cleanup, pause/resume runtime state
  - `ext/goal/src/api.rs` owns app-server/user mutation behavior
  - `ext/goal/src/tool.rs` / `spec.rs` own one model tool contract
  - `ext/goal/src/events.rs` owns ordered notifications
  - `codex-state` remains storage only
- State clearly that core must not remain a hidden second authority after v133.
- State clearly that extension ownership does not mean ad hoc extension-owned role construction.

### 5. Per-Commit Handling

#### `a80f07ec4aa9` - goal extension skeleton

Treatment: adapt.

Files:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/accounting.rs`
- `codex-rs/ext/goal/src/spec.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/lib.rs`

Behavioral acceptance criteria:

- Extension abort handling does not pause goals.
- Extension tool contribution cannot expose a divergent `update_goal` contract alongside core.
- Extension accounting remains scaffolding until persisted through host `GoalStore`.
- Extension TODOs name the maintained semantics to implement in v133 rather than upstream's rejected interrupt-pause policy.
- Extension steering TODOs require typed steering requests/messages or host injection; raw hidden messages with ad hoc roles are rejected.

#### `7ee7fe239f` - GoalStore

Treatment: accept.

Files:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/runtime.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`

Behavioral acceptance criteria:

- All goal persistence uses `state_db.thread_goals()`.
- `GoalStore` contains no steering role/prompt/hidden-context policy.
- App-server/core external mutations still drive live runtime side effects.

#### `500ef67ed1` - resumed metrics

Treatment: accept.

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/otel/src/metrics/names.rs`

Behavioral acceptance criteria:

- Metrics observe restore/resume only.
- Metrics do not change status, inject steering, or replace one-shot initial steering.

#### `4ca60ef9fffe` - extension goal events

Treatment: adapt.

Files:

- `codex-rs/ext/goal/src/events.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/extension.rs`

Behavioral acceptance criteria:

- Create/update events are emitted only after successful backend mutation.
- Completion event path cannot skip final accounting once extension backend is live.
- `turn_id: None` remains a tracked host API gap, not accepted final parity.
- No blocked event path until blocked policy is decided.

#### `0d344aca9b` - blocked and usage-limited statuses

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

Behavioral acceptance criteria:

- `usageLimited` and `budgetLimited` are non-model-settable stopped states.
- `usageLimited` can supersede `budgetLimited`.
- `Paused`, `Blocked`, and `UsageLimited` remain resumable through user/client action.
- Incoming prompt wording is adapted to v131 source-authority and `<untrusted_objective>`.
- `blocked` remains gated as above.

#### `55f6bbc6672` - explicit pause transitions

Treatment: accept/adapt.

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/tasks/mod.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/tui/src/chatwidget/interaction.rs`
- `codex-rs/tui/src/chatwidget/slash_dispatch.rs`

Behavioral acceptance criteria:

- Core generic abort accounts/clears without pausing.
- Ctrl+C does not set `Paused`.
- `/goal pause` sets `Paused` and interrupts active work.
- Queued input after Ctrl+C may advance immediately and remains in goal pursuit mode; queued input after `/goal pause` does not continue under active goal pursuit.

### 6. Tests To Write Or Change

Core tests:

- File: `codex-rs/core/src/goals.rs`
  - Keep or add `goal_steering_message_uses_configured_role_for_all_kinds`.
  - Keep or add `continuation_prompt_allows_complete_and_strict_blocked_updates` only while blocked remains prompt-tool candidate terrain.
  - Keep or add prompt tests asserting `<untrusted_objective>` and absence of `<objective>`, "Work from evidence", "current worktree and external state as authoritative", and "audit must prove completion".

- File: `codex-rs/core/src/session/tests.rs`
  - Existing: `interrupt_accounts_active_goal_without_pausing`.
  - Existing: `shutdown_without_active_turn_keeps_active_goal_active`.
  - Existing: `usage_limit_runtime_stops_active_goal_and_prevents_idle_continuation`.
  - Existing: `budget_limited_accounting_steers_active_turn_without_aborting`.
  - Existing: `update_goal_tool_rejects_pausing_goal`.
  - Existing/gated: `update_goal_tool_marks_goal_blocked` remains candidate terrain until blocked decision.
  - Add if missing: `resumed_active_goal_emits_initial_steering_independent_of_resumed_metric`.

State tests:

- File: `codex-rs/state/src/runtime/goals.rs`
  - Existing: `usage_limit_active_thread_goal_updates_active_or_budget_limited_goals`.
  - Existing: `pausing_budget_limited_goal_preserves_terminal_status`.
  - Existing/gated: `blocking_budget_limited_goal_preserves_terminal_status`.
  - Existing: `activating_goal_already_over_budget_keeps_it_budget_limited`.
  - Add if missing: `goal_store_contains_no_steering_policy_fields` is not a useful runtime test; use an `rg` verification command instead.

App-server tests:

- File: `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - Existing: `thread_resume_keeps_paused_goal_paused`.
  - Existing: `thread_goal_set_preserves_budget_limited_same_objective`.
  - Existing: `thread_goal_set_persists_resumable_stopped_statuses`.
  - Existing: `thread_goal_set_edits_objective_without_resetting_usage`.
  - Existing: `thread_goal_clear_deletes_goal_and_notifies`.
  - Add if missing: `thread_goal_set_active_over_budget_remains_budget_limited`.

Extension tests:

- File: `codex-rs/ext/goal/src/spec.rs`
  - Add `extension_update_goal_statuses_are_contained_while_blocked_is_gated`.
  - Add `extension_create_goal_description_matches_core_contract`.

- File: `codex-rs/ext/goal/src/tool.rs`
  - Add `extension_update_goal_rejects_paused_active_budget_and_usage_limited`.
  - Add `extension_update_goal_completion_emits_after_backend_mutation`.
  - Do not add blocked success test until blocked decision.

- File: `codex-rs/ext/goal/src/extension.rs`
  - Add `turn_abort_stops_accounting_without_status_mutation`.
  - Add `goal_tools_not_contributed_when_backend_contract_is_not_authoritative` if tool containment is implemented by gating contribution.

TUI tests:

- File: `codex-rs/tui/src/chatwidget/tests/slash_commands.rs`
  - Change `goal_control_slash_commands_emit_goal_events` if `/goal pause` now emits both status and interrupt events.
  - Add `goal_pause_interrupts_active_turn_after_status_event`.
  - Add `goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal`.

- File: `codex-rs/tui/src/chatwidget/tests/status_and_layout.rs`
  - Replace existing `ctrl_c_interrupt_pauses_active_goal_turn` with Ctrl+C turn-control coverage.
  - Add `ctrl_c_interrupts_active_turn_without_pausing_goal`.
  - Add `ctrl_c_with_queued_message_advances_queue_while_goal_remains_active`.
  - Add `paused_idle_ctrl_c_requests_quit_without_goal_mutation`.

- File: `codex-rs/tui/src/chatwidget/tests/goal_menu.rs`
  - Keep snapshots for blocked and usage-limited menu states.
  - Update snapshots only if visible text changes.

### 7. Verification Commands

Run these from `codex-rs` unless noted.

Formatting:

```powershell
just fmt
```

Core focused tests:

```powershell
cargo test -p codex-core goal_steering_message_uses_configured_role_for_all_kinds
cargo test -p codex-core continuation_prompt_allows_complete_and_strict_blocked_updates
cargo test -p codex-core interrupt_accounts_active_goal_without_pausing
cargo test -p codex-core usage_limit_runtime_stops_active_goal_and_prevents_idle_continuation
cargo test -p codex-core update_goal_tool_rejects_pausing_goal
```

State focused tests:

```powershell
cargo test -p codex-state usage_limit_active_thread_goal_updates_active_or_budget_limited_goals
cargo test -p codex-state pausing_budget_limited_goal_preserves_terminal_status
cargo test -p codex-state activating_goal_already_over_budget_keeps_it_budget_limited
```

App-server focused tests:

```powershell
cargo test -p codex-app-server thread_resume_keeps_paused_goal_paused
cargo test -p codex-app-server thread_goal_set_preserves_budget_limited_same_objective
cargo test -p codex-app-server thread_goal_set_persists_resumable_stopped_statuses
cargo test -p codex-app-server thread_goal_clear_deletes_goal_and_notifies
```

Extension focused tests:

```powershell
cargo test -p codex-goal-extension extension_update_goal_statuses_are_contained_while_blocked_is_gated
cargo test -p codex-goal-extension turn_abort_stops_accounting_without_status_mutation
cargo test -p codex-goal-extension extension_update_goal_completion_emits_after_backend_mutation
```

TUI focused tests:

```powershell
cargo test -p codex-tui goal_control_slash_commands_emit_goal_events
cargo test -p codex-tui goal_pause_interrupts_active_turn_after_status_event
cargo test -p codex-tui goal_pause_with_queued_message_does_not_submit_queued_message_under_active_goal
cargo test -p codex-tui ctrl_c_interrupts_active_turn_without_pausing_goal
cargo test -p codex-tui ctrl_c_with_queued_message_advances_queue_while_goal_remains_active
cargo test -p codex-tui paused_idle_ctrl_c_requests_quit_without_goal_mutation
```

Schema/docs regeneration only if app-server protocol types or generated schemas change:

```powershell
just write-app-server-schema
cargo test -p codex-app-server-protocol
```

Lint/fix after Rust edits:

```powershell
just fix -p codex-core
just fix -p codex-state
just fix -p codex-app-server
just fix -p codex-goal-extension
just fix -p codex-tui
```

Use only the crate-specific `just fix -p ...` commands for crates actually changed.

Static audits from repository root:

```powershell
rg -n "get_thread_goal|replace_thread_goal|update_thread_goal|delete_thread_goal|pause_active_thread_goal|usage_limit_active_thread_goal|account_thread_goal_usage" codex-rs
rg -n "steeringRole|GoalSteeringRole|goal_context|untrusted_objective|Work from evidence|current worktree|audit must prove" codex-rs/core codex-rs/ext/goal codex-rs/state codex-rs/app-server codex-rs/tui
rg -n "pause_active_goal_for_interrupt|interrupt_and_restore_prompt_if_no_output|SetThreadGoalStatus|/goal pause" codex-rs/tui/src
```

## Exact MCP Calls

Fetch v132 finding:

```json
{
  "versionId": "379ea2ff-b283-4188-950e-813aa7175907",
  "findingId": "4b815ebf-52b7-426a-af4d-f52ecd118f7f"
}
```

Tool:

```text
mcp__review_dedeluger__.get_review_finding
```

Fetch v131 finding:

```json
{
  "versionId": "ef76fd1d-88f9-4620-bfc0-8f25dc73b0a7",
  "findingId": "b87af2a8-558d-40f6-a57a-74a6161462c1"
}
```

Tool:

```text
mcp__review_dedeluger__.get_review_finding
```

Useful local commands:

```powershell
git show --name-status --format=fuller a80f07ec4aa9dd311091b91d41945043765a1caa
git show --name-status --format=fuller 7ee7fe239f8bd2f478a30c369c2566004769a3da
git show --name-status --format=fuller 500ef67ed15fae5148d5cfcdf42973ffead19b12
git show --name-status --format=fuller 4ca60ef9fffe76fb4f86d606f7d4a2f727f6cd25
git show --name-status --format=fuller 0d344aca9b0caee4e5a508ee10d8a72f4d416896
git show --name-status --format=fuller 55f6bbc6672a97efe1321318120b2054bf6b841f
```

```powershell
rg -n "GoalSteeringRole|GoalSteeringKind|GoalSteeringMessage|ObjectiveUpdated|UsageLimit|Blocked|TaskAborted|usage_limit|goal_context|untrusted_objective" codex-rs/core/src/goals.rs codex-rs/core/templates/goals
rg -n "GoalStore|ThreadGoalStatus|usage_limit|budget_limited|blocked|paused|active|status_after_budget_limit" codex-rs/state/src/runtime/goals.rs codex-rs/state/src/model/thread_goal.rs
rg -n "GoalToolBackend|GoalToolExecutor|get_goal|create_goal|update_goal|GoalExtension|GoalEventEmitter|ThreadGoalUpdated" codex-rs/ext/goal/src
rg -n "pause_active_goal_for_interrupt|SetThreadGoalStatus|Blocked|UsageLimited|BudgetLimited" codex-rs/tui/src
```
