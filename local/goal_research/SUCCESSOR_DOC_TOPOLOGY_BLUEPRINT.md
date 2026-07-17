# Successor-Doc Topology Blueprint

This topology blueprint proposes the successor Goal document set,
conflict-control order, grouping rationale, per-doc ownership boundaries, and
routing posture before any successor authority prose is drafted.

The topology is not a source-heading rewrite plan, not a one-to-one expansion
of Pass 2B target keys, not an implementation execution plan, and not the
drafting protocol.

## Topology Decisions Resolved Through Packet 2

- `goal-recorded-request-evidence.md` remains standalone. The v136 route treats
  evidence as metadata-only Created-event commit/replay support, with durable
  state as live correctness by default unless an implementation pass explicitly
  chooses a non-best-effort evidence-backed path. That conditional
  implementation scope is not an open topology question.
- Authority Order is a control and conflict order, not a drafting order. It is
  strict when two docs claim the same behavioral decision; seam-local ownership
  still controls local details inside a support surface.
- Current `goal-authority-*` source docs remain the source corpus for this
  architecture pass. The Packet 2 corrections have absorbed the settled v136
  route decisions needed for successor topology closure. Successor drafting
  must use the corrected `goal_research` docs as standalone inputs, not route
  records as future authority.
- Idle and history remain one lifecycle doc for 2.2 because the v136 route uses
  one WA03 execution region, but the doc must keep idle scheduling ownership
  distinct from model-visible history key and watermark ownership.
- Repair/projection boundaries are sharpened by splitting request
  repair/classification from projection/reconstruction/raw behavior. Final
  request-input selection and commit remain owned by `goal-final-request-input.md`.
- Extension lifecycle/reachability is long-lived successor authority. Fake-shim
  demolition is separate demolition terrain outside the long-lived successor
  authority topology.
- Operations stay in `AGENTS.md`, navigation stays in `README.md`, and glossary
  stays in `CONTEXT.md`. They are existing containers, not long-lived successor
  authority docs.

## Proposed Doc List

Proposed working names:

1. `goal-authority-behavior.md`
   - Reader question: what counts as Goal authority, and which authority
     shapes are forbidden?
2. `goal-cadence-contract.md`
   - Reader question: when is Goal steering due, superseded, repaired, or not
     cadence at all?
3. `goal-durable-state-and-pending-intent.md`
   - Reader question: what durable Goal facts and pending intents survive
     between attempts, and when are they consumed?
4. `goal-final-request-input.md`
   - Reader question: what exact final model request input proves active Goal
     authority for an attempt?
5. `goal-idle-history-lifecycle.md`
   - Reader question: how do idle work, pending durable intent, automatic
     Continuation, model-visible history, and resume/restart suppression
     interact?
6. `goal-request-repair-and-artifact-classification.md`
   - Reader question: what classifier and request-local repair semantics
     support final input without becoming authority or cadence?
7. `goal-projection-reconstruction-and-raw-history.md`
   - Reader question: how do typed/materialized projection, raw notifications,
     compaction, reconstruction, rollback, fork, and legacy artifacts behave as
     support logic?
8. `goal-recorded-request-evidence.md`
   - Reader question: what structured metadata records committed request
     delivery for replay, audit, and reconstruction support?
9. `goal-extension-lifecycle-and-reachability.md`
   - Reader question: how do extension lifecycle, tool/accounting mutations,
     app-server ordering, and reachability route into shared Goal authority
     seams?
10. `goal-test-prep-and-replacement-proof.md`
    - Reader question: which tests are reset, deleted, retained, replaced, or
      snapshotted to prove the rewrite?
11. `goal-readiness-and-execution-handoff.md`
    - Reader question: when is architecture ready to feed implementation
      planning, and what remains handoff rather than behavior authority?

## Existing Containers And External Terrain

- Operations remain in `AGENTS.md`. Do not create a long-lived
  `goal-operations-and-authority-order.md` successor doc.
