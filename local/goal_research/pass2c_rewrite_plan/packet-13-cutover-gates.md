# Packet 13: Cutover Gates

Status: closed.

## Purpose

Define what must be true before successor docs replace current source docs as
standing Goal authority.

Cutover is not a one-for-one document replacement. It is the point where the
current authority corpus has been source-bounded, traced, audited, and reshaped
into successor targets, and the old source docs may be retired without concept
loss.

## Scope

This packet owns cutover gates and consistency checks. It defines future proof
requirements for Pass 2C execution after source-slice rewrite work is complete.

It does not perform cutover, create successor drafts, create source-slice
records, close traceability rows, or move current source docs.

## Required Grounding

- Packet 01 future workspace and naming.
- Packet 08 ordered source-slice table and explicit exclusions.
- Packet 10 source-slice workflow and record shape.
- Packet 11 repeated-authority compression gates.
- Packet 12 fidelity-audit categories.
- `PASS2_SECTION_TRACEABILITY.md`.
- `PASS2_CONCEPT_LEDGER.md`.
- Pass 2B target-interface consistency inputs.
- Pass 2B.5 repeated-authority canonicalization inputs.
- Current `AGENTS.md`, `README.md`, and `CONTEXT.md`.

## Decisions

Future cutover-readiness records belong at Packet 01's proposed path:

```text
local/goal_research/pass2c_rewrite/cutover/
```

Packet 13 does not create those records. When Pass 2C execution reaches
cutover readiness, use these record slugs:

- `cutover-source-queue.md`
- `cutover-successor-targets.md`
- `cutover-traceability-and-ledger.md`
- `cutover-route-fidelity-and-repetition.md`
- `cutover-cross-target-consistency.md`
- `cutover-navigation-operations-glossary.md`
- `cutover-source-retirement.md`

The cutover records are proof artifacts. They do not become standing authority
after cutover; successor docs do.

## Cutover Gate Matrix

