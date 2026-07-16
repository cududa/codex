# Packet 12: Fidelity Audit Categories

Status: closed.

## Purpose

Define semantic-loss categories future source slices must audit before closure.
The categories make Packet 10's `Fidelity Debt` table usable without running
any source-slice rewrite work in this planning workspace.

## Scope

This packet owns audit categories and per-slice tripwire families.

It uses Packet 08 audit labels as applicability inputs, Packet 09 route
families as reconciliation inputs, Packet 10 record fields as the proof
surface, and Packet 11 as the specialized repeated-authority compression gate.

## Required Grounding

- Packets 08, 09, 10, and 11
- `PASS2_CONCEPT_LEDGER.md`
- `PASS2_SECTION_TRACEABILITY.md`
- source authority spine and supporting seam docs
- Pass 2B target-interface packets
- Pass 2B.5 repeated-authority batches

## Decisions

Future source-slice records should keep Packet 08's audit label visible. When a
fidelity issue is found, the `Audit category` field in Packet 10's `Fidelity
Debt` table should use:

```text
<packet-08-audit-label> / <fidelity-category>
```

For example: `final / authority-proof` or `test-prep / support-surface`.

If a category is applicable but no issue is found, the record does not need a
debt row. The positive evidence must still be present in the grounding,
source-to-target trace, route reconciliation, repeated-authority treatment, or
target-edits sections.

## Universal Audit Categories

Every future source slice must check these before it can close.

| Fidelity category | Tripwire | Evidence expected in Packet 10 record | Blocking debt when |
| --- | --- | --- | --- |
| `source-accounting` | Source text is summarized away or a heading/table/bullet/glossary term disappears. | Exact source range read, source-to-target trace rows for each source unit, traceability statuses accounted for. | Any source unit is untraced, left `deferred`, or closed by generic summary. |
| `concept-coverage` | A high-risk, cross-cutting, test-critical, `Review debt`, `Split`, or `Canonicalize` concept is weakened. | Concept ledger rows consulted, target interface role for each touched target, traceability action/status noted. | A source concept is dropped, inverted, weakened, hidden in the wrong surface, or assigned to an owner that cannot carry it. |
| `owner-seam-placement` | Behavior lands in a support target, or a local seam loses a non-negotiable. | Primary and secondary target interfaces read; target role recorded as owner, shared/local, pointer-only, operational/test, navigation, or glossary. | Behavior is owned by `T-TEST-PREP`, `T-READINESS`, `NAV-README`, `GLOSSARY`, or `OP-AGENTS`, or a seam-local reminder is missing. |
| `route-reconciliation` | Route material changes implementation-shaped wording without proof that the source concept survived. | Packet 09 flag, route files checked or `not required`, route conclusion, source concept preserved, mismatch reason if any. | Route material would drop, invert, or weaken source authority; route docs conflict unresolved; required route check is missing. |
| `repeated-authority` | Duplicate source prose is compressed before the owner/local/pointer treatment is proven. | Packet 11 repeated-authority table entries when applicable. | Any Packet 11 compression closure blocker remains. |

## Label-Specific Categories

Use this table to decide which additional tripwires apply from Packet 08's
`Audit` label. A row may still apply another category when the source slice
crosses a secondary target seam.

| Packet 08 audit label | Additional fidelity category | Tripwires future records must check |
| --- | --- | --- |
| `authority` | `authority-proof` | Active Goal authority remains final model request input containing the selected outer developer-role Goal item; helper output, durable state alone, raw/projection output, hiddenness, tool output, rendered text, and user-role steering are not authority. |
| `cadence` | `cadence-selection` | Only Initial, ObjectiveUpdated, BudgetLimit, and idle-selected Continuation are cadence events; ordinary user turns are not cadence; repair is request-local; supersedence and pending-intent delivery are not flattened. |
| `durable` | `durable-state` | Durable state owns Goal facts, facts version, pending non-Continuation intent, exact-key consumption, and mechanical cleanup only; it must not select cadence, shape final input, render prompt text, repair, or own Continuation policy. |
| `final` | `final-input` | Per-attempt shaping, selected-item identity, commit timing, retry/follow-up behavior, current-turn carry, and adapter non-ownership survive; prebuilt input or carry is not authority before final input commit. |
| `idle` | `idle-lifecycle` | Idle legal callers, pending-work precedence, pending durable intent before automatic Continuation, reservation/recheck, stale abort, resume hydration, and same-turn metadata-only behavior survive. |
| `history` | `history-key` | Model-visible history key excludes Goal cadence/repair items appropriately, captures at the final-input seam, advances watermark only after committed Continuation, and handles resume/compaction/reconstruction without rendered-artifact recovery. |
| `evidence` | `evidence-boundary` | Structured recorded request evidence is replay/audit support for the same logical final request input; it is not authority, cadence selection, pending-intent storage, final-input inspection, raw output, or default live recovery. |
| `cleanup` | `cleanup-boundary` | Classifiers, provenance, projections, compaction, reconstruction, rollback, fork, and request repair stay cleanup/support behavior; strict purity, mixed-content visibility, raw-notification behavior, and no runtime archaeology survive. |
| `extension` | `extension-seam` | `ext/goal` owns lifecycle, tools, reachability, config compatibility, and producer-facing metadata only; reachable extension steering routes through shared cadence/final-input seams or is removed/proven unreachable. |
| `shim` | `shim-demolition` | `GoalContext`, `GoalContextRole`, active `<goal_context>`, active fake provenance, user-role active steering, concrete injection/carry, and local false-compatibility tests remain demolition terrain, not compatibility to preserve. |
| `test-prep` | `test-proof` | Test-prep owns baseline restoration, local overlay deletion, replacement matrix, and snapshot handling only; behavior targets retain the actual obligations that tests prove. |
| `readiness` | `readiness-surface` | Ready means implementation-design input or handoff gate, not concrete file/function/test execution and not behavior ownership. |
| `navigation` | `navigation-surface` | Navigation routes readers to owner docs and terrain, but does not summarize edge cases as the easiest surviving authority. |
| `operations` | `operations-surface` | Operational instructions may keep authority order, conflict rules, non-negotiable pointers, posture, and verification expectations, but must not become the only surviving behavior contract. |
| `glossary` | `glossary-surface` | Glossary terms remain vocabulary only; exceptions, ordering rules, implementation routes, and test obligations must live in owner or support targets. |

## Evidence Expectations

Future slice records should prove these categories through existing Packet 10
sections, not by adding new record fields.

- `Grounding Read`: names source, traceability, concept ledger, target
  interfaces, repeated-authority entries, and route files checked.
- `Source-To-Target Trace`: proves every source unit landed as copied,
  translated, canonicalized, local-reminder, pointer-only, obsolete, or
  explicitly blocked.
- `Target Edits`: proves why each successor target is allowed to receive that
  material.
- `Route Reconciliation`: proves route sharpening was integrated without
  standing route citations or source-concept loss.
- `Repeated Authority Treatment`: proves Packet 11 owner/local/pointer gates.
- `Fidelity Debt`: records remaining issues with the Packet 08 label and the
  fidelity category that failed.

## Blocking Versus Non-Blocking Debt

Mark `Blocking?` as `yes` when the issue could:

- drop, invert, weaken, or hide a source concept;
- move behavior into a support, navigation, operations, readiness, test, or
  glossary surface that must not own it;
- leave a high-risk or test-critical concept without owner/local/pointer proof;
- leave a required Packet 09 route check missing or in `user-review`;
- leave a Packet 11 compression blocker unresolved;
- preserve rejected fake-shim terrain, helper authority, user-role steering,
  rendered-text authority, or runtime archaeology as desired architecture; or
- leave source material `deferred` without a concrete blocker and owner.

Mark `Blocking?` as `no` only when the issue is wording, navigation polish,
non-authoritative duplication cleanup, or future editorial refinement and the
record already proves every source concept landed in an allowed owner, local
reminder, pointer, support, operations, navigation, readiness, test, or glossary
role.

## Packet 13 Readiness

Packet 13 is unblocked. It can define cutover gates from:

- Packet 08's full source-slice queue and exclusions;
- Packet 10's record shape and closure statuses;
- Packet 11's repeated-authority closure blockers; and
- this packet's fidelity categories and blocking-debt criteria.

## Output Expected

A bounded audit-category checklist that future Packet 10 records can apply per
source slice.

## Closure Criteria

- Non-negotiables have audit coverage.
- Repair, resume, raw evidence, final input, durable state, idle Continuation,
  shim removal, and support-target behavior limits are covered.
- The checklist is usable by Packet 10 records.
- Blocking and non-blocking fidelity debt are distinguished.
- Packet 13 is either unblocked or blocked for a concrete reason.

## Non-Goals

- Running audits.
- Closing source slices.
- Writing replacement tests.
- Creating successor drafts, source-slice records, trace closures, cutover
  artifacts, or Rust/code changes.