- Navigation remains in `README.md`. Do not create a long-lived
  `goal-navigation-index.md` successor doc.
- Glossary remains in `CONTEXT.md`. Do not create a long-lived
  `goal-glossary.md` successor doc.
- Recorded request evidence remains a standalone successor authority surface.
- Fake-shim demolition terrain does not remain a long-lived successor
  authority surface. Treat that terrain as separate demolition work outside
  successor authority topology, without moving files in this topology packet.

## Authority Order

Use this as the proposed successor Goal control order once successor docs
exist:

1. `goal-authority-behavior.md`
2. `goal-cadence-contract.md`
3. `goal-durable-state-and-pending-intent.md`
4. `goal-final-request-input.md`
5. `goal-idle-history-lifecycle.md`
6. `goal-request-repair-and-artifact-classification.md`
7. `goal-projection-reconstruction-and-raw-history.md`
8. `goal-recorded-request-evidence.md`
9. `goal-extension-lifecycle-and-reachability.md`
10. `goal-test-prep-and-replacement-proof.md`
11. `goal-readiness-and-execution-handoff.md`

Conflict rule: higher docs control cross-surface behavioral conflicts, but a
lower doc controls local semantics inside its own support surface when it does
not contradict a higher doc. Evidence, extension, test, and readiness surfaces
cannot create behavior authority that behavior, cadence, durable state, final
input, or idle/history do not support. `AGENTS.md`, `README.md`, and
`CONTEXT.md` remain operational, navigation, and glossary containers; they do
not outrank successor behavior or seam docs.

## Per-Doc Ownership Skeleton

### `goal-authority-behavior.md`

- Purpose: define active Goal authority and reject invalid authority shapes.
- Owns: final developer-role Goal item as behavioral authority; forbidden
  user-role, rendered-marker, helper/provenance-only, hiddenness, tool-output,
  runtime-archaeology, and repair-as-cadence authority shapes.
- Does not own: cadence selection, durable mutation, final shaping mechanics,
  cleanup classifier details, extension lifecycle, or tests.
- Obvious canonical concepts: Goal authority; developer-role active steering;
  active durable state alone is not steering; runtime archaeology forbidden;
  tool output and UI state are not authority.
- Topology closure: no open topology question.

### `goal-cadence-contract.md`

- Purpose: define when Goal steering is due and how steering kinds rank before
  final input proves delivery.
- Owns: Initial, ObjectiveUpdated, BudgetLimit, automatic Continuation as
  cadence events; supersedence; ordinary user-turn limits; cadence-required
  authority; repair-not-cadence boundary.
- Does not own: durable storage, exact-key store implementation, idle caller
  lifecycle, final commit mechanics, history key construction, or cleanup
  classifiers.
- Obvious canonical concepts: BudgetLimit > ObjectiveUpdated > Initial >
  Continuation; ordinary user turns are not cadence; active state alone is not
  cadence-required authority; same-turn recheck is metadata/wake behavior only.
- Topology closure: no open topology question.

### `goal-durable-state-and-pending-intent.md`

- Purpose: define durable Goal facts, facts version, pending non-Continuation
  intent, atomic mutations, supersedence cleanup, and exact-key consumption.
- Owns: durable Goal facts; durable facts version; pending Initial,
  ObjectiveUpdated, and BudgetLimit intent; atomic facts-plus-intent mutation;
  exact-key pending intent consumption; state-owned Continuation watermark
  storage when WA03 selects that route.
- Does not own: model role, prompt rendering, cadence selection for a request,
  active model input construction, request repair, idle scheduling, evidence
  carrier, or test matrix.
- Obvious canonical concepts: pending intent is structured durable state;
  Continuation is not pending intent; consumption waits for final-input commit;
  state APIs do not render or select authority.
- Implementation-plan details: exact schema/API names remain implementation
  work, not topology uncertainty.

### `goal-final-request-input.md`

- Purpose: define the per-attempt seam where Goal authority becomes actual
  model request input and where delivery side effects become valid.
