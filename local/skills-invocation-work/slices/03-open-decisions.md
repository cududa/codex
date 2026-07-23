# 03 Open-Decision Log

## Goal

Convert uncertain source and policy questions into explicit open decisions that
block or guide implementation planning.

The reader job is to see what must be decided before code shape can be named.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- `local/skills-invocation-work/open-decisions.md`.

## Target Files

- `local/skills-invocation-work/open-decisions.md`
- `local/skills-invocation-work/source-corpus-map.md`
- `local/skills-invocation-work/authority-map.md`

## Terrain

- `local/skills-invocation-work/source-corpus-map.md`
- `local/skills-invocation-work/concept-ledger.md`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/agent/control.rs`
- `codex-rs/core/src/hook_runtime.rs`
- `codex-rs/core/src/guardian/`

## Decomposition Checkpoint

Decompose only if decisions divide into separate owner groups that cannot be
reviewed coherently together, such as source eligibility decisions and
injection-placement decisions.

Do not resolve decisions merely because current code makes one answer easy.

## Work Steps

1. Read every open decision.
2. For each source category still marked open, decide whether the question is
   behavior, product scope, proof, or implementation placement.
3. Add default directions only when they are clearly subordinate to the bug
   intent and source terrain.
4. Record what each decision blocks.
5. Update source map statuses when a decision clarifies classification.
6. Mark decisions as resolved only when the answer has a future owner and a
   clear recorded rationale.

## Definition Of Done

- No implementation-blocking question is hidden in prose.
- Each open decision names its blocked artifact or implementation concern.
- Each defaulted decision names why it is only a default.
- Decisions that require user input are obvious.

## Verification

```text
rg -n "State: open|State: defaulted" local/skills-invocation-work/open-decisions.md
git diff --check -- local/skills-invocation-work
```

