# Goal Work Area Coordination Note

## Purpose

This is a coordination note for the v136 Goal work-area plans.

This note exists to keep implementation-pass splits from reopening those
decisions while still leaving real implementation and migration choices
visible to ensure work-area docs are properly aligned.

The v136 authority docs may be rewritten when this fork migrates to v139/v140.
The goal here is narrower:

```text
implement the v136 authority contracts
avoid v136 shapes that make the later ext/goal migration harder
do not require full v139/v140 platform topology before migrating
```

## Resolved Authority

The following points are already answered by `local/goal_research`. Work-area
docs should treat them as constraints, not open questions.

### Final Request Input Is The Authority Seam

The actual model-bound path is:

```text
run_sampling_request(...)
  -> build_prompt(input, ...)
  -> Prompt { input: Vec<ResponseItem> }
  -> build_responses_request(...)
  -> ResponsesApiRequest { input: Vec<ResponseItem> }
```

`ResponseItem::Message.role` is already the model role. There is no deeper
internal-context role layer that later composes, upgrades, or validates Goal
authority.

Active Goal authority exists only when the final request input contains exactly
one selected current Goal item as an outer developer-role `ResponseItem`.

### Internal Context Is Helper Infrastructure

Generic internal context may provide:

- source-tagged Goal text rendering
- provenance text such as `source = "goal"`
- strict pure-item classification
- legacy/current cleanup support

It is not an authority mechanism. A role-bearing helper, a `Developer` enum
variant, or a conversion function that can produce a developer-role item does
not prove Goal authority by itself.

### Pre-Request Items Are Not Authority

These are not authority and are not commits:

- rendered Goal text
- helper output
- `GoalContext`
- `GoalContextRole`
- `<goal_context>`
- `ContextualUserFragment::into(...)`
- concrete `ResponseInputItem` injection
- active-turn injection
- synthetic turn reservation
- current-turn carry
- classifier output
- durable active Goal state by itself

The request-input shaping path must inspect, remove, replace, or ignore
pre-existing Goal-looking items according to the authority contracts. That
includes old injected `ResponseInputItem`s and wrong-role current Goal
internal-context items.

### Commit Timing Is Resolved For v136

Commit metadata is inert until the request reaches model execution.

The v136 commit point is `ResponseEvent::Created` unless a code walk proves a
more precise local execution point. Pending Initial, ObjectiveUpdated, and
BudgetLimit intent is consumed only by that commit path for the exact selected
item. Automatic Continuation watermarking advances only through the committed
Continuation path.

### Classifiers And Repair Are Not Authority

Classifiers are cleanup and projection tools. They do not decide cadence,
prove authority, recover durable Goal state, consume pending intent, or advance
Continuation watermarks.

Repair is a request-local backstop at the final request-input shaping seam. It
must not become the mechanism that emits Goal steering for every ordinary
request with an active durable Goal.

## Terminology

Avoid using "finalizer" as a standalone architectural noun. In this work, the
safe concept is the final request-input shaping path.

Preferred terms:

- final request-input shaping path
- per-attempt request-input shaper
- request assembly authority seam
- inert commit metadata
- Created-event commit handler
- typed cadence request
- same-turn recheck or wake request

If a function name keeps `finalize_*`, read it as a narrow request-input
shaping function. Do not turn it into a broad Goal lifecycle service.

## v136 To v139/v140 Migration Posture

Upstream v139/v140 moves Goal ownership toward `ext/goal`:

- `ext/goal` grows a `GoalService` style owner.
- `ext/goal` owns tools, lifecycle, runtime accounting, metrics, analytics,
  event emission, and external mutation entry points.
- upstream removes `core/src/goals.rs`.

That ownership direction matters for v136 planning. v136 should not deepen
`core/src/goals.rs` into a long-lived Goal service, scheduler, or cadence
policy object.

At the same time, v136 should not blindly copy upstream's active steering
payload shape. Upstream v139/v140 still has `ext/goal` constructing concrete
model-input items and passing them through active-turn APIs. That is terrain,
not authority for this fork.

The migration-compatible v136 split is:

```text
ext/goal:
  lifecycle, tools, accounting, metrics, analytics, event emission,
  mutation entry points, prompt-body helpers if useful, typed cadence data

state:
  durable Goal facts, facts_version, pending Initial/ObjectiveUpdated/
  BudgetLimit intent, exact-key intent consumption, optional persisted
  Continuation watermark records

core request assembly:
  final request-input shaping, model-visible history key projection,
  developer-role Goal item construction, request-local repair, inert commit
  metadata, Created-event commit dispatch

core session/thread bridge:
  metadata-only active-turn recheck, metadata-only idle reservation/start,
  pending-work and mailbox arbitration
```

