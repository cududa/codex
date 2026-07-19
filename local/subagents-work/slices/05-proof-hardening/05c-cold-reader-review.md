# 05c Cold-Reader Review

## Goal

Run or prepare a cold-reader review that checks whether the live docs stand on
their own without the work packet.

## Authority

- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- All live docs in `local/subagents/`.
- Parent slice: `local/subagents-work/slices/05-proof-hardening.md`.

## Target Live Docs

- `local/subagents/proof-and-readiness.md`
- `local/subagents/README.md` only if review findings require routing fixes.
- Other live docs only for concrete ownership or stale-context fixes.

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Prepare a cold-reader prompt that references only live docs.
3. Run the review if feasible in this session; otherwise record the prompt and
   required output shape in `proof-and-readiness.md`.
4. Apply concrete live-doc fixes found by the review.
5. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A cold-reader route exists and does not depend on work-dir artifacts.
- Any findings are either fixed or recorded as explicit follow-up/readiness
  posture.
- The final readiness questions in `tasks.md` are covered by review criteria.

## Verification

- `rg -n "TODO|TBD|skeleton|Skeleton" local/subagents`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
