# 03c TUI Projection

## Goal

Fill TUI projection rules in `state-and-client-projection.md` as an Adapter
over app-server/state/runtime signals.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/state-and-client-projection.md`.
- Completed `03a` and `03b` rules.
- Parent slice: `local/subagents-work/slices/03-state-client-projection.md`.

## Target Live Docs

- `local/subagents/state-and-client-projection.md`
- `local/subagents/proof-and-readiness.md` only for TUI proof notes that
  should not stay in the state/projection doc.

## Terrain

- `codex-rs/tui/src/app/loaded_threads.rs`
- `codex-rs/tui/src/app/agent_navigation.rs`
- `codex-rs/tui/src/app/session_lifecycle.rs`
- `codex-rs/tui/src/app/thread_routing.rs`
- `codex-rs/tui/src/chatwidget/tool_lifecycle.rs`
- `codex-rs/tui/src/multi_agents.rs`

## Work Steps

1. Use `task-alignment` and emit a Direction Lock for this subslice.
2. Verify loaded-thread backfill and descendant discovery behavior.
3. Fill agent navigation cache rules: first-seen order, closed visibility,
   removal, active labels, and picker availability.
4. Fill history row/rendering projection rules only to the level needed to
   explain downstream presentation.
5. Keep TUI layout specifics and snapshot details for proof/readiness unless a
   projection invariant requires authority.
6. Update `concept-ledger.md`, `open-decisions.md`, and the `tasks.md` cursor.

## Definition Of Done

- A reader can explain how TUI discovers loaded subagent descendants.
- A reader can explain stable navigation order and closed-thread visibility.
- A reader can distinguish TUI presentation rules from persisted graph and
  app-server projection rules.
- TUI prose does not become layout or snapshot authority.

## Verification

- `rg -n "TODO|TBD" local/subagents/state-and-client-projection.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