- Owns: logical final `Vec<ResponseItem>` before `Prompt.input`;
  per-attempt shaping before `build_prompt(...)`; selected item identity;
  cleanup inside shaping; developer-role item construction; retry/follow-up
  shaping; Created-event commit; commit metadata; current-turn committed
  carry; fingerprints and final payload proof.
- Does not own: behavioral truth, durable storage, idle scheduling, history key
  ownership, evidence persistence/replay policy beyond emitted metadata,
  extension lifecycle, broad projection/raw cleanup, or test matrix ownership.
- Obvious canonical concepts: exactly one selected current outer
  developer-role Goal item when due; active durable Goal alone selects nothing;
  commit on `ResponseEvent::Created`; no consumption or watermark advancement
  before commit; `core/src/goal_cadence/` is v136 route terrain, not a final
  filename requirement.
- Implementation-plan details: exact Rust type/function names and any later
  commit-point authority update remain outside this topology session.

### `goal-idle-history-lifecycle.md`

- Purpose: define the combined lifecycle route for idle ordering, pending work,
  pending durable intent delivery, automatic Continuation, model-visible
  history key projection, watermarking, resume, rollback, and fork effects.
- Owns: idle legal callers and stage order; pending non-Goal work precedence;
  Goal-owned synthetic turn metadata; same-turn metadata lifecycle; resume
  hydration ordering; `model_visible_history_key`; eligible progress
  projection; Continuation watermark comparison/reconstruction and default
  state-owned suppression basis.
- Does not own: behavior-level authority, durable facts mutation, final item
  insertion/commit, evidence carrier policy, classifier/projection mechanics,
  extension lifecycle, or test matrix.
- Obvious canonical concepts: pending durable intent outranks automatic
  Continuation; resume is hydration, not cadence; Continuation is duplicate
  suppressed by goal id, model-visible history key, and facts version; the
  Continuation item itself must not permit the next Continuation.
- Topology closure: no open question for the one-doc topology. Internal
  sections must keep idle scheduling and history/watermark ownership separate.

### `goal-request-repair-and-artifact-classification.md`

- Purpose: define strict classifier and request-local repair support without
  letting classifiers decide cadence, authority, state, or final commit.
- Owns: pure current Goal internal-context classification; pure legacy
  `<goal_context>` artifact classification; non-Goal internal context;
  mixed/ordinary preservation; whole-message purity; wrong-role current Goal
  as cleanup-only; request-local repair semantics and repair reports as
  support data.
- Does not own: cadence due rules, durable facts or pending intent, selected
  final item construction, Created-event commit, model-visible history key,
  evidence persistence, projection/raw output, or extension lifecycle.
- Obvious canonical concepts: classifier output is not authority; request
  repair is request-local by default; mixed marker-like ordinary prose remains
  ordinary; active final repair decisions run through `goal-final-request-input.md`.
- Implementation-plan details: exact classifier module names remain
  implementation work.

### `goal-projection-reconstruction-and-raw-history.md`

- Purpose: define support behavior for typed/materialized projection, raw
  response item notifications, history boundaries, compaction, rollout
  reconstruction, rollback, fork, and legacy artifact cleanup.
- Owns: typed/materialized hiding of pure current and legacy Goal artifacts;
  raw notifications remaining raw; contextual parsing and user-turn boundary
  behavior; compaction filtering; reconstruction/rollback/fork cleanup;
  legacy artifact handling as cleanup only.
- Does not own: cadence, durable state, final item selection/commit, request
  repair authority, evidence carrier semantics, extension mutation, or tests
  as behavior authority.
- Obvious canonical concepts: projection hiding is not authority; raw remains
  raw; compaction does not synthesize steering, pending intent, evidence, or
  watermarks; reconstruction never parses rendered Goal text to recover Goal
  facts or intent.
- Implementation-plan details: whether evidence-backed recorded repair is
  implemented depends on the evidence/carry seam being in scope; topology stays
  unchanged.

### `goal-recorded-request-evidence.md`

