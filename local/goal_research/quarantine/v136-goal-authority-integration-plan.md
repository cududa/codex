# v136 Goal Authority Integration Plan

This plan integrates upstream `rust-v0.135.0..rust-v0.136.0` while correcting
the v135 Goal authority failure mode.

The core invariant is not "Goal exists somewhere." It is:

```text
For every model request where an active Goal should steer,
the final serialized model input contains exactly one current Goal frame
as developer-role input by default.
```

"At the model boundary" means the last point before each model request is
serialized, not a one-time placement at thread start. The frame is rebuilt from
durable structured Goal state for the request. It does not need to be appended
to permanent history on every sample, and old rendered Goal messages are never
runtime authority.

## Direction Lock

Accept upstream v136 terrain:

```text
InternalModelContextFragment
InternalContextSource
<codex_internal_context source="goal">
direct ResponseItem pending input
inject_if_running
app-server resume initialTurnsPage
thread-start facts / tool eligibility
turn-error lifecycle / usage-limit handling
thread-idle lifecycle hook
TurnItemEmitter
```

Adapt that terrain to local Goal authority:

```text
durable thread_goals state is the only authority source
rendered Goal wrappers are request/history artifacts only
final request assembly removes all pure historical Goal artifacts
final request assembly rebuilds exactly one current developer-role Goal frame
active v136 wrapper is <codex_internal_context source="goal">
old <goal_context> is recognized only for cleanup/hiding, never authority
```

The v136 canonical model-bound Goal item is:

```rust
ResponseItem::Message {
    role: "developer".to_string(),
    content: vec![ContentItem::InputText {
        text: "<codex_internal_context source=\"goal\">...</codex_internal_context>"
            .to_string(),
    }],
    id: None,
    phase: None,
}
```

The source/provenance wrapper supplies hidden classification. The outer message
role supplies authority. Both are required.

## Clean Runtime Rule

There is no runtime compatibility authority path for old Goal chats.

Runtime must not parse old `<goal_context>` or old internal-context messages to
recover an active Goal. If old sessions ever need migration, that is an
explicit offline parser/importer, not request-time fallback logic.

In production runtime:

```text
old rendered Goal wrapper in history -> stale rendered artifact
durable thread_goals row -> current Goal authority source
request-local current Goal frame -> model conditioning
```

If durable structured Goal state is absent, runtime must not resurrect a Goal
from a rendered wrapper.

## Audited Current Gaps

The code-only v135 audit found these production gaps:

