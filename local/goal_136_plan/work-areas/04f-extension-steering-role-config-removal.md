# WA04f Extension Steering Role Config Removal

This implementation pass removes or hard-maps extension steering-role config
influence for converted extension Goal paths. It must leave no self-contained
path by which extension configuration can select a user-role active Goal item
for converted WA04 producers.

Active Goal role is always selected by WA02 request-input shaping:
`ResponseItem::Message { role: "developer", ... }`.

## Direction Lock

Request:

- remove or hard-map extension `GoalContextRole` / steering-role config
  influence
- ensure converted extension paths cannot emit user-role active Goal
  steering
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`

Terrain:

- `GoalExtensionConfig` stores `enabled` and `steering_role`
- `install_with_backend(...)` accepts `goal_steering_role`
- extension tests vary `GoalContextRole::Developer` and `GoalContextRole::User`
- core config still has local steering-role terrain in this fork
- converted WA04 producer paths no longer need steering role
- final active role proof belongs to captured final `/responses` input, not
  extension helper output or config inspection by itself

Code-shape temptation:

- keep the role config as a compatibility option because converted producers
  no longer call it directly
- remove every core config surface before all later cleanup has landed
- test config by inspecting helper output instead of final request payload

Locked direction:

- extension config stores enablement only, or enablement plus non-steering
  extension state
- converted extension paths ignore old steering-role values
- if broader config removal is not owned here, hard-map compatibility so the
  old key cannot affect converted active steering
- final request-input shaping remains the only active role owner
- old config compatibility, if retained, is parsing compatibility only; it must
  not be active steering behavior

Exclusions:

- no user-role active Goal compatibility
- no active model input construction
- no broad config refactor unless needed by touched types
- no final WA06 cleanup of every old symbol unless it is local to this pass
- no evidence, helper-output, raw-notification, rollout-trace, or rendered-text
  substitute for final payload authority

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/src/extension.rs`
  - `GoalExtensionConfig`
  - `GoalExtension::new_with_host_capabilities(...)`
  - `ThreadLifecycleContributor::on_thread_start(...)`
  - `ConfigContributor::on_config_updated(...)`
  - `install_with_backend(...)`
- `codex-rs/ext/goal/src/runtime.rs`
  - any remaining `GoalContextRole` callsites after 04d/04e
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - config tests and harness defaults
- `codex-rs/core/src/config/mod.rs` and `codex-rs/core/src/config/config_tests.rs`
  only if this pass removes or changes core config fields

## Pass Goal

Make steering-role configuration unable to affect extension-origin active Goal
steering.

Preferred outcome:

```text
GoalExtensionConfig {
  enabled
}
```

Allowed interim outcome if core config fallout must wait:

```text
old config may parse for compatibility
converted extension paths ignore it for active steering
final request-input shaping still uses developer role
04h proves any old app-server/core user-role config value, if still parseable,
  cannot change final payload authority
```

## Exact Files To Edit

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/core/src/config/mod.rs` only if this pass owns config fallout
- `codex-rs/core/src/config/config_tests.rs` only if this pass owns config
  fallout
- generated config schema only if config types change

## Required Edits

1. Remove `GoalContextRole` from `GoalExtensionConfig`.
2. Remove `goal_steering_role` from `GoalExtension` construction if no
   remaining extension path uses it.
3. Remove `goal_steering_role` from `install_with_backend(...)`.
4. Update thread start and config update contributors to store enablement
   only.
5. Remove extension tests that expect `GoalContextRole::User` or
   `GoalContextRole::Developer` in extension config.
6. Add or update tests proving extension enablement still works.
7. Add or update extension-level tests proving old user-role steering config is
   removed from extension config or ignored by converted extension producers.
   These tests may inspect extension config, metadata request outcomes, or
   absence of steering-role arguments. They must not stand in for final
   `/responses` payload proof.
8. If core config fields are changed, run the required schema generation during
   Rust implementation per root `AGENTS.md`.
9. If core config fields remain for later cleanup, document in code/tests that
   converted WA04 producers ignore them.
10. Ensure converted extension producers never pass role metadata to the WA04a
    same-turn cadence adapter, WA02 request shaper, runtime effects, or helper
    prompt rendering.
11. Ensure removal or hard-mapping does not change extension enablement,
    product tool registration, accounting, metrics/events, or durable pending
    intent behavior.
12. Keep active role proof tied to final `/responses` capture in 04h: exactly
    one selected current outer developer-role Goal item, no active
    `<goal_context>`, and no user-role active Goal item.

## Tests And Checks

Update:

- `backend_config_stores_role_and_updates_runtime_enabled_state`
  - rename to enablement-only behavior
  - remove steering-role expectations

Add or update:

- `goal_extension_config_cannot_select_user_role_steering`
  - extension-level assertion only; captured final payload coverage belongs to
    04h

If config schema changes in Rust implementation:

```powershell
cd codex-rs
just write-config-schema
```

Use focused Rust tests only when implementing. For docs-only planning, run only
the docs whitespace check.

## Branch Continuation State

After this pass:

- converted extension paths cannot be affected by old user-role steering config
- extension config no longer carries steering role, or it is explicitly
  ignored by converted paths
- active role selection remains only in WA02 request-input shaping
- retained core config parsing, if any, is compatibility terrain for later
  cleanup and not active steering authority
- captured final `/responses` proof for old user-role config remains owned by
  04h
- `ext/goal/src/steering.rs` may still need deletion/reduction in 04g

## Non-Goals

- do not redesign all Goal config behavior
- do not remove unrelated Goal settings such as objective limits
- do not implement active model input construction
- do not delete legacy artifact classifiers
- do not broaden this pass into final WA06 cleanup
