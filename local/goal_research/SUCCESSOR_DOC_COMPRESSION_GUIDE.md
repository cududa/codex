# Successor Doc Compression Guide

This is a temporary support guide for hardening the drafted Goal successor docs
into a lean reader surface. It is not Goal authority, not a topology blueprint,
not source corpus, and not an implementation plan.

Use this guide during successor-doc reader-compression. After compression,
navigation cutover, and stale-reference cleanup are complete, delete this file
with the remaining support artifacts.

## Purpose

The successor docs should be easier for agents to read than the source corpus
and prep artifacts they replace. Compression should remove repeated scaffolding
while preserving behavior, ownership, negative rules, edge cases, and
implementation-shaped details that prevent wrong code.

The key rule:

```text
Keep the full rule in its owner.
Keep a short local reminder only where the local seam can violate it.
Use pointer-only references everywhere else.
Move broad proof or review-matrix thinking to test-prep/readiness owners.
```

## Inputs For Compression Sessions

Read only what the session needs:

- target successor docs for the session
- `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` for doc ownership and routing
- this guide for compression rules
- old source docs or coverage inventories only for a named disputed concept,
  suspected loss, or conflict

Do not require `PASS2B_TARGET_INTERFACES.md`,
`pass2b_target_interfaces/`, repeated-authority batch files, or drafting
protocol artifacts in ordinary compression prompts. Their useful repeated
authority rules have been carried forward here at the level needed for
compression.

## Compression Decisions

Use these categories when deciding whether repeated text stays.

Canonical owner:

- Carries the full contract.
- Owns the terms, behavior, edge cases, and review standard for that surface.
- May include enough local pointers to show where mechanics continue.

Local reminder:

- Stays only when the local seam can directly violate the rule.
- Must be short and seam-specific.
- Should not restate another doc's mechanics.

Pointer-only:

- Names the owner doc, or removes the duplicate mention entirely when the
  pointer is already obvious from the navigation header or reader map.
- Must not summarize another doc's rule in drifting prose.

Operational/test reminder:

- Belongs in `goal-test-prep-and-replacement-proof.md`,
  `goal-readiness-and-execution-handoff.md`, `AGENTS.md`, or `README.md` only
  when it helps execution, review, or navigation.
- Must not become the easiest-to-read replacement for behavior authority.

## Default Edit Rules

Usually delete or collapse:

- broad `Read with` lists
- long `Cross-Doc Boundaries` sections
- generic `Source Inputs And Coverage` sections
- repeated provenance paragraphs listing old source docs, Pass 2 artifacts, or
  drafting artifacts
- proof obligations that are really global review matrix items
- repeated explanations of why support surfaces are not authority when a short
  local reminder or pointer is enough

Usually preserve:

- `Navigation Header` role, owns, does-not-own, and fidelity warnings when they
  help the reader
- `Core Rule`
- owned behavior and mechanics
- explicit non-ownership
- negative authority rules
- edge cases, caveats, exceptions, stale/rollback/failure behavior
- implementation-shaped details that prevent wrong code
- narrow local proof obligations tied to the doc's own surface

When in doubt, ask:

```text
Would removing this sentence make an implementation or review agent likely to
put behavior in the wrong owner, weaken authority, miss an edge case, or prove
the wrong thing?
```

If yes, keep or rewrite it locally. If no, delete it or replace it with a
pointer.

## Repeated Authority Routing

Final request-input developer-role proof:

- Canonical: `goal-authority-behavior.md` for the behavior rule;
  `goal-final-request-input.md` for shaping, selected-item proof,
  fingerprints, and Created-event commit mechanics.
- Local reminders: cadence, request-repair/classification, extension, and
  test-prep surfaces may remind readers that they do not prove authority.
- Pointer-only: durable state, idle/history, evidence, readiness, navigation,
  and glossary surfaces point to behavior/final rather than restating
  mechanics.

Pending Initial, ObjectiveUpdated, and BudgetLimit until commit:

- Canonical: `goal-durable-state-and-pending-intent.md` for structured pending
  intent and exact-key APIs; `goal-final-request-input.md` for legal
  commit/consumption timing.
- Local reminders: cadence, idle/history, extension, and test-prep surfaces may
  keep narrow warnings for supersedence, idle delivery, external mutation, and
  proof coverage.