| Gap | Exact production surface | Required v136 repair |
|---|---|---|
| No final request exactly-one enforcement. | `codex-rs/core/src/session/turn.rs::run_sampling_request`, `build_prompt`; `codex-rs/core/src/context_manager/history.rs::for_prompt`. | Add a Goal-owned request ensurance boundary immediately after `for_prompt(...)` and before `build_prompt(...)`. |
| Active normal user turns can have zero current Goal frame. | `codex-rs/core/src/goals.rs::mark_thread_goal_turn_started` accounts only; `run_turn` then samples history. | Request ensurance must rebuild from `thread_goals` for ordinary turns, not only continuation turns. |
| `create_goal` same-turn follow-up can be tool-output-only. | `codex-rs/core/src/tools/handlers/goal/create_goal.rs::handle`; `codex-rs/core/src/goals.rs::create_thread_goal`. | Persist state, mark the next sample as needing Initial steering, and let request ensurance build the developer frame. |
| New/replaced app-server Goal can mutate state without current-call authority. | `codex-rs/app-server/src/request_processors/thread_goal_processor.rs::thread_goal_set_inner`; `codex-rs/core/src/goals.rs::apply_external_thread_goal_status`. | External create/replace must mark the next active or idle sample as needing Initial/ObjectiveUpdated steering from durable state. |
| Compaction filters Goal from effective chat. | `codex-rs/core/src/compact.rs::run_compact_task_inner_impl`; `codex-rs/core/src/compact_remote.rs::process_compacted_history`; `codex-rs/core/src/compact_remote_v2.rs::build_v2_compacted_history`. | After compaction installs replacement history, the next request must rebuild the current Goal frame from durable state. |
| Rollout reconstruction filters old Goal frames without replacement. | `codex-rs/core/src/session/rollout_reconstruction.rs::reconstruct_history_from_rollout`. | Reconstruction should filter artifacts only; final request ensurance must restore the current frame from durable state. |
| Rollback keeps the durable row but rebuilds history without Goal. | `codex-rs/core/src/session/handlers.rs::thread_rollback`. | The first post-rollback model request must rebuild the current frame from the surviving durable state. |
| Fork creates a new thread/history without copied Goal state. | `codex-rs/core/src/thread_manager.rs::fork_thread_from_history`; `codex-rs/app-server/src/request_processors/thread_processor.rs::thread_fork_inner`. | User-visible forks that should inherit Goal must copy structured Goal state to the new `thread_id`; Goal-ineligible forks must intentionally omit state and filter artifacts. |
| Pending active-turn Goal carry stores rendered items. | `codex-rs/core/src/state/turn.rs::TurnState::current_turn_goal_steering_items`; `codex-rs/core/src/session/input_queue.rs::inject_goal_response_items`. | Store Goal steering intent/kind, not rendered frames; render only at request ensurance from durable state. |
| Multiple Goal frames can coexist by purpose. | `GoalSteeringCarryPurpose::{InitialOrContinuation, BudgetLimit, ObjectiveUpdated}` and same-purpose replacement only. | Select one strongest current steering kind for the request; emit exactly one frame. |
| Role can still be user by configuration. | `codex-rs/config/src/config_toml.rs::GoalSteeringRole`; `codex-rs/core/src/config/mod.rs::GoalsConfig`. | Keep developer as default. If explicit user role remains supported, tests must prove it is the only user-role path. |
| `ext/goal` exists but is not production-installed. | `codex-rs/app-server/src/extensions.rs::thread_extensions`; `codex-rs/ext/goal/src/extension.rs::install_with_backend`. | Do not rely on `ext/goal` as production owner until a later slice explicitly installs and proves it. |

## Incoming Commit Treatment

| Commit | Treatment | Plan |
|---|---|---|
| `740d942f90` internal model context fragments for Goal | Accept + adapt | Use `InternalModelContextFragment` / `InternalContextSource` and `<codex_internal_context source="goal">`; never let source `"goal"` substitute for developer role. |
| `1c7832ffa3` direct pending response items | Accept + adapt | Move pending input to `ResponseItem`, but Goal pending state must store steering intent rather than rendered frames. |
| `8f6a945ec9` `inject_if_running` | Accept + adapt | Keep generic injection/wakeup; Goal authority is enforced by the Goal-owned request ensurance boundary. |
| `2a1158b8e2` resume `initialTurnsPage` | Accept | UI resume shape is not model authority; hide raw wrappers there with shared predicates. |
| `ec803fe6c7` thread-start facts | Accept | Tool visibility only. It must not decide Goal authority. |
| `e426d48f6d` Goal tool eligibility | Accept + adapt | Tool visibility is separate from Goal model-input steering. |
| `e7d156eb08` turn error lifecycle | Accept | Extension lifecycle terrain. |
| `27e256bc40` Goal usage limits from turn errors | Accept + adapt | Use lifecycle ownership for usage-limit state changes; request ensurance remains the model-input boundary. |
| `462deb0426` thread-idle lifecycle | Accept + adapt | Idle lifecycle can schedule work; it must not duplicate or replace request ensurance. |
| `2066874415` TurnItemEmitter | Accept | Visible event plumbing only. |

## Architecture

### Durable State

Files:

- `codex-rs/state/src/runtime/goals.rs`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`

`thread_goals` is the durable source of truth. It stores objective, status,
budget, usage, and timestamps for the current thread Goal.

No rendered Goal wrapper is durable authority.

### Request-Local Goal Frame

Files:

- `codex-rs/core/src/context/internal_model_context.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/ext/goal/src/steering.rs`

Add a Goal-specific role-bearing builder:

```rust
pub enum GoalSteeringModelRole {
    User,
    Developer,
}

impl GoalSteeringModelRole {
    pub fn as_response_role(self) -> &'static str;
}

