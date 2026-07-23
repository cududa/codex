# 02 Concept Ledger

## Goal

Turn the initial vocabulary into a precise concept ledger for invocation
research.

The reader job is to understand the difference between visibility, authority,
mention syntax, resolution, and injection effect without reading source code.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- `local/skills-invocation-work/concept-ledger.md`.

## Target Files

- `local/skills-invocation-work/concept-ledger.md`
- `local/skills-invocation-work/open-decisions.md`
- `local/skills-invocation-work/authority-map.md`

## Terrain

- `codex-rs/core-skills/src/injection.rs`
- `codex-rs/core-skills/src/injection_tests.rs`
- `codex-rs/core/src/plugins/mentions.rs`
- `codex-rs/core/src/plugins/mentions_tests.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/plugins/injection.rs`
- `codex-rs/core/src/skills.rs`

## Decomposition Checkpoint

This slice should stay whole unless terminology divides into more than one
real reader job, such as source policy terms versus mention-resolution terms.

Do not create a glossary-like live `CONTEXT.md` yet. This slice should prepare
candidate terms first.

## Work Steps

1. Read current ledger terms and mention-resolution terrain.
2. Identify which terms are source-policy terms, mention syntax terms,
   resolution terms, or injection-effect terms.
3. Mark ambiguous terms as `conflict` or add open decisions.
4. Replace broad or overloaded labels with sharper candidate terms.
5. Add future owner guesses only where the authority map already supports
   them.
6. Keep implementation names out unless they are required terrain.

## Definition Of Done

- Core terms have short candidate definitions.
- The ledger separates source eligibility from mention resolution.
- The ledger separates invocation cause from injection effect.
- Terms that would decide behavior are linked to open decisions.
- No glossary term carries a hidden implementation plan.

## Verification

```text
rg -n "candidate|conflict" local/skills-invocation-work/concept-ledger.md
git diff --check -- local/skills-invocation-work
```

