# 04 Authority Map

## Goal

Turn the source map, ledger, and decisions into a draft future live-doc
authority map.

The reader job is to know which future doc would own each durable invocation
rule before implementation planning begins.

## Authority

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- `local/skills-invocation-work/README.md`.
- `local/skills-invocation-work/authority-map.md`.

## Target Files

- `local/skills-invocation-work/authority-map.md`
- `local/skills-invocation-work/concept-ledger.md`
- `local/skills-invocation-work/open-decisions.md`
- `local/skills-invocation-work/proof-and-readiness.md`

## Terrain

- `local/how-we-document.md`
- `local/subagents/AGENTS.md`
- `local/subagents/README.md`
- `local/subagents/proof-and-readiness.md`
- `local/goal_research/README.md`
- `local/goal_research/goal-readiness-and-execution-handoff.md`
- source files named by earlier slices only as needed to verify ownership

## Decomposition Checkpoint

Decompose only if the future authority surface splits into several real seams
that cannot be mapped in one pass. Do not decompose by candidate filename.

If decomposed, include a consolidation pass that removes duplicate ownership
and keeps `README.md` routing-only and `CONTEXT.md` glossary-only.

## Work Steps

1. Read the current authority map.
2. Compare candidate docs against the source categories and concepts.
3. Check every durable rule has one future owner.
4. Move behavior rules out of README/AGENTS-style containers.
5. Keep proof posture in `proof-and-readiness.md`.
6. Record any ownership conflicts in `open-decisions.md`.
7. Decide whether future live docs should be created in a later pass.

## Definition Of Done

- The map names the future live doc set or explains why it remains draft.
- Each candidate doc has clear owns/does-not-own lines.
- Source policy, mention resolution, and injection placement are separate
  unless research proves they are one seam.
- The map names implementation readiness requirements.
- No work-packet file is mistaken for live behavior authority.

## Verification

```text
rg -n "Does not own|Future owner|open" local/skills-invocation-work/authority-map.md local/skills-invocation-work/open-decisions.md
git diff --check -- local/skills-invocation-work
```