"Move toward `ext/goal`" does not mean `ext/goal` should own active
`ResponseItem` construction in v136. It means the v136 plan should avoid
creating new core ownership that fights the later migration.

For v136-specific `ext/goal` scope decisions, apply the language from
`goal-authority-ext-goal-ownership.md`: if `ext/goal` remains compiled and
reachable as an active Goal producer, it must be converted to shared final
request-input shaping, removed, or proven unreachable. Within that contract,
use upstream `rust-v0.136.0` as the topology baseline unless it directly
conflicts with the local authority model.

The upstream v136 `ext/goal` shape is adapter/runtime based, not
`GoalService` based:

- `GoalExtension` installs thread, config, turn, token-usage, tool-lifecycle,
  and tool contributors.
- `GoalRuntimeHandle` owns per-thread enablement, accounting state, runtime
  effects, state access, metrics/events, and active-turn injection helpers.
- extension tools and app/server-facing code interact through existing v136
  adapters and runtime hooks.
- there is no upstream v136 `ext/goal/src/api.rs` `GoalService` facade.

That means the default v136 migration-compatible posture is to convert the
reachable upstream-v136-shaped adapter/runtime path rather than introduce a new
v139/v140-style service solely for migration aesthetics. Keep the upstream v136
lifecycle/runtime/accounting topology where it remains useful, and replace the
authority-conflicting payload path.

The conflicting upstream v136 payload path is:

```text
ext/goal/src/steering.rs
  -> ContextualUserFragment::into(InternalModelContextFragment(source = "goal"))
  -> ResponseItem
  -> GoalRuntimeHandle::inject_active_turn_steering(...)
  -> core thread/session injection
```

For this fork, that path must be converted so `ext/goal` exposes durable Goal
facts, pending cadence intent summaries, runtime accounting effects,
prompt-body helpers, or typed delivery requests, but does not turn those facts
into model-visible `ResponseItem` / `ResponseInputItem` values. It should not
be replaced by a full v139/v140-style service unless a code-grounded pass
proves the upstream-v136-shaped adapter/runtime route cannot carry the v136
fix.

## Accepted v136 Placement Default

Use `codex-rs/core/src/goal_cadence/` as the private core module directory for
the final request-input shaping implementation. Do not grow a single
`goal_cadence.rs` file, and do not put the shaping implementation in
`core/src/goals.rs`.

The external interface should stay small. The central seam is equivalent to:

```rust
pub(crate) fn finalize_request_input(
    base_input: Vec<ResponseItem>,
    context: GoalRequestContext,
) -> GoalFinalizationOutcome;
```

The exact Rust names may change, but the caller-facing shape may not:

- `session/turn.rs` assembles a fresh `GoalRequestContext` for each model
  request attempt after that attempt's base input is known and before
  `build_prompt(...)`.
- `GoalRequestContext` receives a `codex_state::ThreadGoalCadenceSnapshot`,
  eligibility facts, turn id/thread id, optional turn request metadata, and
  repair context.
- `GoalRequestContext` does not receive `&Session`, `StateDbHandle`, or
  `TurnContext`.
- the shaper does not load durable state itself.
- `GoalFinalizationOutcome` must include a submit branch with finalized input
  and inert commit metadata, plus an internal abort-before-submit branch for
  stale Goal-owned synthetic turns.

The final selected Goal item is a model input item:

```text
ResponseItem::Message { role: "developer", ... }
```

Do not describe it as a "developer-role internal-context ResponseItem."
Source-tagged Goal text may be used inside the message body for provenance and
cleanup classification, but source tagging and internal-context rendering are
not the authority mechanism. Active Goal authority is established by the exact
final developer-role `ResponseItem` in the per-attempt model request input.

### Type Placement Default

`codex-state` owns durable types and operations:

- `ThreadGoalCadenceSnapshot`
- `ThreadGoalPendingIntent`
- `ThreadGoalPendingIntentKind`
- durable facts version
- exact-key pending intent consumption
- committed automatic Continuation suppression storage, if the implementation
  chooses a state table rather than structured rollout reconstruction

Committed automatic Continuation suppression storage is not persisted pending
Continuation intent. It records that a specific Continuation item reached the
commit point for `{ goal_id, model_visible_history_key, facts_version }`.
State may store and expose that record, but core cadence owns eligibility and
watermark advancement timing.