pub fn goal_internal_context_response_item(
    prompt: String,
    role: GoalSteeringModelRole,
) -> ResponseItem;
```

Active v136 Goal producers must use this builder. They must not call
`ContextualUserFragment::into_response_input_item()` for active Goal steering.

### Request Ensurance Boundary

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/state/turn.rs`

Add one Goal-owned request boundary:

```rust
Session::ensure_goal_model_input_for_request(
    turn_context: &TurnContext,
    input: &mut Vec<ResponseItem>,
) -> anyhow::Result<GoalInputEnsuranceOutcome>
```

Call it in `codex-rs/core/src/session/turn.rs::run_sampling_request` after:

```rust
sess.clone_history()
    .await
    .for_prompt(&turn_context.model_info.input_modalities)
```

and before:

```rust
build_prompt(...)
```

Responsibilities:

- remove all pure historical Goal artifacts from transcript-derived input;
- read current durable `thread_goals` state;
- decide whether the active Goal should steer this sample;
- combine durable state with any current-turn Goal steering intent;
- choose exactly one current `GoalSteeringKind`;
- render the prompt from durable state;
- escape objective text inside `<untrusted_objective>`;
- wrap with `<codex_internal_context source="goal">`;
- set outer role to developer by default;
- append exactly one request-local current Goal frame to the effective model input;
- emit no Goal frame when there is no active durable Goal or the current mode
  intentionally ignores Goal steering;
- never parse old rendered wrappers into state.

This is not blind repeated history append. The frame is part of the serialized
request input for that sample. It should not be recorded back into durable
conversation history merely because request ensurance added it.

### Steering Intent Carry

Files:

- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/ext/goal/src/runtime.rs`

Replace rendered current-turn Goal carry with structured intent:

```rust
pub enum GoalSteeringRequestKind {
    Initial,
    Continuation,
    BudgetLimit,
    ObjectiveUpdated,
}

pub struct GoalSteeringRequest {
    pub kind: GoalSteeringRequestKind,
    pub goal_id: String,
}
```

The exact Rust shape can follow local style, but the responsibility is fixed:
carry Goal steering intent, not rendered `ResponseItem` / `ResponseInputItem`
wrappers.

Selection rule for a single request:

```text
ObjectiveUpdated > BudgetLimit > Initial > Continuation
```

`ObjectiveUpdated` wins because it supersedes prior objective text. `BudgetLimit`
wins over ordinary Initial/Continuation because it carries runtime budget state.
Initial wins over Continuation for a newly active goal that has not yet been
presented in the current active run.

If durable state no longer has that `goal_id` active, discard the request.

## Implementation Steps

### Step 1: Shared Internal Context Syntax

Files:

- `codex-rs/protocol/src/internal_context.rs`
- `codex-rs/protocol/src/lib.rs`
- `codex-rs/core/src/context/internal_model_context.rs`
- `codex-rs/core/src/context/mod.rs`

Implement shared helpers for:

- rendering `<codex_internal_context source="goal">`;
- validating `InternalContextSource`;
- detecting pure Goal internal-context `ResponseItem`s;
- detecting old pure `<goal_context>` artifacts for cleanup only.

Predicates must require:

- `role == "user" || role == "developer"`;
- exactly one `ContentItem::InputText`;
- a pure wrapper with no mixed visible text;
- source exactly `goal` for new internal context.

Do not detect arbitrary user prose containing marker-like strings.

### Step 2: Convert Active Goal Wrapper To Internal Context

Files:

- `codex-rs/core/src/context/internal_model_context.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/ext/goal/src/steering.rs`

Active v136 Goal steering must emit new internal context:

```text
<codex_internal_context source="goal">...</codex_internal_context>
```

Remove fresh active `<goal_context>` emission from:

- core Initial;
- core Continuation;
- core BudgetLimit;
- core ObjectiveUpdated;
- extension BudgetLimit;
- extension ObjectiveUpdated.

Keep old `<goal_context>` only in exact artifact predicates.

### Step 3: Add Request Ensurance

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/context_manager/history.rs`

Implement `Session::ensure_goal_model_input_for_request(...)`.

Algorithm:

