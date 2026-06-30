# Goal Steering Implementation Start Guide

This is the "start here" guide for an agent beginning from the `0.130` family and working
forward. The longer rationale lives in `local/goal-steering-role-compatibility-design.md`.

Do not spend the first context window re-proving the premise. The implementation task is to
preserve the useful `0.130` goal-steering contract while making the role decision explicit enough
to survive later `/goal` refactors.

## Core Contract

Preserve this sentence:

> The runtime-owned goal steering frame may be developer-role; the raw objective inside it remains
> escaped user-provided task data.

That means:

- do not make the raw objective privileged
- do not change objective wrappers in patch one
- do not rewrite goal prompt templates in patch one
- do make steering delivery role an explicit policy
- do keep storage, lifecycle, accounting, and app-server APIs orthogonal

## Current `.130` Local Baseline

On the current `.130`-shaped checkout, the local goal-steering baseline already includes these
commits:

- `60346ef501 Make goal steering role configurable`
- `7bd45429d7 Fix goal steering follow-up build issues`
- `5cfe837ca4 Add initial goal steering frame`

That means:

- `GoalSteeringRole` exists in `codex-rs/config/src/config_toml.rs`
- runtime `Config.goals.steering_role` exists and defaults to `Developer`
- `GoalSteeringMessage { kind, role, prompt }` is the shared conversion boundary for goal steering
- `GoalSteeringKind` includes `Initial`, `Continuation`, and `BudgetLimit`
- continuation and budget templates still use `<untrusted_objective>`
- initial steering uses a local `.130`-style prompt built in `initial_goal_prompt`
- first automatic delivery for a newly active/resumed goal should use `Initial`
- later automatic goal turns should use `Continuation`
- there is no `GoalContext`
- there is no `<goal_context>`
- there is no `objective_updated.md`
- there is no `codex-rs/ext/goal`
- goal statuses are `active`, `paused`, `budget_limited`, and `complete`

Treat this as the baseline when replaying `.131`. Do not re-implement the older hardcoded
developer-role shape, and do not collapse `Initial` back into `Continuation`.

If you are starting from this current branch, do not redo Patch One or Patch Two. They are already
implemented. Use those sections as architecture notes and compatibility checks while replaying
`.131+`.

The first local patch was behavior-preserving by default: it replaced hardcoded role strings with a
configurable local policy boundary while continuing to emit developer-role steering unless config
explicitly says otherwise.

The second local goal-steering patch added a `.130`-baseline `Initial` steering kind. It applies the
same trusted runtime-owned steering-frame shape to the first automatic goal turn without making the
raw objective privileged instructions.

## Patch One: Role-Aware Steering Boundary

This section is the historical recipe for the first local patch. On the current branch, use it as a
checklist for what must remain true during `.131+` integration.

### Scope

Implement only the `.130` role boundary:

- add config parsing for `[goals].steering_role`
- add runtime config resolution
- add one small typed steering frame plus a `ResponseInputItem` constructor
- route continuation and budget-limit steering through that helper
- add focused tests and schema update

Do not add `<goal_context>` in patch one. Do not touch `event_mapping.rs` in patch one unless this
branch already has `<goal_context>`. Hidden-context filtering belongs to the `.131` replay where
the marker actually exists.

### Files To Open First

Open these first, in this order:

- `codex-rs/core/src/goals.rs`
- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/core/src/session/tests.rs`
- `codex-rs/core/templates/goals/continuation.md`
- `codex-rs/core/templates/goals/budget_limit.md`

Do not open release walkthroughs until after these files are understood. The code shape matters
more than the archaeology for patch one.

### Config Types

`ConfigToml` lives in the `codex-config` crate, so the config-facing enum should live there, not
only in `codex-core`.

Add to `codex-rs/config/src/config_toml.rs` near other config TOML types:

```rust
#[derive(Serialize, Deserialize, Debug, Clone, Copy, Default, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GoalSteeringRole {
    User,
    #[default]
    Developer,
}

impl GoalSteeringRole {
    pub fn as_response_role(self) -> &'static str {
        match self {
            Self::User => "user",
            Self::Developer => "developer",
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Default, PartialEq, Eq, JsonSchema)]
#[schemars(deny_unknown_fields)]
pub struct GoalsToml {
    pub steering_role: Option<GoalSteeringRole>,
}
```

Then add this top-level field to `ConfigToml`:

```rust
pub goals: Option<GoalsToml>,
```

Default `GoalSteeringRole` to `Developer` on this `.130` branch. That is behavior-preserving. If a
future upstream-shaped branch wants upstream-compatible default `User`, make that a documented
local-policy decision and ensure local install/config repair writes `Developer`.

Do not add profile-scoped goals config in patch one.

### Runtime Config

In `codex-rs/core/src/config/mod.rs`, import `GoalSteeringRole` from `codex_config`.

Add a resolved runtime config type:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GoalsConfig {
    pub steering_role: GoalSteeringRole,
}

impl Default for GoalsConfig {
    fn default() -> Self {
        Self {
            steering_role: GoalSteeringRole::Developer,
        }
    }
}
```

