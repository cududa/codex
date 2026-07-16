# Packet 11: Repeated Authority Compression Gates

Status: closed.

## Purpose

Define the gates that prevent Pass 2C source-slice execution from
over-compressing repeated authority while reshaping duplicate source prose into
canonical owner text, seam-local reminders, pointer-only references, and short
operational/test/navigation reminders.

## Scope

This packet owns the closure gates used to evaluate Packet 10's future
`Repeated Authority Treatment` table. It does not choose target ownership; it
uses Packet 03 and Pass 2B.5 as the owner/local-reminder inputs.

## Required Grounding

- `packet-03-target-owner-boundaries.md`
- `packet-10-slice-workflow-and-record-shape.md`
- `PASS2_CONCEPT_LEDGER.md`
- `pass2b_target_interfaces/README.md`
- `pass2b_target_interfaces/repeated-authority-canonicalization.md`
- `pass2b_target_interfaces/repeated_authority_canonicalization/README.md`
- completed Pass 2B.5 repeated-authority batch files

The Pass 2B.5 batches carry the needed source-backed clauses for this packet.
Future source-slice execution must still read its source slice directly.

## Decisions

### Gate 1: Repeated Family Identification

A future slice record must identify every repeated authority source unit by
Pass 2B.5 family before compressing it. If the source unit is repeated
authority but no Packet 03 or Pass 2B.5 entry covers it, the slice cannot close
by inventing a local route; record `user-review` or reopen the owner routing.

Use Packet 03's owner/local/pointer routing as the default classification.
Concept and traceability rows are coverage checks, not permission to broaden
ownership.

### Gate 2: Canonical Owner Exists Before Removal

Repeated source prose may be removed from a non-owner target only after the
record can name the successor owner location carrying the full contract.

That owner location may be written by the active slice or by an earlier closed
slice. It is not enough to say the owner target will exist later. If the owner
contract is not yet written, a non-owner slice that depends on it remains
`blocked` rather than closing with a pointer.

Canonical owner text must preserve family-specific clauses marked "must not be
lost." It may integrate Packet 09 route sharpening, but must not drop, invert,
or weaken the source concept.

### Gate 3: Seam-Local Reminder Required

A local reminder is required when Packet 03 or the relevant Pass 2B.5 batch
marks the target as a local/shared seam, or when direct source reading shows
the target's own seam can directly violate the repeated rule.

A sufficient local reminder is short, but it names the local prohibition or
obligation. It cannot be a bare "see owner" pointer when the target can violate
the rule locally. Local exceptions, negative rules, failure modes, and ordering
caveats must retain enough detail to prevent the forbidden move.

### Gate 4: Pointer-Only Is Narrow

Pointer-only treatment is acceptable only when all of these are true:

- Packet 03 or Pass 2B.5 does not classify the target as an owner or local
  reminder for that family.
- The target's seam cannot directly violate the rule.
- The source unit's full contract exists in the owner target.
- The pointer names the owner target and the concept being delegated.
- The pointer does not restate behavior in a way that can drift from the owner.

Pointer-only treatment cannot be the only surviving destination for a source
authority clause.

### Gate 5: Support Surfaces Stay Non-Authoritative

Operational, test, navigation, readiness, and glossary surfaces may keep short
reminders only in the role their target owns:

- `T-TEST-PREP` may carry proof obligations, replacement matrix entries, and
  baseline-restoration instructions, but not behavior contracts.
- `T-READINESS` may carry readiness and handoff checks, not behavior ownership.
- `NAV-README` may route readers to owner targets, not summarize edge-case
  behavior as the easiest surviving authority.
- `GLOSSARY` may define terms, not store exceptions, ordering rules, or test
  obligations.
- `OP-AGENTS` may keep authority order, posture, conflict rules,
  non-negotiable pointers, and verification expectations, but not become the
  only surviving behavior rule.

If one of these support targets is the only place a source behavior rule
survives, compression fails.

### Gate 6: Route-Sharpened Repetition

When Packet 09 route verification sharpens repeated wording, the future record
must put the sharpened decision into the canonical owner and affected local
reminders. Route files checked and conclusions belong in the slice record, not
as standing citations in successor prose.

If route material would drop, invert, or weaken the source concept, or if route
docs disagree in a way the closed planning packets cannot resolve, the slice
record moves to `user-review`.

### Gate 7: Packet 10 Table Evaluation

For every repeated family touched by a source slice, the future Packet 10
record table must be evaluated as follows:

| Field | Closure requirement |
| --- | --- |
| `Repeated family` | Names the Pass 2B.5 family, or explicitly says a new repeated clause needs owner routing. |
| `Source unit` | Names the exact source heading, subheading, table row, bullet, paragraph group, or glossary term being compressed. |
| `Treatment` | Uses `canonicalized`, `local-reminder`, `pointer-only`, `obsolete`, or `deferred` for repeated authority; `copied` or `translated` must still name whether the target role is owner or local. |
| `Owner target` | Names the owner target and successor location carrying the full contract. |
| `Local reminder targets` | Lists required local seams or `none` with a reason tied to Packet 03 or Pass 2B.5. |
| `Pointer-only targets` | Lists only targets whose seams cannot violate the rule locally. |
| `Notes` | Names the Pass 2B.5 entry, source-clause preservation result, route-check conclusion when applicable, and any remaining debt. |

`deferred` is never compatible with `closed`. `obsolete` is compatible with
closure only when the source unit is rejected terrain or superseded wording
and the notes name where any surviving concept landed.

## Compression Closure Blockers

A future slice record cannot be marked `closed` while any of these remain:

- canonical owner text is missing, future-only, or not located;
- the owner text omits a family-specific clause marked "must not be lost";
- a local seam reminder is missing where the target can violate the rule;
- pointer-only treatment is used for an owner or local-reminder seam;
- support, test, readiness, navigation, glossary, or operations prose is the
  only surviving behavior statement;
- a repeated exception, negative rule, ordering caveat, failure policy, or edge
  case disappears;
- `obsolete` wording does not name where the surviving concept landed or why
  the wording is rejected terrain;
- route-sharpened wording is not integrated into dependent owner/local prose;
- route/source conflict would silently drop, invert, or weaken the concept;
- a new repeated family is discovered without owner/local/pointer routing; or
- the record leaves any repeated source unit as `deferred`.

## Output Expected

Future Pass 2C execution can use these gates to judge the Packet 10
`Repeated Authority Treatment` table before marking one source-slice record
closed.

## Closure Criteria

- Canonical owner existence is required before repeated non-owner prose is
  removed.
- Local reminders are required where a seam can directly violate the rule.
- Pointer-only treatment is limited to non-owner, non-local targets whose seam
  cannot violate the rule.
- Support, test, readiness, navigation, glossary, and operations reminders
  remain non-authoritative.
- Route-sharpened repeated wording is integrated into successor prose without
  leaving route plans as standing authority.
- Compression blockers map directly to Packet 10 closure statuses.
- No successor drafts, source-slice records, trace closure rows, source moves,
  or Rust/code changes are created.

## Non-Goals

- Writing canonical successor prose.
- Repeating the full Pass 2B.5 batch matrices.
- Reopening Packet 03 owner routing without a new source-backed conflict.
- Defining Packet 12's full fidelity-audit category taxonomy.
- Running audits or closing source slices.