```text
input = transcript-derived prompt input
remove pure old/new Goal artifacts from input

if Goals feature disabled, current mode ignores Goals, ephemeral state lacks DB,
or no active durable Goal:
  return without adding a frame

read durable active Goal
read current-turn steering intent, if any
choose one steering kind
render current prompt from durable Goal state
append one developer-role Goal internal context item to input
```

This should run for every sampling attempt, including retries and follow-up
samples, because each serialized request must be correct on its own terms.

### Step 4: Stop Carrying Rendered Goal Artifacts As Authority

Files:

- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`

Change current-turn Goal carry from rendered items to structured steering
intent. Compaction should not reinsert rendered Goal frames from
`current_turn_goal_steering_items()`.

After compaction installs replacement history, the next request relies on
`ensure_goal_model_input_for_request(...)` to rebuild the current frame from
durable state.

### Step 5: Repair Create / New Active / Objective Update

Files:

- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/tools/handlers/goal/create_goal.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/runtime.rs`

`create_goal` tool output is not steering.

On new active Goal:

- persist `thread_goals`;
- mark Initial steering intent for the next model-bound sample;
- wake/continue only as needed;
- let request ensurance build exactly one current developer-role Initial frame.

On objective update:

- persist updated durable Goal state first;
- mark ObjectiveUpdated steering intent;
- request ensurance reads the updated row and emits one current frame.

On budget limit:

- persist updated usage/status first;
- mark BudgetLimit steering intent;
- request ensurance reads the updated row and emits one current frame.

### Step 6: Compaction, Resume, Fork, Rollback

Files:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/handlers.rs`
- `codex-rs/core/src/thread_manager.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`

Compaction:

- may filter old/new Goal artifacts from replacement history;
- must not carry rendered Goal frames forward as authority;
- must rely on request ensurance before the next model call.

Resume:

- preserve same-thread durable `thread_goals`;
- restore runtime accounting/effects;
- hide rendered artifacts from UI/replay surfaces;
- rely on request ensurance for the next model call.

Rollback:

- same `thread_id` means the durable Goal row remains unless explicitly cleared;
- after history reconstruction, request ensurance rebuilds the current frame.

Fork:

- user-visible fork inherits active structured Goal state by copying the row to
  the new `thread_id` when the fork should continue the Goal;
- Goal-ineligible spawned review/subagent threads intentionally omit Goal state;
- no fork path uses rendered wrappers as the only carrier.

### Step 7: App-Server / UI Surfaces

Files:

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_lifecycle.rs`
- `codex-rs/app-server/src/thread_state.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`

Accept `initialTurnsPage` and related resume/fork/rollback response surfaces.

Use shared pure-wrapper predicates to hide raw Goal artifacts from:

- `thread.turns`;
- `initialTurnsPage.data`;
- `thread/read` with turns;
- `thread/fork` response turns;
- rollback response turns;
- raw response item notifications.

These are UI/projection filters only. They do not prove model authority.

### Step 8: Lifecycle Terrain

Files:

