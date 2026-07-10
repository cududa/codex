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

## Delete Or Merge Surface Area

Delete or merge these unless a later agent finds a specific, non-duplicative contract they protect.

Core configured-role full flows:

- Delete `active_goal_continuation_uses_configured_user_role`.
- Delete `budget_limited_accounting_uses_configured_user_role`.
- Delete `external_objective_change_uses_configured_user_role`.
- Delete helper-only surface that exists only for those configured-role flow variants, such as `budget_limited_accounting_steers_active_turn_with_role` and `external_objective_change_steers_active_turn_with_role`, if no kept test uses it.

Core final-request duplicates:

- Delete `budget_limited_accounting_reaches_final_request_with_default_developer_role`.
- Delete `external_objective_change_reaches_final_request_with_default_developer_role`.
- Delete the untracked `codex-rs/core/tests/suite/goal_steering.rs` integration test file if it only contains the objective-change final-request test.

Replay and compaction duplicates:

- Keep only one of:
  - `reconstruct_history_filters_pure_goal_context_response_items`
  - `reconstruct_history_filters_pure_goal_context_from_replacement_history`
- Delete or merge `active_goal_reconstructs_without_stale_goal_context_and_regenerates_developer_steering`; it combines stale filtering and regeneration in a heavier form.
- Delete `process_compacted_history_drops_role_neutral_goal_context` if the kept reconstruction or compact-path test covers stale Goal-context filtering.
- Reassess `mid_turn_local_compaction_preserves_current_turn_goal_steering`, `mid_turn_remote_v2_compaction_preserves_current_turn_goal_steering`, and `late_goal_steering_injection_is_not_persisted_unsampled`. Keep at most the smallest representative current-turn carry/late-injection proof; otherwise rely on code review plus CI.

Core prompt and GoalContext duplicates:

- Delete duplicate `codex-rs/core/tests/goal_context.rs` role/render tests if `goals.rs` or context unit tests still cover explicit role serialization.
- Merge these into one prompt contract test:
  - `continuation_prompt_allows_complete_and_strict_blocked_updates`
  - `initial_prompt_starts_goal_without_trusting_objective`
  - `budget_limit_prompt_steers_model_to_wrap_up_without_pausing`
  - `objective_updated_prompt_supersedes_previous_goal_context`

Extension runtime and steering duplicates:

- Merge `thread_start_stores_configured_developer_goal_role` and `config_change_stores_configured_user_role_and_updates_runtime_enabled_state` into one backend config/role plumbing test.
- Delete `inject_active_turn_goal_steering_returns_developer_item_when_thread_unavailable`.
- Delete `inject_active_turn_goal_steering_returns_user_item_when_configured`.
- Delete extension steering developer-role construction tests for budget-limit and objective-updated paths.
- Delete `budget_limit_prompt_remains_completion_only` unless it replaces a more expensive budget-limit session test.
- Keep at most one configured-role extension steering test, and only if the merged backend plumbing test does not prove role propagation.

Accounting/lifecycle tests:

- Reassess `completed_goal_accounts_current_turn_tokens_before_tool_response`; delete unless no cheaper test protects completion accounting.
- Keep OpenAI-authored accounting tests in place when they existed upstream, but do not add local variants unless they protect a distinct local contract.

## File Layout After Reduction

Only after deletion/merge decisions are made:

- Put surviving session-internal local tests in `codex-rs/core/src/session/goal_steering_tests.rs` if moving them still helps.
- Leave reconstruction-specific tests in `codex-rs/core/src/session/rollout_reconstruction_tests.rs`.
- Avoid creating `codex-rs/core/tests/suite/goal_steering.rs` unless a surviving black-box integration test is truly worth its cost.
- Keep extension config coverage in the existing backend test file unless a split remains useful after merging.

Do not extract tests just to make the old large set look organized. A smaller set in existing files is better than a larger set in cleanly named files.

## Execution Guidance For The Reduction Agent

- First delete or merge tests according to the surface-area list.
- Remove helpers that become unused after deletion.
- Preserve OpenAI-authored tests and local modifications that remain contract-relevant.
- Prefer no local validation after deletion-only edits.
- If module wiring or imports changed, decide whether the cost of one `cargo check` is justified; otherwise record that validation was intentionally skipped.
- If a behavior-bearing test was rewritten, run at most one direct Cargo filter, not a suite.
- Never run full crate, workspace, broad integration, or nextest-backed commands locally by default.
