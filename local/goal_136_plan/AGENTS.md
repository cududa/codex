# v136 Goal Plan Instructions

This directory is execution planning for the v136 Goal authority rewrite.

It is not authority. The authority docs live in `local/goal_research`.

Before implementing work from this directory, read:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-final-request-input-and-commit.md`
6. `local/goal_research/goal-authority-durable-cadence-state.md`
7. `local/goal_research/goal-authority-model-visible-history-key.md`
8. `local/goal_research/goal-authority-recorded-request-evidence.md`
9. `local/goal_research/goal-authority-repair-classifier-integration.md`
10. `local/goal_research/goal-authority-fake-shim-removal-map.md`
11. `local/goal_research/goal-test-deletion-map.md`
12. `local/goal_136_plan/goal-authority-implementation-execution-plan.md`
13. `local/goal_136_plan/work-areas/AGENTS.md` when executing or editing a Work Area
   under `local/goal_136_plan/work-areas/`

If any plan file here conflicts with the authority docs, stop and name the
conflict. The authority docs win. Do not silently weaken the authority docs to
fit this plan.

## Execution Rules

Use `goal-authority-implementation-execution-plan.md` as the v136 execution
spine. It is the control document for ordering, dependencies, invariant lock,
and final rewrite acceptance targets.

Do not implement from the spine alone. File-specific implementation work must
come from approved Work Area docs under `local/goal_136_plan/work-areas/`.

`work-areas/` is the directory for coarse planning regions. A Work Area is a
topic and dependency region for the rewrite, not a checkpoint, release phase,
PR boundary, or promise that the branch builds after that region alone. Work
Area docs are grouped by implementation dependency, not by source authority
doc, so durable cadence state, final request-input shaping, idle Continuation,
extension conversion, repair/projection work, and replacement tests can be
planned without reopening the core architecture.

Implementation passes are the ordered units of work inside or across those
regions. They exist because some Work Area docs are too large for one agent
window, while a split by headings or word count creates fake work units. They
are not individual PRs, release units, or promises of independent
mergeability. Do not distort module boundaries, add no-op architecture, or
create test-only seams just to make a pass look self-contained.

WA01-WA06 pre-pass and split planning are complete. The planning-rules docs are
retained as process context for how the existing maps, readiness notes, and
implementation pass docs were produced. Fresh implementation sessions should
start from
`local/goal_136_plan/work-areas/implementation-route-index.md` and then the
concrete ordered pass docs under `work-areas/`, not rerun the pre-pass or
split-planning process and not add extra verification gates merely because the
planning-rules docs exist. Reopen those rules only if a required deliverable is
missing, a pass doc directly conflicts with `local/goal_research`, or
implementation finds a concrete route-breaking dependency gap. Keep the route
index status cells terse; do not turn them into implementation logs.

The producer behavior switch is atomic. After that switch lands, no
active Goal steering producer may remain on `GoalContext`, `GoalContextRole`,
active `<goal_context>` emission, user-role Goal steering, or Goal-only fake
provenance machinery.

Do not mutate authority docs from plan execution unless the user explicitly
asks for authority-doc edits.

Do not treat compatibility, migration, legacy handling, projection hiding,
classifier output, or raw response notification behavior as model authority.
Active Goal authority is established by final model request input containing
the selected current Goal steering item as outer `developer` role model input.
Recorded request evidence is structured Created-event commit metadata; it is
not authority by itself and must not be replaced by ordinary rollout items,
rollout trace payloads, raw notifications, classifier matches, or rendered
Goal text.

## Plan Boundaries

The Work Area docs and implementation pass docs are ordered execution guidance
for one rewrite branch. They are not permission to present known-broken active
Goal behavior as accepted, and they are not pressure to make any intermediate
area or pass a standalone build, merge point, or acceptance checkpoint.

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
focused validation listed in the active implementation pass.
