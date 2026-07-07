# v133 Canonical Local Package Task Log

This file is the durable handoff log for compaction-prone work on the private
local npm/SDK route. Before starting new work, read this file, the Review
Dedeluger finding, and the remediation plan below. After finishing each
meaningful work item, update this checklist and notes.

## Source Of Truth

- Review version alias: `v133`
- Review version ID: `a4d22d8d-5003-40e1-9b10-8766a19c4008`
- Finding ID: `1247ec98-3017-421d-839c-faf4aa4920b7`
- Remediation plan ID: `57606f32-17a3-4240-8763-28484d280664`
- Ignore goal-related finding: `8a2ed7ca-eb46-4c26-8bd1-94a9da682317`
- Route authority: `local/local_build/sdk_bundle.md`

## Direction Lock

- Request: execute the locked v133 package-layout remediation end to end while
  keeping a durable lightweight task log that survives compaction.
- Authority: Review Dedeluger finding and remediation plan above, repo
  `AGENTS.md`, and `local/local_build/sdk_bundle.md`.
- Terrain: the local staging script owned the private route but still staged
  `vendor/<target>/codex/codex.exe` and `vendor/<target>/path/rg.exe`; docs
  still named that old executable path; SDK tests needed stronger private
  package `codex-path/rg` coverage.
- Code-shape temptation: relax upstream/public package validators or preserve
  the old layout as the maintained local shape.
- Locked direction: implement canonical v133 layout in the private local
  staging path with a local no-helper validator; update docs and tests so the
  maintained route is `bin/codex.exe`, `codex-path/rg.exe`,
  `codex-resources/`, and `codex-package.json`.
- Exclusions: do not modify sandbox env-var logic, upstream/public validators,
  Windows sandbox helper code, or unrelated SDK/runtime sources unless targeted
  tests prove it is necessary.

## Checklist

- [x] Create durable task log and record source-of-truth checkpoints.
- [x] Read Review Dedeluger finding and remediation plan.
- [x] Establish task-alignment Direction Lock.
- [x] Update `scripts/stage_local_codex_sdk_bundle.py` for canonical layout.
- [x] Add local no-sandbox package validator in the staging script.
- [x] Add focused Python staging test.
- [x] Update `local/local_build/sdk_bundle.md`.
- [x] Strengthen `sdk/typescript/tests/exec.test.ts`.
- [x] Run targeted validation and record results.

## Validation Log

- `python -m py_compile .\scripts\stage_local_codex_sdk_bundle.py .\scripts\test_stage_local_codex_sdk_bundle.py`
  passed.
- `python -m unittest .\scripts\test_stage_local_codex_sdk_bundle.py`
  passed: 3 tests.
- `pnpm test -- exec.test.ts` in `sdk/typescript` passed: 9 tests.
- Staging smoke passed with existing v132 `codex.exe`/`rg.exe` inputs and
  `--reuse-codex-bin --skip-sdk-build --skip-local-install
  --skip-global-install --skip-path-normalization --skip-legacy-delete`.
- Staging smoke also passed through the actual reuse-staged path without a
  `--codex-bin` override after `dist/npm-local/packages/codex` existed.
- Smoke layout checks under `dist/npm-local/packages/codex`:
  `codex-package.json`, `bin/codex.exe`, `codex-path/rg.exe`, and
  `codex-resources` were present; `codex-command-runner.exe` and
  `codex-windows-sandbox-setup.exe` were absent.

## Notes

- The private package must keep `@cududa/codex` and `@cududa/codex-sdk`.
- The local Windows no-sandbox package must not require or include
  `codex-command-runner.exe` or `codex-windows-sandbox-setup.exe`.
- Upstream/public package validators should remain strict.
- `scripts/stage_local_codex_sdk_bundle.py` now stages under
  `vendor/aarch64-pc-windows-msvc/bin`, `codex-path`, and
  `codex-resources`, and validates exact local metadata.
- `scripts/test_stage_local_codex_sdk_bundle.py` covers canonical staging,
  helper absence, private package metadata, and `copy_codex_binary=False`
  reuse of `bin/codex.exe`.
- `local/local_build/sdk_bundle.md` now documents the canonical v133 layout,
  the active `bin/codex.exe` path, and the private no-helper exception.
- `sdk/typescript/tests/exec.test.ts` now treats the pre-v133 self-contained
  tree as compatibility coverage and asserts canonical `bin` plus
  `codex-path` behavior for the private package-layout route.
