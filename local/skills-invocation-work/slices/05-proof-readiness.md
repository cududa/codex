# 05 Proof And Readiness

## Goal

Define the proof matrix and readiness gate that must pass before implementation
planning starts.

The reader job is to know what evidence will prove accepted invocations and
rejected non-invocations through the right seam.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- `local/skills-invocation-work/proof-and-readiness.md`.

## Target Files

- `local/skills-invocation-work/proof-and-readiness.md`
- `local/skills-invocation-work/tasks.md`
- `local/skills-invocation-work/open-decisions.md`
- `local/skills-invocation-work/authority-map.md`

## Terrain

- `codex-rs/core/tests/suite/skills.rs`
- `codex-rs/core/tests/suite/plugins.rs`
- `codex-rs/core-skills/src/injection_tests.rs`
- `codex-rs/core/src/plugins/mentions_tests.rs`
- `codex-rs/core/tests/common/responses.rs`
- focused tests identified by source-category research

## Decomposition Checkpoint

Decompose only if proof clusters split into independent research jobs, such as
accepted-source proof, rejected-source proof, parser/resolver proof, and
cold-reader readiness.

Do not write implementation tests in this slice. This slice names proof, not
code.

## Work Steps

1. Read current proof and readiness posture.
2. Map each future owning doc to a proof cluster.
3. Add positive proof cases for accepted source categories.
4. Add negative proof cases for rejected or model-visible-only categories.
5. Identify focused existing tests to extend or replace.
6. Define readiness status terms if needed.
7. Update `tasks.md` only when the packet is actually ready.

## Definition Of Done

- Proof clusters cover source policy, mention resolution, and injection effect.
- Negative proof includes quoted/evidence, replay, tool output, and assistant
  output cases.
- Readiness criteria distinguish design-input readiness from implementation
  completion.
- Any missing proof route is an open decision, not a hidden assumption.

## Verification

```text
rg -n "Negative Proof|Readiness Gate|open" local/skills-invocation-work/proof-and-readiness.md local/skills-invocation-work/open-decisions.md
git diff --check -- local/skills-invocation-work
```

