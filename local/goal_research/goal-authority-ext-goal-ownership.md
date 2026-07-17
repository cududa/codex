# Goal Authority `ext/goal` Ownership

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative.

- Role: ownership seam for the `ext/goal` crate during the Goal authority
  rewrite.
- Owns: what extension code may own, the selected v136 adapter/runtime route,
  app-server/core mutation ordering, blocker-only facade conditions,
  metadata-only same-turn delivery, configuration treatment, reachability rule,
  file-specific work areas, and extension-focused tests.
- Does not own: the final model-input authority seam, active `ResponseItem` or
  `ResponseInputItem` construction, model role selection, pending-intent
  consumption, or Continuation watermark updates.
- Read after: `goal-authority-final-request-input-and-commit.md`.
- Read with: `goal-authority-fake-shim-removal-map.md`.
- Current terrain anchors: `codex-rs/ext/goal/src/extension.rs`,
  `codex-rs/ext/goal/src/runtime.rs`, `codex-rs/ext/goal/src/steering.rs`,
  `codex-rs/core/src/codex_thread.rs`,
  `codex-rs/core/src/session/input_queue.rs`, and
  `codex-rs/core/src/state/turn.rs`.
- Fidelity note: extension lifecycle ownership must not become model-input
  authority ownership.

## Purpose

This document defines how `codex-rs/ext/goal` fits into the Goal authority
rewrite.

The decision is simple:

```text
`ext/goal` may own extension lifecycle, tools, accounting, metrics, and
mutation entry points.

`ext/goal` must not own active Goal steering construction or final request
input authority.
```

If `ext/goal` remains compiled and reachable as an active Goal producer, it
must route Goal steering intent through the shared final request-input shaping
path.

The selected v136 route is adapter/runtime conversion by default. The existing
`GoalExtension` / `GoalRuntimeHandle` topology remains the conversion shape for
extension-owned tools, lifecycle, accounting, metrics, events, mutation entry
points, durable state calls, and typed cadence/wake requests. App-server Goal
mutation stays on its product processor path and may use cadence-aware state
APIs plus public core metadata/wake adapters. App-server code is not required
to depend on `codex-goal-extension`.

Full v139/v140 `GoalService` adoption is not the v136 default. A thin facade is
blocker-triggered only. It may be introduced only if adapter/runtime conversion
plus durable state, final request-input shaping/commit, and idle
metadata-delivery seams cannot carry shared app-server/tool/extension mutation
ordering without duplicating non-trivial prepare/account/persist/event outcome
logic or losing coherent mutation outcome data. Even then, the facade may
return durable facts, previous/current facts, pending-intent summaries, runtime
effects, event facts, and typed cadence/wake requests only. It must not return
active `ResponseItem` or `ResponseInputItem` values, choose active model role,
consume pending intent, advance Continuation suppression, or write recorded
request evidence.

This is an authority boundary, not a ban on typed extension participation.
`ext/goal` may expose durable Goal facts, pending cadence intent summaries,
runtime accounting effects, prompt-body helpers, or typed delivery requests to
the shared final request-input shaping path. It must not turn those facts into
model-visible `ResponseItem` / `ResponseInputItem` values, choose the model
role, consume pending intent, or commit delivery before the final request-input
path sees the actual per-attempt `Prompt.input`.

Typed delivery does not mean `ext/goal` imports or names private cadence or
final request-input implementation types. The extension-facing seam is a
producer-facing adapter that carries mutation facts or cadence request metadata
across to the owners of durable state, idle lifecycle, and final request-input
shaping.

Extension-origin Goal creation remains a valid mutation entry point. An
agent-callable `create_goal` tool may stay extension-owned; when no Goal
currently exists, a successful create writes an active durable Goal plus
pending Initial intent. If a Goal already exists, duplicate create remains a
product error. This is Goal mutation, not active steering construction, and it
does not give `ext/goal` authority to construct model input.

## Code Terrain

Current local terrain:

- `codex-rs/ext/goal/src/extension.rs`
  - installs Goal thread, turn, token usage, tool lifecycle, and tool
    contributors
  - stores `GoalExtensionConfig { enabled, steering_role }`
  - passes `GoalContextRole` into runtime steering
- `codex-rs/ext/goal/src/runtime.rs`
  - applies external Goal mutation effects
  - accounts active and idle Goal progress
  - calls `inject_active_turn_goal_steering`
  - injects prebuilt Goal `ResponseInputItem`s into the active turn through
    `ThreadManager`
- `codex-rs/ext/goal/src/steering.rs`
  - builds BudgetLimit and ObjectiveUpdated steering
  - currently constructs `GoalContext`
  - returns concrete `ResponseInputItem`
