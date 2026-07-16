# Packet 04: Target Source Feed Map

Status: closed.

## Purpose

Name which source docs likely feed each successor target without deciding
rewrite slice order.

## Scope

This packet owns target-to-source feed mapping and required secondary target
checks.

It works at document level only. Heading ranges, slice units, source-doc split
decisions, slice IDs, and execution order belong to later packets.

## Required Grounding

- `PASS2C_PLANNING_HANDOFF.md`
- `AGENTS.md`
- `PASS2C_REWRITE_PLAN.md`
- `pass2c_rewrite_plan/README.md`
- Packets 00-03
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- source authority docs named by `AGENTS.md` and `README.md`
- Pass 2B target-interface packets

Direct source-doc reading confirmed the map below can stay bounded as one
document-level target feed table. If later source-slice work finds a feed that
depends on a specific heading range, that belongs to Packets 05-08 rather than
reopening this packet by default.

## Decisions

Feed terms:

- Canonical source feed: the source doc that should normally be read first
  when drafting that successor target from source-bounded slices.
- Supporting source feed: a source doc whose clauses constrain or reinforce
  the target but should not become that target's center.
- Secondary target check: another successor target that must be checked when a
  source feed crosses owner seams.

| Target | Canonical source feeds | Supporting source feeds | Secondary target checks |
| --- | --- | --- | --- |
| `T-BEHAVIOR` | `goal-authority-grounding-truth.md` | `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-fake-shim-removal-map.md`; `goal-test-deletion-map.md`; `goal-authority-open-design-deliverables.md` | `T-FINAL`, `T-CADENCE`, `T-DURABLE`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP` |
| `T-CADENCE` | `goal-authority-primary-cadence-contract.md` | `goal-authority-grounding-truth.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-fake-shim-removal-map.md`; `goal-test-deletion-map.md` | `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-TEST-PREP` |
| `T-DURABLE` | `goal-authority-durable-cadence-state.md` | `goal-authority-primary-cadence-contract.md`; `goal-authority-grounding-truth.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-open-design-deliverables.md` | `T-CADENCE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-EXT`, `T-TEST-PREP` |
| `T-FINAL` | `goal-authority-final-request-input-and-commit.md` | `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-fake-shim-removal-map.md`; `goal-authority-open-design-deliverables.md` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-TEST-PREP` |
| `T-IDLE` | `goal-authority-idle-continuation-contract.md` | `goal-authority-primary-cadence-contract.md`; `goal-authority-grounding-truth.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-repair-classifier-integration.md`; `goal-test-deletion-map.md` | `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-TEST-PREP` |
| `T-HISTORY` | `goal-authority-model-visible-history-key.md` | `goal-authority-idle-continuation-contract.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-grounding-truth.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-durable-cadence-state.md`; `goal-test-deletion-map.md` | `T-IDLE`, `T-CADENCE`, `T-FINAL`, `T-DURABLE`, `T-EVIDENCE`, `T-CLEANUP`, `T-TEST-PREP` |
| `T-EVIDENCE` | `goal-authority-recorded-request-evidence.md` | `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-grounding-truth.md`; `goal-test-deletion-map.md`; `goal-authority-open-design-deliverables.md` | `T-FINAL`, `T-DURABLE`, `T-HISTORY`, `T-CLEANUP`, `T-IDLE`, `T-TEST-PREP`, `T-READINESS` |
| `T-CLEANUP` | `goal-authority-repair-classifier-integration.md`; `goal-authority-fake-shim-removal-map.md` | `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-ext-goal-ownership.md`; `goal-test-deletion-map.md` | `T-BEHAVIOR`, `T-FINAL`, `T-CADENCE`, `T-HISTORY`, `T-EVIDENCE`, `T-IDLE`, `T-SHIM`, `T-TEST-PREP` |
| `T-EXT` | `goal-authority-ext-goal-ownership.md` | `goal-authority-fake-shim-removal-map.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-grounding-truth.md`; `goal-authority-repair-classifier-integration.md`; `goal-test-deletion-map.md`; `goal-authority-open-design-deliverables.md` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-CLEANUP`, `T-SHIM`, `T-TEST-PREP` |
| `T-SHIM` | `goal-authority-fake-shim-removal-map.md` | `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-final-request-input-and-commit.md`; `goal-test-deletion-map.md` | `T-BEHAVIOR`, `T-CADENCE`, `T-FINAL`, `T-CLEANUP`, `T-EXT`, `T-TEST-PREP`, `T-READINESS` |
| `T-TEST-PREP` | `goal-test-deletion-map.md` | `AGENTS.md`; `goal-authority-grounding-truth.md`; `goal-authority-primary-cadence-contract.md`; `goal-authority-idle-continuation-contract.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-recorded-request-evidence.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-fake-shim-removal-map.md` | all behavior and seam targets whose proof obligations appear in the replacement matrix |
| `T-READINESS` | `goal-authority-open-design-deliverables.md` | `AGENTS.md`; `goal-authority-durable-cadence-state.md`; `goal-authority-final-request-input-and-commit.md`; `goal-authority-model-visible-history-key.md`; `goal-authority-ext-goal-ownership.md`; `goal-authority-repair-classifier-integration.md`; `goal-authority-recorded-request-evidence.md`; `goal-test-deletion-map.md` | `T-DURABLE`, `T-FINAL`, `T-HISTORY`, `T-EXT`, `T-CLEANUP`, `T-EVIDENCE`, `T-TEST-PREP`, `OP-AGENTS`, `NAV-README` |
| `NAV-README` | `README.md` | `AGENTS.md`; `CONTEXT.md`; navigation headers in the source authority docs; `goal-authority-open-design-deliverables.md`; `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` as prep-artifact routes only | all target docs as pointer destinations; `OP-AGENTS`; `GLOSSARY` |
| `GLOSSARY` | `CONTEXT.md` | `goal-authority-grounding-truth.md` Terminology; source docs that introduce target-owned terms; `goal-authority-recorded-request-evidence.md`; `AGENTS.md`; `README.md` | all target owners for term semantics; `NAV-README`; `OP-AGENTS` |
| `OP-AGENTS` | `AGENTS.md` | `README.md`; `CONTEXT.md`; `goal-authority-open-design-deliverables.md`; `goal-test-deletion-map.md`; `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` as prep-artifact routes only | all target docs as pointer destinations; `NAV-README`; `GLOSSARY` |

Source exclusions:

- `goal-authority-recorded-request-evidence-design-pass-handoff.md` should not
  feed successor authority by itself. It is an executed handoff/provenance
  artifact; the resolved source feed is
  `goal-authority-recorded-request-evidence.md`.
- Pass 2A, Pass 2B, Pass 2B.5, and Pass 2C planning artifacts are audit,
  interface, compression, or planning inputs. They may guide reads, checks,
  or retained navigation links, but they are not source authority feeds for
  successor behavior prose.
- `local/goal_136_plan/work-areas/` route material is not a Packet 04 source
  feed. Later route-verification packets and source slices decide where those
  researched route decisions must be reconciled into successor docs.

Unresolved source-feed questions:

- None at document-feed granularity. Later packets may still discover heading
  split, route-verification, or source-order questions without reopening this
  document-level map.

## Output Expected

A target-centered source-feed map. It should help later slice planning without
becoming a source-slice table.

## Closure Criteria

- Each target from Packet 02 has source feeds or an explicit exclusion.
- Source feeds are grounded in direct source reading, not filenames alone.
- Secondary target checks are named where a source feed crosses owner seams.
- Explicit source exclusions are named with reasons.
- No source slice IDs or ordered execution table are introduced.

## Non-Goals

- Deciding slice unit.
- Deciding source order.
- Closing traceability rows.
- Writing successor prose.
- Creating successor drafts or source-slice records.
