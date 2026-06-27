# Local Codex Npm Route

This document is the authority for the local Windows ARM64 Codex install route.
Existing scripts, PATH entries, and install folders are terrain. They do not
define the mission. If they conflict with this route, change them.

## Locked Intent

There is one local Codex route:

- Global npm is the canonical route for the Codex CLI, TypeScript SDK, and local
  Node applets that launch Codex.
- The local bundle script owns producing and installing the full usable package.
- The package includes `codex.exe`, `rg.exe`, `@openai/codex`, and
  `@openai/codex-sdk`.
- The route preserves the current no-sandbox usage pattern:
  `sandbox_mode = "danger-full-access"`, `approval_policy = "never"`, and
  `default_permissions = ":danger-no-sandbox"`.
- The route does not build, bundle, or depend on Windows sandbox helper
  binaries.
- `CODEX_HOME` remains the normal shared `~\.codex` home.
- Config, auth, logs, state, sessions, memories, and `/resume` history are
  shared. The SDK route does not create an isolated Codex identity.
- `C:\Program Files\CodexPinned\bin` is removed from PATH and deleted after the
  npm route is verified. It is not kept as a fallback launcher.

This is a route replacement, not a parallel install.

## Blessed Command

Normal release flow:

```powershell
python .\scripts\stage_local_codex_sdk_bundle.py
```

That command is expected to:

- build `codex-rs\target\aarch64-pc-windows-msvc\local-release\codex.exe`;
- package `rg.exe` from PATH into the Codex npm package;
- build and package the TypeScript SDK against that bundled Codex package;
- install the generated `@openai/codex` and `@openai/codex-sdk` tarballs into
  global npm; and
- leave `codex` resolving through global npm.

The generated npm package version is
`<codex-rs workspace.package.version>-cududa` unless `--version` is provided.
The current `0.131.x` line stays on `0.131.0-cududa`; upstream `0.132.x` is
accepted later through the normal fast-forward flow.

## Narrow Iteration

`--reuse-codex-bin` is only for SDK/node iteration when the current
`local-release` binary should be repackaged as-is. It is not the normal path.

`--skip-sdk-build`, `--skip-local-install`, `--skip-global-install`,
`--skip-path-normalization`, and `--skip-legacy-delete` are debugging switches,
not the blessed release flow.

## Non-Goals

The script does not stage other platforms, Python runtime wheels, the responses
proxy, Windows sandbox helper binaries, or upstream release-only artifacts.

The script does not create an alternate `CODEX_HOME`, alternate config,
alternate auth, alternate state DB, or alternate resume history.
