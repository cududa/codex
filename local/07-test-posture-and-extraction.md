# Test Reduction Posture

## Direction

This repository carries a local goal-steering contract on top of upstream Codex. The previous implementation work added too many local tests while proving each slice. The next step is to reduce that surface area aggressively.

The goal is not to move every local test into nicer files. The goal is to keep only tests that protect durable contracts and delete or merge tests that mainly document implementation paths, duplicate stronger coverage, or impose expensive local validation habits.

Assume uncommitted tests in the current working tree are `cududa` authored unless later history proves otherwise.

## General Posture

- Delete or merge before extracting. A local test should earn its continued existence before it gets a maintained home.
- Keep OpenAI-authored tests where they are. Retain local modifications only when they protect the local contract.
- Prefer cheap boundary tests over full-flow tests.
- Keep at most one representative expensive flow for a behavior family.
- Do not keep configured-role full-flow tests when a cheap role-mapping test proves the same local contract.
- Do not keep final-request tests when a cheaper session-level or unit boundary test proves the useful invariant.
- Do not use old persisted `<goal_context>` transcript text as authority. Tests should reflect the production boundary: Goal producers create role-bearing Goal frames; replay paths filter stale frames; current-turn carry is Goal-owned.

## Validation Posture

Local validation is expensive on this workstation. The default after reducing tests is to run nothing.

Use this hierarchy:

- Docs-only or planning edits: run nothing.
- Test deletion only: inspect the diff; run nothing.
- Mechanical test move after deletion: inspect the diff; run nothing unless module wiring/import changes make a compile failure likely.
- Signature, module wiring, or import-risk edits: consider one targeted `cargo check`, but only when the compile-risk is real enough to justify the cost.
- Behavior changes or nontrivial test rewrites: consider one direct Cargo test filter for the smallest useful proof.
- Broad crate, workspace, nextest, or `just test -p codex-core <filters>`: do not run locally by default.

It is acceptable and expected to report "not run due to local cost" when the edit does not justify paying for compilation or test execution.

When a command is justified, redirect full output to `codex-rs/target/codex-logs/` and surface only the log path plus the last 120 lines on failure.

```powershell
New-Item -ItemType Directory -Force target\codex-logs | Out-Null
$log = "target\codex-logs\<short-name>-$(Get-Date -Format yyyyMMdd-HHmmss).log"
<command> *> $log
if ($LASTEXITCODE -ne 0) {
  Write-Output "failed: $log"
  Get-Content $log -Tail 120
  exit $LASTEXITCODE
} else {
  Write-Output "passed: $log"
}
```

If a compile check is justified after core signature/module changes:

```powershell
$log = "target\codex-logs\core-lib-check-$(Get-Date -Format yyyyMMdd-HHmmss).log"
cargo check -p codex-core --lib *> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 120; exit $LASTEXITCODE } else { "passed: $log" }
```

If one core library test execution is justified:

```powershell
$log = "target\codex-logs\core-lib-current-turn-goal-steering-$(Get-Date -Format yyyyMMdd-HHmmss).log"
cargo test -p codex-core --lib current_turn_goal_steering *> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 120; exit $LASTEXITCODE } else { "passed: $log" }
```

Plain `cargo test` accepts only one test-name filter before `--`. Do not pass multiple positional filters to direct Cargo. That multi-filter style belongs to nextest/`just test`, which is specifically too expensive for this local workflow.

If a goal-extension compile check is justified after signature/module changes:

```powershell
$log = "target\codex-logs\goal-extension-check-$(Get-Date -Format yyyyMMdd-HHmmss).log"
cargo check -p codex-goal-extension *> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 120; exit $LASTEXITCODE } else { "passed: $log" }
```

## Minimal Maintained Safety Net

Aim for this smaller local test surface.

Core role and prompt boundary:

- Keep `goal_steering_message_uses_configured_role_for_all_kinds`.
- Keep `goal_prompts_escape_objective_delimiters`.
- Merge the prompt wording tests into one compact prompt contract test. It should check only durable contract markers: untrusted objective wrapping, source-authority wording, allowed terminal statuses, and no misleading pause/budget-limit leakage.

Replay and hidden-context boundary:

- Keep one rollout reconstruction filtering test, preferably `reconstruct_history_filters_pure_goal_context_from_replacement_history`.
- Keep hidden-surface parity tests that protect distinct client/history boundaries:
  - `response_input_item_message_conversion_preserves_developer_role`
  - `suppresses_goal_context_raw_response_item_notifications`
  - `ignores_goal_context_response_items_in_rollout_replay`

Representative session behavior:

- Keep `active_goal_continuation_runs_again_after_no_tool_turn` as the single representative flow proving steering can reach another model turn.
- Keep `budget_limited_accounting_steers_active_turn_without_aborting` only if budget-limit steering remains important enough to protect at session level. Prefer this over any final-request budget test.

Extension boundary:

- Keep one merged backend config/role plumbing test that covers initial storage and config-change storage.
- Keep one extension steering delimiter-escaping test.
- Optionally keep one objective-updated source-authority wording test if that prompt text is a local contract.