Add this field to runtime `Config`:

```rust
pub goals: GoalsConfig,
```

Resolve it from `ConfigToml` where runtime `Config` is constructed:

```rust
goals: GoalsConfig {
    steering_role: cfg
        .goals
        .as_ref()
        .and_then(|goals| goals.steering_role)
        .unwrap_or_default(),
},
```

If ownership of `cfg` makes `.as_ref()` unnecessary or awkward, use the local file's existing
style. Preserve the behavior: missing config resolves to `Developer`.

### Goal Steering Frame

In `codex-rs/core/src/goals.rs`, add a small private steering frame near
`budget_limit_steering_item`:

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum GoalSteeringKind {
    Continuation,
    BudgetLimit,
}

struct GoalSteeringMessage {
    kind: GoalSteeringKind,
    role: GoalSteeringRole,
    prompt: String,
}

impl GoalSteeringMessage {
    fn into_response_input_item(self) -> ResponseInputItem {
        let Self { kind: _, role, prompt } = self;
        ResponseInputItem::Message {
            role: role.as_response_role().to_string(),
            content: vec![ContentItem::InputText { text: prompt }],
            phase: None,
        }
    }
}
```

Use it for continuation:

```rust
let role = self.get_config().await.goals.steering_role;
items: vec![
    GoalSteeringMessage {
        kind: GoalSteeringKind::Continuation,
        role,
        prompt: continuation_prompt(&goal),
    }
    .into_response_input_item(),
]
```

Use it for budget-limit steering too. Prefer the active turn's config if readily available there,
so a turn uses the policy it started with:

```rust
let role = turn_context.config.goals.steering_role;
let item = GoalSteeringMessage {
    kind: GoalSteeringKind::BudgetLimit,
    role,
    prompt: budget_limit_prompt(&goal),
}
.into_response_input_item();
```

If the exact field access differs, follow the local `TurnContext` shape. Do not re-read global
config mid-turn if the turn already carries config.

Remove or adapt `budget_limit_steering_item(goal)` so there is not a second role-construction path.

Why include `GoalSteeringKind` now? Because `.131+` adds objective-update steering and
`<goal_context>`. The kind gives tests and future extension boundaries a stable way to say which
runtime steering path is being built. On `.130`, it is intentionally small and private. Do not add
`ObjectiveUpdated` until the branch has an objective-update steering path.

Patch Two extends this enum with `Initial`; preserve that extension in the current baseline.

## Patch Two: Initial Goal Steering

The current `.130` local baseline also includes a second conceptual patch: first delivery of a
newly active/resumed goal uses the same typed, role-aware steering frame as continuation, but with
start-from-scratch wording.

This was motivated by observed `.130` behavior where an early halted run followed by `/goal resume`
often produced better adherence than the first raw goal start. The working hypothesis is that the
useful effect came from runtime-owned hidden steering, not from treating the raw objective as trusted
instructions.

Keep these invariants:

- raw objective text remains escaped data inside `<untrusted_objective>`
- the trusted part is only the runtime-owned frame: begin/continue working toward the active goal
- default delivery role remains `Developer`
- `[goals].steering_role = "user"` still moves the whole steering frame to user role
- `Initial` is one-shot per newly active/resumed goal id
- the marker is consumed only when a goal steering request is actually launched
- `Continuation` remains the later automatic-goal-turn prompt and must not say "first turn"

The implemented shape in `codex-rs/core/src/goals.rs` is:

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum GoalSteeringKind {
    Initial,
    Continuation,
    BudgetLimit,
}

struct GoalSteeringMessage {
    kind: GoalSteeringKind,
    role: GoalSteeringRole,
    prompt: String,
}
```

The lifecycle is:

- when a goal becomes active for the first time or after pause/resume, remember its goal id in
  `initial_steering_goal_id`
- when building the next automatic active-goal request, choose `Initial` if that id matches
- after the continuation launcher has confirmed the request is still reserved and about to start,
  consume the pending initial marker
- if the goal stops, clear the pending initial marker

The prompt intentionally stays `.130`-style and does not introduce `<goal_context>`:

```text
Begin working toward the active thread goal.

This is the first turn for this goal. If this goal was resumed, treat this as the first turn of the
active run. Do not assume prior progress has been made in this active run...

<untrusted_objective>
...
</untrusted_objective>
```

This wording keeps the useful "start from evidence" shove while staying honest for resumed goals.

## Patch Tests

Add config tests in `codex-rs/core/src/config/config_tests.rs`:

- `[goals]\nsteering_role = "developer"` resolves to `GoalSteeringRole::Developer`
- `[goals]\nsteering_role = "user"` resolves to `GoalSteeringRole::User`
- missing `[goals]` resolves to `GoalSteeringRole::Developer`

Add unit tests in `codex-rs/core/src/goals.rs`:

- `GoalSteeringMessage { role: Developer, ... }.into_response_input_item()` emits role
  `"developer"`
- `GoalSteeringMessage { role: User, ... }.into_response_input_item()` emits role `"user"`

Add or extend request-shape tests in `codex-rs/core/src/session/tests.rs`:

- default first automatic active-goal request puts initial text in a developer message
- explicit `GoalSteeringRole::User` puts the same initial text in a user message
- default later active-goal continuation request puts continuation text in a developer message
- explicit `GoalSteeringRole::User` puts continuation text in a user message
- default budget-limit steering remains developer-role
- explicit `GoalSteeringRole::User` makes budget-limit steering user-role
- prompt text still contains escaped objective data and completion-audit wording

Use existing structured request helpers if available, such as `ResponsesRequest` helpers. Prefer
asserting message role plus text content over raw JSON string-grep.

Do not add objective-update tests on `.130`; `.130` has no objective-update steering path.

## Validation

The original repo guidance asks for focused crate tests after Rust changes:

```powershell
just fmt
cargo test -p codex-config
cargo test -p codex-core
```

For the current local branch, `just fmt` may fail on Windows if `sh` is unavailable; `cargo fmt`
has been used successfully instead. The user also prefers fast Windows local-release validation over
broad debug/profile builds.

For commit `5cfe837ca4`, known validation was:

- `cargo fmt`
- `cargo test -p codex-core goals::tests::` passed: 8 tests
- `cargo build -p codex-cli --bin codex --target aarch64-pc-windows-msvc --profile local-release`
  passed and produced `codex-rs\target\aarch64-pc-windows-msvc\local-release\codex.exe`

Because Patch One changed `ConfigToml`, schema generation is still the repo-normal validation:

```powershell
just write-config-schema
```

Include `codex-rs/core/config.schema.json` if it changes.

Before finalizing a non-trivial Rust patch, run scoped fixes:

```powershell
just fix -p codex-config
just fix -p codex-core
```

Do not run a full workspace test suite without asking the user first. Never build Codex without
explicit user permission.

## Forward-Port Architecture

Patch one should already have a small `GoalSteeringMessage` shape. Later releases should strengthen
that shape rather than replace it.

When any of these appear, expand the typed steering frame:

- `GoalContext`
- `<goal_context>`
- `objective_updated.md`
- `codex-rs/ext/goal`
- extension-owned goal tools or prompting

Use this shape or a close local equivalent:

```rust
enum GoalSteeringKind {
    Initial,
    Continuation,
    BudgetLimit,
    ObjectiveUpdated,
}

struct GoalSteeringMessage {
    kind: GoalSteeringKind,
    role: GoalSteeringRole,
    prompt: String,
}
```

On `.130`, `ObjectiveUpdated` should not exist yet. Add it only when the upstream branch introduces
objective-update steering.

On `.131+`, preserve `Initial`. It is a local durability feature, not an upstream archaeology
mistake. If upstream introduces a richer goal-context abstraction, map `Initial` into that
abstraction rather than deleting it or silently making the first goal turn use `Continuation`.

Route all steering through:

```rust
fn goal_steering_input_item(message: GoalSteeringMessage) -> ResponseInputItem
```

The point is not the exact type name. The point is that prompt kind, rendered prompt, and delivery
role are paired before becoming model input.

## 0.131 Replay Rules

When replaying the `.131` goal changes:

- preserve `<goal_context>` markers
- do not let `GoalContext` hardcode the delivery role
- do not let `ContextualUserFragment` imply that goal steering must be user-role
- route initial, continuation, budget-limit, and objective-update through the configured steering
  builder
- keep objective escaping and user-data wording intact
- preserve one-shot initial steering semantics when goal creation/resume maps into the `.131`
  lifecycle

Role should live in runtime policy resolved from config. It should not live in `GoalContext`, goal
state, goal DB rows, or app-server goal payloads.