`core/src/goal_cadence/` owns private request-assembly types:

- `GoalCadenceKind`
- `GoalRequestContext`
- `GoalTurnRequest`
- `GoalPendingCadenceDelivery`
- `GoalAutomaticContinuationRequest`
- `FinalizedGoalRequestInput`
- `GoalRequestCommit`
- `GoalItemFingerprint`
- `GoalRepairReport`

`core/src/state/turn.rs` stores metadata only:

- `Option<GoalTurnRequest>` for same-turn recheck or Goal-owned synthetic turn
  intent
- committed carry metadata for a Goal item that already reached final request
  input and the commit point

It must not store rendered Goal prompt text or `ResponseInputItem` as Goal
authority.

`core/src/session/input_queue.rs` and `Session` are adapters for setting,
taking, and checking turn-local Goal metadata. Existing pending-input
mechanics do not automatically notice metadata-only rechecks; the turn loop or
session bridge must explicitly treat pending Goal metadata as a reason to run
another sampling opportunity when required.

`core/src/codex_thread.rs` is the public thread-facing adapter for extension
and app-server callers. Because `codex-goal-extension` depends on
`codex-core`, extension-callable request types must either be public from core
or be public state/protocol facts that `CodexThread` translates into private
`goal_cadence` metadata. Private `core::goal_cadence` types cannot be named by
`ext/goal`.

`core/src/goals.rs` remains v136 lifecycle terrain and a transitional adapter
only. Idle hooks, accounting glue, mutation reactions, and wake requests may
remain there temporarily, but final request shaping, active item construction,
commit metadata construction, and request-local repair do not belong there.

Prompt bodies should move out of `goals.rs` when practical, preferably into
`core/src/goal_cadence/prompt.rs` for v136. Prompt-body helpers return text
only. `goal_cadence` wraps selected text into the final developer-role
`ResponseItem`. Do not move prompt bodies to `ext/goal` unless a later
code-grounded migration pass proves the extension needs to own them
independently.

### Turn Request Vocabulary

Use one core vocabulary for metadata-only Goal turn requests:

```rust
pub(crate) enum GoalTurnRequest {
    SameTurnCadenceRecheck(GoalPendingCadenceDelivery),
    IdlePendingCadence(GoalPendingCadenceDelivery),
    IdleAutomaticContinuation(GoalAutomaticContinuationRequest),
}
```

Same-turn metadata is a request to re-run cadence selection from a fresh
durable snapshot. It is not a guarantee that the originally requested kind will
be delivered. If ObjectiveUpdated is requested and BudgetLimit becomes due
before the next attempt, final request-input shaping must choose by cadence
supersedence.

Same-turn acceptance must cause the current regular task to run another
sampling opportunity without adding pending model input. Idle variants mark
Goal-owned synthetic turns. If final request-input shaping rejects a synthetic
Goal-owned turn after recheck, abort before model submission, without
consuming pending intent, advancing Continuation suppression, or surfacing a
user-facing model error.

### `ext/goal` Default

Do not introduce a new crate or move shared types into `ext/goal` for v136.
There are not yet two real adapters for the final request-input shaping seam,
and the local dependency graph already has `codex-goal-extension` depending on
`codex-core`.

The default v136 migration-compatible path is adapter/runtime conversion:

- keep `GoalExtension` as the extension lifecycle contributor owner
- keep `GoalRuntimeHandle` as per-thread runtime/accounting/effects owner
- convert reachable active steering producers to durable pending intent plus
  metadata-only recheck or wake behavior
- stop constructing active model input in `ext/goal`
- defer a broad `GoalService` topology until the v139/v140 migration

A thin `ext/goal/src/api.rs` facade may be introduced only if a code-grounded
pass proves the adapter/runtime route cannot carry shared app-server,
extension, and tool mutation ordering. A full v139/v140-style service move in
v136 requires an explicit explanation of why the adapter/runtime default and a
thin facade are insufficient.

## Work Area Guidance

## Resolved Decisions To Integrate Into Work Areas

The items below were easy to mistake for open questions while splitting the
work-area docs. They are not open. They are durable decisions from
`local/goal_research` that the work-area and implementation-pass docs need to
carry explicitly so later agents do not rediscover or reopen them.

### Work Area 02 Must Carry

- Final request input is the active Goal authority seam.
- The request-input shaper runs per attempt before `build_prompt(...)`.
- The selected Goal item must be exactly one current outer developer-role
  `ResponseItem`.
