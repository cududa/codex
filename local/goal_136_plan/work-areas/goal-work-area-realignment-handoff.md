# Goal Work Area Realignment Handoff

## Purpose

This note is for agents continuing the v136 Goal plan realignment after the
coordination-note update.

The work is documentation realignment only. Do not implement Rust code from
this note.

## Required Reading

Read these before editing:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-fake-shim-removal-map.md`
6. `local/goal_research/goal-test-deletion-map.md`
7. `local/goal_136_plan/AGENTS.md`
8. `local/goal_136_plan/work-areas/AGENTS.md`
9. `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`

`local/goal_research` is authority. `local/goal_136_plan` is execution
planning and may be rewritten to conform.

## Locked Decisions

- Final request input is the active Goal authority seam.
- The selected active Goal item is a final model input
  `ResponseItem::Message { role: "developer", ... }`.
- Source-tagged Goal text may support provenance and cleanup, but it is not
  authority. Do not write "developer-role internal-context ResponseItem."
- Use `codex-rs/core/src/goal_cadence/` as the private core module directory,
  not a single growing `goal_cadence.rs` file and not `goals.rs`.
- `goal_cadence::finalize_request_input(base_input, GoalRequestContext)`
  should remain a small request-input shaping interface. It receives typed
  facts and metadata assembled per attempt, not `&Session`, `StateDbHandle`, or
  `TurnContext`.
- `GoalFinalizationOutcome` needs a submit branch and an internal
  abort-before-submit branch for stale Goal-owned synthetic turns.
- `core/src/state/turn.rs` stores Goal turn request metadata and committed
  carry metadata only. It stores no rendered Goal prompt and no
  `ResponseInputItem` as authority.
- Same-turn cadence metadata means "re-run cadence selection from fresh durable
  facts"; it does not guarantee the originally requested kind is delivered.
- `ext/goal` must not construct active model input, choose active role,
  consume pending intent, advance Continuation suppression, or commit delivery.
- The v136 default is adapter/runtime conversion in `ext/goal`, not mandatory
  v139/v140 `GoalService` adoption.
- A thin `ext/goal/src/api.rs` facade is allowed only if a code-grounded pass
  proves the adapter/runtime path cannot carry shared mutation/accounting
  ordering. Full service adoption requires explaining why adapter/runtime and a
  thin facade are insufficient.

## Completed In This Realignment Pass

- Added the accepted v136 placement default to
  `goal-work-area-coordination-note.md`.
- Changed the open type-placement question into follow-through items.
- Updated `work-areas/AGENTS.md` so the file ownership map uses
  `core/src/goal_cadence/` and treats `ext/goal/src/api.rs` as optional.
- Updated the execution spine ownership map to make adapter/runtime conversion
  the Work Area 04 default and the service facade optional.
- Updated Work Area 04's direction lock, ownership split, and first required
  sections so `GoalService` is no longer mandatory.
- Updated Work Area 02's core shaper interface so it uses
  `GoalRequestContext`, no `&Session` / `TurnContext`, and a submit-or-abort
  outcome.

## Remaining Propagation Work

### Work Area 02

Finish replacing stale wording:

- `goal_cadence.rs` -> `core/src/goal_cadence/`, except when explicitly
  describing the rejected single-file shape
- "finalizer module" -> "request-input shaping module" or
  "`core/src/goal_cadence/`"
- "developer-role current Goal internal-context item" -> "current Goal
  `ResponseItem` with outer `role: \"developer\"`"

Check that commit handling remains separate from request-input shaping:

- shaper is pure over base input plus context
- Created-event commit handler may use session/state adapters, but commit
  metadata must refer to the exact final item

### Work Area 03

Update path and interface language:

- replace single-file `goal_cadence.rs` assumptions with
  `core/src/goal_cadence/`
- make Continuation finalization consume `GoalTurnRequest` metadata, not
  prebuilt model input
- ensure stale synthetic Goal-owned turns use
  `GoalFinalizationOutcome::AbortSyntheticGoalTurn` or equivalent
- keep committed automatic Continuation suppression storage described as
  committed metadata, not persisted pending Continuation intent

### Work Area 04

Finish the service-facade cleanup:

- all remaining `GoalService::...` examples must become "selected ordering
  path" unless they sit in an explicitly optional thin-facade subsection
- app-server should not be forced to depend on `codex-goal-extension` unless
  the chosen shape justifies it
- reachable `ext/goal` producers still must be converted, removed, or proven
  unreachable
- tests should prove extension/app-server-origin cadence reaches final
  `/responses` input as exactly one current developer-role Goal `ResponseItem`

### Work Area 05

Scrub wording that makes classifier or internal-context helpers sound like
authority:

- classifiers are cleanup/projection tools only
- current Goal source-tagged text may be classified for cleanup, but the
  authority proof remains final request input
- `goal_cadence/` may call classifier helpers; classifier helpers must not
  select cadence or infer durable Goal facts

### Work Area 06

Update final acceptance checks:

- no Goal prompt-body-to-model-input construction outside `goal_cadence/`
- no production active `GoalContext`, `GoalContextRole`, active
  `<goal_context>`, user-role active Goal steering, or pre-finalizer concrete
  Goal injection
- no remaining mandatory `GoalService` adoption unless Work Area 04 selected
  and justified it

## Verification

For docs-only edits:

```powershell
git diff --check -- local/goal_research local/goal_136_plan
```

Also scan the touched docs for stale phrases:

```powershell
rg -n "developer-role internal-context|internal-context ResponseItem|core/src/goal_cadence\\.rs|GoalService::|route through `GoalService`" local\goal_136_plan
```

Some `GoalService` references are valid when they describe upstream topology or
the optional facade decision. They are not valid as mandatory v136
implementation instructions unless the doc explicitly carries the required
code-grounded justification.