- Purpose: define structured committed metadata for replay, audit, and
  reconstruction support when rollout/thread-history evidence is used.
- Owns: evidence carrier shape; schema version; thread/turn/attempt identity;
  goal id; kind; facts version; model-visible history key; item fingerprint;
  request-input fingerprint; item index; inserted-or-verified status; commit
  point; timestamp; paired-write and partial-failure policy when replay
  evidence matters.
- Does not own: Goal authority, cadence selection, durable live correctness by
  default, pending intent storage, final request-input selection, repair
  authority, raw notification emission, or projection materialization.
- Obvious canonical concepts: evidence is Created-event metadata only;
  ordinary rollout items, rollout trace, raw notifications, classifier matches,
  and rendered text are not structured evidence; evidence has no
  `to_model_input_item`-style active steering path.
- Topology closure: document existence is settled. Concrete implementation may
  choose audit-only evidence or a non-best-effort evidence-backed
  reconstruction path without changing the topology.

### `goal-extension-lifecycle-and-reachability.md`

- Purpose: define long-lived extension/app-server participation without moving
  active model-input authority into extension code.
- Owns: `ext/goal` lifecycle, tools, accounting, metrics, events, mutation
  entry points, configuration compatibility, adapter/runtime conversion,
  typed cadence/wake requests, app-server/core mutation ordering, and
  reachability classification for extension active producers.
- Does not own: active `ResponseItem`/`ResponseInputItem` construction, model
  role selection, final shaping/commit, pending-intent consumption,
  Continuation watermark advancement, evidence writer, or separate fake-shim
  demolition terrain outside extension reachability.
- Obvious canonical concepts: v136 selects adapter/runtime conversion by
  default; a thin facade is blocker-triggered only; full v139/v140
  `GoalService` adoption is not selected for v136; same-turn delivery is
  metadata/wake/recheck, not prebuilt model input.
- Topology closure: long-lived doc status and the adapter/runtime route are
  settled. Facade work is limited to the blocker-triggered condition named by
  extension authority; it is not an open topology or default-service question.

### `goal-test-prep-and-replacement-proof.md`

- Purpose: define test prep, baseline restoration, replacement proof matrix,
  snapshot posture, and final acceptance proof obligations.
- Owns: local-only fake-context/overlay deletion; upstream baseline
  restoration; replacement test profile; extension baseline caveat; snapshot
  handling; final payload/evidence/state/projection/raw proof matrix.
- Does not own: behavior contracts, implementation architecture, product
  redesign, module names, migration names, or readiness/handoff status.
- Obvious canonical concepts: tests prove authority through final payloads or
  structured evidence where applicable, not helper output; upstream Goal
  product behavior remains baseline absent separate product change.
- Implementation-plan details: exact new test filenames and filters remain
  implementation-plan work.

### `goal-readiness-and-execution-handoff.md`

- Purpose: define the handoff gate from architecture/design inputs to
  implementation execution planning.
- Owns: Ready/Open/Blocker status as design-input terms; consolidated-doc
  posture; readiness criteria; handoff requirements; execution-plan boundary.
- Does not own: behavior, cadence, durable state, final shaping, idle/history,
  evidence, cleanup, extension, demolition terrain, test matrix, or container
  operations/navigation/glossary semantics.
- Obvious canonical concepts: Ready means ready as design input, not
  implementation complete; execution plans translate ready docs into ordered
  file-specific steps without reopening architecture absent direct conflict.
- Drafting detail: exact handoff wording and retained old checklist provenance
  after successor docs exist.

## Rationale For Grouping And Splitting Surfaces

- Behavior, cadence, durable state, and final request input remain separate
  because they answer different high-risk questions: what authority is, when it
  is due, what pending state persists, and what final payload proves it.
- Idle and history remain one lifecycle route for 2.2 because pending work,
  pending durable intent, automatic Continuation, resume, key projection, and
  watermarking are executed together in the v136 route. The doc must still
  make idle scheduling and history/watermark ownership separate inside it.
