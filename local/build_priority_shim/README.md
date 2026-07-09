# Repo-Local Build Priority Shim

This directory contains Windows command shims for local Rust/Bazel build and
test work in this checkout. After `bin` is prepended to the user `PATH`, plain
commands such as `cargo test ...`, `just test ...`, and `bazel test ...`
resolve through the shim first.

The shim only raises process priority when the current working directory is
inside this repository. Outside this checkout, it forwards to the real command
without changing priority.

On this workstation, the PowerShell profile also delegates its existing
`cargo` function through `invoke-priority-command.ps1`, because PowerShell
functions take precedence over `PATH` entries.

Install or refresh the user `PATH` entry:

```powershell
.\local\build_priority_shim\install-user-path.ps1
```

By default, repo-local commands run at `AboveNormal` priority. Set
`CODEX_BUILD_PRIORITY=High` to use `High`, or `CODEX_BUILD_PRIORITY=Off` to
temporarily disable priority elevation.
