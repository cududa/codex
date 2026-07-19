# 01z Core Trio Consolidation

## Goal

Confirm that the decomposed `01 Core trio` work satisfies the parent slice
definition of done without duplicated ownership.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/delegation-interface.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- `local/subagents/runtime-architecture.md`.
- Parent slice: `local/subagents-work/slices/01-core-trio.md`.

## Target Live Docs

- `local/subagents/delegation-interface.md`
- `local/subagents/spawn-context-lifecycle.md`
- `local/subagents/runtime-architecture.md`
- `local/subagents/README.md` only if routing needs a short pointer update.

## Terrain

- Completed `01a`, `01b`, and `01c` outputs.
- `local/subagents-work/concept-ledger.md`
- `local/subagents-work/open-decisions.md`
- Parent definition of done in `local/subagents-work/slices/01-core-trio.md`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for consolidation.
2. Read all three target live docs top to bottom.
3. Remove duplicated ownership and replace it with pointers.
4. Confirm the v1 compatibility decision is resolved or explicitly blocking.
5. Confirm parent definition of done.
6. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- The parent `01 Core trio` definition of done is satisfied.
- The three target docs agree on Interface, lifecycle, and runtime ownership.
- `tasks.md` can mark `01 Core trio` complete.
- Cursor advances to `02 Communication and results`.

## Verification

- `rg -n "TODO|TBD" local/subagents/delegation-interface.md local/subagents/spawn-context-lifecycle.md local/subagents/runtime-architecture.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
