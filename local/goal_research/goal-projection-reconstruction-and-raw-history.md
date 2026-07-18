# Goal Projection Reconstruction And Raw History

## Navigation Header

This successor doc is the support-history contract for Goal projection,
raw response item notifications, compaction, reconstruction, rollback, fork,
and legacy artifact cleanup. It answers how cleanup consumers behave without
becoming authority, cadence, durable state, final-input selection, or
evidence.

- Role: canonical support behavior for typed/materialized projection, raw
  notifications, contextual history boundaries, compaction, rollout
  reconstruction, rollback, fork, and legacy Goal artifact handling.
- Owns: hiding pure current Goal internal-context items and pure legacy
  artifacts from typed/materialized projections; raw notifications remaining
  raw; contextual parsing and user-turn boundary behavior; compaction
  filtering; reconstruction cleanup; rollback and fork cleanup effects; and
  legacy `<goal_context>` handling as cleanup only.
- Does not own: behavior-level authority, cadence selection, durable Goal
  facts, pending intent storage, exact-key consumption, selected final item
  construction, Created-event commit side effects, model-visible history-key
  semantics, structured evidence carrier semantics, request-local repair
  definitions, extension lifecycle, fake-shim demolition sequencing, or the
  replacement test matrix.
- Read with: `goal-authority-behavior.md`,
  `goal-cadence-contract.md`,
  `goal-durable-state-and-pending-intent.md`,
  `goal-final-request-input.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-recorded-request-evidence.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-extension-lifecycle-and-reachability.md`, and
  `goal-test-prep-and-replacement-proof.md`.
- Fidelity note: projection hiding, raw emission, compaction cleanup,
  reconstruction, rollback, fork, and legacy artifact detection must never
  recover active Goal facts, objectives, pending intent, recorded evidence,
  committed carry, Continuation suppression, cadence, or authority from
  rendered text.

## Core Rule

Projection, raw notification, compaction, reconstruction, rollback, fork, and
history-boundary logic are support surfaces. They may filter, hide, preserve,
or route Goal-looking items only according to the classifier, final-input,
history, and evidence contracts.

They are not active Goal authority. They do not decide when Goal speaks. They
do not create durable facts or pending intent. They do not prove that a model
request contained Goal steering. They do not write or infer structured
recorded request evidence. They do not recover state, objective text, budget
facts, committed carry, or Continuation watermarks from rendered artifacts.

Active Goal authority remains the final model request input containing the
selected current Goal item as an outer developer-role model item. This doc
only defines how non-authority support surfaces handle current pure Goal
internal-context items, pure legacy `<goal_context>` artifacts, mixed ordinary
prose, and structured evidence metadata when those surfaces encounter them.

The support logic consumes classifier meanings from
`goal-request-repair-and-artifact-classification.md`. It must not reinterpret
classifier output as authority, cadence, durable state, evidence, or a final
commit.

## Projection And Hiding

Typed and materialized user-visible projections must omit:

- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts

Typed and materialized projections must keep mixed ordinary user or developer
prose visible, even when that prose contains marker-like strings such as
legacy markers, current internal-context wrappers, or `source = "goal"`.

Projection hiding is not authority proof. It does not show that the model
received Goal steering, does not prove current durable Goal facts, and does
not create recorded evidence. Hiddenness is a user-visible projection choice,
not an active model-input contract.

Projection code must not call a current selected developer-role Goal item a
legacy artifact in a way that permits later code to delete or suppress the
cadence item that final request input must insert, verify, preserve, or
repair. Current pure Goal internal context and legacy artifacts are both
projected out of typed/materialized surfaces, but they are not the same
contract.

Typed or materialized thread-history surfaces that expose structured evidence
may expose it only as metadata. They must not render evidence as ordinary
conversation prose and must not treat evidence as a hidden model-visible Goal
item.

## Raw Response Item Notifications

Raw response item notifications remain raw.

Raw notifications emit actual Goal-looking `ResponseItem`s unchanged,
including:

- pure current Goal internal-context items
- pure legacy `<goal_context>` artifacts
- mixed Goal-looking ordinary prose