- Cleanup support is split because classifier/request repair and
  projection/reconstruction/raw behavior have different failure modes.
  Classification can directly affect final request cleanup; projection/raw
  behavior must not become final-input authority or evidence.
- Recorded request evidence stays standalone because it is easy to misuse as
  authority. Its metadata-only boundary needs a clear owner even when the
  implementation carrier is conditional.
- Extension lifecycle remains a long-lived support/lifecycle surface. Shim
  demolition remains transitional terrain to delete, convert, or prove
  unreachable, but it is not a long-lived successor authority doc.
- Test prep and readiness are split because the replacement proof matrix is an
  execution-prep index, while readiness is a handoff gate.
- Operations, navigation, and glossary keep their existing containers because
  operational force, reader routing, and vocabulary have different drift risks:
  `AGENTS.md`, `README.md`, and `CONTEXT.md`.
- Pass 2B target keys remain design inputs, not document boundaries. The
  topology groups targets where future readers need one route and splits them
  where one file would blur authority with support, lifecycle with deletion,
  or instructions with vocabulary.

## Canonical / Local / Pointer Routing

Use this section as repeated-authority routing metadata for successor drafting.
It is not a drafting order and does not replace source coverage checks.

| Concept family | Canonical successor owner | Local reminders | Pointer-only / operational routing |
| --- | --- | --- | --- |
| Final request-input developer-role proof | `goal-authority-behavior.md` for the behavioral rule; `goal-final-request-input.md` for shaping, selected-item proof, fingerprints, and Created-event commit mechanics | `goal-cadence-contract.md`, `goal-request-repair-and-artifact-classification.md`, `goal-extension-lifecycle-and-reachability.md`, and `goal-test-prep-and-replacement-proof.md` keep short local warnings that their surfaces do not prove authority | `goal-durable-state-and-pending-intent.md`, `goal-idle-history-lifecycle.md`, `goal-recorded-request-evidence.md`, and `goal-readiness-and-execution-handoff.md` point to behavior/final rather than restating mechanics; `AGENTS.md`, `README.md`, and `CONTEXT.md` stay thin container aids |
| Pending Initial, ObjectiveUpdated, and BudgetLimit until commit | `goal-durable-state-and-pending-intent.md` for structured pending intent and exact-key APIs; `goal-final-request-input.md` for the only legal commit/consumption timing | `goal-cadence-contract.md`, `goal-idle-history-lifecycle.md`, `goal-extension-lifecycle-and-reachability.md`, and `goal-test-prep-and-replacement-proof.md` keep local reminders for supersedence, idle delivery, external mutation, and proof coverage | Behavior, history, evidence, cleanup, readiness, and existing containers use pointers unless naming the invariant as an operational/test reminder |
| Exact-key consumption and supersedence cleanup | `goal-durable-state-and-pending-intent.md` defines exact thread, goal, kind, and facts-version matching; `goal-final-request-input.md` defines when the exact-key call may happen | `goal-cadence-contract.md`, `goal-idle-history-lifecycle.md`, and test prep remind that stale synthetic turns, reservations, or broad supersedence cleanup cannot consume by implication | Other docs point to durable/final and do not use "clear pending intent" as a substitute for the exact-key rule |
| Active durable state alone is not steering or cadence authority | `goal-authority-behavior.md`, `goal-cadence-contract.md`, and `goal-durable-state-and-pending-intent.md` share the canonical negative rule at their own layer | `goal-final-request-input.md`, cleanup/projection docs, idle/history, extension, and test prep keep local seam warnings because each can accidentally treat state as model authority | Evidence, readiness, and existing containers use pointers; `AGENTS.md` may keep the short invariant only |
| Ordinary user turns are not cadence events | `goal-cadence-contract.md` owns the cadence rule; `goal-idle-history-lifecycle.md` owns pending-work precedence and idle ordering | `goal-final-request-input.md` reminds that already-pending non-Continuation intent can still be delivered only through final-input commit; test prep owns coverage reminders | Other docs point to cadence/idle and do not restate the rule as "Goal only speaks from idle" |
| Automatic Continuation, resume, retry/follow-up metadata, and current-turn carry | `goal-idle-history-lifecycle.md` owns idle selection, resume hydration, same-turn metadata lifecycle, and history/watermark semantics; `goal-final-request-input.md` owns commit-time carry and watermark advancement; `goal-durable-state-and-pending-intent.md` owns state-owned suppression storage where the route uses it | `goal-cadence-contract.md`, evidence, cleanup/projection, and test prep keep local reminders for non-Continuation precedence, metadata-only evidence limits, compaction effects, and retry/failure tests | Behavior, extension, readiness, and existing containers point to the idle/history plus final/durable owners |
| Request repair, classifiers, helper output, and projection are not authority | `goal-request-repair-and-artifact-classification.md` owns classifier and request-local repair semantics; `goal-projection-reconstruction-and-raw-history.md` owns typed/materialized projection, raw behavior, compaction, reconstruction, rollback, and fork; `goal-authority-behavior.md` owns the negative authority rule; `goal-final-request-input.md` owns the only active final-input repair callsite | Extension and test prep keep local reminders where helper/provenance or deletion terrain can look like authority | Cadence, durable, idle/history, evidence, readiness, and existing containers point to cleanup/final/behavior instead of duplicating classifier rules |
| Structured recorded request evidence | `goal-recorded-request-evidence.md` owns carrier, schema, fingerprints, persistence timing, replay/audit, rollback/fork/compaction treatment, and evidence tests; `goal-final-request-input.md` owns finalized-input identity and commit metadata emitted for evidence | Durable state, idle/history, cleanup/projection, test prep, and readiness keep local boundary reminders: live correctness defaults to durable state and evidence is metadata only | Behavior, cadence, extension, and existing containers use pointers and must not imply evidence materializes active model input |
| Extension reachability and steering-role compatibility | `goal-extension-lifecycle-and-reachability.md` owns lifecycle, tools, accounting, metrics, mutation entry points, configuration compatibility, app-server/core ordering, and producer-facing typed cadence metadata | Behavior, cadence, durable, final, idle/history, and test prep keep local reminders for no user-role compatibility, pending intent, final shaper routing, metadata-only same-turn delivery, deletion terrain, and extension baseline tests | History, evidence, cleanup/projection, readiness, and existing containers point to extension/final/durable unless naming a narrow boundary |
| Fake-shim removal | Separate demolition terrain outside the long-lived successor authority topology owns old active roots and deletion/conversion tracking; final-input and cleanup/projection docs own replacement behavior for active shaping and consumers | Behavior, extension, and test prep keep local reminders for why the shim is invalid, how reachable extension producers convert, and which tests create false compatibility pressure | Cadence, durable, idle/history, evidence, readiness, and existing containers point to the owning behavior/seam/test surfaces rather than restating deletion maps |
| Test and readiness support | `goal-test-prep-and-replacement-proof.md` and `goal-readiness-and-execution-handoff.md` own their support roles only | Behavior and seam docs keep local proof obligations for what they own | Support docs must not become the easiest-to-read replacement for behavior contracts; `AGENTS.md` keeps operations, `README.md` stays pointer-like navigation, and `CONTEXT.md` stays term-only glossary |