- Generic internal-context helpers are rendering/provenance/classification
  infrastructure only.
- Prebuilt `ResponseInputItem`s, active-turn injection, reservation, helper
  output, and current-turn carry are not authority and are not commits.
- The request-input shaper must remove, replace, or ignore stale, duplicate,
  wrong-role, legacy, and pre-injected Goal-looking items.
- `GoalRequestCommit` is inert metadata tied to the exact final item.
- Commit happens at `ResponseEvent::Created` unless a code walk proves a more
  precise local execution point.
- Current-turn carry records committed metadata for an item already included in
  final request input; it does not carry pre-shaper model input.

### Work Area 03 Must Carry

- `model_visible_history_key` is already specified as a structured eligible
  progress projection, not `ContextManager::history_version()`.
- The key is captured in the request-input shaping path before inserting a new
  Continuation item.
- Goal cadence, repair, cleanup, pure current Goal internal-context items, and
  pure legacy `<goal_context>` artifacts are excluded from the key.
- Idle ordering is pending non-Goal work first, pending durable Goal cadence
  intent second, automatic Continuation last.
- Continuation is not persisted pending cadence intent.
- Continuation watermarking advances only after the Continuation item reaches
  final request input and the request reaches the commit point.
- The latest committed automatic Continuation suppression triple must be
  persisted or reconstructable from structured metadata without parsing
  rendered Goal text.
- Stale synthetic Goal-owned turns abort before model submission, without
  consuming pending intent, advancing watermarks, or surfacing as a user-facing
  model error.
- Resume is hydration: reload durable facts, pending intent, and Continuation
  suppression basis without fabricating Initial.

### Work Area 04 Must Carry

- `ext/goal` may own lifecycle, tools, accounting, metrics, mutation entry
  points, prompt-body helpers, durable state calls, pending intent summaries,
  runtime accounting effects, and typed delivery requests.
- `ext/goal` must not construct active `ResponseItem` / `ResponseInputItem`
  values, choose the active steering role, consume pending intent, advance
  Continuation watermarks, or commit delivery.
- If `ext/goal` remains compiled and reachable as an active Goal producer, that
  path must be converted to shared final request-input shaping, removed, or
  proven unreachable.
- Upstream v136 is the topology baseline for v136 `ext/goal` scope: adapter and
  runtime based, not `GoalService` based.
- The upstream-v136-shaped lifecycle/runtime/accounting topology may remain
  where useful; the authority-conflicting active steering payload path must be
  converted.
- Same-turn extension mutation failure must not drop ObjectiveUpdated or
  BudgetLimit pending intent.

### Work Area 05 Must Carry

- Classifiers are cleanup and projection tools, not cadence or authority
  checks.
- Whole-message purity is required before hiding, dropping, deduplicating, or
  classifying a Goal/internal-context item.
- Wrong-role current Goal items may be cleanup-classified but are not valid
  authority.
- Typed/materialized projections may hide pure current Goal internal-context
  items and pure legacy `<goal_context>` artifacts.
- Raw response item notifications remain raw unless the general raw-response
  contract changes.
- Compaction, rollback, fork, and reconstruction must not recover active Goal
  facts, pending intent, or objective text by parsing rendered artifacts.
- Legacy `<goal_context>` behavior remains artifact cleanup/hiding only.

### Work Area 02

Work Area 02 should implement the already-defined request assembly seam.

It should focus on:

- concrete module/function/type names for the request-input shaper
- wiring the shaper on every sampling attempt before `build_prompt(...)`
- cleaning stale, duplicate, wrong-role, legacy, and pre-injected Goal-looking
  items
- inserting or verifying exactly one selected developer-role Goal item
- returning inert commit metadata tied to that exact item
- committing on `ResponseEvent::Created`
- tests that inspect captured final `/responses` input

It should not reopen:

- whether final request input is authority
- whether internal-context helpers are authority
- whether prebuilt active-turn items are commits
- whether classifiers can prove Goal authority

Relevant authority concepts:

- `goal-authority-final-request-input-and-commit.md`: actual request path,
  per-attempt shaping, commit metadata, Created-event commit, retry/follow-up
  behavior, committed carry, and the `goals.rs` adapter boundary.
- `goal-authority-primary-cadence-contract.md`: developer-role steering shape,
  supersedence order, pending-intent consumption, current-authority sources,
  and repair as a backstop.
- `goal-authority-durable-cadence-state.md`: facts version, pending intent
  storage, exact-key consumption, and state-layer non-ownership of request
  shaping or role selection.