- `codex-rs/core/src/codex_thread.rs`
  - exposes `inject_goal_steering_items_into_active_turn`
  - forwards items into session Goal injection and current-turn carry
- `codex-rs/core/src/session/input_queue.rs`
  - accepts concrete Goal `ResponseInputItem`s before final request shaping
- `codex-rs/core/src/state/turn.rs`
  - stores current-turn Goal carry as concrete `ResponseInputItem`s

The local path is active steering terrain, not harmless dead code.

## Upstream v136 Shape

The local `rust-v0.136.0` tag shows upstream moved `ext/goal` toward generic
internal context:

- `codex-rs/ext/goal/src/steering.rs` builds
  `InternalModelContextFragment::new(InternalContextSource::from_static("goal"), prompt)`
- it then calls `ContextualUserFragment::into(...)`
- `InternalModelContextFragment::role()` is `"user"`

That upstream shape is useful as rendering/classification direction, but it is
not acceptable as active Goal authority in this fork. A user-role internal
context item is still user-role model input.

The replacement must keep the useful direction:

```text
source-tagged internal Goal text
strict pure-item classification
extension lifecycle ownership where useful
```

and reject the authority error:

```text
active Goal steering produced as user-role helper output
```

## Ownership Decision

`ext/goal` may own:

- tool registration
- Goal tool execution entry points when Goal tools are extension-owned,
  including `create_goal` for creating an active Goal when no Goal currently
  exists
- external mutation observation
- active and idle usage accounting
- metrics and event emission
- calls into durable Goal state APIs
- calls that request cadence intent
- typed data or prompt-body helpers consumed by the shared final request-input
  shaping path

`ext/goal` must not own:

- `ResponseItem` or `ResponseInputItem` construction for active Goal steering
- model role selection for active Goal steering
- `GoalContext`, `GoalContextRole`, or `<goal_context>` active emission
- active-turn injection of prebuilt Goal steering items
- current-turn carry of concrete Goal model input
- pending-intent consumption
- Continuation watermark updates
- final request-input cleanup or repair decisions

Active Goal authority remains owned by the final request-input shaping path
defined in `goal-authority-final-request-input-and-commit.md`.

In the current architecture, that path lives in core request assembly because
only the sampling path sees the exact per-attempt `Vec<ResponseItem>` that
becomes `Prompt.input`. Moving Goal lifecycle or mutation ownership into an
extension must not move final model-input authority out of that request
assembly seam unless a later authority update defines an equivalent seam with
the same final-input proof.

## Required Replacement Shape

For the selected v136 route, replace reachable app-server and `ext/goal` active
steering production with structured cadence requests and durable mutation
outcomes.

This is conversion, not removal, for extension-owned Goal mutation entry
points. In particular, `create_goal` remains allowed to create the active
durable Goal when no Goal exists; the replacement is that it writes pending
Initial intent and lets final request-input shaping deliver the Initial item.

Logical replacement:

```text
app-server or extension mutation/accounting
  -> persist durable Goal facts and pending cadence intent
  -> request metadata-only cadence delivery or wake/recheck when useful
  -> final request-input shaping selects due intent
  -> final request input contains exactly one developer-role Goal ResponseItem
  -> commit consumes pending intent or advances Continuation suppression
```

For same-turn behavior, `ext/goal` may request that the active turn be woken or
rechecked. It must not inject a prebuilt Goal item into the active turn.

Acceptable API direction:

```text
request_goal_cadence_delivery(thread_id, kind, goal_id, facts_version)
```

or an equivalent typed request that carries cadence intent metadata, not model
input.

That request is an adapter seam for producers. It must not expose private
cadence or final request-input internals to `ext/goal`, and it must not let
producers pass rendered Goal text, a model role, a prebuilt `ResponseItem`, or
a prebuilt `ResponseInputItem`.

Same-turn delivery has three logical outcomes:

- `AcceptedForActiveTurn`: the active turn accepted metadata-only recheck or
  wake state. The pending intent remains pending until final request-input
  shaping includes the matching developer-role Goal item and the commit point
  is reached.
- `NoActiveTurn`: no active turn can accept metadata. This is not loss; pending
  intent remains for an ordinary future turn or idle Stage 2 delivery.
- `ActiveTurnCannotAccept`: an active turn exists but cannot accept new cadence
  metadata. This is not loss; pending intent remains for an ordinary future
  turn or idle Stage 2 delivery.

Accepted metadata may cause another sampling opportunity, but it is not
pending model input, mailbox input, rendered Goal text, a `ResponseItem`, a
`ResponseInputItem`, a pending Continuation intent, or authority proof. The
final request-input shaper still re-reads durable state and may select a
superseding pending kind before any model request is submitted.

