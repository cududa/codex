# 05 Proof And Hardening

## Goal

Fill proof/readiness authority, harden reader routing, and remove temporary
scaffolding from the normal reader path.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- All live docs in `local/subagents/`.

## Target Live Docs

- `local/subagents/proof-and-readiness.md`
- `local/subagents/README.md`
- `local/subagents/AGENTS.md`
- `local/subagents/CONTEXT.md`
- Any seam doc that still contains stale TODOs or duplicated ownership.

## Terrain

- `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`
- `codex-rs/core/src/realtime_conversation_tests.rs`
- `codex-rs/core/tests/suite/realtime_conversation.rs`
- `codex-rs/app-server/tests/suite/v2/realtime_conversation.rs`
- TUI snapshot tests related to multi-agent rendering, once identified.
- Any tests referenced by earlier slices in `concept-ledger.md`.

## Decomposition Checkpoint

Do not create subslices upfront. Decompose only if proof mapping, reader
hardening, and retirement cleanup cannot be done in one pass without turning
proof docs into behavior authority.

Likely subslices:

- `05a-proof-matrix.md`: tests, snapshots, and proof clusters.
- `05b-reader-hardening.md`: README, AGENTS, CONTEXT, and cross-doc ownership.
- `05c-cold-reader-review.md`: cold-reader prompt and findings.
- `05z-retirement.md`: final work-packet disposition.

## Work Steps

1. Read every live doc in `local/subagents/`.
2. Read `concept-ledger.md` and ensure every row is moved, rejected,
   pointer-only, or conflict.
3. Read `open-decisions.md` and ensure no open item blocks the claimed
   finished state.
4. Fill `proof-and-readiness.md` with proof clusters and readiness checks.
5. Harden `README.md` so it routes only.
6. Harden `AGENTS.md` so it carries posture, not behavior authority.
7. Shorten `CONTEXT.md` if definitions drifted into behavior.
8. Remove duplicated ownership across seam docs.
9. Run a cold-reader review prompt or prepare one for a follow-up agent.
10. Decide whether to delete, archive, or leave `local/subagents-work/` as an
    explicitly temporary packet.

## Definition Of Done

- A fresh reader can answer every final readiness question in `tasks.md`.
- `proof-and-readiness.md` proves behavior without defining behavior.
- `README.md` routes and does not decide.
- `CONTEXT.md` is glossary-only.
- No live doc needs work-dir notes for normal comprehension.
- All temporary ledger rows and open decisions have an explicit final state.

## Verification

- `rg -n "TODO|TBD" local/subagents`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
