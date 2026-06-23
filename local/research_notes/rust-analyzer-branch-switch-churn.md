# rust-analyzer branch switch churn

VSCode was showing `cargo clippy: ...` after branch changes because this repo configures rust-analyzer to run Clippy as its background check command:

```json
"rust-analyzer.check.command": "clippy",
"rust-analyzer.check.extraArgs": ["--tests"]
```

The repo already uses a rust-analyzer-specific target directory at `codex-rs/target/rust-analyzer`, so normal build artifacts should be cached across branch switches in the same worktree. The expensive part is that branch checkouts can change Cargo metadata, features, build scripts, or proc macros, which causes rust-analyzer to rerun diagnostics. Running `clippy --tests` makes that much heavier than a plain `cargo check`.

Applied local mitigation:

- Use `cargo check` instead of `cargo clippy` for background diagnostics.
- Set `rust-analyzer.check.workspace` to `false` so rust-analyzer checks the relevant package when possible instead of the whole workspace.

Other options if this is still noisy:

- Disable background checks with `rust-analyzer.checkOnSave: false`.
- Use separate Git worktrees for frequently compared branches.
- Use an absolute shared `rust-analyzer.cargo.targetDir` if multiple worktrees need to share build artifacts, while watching for lock contention between VSCode windows.
