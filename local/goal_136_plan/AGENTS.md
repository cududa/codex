# v136 Goal Plan Instructions

This directory is execution planning for the v136 Goal authority rewrite.

It is not authority. The authority docs live in `local/goal_research`.

Before implementing any slice from this directory, read:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-fake-shim-removal-map.md`
6. `local/goal_research/goal-test-deletion-map.md`

If any plan file here conflicts with the authority docs, stop and name the
conflict. The authority docs win. Do not silently weaken the authority docs to
fit this plan.

## Execution Rules

Implement slices in order:

1. `01-prep-and-infrastructure.md`
2. `02-atomic-behavior-switch.md`
3. `03-resume-and-idle-lifecycle.md`
4. `04-repair-projection-and-tests.md`

Slice 02 is atomic. After Slice 02 is accepted, no active Goal steering
producer may remain on `GoalContext`, `GoalContextRole`, active
`<goal_context>` emission, user-role Goal steering, or Goal-only fake
provenance machinery.

Do not mutate authority docs from plan execution unless the user explicitly
asks for authority-doc edits.

Do not treat compatibility, migration, legacy handling, projection hiding,
classifier output, or raw response notification behavior as model authority.
Authority is proven only by final model request input or recorded rollout
items containing the current Goal steering item as outer `developer` role model
input.

## Slice Boundaries

The slice files are review and execution boundaries. They are not permission to
land known-broken active Goal behavior.

- Slice 01 may prepare tests, generic internal context, classifiers, and
  durable state, but must not convert active producers partially.
- Slice 02 converts the active behavior path and must land as a coherent
  behavior switch.
- Slice 03 wires resume and idle lifecycle against the Slice 02 cadence model.
- Slice 04 finishes repair, projection, legacy cleanup, and replacement tests.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research local/goal_136_plan
```

For Rust implementation, follow the root `AGENTS.md` validation rules and the
focused validation listed in the active slice.
