# 05a Proof Matrix

## Goal

Fill `proof-and-readiness.md` with proof clusters and validation posture
without turning tests into behavior authority.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- All live behavior docs in `local/subagents/`.
- Parent slice: `local/subagents-work/slices/05-proof-hardening.md`.

## Target Live Docs

- `local/subagents/proof-and-readiness.md`
- Seam docs only if proof notes need to become short local pointers.

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`
- `codex-rs/core/src/realtime_conversation_tests.rs`
- `codex-rs/core/tests/suite/realtime_conversation.rs`
- `codex-rs/app-server/tests/suite/v2/realtime_conversation.rs`
- Hook schema/runtime tests identified from `04a`.
- State/app-server/TUI tests identified from `03` terrain.

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Map each owning live doc to proof clusters.
3. Identify concrete terrain anchors for tests and snapshots.
4. Fill proof/readiness posture without redefining behavior.
5. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can identify which proof clusters exercise each owning seam.
- `proof-and-readiness.md` routes behavior questions back to owner docs.
- Remaining proof gaps are named as review posture, not behavior blockers.

## Verification

- `rg -n "TODO|TBD" local/subagents/proof-and-readiness.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
