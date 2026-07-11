# Windows Rust Build Cache Notes

Date: 2026-07-10

This note records the local Windows ARM64 build/cache changes and the mistakes
made while arriving at the current state. It is intentionally local workflow
documentation, not product documentation.

## Final Intended State

This repo should use `sccache` for normal Rust compilation by default. The
Git-tracked durable configuration is in:

```text
codex-rs\.cargo\config.toml
```

with:

```toml
[build]
rustc-wrapper = "sccache"

[env]
SCCACHE_CACHE_SIZE = { value = "50G", force = false }
```

The workstation also has matching Windows User environment variables as a
machine-level backup:

```text
RUSTC_WRAPPER=sccache
SCCACHE_CACHE_SIZE=50G
```

`sccache.exe` is installed through winget and resolves on PATH from:

```text
C:\Users\cullendudas\AppData\Local\Microsoft\WinGet\Links\sccache.exe
```

Because `rustc-wrapper` is set in Cargo config, future shells, VS Code /
rust-analyzer processes, and Codex agents should use `sccache` automatically for
Cargo-driven Rust compilation when they run Cargo from `codex-rs` or through
repo scripts that set `codex-rs` as the Cargo working directory. Nobody should
need to run a special script or remember a special Cargo flag.

This applies to normal Cargo-based commands, including:

```powershell
cargo build
cargo check
cargo test
cargo nextest run
just test
python .\scripts\stage_local_codex_sdk_bundle.py
```

It does not cache final linker work. If a build is bottlenecked on `link.exe`,
PDB generation, or a large final executable link, `sccache` will not remove that
cost. It also does not cover Bazel unless Bazel is separately configured to use
it.

## SDK Bundle Script Change

The local SDK bundle script now preserves `codex-rs\target\debug` by default.
That directory contains expensive debug/test/rust-analyzer artifacts, and
deleting it during routine SDK installs was hostile to local branch-switch and
upstream-integration work.

The old flag was removed:

```text
--skip-debug-target-clean
```

The new opt-in cleanup flag is:

```text
--clean-debug-target
```

Use it only for deliberate disk-pressure cleanup before a local-release build.

Updated files:

- `scripts/stage_local_codex_sdk_bundle.py`
- `scripts/test_stage_local_codex_sdk_bundle.py`
- `local/local_build/sdk_bundle.md`
- `local/how-we-test.md`

## Validation Run

Python validation passed after the script change:

```powershell
python -m py_compile .\scripts\stage_local_codex_sdk_bundle.py .\scripts\test_stage_local_codex_sdk_bundle.py
python -m unittest .\scripts\test_stage_local_codex_sdk_bundle.py
```

The unittest run reported:

```text
Ran 6 tests
OK
```

Rust validation was intentionally not run as part of this local script/config
cleanup, except for a later attempted narrow `cargo nextest` profile comparison
described below.

## Wrong Turns To Avoid Repeating

At one point, a repo-level Cargo config was added with:

```toml
[build]
rustc-wrapper = "sccache"

[env]
SCCACHE_CACHE_SIZE = "50G"
```

That is valid Cargo configuration. The final repo-persisted version now lives in
`codex-rs\.cargo\config.toml`, where this repo already keeps Windows Cargo
settings. The earlier mistake was treating system-level environment variables as
enough persistence for the repo; they were durable on this workstation but
invisible in Git history.

Then Cargo config was briefly changed to point at a nonexistent custom
wrapper:

```toml
[build]
rustc-wrapper = "scripts/sccache-rustc-wrapper.cmd"
```

That was a bad intermediate state. The wrapper file did not exist. If VS Code
or rust-analyzer saw that config while it existed, Cargo checks could fail
repeatedly and trigger repeated VS Code notification/accessibility sounds. This
was not `sccache` crashing; it was Cargo being pointed at a missing wrapper.

There should be no custom wrapper script. The only intended repo-local wrapper
setting is:

```toml
[build]
rustc-wrapper = "sccache"
```

in `codex-rs\.cargo\config.toml`.

## VS Code / rust-analyzer

The repo already had useful rust-analyzer settings:

```json
"rust-analyzer.check.command": "check",
"rust-analyzer.check.workspace": false,
"rust-analyzer.cargo.targetDir": "${workspaceFolder}/codex-rs/target/rust-analyzer"
```

Those are good for this workstation:

- use plain `cargo check`, not `clippy --tests`, for background diagnostics;
- avoid workspace-wide checks when possible;
- keep editor artifacts separate from normal Cargo `target\debug` artifacts.

Cargo should now read the repo-level wrapper from `codex-rs\.cargo\config.toml`.
The Windows User environment variables still exist as a backup:

```text
RUSTC_WRAPPER=sccache
SCCACHE_CACHE_SIZE=50G
```

