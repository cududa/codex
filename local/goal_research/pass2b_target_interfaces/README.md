# Pass 2B Target Interfaces Workspace

This is a Pass 2B setup artifact. It is not authority, does not supersede any
source contract in `local/goal_research`, and does not close any Pass 2A row.

Use this file to design successor document interfaces before any authority
content is rewritten, renamed, rehomed, merged, split, or deleted.

The top-level index is [../PASS2B_TARGET_INTERFACES.md](../PASS2B_TARGET_INTERFACES.md).

The repeated-authority canonicalization plan is
[repeated-authority-canonicalization.md](repeated-authority-canonicalization.md).
Use that stable index and the batch files under
`repeated_authority_canonicalization/` before Pass 2C source-bounded rewrite
slices to decide which repeated clauses become canonical text, local
reminders, pointer-only references, or operational/test reminders.

## Purpose

Pass 2B defines the interfaces for the successor Goal authority documents. An
interface is everything a later reader or rewrite slice must know about a
target document: what it owns, what it must not own, which repeated authority
must remain local, which dependencies are pointer-only, and which Pass 2A rows
feed it.

Pass 2B does not write successor authority prose. It creates the stable map
that lets Pass 2C rewrite source-bounded slices without synthesizing from
memory.

## Inputs

Use these files for Pass 2B:

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`

Source authority docs remain controlling. If a Pass 2B packet finds that a
source contract and a prep artifact disagree, follow the source contract and
fix the prep artifact before continuing.

## Constraints

- Do not rewrite source authority content in Pass 2B.
- Do not rename, rehome, or delete source authority files in Pass 2B.
- Do not start Pass 2C source-bounded rewrite slices from this artifact alone.
- Do not promote current Rust terrain or `local/goal_136_plan` above
  `local/goal_research` source authority.
- If implementation-plan details are settled and needed, they must be
  represented in the applicable source authority doc before this artifact
  relies on them.
- Treat existing Rust code as terrain, not mission.

## Target-Home Reading Rule

A target listed in `PASS2_SECTION_TRACEABILITY.md` or
`PASS2_CONCEPT_LEDGER.md` means the target must consider that row. It is not an
ownership classification by itself.

Each Pass 2B packet must classify mappings as:

- `owns`: the target is responsible for the behavioral contract or seam
  semantics.
- `shared`: the target must carry part of the contract locally because its seam
  can violate the rule.
- `pointer-only`: the target references the rule, but another target owns the
  semantics.
- `wrong/stale`: the mapping implies ownership that contradicts source
  authority or current settled authority.

## Status Reading Rule

- `Open` means inventoried but not rewritten, not unresolved design by default.
- `Review debt` means a fidelity tripwire before rewrite closure, not an open
  question by default.
- `Split` means the row feeds more than one target; each target still needs an
  owner/shared/pointer-only classification.
- `Canonicalize` is valid only after repeated authority is represented in the
  concept ledger and the local non-negotiables are assigned.
- `Leave` fits operational or navigation material that should survive until
  cutover.

Before treating a row as unresolved, classify it as one of:

- authority-settled and ready for deterministic interface placement
- source-backed ownership routing work
- fidelity debt for Pass 2C audit
- plan/authority conflict requiring a source authority or plan update
- true design debt

## Target Interface Template

Each target interface draft should use this template.

```text
## <Target Key>: <Proposed Successor Interface Name>

Purpose:
- ...

Owns:
- ...

Does Not Own:
- ...

Shared / Local Non-Negotiables:
- ...

Pointer-Only Dependencies:
- ...

Canonical Source Inputs:
- ...

Supporting Source Inputs:
- ...

Concept Ledger Inputs:
- ...

Fidelity Tripwires / Review Debt:
- ...

Pass 2C Rewrite Notes:
- ...

