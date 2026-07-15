# WA06c Steering Role Config Removal

This pass removes `GoalSteeringRole` and old steering-role config influence
from the active Goal path.

## Direction Lock

- Request: remove role configuration that can steer active Goal model input.
- Authority: active Goal role is selected only by the WA02 request-input shaper.
- Terrain: current local config exposes `GoalSteeringRole` and maps TOML
  `goals.steering_role` into runtime config.
- Upstream terrain: v136 baseline does not carry the local steering-role shim.
  Later upstream service topology is not required.
- Code-shape temptation: keep the exported role type with a private developer
  hard-map.
- Locked direction: remove public/configurable steering role influence; any
  retained legacy key is ignored and cannot affect final payload role.
- Exclusions: no extension producer redesign, no final request shaper rewrite,
  no product behavior changes outside role config cleanup.

## Authority Docs Read

- `goal-authority-grounding-truth.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-test-deletion-map.md`
- WA02, WA04, WA06 parent/pass docs
- `06a-final-precondition-and-reachability-audit.md`

## Code Terrain Read

- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/core/config.schema.json`
- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

## Pass Goal

Remove old active steering-role configuration so no user or config setting can
choose a Goal role. The final selected Goal item remains the one emitted by the
request-input shaper.

## Exact Files To Edit

- `codex-rs/config/src/config_toml.rs`
- `codex-rs/core/src/config/mod.rs`
- `codex-rs/core/src/config/config_tests.rs`
- `codex-rs/core/config.schema.json`
- `codex-rs/ext/goal/src/extension.rs` if extension config still stores role
- `codex-rs/ext/goal/src/runtime.rs` if role config still reaches runtime
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`

## Required Edits

1. Remove exported config role surface:
   - delete `GoalSteeringRole`
   - delete `GoalsToml::steering_role` as active config input
   - delete `GoalsConfig::steering_role`
   - remove runtime parsing that maps TOML role values into Goal behavior

2. If old TOML compatibility is deliberately kept, make it inert:
   - parse only into a private ignored field or compatibility sink
   - do not expose the field through `GoalsConfig`
   - do not preserve enum names as public API
   - add a targeted test that the old key cannot affect final role

3. Remove extension role config fallout:
   - extension enablement remains product config
   - extension-owned role fields and closures are removed by this pass or 06d
   - no extension path may carry role-equivalent state forward

4. Update config tests:
   - delete tests that expect `steering_role = "user"` or `"developer"` to be
     accepted as active behavior
   - keep unrelated goals config tests such as enablement and objective limit
   - if compatibility parsing remains, test only that it is ignored

5. Update schema fixtures:
   - run `just write-config-schema` from `codex-rs` if config types change
   - include schema output in the implementation change

## Tests And Checks

Targeted checks:

- focused config tests affected by `GoalsToml` and `GoalsConfig`
- extension config tests if role storage is removed there
- final payload test owned by WA02/WA04/WA06g showing active Goal item remains
  outer role `developer` even when old config text is present

Audit:

```powershell
rg -n "GoalSteeringRole|steering_role" codex-rs/config/src codex-rs/core/src/config codex-rs/ext/goal/src codex-rs/ext/goal/tests
```

Remaining hits must be inert compatibility handling, local planning docs, or
valid test assertions that the old key is ignored.

## Branch Continuation State

After this pass:

- active Goal role cannot be selected by config
- old role config does not reach extension runtime or core request construction
- schema output matches the new config shape
- 06d can remove remaining extension steering without preserving role plumbing

## Non-Goals

- Do not alter objective limit, enablement, or other Goal product config.
- Do not move active role selection out of `core/src/goal_cadence/`.
- Do not add a new replacement role config.
- Do not delete legacy artifact fixtures solely because they contain role-like
  sample data.
