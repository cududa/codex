# Goal Readiness And Execution Handoff

## Navigation Header

This successor doc is the readiness and handoff gate for the Goal authority
rewrite. It answers when the architecture is ready to feed implementation
execution planning, and what must remain handoff posture rather than behavior
authority.

- Role: canonical design-readiness, execution-handoff, route-index boundary,
  and post-successor source-corpus posture.
- Owns: Ready/Open/Blocker status terms as design-input terms; readiness
  criteria; consolidated-doc posture; implementation execution-plan boundary;
  handoff requirements; source-corpus treatment after successor docs exist;
  and final cleanup/acceptance routing when gaps appear.
- Does not own: Goal behavior, cadence, durable state, final request-input
  shaping, idle/history lifecycle, recorded evidence, classifier/projection
  semantics, extension lifecycle, fake-shim demolition architecture, test
  matrix content, operations, navigation, or glossary semantics.
- Primary pointers: behavior, seam, extension, and test-prep successors own
  their rules; this doc gates readiness and implementation handoff posture.
- Fidelity note: Ready means ready as implementation-design input. It does not
  mean implementation complete, file-specific work planned, migrations named,
  tests written, or Rust validated.

## Core Rule

Readiness is a handoff gate, not a behavior engine.

An implementation execution plan may start only when the Goal authority and
support contracts are ready as design inputs and the remaining work is to
translate them into ordered, file-specific implementation slices.

Readiness must not become the easiest place to restate or change behavior. If
implementation planning discovers a missing cadence policy, durable state
shape, final-input ownership rule, idle/history behavior, evidence policy,
classifier semantic, projection/raw rule, extension route, or test proof
obligation, the work returns to the owning successor doc. The readiness doc
does not invent the missing architecture.

## Status Terms

Readiness status terms are design-input terms:

- Ready: the owning design artifact exists and answers the questions required
  for implementation planning. It can be translated into file-specific
  execution slices.
- Open: the owning design artifact does not yet answer the required design
  question, or a direct source conflict prevents the answer from being
  accepted.
- Blocker: implementation execution planning must not proceed until the item
  is resolved by the owning successor doc or explicitly superseded by a later
  authority update.

Ready does not mean:

- code has been written
- current Rust already matches the design
- concrete module names, function names, migrations, or test files are chosen
- every implementation slice is ordered
- final acceptance tests have passed

Open does not mean "safe to ignore." It means the owning design input is not
ready enough to hand to implementation planning.

Blocker does not grant readiness permission to choose behavior. It sends the
work back to the owner that can resolve the missing or conflicting design
input.

## Current Design-Input Status

The successor authority set is Ready for implementation execution planning
when these docs are accepted together:

- `goal-authority-behavior.md`
- `goal-cadence-contract.md`
- `goal-durable-state-and-pending-intent.md`
- `goal-final-request-input.md`
- `goal-idle-history-lifecycle.md`
- `goal-recorded-request-evidence.md`
- `goal-request-repair-and-artifact-classification.md`
- `goal-projection-reconstruction-and-raw-history.md`
- `goal-extension-lifecycle-and-reachability.md`
- `goal-test-prep-and-replacement-proof.md`
- `goal-readiness-and-execution-handoff.md`

That status means the design inputs are mature enough for an implementation
execution plan. The execution plan still must assign concrete files,
functions, migration names, test files, snapshot updates, sequencing, and
validation commands.

The core architecture is not reopened during execution planning unless a code
walk finds a direct conflict with the successor docs or a later authority
update explicitly supersedes them.

## Consolidated-Doc Posture

The replacement architecture should stay consolidated around the controlling
successor surfaces. Do not recreate separate long-lived docs for cadence
module interface, finalizer/commit dataflow, goals adapter, state-vs-behavior,
GoalStore interface, generic helper framework, navigation index, glossary, or
operations unless implementation work proves the consolidated successor docs
are too large or ambiguous to execute.

When extra design detail is needed, patch the owning successor doc first:

- durable facts, facts version, pending intent, exact-key consumption, and
  state-owned Continuation suppression go to
  `goal-durable-state-and-pending-intent.md`
