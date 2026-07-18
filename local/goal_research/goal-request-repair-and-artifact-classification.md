# Goal Request Repair And Artifact Classification

## Navigation Header

This successor doc is the classifier and request-local repair contract for
Goal authority. It answers how Goal-looking items are classified and when
repair may support final request input without becoming authority or cadence.

- Role: canonical classifier and request-local repair support contract.
- Owns: classifier outputs; whole-message purity; pure current Goal
  internal-context classification; pure legacy `<goal_context>` artifact
  classification; non-Goal internal-context classification; mixed ordinary
  preservation; wrong-role current Goal cleanup-only status; request-local
  repair semantics; repair reports; and classifier/helper non-ownership.
- Does not own: behavior-level authority, cadence selection, durable Goal
  facts, pending intent storage, exact-key consumption, selected final item
  construction, final-input commit side effects, model-visible history-key
  semantics, recorded evidence persistence, typed/materialized projection
  behavior, raw notification behavior, compaction algorithms, rollout
  reconstruction, rollback, fork, extension lifecycle, fake-shim demolition
  sequencing, or the replacement test matrix.
- Primary pointers: `goal-final-request-input.md` for active final-input
  cleanup, `goal-projection-reconstruction-and-raw-history.md` for projection
  and history consumers, and `goal-recorded-request-evidence.md` only for
  strict lost-commit repair evidence.
- Fidelity note: classifiers and helper output are cleanup support. They do
  not decide cadence, prove authority, recover durable state, consume pending
  intent, advance suppression, write evidence, or commit delivery.

## Core Rule

Classifier output is not authority.

A classifier may identify current Goal internal context, legacy Goal
artifacts, non-Goal internal context, and mixed ordinary prose. That
classification supports final request-input cleanup, request-local repair,
typed/materialized projection, history-boundary handling, compaction cleanup,
and reconstruction cleanup. It does not prove that the model received active
Goal steering.

Active Goal authority is proven only by the final model request input
containing exactly one selected current Goal item as an outer developer-role
model item. The final request-input doc owns the insertion, verification,
selected item identity, commit metadata, final-input commit, and final payload
proof.

Repair is a request-local backstop. It may preserve or restore authority that
cadence already requires for the current request. It must not decide that Goal
should speak, turn active durable Goal state alone into steering, or make
historical rendered text into current Goal facts.

## Classifier Outputs

The shared classifier must distinguish at least:

```text
GoalItemClassification =
  CurrentGoalInternalContext {
    role,
    source: "goal",
    body_fingerprint,
    is_pure_item,
  }
  LegacyGoalContextArtifact {
    role,
    body_fingerprint,
    is_pure_item,
  }
  NonGoalInternalContext {
    role,
    source,
    is_pure_item,
  }
  MixedOrOrdinary
```

`CurrentGoalInternalContext` identifies the current source-tagged Goal
internal-context representation when that representation is used. It is
cleanup metadata. It becomes active authority only if final request input also
contains the selected current item as an outer developer-role message matching
the current durable Goal facts and selected cadence kind.

`LegacyGoalContextArtifact` identifies old pure `<goal_context>` messages.
Legacy artifacts are artifact handling only. They must not recover active Goal
facts, infer objective text, decide cadence, construct new active steering,
preserve user-role steering, or migrate old sessions into active Goals.

`NonGoalInternalContext` identifies pure internal context whose source is not
`goal`. It is not Goal cleanup, not Goal authority, and not a reason to remove
ordinary model-visible progress merely because it uses the same generic
wrapper shape.

`MixedOrOrdinary` is the default for any item that contains ordinary prose or
multiple meaningful contents, even if marker-like text appears inside it.
Mixed ordinary prose remains ordinary and visible to the consuming surface.

Classifier output may carry role, source or legacy identity, body
fingerprint, and purity. Those fields are diagnostics and cleanup inputs, not
authority predicates.

## Whole-Message Purity

A pure Goal or internal-context item must satisfy all of these conditions:

- it is a `ResponseItem::Message`
- its role is `user` or `developer` for cleanup classification purposes
- it has exactly one text content item
- after trimming outer whitespace, that text wholly matches the current
  internal-context representation or legacy `<goal_context>` representation
- no visible prose, tool content, additional text item, or other content exists
  outside the recognized representation

Wrong-role current Goal items may be classified for cleanup, but
classification does not make them valid authority. Final request-input
shaping owns whether a wrong-role item is removed, ignored, or replaced with
the selected developer-role item when cadence-required authority is due.

