# Goal Extension Lifecycle And Reachability

## Navigation Header

This successor doc is the extension and app-server lifecycle contract for Goal
mutation producers. It answers how extension-owned tools, accounting, events,
configuration, and app-server mutation paths route into shared Goal authority
without owning active model input.

- Role: canonical extension/app-server lifecycle, producer metadata, and
  reachability contract.
- Owns: `ext/goal` lifecycle; Goal tool registration and execution entry
  points; extension and app-server mutation entry points; active/idle usage
  accounting participation; metrics and event emission; adapter/runtime
  conversion; typed cadence/wake request metadata; app-server/core mutation
  ordering; steering-role configuration compatibility; and reachability
  classification for extension active producers.
- Does not own: active Goal authority, cadence event semantics, durable
  storage schema, active `ResponseItem` or `ResponseInputItem` construction,
  model role selection, final request-input shaping, final cleanup or repair
  decisions, pending-intent consumption, Continuation suppression advancement,
  recorded request evidence writes, fake-shim demolition outside extension
  reachability, or the replacement test matrix.
- Primary pointers: `goal-durable-state-and-pending-intent.md` for producer
  state mutations, `goal-cadence-contract.md` and
  `goal-idle-history-lifecycle.md` for wake/routing semantics, and
  `goal-final-request-input.md` for active model input and commit.
- Fidelity note: extension lifecycle ownership is not model-input authority.
  App-server and extension producers may create facts and request delivery;
  the shared final request-input path proves active Goal authority.

## Core Rule

Extension and app-server Goal producers may create or mutate durable Goal
facts, account usage, emit metrics and events, expose product or tool entry
points, call cadence-aware durable state APIs, and request metadata-only wake
or recheck behavior.

They must not:

- construct active `ResponseItem` or `ResponseInputItem` values
- choose the active model role
- consume pending Initial, ObjectiveUpdated, or BudgetLimit intent
- advance automatic Continuation suppression
- write structured recorded request evidence
- prove that active Goal authority reached final model request input
- preserve pre-finalizer concrete Goal input as carry or compatibility state

Active Goal authority remains the final model request input containing exactly
one selected current Goal item as an outer developer-role model item. Durable
state owns facts and pending intent. Cadence owns when Goal steering is due.
Idle/history owns scheduling, wake ordering, and Continuation suppression
semantics. Final request input owns active shaping and commit.

## Selected Route

For the v136 rewrite route, extension participation uses adapter/runtime
conversion by default.

The existing extension lifecycle and runtime topology may remain for
extension-owned responsibilities:

- tool registration and execution
- Goal mutation entry points
- accounting entry points
- metrics and event emission
- durable state calls
- typed cadence or wake request metadata
- small prompt-body helpers when they do not construct active model input

Full v139/v140 `GoalService` adoption is not selected for v136.

A thin facade is allowed only if implementation work proves that
adapter/runtime conversion plus durable, final-input, and idle metadata routes
cannot carry shared app-server/tool/extension mutation ordering without
duplicating non-trivial prepare, account, persist, event, or outcome logic, or
without losing coherent mutation outcome data.

If introduced, the facade may return only metadata and facts:

- durable Goal facts
- previous/current fact summaries
- pending-intent summaries
- accounting or runtime effects
- event facts
- typed cadence or wake request metadata

It must not return active `ResponseItem` or `ResponseInputItem` values, choose
model roles, consume pending intent, advance suppression records, write
evidence, or prove authority.

App-server Goal mutation remains on the product processor path. App-server
code may use cadence-aware state APIs and public core metadata/wake adapters.
It must not be required to depend on `codex-goal-extension` to mutate Goals or
request cadence delivery.

## Extension-Owned Lifecycle

Extension-owned code may retain:

- Goal tool registration and execution
- extension-origin `create_goal` when no Goal currently exists
- external Goal mutation observation and validation
- active and idle usage accounting participation
- metrics and event emission
- adapter/runtime conversion for extension data
- calls into durable Goal state APIs
- producer-facing same-turn or idle wake metadata
- prompt-body helpers consumed by shared final request-input shaping, if those
  helpers remain data-only and do not construct active input

