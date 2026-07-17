# 136 Blueprint Sync Scope

This is a temporary Packet 2 scoping artifact. It is not successor authority,
does not rewrite current authority docs, and does not update the topology
blueprint.

## Status

- Packet: 2 Blueprint Standalone Correction And Authority Sync
- Result: scope guard triggered
- Reason: Packet 1 marks too many concept families and authority surfaces for
  one coherent blueprint-plus-authority rewrite pass.
- Code validation: not performed and not applicable.
- Internal 136-plan conflicts: none identified by Packet 1.

## Scope Guard Trigger

Packet 2 was asked to update `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` and rewrite
current authority docs directly when a topology decision depends on corrected
authority prose. Packet 1 shows this cannot be done as one coherent pass:

- 20 decisions are marked `Later authority-doc rewrite needed: Yes`.
- 8 of 9 concept families need later rewrite.
- The affected surface exceeds the 4-6 doc guardrail:
  `AGENTS.md`, `README.md`, `CONTEXT.md`,
  `goal-authority-grounding-truth.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-model-visible-history-key.md`,
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-authority-open-design-deliverables.md`, and
  `goal-test-deletion-map.md`.

Because the blueprint still carries old topology questions and several owning
docs still contain stale or incomplete authority prose, updating only the
blueprint would create an override layer. Updating every owner in the same
packet would cross too many behavioral seams.

## Deferred Settled Topology Corrections

These Packet 1 decisions are settled and should be applied by the scoped
follow-up packets. They are listed here to prevent reopening them as topology
questions.

- Successor docs must be standalone and must not depend on
  `local/goal_136_plan` as future authority.
- Operations stay in `AGENTS.md`; do not create a long-lived
  `goal-operations-and-authority-order.md`.
- Navigation stays in `README.md`; do not create a long-lived
  `goal-navigation-index.md`.
- Glossary stays in `CONTEXT.md`; do not create a long-lived
  `goal-glossary.md`.
- Recorded request evidence remains a standalone successor authority surface.
- Fake-shim demolition terrain should not remain a long-lived successor
  authority doc; route that terrain to the `goal_136_plan` root for separate
  handling by another agent. Do not move files unless explicitly asked.
- Extension uses the v136 adapter/runtime route by default. A thin facade is
  blocker-triggered only; full v139/v140 `GoalService` adoption is not the
  v136 default.
- Same-turn app-server or extension delivery is metadata/wake/recheck only,
  with accepted, no-active-turn, and cannot-accept outcomes. It is not
  prebuilt model input.
- The v136 default automatic Continuation suppression correctness path is a
  state-owned watermark or equivalent durable/reconstructable record. Evidence
  remains metadata-only unless a later implementation explicitly selects a
  non-best-effort evidence-backed path.

## Recommended Split

### Packet 2A: Container And Standalone Topology Sync

- Edit: `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`, `AGENTS.md`, `README.md`,
  `CONTEXT.md`.
- Apply: operations/navigation/glossary container decisions; remove successor
  doc entries for operations, navigation, and glossary; keep evidence
  standalone; remove future-authority dependency on `local/goal_136_plan`.
- Do not: rewrite behavior, cadence, idle, extension, or test authority prose
  in this packet.
- Stop condition: if making the blueprint standalone requires behavior prose
  not yet corrected in the owning authority doc, leave that behavior to the
  owning packet below instead of adding a blueprint override.

### Packet 2B: Idle, History, Watermark, And Metadata Lifecycle Sync

- Edit: `AGENTS.md`, `goal-authority-primary-cadence-contract.md`,
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-model-visible-history-key.md`, and narrow references in
  `goal-authority-recorded-request-evidence.md` if needed.
- Apply: state-owned Continuation watermark default; runtime-only wording
  replacement; `GoalTurnRequest`-style metadata lifecycle; stale synthetic
  turn internal abort; committed carry replacing pre-shaper concrete carry.
- Do not: treat evidence as the default live correctness owner or make
  Continuation persisted pending intent.

### Packet 2C: Extension And App-Server Route Sync

- Edit: `goal-authority-ext-goal-ownership.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-fake-shim-removal-map.md`, and relevant test-map clauses.
- Apply: v136 adapter/runtime route; blocker-only facade; extension tool and
  runtime producer outcomes; metadata-only same-turn wake; steering-role
  config removal/hard-map; extension final-payload proof route.
- Do not: adopt a long-lived facade or service route by default, and do not
  move active model-input authority into `ext/goal`.

### Packet 2D: Cleanup, Projection, Shim Terrain, And Test Proof Sync

- Edit: `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-test-deletion-map.md`,
  `goal-authority-open-design-deliverables.md`, and narrow neighboring
  references as needed.
- Apply: generic source-tagged internal-context helper boundary; concrete carry
  removal from compaction/reconstruction authority; WA00 test-deletion
  additions; WA06 as cleanup/acceptance only; final acceptance audit gates.
- Do not: keep fake-shim demolition as a long-lived successor authority
  surface or turn audit regexes into architecture.

### Packet 2E: Blueprint Closure Check

- Edit: `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md` only, unless a directly owned
  authority mismatch remains.
- Apply: remove stale open questions and explicit non-decisions already
  answered by Packet 1 and the completed 2A-2D corrections.
- Confirm: no future successor surface depends on `local/goal_136_plan`, no
  stale authority owner is bypassed by blueprint prose, and no Packet 3
  successor drafting has started.

## Current Packet 2 Non-Edits

This scoping pass intentionally did not:

- update `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
- rewrite any `goal-authority-*` doc
- update `AGENTS.md`, `README.md`, or `CONTEXT.md`
- move fake-shim terrain into `goal_136_plan`
- create successor authority prose
- validate against current Rust code

## Rules For Follow-Up Packets

- Work from Packet 1's concept-family decisions, not source-heading order.
- Rewrite the owning authority doc directly when it disagrees with a settled
  136 decision. Do not add addenda, superseding tables, or blueprint override
  notes that leave wrong prose standing.
- Keep all corrected prose standalone from `local/goal_136_plan`.
- Treat traceability files as coverage checks only.
- Stop and name the exact conflict if a later read finds an internal 136-plan
  conflict that Packet 1 missed.
