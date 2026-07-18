# Goal Recorded Request Evidence

## Navigation Header

This successor doc is the evidence contract for committed Goal request
delivery. It answers what structured metadata may prove or replay a committed
final request-input decision.

- Role: canonical structured recorded request evidence contract.
- Owns: evidence carrier shape; schema version; thread, turn, and attempt
  identity; Goal id; cadence kind; facts version; model-visible history key;
  selected item fingerprint; request-input fingerprint; item index;
  inserted-or-verified status; commit point; commit timestamp; paired-write
  policy; replay pairing; rollback, fork, and compaction treatment; raw/typed
  projection treatment; and evidence-local proof obligations.
- Does not own: active Goal authority, cadence selection, durable Goal facts,
  pending intent storage, exact-key consumption, final request-input
  selection, selected item rendering, idle scheduling, model-visible history
  key semantics, classifier mechanics, request repair, extension lifecycle, or
  the replacement test matrix.
- Read with: `goal-authority-behavior.md`,
  `goal-cadence-contract.md`,
  `goal-durable-state-and-pending-intent.md`,
  `goal-final-request-input.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-projection-reconstruction-and-raw-history.md`, and
  `goal-test-prep-and-replacement-proof.md`.
- Fidelity note: evidence is metadata about a committed final request-input
  decision. It is not Goal authority, live durable correctness, pending
  intent, final-input selection, model input, or rendered-text recovery.

## Core Rule

Recorded request evidence records that a specific finalized model request
attempt committed the selected Goal item.

Evidence is valid only when it is created by the same commit path that handled
the exact finalized attempt after the request reaches the commit point. The
expected commit point is:

```text
ResponseEvent::Created
```

The evidence must represent the same logical final request input owned by
`goal-final-request-input.md`: the `Vec<ResponseItem>` that becomes
`Prompt.input` and then `ResponsesApiRequest.input`, before any
transport-specific delta is derived.

Evidence is not:

- active Goal authority
- a source of current Goal facts
- cadence selection
- pending intent storage
- durable exact-key consumption
- final-input inspection replacement
- model-visible input by itself
- repair authority
- active Goal recovery from rendered text

Final model payload inspection remains the primary live proof. Structured
recorded evidence is required only when rollout or thread-history records are
used as replay, audit, reconstruction, or suppression proof for Goal request
delivery. Ordinary rollout items, rollout trace payloads, raw notifications,
typed projections, classifier matches, helper output, and rendered Goal text
are not structured Goal request evidence.

## Correctness Split

The ownership split is:

- durable state owns current Goal facts, durable facts version, pending
  Initial, ObjectiveUpdated, and BudgetLimit intent, exact-key consumption,
  and the default state-owned automatic Continuation suppression record
- final request input owns per-attempt selection, rendering, insertion or
  verification, cleanup inside the finalized request, commit metadata,
  fingerprints, item index, and Created-event commit timing
- idle/history owns automatic Continuation selection, model-visible history
  key semantics, suppression comparison, and resume ordering
- evidence owns structured metadata showing that one finalized attempt reached
  the commit point, plus replay/audit treatment of that metadata

Live correctness defaults to durable state. Evidence may support
reconstruction or Continuation suppression only when it is persisted through a
non-best-effort path with an error policy equivalent to the behavior that
depends on it. A best-effort evidence append may support audit and tests, but
it must not be the only reason pending intent is considered consumed or an
automatic Continuation is considered suppressed after resume.

If durable structured Goal state is absent, evidence must not create an
active Goal. If durable state still considers non-Continuation intent pending,
evidence must not silently claim delivery unless an explicit recovery policy
handles the already-created request and reconciles durable state.

## Carrier

The logical carrier is a typed replay metadata item:

```text
RolloutItem::GoalRequestEvidence(CommittedGoalRequestEvidence)
```

An implementation may use an equivalent storage-neutral thread-history item
when it preserves the same fields, commit timing, pairing rules, replay
semantics, and failure policy.

The carrier is metadata-only. It must not implement or expose a
`to_model_input_item`-style path, and it must not materialize active steering
for the model. The ordinary committed Goal `ResponseItem` remains the
model-visible item. The evidence record proves commit identity for that item;
it does not replace it.

These are not valid carriers for structured evidence:

- ordinary `RolloutItem::ResponseItem`
- optional rollout trace request payloads
- raw response item notifications
- typed or materialized UI projections
- classifier matches
- helper-rendered Goal text
- rendered legacy `<goal_context>` text
- debug-only logs that can fail without affecting replay correctness