Extension-origin `create_goal` is a valid mutation entry point only when no
Goal exists. A successful create writes active durable Goal facts and pending
Initial intent. Duplicate create remains a product error; it is not a second
Initial, a local steering shortcut, or extension-owned active authority.

Objective updates, budget/status accounting, and other extension-origin
mutations that create cadence work must persist durable facts and pending
Initial, ObjectiveUpdated, or BudgetLimit intent before any delivery is
requested. Producer request bodies, tool outputs, UI projections, extension
runtime state, and rendered helper text are not the steering source; current
steering renders from durable facts when final request-input shaping selects a
due item.

## Mutation And Delivery Pipeline

External Goal mutation must follow this logical pipeline:

```text
app-server or extension mutation/accounting
  -> persist durable facts and pending intent when due
  -> request metadata-only same-turn recheck, idle wake, or cadence delivery
  -> final request-input shaping selects due intent or idle Continuation
  -> final input contains exactly one developer-role Goal item when due
  -> Created-event commit consumes exact pending intent or advances
     Continuation suppression
```

Same-turn metadata is metadata and wake behavior only. A logical request may
look like:

```text
request_goal_cadence_delivery(thread_id, kind, goal_id, facts_version)
```

The exact API name is implementation work. The contract is that producer
metadata may carry Goal identity, kind, facts version, source, reservation, or
wake intent. It must not carry rendered Goal text, an active model role,
prebuilt model input, private finalizer implementation types, pending
Continuation intent, committed carry, recorded evidence, or authority proof.

The logical outcomes are:

- `AcceptedForActiveTurn`: the active turn accepted metadata-only recheck or
  wake state.
- `NoActiveTurn`: no active turn can accept metadata.
- `ActiveTurnCannotAccept`: an active turn exists but cannot accept new
  cadence metadata.

`AcceptedForActiveTurn` does not consume pending intent. Pending intent is
consumed only when that active turn's final request input contains the
matching outer developer-role Goal item and reaches Created-event commit.

`NoActiveTurn` and `ActiveTurnCannotAccept` are not delivery loss.
ObjectiveUpdated and BudgetLimit intent remain pending for a later ordinary
turn or idle cadence-delivery turn. Final request-input shaping re-reads
durable state and may select a superseding kind according to cadence ranking.

## App-Server And Core Mutation Ordering

App-server Goal mutation should remain product-owned and ordered with product
responses and notifications. The logical order is:

```text
account in-flight Goal usage if needed
persist durable Goal mutation
persist pending cadence intent when the mutation creates cadence work
emit product response and notifications in the owning product order
request metadata-only same-turn recheck or idle wake when applicable
```

The product processor path may receive durable mutation outcomes, pending
summaries, accounting outcomes, event facts, and wake metadata. It must not
receive or pass concrete active model input as the mutation result.

Core thread or turn APIs that accept producer wake requests should accept
structured metadata and return structured outcomes equivalent to
`AcceptedForActiveTurn`, `NoActiveTurn`, or `ActiveTurnCannotAccept`. They
must reject or avoid interfaces that let producers pass rendered Goal text,
active role selection, or prebuilt `ResponseItem`/`ResponseInputItem` values.

Pending non-Goal work still outranks Goal-owned synthetic work after external
mutation. The idle/history lifecycle owns the stage order after mutation
persistence and wake requests.

## Configuration Compatibility

User-role active Goal steering has no compatibility exception.

Any existing `GoalContextRole`, `steering_role`, or equivalent configuration
that can affect active Goal steering role must be removed, rejected, or
hard-mapped so active Goal authority remains developer-role. Temporary
deserialization for old configuration files may exist only when it cannot
affect active model input, final request-input role, extension helper output,
or active steering reachability.

Configuration cleanup must not preserve user-role active Goal steering under
extension compatibility wording. Objective-limit or product validation
configuration is separate; it must not depend on a steering-role option to
remain valid.

## Reachability Rule

A completed implementation must classify every extension active steering
producer into one of three outcomes:

```text
converted to shared final request-input shaping
removed
proven unreachable under every supported configuration
```

