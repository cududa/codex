# Local Codex npm Route

This document is the authority for the local Windows ARM64 Codex install route.
Existing scripts, PATH entries, and install folders are terrain. They do not
define the mission. If they conflict with this route, change them.

## Locked Intent

There is one local Codex route:

- Global npm is the canonical route for the Codex CLI, TypeScript SDK, and local
  Node applets that launch Codex.
- The local bundle script owns producing and installing the full usable package.
- The package includes `codex.exe`, `rg.exe`, `@cududa/codex`, and
  `@cududa/codex-sdk`.
- The installed npm package names intentionally do not use the public
  `@openai/*` names. Broad `npm update -g` must not replace the local route
  with registry packages.
- The route preserves the current no-sandbox usage pattern:
  `sandbox_mode = "danger-full-access"`, `approval_policy = "never"`, and
  `default_permissions = ":danger-no-sandbox"`.
- The route adopts upstream v133's canonical Codex package layout while staying
  private and no-sandbox.
- The route does not build, bundle, validate, require, or depend on Windows
  sandbox helper binaries.
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

- delete `codex-rs\target\debug` before building, so large test/dev artifacts
  do not crowd out the Windows ARM64 local-release build;
- build `codex-rs\target\aarch64-pc-windows-msvc\local-release\codex.exe`;
- package `rg.exe` from PATH into the Codex npm package;
- stage the private Codex package in the canonical v133 layout:
  `vendor\aarch64-pc-windows-msvc\codex-package.json`,
  `vendor\aarch64-pc-windows-msvc\bin\codex.exe`,
  `vendor\aarch64-pc-windows-msvc\codex-path\rg.exe`, and
  `vendor\aarch64-pc-windows-msvc\codex-resources\`;
- build and package the TypeScript SDK against that bundled Codex package;
- uninstall any global `@openai/codex` or `@openai/codex-sdk` packages;
- stage `@cududa/codex` and `@cududa/codex-sdk` as local package folders and
  tarballs under `dist\npm-local`;
- install the staged package folders into global npm; and
- leave `codex` resolving through global npm.

The folder install is intentional. Tarball-installed private packages still
make npm query the registry during broad global updates. Folder-installed
packages are treated as local links, so `npm update -g` leaves them alone.
The tarballs remain useful artifacts, but they are not the canonical global
install source.

The generated npm package version is
`<codex-rs workspace.package.version>-cududa` unless `--version` is provided.
The current v133 integration line uses the same `-cududa` suffix.

Local Node applets should import the SDK from the private package name:

```ts
import { Codex } from "@cududa/codex-sdk";
```

Apps may depend on only `@cududa/codex-sdk`. The SDK first looks for a local
`@cududa/codex` package next to the app, then falls back to the canonical
global npm package. That keeps app package manifests slim while preserving the
single shared Codex route.

## Expected State

After a successful run:

```powershell
npm list -g @cududa/codex @cududa/codex-sdk @openai/codex @openai/codex-sdk --depth=0
```

should show only `@cududa/codex` and `@cududa/codex-sdk`.

```powershell
Get-Command codex -All
codex --version
codex doctor --json
```

should show `codex` resolving through global npm, with the active executable
under `...\npm\node_modules\@cududa\codex\vendor\aarch64-pc-windows-msvc\bin\codex.exe`.

The `codex-resources` directory is part of the canonical package layout and is
expected to exist. For this private Windows no-sandbox package it intentionally
does not contain `codex-command-runner.exe` or
`codex-windows-sandbox-setup.exe`; their absence is not a local validation
failure. The directory includes `no-sandbox-package.txt` so npm tarballs retain
the canonical resource directory even though helper binaries are absent.

```powershell
npm update -g --dry-run
```

should not plan an upstream `@openai/codex` replacement. If the current Codex
process has just updated itself, npm may leave a hidden cleanup directory such
as `node_modules\@cududa\.codex-*` until Codex exits. The script schedules that
directory for deletion after the running process releases the executable.

## Narrow Iteration

`--reuse-codex-bin` is only for SDK/node iteration when the current
`local-release` binary should be repackaged as-is. It is not the normal path.
When the global npm route is running from the staged package folder, this flag
also preserves the existing staged Codex package so SDK-only iteration does not
try to overwrite a locked `codex.exe`.

`--skip-debug-target-clean` keeps `codex-rs\target\debug` for local test or
debug iteration, but it is not the normal route on this disk-constrained
workstation.

`--skip-sdk-build`, `--skip-debug-target-clean`, `--skip-local-install`,
`--skip-global-install`, `--skip-path-normalization`, and
`--skip-legacy-delete` are debugging switches, not the blessed release flow.

## Repo-Local Build Helpers

The sibling `..\codex-build-priority-shim` repo contains the experimental
native Windows priority launcher for local Rust build/test commands. Any
installed shims are local build helpers only; they are not another Codex
launcher route and must not change the global npm `codex` entrypoint,
`CODEX_HOME`, or the no-sandbox package contract.

## Non-Goals

The script does not stage other platforms, Python runtime wheels, the responses
proxy, Windows sandbox helper binaries, public release archives, public
DotSlash config, or other upstream release-only artifacts.

The script does not create an alternate `CODEX_HOME`, alternate config,
alternate auth, alternate state DB, or alternate resume history.
