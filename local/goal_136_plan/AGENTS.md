# v136 Goal Plan Instructions

This directory is execution planning for the v136 Goal authority rewrite.

It is not authority. The authority docs live in `local/goal_research`.

Before implementing work from this directory, read:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-fake-shim-removal-map.md`
6. `local/goal_research/goal-test-deletion-map.md`
7. `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
8. `local/goal_136_plan/batches/AGENTS.md` when executing or editing a batch
   under `local/goal_136_plan/batches/`

If any plan file here conflicts with the authority docs, stop and name the
conflict. The authority docs win. Do not silently weaken the authority docs to
fit this plan.

## Execution Rules

Use `goal-authority-implementation-execution-plan.md` as the v136 execution
spine. It is the control document for ordering, dependencies, invariant lock,
and acceptance gates.

Do not implement from the spine alone. File-specific implementation work must
come from approved batch docs under `local/goal_136_plan/batches/`.

Batch docs are grouped by implementation dependency, not by source authority
doc, so the durable cadence state, final request-input shaping, idle
Continuation, extension conversion, repair/projection work, and replacement
tests can be planned without reopening the core architecture.

Slices are ordered work packets on one branch. They exist so agents can pick
up the rewrite in succession across compactions with a clear local task,
handoff state, and validation target. They are not individual PRs, release
units, or promises of independent mergeability. Do not distort module
boundaries, add no-op architecture, or create test-only seams just to make a
slice appear independently complete.

When creating or revising slice docs, follow
`local/goal_136_plan/batches/slice-planning-rules.md`. Slice boundaries must
come from the relevant authority docs plus a direct code walk of the batch
terrain, not from document length or plausible implementation guesses.

The producer behavior switch is atomic. After that switch is accepted, no
active Goal steering producer may remain on `GoalContext`, `GoalContextRole`,
active `<goal_context>` emission, user-role Goal steering, or Goal-only fake
provenance machinery.

Do not mutate authority docs from plan execution unless the user explicitly
asks for authority-doc edits.

Do not treat compatibility, migration, legacy handling, projection hiding,
classifier output, or raw response notification behavior as model authority.
Authority is proven only by final model request input or recorded rollout
items containing the current Goal steering item as outer `developer` role model
input.

## Plan Boundaries

The batch docs and slice docs are ordered execution guidance for one rewrite
branch. They are not permission to present known-broken active Goal behavior
as accepted, and they are not pressure to make every intermediate packet a
standalone build or merge point.

- Test prep may remove false pressure but must not weaken upstream Goal product
  baseline obligations.
- Generic internal-context and classifier work must not partially convert
  active Goal producers.
- Durable cadence state must keep Goal facts and pending cadence intent in the
  same SQL transaction.
- Final-input commit and producer conversion must be coherent before active
  steering behavior is considered switched.
- Resume, idle lifecycle, repair, projection, and replacement tests must stay
  aligned with the cadence contract.

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research local/goal_136_plan
```

For Rust implementation, follow the root `AGENTS.md` validation rules and the
focused validation listed in the active slice.
