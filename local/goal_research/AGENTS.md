# Goal Research Instructions

This directory contains the compressed Goal successor authority docs and
navigation aids for this fork.

## Reader Posture

The successor docs are the controlling Goal authority surface. For Goal
implementation work, version planning, review, or documentation updates, start
with the relevant successor doc and read affected docs top to bottom.

`README.md` and `CONTEXT.md` are navigation aids. They help agents find the
right owning document and shared terms, but they do not supersede the successor
docs. If a navigation aid and a successor doc differ, follow the successor doc
and update the navigation aid.

The live reader surface is the successor docs plus `AGENTS.md`, `README.md`,
and `CONTEXT.md`. Use repository history only for a named provenance question,
suspected concept loss, or direct conflict that cannot be resolved from the
live docs.

Version-specific implementation-route plans may live outside this directory.
They are execution artifacts, not peer authority, unless a later explicit
authority update says otherwise. If route material is more precise than older
source wording and preserves the underlying Goal concept, represent the
decision in the owning successor doc rather than making future agents cite the
route plan.

Before editing docs or implementing Goal authority work, read the applicable
successor docs directly top to bottom. Do not rely on grep-only scans for these
docs.

## Authority Order

Use this order when a task touches Goal authority, cadence, steering shape,
durable state, final request input, idle lifecycle, recorded evidence,
cleanup, extension reachability, legacy artifacts, tests, or implementation
handoff:

1. `goal-authority-behavior.md`
   - Behavioral truth for active Goal authority and forbidden substitutes.
2. `goal-cadence-contract.md`
   - Cadence events, steering-kind ranking, due rules, and cadence boundaries.
3. `goal-durable-state-and-pending-intent.md`
   - Durable Goal facts, facts version, pending intent, exact-key consumption,
     and durable suppression record storage.
4. `goal-final-request-input.md`
   - Per-attempt final request-input shaping, selected developer-role item
     proof, commit, retry/follow-up, and committed carry.
5. `goal-idle-history-lifecycle.md`
   - Idle ordering, pending-work precedence, automatic Continuation,
     model-visible history key, suppression comparison, resume, and restart.
6. `goal-recorded-request-evidence.md`
   - Structured committed request evidence as replay/audit metadata.
7. `goal-request-repair-and-artifact-classification.md`
   - Strict classifiers, legacy artifact classification, and request-local
     repair.
8. `goal-projection-reconstruction-and-raw-history.md`
   - Typed/materialized projection, raw notifications, compaction,
     reconstruction, rollback, fork, and legacy artifact cleanup limits.
9. `goal-extension-lifecycle-and-reachability.md`
   - Extension lifecycle, mutation entry points, accounting, configuration
     compatibility, and reachability.
10. `goal-test-prep-and-replacement-proof.md`
    - Test prep, upstream baseline restoration, replacement proof matrix,
      snapshots, and stale-symbol audits.
11. `goal-readiness-and-execution-handoff.md`
    - Ready/Open/Blocker meanings, execution-plan handoff requirements,
      source-corpus posture, demolition boundary, and final cleanup routing.

If successor docs appear to conflict, stop and name the conflict. Do not
silently choose an implementation shape that weakens the active authority
model.

## Container Roles

- `AGENTS.md` is the operations container for reading posture, conflict
  handling, non-negotiable reminders, and verification posture. Do not split it
  into a long-lived successor authority doc.
- `README.md` is the navigation container for reader routing, document roles,
  supporting seams, and terrain anchors. Do not split it into a long-lived
  navigation authority doc.
- `CONTEXT.md` is glossary-only context. It must not carry behavior rules,
  implementation plans, or test requirements.

## Non-Negotiables

Keep these decisions intact:

- active Goal steering is developer-role model input
- active Goal authority is established only by final model request input
  containing the selected developer-role Goal `ResponseItem`
- generic internal context may provide Goal text rendering, provenance, and
  cleanup classification; it is not an authority mechanism by itself
- active Goal steering does not use `GoalContext`, `GoalContextRole`, or
  `<goal_context>`
- Initial, ObjectiveUpdated, and BudgetLimit use persisted pending cadence
  intent until final model request input contains the matching developer-role
  Goal item
- automatic Continuation uses a state-owned latest watermark, or an equivalent
  durable/reconstructable suppression record, not persisted pending
  Continuation intent
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

When preparing the Goal rewrite, follow
`goal-test-prep-and-replacement-proof.md`. Do not let the current local test
overlay keep the broken active steering path alive.

Treat upstream Goal product surfaces as baseline obligations during test prep.
A separate product change is required to replace that behavior.

## Working Posture

Existing Rust code is terrain, not mission. It can show where implementation
will land, but it must not override the successor docs.

Known terrain that must not become the design:

- resume fabricating Initial for any active Goal
- runtime-only Initial pending state as the durable cadence model
- ObjectiveUpdated or BudgetLimit intent being dropped when old concrete
  same-turn injection terrain fails instead of remaining pending after
  unavailable or rejected metadata-only same-turn cadence recheck
- pre-shaper concrete Goal `ResponseInputItem` carry as proof of authority
- Goal-only fake provenance machinery as active steering machinery
- special local raw-response suppression for Goal context
- final stale-symbol audits as architecture instead of review gates

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

For docs-only work, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

For Rust implementation work, follow the repository root `AGENTS.md`
validation rules and keep tests focused on final model payloads, structured
recorded request evidence, or the specific Goal behavior being changed.