True Open Questions:
- None, unless source authority check proves otherwise.
```

### Field Meanings

- `Purpose` states why the target exists and how it helps agents read the
  successor docs.
- `Owns` names the behavior, seam semantics, navigation role, vocabulary role,
  or execution-prep responsibility the target must carry.
- `Does Not Own` names nearby behavior the target must not quietly absorb.
- `Shared / Local Non-Negotiables` names repeated authority that must remain
  local because this target's seam can violate it.
- `Pointer-Only Dependencies` names concepts the target must cite without
  owning.
- `Canonical Source Inputs` are source sections that define this interface.
- `Supporting Source Inputs` are source sections that constrain or reinforce
  this interface but do not define its center.
- `Concept Ledger Inputs` are concept rows feeding this interface.
- `Fidelity Tripwires / Review Debt` names details most likely to be lost in
  Pass 2C.
- `Pass 2C Rewrite Notes` tells the later source-bounded rewrite where to be
  especially mechanical or where to avoid duplicated prose.
- `True Open Questions` should be empty unless the packet proves source
  authority does not answer the issue.

## Repeated Authority Handling

Pass 2B must keep these as local non-negotiables inside every interface whose
seam can violate them:

- final request-input developer-role proof
- pending Initial, ObjectiveUpdated, and BudgetLimit intent surviving until
  final-input commit
- automatic Continuation being idle-selected and not any next request
- request repair being request-local and not cadence
- resume being hydration and not cadence
- raw response item notifications remaining raw
- extension reachability and steering-role config compatibility
- current-turn carry being committed metadata, not pre-finalizer concrete input

Pass 2B may later canonicalize repeated prose with explicit pointers only after
the local non-negotiables above are assigned to the target interfaces that can
violate them.

## Packet Plan

Work one packet at a time. Each packet should draft interface entries for only
its target keys, then stop for review before the next packet.

### [Packet 1: Core Authority](packet-1-core-authority.md)

Status: complete and bottom-up reviewed

Targets:

- `T-BEHAVIOR`
- `T-CADENCE`
- `T-DURABLE`
- `T-FINAL`

Goal:

Define the authority-bearing successor interfaces first. These targets decide
what Goal authority means, when Goal steering is due, what durable cadence
state owns, and where final model request-input shaping and commit happen.

Packet focus:

- developer-role final model request input as authority
- active durable Goal state not being steering by itself
- cadence events and supersedence
- durable facts, durable facts version, pending intent, and exact-key
  consumption
- final request-input shaping, selected item identity, commit point, retry,
  follow-up, current-turn carry, and item fingerprints
- helper/provenance/classifier output not proving authority


### [Packet 2: Lifecycle And Seams](packet-2-lifecycle-and-seams.md)

Status: complete and bottom-up reviewed

Targets:

- `T-IDLE`
- `T-HISTORY`
- `T-EVIDENCE`
- `T-CLEANUP`

Goal:

Define cross-cutting lifecycle and seam interfaces without letting support
mechanisms become authority mechanisms.

Packet focus:

- idle stage order, legal callers, reentrancy, reservations, stale aborts, and
  Goal-owned synthetic turns
- pending durable intent delivery before automatic Continuation
- model-visible history key, eligible progress projection, Continuation
  watermark, resume/restart suppression, compaction effects, rollback, and fork
- structured recorded request evidence as replay/audit support, not authority
  or cadence selection
- classifier, repair, projection, compaction, reconstruction, legacy artifact,
  raw-notification, and current-turn carry cleanup boundaries


### [Packet 3: Support And Execution](packet-3-support-and-execution.md)

Status: complete and bottom-up reviewed

Targets:

- `T-EXT`
- `T-SHIM`
- `T-TEST-PREP`
- `T-READINESS`

Goal:

Keep support and execution targets constrained. They may route, prepare,
remove, prove, or hand off work, but they must not become authority engines.

Packet focus:

- `T-EXT` owns extension lifecycle, configuration, and reachability; it is
  shared where extension mutation can create cadence work and pointer-only to
  final-input authority
- `T-SHIM` owns demolition and removal terrain; it does not own cadence or
  final-input semantics
- `T-TEST-PREP` owns prep sequencing, upstream baseline restoration,
  replacement matrix, and snapshots; it collects proof obligations but must not
  own behavior
- `T-READINESS` owns readiness and handoff criteria only; checklist rows are
  not behavior ownership


### [Packet 4: Navigation And Operations](packet-4-navigation-and-operations.md)

Status: complete and bottom-up reviewed

Targets:

- `NAV-README`
- `GLOSSARY`
- `OP-AGENTS`

Goal:

Define what remains as navigation, vocabulary, and operational instruction
after successor target interfaces exist.

Packet focus:

- `NAV-README` remains a reader map and terrain/navigation aid, not authority
- `GLOSSARY` remains vocabulary-only and must not collect implementation
  details or test obligations
- `OP-AGENTS` keeps authority order, conflict rules, non-negotiable pointers,
  working posture, and verification expectations
- operational short lists may become pointers only after target contracts own
  the full behavior


### [Packet 5: 2B Consistency](packet-5-consistency.md)

Status: complete

Targets:

- all target keys

Goal:

Decide whether Pass 2B is complete enough to start Pass 2C source-bounded
rewrite slices.

Packet focus:

- every target key has an interface entry
- every source row has a route into at least one target interface, a `Leave`
  rationale, or an explicit exclusion rationale
- every high-risk concept has an owner plus shared or pointer-only boundaries
- support, evidence, projection, readiness, navigation, and test-prep targets
  do not own behavior they should only reference
- repeated authority is either local where needed or canonicalized with an
  explicit pointer
- true open questions are separated from fidelity tripwires and settled
  authority


## Interface Drafting Rules

For each packet:

1. Inventory only the packet's target keys.
2. List every section-trace row and concept-ledger row mapped to each target.
3. Classify each mapping as `owns`, `shared`, `pointer-only`, or `wrong/stale`.
4. Verify non-obvious mappings against the named source section.
5. Draft the target interface entries using the template above.
6. Record fidelity tripwires before compressing repeated prose.
7. Stop for review before moving to the next packet.

If a mapping is wrong or stale, fix the Pass 2A prep artifact before relying on
it in this file.

## Cross-Target Ownership Matrix

Filled during Packet 5 after all target entries were drafted and reviewed
together.

| Concept or row | Owner | Shared local targets | Pointer-only targets | Notes |
| --- | --- | --- | --- | --- |
| final request-input developer-role proof | `T-FINAL` | `T-BEHAVIOR`, `T-CADENCE`, `T-CLEANUP`, `T-EXT`, `T-TEST-PREP` | `T-DURABLE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | `T-BEHAVIOR` owns the authority definition; `T-FINAL` owns the concrete proof seam. |
| pending Initial/ObjectiveUpdated/BudgetLimit until commit | `T-DURABLE` | `T-CADENCE`, `T-IDLE`, `T-FINAL`, `T-EXT`, `T-TEST-PREP` | `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-BEHAVIOR`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Preserve exact-key consumption and no consumption before final-input commit. |
| automatic Continuation selection | `T-IDLE` | `T-CADENCE`, `T-HISTORY`, `T-FINAL`, `T-TEST-PREP` | `T-DURABLE`, `T-EVIDENCE`, `T-CLEANUP`, `T-BEHAVIOR`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Must remain idle-selected after pending work and pending durable intent decline. |
| Continuation watermarking | `T-HISTORY` | `T-IDLE`, `T-FINAL`, `T-DURABLE`, `T-EVIDENCE`, `T-TEST-PREP` | `T-CADENCE`, `T-CLEANUP`, `T-BEHAVIOR`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Runtime-only comparison is history-owned; commit advance is final-owned; durable or supported evidence may store/reconstruct committed suppression evidence. |
| request repair | `T-CLEANUP` | `T-FINAL`, `T-CADENCE`, `T-IDLE`, `T-TEST-PREP` | `T-BEHAVIOR`, `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Repair is request-local, not cadence, and classifier output is not authority. |
| resume hydration | `T-IDLE` | `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CADENCE`, `T-TEST-PREP` | `T-FINAL`, `T-CLEANUP`, `T-BEHAVIOR`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Resume reloads facts, pending intent, accounting basis, and suppression basis; it must not fabricate Initial. |
| raw response item notifications | `T-CLEANUP` | `T-TEST-PREP`, `T-EVIDENCE` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Raw remains raw; evidence is not a raw response item. |
| extension reachability/config compatibility | `T-EXT` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-SHIM`, `T-TEST-PREP` | `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Extension cannot own active final-input construction; reachable paths convert, are removed, or are proven unreachable. |
| current-turn carry | `T-FINAL` | `T-CLEANUP`, `T-IDLE`, `T-HISTORY`, `T-TEST-PREP` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-EVIDENCE`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Carry is committed metadata, not pre-finalizer concrete model input. |
| structured recorded request evidence | `T-EVIDENCE` | `T-FINAL`, `T-DURABLE`, `T-HISTORY`, `T-CLEANUP`, `T-TEST-PREP`, `T-READINESS` | `T-BEHAVIOR`, `T-CADENCE`, `T-IDLE`, `T-EXT`, `T-SHIM`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | Evidence supports replay/audit and structured reconstruction support; it is not authority or cadence selection. |
| replacement test profile | `T-TEST-PREP` | `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM` | `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS` | `T-TEST-PREP` owns the matrix; behavior and seam targets keep local proof obligations. |

