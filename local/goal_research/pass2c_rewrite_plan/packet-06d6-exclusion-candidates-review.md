# Packet 06d6: Exclusion Candidates Review

Status: closed.

## Purpose

Decide which local goal-research docs are explicit exclusions from Pass 2C
source-slice execution.

## Scope

This packet owns exclusion review for non-source-corpus handoff, prep,
planning, or design-pass material under `local/goal_research/`.

It does not classify the assigned source docs owned by 06a, 06b, 06c, or
06d1-06d5.

## Required Grounding

- Packet 01 for future artifact boundaries
- Packet 04 source exclusions
- Packet 06 parent
- Packet 06d parent/index
- `local/goal_research/AGENTS.md`
- `local/goal_research/README.md`
- local goal-research filenames and candidate docs, read directly enough to
  justify exclusion reasons

## Decisions

The following docs are excluded from Pass 2C source-slice execution. They
remain valid navigation, audit, interface, compression, planning, or
provenance inputs where the active packet or slice calls for them, but they
are not source slices to rewrite into successor authority prose.

| Excluded candidate | Exclusion class | Reason |
| --- | --- | --- |
| `goal-authority-recorded-request-evidence-design-pass-handoff.md` | Executed handoff/provenance artifact | Direct reading says the handoff has been executed, is not authority, and is superseded as a source feed by `goal-authority-recorded-request-evidence.md`. Use it only to understand why the recorded-evidence source doc exists. |
| `PASS2_SECTION_TRACEABILITY.md` | Pass 2A prep/audit artifact | It inventories source sections, target-home pressure, and action/status flags. It explicitly does not close rows or become future implementation authority. Use it to audit coverage, not as source authority prose. |
| `PASS2_CONCEPT_LEDGER.md` | Pass 2A prep/audit artifact | It tracks cross-cutting concepts, high-risk rows, and repeated authority families. It explicitly does not close source rows or require duplicate prose preservation. Use it for fidelity checks and owner routing. |
| `PASS2B_TARGET_INTERFACES.md` | Pass 2B prep index | It routes readers to the target-interface workspace and states that Pass 2B files are interface/compression prep, not source authority and not source rewrites. |
| `pass2b_target_interfaces/README.md` | Pass 2B workspace prep artifact | It defines interface-drafting rules, target-home reading rules, and Pass 2C readiness checks. It should guide target-boundary checks, not become a source slice. |
| `pass2b_target_interfaces/packet-1-core-authority.md` through `packet-5-consistency.md` | Pass 2B target-interface packets | Direct review confirms these are completed target-interface entries. They say source rows still need source-bounded Pass 2C rewrite before becoming successor authority. |
| `pass2b_target_interfaces/repeated-authority-canonicalization.md` | Pass 2B.5 compression index | It is the stable index for repeated-authority canonicalization and says the workspace guides compression before source-bounded rewrite slices. |
| `pass2b_target_interfaces/repeated_authority_canonicalization/README.md` and batch files | Pass 2B.5 compression packets | They decide canonical owner, local reminder, pointer-only, and operational/test reminder routing for repeated authority. They are not source docs and must not be used to rewrite authority from memory. |
| `PASS2C_PLANNING_HANDOFF.md` | Pass 2C planning handoff | It orients agents to Pass 2C planning and explicitly says it is not future implementation authority, does not close rows, and does not rewrite source content. |
| `PASS2C_REWRITE_PLAN.md` | Pass 2C planning index | It is the compact planning scaffold for execution design, not a successor authority document, source-slice record, trace closure artifact, or cutover artifact. |
| `pass2c_rewrite_plan/README.md` | Pass 2C planning packet index | It defines packet rules, status, and closeability gates for planning. It is not the successor authority workspace or source-slice execution workspace. |
| `pass2c_rewrite_plan/PASSFORWARD.md` | Passforward note | It is a compact handoff for the next planning pocket, not source corpus or successor authority. |
| `pass2c_rewrite_plan/packet-*.md` | Pass 2C planning packet artifacts | These packets decide planning questions such as artifact paths, target inventory, owner boundaries, source split dispositions, workflow, audits, and cutover gates. They do not contain rewritten authority body content and should not be source slices. |
| Future `pass2c_rewrite/` artifacts named by Packet 01, if created later | Future execution workspace artifacts | Successor drafts, source-slice records, audits, and cutover records are produced by execution. They may be outputs or closure records, not input source corpus for the old-doc replacement pass. |

The following docs are not exclusion candidates in this packet because they
are already assigned to source-split review packets:

- `AGENTS.md`, `README.md`, and `CONTEXT.md`
- `goal-authority-grounding-truth.md`
- `goal-authority-primary-cadence-contract.md`
- `goal-authority-idle-continuation-contract.md`
- `goal-authority-durable-cadence-state.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-model-visible-history-key.md`
- `goal-authority-recorded-request-evidence.md`
- `goal-authority-repair-classifier-integration.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-authority-fake-shim-removal-map.md`
- `goal-authority-open-design-deliverables.md`
- `goal-test-deletion-map.md`

No candidate reviewed here contains hidden source authority that must be moved
back into source-split review. The only authority-shaped handoff candidate is
the recorded-request-evidence design-pass handoff, and it names the resolved
source doc that carries the actual seam.

No unresolved exclusion question carries to Packet 06d7.

## Output Expected

A compact exclusion list with reasons that do not hide source authority.

## Closure Criteria

- Exclusions are reasoned from direct candidate review, not filenames alone.
- No current source authority doc is excluded by accident.
- No unresolved exclusion question carries to Packet 06d7.
- No dependency order or execution order is assigned.
- No successor draft, source-slice record, or trace closure is created.

## Non-Goals

- Reviewing assigned source docs from 06a, 06b, 06c, or 06d1-06d5.
- Defining cutover gates.
- Consolidating all Packet 06d decisions.
- Starting rewrite execution.