Typed/materialized hiding does not apply to raw notifications. Do not add
Goal-specific raw suppression for current Goal internal-context items or
legacy `<goal_context>` artifacts unless the general raw-response contract
changes for all hidden or internal items.

The local raw-response Goal suppression behavior is deletion terrain, not a
baseline to preserve. Replacement raw tests should prove the desired raw
contract rather than the old local suppression.

Structured recorded request evidence is not a `ResponseItem`. It must not be
emitted as a raw response item notification. Debug or replay surfaces may
expose typed evidence metadata only while preserving the metadata/prose
boundary owned by `goal-recorded-request-evidence.md`.

## Contextual Parsing And History Boundaries

Pure current Goal internal-context items must not become ordinary user-turn
boundaries.

Pure legacy `<goal_context>` artifacts must not become ordinary user-turn
boundaries.

Ordinary user messages still count as user-turn boundaries. Mixed ordinary
messages remain ordinary messages and must not be hidden, dropped, or treated
as contextual Goal-only fragments because they contain marker-like text.

Rollback trimming may remove pure contextual Goal or internal-context
fragments when they sit in rollback-trimmable context positions. That trimming
is cleanup. It is not cadence, not final-input proof, not durable mutation,
and not evidence.

These predicates are history and projection support. They are not cadence
predicates, and they do not decide whether a future request requires Goal
authority. Cadence-required authority remains owned by the cadence and final
request-input docs.

## Compaction

Compaction must filter pure legacy `<goal_context>` artifacts from compacted
or replacement history.

Compaction must filter stale or duplicate pure current Goal internal-context
items when they are not the selected current cadence item for the final
request. It may preserve or repair a single cadence-required item only under
the cadence, final-input, repair, and evidence contracts.

Mid-turn compaction may preserve committed Goal carry metadata for an item
already included in final request input and committed for the active turn. It
must not preserve authority by carrying pre-finalizer concrete
`ResponseItem` or `ResponseInputItem` values through compaction.

Compaction must not:

- treat filtering as model authority delivery
- turn active durable Goal state alone into a Goal item
- create pending Initial, ObjectiveUpdated, BudgetLimit, or Continuation
  intent
- synthesize Goal steering from cleanup output
- synthesize structured recorded request evidence
- synthesize committed current-turn carry
- recover current objective text, durable facts, budget facts, or pending
  intent from rendered text
- infer or advance Continuation suppression from artifacts, raw
  notifications, rollout trace payloads, classifier matches, or projections

Pure Goal cleanup does not change the model-visible history key by itself.
Compaction summaries that replace eligible progress may affect that key under
`goal-idle-history-lifecycle.md`. Compaction metadata with no model-visible
eligible-progress effect must not permit another automatic Continuation.

Compaction repair of a cadence-required Goal item is request-local by default.
It may reconstruct a lost recorded cadence item only when structured evidence
proves the prior commit and the evidence fingerprint rules allow that repair.

## Rollout Reconstruction

Rollout reconstruction must filter pure legacy `<goal_context>` artifacts
from replacement history and replayed response items.

It must filter, deduplicate, or route pure current Goal internal-context items
according to final request-input and request-repair rules. It must preserve
mixed ordinary messages.

Reconstruction must never recover these by parsing rendered Goal artifacts:

- active Goal state
- current objective text
- budget or usage facts
- pending Initial, ObjectiveUpdated, or BudgetLimit intent
- automatic Continuation suppression
- committed current-turn carry
- structured recorded request evidence

Ordinary rollout `ResponseItem`s, rollout trace payloads, raw notifications,
classifier matches, typed/materialized projections, helper output, and
rendered Goal text are not substitutes for structured committed Goal request
evidence.

If structured committed Goal request evidence proves that a cadence item was
committed and later lost by a reconstruction seam, repair may reconstruct the
recorded item only under the cadence, final-input, repair, and evidence
fingerprint contracts. Repair of current authority must render from current
durable Goal facts, not historical rendered text.

## Rollback And Fork

