# Packet 02: Successor Target Inventory

Status: closed.

## Purpose

List the successor target keys and proposed draft documents Pass 2C should
write toward.

## Scope

This packet owns the target-key inventory and draft path mapping only.

It does not decide owner/shared/pointer boundaries, source feeds, source
slices, route verification, workflow records, audits, or cutover gates.

## Required Grounding

- `local/goal_research/pass2c_rewrite_plan/packet-00-planning-boundary-and-packet-rules.md`
- `local/goal_research/pass2c_rewrite_plan/packet-01-draft-workspace-and-naming.md`
- `local/goal_research/PASS2_SECTION_TRACEABILITY.md`
- `local/goal_research/PASS2_CONCEPT_LEDGER.md`
- `local/goal_research/PASS2B_TARGET_INTERFACES.md`
- `local/goal_research/pass2b_target_interfaces/README.md`
- completed Pass 2B target-interface packets 1-5

## Decisions

The first Pass 2C rewrite should keep one successor draft disposition per
Pass 2B target key.

No target key is split before drafting. Splitting a target before source
rewrite would hide source-slice coverage and owner-boundary questions inside a
filename decision. Later packets may refine ownership, source feeds, and
cutover shape, but Packet 02 keeps the inventory one-to-one with Pass 2B.

No target key is omitted from drafting. Support, test, readiness, navigation,
glossary, and operations targets still need draft dispositions because they
will replace or shrink current source/navigation surfaces at cutover. Their
drafts must remain support, vocabulary, navigation, or operational surfaces;
they do not become behavior authority by implication.

Draft paths are relative to Packet 01's future draft directory:

```text
local/goal_research/pass2c_rewrite/successor_drafts/
```

| Target key | Proposed draft file | Disposition |
| --- | --- | --- |
| `T-BEHAVIOR` | `draft-goal-authority-behavior.md` | Draft as an authority contract. |
| `T-CADENCE` | `draft-primary-cadence.md` | Draft as an authority contract. |
| `T-DURABLE` | `draft-durable-cadence-state.md` | Draft as an authority contract. |
| `T-FINAL` | `draft-final-request-input-and-commit.md` | Draft as an authority contract. |
| `T-IDLE` | `draft-idle-goal-lifecycle.md` | Draft as a lifecycle contract. |
| `T-HISTORY` | `draft-model-visible-history-key.md` | Draft as a seam contract. |
| `T-EVIDENCE` | `draft-recorded-request-evidence.md` | Draft as a support seam, not authority. |
| `T-CLEANUP` | `draft-cleanup-repair-and-reconstruction.md` | Draft as a cleanup seam contract. |
| `T-EXT` | `draft-extension-goal-ownership.md` | Draft as a support/execution seam. |
| `T-SHIM` | `draft-fake-shim-removal.md` | Draft as demolition terrain. |
| `T-TEST-PREP` | `draft-test-prep-and-replacement-matrix.md` | Draft as test-prep routing, not behavior authority. |
| `T-READINESS` | `draft-design-readiness-and-execution-handoff.md` | Draft as readiness and handoff criteria. |
| `NAV-README` | `draft-reader-map-and-navigation.md` | Draft as reader navigation, not authority. |
| `GLOSSARY` | `draft-goal-domain-glossary.md` | Draft as vocabulary only. |
| `OP-AGENTS` | `draft-operational-instructions-and-authority-order.md` | Draft as operational instructions and authority order. |

## Output Expected

A compact target inventory. It should not include owner/local/pointer rules or
source-slice order.

## Closure Criteria

- Every Pass 2B target key has a proposed disposition.
- Support, test, navigation, glossary, and operations targets are not allowed
  to become behavior authority by implication.
- No successor draft files are created.
- Target owner boundaries remain owned by Packet 03.
- Source feeds remain owned by Packet 04.

## Non-Goals

- Writing target prose.
- Choosing source slices.
- Choosing owner/shared/pointer boundaries.
- Mapping source docs to targets.
- Defining repeated-authority compression.
- Creating the future execution workspace.