## Repeated Authority Canonicalization

[repeated-authority-canonicalization.md](repeated-authority-canonicalization.md)
is the stable index for the Pass 2B.5 repeated-authority canonicalization
workspace. The batch files under `repeated_authority_canonicalization/` record
how repeated authority should be compressed during Pass 2C. They do not
rewrite authority. They classify repeated clauses into canonical text, local
reminders, pointer-only references, and operational/test reminders so Pass 2C
does not accidentally remove intentional reinforcement.

## Pass 2C Readiness Checklist

Pass 2C should not start until:

- every target key has a completed interface entry
- every interface names what it owns and does not own
- every repeated high-risk authority clause is assigned as local,
  canonical-with-pointer, or pointer-only
- every `Review debt` item has a named fidelity tripwire
- every `Split` item has per-target owner/shared/pointer-only routing
- every `Canonicalize` item has preserved concept coverage first
- repeated authority has a canonicalization plan before repeated source prose
  is compressed
- every `Leave` item has a cutover rationale
- support targets are confirmed not to own behavior contracts
- source authority docs still control over this artifact
- any plan-derived settled detail used by this artifact has been written into
  the applicable source authority doc

## Verification

For docs-only edits in this directory, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

No Rust tests are needed for Pass 2B docs-only interface-design prep.
