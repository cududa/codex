# 04z Hooks And Realtime Consolidation

## Goal

Confirm that the decomposed `04 Hooks and realtime` work satisfies the parent
definition of done without letting hooks or realtime redefine core lifecycle.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/hooks-and-integrations.md`.
- `local/subagents/realtime-background-agent-handoff.md`.
- Parent slice: `local/subagents-work/slices/04-hooks-realtime.md`.

## Target Live Docs

- `local/subagents/hooks-and-integrations.md`
- `local/subagents/realtime-background-agent-handoff.md`
- `local/subagents/README.md` only if routing needs a short pointer update.

## Terrain

- Completed `04a` and `04b` outputs.
- `local/subagents-work/concept-ledger.md`
- `local/subagents-work/open-decisions.md`
- Parent definition of done in
  `local/subagents-work/slices/04-hooks-realtime.md`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for consolidation.
2. Read both target live docs top to bottom.
3. Remove duplicated lifecycle, communication, or realtime scope ownership.
4. Confirm realtime scope is resolved.
5. Confirm parent definition of done.
6. Update `tasks.md`, `concept-ledger.md`, and `open-decisions.md`.

## Definition Of Done

- The parent `04 Hooks and realtime` definition of done is satisfied.
- Hooks and realtime docs have distinct ownership.
- Realtime remains a sibling Adapter unless an explicit decision says
  otherwise.
- `tasks.md` can mark `04 Hooks and realtime` complete.
- Cursor advances to `05 Proof and hardening`.

## Verification

- `rg -n "TODO|TBD" local/subagents/hooks-and-integrations.md local/subagents/realtime-background-agent-handoff.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