- `goal-authority-repair-classifier-integration.md`: classifiers as cleanup
  tools only and final request-input repair as the active-authority repair
  callsite.

### Work Area 03

Work Area 03 should implement automatic Continuation on top of the Work Area 02
request assembly seam.

The research docs already specify:

- the `model_visible_history_key` logical shape
- eligible progress inputs and Goal-item exclusions
- capture at the request-input shaping path before inserting Continuation
- pending non-Goal work before pending durable Goal cadence before automatic
  Continuation
- stale synthetic turn semantics
- watermark advancement only after final request input contains the
  Continuation item and the request reaches the commit point

Work Area 03 should focus on concrete implementation choices:

- exact key type/module/storage representation
- exact idle metadata and reservation plumbing
- exact abort-before-submit code path for stale synthetic Goal-owned turns
- retry and resume tests proving the specified behavior

Relevant authority concepts:

- `goal-authority-idle-continuation-contract.md`: idle stage order, legal
  callers, lock/reservation rechecks, stale synthetic turn behavior, resume
  hydration, and external mutation ordering relative to idle work.
- `goal-authority-model-visible-history-key.md`: structured key shape,
  eligible progress projection, Goal-item exclusions, capture point, watermark
  comparison, and resume/restart behavior.
- `goal-authority-final-request-input-and-commit.md`: per-attempt shaping,
  Continuation commit metadata tied to the exact final item, and Created-event
  commit behavior.
- `goal-authority-durable-cadence-state.md`: Continuation is not persisted
  pending cadence intent; state may expose facts versions or committed
  delivery records without deciding Continuation eligibility.

### Work Area 04

Work Area 04 is the migration-sensitive work area.

It should apply the `goal-authority-ext-goal-ownership.md` reachability rule:
reachable extension active steering must be converted, removed, or proven
unreachable.

Within that authority contract, follow upstream v136 topology by default.
Upstream v136 does not have the later `GoalService` facade, so Work Area 04
should not silently introduce a full v139/v140 service move before the actual
migration.

Default v136 direction:

- keep `GoalExtension` as the extension lifecycle contributor owner
- keep `GoalRuntimeHandle` as the per-thread runtime/accounting/effects owner
- keep existing v136 adapters where they do not conflict with authority
- convert any reachable active steering producer away from concrete active
  model-input construction/injection and toward durable pending intent plus
  metadata-only recheck or wake behavior
- remove or prove unreachable any extension active steering producer that is
  not converted

The implementation pass split should choose, and justify, any departure from
that default:

1. Adapter-only compatibility:
   - keep current v136 entry points
   - convert them to durable pending intent and metadata/recheck requests
   - stop active model-input construction
   - defer broad `GoalService` topology until the v139/v140 migration
   - this is the default because it matches upstream v136 topology

2. Thin service facade:
   - add a small `ext/goal/src/api.rs` facade with upstream-compatible names
   - include only v136-needed methods
   - return durable facts, pending intent summaries, and runtime effects
   - do not output active steering `ResponseItem`s
   - require a code-grounded reason why adapter-only conversion is not enough

3. Full service adoption:
   - adopt upstream-style app-server/service/runtime registration now
   - still change active steering outputs so request assembly owns model input
   - require a code-grounded reason why this cannot wait for the v139/v140
     migration

If level 3 is required before migrating to v139/v140, the pass should explain
why level 1 or level 2 cannot carry the v136 fix.

Relevant authority concepts:

- `goal-authority-ext-goal-ownership.md`: `ext/goal` may own lifecycle, tools,
  accounting, metrics, mutation entry points, prompt-body helpers, durable
  state calls, pending intent summaries, runtime effects, and typed delivery
  requests; it must not construct active model input, choose active role,
  consume pending intent, advance watermarks, or commit delivery.
- `goal-authority-ext-goal-ownership.md`: reachable extension active steering
  must be converted, removed, or proven unreachable, with file-specific
  expectations for `steering.rs`, `runtime.rs`, `extension.rs`, and core
  injection/carry APIs.
- `goal-authority-fake-shim-removal-map.md`: extension Goal steering producer
  is active shim terrain; `GoalContext`, `GoalContextRole`, and active
  `<goal_context>` are not migration compatibility points.
- `goal-authority-idle-continuation-contract.md`: external Goal mutation
  ordering, same-turn injection unavailability preserving pending intent, and
  pending non-Goal work before Goal-owned synthetic work.
- `goal-authority-durable-cadence-state.md`: atomic durable mutation plus
  pending intent outcomes that extension/app adapters should request.