## Configuration

User-role active Goal steering must not survive as compatibility.

Local config that currently influences `GoalContextRole` must be removed,
rejected, or hard-mapped to developer-role active behavior. If a config key is
kept temporarily for deserialization compatibility, it must not affect active
Goal steering role. Active Goal authority remains developer-role and cannot be
made user-role by extension config, app-server config, or a compatibility
`goals.steering_role` value.

Every config entry point that can still select a Goal steering role must be
removed, rejected, or hard-mapped so converted app-server and extension
producers cannot affect active steering role.

## Reachability Rule

A completed implementation must satisfy one of these outcomes:

1. `ext/goal` active steering is reachable and converted to shared final
   request-input shaping.
2. `ext/goal` active steering is removed.
3. `ext/goal` active steering is proven unreachable under every supported
   configuration, with tests or compile-time structure supporting that claim.

It is not acceptable to leave a compiled reachable extension path that can
emit:

- `GoalContext`
- `GoalContextRole`
- `<goal_context>`
- user-role active Goal internal context
- pre-shaper concrete Goal `ResponseInputItem`s

## File-Specific Work Areas

`codex-rs/ext/goal/src/steering.rs`:

- keep prompt rendering helpers if ownership remains useful
- stop returning `ResponseInputItem` or `ResponseItem` for active steering
- return rendered prompt text or structured cadence payload only if needed by
  shared final request-input shaping

`codex-rs/ext/goal/src/runtime.rs`:

- keep accounting and mutation observation
- replace `inject_active_turn_goal_steering` with durable pending intent and
  cadence delivery request behavior
- do not call `ThreadManager` to inject Goal model input

`codex-rs/ext/goal/src/extension.rs`:

- remove `GoalContextRole` from extension config as active behavior
- keep enablement and tool availability behavior
- update TODOs that still describe role-neutral `<goal_context>` wrapping or
  host-applied steering role as the future shape

`codex-rs/app-server/src/request_processors/thread_goal_processor.rs`:

- keep product request, response, and ordered notification behavior on the
  app-server processor path
- use cadence-aware durable state operations and the returned mutation outcome
  as the source of pending-cadence metadata
- request metadata-only same-turn cadence delivery or idle recheck when the
  returned outcome says Initial, ObjectiveUpdated, or BudgetLimit may be due
- do not depend mandatorily on `codex-goal-extension`
- do not construct active model input, choose active model role, consume
  pending intent, advance Continuation suppression, or write recorded request
  evidence

`codex-rs/core/src/codex_thread.rs`:

- remove or narrow `inject_goal_steering_items_into_active_turn`
- any replacement API must accept structured cadence intent metadata or wake
  requests, return outcomes equivalent to `AcceptedForActiveTurn`,
  `NoActiveTurn`, and `ActiveTurnCannotAccept`, and reject concrete active Goal
  model input

`codex-rs/core/src/session/input_queue.rs` and
`codex-rs/core/src/state/turn.rs`:

- remove Goal-specific concrete item injection/carry as active authority
- replace current-turn carry with committed metadata for an item already
  included in final request input

## Tests

Focused tests must prove:

- `create_goal` from `ext/goal` remains a valid agent-callable mutation path
  when no Goal exists and writes pending Initial intent on success
- no reachable `ext/goal` path emits `<goal_context>`
- no reachable `ext/goal` path emits user-role active Goal steering
- no reachable `ext/goal` path injects concrete Goal `ResponseInputItem`s into
  pending input as authority
- ObjectiveUpdated from `ext/goal` persists durable facts and pending cadence
  intent before delivery
- BudgetLimit from `ext/goal` persists usage/status facts and pending cadence
  intent before delivery
- same-turn extension mutation cannot drop pending ObjectiveUpdated or
  BudgetLimit intent when same-turn cadence recheck/request metadata is
  unavailable or rejected
- extension state/runtime tests alone do not establish active Goal authority;
  final request payload coverage must inspect captured final `/responses`
  input or the equivalent final request-input seam
- final request payload tests for extension-origin scenarios must either drive
  a real extension producer through a core request path, or pair extension
  durable-state/runtime coverage with shared request-shaper coverage from
  equivalent pending intent. The latter is shared-shaper coverage, not
  end-to-end extension-origin payload coverage.
- if the true extension-origin route is not selected, extension tests must
  prove durable pending intent, accounting, events, and metadata request
  outcomes while app-server/core tests prove the shared shaper's final payload
  from equivalent pending intent
- final request payload coverage shows extension-origin Goal steering has the
  same developer-role final `ResponseItem` shape as core-origin steering
- compatibility config cannot make active Goal steering user-role