- Pointer-only: behavior, history support, evidence, cleanup, readiness, and
  containers should avoid restating the durable/final contract.

Exact-key consumption and supersedence cleanup:

- Canonical: durable state defines exact thread, goal, kind, and facts-version
  matching; final input defines when exact-key consumption may happen.
- Local reminders: cadence, idle/history, and test-prep may remind readers that
  stale synthetic turns, reservations, or broad cleanup do not consume by
  implication.
- Pointer-only: other docs should not use "clear pending intent" as a
  substitute for exact-key consumption.

Active durable state alone is not steering or cadence authority:

- Canonical: behavior, cadence, and durable state carry the negative rule at
  their own layers.
- Local reminders: final input, cleanup/projection, idle/history, extension,
  and test prep keep short seam warnings when their code path can mistake state
  for authority.
- Pointer-only: evidence, readiness, navigation, and glossary surfaces should
  not restate the full rule.

Ordinary user turns are not cadence events:

- Canonical: cadence owns the rule; idle/history owns pending-work precedence
  and idle ordering.
- Local reminders: final input may mention delivery of already-pending
  non-Continuation intent; test prep may keep coverage reminders.
- Pointer-only: other docs point to cadence/idle and must not recast the rule
  as "Goal only speaks from idle."

Automatic Continuation, resume, retry/follow-up metadata, and current-turn
carry:

- Canonical: idle/history owns idle selection, resume hydration, same-turn
  metadata lifecycle, and history/watermark semantics; final input owns
  commit-time carry and watermark advancement; durable state owns persisted
  suppression storage where used.
- Local reminders: cadence, evidence, cleanup/projection, and test prep may
  keep narrow reminders for precedence, metadata limits, compaction effects,
  and retry/failure tests.
- Pointer-only: behavior, extension, readiness, navigation, and glossary
  surfaces point to idle/history plus final/durable owners.

Request repair, classifiers, helper output, and projection are not authority:

- Canonical: request-repair/classification owns classifier and request-local
  repair semantics; projection/reconstruction/raw owns typed/materialized
  projection, raw behavior, compaction, reconstruction, rollback, and fork;
  behavior owns the negative authority rule; final input owns the active
  final-input repair callsite.
- Local reminders: extension and test prep may keep warnings where helper,
  provenance, or deletion terrain can look like authority.
- Pointer-only: cadence, durable, idle/history, evidence, readiness, and
  containers point to cleanup/final/behavior.

Structured recorded request evidence:

- Canonical: recorded evidence owns carrier, schema, fingerprints, persistence
  timing, replay/audit, rollback/fork/compaction treatment, and evidence
  tests; final input owns finalized-input identity and commit metadata emitted
  for evidence.
- Local reminders: durable state, idle/history, cleanup/projection, test prep,
  and readiness may remind readers that live correctness defaults to durable
  state and evidence is metadata only.
- Pointer-only: behavior, cadence, extension, navigation, and glossary
  surfaces must not imply evidence materializes active model input.

Extension reachability and steering-role compatibility:

- Canonical: extension lifecycle owns lifecycle, tools, accounting, metrics,
  mutation entry points, configuration compatibility, app-server/core ordering,
  and producer-facing typed cadence metadata.
- Local reminders: behavior, cadence, durable, final input, idle/history, and
  test prep may keep narrow reminders for no user-role compatibility, pending
  intent, final shaper routing, metadata-only same-turn delivery, deletion
  terrain, and extension baseline tests.
- Pointer-only: history support, evidence, cleanup/projection, readiness,
  navigation, and glossary surfaces point to extension/final/durable unless
  naming a narrow boundary.

Fake-shim removal:

- Canonical: no long-lived successor doc owns fake-shim demolition as
  permanent authority. It is transitional demolition terrain. Final input and
  cleanup/projection own replacement behavior for active shaping and consumers.
- Local reminders: behavior, extension, and test prep may keep short warnings
  explaining why the shim is invalid and which tests create false compatibility
  pressure.
- Pointer-only: cadence, durable, idle/history, evidence, readiness,
  navigation, and glossary surfaces should not restate deletion maps.

Test and readiness support:

