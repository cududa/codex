# Goal Authority Behavior

## Navigation Header

This successor doc is the behavior-level authority contract for Goal steering.
It answers what counts as Goal authority and which proof substitutes are
forbidden.

- Role: canonical behavioral rule for active Goal authority.
- Owns: developer-role active steering as model authority; behavior-level
  active steering shape; forbidden user-role, rendered-marker, helper-only,
  fake-provenance, runtime-archaeology, tool-output, projection-hiddenness,
  active-state-only, evidence-as-authority, and repair-as-cadence shapes.
- Does not own: cadence timing, steering-kind ranking, durable facts mutation,
  pending intent storage, final request-input shaping mechanics, commit
  metadata, idle lifecycle, model-visible history keys, classifier details,
  extension lifecycle, evidence persistence, replacement test matrix, or
  readiness handoff.
- Read with: `goal-cadence-contract.md`,
  `goal-durable-state-and-pending-intent.md`,
  `goal-final-request-input.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-recorded-request-evidence.md`,
  `goal-extension-lifecycle-and-reachability.md`, and
  `goal-test-prep-and-replacement-proof.md`.
- Fidelity note: do not weaken developer-role final request-input proof into
  rendered Goal text, source tags, helper output, hidden classification,
  durable state alone, tool output, recorded evidence, or tests.

## Core Rule

A Goal has active model authority only when the current Goal steering item is
present in final model request input as an outer developer-role model item.

The behavior-level shape is:

```text
ResponseItem::Message.role = "developer"
ContentItem::InputText.text = rendered internal Goal context
internal context source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

The outer developer role carries authority. The internal-context text supplies
provenance and classification support when that representation is used, but
the source tag is not authority by itself.

`final model request input` means the logical request input list that becomes
`Prompt.input` and then `ResponsesApiRequest.input`, before any
transport-specific full request or incremental delta is derived. The final
request-input successor doc owns how a selected item is inserted, verified,
fingerprinted, committed, and carried after commit. This doc owns the
behavioral truth that nothing short of that final developer-role input is
active Goal authority.

Exactly one selected current Goal item may carry active Goal authority for a
request. Duplicate current Goal items, stale current Goal items, wrong-role
Goal-looking items, legacy artifacts, and pre-injected Goal-looking items are
cleanup or repair inputs for the final request-input seam; they are not
additional authority.

## Current Goal Facts

Durable Goal state is the source of truth for current Goal facts: identity,
objective, status, budget, usage, timestamps, active run state, and related
durable cadence facts.

Durable state is not model authority by itself. State may be used to render
current Goal text only when cadence and final request-input owners determine
that a Goal item is due or must be preserved for the request. An active durable
Goal alone must not emit steering, prove steering, or make a request cadence
required.

Runtime must not parse rendered Goal artifacts to recover active Goal state,
current objective, budget state, cadence intent, pending steering kind,
Continuation watermarks, or recorded request evidence. If structured durable
Goal state is absent, historical rendered Goal text does not resurrect an
active Goal.

## Helper And Artifact Boundary

Generic internal-context infrastructure may render source-tagged Goal text,
validate source names, and classify pure internal-context items for cleanup or
projection. It must not select cadence, choose the model role, construct
active Goal authority, consume pending intent, advance Continuation
suppression, write recorded evidence, or prove that the model received Goal
authority.

Legacy `<goal_context>` is artifact handling only. It may be recognized for
typed/materialized projection hiding, compaction or reconstruction cleanup,
and preventing old pure artifacts from being treated as ordinary prose. It
must not be used to recover durable state, infer objective text, decide
cadence, construct new active steering, preserve user-role steering, or
migrate old sessions into active Goals at request time.

Recorded request evidence is metadata about a committed final request-input
decision. Evidence may support replay, audit, reconstruction, and tests when
the evidence doc's persistence and pairing rules are satisfied. It is not
current Goal facts, cadence selection, pending intent storage, final-input
inspection replacement, model-visible input by itself, or rendered-text
recovery.

Tool output, app-server responses, UI state, typed/materialized projections,
raw response item notifications, classifier matches, rollout trace payloads,
ordinary rollout items, hidden metadata, helper outputs, reservations, and
pre-finalizer carry do not prove active Goal authority.

## Forbidden Authority Shapes

### Goal Every Ordinary Turn

Do not convert `active durable Goal exists` into a fresh full Goal reminder on
every ordinary user turn. Ordinary user turns are not cadence events. A user
turn may carry Goal steering only when cadence already made pending
Initial/ObjectiveUpdated/BudgetLimit intent due for that request, or when
request-local repair preserves cadence-required authority at a seam.

### User-Role Active Steering

Active Goal steering must not be user-role model input. Source-tagged text,
hidden classification, provenance, or a helper wrapper cannot compensate for
the wrong outer model role.

User-role active Goal steering has no compatibility exception. Any historical
or compatibility configuration that can affect active Goal steering role must
be removed, rejected, or hard-mapped so active Goal authority remains
developer-role. No conversion path may hardcode, default, infer, or preserve
user-role active Goal steering for a current Goal item.

### Rendered Text Or Source Tag As Authority

Rendered Goal text, `<goal_context>`, `<codex_internal_context source="goal">`,
`source = "goal"`, and source/provenance markers are not authority by
themselves. They may identify or render internal context; the final outer
developer-role model item is the authority source.

### Helper-Only Or Fake-Provenance Authority

Do not preserve `GoalContext`, `GoalContextRole`, active `<goal_context>`,
pre-shaper concrete Goal input injection, or any replacement helper-only layer
as active Goal authority. A helper that can render text or produce a
developer-role-looking object is not sufficient unless the selected current
item is present in final model request input.

### Runtime Archaeology

Do not parse rendered Goal artifacts, rollout items, raw notifications, traces,
projection output, or classifier matches to recover active Goal state,
objective text, budget facts, cadence intent, pending intent, committed carry,
evidence, or Continuation suppression.

### Tool Output, Projection, Raw, Or Hiddenness As Authority

Goal tools and app-server surfaces may report Goal state. UI or typed
projection may hide pure Goal/internal-context items. Raw response item
notifications remain raw unless the general raw-response contract changes.
None of those surfaces proves active model authority or current durable facts.

### Repair As Cadence

Request repair is a backstop for seams that would otherwise lose, duplicate,
stale, or downgrade cadence-required authority. Repair must not become the
primary mechanism that decides when Goal speaks, and it must not turn active
durable state alone into a fresh Goal item.

### Evidence Or Tests As Authority

Final payload tests and structured recorded request evidence can prove that a
request carried the selected developer-role item. They must not become the
authority mechanism. Tests are proof obligations, and evidence is committed
metadata; neither replaces the final request-input rule.

## Cross-Doc Boundaries

`goal-cadence-contract.md` owns when Goal steering is due, steering-kind
semantics, supersedence, ordinary user-turn limits, cadence-required authority,
and the rule that repair is not cadence.

`goal-durable-state-and-pending-intent.md` owns durable Goal facts, facts
version, pending non-Continuation intent, exact-key consumption, and state
non-ownership. This doc keeps only the behavior-level negative rule that state
alone is not steering.

`goal-final-request-input.md` owns per-attempt shaping, cleanup inside final
input, selected item identity, final payload proof, commit metadata,
fingerprints, Created-event commit, retry/follow-up behavior, and committed
current-turn carry. This doc owns why that seam is the only authority proof.

`goal-request-repair-and-artifact-classification.md` owns classifier outputs,
purity rules, wrong-role cleanup classification, and request-local repair
support. This doc owns why classifier and repair output cannot become
authority.

`goal-projection-reconstruction-and-raw-history.md` owns typed/materialized
projection hiding, raw notification behavior, compaction, reconstruction,
rollback, fork, and legacy artifact cleanup. This doc owns why those support
surfaces cannot recover authority from rendered text.

`goal-recorded-request-evidence.md` owns the structured evidence carrier,
persistence timing, replay semantics, fingerprint pairing, and evidence
failure policy. This doc owns only the behavior-level evidence boundary.

`goal-extension-lifecycle-and-reachability.md` owns extension lifecycle,
mutation/accounting participation, producer-facing cadence metadata, app-server
ordering, configuration treatment, and reachability. This doc owns the
behavior-level rule that no extension or compatibility path may emit user-role
active steering or prebuilt active model input as authority.

`goal-test-prep-and-replacement-proof.md` owns the replacement proof matrix,
baseline restoration, local overlay deletion, and snapshot posture. This doc
keeps local proof obligations for the behavior it owns.

## Local Proof Obligations

Behavior is proven at the final model payload, or by structured recorded
request evidence when replay or audit evidence is in scope and represents the
same logical final request input.

Behavior-level proof must show:

- the selected current Goal item is in final model request input
- the selected item is an outer `ResponseItem::Message` with role `developer`
- the item is current for the durable Goal identity and facts being steered
- durable Goal status allows the selected steering kind
- the text uses the current internal-context representation when that
  representation is part of the active design
- objective text is escaped as untrusted text
- no user-role active Goal item is accepted
- no active `<goal_context>`, `GoalContext`, `GoalContextRole`, helper output,
  projection output, raw notification, tool output, evidence record,
  reservation, same-turn metadata, or pre-finalizer carry is accepted as the
  authority proof
- duplicate, stale, wrong-role, legacy, and pre-injected Goal-looking items
  are rejected or routed to the owning cleanup/final-input seam

The test-prep successor doc owns the full matrix. This doc keeps the local
obligation that any behavior proof must inspect final request input, or
structured recorded request evidence tied to that same logical input, rather
than a substitute surface.

## Source Inputs And Coverage

This behavior surface was synthesized from the accepted successor topology,
architecture requirements, the grounding truth, primary cadence contract, final
request-input contract, evidence boundary, extension ownership boundary,
fake-shim removal map, repair/classifier integration, test deletion map, open
design posture, and Pass 2 / Pass 2B coverage and compression artifacts.

The Pass 2 and Pass 2B artifacts are coverage, interface, traceability, and
compression checks. They are not the writing order and are not successor
authority by themselves.