## Operational And Test Reminder Routing

- `AGENTS.md` remains the operations container. It may keep short invariants
  and the conflict-control order, but after successor docs exist it must point
  to behavior and seam owners for full rules.
- `goal-test-prep-and-replacement-proof.md` owns the replacement proof matrix,
  upstream baseline restoration, local false-compatibility test deletion, and
  snapshot posture. It does not define behavior.
- Behavior and seam docs should keep narrow local proof obligations near the
  rule they own. The test-prep doc collects the matrix and file clusters.
- `goal-readiness-and-execution-handoff.md` owns Ready/Open/Blocker and handoff
  criteria only. It must not reopen behavior or become an implementation plan.
- `README.md` remains the navigation container and routes reader questions to
  controlling docs. `CONTEXT.md` remains the glossary container and defines
  terms without edge-case rules.

## Settled Route Reconciliation Map

No source concept and settled route decision currently conflicts at the
topology level. This map records how the blueprint absorbed those decisions; it
is not future authority, a drafting order, or a requirement that successor
readers open route-plan files.

| Route record | Successor-doc reconciliation | Boundaries carried forward |
| --- | --- | --- |
| `implementation-route-index.md` | Use as implementation order only, not successor drafting order. Map pass clusters to the owning successor docs below. | Do not convert pass sequence into document order or one-pass-per-doc prose. |
| WA00 test prep and baseline reset | `goal-test-prep-and-replacement-proof.md` owns local overlay deletion, upstream baseline restoration, and replacement test clusters. Behavior/seam docs keep local proof obligations. | No production authority rewrite, no upstream product behavior deletion, no replacement tests before the owning behavior exists. |
| WA01 durable cadence state (`01a`-`01c`) | `goal-durable-state-and-pending-intent.md` owns facts versioning, pending Initial/ObjectiveUpdated/BudgetLimit, atomic facts-plus-intent mutations, exact-key consumption, and state non-ownership. `goal-final-request-input.md` owns commit timing. | State does not choose cadence, render prompts, construct model input, store evidence carrier fields, or make active state authority. |
| WA02 final request-input shaping and commit | `goal-final-request-input.md` owns the `core/src/goal_cadence/` request-input seam as route terrain, per-attempt shaping before `Prompt.input`, selected developer-role item proof, Created-event commit, committed carry metadata, fingerprints, and evidence metadata production. | `core/src/goals.rs` remains transitional adapter/prompt-body terrain; old concrete carry is not authority; evidence is metadata only and written from commit. |
| WA03 history key and idle Continuation (`03a`-`03i`) | `goal-idle-history-lifecycle.md` owns idle stage order, pending-work precedence, pending durable intent delivery, automatic Continuation selection, resume hydration, same-turn metadata lifecycle, model-visible history key, and watermark semantics. Durable state owns the default persisted Continuation suppression record; final-input owns Created-event advancement. | Keep idle selection, history key/watermark, and final commit advance distinct inside the one lifecycle doc. Do not use `history_version`, rendered Goal text, rollout trace, or ordinary rollout items as suppression proof. |
| WA04 extension conversion (`04a`-`04h`) | `goal-extension-lifecycle-and-reachability.md` owns the selected v136 adapter/runtime route, extension tool/lifecycle/accounting/event ownership, app-server/core mutation ordering, metadata-only cadence wake/recheck, and steering-role compatibility removal. | Full v139/v140 `GoalService` adoption is not selected for v136. A thin facade is blocker-triggered only. Extension/app-server code must not construct active model input, consume pending intent, advance watermarks, or write evidence. |
| WA05 repair classifiers and projections (`05a`-`05g`) | Split between `goal-request-repair-and-artifact-classification.md` for strict classifier and request-local repair, and `goal-projection-reconstruction-and-raw-history.md` for projection, raw notifications, compaction, reconstruction, rollback, and fork. | Classifier/helper/projection output is not authority; raw notifications remain raw; compaction/reconstruction do not recover Goal facts, intent, evidence, or watermarks from rendered text. |
| WA06 cleanup and acceptance (`06a`-`06g`) | Old active-root deletion is separate demolition terrain outside long-lived successor authority topology; `goal-test-prep-and-replacement-proof.md` owns acceptance matrix; `goal-readiness-and-execution-handoff.md` owns final handoff posture. | WA06 cannot invent new architecture. If a missing cadence, classifier, extension, or evidence behavior appears, return to the owning earlier surface. Final proof uses payload/state/commit/projection/raw/audit evidence, not helper text. |