## Evidence Shape

The logical evidence shape is:

```text
CommittedGoalRequestEvidence {
  schema_version,
  thread_id,
  turn_id,
  attempt_ordinal,
  goal_id,
  kind: Initial | ObjectiveUpdated | BudgetLimit | Continuation,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
  request_input_fingerprint,
  item_index,
  inserted_or_verified,
  commit_point: ResponseCreated,
  committed_at_ms,
}
```

`schema_version` changes when fingerprint inputs, replay meaning, pairing
rules, or commit semantics change.

`thread_id`, `turn_id`, and `attempt_ordinal` identify the exact request
attempt. The attempt ordinal is allocated before per-attempt finalization and
is reused by the commit path.

`goal_id`, `kind`, and `facts_version` match the selected final-input commit
metadata. Evidence records the selected kind; it does not decide which kind
was due.

`model_visible_history_key` is computed by the history owner from the same
logical model-visible base input before inserting a new Goal item for this
attempt.

`item_fingerprint`, `request_input_fingerprint`, `item_index`, and
`inserted_or_verified` are the finalized-input identity produced by the
final-input owner. `inserted_or_verified` records whether finalization
inserted the selected item or accepted an already-present exact item after
cleanup.

`commit_point` records the commit point that authorized durable side effects
and evidence creation. Until the authority docs are updated with a stricter
proved point, that value is `ResponseCreated`.

`committed_at_ms` is evidence metadata for replay, audit, ordering, and
debugging. It is not cadence selection and is not a durable facts version.

Evidence must not store parsed objective text, rendered prompt body fields,
budget facts recovered from text, pending intent bodies, raw notification
payloads, projection output, or legacy marker-derived facts.

## Fingerprint Contract

`item_fingerprint` identifies the exact selected developer-role Goal
`ResponseItem` in the finalized logical request input.

It includes the logical fields that affect the model-visible item:

- outer `ResponseItem` variant
- model role
- text content and content ordering
- internal-context representation when that representation is used
- source tag and rendered Goal body
- message phase or equivalent request-visible fields when present

It excludes helper objects, classifier output, raw notifications, projection
state, rollout trace payloads, and removed Goal-looking artifacts.

`request_input_fingerprint` identifies the whole finalized logical
`Vec<ResponseItem>` that becomes the model request input. It includes:

- the selected Goal item
- every non-Goal item actually sent
- repair changes that affected the final input
- already-present exact selected item verification, when verification rather
  than insertion occurred

It excludes:

- stale, duplicate, wrong-role, legacy, or pre-injected Goal-looking items
  removed before submission
- helper output that did not reach final input
- raw notifications
- typed or materialized projection output
- rollout trace payloads
- transport-only WebSocket or incremental deltas that omit the full logical
  request input

Fingerprints may be stored as digests, but tests and replay code must be able
to construct the same digest from the captured finalized input. The
canonicalization must be stable across live commit and replay tests.

## Commit Timing

Evidence is appended only after the request reaches the commit point and the
commit path verifies that the finalized input still matches the commit
metadata:

- `request_input_fingerprint` still matches the finalized logical input
- `item_index` still identifies the selected item
- `item_fingerprint` still matches the selected item at that index

No evidence is written when:

- text is rendered
- a helper creates source-tagged Goal text
- a response item is constructed but not finalized
- finalization succeeds but the request is not submitted
- prompt construction fails
- stream setup fails before model execution
- submission fails before `ResponseEvent::Created`
- an idle hook fires
- a Goal-owned synthetic turn is reserved
- same-turn cadence recheck metadata is requested, accepted, rejected, or
  unavailable
- a request repair report exists without a committed finalized request
- a raw response notification or typed projection exposes Goal-looking content

Stream failure after `ResponseEvent::Created` does not invalidate committed
evidence, durable commit side effects, or committed current-turn carry. The
request entered model execution.

## Commit Ordering And Failure Policy

When evidence matters for replay or reconstruction correctness, the logical
ordering is:

```text
ResponseEvent::Created
  -> verify finalized input still matches GoalRequestCommit fingerprints
  -> apply durable correctness mutation
       Initial/ObjectiveUpdated/BudgetLimit: consume exact pending intent
       Continuation: advance durable or equivalent suppression record
  -> append committed Goal ResponseItem and GoalRequestEvidence through the
     thread-history seam as one logical batch
  -> update current-turn committed carry metadata
```

Durable correctness mutation happens before evidence append. Evidence must
not claim delivery while durable state still treats the same
non-Continuation intent as pending, unless the implementation names and tests
an explicit recovery path for a request that already reached Created.

