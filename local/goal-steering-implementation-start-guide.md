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

## Current Starting Point

On the current `.130`-shaped checkout:

- `codex-rs/core/src/goals.rs` emits continuation steering directly as `role: "developer"`
- `budget_limit_steering_item` also emits `role: "developer"`
- continuation and budget templates use `<untrusted_objective>`
- there is no `GoalContext`
- there is no `<goal_context>`
- there is no `objective_updated.md`
- there is no `codex-rs/ext/goal`
- goal statuses are `active`, `paused`, `budget_limited`, and `complete`

Patch one should be behavior-preserving by default. It should replace hardcoded role strings with a
configurable local policy boundary while continuing to emit developer-role steering unless config
explicitly says otherwise.

The first patch should also introduce the small typed steering-frame shape that later releases will
need. Do not wait until `.131` to discover this abstraction during conflict resolution. Keep it
private and minimal on `.130`; it does not need `<goal_context>` yet.

## Patch One

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

## Patch One Tests

Add config tests in `codex-rs/core/src/config/config_tests.rs`:

- `[goals]\nsteering_role = "developer"` resolves to `GoalSteeringRole::Developer`
- `[goals]\nsteering_role = "user"` resolves to `GoalSteeringRole::User`
- missing `[goals]` resolves to `GoalSteeringRole::Developer`

Add unit tests in `codex-rs/core/src/goals.rs`:

- `GoalSteeringMessage { role: Developer, ... }.into_response_input_item()` emits role
  `"developer"`
- `GoalSteeringMessage { role: User, ... }.into_response_input_item()` emits role `"user"`

Add or extend request-shape tests in `codex-rs/core/src/session/tests.rs`:

- default active-goal continuation request puts continuation text in a developer message
- explicit `GoalSteeringRole::User` puts the same continuation text in a user message
- default budget-limit steering remains developer-role
- explicit `GoalSteeringRole::User` makes budget-limit steering user-role
- prompt text still contains escaped objective data and completion-audit wording

Use existing structured request helpers if available, such as `ResponsesRequest` helpers. Prefer
asserting message role plus text content over raw JSON string-grep.

Do not add objective-update tests in patch one; `.130` has no objective-update steering path.

## Patch One Validation

After Rust code changes in `codex-rs`, run:

```powershell
just fmt
cargo test -p codex-config
cargo test -p codex-core
```

Because `ConfigToml` changes, also run:

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
- route continuation, budget-limit, and objective-update through the configured steering builder
- keep objective escaping and user-data wording intact

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
- explicit pause/resume semantics
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

## Non-Goals

Do not do these in the first implementation pass:

- do not make raw objective text privileged
- do not add objective-wrapper config
- do not inherit or roll back `.131` prompt text wholesale in the role patch
- do not add `<goal_context>` before the branch has a goal-context path
- do not change `event_mapping.rs` for goal context before `<goal_context>` exists
- do not add `objective_updated.md` to `.130`
- do not add `codex-rs/ext/goal` scaffolding to `.130`
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
- whether `GoalSteeringMessage::into_response_input_item` is the only role-construction path
- whether `<goal_context>` exists yet
- tests added
- tests still missing