- per-attempt shaping, cleanup inside final input, selected item identity,
  commit metadata, fingerprints, Created-event commit, retry/follow-up, and
  committed carry go to `goal-final-request-input.md`
- idle ordering, pending-work precedence, synthetic request metadata,
  model-visible history key, and Continuation suppression comparison go to
  `goal-idle-history-lifecycle.md`
- classifier and request-local repair semantics go to
  `goal-request-repair-and-artifact-classification.md`
- projection, raw notifications, compaction, reconstruction, rollback, fork,
  and legacy artifact handling go to
  `goal-projection-reconstruction-and-raw-history.md`
- extension lifecycle, app-server/core mutation ordering, reachability, and
  configuration compatibility go to
  `goal-extension-lifecycle-and-reachability.md`
- replacement proof matrix, upstream baseline, local overlay deletion,
  snapshots, and final proof layers go to
  `goal-test-prep-and-replacement-proof.md`

Readiness records whether those inputs are ready. It does not split or
supersede them.

## Execution Plan Requirements

An implementation execution plan produced from these successors must translate
design inputs into ordered, file-specific slices.

At minimum, the plan must identify:

- the concrete durable-state schema, migration files, state model changes,
  and state API operations for facts, facts version, pending intent,
  exact-key consumption, supersedence cleanup, and Continuation suppression
- the concrete final request-input shaping location that receives the logical
  model input before `Prompt.input` and client request input are derived
- the commit path that runs after `ResponseEvent::Created` or a later
  authority-approved model-execution point
- the retry, follow-up, current-turn carry, and request-metadata lifecycle
  integration points
- the idle lifecycle call sites, lock/reservation behavior, pending-work
  ordering, model-visible history key computation, and suppression storage or
  reconstruction path
- the strict classifier, request-local repair, projection, raw notification,
  compaction, reconstruction, rollback, fork, and legacy artifact replacement
  consumers
- the extension and app-server mutation paths, accounting participation,
  metadata-only wake or recheck adapters, configuration cleanup, and
  reachability outcomes
- the test-prep reset, local overlay deletion, upstream baseline restoration,
  replacement proof clusters, snapshot treatment, and final audit gates
- the focused validation commands appropriate for each slice

Any implementation route index, work-area grouping, or slice order is
execution sequencing only. Execution order does not become authority order,
drafting order, source-heading order, topology, or proof of behavior.

## Handoff Requirements

Every implementation handoff or slice plan must name:

- the successor docs that own the behavior or seam being changed
- the local proof obligations and the test-prep matrix rows the slice intends
  to satisfy
- any source docs that remain provenance only for why a successor rule exists
- the concrete files and functions to inspect or change
- which upstream baseline tests are retained, which local overlay tests are
  deleted, and which replacement tests are added or updated
- which snapshots are deleted, restored, updated, or added, if any
- the expected docs-only or Rust validation for the slice
- any unresolved Open or Blocker item and its owning successor doc

A handoff must not cite temporary route records as future authority for
successor readers. If a route detail is needed for implementation, it must be
represented in the owning successor doc or treated as implementation terrain.

Recorded request evidence is owned by `goal-recorded-request-evidence.md` and
this successor set. Earlier seam-design provenance is not required reader
input after the successor seam exists.

## Source-Corpus Posture After Successor Docs Exist

After the successor docs are accepted, the old source authority and support
docs become source corpus and provenance for coverage review. They are not
peer authority unless a later explicit update says otherwise.

Operational containers remain in place:

- `AGENTS.md` remains the operations container for reading posture, conflict
  handling, Direction Lock, compact non-negotiable reminders, and validation
  posture.
- `README.md` remains the navigation container and should route reader
  questions to the successor docs rather than summarizing full contracts.
- `CONTEXT.md` remains the glossary container. It defines terms only and does
  not carry edge-case behavior.

The old source docs remain useful for archaeology and source-coverage audits,
but future implementation planning should use the successor docs as the
controlling design inputs.

Pass 2 and Pass 2B artifacts remain coverage, interface, traceability, and
compression aids. They are not successor authority and are not implementation
plans.