Rollback and fork operate on surviving history.

Rollback cleanup must ignore pure Goal fragments, legacy artifacts, and
evidence records that belong to rolled-back segments. Evidence whose paired
model-visible Goal item was rolled back is ignored for recorded-cadence repair
and Continuation suppression reconstruction.

Forked threads must not inherit active Goal facts from evidence, rendered
Goal text, legacy artifacts, projection output, raw notifications, rollout
trace payloads, or classifier matches. Current Goal facts and pending intent
must come from durable state or from an explicitly forked durable state model.

Rollback and fork recompute model-visible history keys from surviving
model-visible history and surviving durable or explicitly supported
evidence-derived suppression records. They must not scan old rendered Goal
text to infer the key, active state, objective, pending intent, committed
carry, or watermarks.

Surviving structured evidence remains metadata only. It may support replay or
repair only under the pairing, fingerprint, rollback, fork, and failure-policy
rules owned by `goal-recorded-request-evidence.md`.

## Legacy Artifact Handling

Legacy `<goal_context>` handling is cleanup only.

The remaining valid uses are:

- pure legacy artifact detection
- typed/materialized projection hiding of old pure artifacts
- compaction cleanup of old pure artifacts
- rollout reconstruction cleanup of old pure artifacts
- user-turn and contextual-boundary protection so pure artifacts are not
  treated as ordinary prose
- tests proving mixed content is preserved

Legacy artifacts must not:

- construct new active Goal steering
- recover durable Goal facts
- infer objective text
- infer budget or usage state
- create pending intent
- decide cadence
- advance or reconstruct Continuation suppression
- write or infer recorded request evidence
- preserve user-role active Goal steering
- migrate old sessions into active Goals at request time

Any remaining legacy artifact detector must remain narrow. It must not keep a
Goal-specific active-context abstraction alive after active
`GoalContext`, `GoalContextRole`, and active `<goal_context>` steering are
removed.

## Fake-Shim Consumer Replacement

This doc owns the replacement behavior for consumers that used to depend on
Goal-only shim predicates:

- typed and materialized event mapping
- app-server typed/materialized history projection
- contextual parsing and user-turn boundary checks
- compaction
- rollout reconstruction
- rollback and fork cleanup
- raw response item notification boundaries

Consumer replacement is part of active shim removal, but this doc does not
own demolition sequencing. The separate demolition terrain may track old
roots, but long-lived successor authority keeps only the replacement
consumer behavior.

Deleting old `is_goal_context_*` callsites without strict replacement
classification can either expose pure Goal steering in typed projections or
erase ordinary mixed user prose. Replacement consumers must use the strict
classifier meanings: pure current Goal internal context, pure legacy artifact,
pure non-Goal internal context, and mixed ordinary content.

Generic internal-context helpers may validate sources, render source-tagged
text, and parse pure internal-context wrappers. They must not construct
active model input, choose active role, select cadence, consume pending
intent, advance suppression, write evidence, or prove authority.

## Cross-Doc Boundaries

`goal-authority-behavior.md` owns why projection hiding, raw output,
compaction cleanup, reconstruction, rollback, fork, classifier matches,
evidence, and rendered text are not active Goal authority.

`goal-cadence-contract.md` owns when Goal steering is due,
cadence-required authority, ordinary user-turn limits, supersedence, and the
rule that repair is not cadence.

`goal-durable-state-and-pending-intent.md` owns current Goal facts, durable
facts version, pending non-Continuation intent, exact-key consumption, and
state-owned Continuation suppression records. This doc must not infer or
mutate those from cleanup artifacts.

`goal-final-request-input.md` owns selected item construction, cleanup effects
inside the finalized request input, final payload proof, commit metadata,
fingerprints, Created-event commit, retry/follow-up shaping, and committed
current-turn carry. This doc owns cleanup and projection effects outside that
final-input attempt.

`goal-idle-history-lifecycle.md` owns model-visible history-key semantics,
eligible progress projection, automatic Continuation selection, suppression
comparison, resume hydration, and how compaction or reconstruction affects
Continuation eligibility. This doc owns the cleanup behavior whose results
history projection excludes or accounts for.

