# 03z State And Client Projection Consolidation

## Goal

Confirm that the decomposed `03 State and client projection` work satisfies
the parent slice definition of done without making client adapters behavior
owners.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/state-and-client-projection.md`.
- `local/subagents/spawn-context-lifecycle.md`.
- `local/subagents/communication-and-results.md`.
- Parent slice: `local/subagents-work/slices/03-state-client-projection.md`.

## Target Live Docs

- `local/subagents/state-and-client-projection.md`
- `local/subagents/README.md` only if routing needs a short pointer update.
- `local/subagents/proof-and-readiness.md` only if local proof notes should be
  moved out of the state/projection doc.

## Terrain

- Completed `03a`, `03b`, and `03c` outputs.
- `local/subagents-work/concept-ledger.md`
- `local/subagents-work/open-decisions.md`
- Parent definition of done in
  `local/subagents-work/slices/03-state-client-projection.md`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for consolidation.
2. Read the state/projection doc top to bottom.
3. Remove duplicated lifecycle, communication, app-server, or TUI ownership.
4. Resolve the client projection authority decision.
5. Confirm the parent definition of done.
6. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- The parent `03 State and client projection` definition of done is satisfied.
- Persisted state, app-server projection, and TUI projection are distinct.
- Client adapters do not own core lifecycle or mailbox behavior.
- `tasks.md` can mark `03 State and client projection` complete.
- Cursor advances to `04 Hooks and realtime`.

## Verification

- `rg -n "TODO|TBD" local/subagents/state-and-client-projection.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