Mixed marker-like prose must not be hidden, dropped, deduplicated, repaired,
or treated as Goal authority merely because it contains
`<goal_context>`, `<codex_internal_context source="goal">`, `source = "goal"`,
or similar text.

The classifier must not expose a `has_current_goal_authority`-style predicate.
Current authority requires final input proof, not classification.

## Helper And Internal-Context Boundary

Generic internal-context infrastructure may own:

- source validation
- source-tagged internal-context rendering
- pure internal-context parsing
- source extraction
- optional ordinary helper constructors that do not claim Goal authority

Goal-specific cadence and final request-input code owns:

- durable Goal lookup
- steering-kind selection
- prompt-body rendering
- objective escaping
- selected item insertion or verification in final request input
- cleanup decisions for stale, duplicate, wrong-role, legacy, or pre-injected
  Goal-looking items inside the request being finalized
- repair report construction for that request
- commit metadata construction

Legacy Goal artifact code owns only pure `<goal_context>` artifact detection
and the classifier support needed by legacy cleanup consumers.

Helper output must not:

- construct active Goal `ResponseItem`s by itself
- choose the active model role
- select Initial, ObjectiveUpdated, BudgetLimit, or Continuation
- consume pending intent
- advance a Continuation suppression record
- write or infer recorded request evidence
- prove that final model request input contained Goal authority

`source = "goal"` is provenance and classification support. A user-role
source-tagged Goal item remains user-role model input and is invalid as
active Goal authority.

## Request-Local Repair

Request repair may act only when a seam would otherwise leave the current
request missing, stale, duplicated, wrong-role, or wrong-representation for
cadence-required Goal authority.

Cadence-required authority means one of:

- pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- automatic Continuation has been selected by the idle lifecycle for this
  request opportunity
- a seam is preserving or restoring a cadence item already required for this
  request

Repair may support:

- normal pending-intent delivery through final request-input shaping
- removal of stale current Goal internal-context items
- deduplication of duplicate current Goal items
- replacement or rejection of wrong-role current Goal-looking items
- removal or ignoring of legacy `<goal_context>` artifacts from active final
  request input
- repair reporting for tests and diagnostics
- restoration of a lost recorded cadence item only when structured committed
  evidence proves the prior commit and the evidence fingerprint rules allow it

Repair must render any current authority it restores from current durable Goal
facts. It must not render from pending-intent bodies, tool request bodies,
app-server request bodies, UI projections, historical rendered Goal artifacts,
ordinary rollout items, raw notifications, rollout trace payloads, classifier
output, or evidence records.

Repair does not record history by itself. Recording is limited to:

- the normal final-input commit path when pending Initial, ObjectiveUpdated,
  or BudgetLimit intent is actually delivered and consumed
- structured reconstruction of a previously committed cadence item when the
  recorded-evidence contract proves that item existed and was lost

Repair must not record a fresh Goal item merely because durable active Goal
state exists.

## Repair Decision Table

| Situation | Repair allowed? | Record to history? |
| --- | --- | --- |
| Ordinary user turn with valid current Goal authority already proven in final input | No | No |
| Ordinary user turn with active durable Goal state only and no cadence-required seam loss | No | No |
| Ordinary user turn with pending Initial, ObjectiveUpdated, or BudgetLimit intent | Yes, as cadence delivery through final input | Yes, only when final-input commit consumes the pending intent |
| Seam loses, stales, duplicates, downgrades, or omits cadence-required authority | Yes, request-local repair | No by default |
| Duplicate current Goal items | Yes, deduplicate or leave exactly one selected current item through final input | No new cadence event |
| Wrong-role current Goal item | Yes, classify for cleanup and replace or reject through final input when due | No by default |
| Legacy `<goal_context>` only and no durable Goal state | No active Goal repair; artifact classification only | No |
| Durable state and pending non-Continuation intent require Goal authority, but the next request has none | Yes, as pending-intent delivery through final input | Yes, only at matching final-input commit |
| Structured evidence proves a previously committed cadence item was lost | Yes, under evidence fingerprint and repair contracts | Yes, only if reconstructing recorded history |

Previous-response or model-context reuse is not proof by itself. It can avoid
repair only when the implementation can inspect or account for the finalized
logical request input and show that the selected current developer-role Goal
item is already present. Cross-turn `previous_response_id` reuse alone is not
current authority proof.

## Repair Report

Final request-input shaping owns the repair report for the attempt being
submitted. This doc owns what the report may mean.

A repair report is diagnostics and test support. It may record logical facts
such as:

