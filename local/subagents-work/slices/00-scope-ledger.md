# 00 Scope Ledger

## Goal

Stabilize the working ledger and open decisions before filling behavior prose.
This slice exists so later agents do not use source-file order as the writing
algorithm.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/subagents/AGENTS.md`.
- `local/subagents/README.md`.

## Target Live Docs

- `local/subagents/AGENTS.md`
- `local/subagents/README.md`
- `local/subagents/CONTEXT.md`

## Terrain

- `local/subagents/*.md`
- `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/protocol/src/protocol.rs`
- `codex-rs/core/src/realtime_conversation.rs`

## Decomposition Checkpoint

This slice should usually stay whole because its job is orientation, not full
behavior prose. Do not create subslices upfront. Decompose only if scope
discovery itself splits into separate reader jobs, such as thread-spawn
identity, related internal subagent variants, and realtime handoff scope.

If decomposed, add a final `00z-consolidation.md` subslice that keeps
`README.md` routing-only and `CONTEXT.md` glossary-only.

## Work Steps

1. Read the live docs in `local/subagents/`.
2. Confirm each live doc has one intended role.
3. Expand `concept-ledger.md` with all major concepts discovered so far.
4. Mark internal subagent variants as related terrain or rejected scope.
5. Confirm realtime remains a sibling adapter by default.
6. Update `open-decisions.md` with any new scope questions.
7. Edit live `AGENTS.md`, `README.md`, or `CONTEXT.md` only if routing or
   definitions are unclear.

## Definition Of Done

- The ledger covers the major concepts needed by slices 01 through 05.
- The live README still routes instead of deciding behavior.
- The glossary remains short and does not carry lifecycle rules.
- Scope questions are in `open-decisions.md`, not hidden in prose.

## Verification

- `rg -n "TODO|TBD" local/subagents/AGENTS.md local/subagents/README.md local/subagents/CONTEXT.md`
- `rg -n "(boun[d]ary|compone[n]t|service\s+API)" local/subagents`
- `git diff --check -- local/subagents local/subagents-work`
