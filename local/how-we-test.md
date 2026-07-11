# How We Test Locally

This repository is expensive to validate on the local Windows ARM64 VM. Treat
local test time as a scarce development resource. The goal is not to prove every
change locally; the goal is to choose the cheapest validation that gives useful
signal for the risk introduced by the change.

The repo's normal Rust guidance still applies: Rust code changes get `just fmt`
from `codex-rs`, targeted tests are preferred, and broad crate or workspace
suites are not the default on this workstation. This document adds the local
posture for deciding when a command is worth paying for at all.

## Operating Assumptions

- The local VM is useful for editing, focused checks, and targeted debugging.
- Broad confidence belongs to CI, remote execution, or an explicitly requested
  larger validation pass.
- `scripts\stage_local_codex_sdk_bundle.py` is a release/build route, not a
  routine development test. A full run is too expensive to use as a default
  proof after ordinary edits.
- The SDK staging route is the user's real local install path. Avoid suggesting
  one-off optimized "try it quickly" Codex builds unless the user explicitly
  asks for that mode.
- This repo uses `sccache` through `codex-rs\.cargo\config.toml`:
  `rustc-wrapper = "sccache"` and `SCCACHE_CACHE_SIZE=50G`. Cargo build,
  check, test, nextest, rust-analyzer, and the local SDK staging build should
  inherit that by default when run from `codex-rs` or through repo scripts that
  set `codex-rs` as the Cargo working directory.
- Preserve `codex-rs\target\debug` by default. It contains local test/debug
  artifacts that are expensive to recreate after branch switches or upstream
  merges. Use the bundle script's `--clean-debug-target` flag only for a
  deliberate disk-pressure cleanup.
- VS Code/rust-analyzer uses `codex-rs\target\rust-analyzer` so editor
  diagnostics do not fight normal Cargo builds for the same target directory.
- Reporting "not run due to local cost" is acceptable when the change does not
  justify compiling or executing tests locally.
- A clean diff inspection is a real validation step for docs, moves, deletions,
  and low-risk mechanical edits.

## Test Surface Posture

Local tests should protect durable contracts, not every implementation path
used while developing a change.

- Prefer cheap boundary tests over full-flow tests.
- Keep at most one representative expensive flow for a behavior family.
- Merge overlapping tests when one clearer test proves the same contract.
- Delete or avoid tests that mostly encode implementation sequence, transient
  scaffolding, or old transcript artifacts.
- Keep upstream-authored tests where they are unless a local contract requires a
  focused local modification.
- When UI or text output intentionally changes, follow the repo snapshot rules;
  update and review snapshots as part of the same change.

For local Codex behavior, durable contracts usually live at boundaries:
serialization, role mapping, prompt construction, replay filtering, hidden
surface filtering, config plumbing, command routing, and one representative
session flow where a unit boundary cannot prove the behavior.

## Validation Ladder

Use the cheapest rung that gives useful signal for the change. Do not climb the
ladder out of habit.

- Docs-only or planning edits: inspect the diff; run nothing.
- Test deletion only: inspect the diff; run nothing.
- Mechanical moves after deletion: inspect the diff; run nothing unless module
  wiring or imports changed enough to create real compile risk.
- Python script edits: prefer a direct script unit test or `python -m py_compile`
  on the changed script over any Rust validation.
- Rust formatting-only or small localized edits: run `just fmt` from `codex-rs`;
  inspect the diff after formatting.
- Rust signature, module wiring, feature, or import-risk edits: consider one
  targeted `cargo check` for the affected crate or target.
- Rust behavior changes or nontrivial test rewrites: consider one direct
  `cargo test -p <crate> <single_filter>` when it is the smallest useful proof.
- TUI/user-visible output changes: run a focused snapshot-generating test
  that covers the changed output, then review and accept intended snapshots.
- Dependency, Bazel, generated schema, or protocol changes: follow the specific
  repo rule for that surface, but still scope commands as tightly as the rule
  allows.
- Broad crate suites, workspace suites, `just test`, full nextest runs, and
  release bundle builds: do not run locally by default.

When broader validation is useful but not required to continue, name the command
that would be valuable and leave it as an opt-in local or remote follow-up.

## Command Shape

Run Rust commands from `codex-rs` unless the repo command is explicitly rooted
elsewhere. Redirect expensive command output to `target\codex-logs\` and show
the log path. On failure, surface only the tail needed for action.

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

Examples of acceptable focused checks when they are justified:

```powershell
$log = "target\codex-logs\core-lib-check-$(Get-Date -Format yyyyMMdd-HHmmss).log"
cargo check -p codex-core --lib *> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 120; exit $LASTEXITCODE } else { "passed: $log" }
```

```powershell
$log = "target\codex-logs\core-lib-goal-filter-$(Get-Date -Format yyyyMMdd-HHmmss).log"
cargo test -p codex-core --lib reconstruct_history_filters_pure_goal_context *> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 120; exit $LASTEXITCODE } else { "passed: $log" }
```

Plain `cargo test` accepts only one test-name filter before `--`. Do not pass
multiple positional filters to direct Cargo. Multi-filter habits belong to
nextest or `just test`, which are usually too expensive for this local workflow.

## Development Workflow

Before editing, decide what kind of proof the change deserves. After editing,
compare the actual diff to that decision instead of letting available commands
drive the workflow.

Useful defaults:

- For docs and planning: diff inspection only.
- For local cleanup: remove redundant tests first, then decide whether anything
  still deserves a maintained home.
- For Rust behavior: one boundary test is usually better than several full-flow
  tests.
- For full-flow behavior: keep one representative flow per behavior family and
  make the rest cheaper.
- For generated artifacts: run the generator required by the repo instructions,
  then inspect the generated diff.
- For release/package work: use the documented local npm route, but avoid
  treating the full bundle script as routine proof for unrelated changes.

When reporting validation, be explicit:

- `Not run; docs-only change.`
- `Not run; diff-only test deletion and local compile cost is not justified.`
- `Ran cargo check -p <crate> --lib; passed: <log path>.`
- `Would run <command> for broader confidence; skipped locally due to cost.`

## Remote And CI Posture

The local machine should not be the only place broad Rust confidence is earned.
When a change needs broad proof, prefer one of these routes:

- CI after the branch is pushed.
- A remote test workflow when available for the relevant surface.
- A deliberately scheduled local run when the cost is worth blocking the
  workstation.

Do not silently replace a needed broad check with a focused local check. Say what
the focused check proves, what it does not prove, and where the remaining
confidence should come from.
