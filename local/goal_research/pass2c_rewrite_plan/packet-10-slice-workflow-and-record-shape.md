# Packet 10: Slice Workflow And Record Shape

Status: closed.

## Purpose

Define the repeatable workflow and small record shape for one future Pass 2C
source slice. Later rewrite agents should be able to execute Packet 08 rows
without inventing proof fields.

## Scope

This packet owns per-slice workflow, future record location, minimum record
fields, source-to-target trace shape, route-check note shape,
repeated-authority treatment field shape, fidelity-debt note shape, and
closure statuses.

It does not own Packet 11 compression gates, Packet 12 audit categories,
Packet 13 cutover gates, successor prose, or actual source-slice records.

## Required Grounding

- Packet 01 for future execution artifact paths.
- Packet 02 for successor draft filenames.
- Packet 08 for ordered source rows, route flags, and audit categories.
- Packet 09 for route families and evidence boundaries.
- `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md`.
- Pass 2B target interfaces and Pass 2B.5 repeated-authority workspace.
- Representative whole-doc, heading-range, below-heading, navigation,
  operations, test-prep, and glossary source shapes.

## Decisions

Future source-slice records should live at Packet 01's proposed path:

```text
local/goal_research/pass2c_rewrite/slice_records/<slice-id>.md
```

There is one record per Packet 08 row. The filename is the Packet 08 slice ID
plus `.md`. A record may touch multiple successor drafts, but the row's
`Primary target` remains the first destination and accountability owner for
the slice.

Packet 10 does not create the `pass2c_rewrite/` workspace or any record file.

## Per-Slice Workflow

Future source-slice execution should use this order:

1. Copy Packet 08 row metadata into the record header.
2. Read the exact source slice top to bottom. Include title or navigation
   header text when Packet 08 includes it in the source range.
3. Pull matching traceability rows. Treat `Open`, `Review debt`, `Split`, and
   `Canonicalize` as accounting inputs, not unresolved design by default.
4. Pull matching concept-ledger rows, especially high-risk, cross-cutting, and
   test-critical concepts.
5. Read the Pass 2B interface for the primary target and every secondary check
   target. Classify each touched target as owner, local/shared reminder,
   pointer-only, or support/navigation/glossary material for this slice.
6. Read relevant Pass 2B.5 entries before removing repeated prose or replacing
   it with a pointer.
7. Run the Packet 09 route check when the Packet 08 route flag is not `None`.
   For `None`, record no route check unless the source read exposes a new
   implementation-shaped dependency.
8. Rewrite from the source slice into successor drafts.
9. Record source-to-target trace, route reconciliation, repeated-authority
   treatment, and fidelity debt before judging closure.
10. Mark `closed` only when every source unit is accounted for and no blocking
    route, owner-boundary, or fidelity debt remains.

## Record Header

Each future record should start with:

```text
# <slice-id>

Status: <not-started | in-progress | blocked | user-review | closed>
Packet 08 order:
Source range:
Primary target:
Secondary checks:
Route flag:
Audit category:
Future record path:
Successor drafts touched:
```

`Successor drafts touched` should use Packet 02 filenames under
`local/goal_research/pass2c_rewrite/successor_drafts/`.

## Required Record Sections

### Grounding Read

```text
- Source slice read:
- Traceability rows consulted:
- Concept ledger rows consulted:
- Primary target interface read:
- Secondary target interfaces read:
- Repeated-authority entries consulted:
- Route files checked:
```

For a `None` route flag, `Route files checked` may say `not required by Packet
09`. If a route-sensitive issue appears anyway, name the checked route family
or mark `user-review`.

### Source-To-Target Trace

Use one row per source unit that must be accounted for: heading, subheading,
table row, checklist bullet, paragraph group, or glossary term.

| Source unit | Treatment | Successor location | Target role | Notes |
| --- | --- | --- | --- | --- |
| source file and anchor | copied, translated, canonicalized, local-reminder, pointer-only, deferred, or obsolete | draft file plus section heading | owner, shared/local, pointer-only, operational/test, navigation, or glossary | concept, route note, or debt pointer |

Treatment meanings:

- `copied`: source wording is intentionally preserved nearly as-is.
- `translated`: source concept is rewritten into clearer successor prose.
- `canonicalized`: repeated authority is carried in the owner target.
- `local-reminder`: a short seam-local restatement remains.
- `pointer-only`: the target names the owner without restating behavior.
- `deferred`: a concrete blocker or user decision prevents placement; the
  record cannot be `closed` while this remains.
- `obsolete`: rejected terrain or superseded wording is not carried as desired
  behavior; notes must name where any surviving concept landed.

### Target Edits

```text
| Draft file | Section added or updated | Material type | Why this target |
| --- | --- | --- | --- |
```

`Material type` should be canonical authority, seam-local reminder,
pointer-only reference, support seam, test-prep obligation, readiness gate,
navigation entry, operations instruction, or glossary term.

### Route Reconciliation

```text
Route flag:
Route family:
Route files checked:
Conclusion: not-required | matches-source | integrated-sharpening | no-change | user-review
Source concept preserved:
Route decision integrated into successor prose:
Mismatch or user-review reason:
```

`integrated-sharpening` means route material made older source wording more
precise while preserving the source concept. Successor drafts should integrate
the decision directly rather than cite route plans as standing authority.

### Repeated Authority Treatment

```text
| Repeated family | Source unit | Treatment | Owner target | Local reminder targets | Pointer-only targets | Notes |
| --- | --- | --- | --- | --- | --- | --- |
```

Packet 11 will define when these treatments are sufficient for closure.

### Fidelity Debt

```text
| Source anchor | Audit category | Concept or tripwire | Issue | Blocking? | Resolution |
| --- | --- | --- | --- | --- | --- |
```

`Blocking?` is `yes` when the issue could drop, weaken, invert, hide, or move
a source concept to a target that must not own it. Use Packet 08's audit
category plus concept-ledger tripwire wording until Packet 12 defines full
audit categories.

## Closure Statuses

Allowed statuses:

- `not-started`: record exists but source work has not begun.
- `in-progress`: source read or successor rewrite is underway.
- `blocked`: a concrete missing prerequisite prevents completion.
- `user-review`: a source/route/owner conflict needs user decision.
- `closed`: all source units are accounted for and no blocking debt remains.

Do not use `closed-with-debt`. Any unresolved source placement, route mismatch,
owner-boundary conflict, or semantic-loss risk keeps the status at `blocked`
or `user-review`.

## Closure Criteria

A future source-slice record may be marked `closed` only when:

- the exact source slice was read directly;
- every source unit has a source-to-target trace row;
- every touched traceability and concept-ledger row is accounted for;
- the primary target and every necessary secondary check were read;
- Packet 09 route verification is complete or explicitly not required;
- route decisions are integrated into successor prose, not standing citations;
- repeated authority has an owner/local/pointer treatment entry when relevant;
- no deferred source unit or blocking fidelity debt remains; and
- no source doc was renamed, moved, deleted, or marked retired by the slice.

## Output Expected

Future Pass 2C execution should be able to create one record from this template
for each Packet 08 row and use those records to prove source-bounded rewrite
coverage before cutover.

## Non-Goals

- Executing a source slice.
- Creating `pass2c_rewrite/`, successor drafts, audits, or slice records.
- Updating successor drafts.
- Closing traceability rows.
- Defining Packet 11 repeated-authority gates.
- Defining Packet 12 fidelity-audit categories.
- Defining Packet 13 cutover gates.