- Canonical: test prep owns replacement proof matrix, upstream baseline
  restoration, local false-compatibility deletion, snapshots, and stale-symbol
  audits; readiness owns Ready/Open/Blocker and execution handoff criteria.
- Local reminders: behavior and seam docs keep proof obligations only for the
  behavior they own.
- Pointer-only: support docs must not replace behavior contracts.

## Compression Sessions

Run compression by clusters. Each session edits only its named successor docs.

### 1A Core Authority

Files:

- `goal-authority-behavior.md`
- `goal-cadence-contract.md`

Focus:

- Keep behavior/cadence negative rules crisp and canonical.
- Remove broad cross-doc restatements of mechanics owned by durable, final, or
  idle/history.
- Preserve ordinary-user-turn, repair-not-cadence, active-state-non-authority,
  and final developer-role proof boundaries.

### 1B Core Mechanics

Files:

- `goal-durable-state-and-pending-intent.md`
- `goal-final-request-input.md`

Focus:

- Keep exact durable facts, pending intent, exact-key consumption, final
  request-input shaping, selected item proof, commit, retry/follow-up, and
  carry rules.
- Remove repeated behavior/cadence explanations when a short local warning is
  enough.
- Preserve implementation-shaped details that distinguish state, selection,
  commit, evidence metadata, and current-turn carry.

### 1C Lifecycle And Evidence

Files:

- `goal-idle-history-lifecycle.md`
- `goal-recorded-request-evidence.md`

Focus:

- Keep idle ordering, pending-work precedence, pending durable intent delivery,
  automatic Continuation selection, history key, resume/restart, and evidence
  metadata rules.
- Remove duplicated final-input and durable mechanics except where needed as a
  local boundary.
- Preserve the split between live correctness, suppression records, committed
  evidence, replay/audit, rollback, fork, and compaction.

### 1D Cleanup Support

Files:

- `goal-request-repair-and-artifact-classification.md`
- `goal-projection-reconstruction-and-raw-history.md`
- `goal-extension-lifecycle-and-reachability.md`

Focus:

- Keep classifier, request-local repair, projection, raw, compaction,
  reconstruction, rollback/fork, extension lifecycle, mutation, accounting,
  configuration, and reachability details.
- Remove repeated behavior/cadence/final-input rules unless the local support
  seam can directly violate them.
- Preserve "support is not authority" boundaries only where they prevent the
  support mechanism from becoming the authority engine.

### 1E Proof And Handoff

Files:

- `goal-test-prep-and-replacement-proof.md`
- `goal-readiness-and-execution-handoff.md`

Focus:

- Keep proof matrix, baseline reset, local overlay deletion, snapshot posture,
  stale-symbol audits, Ready/Open/Blocker, and execution handoff requirements.
- Pull broad proof obligations out of other docs only if they are global
  matrix concerns.
- Do not let test prep or readiness become the easiest source for behavior
  rules.

## Section-Level Treatment

Navigation Header:

- Keep, but compress `Read with` into one short owner pointer or remove if the
  reader map already covers it.

Cross-Doc Boundaries:

- Replace with `Primary Pointers` only where the doc needs non-obvious owner
  routing.
- Prefer 3-6 bullets over paragraph lists of every successor doc.

Local Proof Obligations:

- Keep only doc-local proof requirements.
- Move or delete broad review matrix items that belong to test prep/readiness.

Source Inputs And Coverage:

- Delete after the successor doc is accepted, or collapse to one provenance
  line only when useful during an active compression session.
- Do not keep long lists of old source docs, Pass 2 artifacts, or drafting
  artifacts in the final reader surface.

## Stop Conditions

Stop and report a conflict if compression would:

- remove the only clear owner for a concept
- weaken final developer-role request-input authority
- turn a support mechanism into authority
- lose an edge case, caveat, exception, or negative rule
- make evidence, projection, helper output, or test output prove authority
- make ordinary user turns cadence events
- collapse exact-key consumption into broad cleanup
- require changing topology rather than compressing wording

## Verification

For each compression session:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

Use focused greps for stale section headings after the relevant session:

```text
rg -n "Read with:|Cross-Doc Boundaries|Source Inputs And Coverage" local/goal_research/goal-*.md
```

On Windows PowerShell, if the `goal-*.md` glob fails under `rg`, pass explicit
file paths or use `--glob "goal-*.md"` with the directory.

