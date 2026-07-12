# v136 Goal Authority Execution Overview

This directory converts the Goal authority contracts into v136 implementation
slices.

It is execution guidance only. The authority order and vocabulary remain in
`local/goal_research/AGENTS.md` and the five Goal authority documents.

Existing Rust code is terrain. It identifies owners and hooks; it does not
change the target architecture.

## Direction Lock

- Request: implement the Goal authority contracts through concrete v136 slices.
- Authority: active Goal steering is a final model request input item with
  outer `developer` role, using generic role-bearing internal context;
  Initial, ObjectiveUpdated, and BudgetLimit use durable pending cadence
  intent; Continuation is idle-derived with runtime duplicate suppression;
  resume is hydration; repair and classifiers are not authority predicates.
- Terrain: current code still uses `GoalContext`, `GoalContextRole`,
  configurable `GoalSteeringRole`, runtime-only Initial state, concrete
  same-turn `ResponseInputItem` injection, and generic pending-input
  pre-recording before final request inspection.
- Code-shape temptation: reuse current `ContextManager::history_version()`,
  commit at stream acceptance, clear pending intent by a short key, or keep
  `<goal_context>` classifiers as active Goal proof because those seams already
  exist.
- Locked direction: implement the contracts through durable cadence state,
  retry-loop final model input finalization, `ResponseEvent::Created` commit,
  compare-and-delete pending intent clearing, a dedicated
  `model_visible_history_key`, a monotonic Goal facts revision, turn-local
  same-turn delivery metadata, and projection/cleanup-only classifiers.
- Exclusions: do not treat this plan as authority; do not preserve active
  fake-wrapper behavior; do not run broad Rust suites unless explicitly asked.

## Batch Map

### 01 Prep And Infrastructure

Prepare test pressure and add the substrate that later slices need:

- restore upstream-oriented test baseline and delete local fake-context tests
- restore/adapt generic internal context with explicit role-bearing conversion
- split current internal-context classification from legacy `<goal_context>`
  artifact classification
- add durable facts revision, pending cadence intent, and committed cadence
  record storage

This slice may introduce infrastructure, but it must not leave active Goal
producers half-converted.

### 02 Atomic Behavior Switch

Switch the active behavior path:

- add final request input finalizer inside the retry loop
- commit cadence on `ResponseEvent::Created`
- add fallible/idempotent Goal cadence commit and exact `response_item_json`
  recording
- replace concrete pre-finalizer Goal injection with turn-local cadence
  metadata
- convert core, app-server, and reachable extension producers to generic
  developer-role internal context
- remove or hard-map active steering role configuration

This slice is atomic. After it lands, no active Goal steering producer may
remain on `GoalContext`, `GoalContextRole`, active `<goal_context>` emission,
or user-role Goal steering.

### 03 Resume And Idle Lifecycle

Wire lifecycle behavior against the new cadence model:

- make resume hydration-only
- seed accounting and automatic Continuation suppression from durable
  state/records
- make pending non-Goal work outrank Goal-owned synthetic turns
- deliver pending durable cadence intent from idle hooks before automatic
  Continuation
- add automatic Continuation candidate key and watermark behavior

### 04 Repair Projection And Tests

Finish seams and coverage:

- implement request-local repair and structured reconstruction boundaries
- update event mapping, compaction, rollout reconstruction, history, and
  app-server projections
- keep raw response item notifications raw
- add replacement final-payload, cadence, resume/idle, repair, legacy, and UI
  behavior tests

## Global Implementation Decisions

Use `durable_facts_version` for Goal facts revisions. Do not rely on
`thread_goals.updated_at_ms` for cadence freshness because same-millisecond
mutations can collide.

Use persisted pending cadence intent for Initial, ObjectiveUpdated, and
BudgetLimit. Continuation is not persisted pending intent; it is selected by
the idle lifecycle predicate and suppressed by runtime accounting.

Use committed steering records for delivered cadence metadata. Records must
store exact serialized `ResponseItem` material for reconstruction; they are
not merely duplicate-suppression metadata.

Use a distinct `model_visible_history_key`. The current
`ContextManager::history_version()` is a rewrite counter and is not sufficient
as the automatic Continuation suppression key.

Use generic role-bearing internal context for active Goal steering. The
expected logical shape is:

```text
InternalModelContextFragment(source = "goal", rendered_goal_prompt)
  -> explicit role-bearing conversion
  -> ResponseItem::Message { role: "developer", ... }
```

Do not use `GoalContext`, `GoalContextRole`, active `<goal_context>`, user-role
Goal steering, or `ContextualUserFragment::into(...)` for active Goal
authority.

## Later Implementation Validation Profile

After Rust edits, run `just fmt` from `codex-rs`.

Use focused checks, for example:

- `cargo test -p codex-state pending_goal_steering`
- `cargo test -p codex-core initial_goal_steering`
- `cargo test -p codex-core objective_updated_goal_steering`
- `cargo test -p codex-core budget_limit_goal_steering`
- `cargo test -p codex-core idle_goal_continuation`
- `cargo test -p codex-app-server thread_goal_set`
- `cargo test -p codex-tui goal_status_indicator`

Snapshot workflow for implementation:

- run the focused snapshot-producing test
- inspect pending `*.snap.new`
- accept only intended snapshots with `cargo insta accept -p codex-tui`

Do not run broad Rust suites during planning or slice implementation unless the
user explicitly asks for that broader validation.