It is not acceptable to leave a compiled reachable path that emits or accepts
any of these as active Goal steering:

- `GoalContext`
- `GoalContextRole`
- active `<goal_context>`
- user-role active Goal internal context
- pre-shaper concrete `ResponseItem` values
- pre-shaper concrete `ResponseInputItem` values
- source-tagged helper output treated as authority

Proving reachability requires config and compile-time structure plus tests or
reviewable assertions sufficient to show that supported configurations cannot
activate the old path. A path that is merely believed unused is not proven
unreachable.

Fake-shim demolition remains separate transitional terrain. This doc owns only
the extension-local conversion, removal, or unreachable outcome, plus the
local warning that extension baseline tests must not keep fake-shim active
steering alive.

## Implementation Terrain To Audit

Future implementation planning should audit extension and app-server terrain
without turning file names into authority:

- extension steering and runtime code that currently creates role-bearing
  Goal-looking input
- extension configuration or TODOs that describe role-neutral
  `<goal_context>` wrapping or host-applied steering role as the future shape
- core thread, input queue, and turn-state adapters that can carry concrete
  Goal items before final request-input shaping
- app-server Goal mutation processors and notification ordering
- durable state calls shared by app-server, extension, core mutation, idle,
  and final-input commit paths
- tests that preserve extension `GoalContext`, active `<goal_context>`,
  user-role active steering, or pre-finalizer concrete input

These anchors are routing for later execution planning. The authority rule is
the ownership split in this doc and the referenced behavior, durable,
cadence, idle/history, final-input, evidence, cleanup, and test-prep
successors.

## Primary Pointers

- `goal-authority-behavior.md` owns why extension output, helper text,
  provenance, tools, projection, durable state alone, and user-role steering
  do not prove authority.
- `goal-cadence-contract.md`, `goal-durable-state-and-pending-intent.md`, and
  `goal-idle-history-lifecycle.md` own cadence semantics, durable pending
  state, and wake ordering. This doc owns producer participation that creates
  durable cadence work and metadata-only wake requests.
- `goal-final-request-input.md` owns active shaping, selected item
  construction, final cleanup/repair effects, Created-event commit, exact
  consumption timing, suppression advancement, committed carry, and final
  payload proof. Extension and app-server producers route active authority
  there.
- Cleanup/projection and evidence docs own helper classification, projection,
  raw/history behavior, and evidence policy; extension/app-server producers do
  not write evidence or construct active model input.
- `goal-test-prep-and-replacement-proof.md` owns the replacement proof matrix;
  this doc keeps extension-local proof obligations and baseline caveats.

## Local Proof Obligations

Extension/app-server coverage must prove:

- extension-origin `create_goal` with no existing Goal writes durable active
  Goal facts and pending Initial intent
- duplicate extension-origin `create_goal` remains a product error and does
  not create duplicate pending Initial or active steering
- ObjectiveUpdated and BudgetLimit mutations persist durable facts and pending
  intent before any delivery request
- unavailable or rejected same-turn metadata leaves pending intent intact
- accepted same-turn metadata is not treated as delivery or consumption
- app-server mutation paths use durable operations and metadata-only wake or
  recheck requests without requiring a `codex-goal-extension` dependency
- core/thread producer APIs reject or avoid concrete active model input and
  accept only structured metadata
- no reachable extension path emits `GoalContext`, `GoalContextRole`, active
  `<goal_context>`, user-role active internal context, or pre-finalizer
  concrete `ResponseItem`/`ResponseInputItem` values as active authority
- configuration compatibility cannot make active Goal steering user-role
- extension tests do not preserve fake-shim active steering as baseline
- extension-origin final payload coverage either uses a true extension-origin
  integration through the real core request path, or pairs extension
  state/runtime coverage with shared request-shaper coverage for equivalent
  pending intent
- paired coverage is identified as paired coverage, not end-to-end
  extension-origin payload proof
- any true extension-origin final payload proof shows the same exact outer
  developer-role current Goal item shape required of core-origin steering

The test-prep successor doc owns how these obligations join the broader final
payload, durable state, idle/history, evidence, cleanup, UI, and snapshot
replacement matrix.