- `codex-rs/ext/extension-api/src/contributors/thread_lifecycle.rs`
- `codex-rs/ext/extension-api/src/contributors/turn_lifecycle.rs`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/tasks/mod.rs`

Accept upstream lifecycle hooks.

Use them for state/accounting/tool visibility. Do not let lifecycle hooks become
the authority boundary. The request ensurance boundary remains the last word for
model-visible Goal delivery.

Do not make `ext/goal` the production owner in this v136 slice unless a separate
implementation explicitly installs it in app-server and proves all Goal paths.

## Placement Semantics

The current Goal frame should be inserted request-locally at the final request
assembly point, after transcript-derived history has been converted to prompt
input and stale Goal artifacts have been removed.

This means:

- the Goal is present in every full serialized request where it should steer;
- it is close to the request boundary, not stranded far back in a sliding
  history window;
- it is not appended to permanent history repeatedly;
- retries/follow-up samples rebuild the request-local frame again from durable
  state;
- stateful `previous_response_id` paths may omit the literal frame only if the
  referenced model-side context is proven to already contain the current frame.

If `previous_response_id` cannot prove that, include/refresh the request-local
Goal frame in the delta path.

## Tests Required

Tests must inspect final model request input, not just constructors.

### Context / Predicates

Files:

- `codex-rs/protocol/src/internal_context_tests.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`

Assert:

- new Goal internal context is detected;
- old `<goal_context>` is detected only as a pure artifact;
- malformed source values are rejected;
- non-Goal internal context is not Goal;
- mixed visible+hidden content is not dropped as pure Goal;
- developer-role Goal internal context is hidden from UI/event mapping.

### Final Request Authority

Files:

- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

Assert final `/responses` input contains exactly one current developer-role Goal
frame for:

- `create_goal` follow-up sample;
- ordinary user turn while Goal is active;
- idle Initial/Continuation Goal turn;
- app-server new/replaced active Goal during a running turn;
- ObjectiveUpdated;
- BudgetLimit;
- same-turn tool follow-up;
- retry sampling;
- manual/pre-turn compaction;
- local/remote/remote-v2 compaction;
- resume;
- rollback;
- user-visible fork that inherits Goal state.

Assert:

- no final request contains duplicate pure Goal frames;
- no final request relies on old `<goal_context>` as current authority;
- explicit `goals.steering_role = "user"` is the only user-role active Goal
  path, if that override remains supported.

### Filtering / UI

Files:

- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/app-server/tests/suite/v2/thread_read.rs`
- `codex-rs/app-server/tests/suite/v2/thread_fork.rs`
- `codex-rs/app-server/tests/suite/v2/thread_rollback.rs`

Assert:

- stale old and new Goal artifacts are removed from reconstructed history;
- ordinary user messages remain;
- non-Goal internal context remains;
- UI/app-server surfaces hide raw Goal wrappers;
- filtering a stale Goal artifact is paired with final-request ensurance when
  a durable active Goal exists.

## Non-Goals

- Do not keep `<goal_context>` as an active v136 steering wrapper.
- Do not parse old rendered Goal wrappers at runtime to recover active Goal
  state.
- Do not globally make all internal context developer-role.
- Do not use source `"goal"` as a substitute for outer developer role.
- Do not rely on historical hidden Goal items to preserve an active Goal.
- Do not treat filtering, compaction cleanup, app-server hiding, or marker
  detection as Goal delivery.
- Do not move to v137 `TurnInputContributor` early in v136.
- Do not move full production ownership to `ext/goal` in this v136 slice unless
  it is explicitly installed and proven. v138 remains the likely ownership
  pivot.

## Verification Commands For Implementation

After Rust implementation, run focused checks:

```powershell
cd codex-rs
just fmt
just test -p codex-protocol internal_context
just test -p codex-core internal_model_context
just test -p codex-core goal_context
just test -p codex-core rollout_reconstruction
just test -p codex-core create_goal
just test -p codex-core budget_limited_accounting_steers_active_turn_without_aborting
just test -p codex-core external_objective_change_steers_active_turn
just test -p codex-core late_goal_steering_injection_is_not_persisted_unsampled
just test -p codex-goal-extension goal_extension_backend
just test -p codex-app-server suppresses_goal_context_raw_response_item_notifications
just test -p codex-app-server thread_resume
```

For touched Rust crates, consider scoped fixes after implementation:

```powershell
just fix -p codex-protocol
just fix -p codex-core
just fix -p codex-goal-extension
just fix -p codex-app-server
just fix -p codex-app-server-protocol
```

Do not run full workspace tests by default.

## Expected End State

- Active v136 Goal steering uses
  `<codex_internal_context source="goal">`.
- Default active Goal steering is developer-role model input.
- Old `<goal_context>` is cleanup/hiding only.
- Durable `thread_goals` state is the only authority source.
- Every model request that should pursue an active Goal gets exactly one
  request-local current Goal frame from durable state before serialization.
- The Goal frame is present per request, not only at thread start.
- The Goal frame is not spammed into permanent history on every sample.
- Create/new-active, ordinary user turns, continuation, budget-limit,
  objective-updated, retry, compaction, resume, fork, and rollback paths all
  have final-request proof.
- UI/app-server/raw surfaces hide raw Goal wrappers without being confused with
  model-input delivery.
