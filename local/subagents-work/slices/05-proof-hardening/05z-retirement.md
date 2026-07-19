# 05z Retirement

## Goal

Confirm the full documentation set satisfies the parent `05` definition of
done and decide the final disposition of `local/subagents-work/`.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- All live docs in `local/subagents/`.
- Parent slice: `local/subagents-work/slices/05-proof-hardening.md`.

## Target Live Docs

- Any live doc that still fails final readiness.
- `local/subagents/proof-and-readiness.md` for final readiness posture.

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify every ledger row has a final state.
3. Verify every open decision is resolved or explicitly non-blocking.
4. Verify the final readiness gate in `tasks.md`.
5. Decide whether to delete, archive, or leave `local/subagents-work/` as an
   explicitly temporary packet.
6. Remove the `Cursor` when no active documentation population work remains.
7. Mark `05 Proof and hardening` complete only after consolidation succeeds.

## Definition Of Done

- The parent `05 Proof and hardening` definition of done is satisfied.
- The final readiness gate in `tasks.md` is satisfied.
- No live doc needs work-dir notes for normal comprehension.
- `tasks.md` no longer carries an active Cursor.

## Verification

- `rg -n "TODO|TBD|skeleton|Skeleton|To Fill" local/subagents`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
