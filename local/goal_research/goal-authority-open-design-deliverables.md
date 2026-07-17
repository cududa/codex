# Goal Authority Open Design Deliverables

## Navigation Header

This header is a navigation aid only. The full document below remains
authoritative.

- Role: readiness checklist for implementation-design deliverables.
- Owns: deliverable status, readiness criteria, consolidated-doc posture, and
  the rule for when an implementation execution plan may be written.
- Does not own: the authority spine, detailed seam contracts, or file-specific
  implementation slices.
- Read after: the authority spine and all seam/support docs when deciding
  whether implementation planning is ready.
- Current terrain anchors: none beyond the focused artifacts it lists.
- Fidelity note: Ready means ready as design input, not already translated into
  concrete files, functions, migrations, tests, or slice order.

These items must be resolved before authoring another implementation execution
plan. The authority contracts are mature, but several implementation seams
still need compact, code-grounded design artifacts.

This checklist intentionally pares back the earlier expanded split. The
replacement architecture should not grow a helper framework for its own sake.
Two concepts carry the design:

1. durable cadence state
2. per-attempt final request-input shaping and commit

Everything else must either support those directly or remain an implementation
detail.

## Corrected Posture

Do not treat generic internal-context role support as a deliverable-level
authority mechanism.

Generic internal context may provide:

- source-tagged Goal text rendering
- strict pure-item classification
- legacy/current cleanup support

It does not provide Goal authority. Authority is established only when the
actual final request input, the logical `Vec<ResponseItem>` that becomes
`Prompt.input` and then `ResponsesApiRequest.input`, contains the selected
current Goal item as an outer developer-role `ResponseItem::Message`.

Do not create an authority layer over helper output. The design seam is the
per-attempt final request-input shaping point.

## Consolidated Docs

The earlier split docs were consolidated into:

- `goal-authority-durable-cadence-state.md`
- `goal-authority-final-request-input-and-commit.md`

Do not recreate separate cadence-module, finalizer/commit, goals-adapter,
GoalStore-interface, or state/behavior docs unless code inspection proves the
consolidated docs are too large to execute. If a later slice needs more detail,
patch the consolidated doc first.

The recorded request evidence pass is a support seam for final request-input
commit and replay evidence:

- `goal-authority-recorded-request-evidence.md`

It does not add a new authority mechanism. It defines the structured carrier
used when rollout/thread history is used as replay evidence for a committed
final request input.

## Current Status

Status terms in this file mean:

- Ready: the artifact exists and satisfies this checklist's design-deliverable
  requirements. It can be translated into implementation slices.
- Open: the artifact does not exist yet or does not yet answer the required
  design questions.
- Blocker: an implementation execution plan must not proceed without resolving
  the item or explicitly superseding it in a later authority update.

Current status:

- `goal-authority-durable-cadence-state.md`: Ready.
- `goal-authority-final-request-input-and-commit.md`: Ready.
- `goal-authority-model-visible-history-key.md`: Ready.
- `goal-authority-ext-goal-ownership.md`: Ready.
- `goal-authority-repair-classifier-integration.md`: Ready.
- `goal-authority-recorded-request-evidence.md`: Ready as a support seam for
  final request-input commit/replay evidence.

The Ready docs are ready as implementation-design inputs, not as execution
plans. The execution plan still needs to assign concrete files, functions,
migration numbers, test files, and slice order.

## Required Deliverables

### 1. Durable Cadence State

Focused artifact:

- `goal-authority-durable-cadence-state.md`

Status: Ready.

Readiness assessment: this artifact satisfies the requirements below. It
defines the durable storage shape, `facts_version`, pending Initial /
ObjectiveUpdated / BudgetLimit intent, atomic mutation rules, supersedence,
exact-key consumption, required store operations, Continuation exclusion, and
state-layer non-ownership boundaries.

Remaining execution-plan work: assign concrete Rust types, migration filename,
callers, and focused state tests.

This replaces the separate state-versus-behavior and GoalStore-interface
deliverables.

It must define:

- exact SQL/storage shape for pending Initial, ObjectiveUpdated, and
  BudgetLimit intent
- exact facts version or durable facts fingerprint
- atomic mutations that update Goal facts and pending cadence intent together
- exact-key intent cleanup and delivery commit operations
- durable snapshots exposed to core cadence
- what `GoalStore` must not own: final request shaping, idle ordering, repair,
  prompt rendering, model roles, and Continuation policy

Keep it narrow. State owns durable facts and durable intent. Core cadence owns
behavior.

### 2. Final Request-Input Shaping And Commit

Focused artifact:

- `goal-authority-final-request-input-and-commit.md`

Status: Ready.

Readiness assessment: this artifact satisfies the requirements below. It
identifies the actual request path through `Prompt.input` and
`ResponsesApiRequest.input`, defines the final request-input shaping
responsibility, selection order, cleanup obligations, commit metadata,
`ResponseEvent::Created` commit point, retry/follow-up behavior, current-turn
carry replacement, `goals.rs` adapter scope, and final-request-input test
requirements.

Remaining execution-plan work: choose the concrete module/function names, wire
the shaping point into every request attempt, and map tests to specific files.