When evidence is audit-only and durable state owns live correctness, evidence
append failure may leave live semantics intact. The failure still must be
observable to diagnostics or tests that rely on evidence.

When evidence is used as replay evidence, reconstruction evidence, or a
Continuation suppression basis, append failure cannot be fire-and-forget. The
implementation must choose one of these outcomes:

- retry the paired append until the record is durable
- reject the partial append and make the segment unreplayable as evidence
- surface the commit failure through a tested recovery policy
- retry or repair the durable correctness mutation under an explicit
  already-created-request recovery path

The committed Goal `ResponseItem` and the evidence metadata are one logical
thread-history write when replay evidence matters. A partial append that
leaves only one side of the pair must not be silently accepted as replayable
Goal evidence.

## Replay And Pairing

Evidence is replay metadata. It does not append rendered text to model
history by itself. The paired ordinary committed Goal `ResponseItem` remains
the model-visible history item.

Replay may reconstruct:

- committed delivery metadata for a finalized attempt
- committed current-turn carry metadata
- the latest committed automatic Continuation suppression triple when the
  evidence path is explicitly non-best-effort and survives replay

Replay must not reconstruct:

- active Goal facts
- pending Initial, ObjectiveUpdated, or BudgetLimit intent
- cadence selection
- current objective text
- budget facts
- pre-shaper concrete `ResponseItem` or `ResponseInputItem` carry
- model input from evidence alone

The pairing rule is strict:

```text
evidence.item_index and evidence.item_fingerprint must match the surviving
model-visible Goal ResponseItem for the finalized request input before the
evidence can be treated as committed Goal request evidence.
```

If the ordinary Goal item is absent but structured evidence proves that a
committed cadence item was lost at a seam, reconstruction or request repair
may proceed only through the repair and evidence contracts. Repair must
render current authority from current durable facts when current authority is
needed. It must not reuse historical rendered text as facts, cadence, pending
intent, or steering authority.

## Resume And Continuation Suppression

Resume loads live Goal facts and pending non-Continuation intent from durable
state. Evidence must not create an active Goal when durable state has none.

Automatic Continuation suppression after resume uses this precedence:

1. durable watermark or equivalent state-owned committed suppression record
2. explicitly supported non-best-effort structured committed Continuation
   evidence from surviving replay history
3. no reconstructed watermark

The third case is not permission to parse rendered Goal text or ordinary
rollout items. If durable Goal state exists but no durable or supported
evidence suppression basis exists, later automatic Continuation decisions
follow the idle/history and durable-state contracts. They must not infer a
watermark from historical prose, projection output, rollout trace, raw
notifications, classifier matches, or helper output.

Evidence-derived suppression records store the committed comparison triple:

```text
goal_id
model_visible_history_key
facts_version
```

They also retain commit identity such as turn id, attempt ordinal, selected
item fingerprint, and commit timestamp so replay can distinguish a committed
Continuation from a rendered artifact.

## Rollback, Fork, And Compaction

Rollback and fork operate on surviving replay history.

Evidence in a rolled-back segment is ignored. Evidence whose paired
model-visible Goal item was rolled back is ignored. Surviving evidence may
prove only the committed request represented by its fingerprints and surviving
pairing.

Forks do not inherit active Goal facts from evidence. A fork may carry
surviving committed metadata only as replay evidence. Current facts and
pending intent still come from durable state or an explicitly forked durable
state model.

If rollback removes committed Continuation evidence, the next Continuation
decision uses the surviving durable suppression record or surviving supported
evidence. It must not use old rendered text.

Compaction must not synthesize evidence. Evidence is not a `ResponseItem` and
is not part of replacement history text. Compaction must not create evidence
from:

- removed or summarized Goal-looking items
- durable active Goal state
- cleanup classifications
- committed current-turn carry
- rendered Goal text
- legacy markers

Older evidence may fall outside a replay suffix. Correctness across
compaction uses durable state by default, or an explicit structured
carry-forward evidence checkpoint when replay evidence must remain
available. Rollout-only Continuation suppression across compaction requires a
structured carry-forward record for the latest committed Continuation triple,
not copied rendered Goal text.

Pure Goal cleanup, legacy artifact removal, and removal of stale or duplicate
Goal-looking items do not by themselves change the evidence record and do not
create new evidence.

## Raw And Typed Projection

Evidence is not a raw response item. It must not be emitted through raw
response item notifications as if it were model-visible conversation content.

