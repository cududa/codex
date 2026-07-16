# Packet 06e: Split Review Rollup

Status: closed.

## Purpose

Consolidate the closed Packet 06 child split reviews into one source-doc split
disposition for later dependency-order and ordered-slice packets.

## Scope

This packet owns rollup only. It merges child decisions, resolves duplicate or
conflicting dispositions, and records unresolved questions for user review.

It does not reopen child packet source reading unless a child packet leaves an
explicit conflict or gap that cannot be consolidated.

## Required Grounding

- Packet 05
- Packet 06 parent
- closed Packets 06a, 06b5, 06c4, and 06d7
- Packet 03 and Packet 04 only where a child decision conflicts with owner or
  source-feed boundaries

## Decisions

Closed Packet 06 child rollups cover every source doc and exclusion class
assigned by Packet 06. Their decisions consolidate as follows:

| Source doc | Disposition | Below-heading split | Rollup note |
| --- | --- | --- | --- |
| `goal-authority-grounding-truth.md` | Heading/range slices | No | Behavioral spine crosses final-input, cadence, durable-state, repair, legacy-artifact, test, and readiness seams. |
| `goal-authority-primary-cadence-contract.md` | Heading/range slices | Yes | Split below `##` inside `Cadence State Model` and `Steering Kinds`; those `###` sections are separable cadence subcontracts. |
| `goal-authority-idle-continuation-contract.md` | Heading/range slices | No | Idle lifecycle stages, lock/reservation, resume, mutation, repair, terrain, and tests need separate clause accounting. |
| `goal-authority-durable-cadence-state.md` | Whole-doc slice | No | One dominant durable-state seam; secondary checks remain local reminders. |
| `goal-authority-final-request-input-and-commit.md` | Heading/range slices | No | Final-input proof, shaping, commit metadata, local evidence obligation, commit point, retry/follow-up, carry, adapter, and tests are distinct source units. |
| `goal-authority-model-visible-history-key.md` | Heading/range slices | No | Key shape, eligible progress projection, capture point, runtime watermark, resume/restart, compaction/reconstruction, and tests are distinct source units. |
| `goal-authority-recorded-request-evidence.md` | Heading/range slices | No | Evidence boundary/correctness, carrier, shape/fingerprints, commit timing/failure policy, replay, resume/suppression, rollback/fork, compaction, projection, version notes, and tests are distinct source units. |
| `goal-authority-repair-classifier-integration.md` | Heading/range slices | No | Classifier/purity, final-input repair, typed projection, history, compaction, reconstruction/rollback/fork, raw notification, ownership, and tests are distinct source units. |
| `goal-authority-ext-goal-ownership.md` | Heading/range slices | No | Purpose, terrain/upstream shape, ownership decision, replacement shape, configuration, reachability, file work areas, and tests are distinct source units. |
| `goal-authority-fake-shim-removal-map.md` | Heading and below-heading slices | Yes | Split below `##` for active shim roots, shim-dependent consumers, and required work areas; other `##` sections remain whole. |
| `goal-test-deletion-map.md` | Heading and below-heading slices | Yes | Split below `## Upstream Baseline Tests That Remain Active` by labeled test family and below `## Replacement Test Profile To Add After Prep` by labeled proof family. |
| `goal-authority-open-design-deliverables.md` | Heading/range and below-heading slices | Yes | Split below `## Required Deliverables` for the five `###` deliverable checklists. |
| `AGENTS.md` | Heading/range slices | No | Operations guidance, source read order, non-negotiable reminders, and verification should remain operational/pointer material, not the only behavior authority. |
| `README.md` | Heading/range slices | No | Reader navigation, document roles, terrain anchors, and Pass 2 guardrails are navigation source material, not behavior authority. |
| `CONTEXT.md` | Whole-doc slice | No | One glossary-only source role; title, intro, and term list are vocabulary context rather than implementation or test authority. |

The source title and any standard navigation header travel with the first
slice for split docs and with the whole-doc slice for whole-doc dispositions.
Navigation headers remain routing context and fidelity context, not standalone
behavior authority.

Consolidated exclusions:

- `goal-authority-recorded-request-evidence-design-pass-handoff.md` is
  excluded as an executed handoff/provenance artifact. The source feed is
  `goal-authority-recorded-request-evidence.md`.
- `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` are excluded
  as Pass 2A prep/audit artifacts.
- `PASS2B_TARGET_INTERFACES.md`, `pass2b_target_interfaces/README.md`, the
  Pass 2B target-interface packet files, the repeated-authority stable index,
  and `pass2b_target_interfaces/repeated_authority_canonicalization/` are
  excluded as Pass 2B and Pass 2B.5 interface/compression prep artifacts.
- `PASS2C_PLANNING_HANDOFF.md`, `PASS2C_REWRITE_PLAN.md`, and
  `pass2c_rewrite_plan/` are excluded as Pass 2C planning/handoff artifacts.
- Future `pass2c_rewrite/` artifacts, if created later, are excluded from the
  old-source-doc source corpus because they are execution outputs or closure
  records.

No child rollup leaves a missing, duplicated, or conflicting source-doc
disposition. No reviewed exclusion class hides source authority that must move
back into source split review.

Packet 07 has enough closed source-granularity input to begin dependency-order
rule planning. Packet 07 should use this rollup to reason about source-family
dependencies, but it should not assign ordered slice rows; Packet 08 owns the
ordered source-slice table.

## Output Expected

A compact consolidated Packet 06 disposition table or list suitable for Packet
07 dependency-order work and Packet 08 ordered-slice-table work.

## Closure Criteria

- Packets 06a, 06b5, 06c4, and 06d7 are closed before this packet receives
  decisions.
- Every child disposition is represented in the rollup.
- Missing, duplicated, or conflicting dispositions are resolved or explicitly
  assigned to user review.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Performing first-pass source reading for source docs assigned to 06a,
  06b1-06b4, 06c, or 06d.
- Choosing dependency order or ordered source slices.
- Choosing target destinations per slice.
- Starting rewrite execution.
