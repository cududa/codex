# Successor-Doc Drafting Protocol

This file records the drafting protocol for Goal successor authority docs. It
is not a successor authority doc, not a topology redesign, not a source-heading
rewrite plan, and not an implementation plan.

## Purpose And Scope

Use this protocol to sequence successor-doc drafting and to identify the
required inputs for each successor surface before prose is written.

The accepted topology blueprint controls the successor doc list, ownership
boundaries, control order, container roles, repeated-authority routing posture,
and work-area reconciliation posture. Current source docs and prep artifacts
are source corpus and concept records; they inform successor prose but do not
dictate filename boundaries, drafting order, or sentence-level preservation.

This protocol covers Sessions 3.1 through 3.3:

- drafting order
- per-doc required inputs
- route-inventory intake rule
- stop conditions
- concept coverage checks
- traceability and source-coverage checks
- repeated-authority compression checks
- per-draft review checks
- work-area reconciliation review checks
- final readiness criteria

It does not define successor authority prose or an implementation plan.

## Common Drafting Inputs

Every successor doc uses these common inputs:

- `SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md`
- `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- `PASS2_CONCEPT_LEDGER.md`
- `PASS2_SECTION_TRACEABILITY.md`
- corrected current `goal_research` source docs for the doc's owned concepts
- `TEMP_136_ROUTE_DECISION_INVENTORY.md` as reconciliation/provenance input
  only
- `local/goal_136_plan/work-areas/implementation-route-index.md` as execution
  route context only

The topology blueprint is the active design input for the successor doc list,
ownership boundaries, source-corpus treatment, route reconciliation, and
container posture. The concept ledger and traceability inventory are coverage
inputs, not a writing order. The work-area route index is implementation
sequence context, not drafting order, authority order, or prose order.

## Drafting Order

Draft in this order. This is a dependency order for writing, not the successor
control/conflict order.

1. `goal-authority-behavior.md`
   - Establishes active Goal authority and forbidden authority shapes before
     any support seam can borrow those concepts.
2. `goal-cadence-contract.md`
   - Defines when Goal steering is due, superseded, repaired, or not cadence.
3. `goal-durable-state-and-pending-intent.md`
   - Defines durable facts, pending non-Continuation intent, facts version,
     atomic mutation, and exact-key consumption inputs used by final and idle.
4. `goal-final-request-input.md`
   - Defines the final model request-input seam, selected item proof, shaping,
     commit, carry metadata, and final payload proof.
5. `goal-idle-history-lifecycle.md`
   - Depends on durable intent, final commit, committed carry, history key,
     and watermark ownership boundaries.
6. `goal-recorded-request-evidence.md`
   - Depends on final request-input identity and commit metadata, and must be
     settled before later proof/replay checks rely on evidence.
7. `goal-request-repair-and-artifact-classification.md`
   - Defines classifier and request-local repair support before projection or
     reconstruction can mention classifier output.
8. `goal-projection-reconstruction-and-raw-history.md`
   - Defines typed/materialized projection, raw notifications, compaction,
     reconstruction, rollback, fork, and legacy artifact handling without
     becoming repair or authority.
9. `goal-extension-lifecycle-and-reachability.md`
   - Routes extension/app-server lifecycle, mutation, accounting, and
     reachability into the already-drafted behavior, cadence, durable, final,
     and idle/history seams.
10. `goal-test-prep-and-replacement-proof.md`
    - Collects reset, deletion, baseline, replacement proof, snapshot, and
      acceptance-test obligations after behavior and seam owners exist.
11. `goal-readiness-and-execution-handoff.md`
    - Records architecture readiness and implementation handoff obligations
      last, without owning behavior or tests as behavior authority.

## Per-Doc Required Inputs

| Successor doc | Required source inputs |
| --- | --- |
| `goal-authority-behavior.md` | Topology ownership skeleton and canonical/local/pointer routing; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; relevant behavior rows in `PASS2_CONCEPT_LEDGER.md` and `PASS2_SECTION_TRACEABILITY.md`; route-inventory decisions for active authority and final request input. |
| `goal-cadence-contract.md` | Topology ownership skeleton and routing rows for cadence, ordinary user turns, pending intent, and active-state negatives; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-final-request-input-and-commit.md`; cadence rows in the ledger and traceability inventory; route-inventory decisions for durable intent, idle stage order, same-turn metadata, and test proof. |
| `goal-durable-state-and-pending-intent.md` | Topology ownership skeleton and route reconciliation for WA01 and WA03 watermark storage; `goal-authority-durable-cadence-state.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; durable-state rows in the ledger and traceability inventory; route-inventory decisions for facts version, pending intent, exact-key consumption, state non-ownership, and state-owned Continuation suppression. |
| `goal-final-request-input.md` | Topology ownership skeleton and routing rows for final-input proof, commit, carry, evidence metadata, classifier cleanup, and extension non-ownership; `goal-authority-final-request-input-and-commit.md`; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-repair-classifier-integration.md`; final-input rows in the ledger and traceability inventory; route-inventory decisions for shaping, Created commit, committed carry, and metadata-only request lifecycle. |
| `goal-idle-history-lifecycle.md` | Topology ownership skeleton and WA03 reconciliation; `goal-authority-idle-continuation-contract.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-recorded-request-evidence.md`; idle/history rows in the ledger and traceability inventory; route-inventory decisions for idle ordering, `GoalTurnRequest` metadata, model-visible history key, state-owned watermark, resume hydration, stale synthetic abort, retry, and carry boundaries. |
| `goal-recorded-request-evidence.md` | Topology ownership skeleton and recorded-evidence routing row; `goal-authority-recorded-request-evidence.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-recorded-request-evidence-design-pass-handoff.md` as provenance only; evidence rows in the ledger and traceability inventory; route-inventory decisions for Created-event metadata, exact attempt/fingerprint shape, paired-write boundaries, and metadata-only replay/audit limits. |
| `goal-request-repair-and-artifact-classification.md` | Topology ownership skeleton and cleanup/classifier routing rows; `goal-authority-repair-classifier-integration.md`; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-fake-shim-removal-map.md`; classifier and repair rows in the ledger and traceability inventory; route-inventory decisions for generic internal-context helpers, classifier purity, request cleanup, and non-authority helper output. |
| `goal-projection-reconstruction-and-raw-history.md` | Topology ownership skeleton and projection/raw/reconstruction routing rows; `goal-authority-repair-classifier-integration.md`; `goal-authority-fake-shim-removal-map.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-test-deletion-map.md` for raw/test posture only; projection, raw, compaction, reconstruction, rollback, fork, and legacy artifact rows in the ledger and traceability inventory; route-inventory decisions for typed/materialized hiding, raw remaining raw, concrete-carry removal, and no rendered-text reconstruction. |
| `goal-extension-lifecycle-and-reachability.md` | Topology ownership skeleton and WA04 reconciliation; `goal-authority-ext-goal-ownership.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-fake-shim-removal-map.md`; `goal-test-deletion-map.md` for extension baseline caveats only; extension rows in the ledger and traceability inventory; route-inventory decisions for adapter/runtime conversion, blocker-only facade, app-server/core ordering, metadata/wake outcomes, steering-role compatibility removal, and extension proof route. |
| `goal-test-prep-and-replacement-proof.md` | Topology ownership skeleton, operational/test reminder routing, and WA00/WA06 reconciliation; `goal-test-deletion-map.md`; `goal-authority-grounding-truth.md` acceptance standard; `goal-authority-primary-cadence-contract.md` verification clauses; `goal-authority-final-request-input-and-commit.md` tests; `goal-authority-idle-continuation-contract.md` tests; `goal-authority-model-visible-history-key.md` tests; `goal-authority-recorded-request-evidence.md` tests; `goal-authority-repair-classifier-integration.md` tests; `goal-authority-ext-goal-ownership.md` tests; `goal-authority-open-design-deliverables.md` for readiness boundary only; test-prep rows in the ledger and traceability inventory; route-inventory decisions for false-compatibility deletion, upstream baseline, replacement proof layers, and final audit gates as review gates. |
| `goal-readiness-and-execution-handoff.md` | Topology ownership skeleton and WA06/readiness reconciliation; `goal-authority-open-design-deliverables.md`; `AGENTS.md`; `README.md`; `SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md`; `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`; `goal-test-deletion-map.md` for handoff proof posture only; readiness rows in the ledger and traceability inventory; route-inventory decisions for route index as execution order only, standalone successor posture, fake-shim demolition as separate terrain, and WA06 as cleanup/acceptance only. |

## Concept Coverage Checklist

Use this checklist after drafting each successor doc. It is a coverage check,
not prose order.

| Successor doc | Coverage checks |
| --- | --- |
| `goal-authority-behavior.md` | Covers `T-BEHAVIOR`. Account for active Goal authority, developer-role final request-input proof at the behavior layer, active durable state non-authority, runtime archaeology, tool output, UI/projection hiddenness, helper/provenance output, rendered markers, user-role steering, and repair-as-cadence as forbidden authority shapes. Keep only pointers or narrow reminders for cadence, durable state, final shaping, cleanup, extension, evidence, and tests. |
| `goal-cadence-contract.md` | Covers `T-CADENCE`. Account for Initial, ObjectiveUpdated, BudgetLimit, automatic Continuation, precedence, supersedence, ordinary user-turn limits, cadence-required authority, request repair not being cadence, active durable state alone not requiring steering, and metadata-only same-turn recheck boundaries. Point to durable state for persisted intent and to final input for delivery proof. |
| `goal-durable-state-and-pending-intent.md` | Covers `T-DURABLE`. Account for durable facts, facts version, pending Initial/ObjectiveUpdated/BudgetLimit, atomic facts-plus-intent mutation, supersedence cleanup, exact-key consumption, state-owned Continuation suppression where selected, and the rule that Continuation is not persisted pending intent. State APIs must not render, select authority, construct model input, write evidence, or consume without final-input commit. |
| `goal-final-request-input.md` | Covers `T-FINAL`. Account for the logical final `Vec<ResponseItem>` before `Prompt.input`, per-attempt shaping, selected item identity, developer-role construction, cleanup inside shaping, retry/follow-up shaping, Created-event commit, commit metadata, fingerprints, evidence metadata production, current-turn committed carry, and final payload proof. Exclude pre-shaper concrete carry and any commit before model execution starts. |
| `goal-idle-history-lifecycle.md` | Covers `T-IDLE` and `T-HISTORY`. Account for legal idle callers, stage order, pending work precedence, pending durable intent delivery, automatic Continuation selection, same-turn metadata lifecycle, stale synthetic abort, resume hydration, model-visible history key, eligible progress projection, Continuation watermark comparison/reconstruction, and default state-owned suppression. Keep idle scheduling, history key, watermark storage, and final commit advancement distinct. |
| `goal-recorded-request-evidence.md` | Covers `T-EVIDENCE`. Account for structured Created-event metadata, carrier shape, schema version, thread/turn/attempt identity, goal id, kind, facts version, model-visible history key, item and request fingerprints, selected item index, inserted-or-verified status, commit point, paired-write policy when replay evidence matters, rollback/fork/compaction treatment, replay, and audit. Preserve that evidence is metadata only, not live cadence authority, pending intent, final-input selection, durable live correctness by default, or active model input. |
| `goal-request-repair-and-artifact-classification.md` | Covers the classifier and request-repair subset of `T-CLEANUP`. Account for pure current Goal internal-context classification, pure legacy artifact classification, non-Goal internal context, mixed ordinary preservation, whole-message purity, wrong-role current Goal cleanup-only status, request-local repair, and repair reports. Preserve that classifier/helper output is not authority, cadence, durable state, evidence, or final commit. |
| `goal-projection-reconstruction-and-raw-history.md` | Covers the projection, raw, compaction, reconstruction, rollback, fork, history-boundary, and legacy-artifact subset of `T-CLEANUP`, plus the successor-owned parts of old `T-SHIM` terrain. Account for typed/materialized hiding, raw notifications remaining raw, compaction filtering, reconstruction cleanup, rollback/fork effects, legacy artifact handling, and user-turn boundaries. Do not synthesize steering, evidence, pending intent, Goal facts, objectives, or watermarks from rendered text. |
| `goal-extension-lifecycle-and-reachability.md` | Covers `T-EXT`. Account for extension lifecycle, tools, accounting, metrics, events, mutation entry points, adapter/runtime conversion, typed cadence/wake requests, app-server/core mutation ordering, steering-role compatibility removal or hard-map, metadata-only same-turn outcomes, and reachability. Preserve that extension/app-server code does not construct active model input, consume pending intent, advance watermarks, write evidence, or adopt full `GoalService` or a facade except under the named blocker condition. |
| `goal-test-prep-and-replacement-proof.md` | Covers `T-TEST-PREP`. Account for local overlay deletion, upstream baseline restoration, replacement proof matrix, extension baseline caveat, snapshot posture, final payload/evidence/state/projection/raw proof layers, and audit gates as review gates. Keep tests as proof obligations; they do not define behavior, product redesign, module names, or architecture. |
| `goal-readiness-and-execution-handoff.md` | Covers `T-READINESS` and handoff-facing parts of operations/navigation source corpus. Account for Ready/Open/Blocker terms, consolidated-doc posture, readiness criteria as design-input status, handoff requirements, source-corpus treatment after successor docs exist, route index as execution order only, and fake-shim demolition as separate terrain. Do not let readiness own behavior, tests, demolition architecture, operations, navigation, or glossary semantics. |

No long-lived successor doc owns old `T-SHIM` as permanent authority. Account
for those rows as separate demolition terrain, replacement behavior in
behavior/final/cleanup/extension/test surfaces, or handoff posture. Stop if a
draft would require fake-shim demolition to become a permanent successor
authority surface.

## Traceability Check Method

Run this check after each successor doc draft:

1. Map the successor doc to its target home keys using the checklist above and
   the accepted topology blueprint.
2. In `PASS2_SECTION_TRACEABILITY.md`, find every source row whose proposed
   home includes that key, plus split rows where the doc owns one part of the
   concept.
3. Re-read the original source sections for those rows. Do not rely only on
   ledger summaries, target keys, or traceability table wording.
4. Mark each relevant row as one of: canonical owner text, local reminder,
   pointer-only reference, operational/test reminder, provenance-only source,
   intentionally outside this doc, or stop condition.
5. Check `PASS2_CONCEPT_LEDGER.md` rows whose target homes include the doc's
   key. Every high-risk, cross-cutting, or test-critical row must be accounted
   for by owned prose, a local seam reminder, a pointer, or a named stop.
6. For split concepts, confirm the draft names the local portion without
   absorbing another doc's semantics.
7. Confirm source section order did not become prose order by default.
8. If a relevant source clause, exception, negative rule, or
   implementation-relevant detail is missing, patch the draft before moving to
   the next doc. If the missing item has no topology owner, stop.

## Source-Coverage Expectations

Every relevant current source section must be accounted for before a successor
doc can be considered complete for review.

Traceability checks coverage and loss. They do not supply drafting order,
section order, headings, filenames, or final prose. A section can be fully
covered by one canonical owner, split across successor docs, reduced to a
local reminder, routed by pointer, retained only as operational/test support,
or treated as provenance after its concept is carried elsewhere.

When a source row is split, record which successor doc owns the full contract
and which docs keep local reminders or pointers. When a row is marked `Leave`,
confirm it belongs in `AGENTS.md`, `README.md`, or `CONTEXT.md` rather than a
successor authority doc. When a row references route material, confirm the
settled decision is already represented in corrected local source docs or the
topology blueprint; do not cite temporary route files as future authority.

## Repeated-Authority Compression Rules

Use `pass2b_target_interfaces/repeated-authority-canonicalization.md`, its
batch files, and the topology blueprint's Canonical / Local / Pointer Routing
section as compression guidance.

- Canonical owners carry the full source-backed contract, including negative
  rules, exceptions, edge cases, and implementation-relevant detail.
- Local reminders stay only where the local seam can directly violate the
  rule. Keep them short, but strong enough to prevent the local failure mode.
- Pointer-only references go where another doc owns the semantics and the
  local seam cannot directly violate the rule.
- Operational and test reminders stay short and explicitly non-authoritative.
  They may name proof obligations or routing, but they must not become behavior
  contracts.
- Removing duplicate wording is valid only after the concept remains covered
  by the canonical owner, required local reminders, and traceability record.
- Batch order in the repeated-authority workspace is a compression review aid,
  not drafting order.

## Compression Tripwires

Do not flatten negative rules into a generic "not authority" sentence when the
source distinguishes user-role steering, rendered markers, helper/provenance
output, hidden projection, raw notifications, runtime archaeology, repair as
cadence, evidence, durable state, or tool output.

Do not erase exceptions, including ordinary turns delivering already-pending
non-Continuation intent, retry before commit leaving intent pending,
metadata-only same-turn recheck, state-owned Continuation suppression without
persisted Continuation intent, raw notifications remaining raw unless the
general raw contract changes, extension facade only under the named blocker,
and evidence-backed replay only under the stated persistence/error-policy
boundary.

Do not move behavior into `README.md`, `AGENTS.md`, `CONTEXT.md`,
`goal-readiness-and-execution-handoff.md`,
`goal-recorded-request-evidence.md`, or
`goal-test-prep-and-replacement-proof.md` because those surfaces are easier to
read.

Do not preserve every repeated sentence when the concept is retained. Preserve
the concept, owner, exception, local failure warning, and source coverage
record instead.

## Draft Review Checklist

Run this review after each successor doc draft, after concept coverage,
traceability, and compression checks.

- Concept loss: every owned concept from the topology, ledger, traceability
  rows, corrected source docs, and represented route decisions is present
  either as canonical text, a local reminder, a pointer, an operational/test
  reminder, or an explicit stop.
- Weakened authority: active developer-role final request input, cadence due
  rules, durable pending intent, exact-key consumption, Created-event commit,
  metadata-only evidence, raw behavior, and extension non-ownership are not
  softened into optional guidance.
- Duplicated or drifting authority: repeated clauses follow canonical/local/
  pointer routing, and non-owner docs do not restate another doc's full
  contract in a way that can drift.
- Support mechanism promoted to authority: evidence, classifiers, helpers,
  projection hiding, raw notifications, current-turn carry, readiness, tests,
  operations, navigation, glossary, route records, and implementation anchors
  do not become behavior, cadence, durable-state, or final-input authority.
- Misplaced implementation detail: implementation-shaped route details are
  included only where they clarify a successor-owned seam; exact file/module/
  API names stay terrain unless the topology or corrected source doc makes
  them part of the contract.
- Omitted edge case, caveat, exception, or negative rule: preserve the
  non-obvious cases called out by traceability `Review debt`, ledger
  `High-risk`, repeated-authority batches, and the route inventory. Do not
  compress them into generic statements.
- Source coverage gap: every relevant current source section is accounted for
  by the traceability method. A row marked `Leave` must remain in the correct
  container, and a split row must name the local portion without absorbing
  another doc's owner semantics.
- Route reconciliation gap: every needed v136 decision for the doc is already
  represented in corrected local source docs or the topology blueprint, then
  absorbed into successor prose where it preserves the underlying concept.

Review findings must name exact files and sections. Small fixes inside the
draft are allowed during the drafting session; topology gaps, missing owners,
or source/route conflicts stop the affected doc.

## Route-Inventory Intake Rule

Use `TEMP_136_ROUTE_DECISION_INVENTORY.md` only to verify that settled v136
route decisions have already been absorbed into corrected local source docs
and the accepted topology blueprint.

Successor prose must stand on corrected local `goal_research` docs and the
topology blueprint. It must not cite `TEMP_136_ROUTE_DECISION_INVENTORY.md`,
`TEMP_136_BLUEPRINT_SYNC_*`, or `local/goal_136_plan` as future authority for
successor readers.

If a needed route decision appears only in the temporary route inventory and is
not represented in corrected local source docs or the topology blueprint, stop
and name the missing owner. Do not make the successor doc depend on the
temporary inventory.

If the temporary route inventory appears to conflict with a corrected local
source doc or the topology blueprint, stop and name the exact source section
and route-inventory decision before drafting.

## Work-Area Reconciliation Review

Use the topology blueprint's settled route reconciliation map as the primary
work-area routing guide. Use `TEMP_136_ROUTE_DECISION_INVENTORY.md` to check
provenance and coverage. Use `implementation-route-index.md` only to
understand implementation pass grouping; do not let its order become drafting
order, authority order, or prose structure.

For each successor doc draft:

1. Identify the work areas that touch the doc's owned concepts.
2. Confirm the route decisions clarify implementation-shaped detail rather
   than changing the underlying Goal concept.
3. Absorb the decision into successor prose when it preserves the concept and
   belongs to the doc's ownership boundary.
4. Use local reminders or pointer-only references when the decision belongs to
   another doc but this doc can violate or needs to find the rule.
5. Leave temporary route records out of successor authority prose. Future
   readers must not need `TEMP_136_ROUTE_DECISION_INVENTORY.md`,
   `local/goal_136_plan`, or packet files to learn the settled rule.
6. Stop if a needed route decision is not represented in corrected local docs
   or the topology blueprint.
7. Stop if a route decision drops, inverts, or weakens a current source
   concept instead of sharpening implementation detail.

Expected work-area review ownership:

- WA00: `goal-test-prep-and-replacement-proof.md` owns test reset and
  upstream baseline; behavior and seam docs keep local proof obligations.
- WA01: `goal-durable-state-and-pending-intent.md` owns facts version,
  pending intent, atomic mutation, exact-key consumption, and state
  non-ownership; final input owns commit timing.
- WA02: `goal-final-request-input.md` owns per-attempt shaping, selected item
  proof, Created-event commit, committed carry metadata, fingerprints, and
  evidence metadata production.
- WA03: `goal-idle-history-lifecycle.md` owns idle ordering, pending intent
  delivery from idle, automatic Continuation, model-visible history key,
  metadata lifecycle, resume, retry, stale synthetic abort, and watermark
  semantics, with durable/final owners kept distinct.
- WA04: `goal-extension-lifecycle-and-reachability.md` owns adapter/runtime
  conversion, app-server/core mutation ordering, metadata-only wake/recheck,
  steering-role compatibility removal, reachability, and extension proof
  routing.
- WA05: cleanup is split: request repair/classification owns classifier and
  request-local repair; projection/reconstruction/raw history owns typed
  projection, raw behavior, compaction, reconstruction, rollback, and fork.
- WA06: cleanup and acceptance only. Missing architecture returns to the
  earlier owning successor surface; final audit gates are review gates, not
  architecture.

True source/route conflict stops drafting for the affected doc. Name the
source section, route decision, and successor owner that would need correction
before prose can continue.

## Final Protocol Stop Conditions

Stop before drafting successor authority prose if any of these conditions
appears:

- A needed successor concept has no owner in the accepted topology blueprint.
- A needed source section has no successor owner, local reminder, pointer,
  operational/test container, or provenance-only disposition.
- The accepted topology would need redesign, a new long-lived successor doc,
  or a changed container role to draft the requested surface.
- A needed v136 route decision is not represented in corrected local source
  docs or the topology blueprint.
- A current source concept and route decision truly conflict, including any
  route decision that drops, inverts, or weakens a source concept.
- Corrected current source docs say the opposite of the topology blueprint.
- A non-negotiable cannot be preserved without changing the accepted topology
  or moving behavior into a support/container surface.
- Drafting would require `goal_136_plan` or a temporary packet file to become
  future authority for successor readers.
- The draft would use source-section order, Pass 2 target-key order, repeated-
  authority batch order, or work-area route order as the default prose order.
- A support surface would need to own behavior, cadence, durable state, final
  input, evidence, extension mutation, test proof, or readiness outside the
  ownership boundaries assigned by the topology.

When stopping, name the missing owner or conflict with exact files and
sections, and do not patch topology or successor authority prose in the same
step.

## Final Readiness Criteria

The drafting protocol is ready to hand to the first successor-doc drafting
session only when all of these are true:

- Drafting order exists and is explicitly not authority order, source-heading
  order, Pass 2 target-key order, or work-area route order.
- Per-doc required inputs exist for every successor doc in the topology
  blueprint.
- Concept coverage checks exist for every successor doc and include owner,
  local-reminder, pointer, support, and no-long-lived-`T-SHIM` handling.
- Traceability and source-coverage methods exist and require every relevant
  current source section to be accounted for without turning section order into
  prose order.
- Repeated-authority compression rules exist and preserve canonical owners,
  local seam reminders, pointer-only references, and non-authoritative
  operational/test reminders.
- Work-area reconciliation rules exist and prevent temporary route records
  from becoming future authority.
- Draft review checklist exists and checks concept loss, weakened authority,
  drifting duplication, support-as-authority, misplaced implementation detail,
  omitted edge cases, source coverage gaps, and route reconciliation gaps.
- Stop conditions exist for topology gaps, missing source owners,
  unrepresented route decisions, source/route conflicts, non-negotiable
  preservation failures, and section-order or target-key-order drafting
  temptation.

If all readiness criteria pass, the protocol is complete enough to feed the
first successor-doc drafting session. If any criterion fails, update this
protocol before drafting successor authority prose.