| Gate | Must prove | Blocks cutover when |
| --- | --- | --- |
| Source queue closure | Every Packet 08 row has exactly one Packet 10 record at `local/goal_research/pass2c_rewrite/slice_records/<slice-id>.md`, and the record header matches Packet 08 order, range, primary target, secondary checks, route flag, and audit category. | A row is missing, duplicated, or has status `not-started`, `in-progress`, `blocked`, or `user-review`; any source-to-target treatment remains `deferred`. |
| Explicit exclusions | Every Packet 08 exclusion is reconfirmed in `cutover-source-queue.md` as prep, planning, executed handoff, route evidence, or future execution output rather than source authority prose. | An excluded artifact carries unique authority, or the exclusion reason is not still valid at cutover. |
| Successor target completeness | Every Packet 02 draft file exists under `local/goal_research/pass2c_rewrite/successor_drafts/`, and every target keeps the role assigned by Packets 02-04 and Pass 2B. | A target key is missing, a support target is the only surviving behavior authority, or any draft carries a role it must not own. |
| Source-to-target accounting | Every source unit in every future record lands as `copied`, `translated`, `canonicalized`, `local-reminder`, `pointer-only`, or `obsolete` with an allowed rationale. | A heading, subheading, table row, checklist item, paragraph group, glossary term, navigation clause, or operations clause disappears; `obsolete` does not name surviving concept location or rejected-terrain rationale. |
| Traceability closure view | `PASS2_SECTION_TRACEABILITY.md` is updated or paired with `cutover-traceability-and-ledger.md` so every source section has a successor location, retained non-authoritative support location, obsolete rationale, or Packet 08 exclusion rationale. | Any source section lacks a closure outcome. `Open`, `Split`, `Canonicalize`, `Leave`, or `Review debt` labels are blockers only when the closure view does not resolve what happened to the source material. |
| Concept-ledger closure view | `PASS2_CONCEPT_LEDGER.md` is updated or paired with `cutover-traceability-and-ledger.md` so every high-risk, cross-cutting, test-critical, repeated-authority, code-grounding, or design-pass concept has owner location, required local reminders, pointer/support locations, source slices, and route or obsolete-terrain rationale where applicable. | A high-risk behavior concept survives only in `NAV-README`, `GLOSSARY`, `OP-AGENTS`, `T-TEST-PREP`, or `T-READINESS`, unless the concept is genuinely navigation, vocabulary, operations, test-prep, or readiness material. |
| Route reconciliation | Every non-`None` Packet 08 route flag has a completed Packet 09 route check in the future slice record, including files checked, conclusion, source concept preserved, and route sharpening integrated into successor prose when used. | A required route check is missing; conclusion is `user-review`; route/source mismatch would drop, invert, or weaken a source concept; successor prose depends on standing route-plan citations instead of integrated decisions. |
| Repeated-authority compression | Every repeated source unit satisfies Packet 11: located canonical owner text, required local reminders, valid pointer-only treatment, non-authoritative support reminders, and no repeated unit `deferred`. | Any Packet 11 compression closure blocker remains. |
| Fidelity debt | Every future source-slice record applies Packet 12 universal and label-specific audit categories. No blocking fidelity debt remains. | Blocking debt remains, or non-blocking debt lacks an owner/resolution path after the record proves all source concepts landed in allowed roles. |
| Cross-target consistency | `cutover-cross-target-consistency.md` reviews successor drafts together against Packet 03, Packet 04, Pass 2B packet 5, and Pass 2B.5. | Duplicate conflicting owners, missing local reminders, support-target behavior takeover, or pointer-only prose becoming an alternate contract. |
| Navigation, operations, glossary | `NAV-README`, `OP-AGENTS`, and `GLOSSARY` successor drafts are ready to replace current README/AGENTS/CONTEXT-style surfaces. They point to successor owners and keep only navigation, posture, or vocabulary. | Current navigation or operations prose remains the clearest or only surviving authority for a behavior rule; glossary carries exceptions, ordering rules, implementation routes, or test obligations. |
| Source retirement | `cutover-source-retirement.md` lists each current source doc, chosen retirement action, successor locations, traceability/ledger proof, and navigation update. | Gates above have not passed, path history is not recoverable, or future agents could still treat the old doc as standing authority after move/archive/delete. |
| Final verification | The cutover execution pass records docs-only verification with `git diff --check -- local/goal_research` and `rg -n "[ \t]$" local/goal_research`; if cutover includes code/generated artifacts, root `AGENTS.md` validation also applies. | Required verification is not run or fails without recorded resolution. |

## Source Retirement Actions

After all other gates pass, each current source doc may receive one retirement
action:

- leave temporarily as archive/history;
- move to an archive path;
- replace with a pointer stub; or
- delete.

Deletion is allowed only when successor locations, closure proof, and original
path history are recoverable from tracked cutover records. Retirement is
allowed because concepts have been fully accounted for, not because each old
file has a one-for-one successor.

## Output Expected

A concrete gate list future Pass 2C execution can apply after all source-slice
records close. It must not perform cutover.

## Closure Criteria

- Gates require every Packet 08 source-slice row to have a closed Packet 10
  record.
- Gates require Packet 08 exclusions to be reconfirmed before source
  retirement.
- Gates require successor draft completeness across all Packet 02 target keys.
- Gates require traceability and concept-ledger closure views before old source
  docs are retired.
- Gates require route reconciliation, repeated-authority compression, fidelity
  audit, and cross-target consistency checks to pass.
- Gates require navigation, operations, and glossary surfaces to become
  pointer/posture/vocabulary surfaces after successor owners exist.
- Gates define source-doc retirement conditions without moving, archiving,
  deleting, or cutting over any file.

## Non-Goals

- Starting Pass 2C source-bounded rewrite execution.
- Creating `pass2c_rewrite/`, successor drafts, slice records, audit records,
  or cutover records.
- Renaming, moving, archiving, or deleting current source docs.
- Marking successor docs as standing authority.
- Closing traceability or concept-ledger rows in this planning packet.
- Editing route plans or Rust code.