Rust-analyzer may still index on startup. `sccache` helps Cargo compilation; it
does not eliminate rust-analyzer's in-memory workspace indexing.

## Branch / Upstream Churn Mental Model

Cargo does not blindly rebuild everything on every branch switch. It reuses
artifacts when source fingerprints, dependencies, features, rustflags, target,
profile, compiler version, and relevant build-script outputs still match.

This repo still feels expensive because `codex-cli` has a very large dependency
closure. High-fanout crates such as `codex-core`, protocol crates, app-server,
TUI, config/feature plumbing, and `codex-code-mode` can invalidate a lot of
downstream work. `codex-code-mode` also brings in `v8`.

`sccache` helps when Cargo invokes rustc with inputs that match a previous
compile. It cannot prevent Cargo from deciding that a crate needs to be checked
or rebuilt.

## Profile Comparison Attempt

A narrow `cargo nextest` comparison was attempted for:

```powershell
cargo nextest run -p codex-protocol validate_thread_goal_objective
cargo nextest run --cargo-profile ci-test -p codex-protocol validate_thread_goal_objective
```

The first attempt used poor PowerShell redirection and produced unusable empty
logs. A second attempt captured logs, but both commands exited with code 4. The
logs were written under:

```text
codex-rs\target\codex-logs\
```

This comparison was not completed and should not be treated as evidence that
`ci-test` is faster or slower. If this question is revisited, use a known-valid
test filter and capture logs cleanly before drawing conclusions.

Current profile facts:

- `just test` currently runs `cargo nextest run --no-fail-fast "$@"` and then
  `just bench-smoke`.
- `just test` does not currently use `--cargo-profile ci-test`.
- `ci-test` exists in `codex-rs\Cargo.toml`, but using it creates/separates
  profile artifacts under `target\ci-test`.

## Open Items

- Run a real SDK build once with Cargo timings to learn whether the 28-minute
  path is dominated by rustc, build scripts, linker/PDB generation, disk, or
  dependency critical path.
- Revisit `ci-test` only with a clean, successful focused comparison.
- Investigate macOS host cross-building for the Windows ARM64 executable as the
  likely biggest non-cloud build-time research branch. This may help produce the
  exe, but it will not directly run Windows tests on macOS.

## Cargo Timing Result: Local-Release Codex Build

Command measured:

```powershell
cargo build -p codex-cli --bin codex --profile local-release --target aarch64-pc-windows-msvc --timings
```

Successful detached run:

```text
status: exit code 0
total wall time: 597.1s / 9m 57.1s
total units: 1315
fresh units: 1308
dirty units: 7
timing report: codex-rs\target\cargo-timings\cargo-timing-20260711T040217500Z-cce585f8ca1b9f0a.html
```

The updated binary was written to:

```text
codex-rs\target\aarch64-pc-windows-msvc\local-release\codex.exe
```

Dirty unit timeline from the timing report:

```text
3.7s    -> 108.0s   codex-app-server                  104.3s
108.0s  -> 111.5s   codex-app-server-client             3.5s
111.5s  -> 271.7s   codex-tui                         160.2s
111.5s  -> 217.8s   codex-exec                        106.3s
271.6s  -> 286.6s   codex-cloud-tasks                  15.0s
286.6s  -> 303.5s   codex-cli                          16.9s
303.5s  -> 597.1s   codex-cli codex bin               293.6s
```

Interpretation:

- The warm local-release build was not broad workspace recompilation. Cargo
  considered 1315 units, but only 7 rebuilt.
- Most wall time came from a dependency chain through high-level local crates,
  then a single final `codex-cli` binary unit.
- The final binary unit alone took almost 5 minutes. Cargo timings do not split
  that unit into Rust front-end, LLVM codegen, and linker/PDB phases, so finer
  attribution would need rustc/linker-level profiling.
- This points away from "just add more Cargo parallelism" for the measured warm
  local-release shape.

Concurrency from the timing report:

```text
max active Cargo units: 2
average active Cargo units: 1.17
max waiting Cargo units: 1
average waiting Cargo units: 0.00
```

`--jobs` conclusion for this measured run:

- Raising Cargo jobs would not help this successful warm build because Cargo was
  usually waiting on dependency order, not on an artificial job cap.
- Lowering jobs may still be worth testing for cold or wider rebuilds if the VM
  shows disk or memory contention, but this timing report does not support
  setting a global `CARGO_BUILD_JOBS` yet.

`sccache` during the successful run:

```text
compile requests: 79
compile requests executed: 74
cache hits: 0
cache misses: 74
cache errors: 0
cache size after run: 885 MiB
```

These stats were not zeroed immediately before the successful detached run, so
they include earlier attempted builds in the same investigation. They still show
that Cargo is routing Rust compilation through `sccache` and that `sccache` is
not failing. The zero-hit result is expected for the first builds after enabling
the wrapper and changing build fingerprints.