- which classified items were found
- which stale, duplicate, wrong-role, legacy, or pre-injected items were
  removed, ignored, replaced, or preserved
- whether the selected item was inserted or an exact already-present item was
  verified
- why no repair was allowed
- which seam or request context made repair necessary

A repair report must not be treated as:

- cadence selection
- durable Goal facts
- pending intent
- exact-key consumption
- final payload proof
- committed current-turn carry
- recorded request evidence
- model-visible input

If a request does not reach final-input commit, the repair report does not
consume pending intent, advance suppression, or prove delivery.

## Consumer Routing

This doc defines classifier meaning and request-local repair semantics. The
consuming surfaces own their own effects:

- final request input owns active cleanup effects inside the `Vec<ResponseItem>`
  that becomes `Prompt.input`
- `goal-projection-reconstruction-and-raw-history.md` owns
  typed/materialized hiding, raw notification behavior, compaction cleanup,
  rollout reconstruction, rollback, fork, and user-turn boundary effects
- idle/history owns how pure Goal cleanup affects eligible progress
  projection and automatic Continuation suppression
- recorded evidence owns when structured metadata can prove a lost committed
  cadence item and how fingerprint pairing works
- durable state owns live facts, pending intent, exact-key consumption, and
  state-owned suppression records
- cadence owns whether Goal steering is due

Consumers must not reinterpret classifier output as authority. They must also
preserve the mixed-content rule: ordinary prose remains ordinary even when it
contains marker-like text.

Projection, raw notification, compaction, reconstruction, rollback, fork, and
history-boundary mechanics are owned by
`goal-projection-reconstruction-and-raw-history.md`. This doc supplies the
classification and repair semantics those mechanics must use.

## Fake-Shim Boundary

The active Goal-only shim is demolition terrain, not a compatibility layer.
This doc owns the replacement classifier and helper boundaries that remain
after active shim removal. It does not own demolition sequencing.

Active Goal steering must not use:

- `GoalContext`
- `GoalContextRole`
- active `<goal_context>` emission
- Goal-only active context predicates as authority
- user-role active Goal steering behavior
- request-time recovery of Goal state from rendered artifact text

Remaining legacy `<goal_context>` handling is limited to pure artifact
classification for cleanup consumers. It must not keep a Goal-specific active
context architecture alive.

## Primary Pointers

- `goal-authority-behavior.md` and `goal-cadence-contract.md` own authority
  and cadence; classifier, helper, and repair output cannot prove either.
- `goal-durable-state-and-pending-intent.md` owns durable facts and pending
  state. Classifiers and repair must not recover or mutate them from
  artifacts.
- `goal-final-request-input.md` owns the active callsite that applies these
  classifications to final request input and commits delivery side effects.
- `goal-idle-history-lifecycle.md` owns idle/history effects; repair of
  idle-created requests cannot create pending intent, consume unrelated
  intent, or advance suppression.
- Evidence, projection/raw, extension, and test-prep docs own their support
  surfaces; this doc keeps classifier and repair meanings plus local proof
  obligations.

## Local Proof Obligations

Classifier and repair coverage must prove:

- pure current Goal internal-context items are classified by source `goal`
- pure legacy `<goal_context>` items are classified as legacy artifacts
- pure non-Goal internal context is not classified as Goal
- whole-message purity requires one `ResponseItem::Message`, one text content
  item, a wholly recognized representation after trimming, and no mixed prose
- mixed marker-like ordinary prose remains visible and ordinary
- user-role current Goal internal context is cleanup-classified but invalid as
  active authority
- classifier output cannot select cadence, consume pending intent, advance
  suppression, write evidence, infer durable facts, or prove authority
- generic internal-context helper output cannot construct or commit active
  Goal authority by itself
- final request-input repair can deduplicate duplicate current Goal items
- wrong-role current Goal items are replaced or rejected only through final
  request input when cadence-required authority is due
- request-local repair restores cadence-required authority at seams without
  creating a new cadence event
- active durable Goal state alone is not repaired into steering
- repair records history only for normal final-input cadence consumption or
  structured reconstruction of a lost recorded cadence item
- repair reports remain diagnostics and cannot prove delivery or commit side
  effects
- legacy `<goal_context>` alone does not create active Goal state, durable
  facts, pending intent, or cadence

The projection/raw/compaction/reconstruction successor doc owns the proof
obligations for typed hiding, raw remaining raw, history-boundary behavior,
compaction cleanup, rollout reconstruction, rollback, and fork. The test-prep
successor doc owns how all repair/classification obligations join the broader
replacement matrix.