Actual Goal-looking `ResponseItem`s remain governed by the raw notification
contract owned by the cleanup/projection doc: raw notifications remain raw
unless the general raw-response contract changes.

Typed or materialized projections may hide pure Goal/internal-context items
from user-facing views. That hiding does not prove authority, does not prove
evidence, and does not create active Goal state. Debug surfaces may expose
typed evidence as metadata when they preserve the metadata/prose boundary.

## Cross-Doc Boundaries

`goal-authority-behavior.md` owns why evidence is not active Goal authority
and why proof substitutes are forbidden.

`goal-cadence-contract.md` owns which Goal steering kind is due and why
evidence does not select cadence.

`goal-durable-state-and-pending-intent.md` owns current Goal facts, pending
non-Continuation intent, exact-key consumption, and the default durable
Continuation suppression record. Evidence does not replace those live
correctness owners unless an equivalent non-best-effort path is explicitly
chosen and tested.

`goal-final-request-input.md` owns finalization, selected item identity,
commit metadata, fingerprints, item index, attempt ordinal, Created-event
commit timing, retry/follow-up shaping, and committed current-turn carry.
Evidence records that finalized-input identity; it does not produce it.

`goal-idle-history-lifecycle.md` owns idle stage order, synthetic request
metadata lifecycle, automatic Continuation selection, model-visible history
key semantics, suppression comparison, and resume hydration. Evidence may
feed suppression reconstruction only through the precedence and
non-best-effort rules in this doc.

`goal-request-repair-and-artifact-classification.md` owns classifier outputs,
purity rules, wrong-role cleanup classification, and request-local repair
semantics. Repair may consume evidence only through strict fingerprint
pairing; it must not parse rendered text.

`goal-projection-reconstruction-and-raw-history.md` owns typed/materialized
projection, raw notifications, contextual history boundaries, compaction,
rollout reconstruction, rollback, fork, and legacy artifact cleanup effects.
Those support surfaces may route evidence only through this doc's metadata
and pairing rules.

`goal-extension-lifecycle-and-reachability.md` owns producer lifecycle,
mutation/accounting routes, app-server and extension metadata, configuration
treatment, and reachability. Producers may create state and wake metadata, but
they do not write evidence or construct active model input.

`goal-test-prep-and-replacement-proof.md` owns the global replacement matrix.
This doc keeps only evidence-local proof obligations.

## Local Proof Obligations

Evidence coverage must prove:

- evidence is appended only after `ResponseEvent::Created`
- no evidence is appended for render-only, helper-only, accepted metadata,
  reservation, built-not-submitted, stream setup failure, or pre-Created
  submission failure paths
- stream failure after `ResponseEvent::Created` preserves committed evidence
  and durable commit effects
- evidence fingerprints match the exact selected developer-role Goal item and
  the whole finalized logical request input
- item index and inserted-or-verified status match the finalized input
- ordinary `RolloutItem::ResponseItem` alone is not evidence
- rollout trace payloads are not durable replay evidence
- raw response item notifications do not emit evidence as conversation
  content
- replay pairs evidence with a surviving model-visible Goal item by item
  index and fingerprint before treating it as committed evidence
- replay never parses rendered Goal text to recover facts, objective text,
  pending intent, cadence kind, or Continuation suppression
- evidence does not create active Goal state on resume
- Continuation suppression reconstruction uses durable/state-owned records
  first and structured evidence only under the non-best-effort policy
- rollback and fork ignore evidence outside surviving history and evidence
  whose paired item was rolled back
- compaction does not synthesize evidence from durable state, carry, cleanup,
  rendered text, or surviving Goal-looking items
- paired Goal item plus evidence append is atomic, retried, rejected, or made
  unreplayable when replay evidence matters
- evidence append failure is observable and cannot silently weaken live
  pending-intent or Continuation suppression correctness

The test-prep successor doc owns how these obligations join the broader final
payload, durable state, idle/history, cleanup/raw, extension, and UI proof
matrix.

## Source Inputs And Coverage

This evidence surface was synthesized from the accepted successor topology,
architecture requirements, recorded request evidence contract, final
request-input contract, grounding truth, primary cadence contract, durable
cadence state contract, idle continuation contract, model-visible history-key
contract, repair/classifier integration, recorded-evidence design-pass
handoff as provenance only, and Pass 2 / Pass 2B coverage and compression
artifacts.

The Pass 2 and Pass 2B artifacts are coverage, interface, traceability, and
compression checks. They are not the writing order and are not successor
authority by themselves.
