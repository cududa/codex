# Goal Research Instructions

This directory contains local authority docs for Goal behavior in this fork.
Treat them as design contracts, not brainstorming notes.

Version-specific implementation plans may live outside this directory, such as
`local/goal_136_plan`. Those plans are execution artifacts, not peer authority.
They must conform to the authority order here.

Before editing docs or implementing Goal authority work, read the applicable
files directly top to bottom. Do not rely on grep-only scans for these docs.

## Authority Order

Use this order when a task touches Goal authority, cadence, steering shape,
resume behavior, compaction repair, legacy Goal artifacts, or Goal tests:

1. `goal-authority-grounding-truth.md`
   - Behavioral truth and anti-patterns.
   - Highest-level contract for all version plans and implementations.
2. `goal-authority-primary-cadence-contract.md`
   - Implementable cadence, durable intent, repair, and consumption contract.
3. `goal-authority-idle-continuation-contract.md`
   - Dedicated `MaybeContinueIfIdle` contract.
   - Defines the idle hook as pending work first, pending durable cadence
     intent second, automatic Continuation last.
4. `goal-authority-fake-shim-removal-map.md`
   - Terrain map for deleting the active Goal-only context path.
   - Not architecture to keep alive.
5. `goal-test-deletion-map.md`
   - Concrete test prep map.
   - Defines which local overlay tests to delete, which files to return to
     `rust-v0.136.0` baseline, and which replacement tests to add after the
     active steering rewrite.

If these files appear to conflict, stop and name the conflict. Do not silently
choose an implementation shape that weakens the grounding truth.

## File Relationships

The four authority files are complementary, not competing proposals.

`goal-authority-grounding-truth.md` is the behavioral source of truth. It says
what must be true from the model's perspective and what designs are forbidden.
Use it to reject implementation shapes that would reintroduce Goal reminders on
ordinary user turns, user-role Goal steering, rendered marker text as
authority, or hiddenness-as-authority.

`goal-authority-primary-cadence-contract.md` turns that truth into an
implementable cadence model. It defines durable Goal facts, persisted pending
cadence intent, consumption when final model request input contains the
developer-role Goal item, request repair, supersedence, and the verification
checklist. Version plans should generally derive their state model and tests
from this file.

`goal-authority-idle-continuation-contract.md` is a focused companion to the
cadence contract. It fills in the `MaybeContinueIfIdle` gap. Use it only for
idle lifecycle sequencing, pending-work precedence, pending durable cadence
intent delivery, automatic Continuation watermarking, resume hydration, and
reservation/retry behavior. It does not replace the primary cadence contract.

`goal-authority-fake-shim-removal-map.md` is implementation terrain for
deleting the active Goal-only context path. It explains where the existing
`GoalContext` / `<goal_context>` machinery is rooted and what consumers must
be replaced. It does not decide when Goal speaks; the cadence docs decide that.

`goal-test-deletion-map.md` is the test prep authority. Use it to remove local
false-compatibility pressure, restore upstream Goal product tests to
`rust-v0.136.0` baseline, and add replacement tests from the authority
contracts after the active steering path is replaced.

A complete implementation plan usually needs all five:

```text
grounding truth decides what is allowed
  -> primary cadence decides when Goal steering is due
  -> idle continuation decides how idle hooks sequence Goal-owned turns
  -> fake-shim removal map decides what active Goal-only context terrain to delete
  -> test deletion map decides how to reset test pressure before replacement tests
```

## Non-Negotiables

Keep these decisions intact:

- active Goal steering is developer-role model input
- active Goal steering uses generic role-bearing internal context
- active Goal steering does not use `GoalContext`, `GoalContextRole`, or
  `<goal_context>`
- Initial, ObjectiveUpdated, and BudgetLimit use persisted pending cadence
  intent until final model request input contains the matching developer-role
  Goal item
- automatic Continuation uses runtime-only watermarking
- ordinary user turns are not cadence events
- active durable Goal state alone must not emit Goal steering
- active durable Goal state alone is not cadence-required authority
- request repair is request-local by default and is not cadence
- resume is hydration, not cadence
- legacy `<goal_context>` is artifact handling only
- raw response item notifications remain raw unless the general raw-response
  contract is explicitly changed
- budget and usage are upstream Goal facts, not local experiments
- app-server Goal APIs, `/goal`, status/footer projection, pause/edit/clear,
  and budget/usage tests return to upstream baseline unless a later product
  change explicitly replaces that behavior

## Test Prep Posture

When preparing the Goal rewrite, do not let the current local test overlay keep
the broken active steering path alive.

Follow `goal-test-deletion-map.md`:

- delete local-only tests that defend `<goal_context>`, `GoalContext`,
  `GoalContextRole`, user-role Goal steering, rendered-marker authority, or
  bad cadence
- revert Goal-related hunks in upstream test files to the `rust-v0.136.0`
  baseline
- keep upstream Goal product behavior active as the baseline profile
- add replacement tests from the authority contracts after the active steering
  implementation is replaced

Treat upstream Goal product surfaces as baseline obligations during test prep.
A separate product change is required to replace that behavior.

## Working Posture

Existing Rust code is terrain, not mission. It can show where implementation
will land, but it must not override the local authority docs.

Known terrain that must not become the design:

- resume fabricating Initial for any active Goal
- runtime-only Initial pending state as the durable cadence model
- ObjectiveUpdated or BudgetLimit steering being dropped after failed
  same-turn injection
- Goal-only fake provenance machinery as active steering machinery
- special local raw-response suppression for Goal context

Before execution, lock the direction explicitly:

```text
Request:
Authority:
Terrain:
Code-shape temptation:
Locked direction:
Exclusions:
```

## Verification

For docs-only work, run a cheap whitespace check such as:

```text
git diff --check -- local/goal_research
```

For Rust implementation work, follow the repository root `AGENTS.md` validation
rules and keep tests focused on final model payloads, recorded rollout items,
or the specific Goal behavior being changed.