`goal-recorded-request-evidence.md` owns evidence carrier shape,
persistence timing, replay pairing, fingerprint rules, rollback, fork,
compaction treatment, raw/typed projection treatment, and evidence failure
policy. This doc may route evidence as metadata only through those rules.

`goal-request-repair-and-artifact-classification.md` owns classifier outputs,
whole-message purity, wrong-role cleanup classification, request-local repair
semantics, repair reports, and helper non-ownership. This doc consumes those
meanings for projection, raw, compaction, reconstruction, rollback, fork, and
history-boundary effects.

`goal-extension-lifecycle-and-reachability.md` owns extension and app-server
lifecycle, mutation/accounting participation, reachability, configuration
treatment, and producer metadata routes. This doc only owns projection and
raw/history behavior exposed by those surfaces.

`goal-test-prep-and-replacement-proof.md` owns the global replacement proof
matrix. This doc keeps only projection, raw, compaction, reconstruction,
rollback, fork, and legacy cleanup local proof obligations.

## Local Proof Obligations

Projection/raw/reconstruction coverage must prove:

- typed/materialized projections hide pure current Goal internal-context
  items
- typed/materialized projections hide pure legacy `<goal_context>` artifacts
- typed/materialized projections keep mixed ordinary prose visible
- projection hiding is rejected as authority, evidence, durable facts, or
  final-input proof
- raw response item notifications emit actual current Goal-looking
  `ResponseItem`s unchanged
- raw response item notifications emit actual legacy `<goal_context>`
  `ResponseItem`s unchanged
- raw response item notifications emit mixed Goal-looking ordinary prose
  unchanged
- raw notifications do not emit structured evidence as conversation
  `ResponseItem`s
- pure current Goal internal-context items and pure legacy artifacts do not
  become ordinary user-turn boundaries
- ordinary user messages still count as user-turn boundaries
- mixed messages remain ordinary messages
- rollback trimming may remove only pure contextual fragments in
  rollback-trimmable positions
- compaction filters pure legacy artifacts
- compaction filters stale or duplicate pure current Goal internal-context
  items when they are not the selected current cadence item
- compaction preserves only committed carry metadata for an already committed
  final-input item, not pre-finalizer concrete model input
- compaction does not create steering, durable facts, pending intent,
  evidence, committed carry, active-state-only Goal items, objective text, or
  Continuation watermarks from cleanup
- pure Goal cleanup does not change the model-visible history key by itself
- rollout reconstruction filters pure legacy artifacts and cleans or
  deduplicates current pure Goal items according to final/repair rules
- rollout reconstruction preserves mixed ordinary messages
- reconstruction rejects ordinary rollout items, rollout trace payloads, raw
  notifications, classifier matches, projections, helper output, and rendered
  text as evidence substitutes
- rollback and fork operate only on surviving history and surviving durable or
  explicitly supported evidence-derived suppression records
- rollback and fork ignore rolled-back evidence and evidence whose paired
  model-visible Goal item was rolled back
- legacy `<goal_context>` alone never creates active Goal state, durable
  facts, pending intent, cadence, evidence, objective text, user-role
  steering, or Continuation suppression
- remaining legacy artifact detection does not keep active Goal-specific
  context architecture alive

The test-prep successor doc owns how these obligations join the broader final
payload, durable state, idle/history, evidence, extension, UI, and snapshot
proof matrix.

## Source Inputs And Coverage

This projection/reconstruction/raw-history surface was synthesized from the
accepted successor topology, architecture requirements, repair/classifier
integration contract, fake-shim removal map, recorded-evidence boundary,
final request-input contract, model-visible history-key contract, grounding
truth, primary cadence contract, idle lifecycle boundaries, durable-state
boundaries, test deletion map raw/test posture, and Pass 2 / Pass 2B coverage
and compression artifacts.

The Pass 2 and Pass 2B artifacts are coverage, interface, traceability, and
compression checks. They are not the writing order and are not successor
authority by themselves.
