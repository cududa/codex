# Pass 2B.5 Repeated Authority Canonicalization

This is a Pass 2B.5 prep artifact. It is not future implementation authority
and does not close any Pass 2A row.

Use this workspace before Pass 2C source-bounded rewrite slices. Its job is to keep
intentional repeated authority visible while deciding which successor target
should carry canonical text, which targets need local reminders, and which
targets should use pointer-only references.

For direct implementation work before cutover, source authority docs still
control. For Pass 2C doc-worker tasks, current source docs are the source
corpus and this workspace is the compression plan for translating repeated
clauses into canonical text, local reminders, pointer-only references, or
operational/test reminders.

If this workspace and a source contract differ during direct implementation
work, follow the source contract and fix this workspace. If a Pass 2C slice
finds that older source-doc wording and a relevant
`local/goal_136_plan/work-areas` decision differ, use the work-area route when
it preserves the underlying concept and latest researched v136 design, then
record the reconciliation in the slice closure.

## Purpose

Pass 2C must reduce duplicated prose without erasing reinforcement that is
there because multiple seams can violate the same rule.

For each repeated authority family below:

- `Canonical text` means the successor target should carry the full contract.
- `Local reminder` means the target should repeat a short non-negotiable
  because its seam can violate the rule.
- `Pointer-only` means the target should link to the owner without restating
  the rule.
- `Operational/test reminder` means the target may keep a short checklist or
  proof obligation, but not behavior ownership.

Do not use this artifact to rewrite source-doc text from memory. Pass 2C still
rewrites source-bounded slices and audits each slice for fidelity.

## Canonicalization Rules

- Preserve repeated concepts until the canonical target and local reminders are
  written. This is not a requirement to preserve duplicate prose forever.
- Do not collapse a repeated clause into a pointer if the local target can
  directly violate the rule.
- Do not let support seams become authority engines while preserving local
  reminders.
- Do not let navigation, glossary, readiness, or test-prep prose become the
  easiest-to-read replacement for behavior contracts.
- Keep negative rules close to seams that commonly violate them, especially
  helper/provenance non-authority, request-local repair, raw notification
  behavior, and evidence-is-not-authority boundaries.
- Treat `AGENTS.md` non-negotiables as operational reminders after cutover,
  not as the only surviving place where behavior is specified.

## Concept Template

Each canonicalization entry uses this shape:

```text
Concept:
Canonical text:
Local reminders:
Pointer-only:
Operational/test reminders:
Source sections carrying repeated authority:
Clauses that must not be lost:
Allowed compression:
Forbidden compression:
Pass 2C rewrite instruction:
```

## Batch Files

- [Batch 1: Authority And Cadence Proof](batch-1-authority-and-cadence-proof.md)
- [Batch 2: Lifecycle And Attempt Semantics](batch-2-lifecycle-and-attempt-semantics.md)
- [Batch 3: Cleanup, Evidence, And Reconstruction](batch-3-cleanup-evidence-reconstruction.md)
- [Batch 4: Support, Tests, And Operations](batch-4-support-tests-and-operations.md)

## Current Status

Batches 1-4 are complete enough to feed Pass 2C planning. They do not close
source rows or replace source-bounded fidelity audits.

## Batch Order Recommendation

Use this order before or during Pass 2C planning:

1. Authority and cadence proof
2. Lifecycle and attempt semantics
3. Cleanup, evidence, and reconstruction
4. Support, tests, and operations

Within each batch, confirm:

- canonical target has the full source-backed contract
- local reminders remain where the seam can violate the rule
- pointer-only targets do not restate behavior in a drifting way
- operational/test/navigation surfaces do not become behavior engines
- source sections with repeated clauses are still accounted for in
  `PASS2_SECTION_TRACEABILITY.md`

## Pass 2C Use

Pass 2C should treat this workspace as a compression guide:

- When rewriting a source slice, consult the relevant entry before deleting
  repeated prose.
- If a repeated sentence is removed from a non-owner target, replace it with a
  pointer only after the local reminder is either preserved or intentionally
  deemed unnecessary.
- If a source slice contains a clause not represented here, update this workspace
  or the target interface before closing the slice.
- Do not close a source slice merely because the concept appears in this
  workspace; perform the source-bounded fidelity audit against the original
  source text.