## Demolition Terrain Boundary

Fake-shim demolition is separate transitional terrain. It is not a long-lived
successor authority doc and is not readiness-owned architecture.

Implementation planning may track old active roots, deletion work, reachable
extension producers, and stale-symbol audits, but the replacement behavior
belongs to the owning successor docs:

- final request input owns active shaping and commit replacement
- request repair and projection/raw/history docs own cleanup consumers
- extension lifecycle owns extension-local conversion, removal, or
  unreachable classification
- test prep owns false-compatibility test deletion and replacement proof

Readiness only checks that implementation handoff sends demolition discoveries
to those owners instead of preserving the old active shim or inventing a new
compatibility layer.

## Final Cleanup And Acceptance

WA06 is cleanup and acceptance only. It may verify replacement surfaces,
delete or classify old active-root terrain, run stale-symbol audits, and close
final acceptance evidence after the owning seams exist.

WA06 must not:

- invent cadence policy
- define durable state shape
- choose final request-input ownership
- repair idle/history semantics
- add evidence policy
- create classifier or projection behavior
- decide extension reachability
- turn audit regexes into architecture
- treat helper output, raw output, projection hiddenness, rollout trace,
  ordinary rollout items, rendered text, request metadata, or pre-finalizer
  carry as proof

If cleanup or final acceptance finds missing behavior, return to the owning
successor doc:

- behavior authority gaps go to `goal-authority-behavior.md`
- cadence gaps go to `goal-cadence-contract.md`
- state gaps go to `goal-durable-state-and-pending-intent.md`
- final payload or commit gaps go to `goal-final-request-input.md`
- idle/history gaps go to `goal-idle-history-lifecycle.md`
- evidence gaps go to `goal-recorded-request-evidence.md`
- classifier or repair gaps go to
  `goal-request-repair-and-artifact-classification.md`
- projection, raw, compaction, reconstruction, rollback, fork, or legacy gaps
  go to `goal-projection-reconstruction-and-raw-history.md`
- extension or app-server reachability gaps go to
  `goal-extension-lifecycle-and-reachability.md`
- proof-matrix, snapshot, or baseline gaps go to
  `goal-test-prep-and-replacement-proof.md`

Final stale-symbol audits are review gates. Every match must be inspected and
classified as deleted terrain, allowed legacy cleanup fixture, migration
comment, local planning note, or explicit rejection comment. Audit output is
not a source of behavior truth.

## Primary Pointers

- Behavior, cadence, durable-state, final-input, idle/history, evidence,
  cleanup, projection/raw, extension, and test-prep successors own their
  seams. This doc only gates readiness and handoff for implementing them.
- `goal-test-prep-and-replacement-proof.md` owns proof posture; this doc
  requires handoffs to reference it without turning tests into behavior
  authority.
- `AGENTS.md`, `README.md`, and `CONTEXT.md` remain operations, navigation,
  and glossary containers. This doc does not take over those roles.

## Local Proof Obligations

Readiness and handoff coverage must prove:

- Ready/Open/Blocker are used as design-input status terms, not
  implementation completion claims
- implementation execution planning starts from the accepted successor docs
  and does not reopen core architecture absent direct conflict
- the execution plan translates ready design inputs into file-specific slices
  without turning slice order into authority order
- consolidated successor docs remain the owner of their seams; new helper or
  adapter docs are not created unless the owning doc is first shown too large
  or ambiguous to execute
- final request input remains the authority seam; helper output and generic
  internal context do not become deliverable-level authority
- recorded request evidence remains a support seam for committed final input,
  replay, audit, and reconstruction; it does not become active authority
- test prep remains proof posture and upstream baseline handling, not behavior
  authority
- WA06 remains cleanup and acceptance only
- final audit gates inspect and classify matches instead of defining behavior
- operations, navigation, and glossary containers stay in their roles
- old source docs and coverage artifacts are source corpus, provenance, or
  coverage aids after successor docs are accepted, not peer successor
  authority
- any missing or conflicting behavior found during handoff is routed back to
  the owning successor doc