Implementation-shaped names such as `core/src/goal_cadence/`,
`core/src/goal_artifacts.rs`, state runtime APIs, and `ext/goal` adapter/runtime
files are reconciliation anchors. They may inform successor docs, but successor
doc names remain reader-facing authority modules, not Rust module names.

## Current Source-Corpus Treatment After Successor Docs Exist

When successor docs are drafted and accepted, these existing files become
source corpus and provenance for coverage review. They should not remain peer
authority unless a later explicit update says so.

| Existing material | Successor-corpus role |
| --- | --- |
| `AGENTS.md` | Existing operations container for control order, conflict handling, reading posture, non-negotiable reminders, and docs/Rust verification posture. After successor docs exist, keep only operational pointers and compact invariants. |
| `README.md` | Existing navigation container for reader routing, doc roles, terrain anchors, and Pass 2 guardrails. After successor docs exist, reduce to a thin index. |
| `CONTEXT.md` | Existing glossary container for terms only. It must not carry behavior rules after successor docs exist. |
| `goal-authority-grounding-truth.md` and `goal-authority-primary-cadence-contract.md` | Source corpus for behavior, cadence, durable-state boundaries, final-input proof, repair limits, acceptance requirements, and non-negotiables. |
| `goal-authority-durable-cadence-state.md`, `goal-authority-final-request-input-and-commit.md`, `goal-authority-idle-continuation-contract.md`, `goal-authority-model-visible-history-key.md`, `goal-authority-recorded-request-evidence.md`, `goal-authority-ext-goal-ownership.md`, and `goal-authority-repair-classifier-integration.md` | Source corpus for their successor seam docs, with v136 work-area route decisions applied where they sharpen implementation-shaped detail without weakening concepts. |
| `goal-authority-fake-shim-removal-map.md` | Source corpus for separate transitional demolition terrain and old-root audits, not permanent successor authority or compatibility architecture. |
| `goal-test-deletion-map.md` | Source corpus for test-prep, baseline, replacement proof, and snapshot posture. It does not own behavior. |
| `goal-authority-open-design-deliverables.md` | Source corpus for readiness/handoff posture and consolidated-doc discipline. It does not own behavior after seam docs exist. |
| `goal-authority-recorded-request-evidence-design-pass-handoff.md` | Provenance-only source explaining why the recorded-evidence seam exists; the recorded-evidence authority comes from the actual evidence doc and successor evidence doc. |
| `PASS2_CONCEPT_LEDGER.md`, `PASS2_SECTION_TRACEABILITY.md`, `PASS2B_TARGET_INTERFACES.md`, and `pass2b_target_interfaces/` | Coverage, interface, and compression aids. They remain rewrite check tools, not successor authority. |
| v136 work-area route records | Temporary reconciliation input already absorbed by the Packet 2 series. They are not successor authority, not a future dependency for successor readers, and not a drafting order. |

