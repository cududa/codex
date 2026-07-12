# Goal Authority Fake-Shim Removal Map

## Purpose

This document maps the existing Goal-only provenance shim so implementation
plans can remove the active shim and replace active steering with generic
role-bearing internal context deliberately.

The map is not an architecture to preserve. It is demolition terrain. Any
remaining `<goal_context>` behavior after this work is legacy artifact handling,
not an active Goal steering path.

The active target is:

```text
InternalModelContextFragment(source = "goal", rendered_goal_prompt)
  -> explicit role-bearing conversion
  -> ResponseItem::Message { role: "developer", ... }
```

The deleted active target is:

```text
GoalContext
  -> <goal_context>...</goal_context>
  -> GoalContextRole
  -> ResponseInputItem/ResponseItem role chosen by Goal-only code
```

## Active Shim Roots To Remove

### Core GoalContext Shim

File:

- `codex-rs/core/src/context/goal_context.rs`

Current responsibilities:

- owns `<goal_context>` and `</goal_context>` markers
- wraps rendered Goal prompt text
- defines `GoalContextRole::{User, Developer}`
- converts Goal prompt into a response input item
- detects pure Goal artifact messages through `is_goal_context_*`

Required deletion work:

- stop using `GoalContext` for active Goal steering
- stop using `GoalContextRole` as the active steering role abstraction
- move active internal-context rendering to generic internal-context infrastructure
- leave only legacy pure-artifact detection for old persisted items;
  do not leave a Goal-specific active-context abstraction behind

### Core Goal Steering Producer

File:

- `codex-rs/core/src/goals.rs`

Current responsibilities:

- `GoalSteeringMessage` owns `kind`, configured role, and rendered prompt
- `GoalSteeringMessage::into_response_input_item` delegates to `GoalContext`
- Initial and Continuation steering create active `<goal_context>` items
- ObjectiveUpdated steering creates active `<goal_context>` items
- BudgetLimit steering creates active `<goal_context>` items

Required deletion work:

- leave cadence decisions and prompt rendering in Goal-specific code
- replace active `GoalContext` construction with generic internal-context item
  construction
- make active steering developer-role only
- remove, reject, or hard-map user-role active Goal steering configuration to
  developer-role behavior
- do not call legacy artifact matching from active Goal item construction

### Extension Goal Steering Producer

Files:

- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/core/src/codex_thread.rs`

Current responsibilities:

- extension steering frame also builds `GoalContext`
- extension runtime injects Goal steering into the active turn
- core thread API routes extension Goal items into session Goal injection

Required deletion work:

- do not change extension ownership/timing except where the version plan
  explicitly uses `ext/goal`
- replace extension active GoalContext construction with the same generic
  role-bearing internal-context builder used by core
- do not let extension Goal steering call a user-role
  `ContextualUserFragment` conversion for active Goal authority

Scope clarification:

- if an extension path remains compiled and reachable as an active Goal
  steering producer under any supported configuration, it must be converted in
  the same completed implementation
- if a version plan does not use `ext/goal`, it may leave unrelated extension
  ownership/timing untouched, but it must either convert, remove, or prove
  unreachable any extension path that would otherwise emit active Goal steering
  through `GoalContext`

## Shim-Dependent Consumers To Replace Carefully

Removing the active shim includes updating these consumers. They currently call
or depend on `is_goal_context_*` behavior, so the removal work must replace that
active dependency with:

- a generic current-internal-context predicate for the new active Goal shape
- a legacy pure-artifact predicate for old persisted `<goal_context>` artifacts

This is not a staged permission to preserve the shim. The consumer replacement
is part of removing the active shim.

### Event And UI Hiding

Files:

- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- app-server typed/materialized turn projection surfaces where applicable

Current dependency:

- Goal artifact text is hidden from typed/materialized user-visible turn items
  or classified as contextual content

Required replacement:

- hide current `<codex_internal_context source="goal">` active frames
- continue hiding pure legacy `<goal_context>` artifacts from typed/materialized
  user-visible turn projections
- do not add special Goal suppression to raw response item notifications; raw
  response item streams should remain raw unless a version plan explicitly
  changes the general raw-response contract
- do not hide mixed ordinary user/developer prose merely because it contains a
  marker-like string

Implementation pitfall:

- deleting `is_goal_context_*` callsites without replacing their artifact
  classification can expose Goal steering in typed UI or app-server projections
- carrying forward local-only raw-response suppression would preserve fake-shim
  behavior instead of removing the active shim

### Compaction

Files:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- related compact tests

Current dependency:

- pure Goal context artifacts are filtered or reinserted through current-turn
  carry paths

Required replacement:

- filter pure legacy `<goal_context>` artifacts from reconstructed history
- filter pure current Goal internal-context artifacts when they are stale
  historical items
- do not treat filtering as model authority delivery
- maintain or repair cadence-required current authority only according to the
  primary cadence contract

Implementation pitfall:

- mid-turn compaction has historically used current-turn Goal carry to carry
  active steering across compaction. Under the cadence contract, carry is
  turn-local evidence for preserving a cadence item already included in final
  model request input. It must
  not be converted into new durable Goal facts or new structured pending
  cadence intent. A version plan must decide only whether a given compaction
  seam is preserving an already included cadence item or applying request-local
  repair.

### Rollout Reconstruction

Files:

- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`

Current dependency:

- pure Goal artifacts are removed from reconstructed history
- mixed messages are retained

Required replacement:

- retain cleanup behavior for pure legacy artifacts
- add pure current internal-context Goal artifact cleanup
- retain mixed-content retention
- never reconstruct active Goal state by parsing a rendered artifact

Implementation pitfall:

- removing legacy artifact classification entirely can make old
  `<goal_context>` items look like ordinary user/developer prose in
  reconstructed history

### History And User-Turn Boundaries

Files:

- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`

Current dependency:

- current behavior treats Goal-context user-role items as not ordinary user turn
  boundaries
- mixed contextual developer bundles have special rollback/reference-context
  handling

Required replacement:

- current Goal internal-context items must not become visible user-turn
  markers
- legacy `<goal_context>` artifacts must remain non-user cleanup
  artifacts
- ordinary user messages must still count normally

Implementation pitfall:

- a generic internal-context predicate that is too broad can erase real user
  messages; one that is too narrow can leave stale Goal authority as user prose

### Contextual Fragment Infrastructure

Files:

- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/fragment.rs`
- upstream/version-equivalent `internal_model_context.rs`

Current dependency:

- contextual fragments provide a rendering and matching pattern
- upstream v136 internal context exists, but its conversion path may still be
  user-role

Required replacement:

- add or adapt a generic internal-context abstraction that supports explicit
  model role selection
- source validation and pure-artifact parsing must live in generic
  infrastructure
- do not solve Goal authority with a Goal-specific helper that bypasses the
  generic abstraction

Implementation pitfall:

- `source = "goal"` is provenance, not authority. A user-role internal context
  remains user-role model input.

## What To Remove

Remove as active Goal steering machinery:

- `<goal_context>` active emission
- `GoalContext` active construction
- `GoalContextRole` active role selection
- `GoalSteeringMessage::into_response_input_item` paths that delegate to
  `GoalContext`
- extension active steering paths that delegate to `GoalContext`
- user-role active Goal steering behavior
- request-time recovery of Goal state from rendered artifact text

## Required Legacy Artifact Handling

After active shim removal, the only remaining `<goal_context>` behavior is
legacy artifact handling:

- pure `<goal_context>` detection
- typed UI/app-server projection hiding of old Goal artifacts
- compaction and rollout reconstruction cleanup of old pure Goal artifacts
- tests proving mixed content is not dropped

This legacy path must not:

- construct new active Goal steering
- infer current objective text
- infer active Goal state
- decide cadence
- keep user-role steering alive

## What To Replace With

Introduce or adapt a generic role-bearing internal-context API.

Expected responsibilities:

```text
InternalContextSource
  validates and renders source names such as "goal"

InternalModelContextFragment
  owns internal-context rendering:
  <codex_internal_context source="goal">...</codex_internal_context>

InternalModelContextRole
  owns the outer model role, especially Developer

into_response_item(role)
  produces the ResponseItem with explicit outer model role
```

Goal-specific code must own:

- cadence decision
- durable Goal state lookup
- steering kind selection
- prompt rendering
- objective escaping

Generic internal-context code must own:

- source validation
- internal-context rendering
- pure internal-context detection
- role-bearing conversion

## Required Work Areas

These work areas are not permission to land a half-converted active Goal path.
A version plan can sequence the work internally for reviewability, but an
completed implementation must not leave any active Goal steering producer on
`GoalContext` or any active Goal authority decision on `<goal_context>`.
This includes extension producers that remain compiled and reachable under any
supported configuration.

### Work Area 1: Generic Internal Context

Add or adapt the generic internal-context module so it can produce developer-role
response items explicitly.

Tests must prove:

- source validation accepts `goal`
- malformed source values are rejected
- developer-role conversion produces developer-role model input
- user-role conversion is not used by active Goal steering

### Work Area 2: Predicates And Legacy Handling

Create shared predicates for:

- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts
- mixed content that must not be treated as a pure artifact

Tests must cover:

- current Goal internal context hidden/classified correctly
- legacy Goal context hidden/classified correctly
- non-Goal internal context is not treated as Goal
- mixed visible text is preserved

### Work Area 3: Active Core Steering

Move core Goal steering producers from `GoalContext` to generic
role-bearing internal context.

Tests must prove:

- Initial, Continuation, ObjectiveUpdated, and BudgetLimit active steering use
  developer role
- active steering uses `<codex_internal_context source="goal">`
- active steering no longer emits `<goal_context>`

### Work Area 4: Extension Steering

Move `ext/goal` steering producers to the same generic role-bearing path when a
version plan makes extension steering production active.

Tests must prove extension-produced Goal steering has the same final model
request input shape as core-produced steering.

### Work Area 5: Cleanup Consumers

Update event mapping, compaction, rollout reconstruction, history boundaries,
and typed/materialized app-server projections to use shared predicates.

Tests must prove:

- current Goal internal context is hidden from typed UI/projections
- legacy Goal context is still hidden from typed UI/projections
- raw response item notifications are not specially suppressed for Goal context
- stale pure Goal artifacts are cleaned up
- ordinary user/developer prose is retained

## Integration With Cadence Contract

This removal map does not decide when Goal speaks.

The cadence contract decides when active Goal steering is due.

This map decides how to delete the fake active GoalContext path from the active Goal path
and what consumers must be replaced so the active steering shape can become:

```text
generic internal context + explicit developer role
```

without regressing:

- UI hiding
- compaction cleanup
- rollout reconstruction cleanup
- user-turn handling
- legacy artifact compatibility
