# 05b Reader Hardening

## Goal

Harden routing and glossary docs so a fresh reader can navigate the live
authority surface without work-dir notes.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- Parent slice: `local/subagents-work/slices/05-proof-hardening.md`.

## Target Live Docs

- `local/subagents/README.md`
- `local/subagents/AGENTS.md`
- `local/subagents/CONTEXT.md`
- Seam docs only for stale fidelity notes, stale proof placeholders, or
  duplicated ownership cleanup.

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Keep `README.md` to routing and terrain anchors.
3. Keep `AGENTS.md` to authority order, scope, posture, stop conditions, and
   validation posture.
4. Keep `CONTEXT.md` glossary-only.
5. Remove stale skeleton language and stale proof placeholders.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- `README.md` routes and does not decide behavior.
- `AGENTS.md` carries posture, not full behavior authority.
- `CONTEXT.md` remains glossary-only.
- Stale skeleton/proof placeholder language is gone from live docs.

## Verification

- `rg -n "TODO|TBD|skeleton|Skeleton|To Fill" local/subagents`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