## Closure Status

- Recorded request evidence remains standalone regardless of whether an
  implementation chooses audit-only evidence or a non-best-effort
  evidence-backed replay/reconstruction path.
- Operations, navigation, and glossary remain existing-container roles in
  `AGENTS.md`, `README.md`, and `CONTEXT.md`.
- Fake-shim demolition is separate demolition terrain, not a long-lived
  successor authority doc.
- The extension route is settled as adapter/runtime conversion by default; no
  ordinary facade or default `GoalService` uncertainty remains in the topology.
- Idle/history/watermark, extension, cleanup/projection, test prep, and
  readiness entries no longer require successor readers to open route-plan
  files for the truths captured by Packets 2A-2D.
- This blueprint does not override or supersede stale authority prose. If a
  direct mismatch is later found, the owning 2A-2D packet must resume before
  successor drafting.
- Packet 3 successor drafting has not started.

## Explicit Non-Decisions For Later Sessions

- Source coverage, concept coverage, and traceability checks are not converted
  into a writing order here; Session 3 must define the check method.
- Drafting protocol, rewrite sequence, and successor authority prose are not
  started here.
- Current source docs are not renamed, rehomed, deleted, or weakened by this
  topology blueprint.
- Separate fake-shim demolition terrain is not moved by this topology
  blueprint.