`GoalContext` should mean "hidden marked goal steering frame." It should not mean "user-role
message."

### Prompt Text Is A Separate Decision

Do not automatically inherit future goal steering prompt text while replaying `.131+`.

The `.131` replay changes both delivery role and steering wording. Treat those as separate axes:

- role/marker architecture is the first compatibility target
- prompt text changes are a separate behavioral experiment

Known `.131` continuation/budget prompt changes:

- continuation and budget wrappers change from `<untrusted_objective>` to `<objective>`
- continuation budget drops elapsed time
- a new "Continuation behavior" section tells the model not to shrink the objective to what fits
  this turn
- "Avoid repeating work..." is replaced with a broader "Work from evidence" section
- new "Progress visibility" guidance encourages `update_plan` for multi-step work
- new "Fidelity" guidance says not to substitute narrower, safer, smaller, or easier-to-test
  solutions for the requested end state
- completion audit becomes stricter and more evidence-oriented
- completion reporting drops final elapsed-time reporting language
- `.131` adds `objective_updated.md`, which keeps `<untrusted_objective>`

There may not be an upstream `.131` equivalent to local `initial_goal_prompt`. If not, do not
substitute the `.131` continuation prompt for local initial steering by default. Keep a local
initial prompt or build a role-neutral `GoalContext`/prompt-kind path that can render the local
initial wording.

Some of these additions may help high-churn work. Some may also interact with the user's CAD and
geometry workflow in ways that need A/B testing. Do not bundle prompt-template adoption with the
role/steering-frame patch unless the user explicitly chooses that experiment.

## Hidden Context Filtering

Developer-role `<goal_context>` requires more than "developer messages are not visible."

When `<goal_context>` exists, implement role-neutral goal-context detection. Prefer exact
start/end marker handling for goal context over broad prefix matching where feasible.

Verify that both user-role and developer-role `<goal_context>`:

- are not visible transcript messages
- are not treated as ordinary user turns
- are rollback/history-trimmable as runtime context
- do not survive compaction as stale ordinary conversation
- do not confuse reference-context, rollback, or visible event mapping

Adding `<goal_context>` to `CONTEXTUAL_DEVELOPER_PREFIXES` may be the minimum viable patch on a
given branch, but it should not be mistaken for the whole architecture if stricter marker-aware
classification is practical.

## 0.132 And 0.133 Replay Rules

Do not move steering role policy into:

- goal DB migrations
- `GoalStore`
- status transitions
- usage accounting
- app-server protocol types

Those systems are orthogonal. Preserve:

- `blocked`
- `usageLimited`
- explicit pause/resume semantics, with Ctrl+C as turn control and `/goal pause` as lifecycle control
- dedicated goal DB, if present
- extension-backed accounting, if present
- app-server goal API stabilization, if present

If `codex-goal-extension` eventually owns prompting, it should not construct raw hidden messages
with ad hoc roles. It should emit a typed goal steering request/message, or ask the host to inject
one. The host should remain the final authority applying:

- configured steering role
- marker wrapping
- objective escaping
- injection timing
- hidden-context classification

The extension or store layer may own goal state, but it should not own the local decision that first
delivery for a newly active/resumed goal is `Initial` rather than `Continuation`. Preserve that as a
host/runtime steering-kind decision unless a later upstream design has an explicit equivalent.

## Non-Goals

Do not do these in the first implementation pass:

- do not make raw objective text privileged
- do not add objective-wrapper config
- do not inherit or roll back `.131` prompt text wholesale in the role patch
- do not add `<goal_context>` before the branch has a goal-context path
- do not change `event_mapping.rs` for goal context before `<goal_context>` exists
- do not add `objective_updated.md` to `.130`
- do not add `codex-rs/ext/goal` scaffolding to `.130`
- do not remove local `Initial` steering while replaying `.131+`
- do not make resumed goals use continuation wording for their first automatic active run unless
  the user explicitly chooses that behavioral experiment
- do not remove later statuses such as `blocked` or `usageLimited` when replaying forward
- do not bypass `GoalStore`
- do not alter dedicated goal DB migrations
- do not weaken objective escaping

## Low-Context Handoff

If context is running low, leave exactly this status:

- current branch/tag
- whether patch one is complete
- files changed
- whether `GoalSteeringRole` exists in `codex-config`
- whether runtime `Config.goals.steering_role` exists
- whether `GoalSteeringKind::Initial` exists
- whether first active/resumed goal delivery uses initial wording
- whether `GoalSteeringMessage::into_response_input_item` is the only role-construction path
- whether `<goal_context>` exists yet
- tests added
- tests still missing