This replaces the separate cadence-module-interface, finalizer/commit
dataflow, and goals-module-adapter deliverables.

It must define:

- the exact function or module that receives the per-attempt `Vec<ResponseItem>`
  before `Prompt.input` / `ResponsesApiRequest.input`
- how that function selects pending durable intent or runtime Continuation for
  the current request
- how it removes, ignores, or replaces stale, wrong-role, duplicate, legacy, or
  pre-injected Goal-looking items
- how it inserts or verifies exactly one current developer-role Goal item when
  cadence-required authority is due
- the output struct and commit metadata tied to that exact item
- retry/follow-up behavior, including rebuilt prompt input inside retry loops
- when Initial, ObjectiveUpdated, and BudgetLimit pending intent is consumed
- when Continuation watermarking advances
- why helper output, current-turn carry, active-turn injection, and reservation
  are not commits
- what remains in `codex-rs/core/src/goals.rs` as an adapter after this module
  owns final request shaping and commit dataflow

Commit should be tied to the first point at which the request is known to have
entered model execution, expected to be `ResponseEvent::Created` unless a code
walk proves a more precise local commit point.

### 3. Model Visible History Key

Focused artifact:

- `goal-authority-model-visible-history-key.md`

Status: Ready.

Readiness assessment: this artifact satisfies the requirements below. It
defines the logical key shape, eligible progress projection, exclusion of Goal
cadence/repair items, capture point in final request-input shaping, runtime
watermark semantics, resume/restart reconstruction, compaction effects, and
required tests.

Remaining execution-plan work: choose the concrete Rust type/module, storage
location for committed Continuation suppression metadata, hash implementation,
and exact test files.

It must define:

- the concrete `model_visible_history_key` shape
- generation or fingerprint inputs
- increment/capture points
- how compaction and reconstruction affect the key
- how Goal cadence items are excluded from the key used to justify another
  automatic Continuation
- how resume reconstructs suppression state without allowing duplicate idle
  Continuation when no eligible history or durable facts changed

This may depend on the final request-input shaping artifact, but it should stay
separate because it affects idle Continuation semantics across resume,
compaction, and retry.

### 4. `ext/goal` Ownership

Focused artifact:

- `goal-authority-ext-goal-ownership.md`

Status: Ready.

Readiness assessment: this artifact satisfies the requirements below. It
inspects local and `rust-v0.136.0` extension terrain, defines extension
ownership limits, requires reachable extension steering to route through shared
final request-input shaping, selects adapter/runtime conversion as the v136
default, keeps app-server Goal mutation on the product processor path through
cadence-aware state plus metadata-only wake/recheck adapters, limits any thin
facade to a blocker-triggered follow-up, rejects user-role active steering
compatibility, and names file-specific work areas and tests.

Remaining execution-plan work: name the exact adapter APIs for the selected
route, remove or convert the concrete injection call chain, and map extension
tests to specific files.

It must inspect upstream and local code before deciding whether extension code:

- remains an active producer routed through shared final request-input shaping
- becomes a thin caller into shared cadence machinery
- or stops producing active Goal steering from the old path

It must not leave reachable `GoalContext`, `GoalContextRole`, active
`<goal_context>`, pre-shaper concrete Goal item injection, or user-role
active Goal steering alive.

### 5. Repair And Classifier Integration

Focused artifact:

- `goal-authority-repair-classifier-integration.md`

Status: Ready.

Readiness assessment: this artifact satisfies the requirements below. It maps
the current scattered callsites, defines classifier outputs and purity rules,
limits repair authority to final request-input shaping, separates typed
projection from raw notifications, and names compaction, reconstruction,
history-cut, and app-server behaviors.

Remaining execution-plan work: pick concrete classifier module/type names,
replace callsites in slice order, and map projection/compaction/raw tests to
specific files.

This is a support artifact, not an authority framework.

It must map exact callsites for:

- event mapping
- contextual parsing
- history rollback
- compaction
- rollout reconstruction
- app-server typed/materialized history
- raw response notifications

Classifiers must be strict pure-item cleanup tools. They must not decide
cadence, consume intent, prove authority, or infer active Goal state.

## Cleanup And Acceptance Posture

The final cleanup/acceptance pass is not an architecture owner. It may delete
old active shim terrain, verify replacement surfaces, add final acceptance
coverage, and run stale-symbol audits after the owning seams exist.

If cleanup finds missing cadence policy, durable state shape, final-input
ownership, idle/history behavior, extension routing, classifier semantics, or
evidence behavior, the implementation plan must return to the earlier owning
surface. Do not use cleanup readiness, final audits, or regex matches to invent
new behavior.

Final audit commands are review gates. They are useful for finding stale
symbols, concrete carry, raw suppression, and request-payload proof gaps, but
they are not architecture and must not replace the authority docs above.

## Readiness Rule

An implementation execution plan is ready only after these five deliverables
are Ready or are explicitly resolved in a later authority update.

Current readiness: ready for an implementation execution plan. All five
primary deliverables and the recorded-evidence support seam are Ready as
design inputs. The next plan should translate them into ordered, file-specific
slices without reopening the core architecture.

The execution plan must translate them into ordered, file-specific slices. It
must not reopen the core architecture unless a code walk finds a direct
conflict with these authority docs.