### Work Area 05

Work Area 05 should keep classifier and projection work as support
infrastructure.

It should focus on:

- strict pure current Goal internal-context classification
- strict pure legacy `<goal_context>` classification
- preserving mixed ordinary prose
- typed/materialized projection hiding
- raw response notifications remaining raw
- compaction, rollback, fork, and reconstruction cleanup

It should not move cadence, authority, or commit decisions into classifier
code.

Relevant authority concepts:

- `goal-authority-repair-classifier-integration.md`: classifier output
  categories, whole-message purity, wrong-role current Goal items as cleanup
  only, typed/materialized projection behavior, raw response behavior,
  contextual parsing, history boundaries, compaction, reconstruction,
  rollback, fork behavior, and classifier ownership.
- `goal-authority-fake-shim-removal-map.md`: shim-dependent consumers to
  replace, required legacy artifact handling, and consumer-specific pitfalls
  for event mapping, compaction, rollout reconstruction, history boundaries,
  and contextual fragment infrastructure.
- `goal-authority-primary-cadence-contract.md`: request repair decision table,
  legacy `<goal_context>` artifact limits, and classifiers not being authority
  predicates.
- `goal-authority-grounding-truth.md`: hiddenness, rendered text, and UI
  projection are not authority; raw response item notifications must not get
  Goal-specific suppression unless the general raw-response contract changes.

## Remaining Open Questions

These are the questions that still need code-grounded answers after moving the
resolved authority decisions above into the work-area split. They are not
questions about the authority model.

### Concrete v136 Type And Module Placement Follow-Through

The default placement is now resolved above. Remaining Work Area rewrites need
to propagate it mechanically and name any justified deviation:

- replace single-file `goal_cadence.rs` wording with the private
  `core/src/goal_cadence/` module directory
- keep the shaper pure over a fresh per-attempt context assembled by
  `session/turn.rs` or a nearby adapter
- ensure extension-callable request types are public from core or translated by
  `CodexThread`, because `ext/goal` cannot name private core module types
- keep prompt-body helpers text-only and owned by `goal_cadence/prompt.rs` by
  default unless a later code walk proves extension ownership is needed

### Same-Turn And Idle Plumbing

- How does a same-turn metadata recheck cause another sampling opportunity
  without becoming pending model input?
- What exact code path clears a stale synthetic Goal-owned turn and completes
  without model submission or user-facing model error?
- What is the concrete session/thread bridge shape that replaces upstream-style
  `try_start_turn_if_idle(Vec<ResponseItem>)` for Goal cadence work?

### Continuation Storage And Reconstruction

- Which allowed v136 strategy should represent the committed automatic
  Continuation suppression triple: a persisted state table, structured
  rollout-derived reconstruction, or another structured committed-delivery
  record?
- Where are the concrete schema, Rust types, reconstruction code, and tests for
  that strategy placed?
- If a preflight history key is used to avoid launching suppressed synthetic
  turns, where is it computed, and how is it kept subordinate to the
  per-attempt recomputed key used for commit?

### `ext/goal` Migration Scope

- What code-grounded conflict, if any, would force Work Area 04 beyond the
  default upstream-v136-shaped adapter-only conversion?
- Which app-server and extension mutation paths must be centralized now, and
  which can remain local adapters without harming migration?
- Does app-server need to depend on `codex-goal-extension` in v136, or should
  that dependency inversion wait for the v139/v140 migration?
- If app-server Goal mutations route through a service facade, how are ordered
  responses and notifications preserved without making that facade construct
  active model input?

### Pass And Test Planning

- Where should 02/03/04 pass boundaries fall so each pass is tractable without
  pretending to be an independent release checkpoint?
- Which tests prove extension-origin cadence reaches final `/responses` input
  as exactly one current developer-role Goal item?
- Which tests prove migration compatibility without over-testing a temporary
  v136 facade that may disappear during the v139/v140 migration?

## Planning Rule

When revising or splitting Work Areas 02, 03, and 04, keep this distinction
visible:

```text
resolved v136 authority:
  final request input owns active Goal authority

remaining v136 execution work:
  concrete Rust placement, wiring, tests, pass order

migration compatibility work:
  avoid choices that fight later ext/goal ownership

not required before migration:
  fully recreate upstream v139/v140 service/runtime topology
```

If a pass labels a resolved authority point as an open architecture question,
revise it. If a pass depends on a real open implementation choice, name the
choice directly and carry the question until the code-grounded pass answers it.
