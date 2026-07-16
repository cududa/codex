# Pass 2C Planning Handoff

This is a handoff for a fresh agent starting the next phase of
`local/goal_research` documentation restructuring.

It is a planning handoff, not future implementation authority. It does not
close Pass 2A rows, does not rewrite source-doc content, and does not
start Pass 2C by itself.

Important: the "authority" posture during Pass 2C is different from the
posture an implementation agent should use after successor docs exist. Pass 2C
is the authoring/reconciliation phase that creates the future authority
structure. During this phase, the current source docs are the source corpus
and concept record, not immutable prose to preserve mechanically.

## Suggested Skills

Use these skills, in this order:

1. `.codex/skills/task-alignment`
   - Required posture for this repo work.
   - Use a visible Direction Lock before writing or editing planning artifacts.
2. `.codex/skills/codebase-design`
   - Use the interface/seam vocabulary from the Pass 2B target-interface work.
   - Keep successor docs deep and avoid shallow duplicated summaries.
3. `.codex/skills/domain-modeling`
   - Use only if target names, domain terms, or concept boundaries need
     sharpening.
4. `.codex/skills/handoff`
   - Use only if producing a next-session passforward after a bounded packet.

## Current Phase

The next phase should be **Pass 2C planning**, not immediate Pass 2C rewrite.

Pass 2C itself is supposed to be source-bounded rewrite slices: each source doc
or heading range is rewritten into successor target interfaces from the source
slice, not from a target doc and memory. That remains directionally correct,
but the original plan was too terse to execute directly.

Before rewriting source-doc content, create an execution design for how Pass 2C
will run.

Suggested phase name:

- `Pass 2C-0: Rewrite Execution Design`

Likely artifact:

- `local/goal_research/PASS2C_REWRITE_PLAN.md`

If that file becomes too large, create:

```text
local/goal_research/pass2c_rewrite_plan/
```

with a top-level index, packet files, and templates.

Do not create successor authority docs, rename source docs, rehome source
docs, delete source docs, or start source-bounded rewrite slices until the
rewrite execution plan is explicit.

## What Is Already Complete

### Pass 1

Pass 1 added a navigation layer around the existing authority docs without
moving or deleting authority body content.

Current navigation surfaces:

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`

Every existing authority/support doc has a navigation header.

### Pass 2A

Pass 2A produced coverage inventories:

- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`

These are prep artifacts. They are not authority.

They record:

- source section coverage
- concept-level coverage
- provisional target homes
- high-risk concepts
- review debt and fidelity tripwires
- target homes that need owner/shared/pointer-only interpretation

### Pass 2A.5

Pass 2A.5 performed target-home sanity sweeps. The ledgers were cleaned up
around:

- structured recorded request evidence
- metadata-only same-turn cadence recheck/request metadata
- final-input proof
- retry and follow-up semantics
- model-visible history key and Continuation watermarking
- cleanup/projection/raw notification boundaries
- support/test/readiness/navigation targets not becoming behavior engines

### Pass 2B

Pass 2B designed target document interfaces.

Main index:

- `PASS2B_TARGET_INTERFACES.md`

Workspace:

- `pass2b_target_interfaces/README.md`
- `pass2b_target_interfaces/packet-1-core-authority.md`
- `pass2b_target_interfaces/packet-2-lifecycle-and-seams.md`
- `pass2b_target_interfaces/packet-3-support-and-execution.md`
- `pass2b_target_interfaces/packet-4-navigation-and-operations.md`
- `pass2b_target_interfaces/packet-5-consistency.md`

All Pass 2B target-interface packets are complete enough to feed Pass 2C
planning. Packets 1-4 were bottom-up reviewed. Packet 5 completed the
cross-target consistency review.

### Pass 2B.5

Pass 2B.5 designed repeated-authority canonicalization.

Stable index:

- `pass2b_target_interfaces/repeated-authority-canonicalization.md`

Workspace:

- `pass2b_target_interfaces/repeated_authority_canonicalization/README.md`
- `pass2b_target_interfaces/repeated_authority_canonicalization/batch-1-authority-and-cadence-proof.md`
- `pass2b_target_interfaces/repeated_authority_canonicalization/batch-2-lifecycle-and-attempt-semantics.md`
- `pass2b_target_interfaces/repeated_authority_canonicalization/batch-3-cleanup-evidence-reconstruction.md`
- `pass2b_target_interfaces/repeated_authority_canonicalization/batch-4-support-tests-and-operations.md`

Batches 1-4 are complete enough to feed Pass 2C planning.

Pass 2B.5 does not say to preserve every repeated sentence mechanically. It
says to compress repeated authority through:

- canonical text in the owner target
- local reminders where a seam can violate the rule
- pointer-only references where another target owns the rule
- operational/test reminders where appropriate

## Authority Model

### Future Authority Versus Pass 2C Authoring

After Pass 2C cutover, the successor docs should become the standing authority
for future implementation plans and direct implementation work. Future agents
should then treat those docs as contracts unless a later explicit authority
update changes them.

Pass 2C itself is different. It is the process of establishing that successor
authority structure. During Pass 2C, do not treat the current document shape,
repetition pattern, filenames, or sentence-level prose as immutable. The
authority violation boundary for Pass 2C is loss, weakening, or distortion of
the concepts, decisions, edge cases, and implementation-relevant details.

In practical terms:

- faithful conceptual retention matters more than preserving every sentence
  or repeated paragraph
- repeated prose may be compressed if canonical text, local reminders,
  pointer-only references, or operational/test reminders retain the full
  concept
- current source docs can be reorganized, synthesized, or corrected during
  rewrite planning as long as concepts are faithfully and completely retained
  somewhere traceable
- do not invoke "authority" to block edits whose purpose is to create a more
  accurate, coherent authority structure
- do stop if a rewrite would drop a concept, weaken a non-negotiable, erase an
  exception, or hide an implementation detail that future agents need

The current source docs remain the required source corpus for fidelity review.
They do not require preservationist treatment of every wording choice during
this authoring phase.

### Source Corpus

Read `AGENTS.md` first. It names the current source-doc read order:

1. `goal-authority-grounding-truth.md`
2. `goal-authority-primary-cadence-contract.md`
3. `goal-authority-idle-continuation-contract.md`
4. `goal-authority-fake-shim-removal-map.md`
5. `goal-test-deletion-map.md`

Supporting seam docs are named by `README.md`, especially:

- `goal-authority-durable-cadence-state.md`
- `goal-authority-final-request-input-and-commit.md`
- `goal-authority-recorded-request-evidence.md`
- `goal-authority-model-visible-history-key.md`
- `goal-authority-ext-goal-ownership.md`
- `goal-authority-repair-classifier-integration.md`
- `goal-authority-open-design-deliverables.md`

### Work-Area Validation Is Required For Pass 2C

For Pass 2C specifically, also validate against:

- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-route-index.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- the relevant numbered work-area and pass docs under
  `local/goal_136_plan/work-areas/`

Those work-area docs are exhaustively researched implementation design
artifacts for the v136 Goal rewrite. They may be slightly ahead of the current
`local/goal_research` source docs because later design details were resolved
while planning implementation passes.

During Pass 2C rewrite planning and rewrite slices:

- validate each affected concept against the relevant work-area docs
- when a work-area doc is more precise than an older source doc, integrate the
  work-area decision into the successor target docs
- on conflict or uncertainty between an older source doc and a work-area
  decision, prefer the work-area decision if it preserves the underlying
  concept and represents the latest researched implementation route
- record the reconciliation in the slice trace or fidelity audit so the
  successor docs become the future authority and do not require future agents
  to cite the work-area docs
- stop only when the work-area decision would actually drop, invert, or weaken
  an underlying Goal concept or non-negotiable

Do not use this as permission to promote arbitrary implementation terrain. The
work-area docs win for researched v136 design decisions; current Rust code
still remains terrain unless the work-area/source corpus explicitly adopts it.

Existing Rust code is terrain, not mission.

## Mental Model For Pass 2C

Do not think of Pass 2C as "write the target docs from the target interfaces."

Think of Pass 2C as a **source-bounded translation process**:

1. Pick one source doc or bounded source heading range.
2. Read that source slice top to bottom.
3. Read the relevant Pass 2A traceability rows.
4. Read the relevant Pass 2A concept rows.
5. Read the relevant Pass 2B target interface entries.
6. Read the relevant Pass 2B.5 repeated-authority entries.
7. Read the relevant `local/goal_136_plan/work-areas` docs for the concept or
   seam being rewritten.
8. Reconcile source-doc wording with work-area decisions, preferring the
   work-area route on conflict or uncertainty when the underlying concept is
   retained.
9. Rewrite that source slice into one or more successor draft targets.
10. Record exactly where each source section/heading/clause landed and where
   any work-area decision was integrated.
11. Audit the slice for lost detail, weakened non-negotiables, stale terrain
   framing, bad pointers, and over-compressed repeated authority.
12. Close the source slice only after fidelity debt is resolved or explicitly
    recorded.

The successor target docs are where synthesis lands. They are not where the
slice starts.

This matters because starting from a target doc invites synthesis from memory.
Starting from a source slice forces every clause to be accounted for.

## Immediate Objective For The Fresh Agent

Create the Pass 2C rewrite execution plan.

Suggested artifact:

- `local/goal_research/PASS2C_REWRITE_PLAN.md`

Recommended objective statement:

> Design the executable Pass 2C rewrite process. Define where successor draft
> docs will live, how source slices will be chosen, what each slice must
> produce, how traceability closure works, how repeated authority compression
> is audited, and what must be true before cutover. Do not start rewrite
> slices yet.

Do not stop at a proposal if the user asks you to write the plan. Write the
planning artifact directly after grounding and Direction Lock.

## Required Grounding For 2C-0

Read:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/README.md`
3. `local/goal_research/CONTEXT.md`
4. `local/goal_research/PASS2_SECTION_TRACEABILITY.md`
5. `local/goal_research/PASS2_CONCEPT_LEDGER.md`
6. `local/goal_research/PASS2B_TARGET_INTERFACES.md`
7. `local/goal_research/pass2b_target_interfaces/README.md`
8. `local/goal_research/pass2b_target_interfaces/packet-5-consistency.md`
9. `local/goal_research/pass2b_target_interfaces/repeated-authority-canonicalization.md`
10. `local/goal_research/pass2b_target_interfaces/repeated_authority_canonicalization/README.md`
11. `local/goal_136_plan/work-areas/AGENTS.md`
12. `local/goal_136_plan/work-areas/implementation-route-index.md`
13. `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`

Read individual Pass 2B packet files and repeated-authority batch files as
needed while designing the rewrite plan.

Read individual work-area files as needed while defining the Pass 2C planning
process. During actual Pass 2C rewrite slices, the relevant work-area docs are
part of the required slice grounding.

Do not reread every source doc for 2C-0 unless a planning question requires
source receipts. 2C-0 is process design. The actual 2C rewrite slices must
reread their source slice top to bottom and validate against the relevant
work-area docs.

## Direction Lock For 2C-0

Use this before editing:

```text
Request:
Authority:
Terrain:
Code-shape temptation:
Locked direction:
Exclusions:
```

Suggested lock content:

- Request: create the Pass 2C rewrite execution plan, not start rewrite
  slices.
- Authority: Pass 2C is an authoring/reconciliation phase; current source docs
  are the source corpus, Pass 2A/2B/2B.5 artifacts are prep, and relevant
  work-area decisions win on conflict or uncertainty when they retain the
  underlying concepts.
- Terrain: target interfaces and canonicalization batches are ready to feed
  planning; `local/goal_136_plan/work-areas` contains researched v136 design
  decisions; no source rewrite or cutover has started.
- Code-shape temptation: start drafting target docs from memory or treat
  target interfaces as successor authority.
- Locked direction: design the rewrite workflow, slice structure, closure
  criteria, and cutover gates.
- Exclusions: no source-doc rewrite, no Rust code, no rename/rehome/
  delete, no successor authority cutover.

## What The 2C Rewrite Plan Should Define

The rewrite plan should probably include these sections.

### 1. Purpose And Constraints

State that 2C rewrites source-doc corpus into successor draft docs in
source-bounded slices.

Repeat the controlling constraints:

- current source docs are the source corpus until cutover
- Pass 2A/2B/2B.5 artifacts are prep
- no rewrite from memory
- no source deletion/rename/rehome before all slices close
- no Rust implementation work
- every affected slice validates against relevant `goal_136_plan/work-areas`
  docs
- work-area decisions win on conflict or uncertainty when they preserve the
  underlying Goal concepts and represent the latest researched v136 design
  route

### 2. Artifact Shape

Decide where successor draft docs and slice closure records live.

Possible shape:

```text
local/goal_research/
  PASS2C_REWRITE_PLAN.md
  pass2c_rewrite/
    README.md
    successor_drafts/
      ...
    slices/
      ...
    audits/
      ...
```

Do not create the whole structure automatically unless the user asks the 2C-0
agent to proceed beyond the plan. The plan should choose the shape clearly.

### 3. Successor Target Draft Set

Use Pass 2B target interfaces as the input, but the plan should decide the
draft document set explicitly.

The plan may keep one successor draft per target key, or consolidate targets
where the Pass 2B interfaces indicate a tighter reader module. Do not decide
consolidation casually.

Target keys that need routes:

- `T-BEHAVIOR`
- `T-CADENCE`
- `T-DURABLE`
- `T-FINAL`
- `T-IDLE`
- `T-HISTORY`
- `T-EVIDENCE`
- `T-CLEANUP`
- `T-EXT`
- `T-SHIM`
- `T-TEST-PREP`
- `T-READINESS`
- `NAV-README`
- `GLOSSARY`
- `OP-AGENTS`

Important: target keys are provisional interfaces, not final filenames.

### 4. Slice Unit

Define what a rewrite slice is.

Recommended default:

- one source doc if small enough
- one major source heading range if the doc is too large or cross-cutting

Each slice starts from source text, not from a target doc.

Each slice should record:

- source file
- source heading range
- exact source sections included
- target draft doc(s) touched
- concept ledger rows consulted
- repeated-authority batch entries consulted
- work-area docs consulted
- source/work-area reconciliation decisions
- local reminders preserved
- pointer-only references introduced
- fidelity tripwires checked
- unresolved fidelity debt
- closure status

### 5. Slice Order

The plan should propose an order, not start rewriting.

A plausible order:

1. Behavioral spine slice:
   - `goal-authority-grounding-truth.md`
2. Cadence spine slice:
   - `goal-authority-primary-cadence-contract.md`
3. Idle lifecycle slice:
   - `goal-authority-idle-continuation-contract.md`
4. Durable and final seam slices:
   - `goal-authority-durable-cadence-state.md`
   - `goal-authority-final-request-input-and-commit.md`
5. History and evidence slices:
   - `goal-authority-model-visible-history-key.md`
   - `goal-authority-recorded-request-evidence.md`
6. Cleanup/classifier slice:
   - `goal-authority-repair-classifier-integration.md`
7. Extension and shim slices:
   - `goal-authority-ext-goal-ownership.md`
   - `goal-authority-fake-shim-removal-map.md`
8. Test prep and readiness slices:
   - `goal-test-deletion-map.md`
   - `goal-authority-open-design-deliverables.md`
9. Navigation and operations slices:
   - `AGENTS.md`
   - `README.md`
   - `CONTEXT.md`

This order may need adjustment, but do not start with navigation/operations.
The target contracts need to exist before AGENTS/README/CONTEXT can shrink.

### 6. Per-Slice Workflow

Recommended workflow:

1. Read applicable source slice top to bottom.
2. Pull all traceability rows for that slice.
3. Pull all concept ledger rows referenced by that slice.
4. Pull relevant Pass 2B target interface entries.
5. Pull relevant Pass 2B.5 canonicalization entries.
6. Pull relevant `goal_136_plan/work-areas` docs for that concept or seam.
7. Reconcile the current source-doc wording with the latest work-area design
   decisions.
8. Write or update the successor draft target sections.
9. Record a source-to-target trace entry, including any work-area decision
   that updated or sharpened the older source wording.
10. Run a fidelity audit.
11. Record closure or fidelity debt.
12. Stop before the next slice unless the packet explicitly includes more.

### 7. Slice Closure Standard

A slice is not closed merely because the prose has been rewritten.

Closure requires:

- every source heading and subheading in the slice is accounted for
- every source clause is either carried canonically, represented as a local
  reminder, converted to pointer-only with the owner named, or explicitly
  classified as operational/test/navigation material
- every source-specific exception/caveat is either preserved or intentionally
  resolved by the target interface
- every source/work-area conflict or uncertainty in the slice is reconciled,
  with the work-area route winning when it preserves the underlying concept
- repeated authority compression follows the Pass 2B.5 batch entry
- no support/test/readiness/navigation target owns behavior by accident
- no current broken Rust terrain is promoted into desired architecture
- no source row is marked closed by a generic summary
- unresolved fidelity debt is recorded with source file, heading, clause, and
  target impact

### 8. Fidelity Audit Checklist

Every slice should check at least:

- final request-input developer-role proof
- pending Initial/ObjectiveUpdated/BudgetLimit until commit
- exact-key consumption
- automatic Continuation idle selection and watermarking
- resume hydration, not cadence
- retry before commit vs retry after commit
- same-turn cadence recheck/request metadata as metadata only
- current-turn carry as committed metadata
- repair as request-local, not cadence
- classifier/provenance/helper output not authority
- structured recorded request evidence as replay/audit support, not authority
- raw response notifications remain raw
- compaction/reconstruction/rollback/fork no runtime archaeology
- extension reachability/config compatibility
- fake-shim deletion terrain not preserved as compatibility
- replacement test matrix not behavior authority
- readiness/navigation/glossary/AGENTS not behavior engines
- relevant `goal_136_plan/work-areas` decisions have been checked, and any
  more precise work-area route has been integrated into successor prose

### 9. Repeated Authority Compression Rule

Use the Pass 2B.5 workspace.

Do not preserve duplicate prose mechanically.

Do not compress repeated prose until:

- the canonical owner has the full contract
- local reminders are present where a seam can violate the rule
- pointer-only references name the owner
- operational/test reminders are short and non-authoritative
- the source slice audit confirms no edge case was lost
- the relevant work-area docs do not carry a sharper route that should be
  reflected in the canonical owner or local reminder

### 10. Source/Work-Area Reconciliation Rule

Every Pass 2C rewrite slice should include an explicit reconciliation step.

Use this rule:

- If source docs and work-area docs agree, carry the concept normally.
- If source docs are broader and work-area docs are more precise, use the
  work-area route in successor prose and preserve the broader concept as
  framing where useful.
- If source docs are older or vaguer and work-area docs answer the concrete
  implementation route, use the work-area answer.
- If source docs and work-area docs appear to conflict, prefer the work-area
  route for 2C if it preserves the underlying concept and reflects the latest
  researched v136 design.
- If the work-area route would drop, invert, or weaken a core concept, stop
  and name the conflict.

Record the reconciliation in the slice closure notes. The end state should be
that future implementation agents rely on the successor docs, not on a
private memory of which work-area won.

### 11. Cutover Gates

Cutover is not part of initial 2C planning or first rewrite slices.

Cutover should wait until:

- all source slices are closed
- successor drafts are cross-reviewed for conflicts and omissions
- section traceability maps every source section to a successor location,
  retained navigation/operation location, or explicit exclusion
- repeated authority compression has been audited
- source/work-area reconciliation has been audited for every affected slice
- AGENTS/README/CONTEXT cutover wording is planned
- old source docs can be renamed/rehome/deleted without losing concepts or
  traceability
- verification passes

## High-Risk Failure Modes

Warn future agents about these explicitly:

- starting from target docs and synthesizing from memory
- treating Pass 2A/2B/2B.5 prep artifacts as authority
- treating current source-doc prose as immutable during the authoring phase
- refusing to integrate a clearer work-area decision because an older source
  doc says the same concept less precisely
- citing `goal_136_plan/work-areas` forever instead of integrating its
  decisions into successor authority docs
- treating `Open` or `Review debt` as unresolved design by default
- preserving repeated prose mechanically instead of using 2B.5 routing
- collapsing repeated authority before canonical owner and local reminders are
  written
- letting `T-TEST-PREP`, `T-READINESS`, `NAV-README`, `GLOSSARY`, or
  `OP-AGENTS` become behavior authority
- making structured recorded request evidence a proof layer or authority
  mechanism
- using "same-turn injection" as the planned replacement target
- losing the metadata-only same-turn cadence recheck/request metadata
  distinction
- making current broken Rust terrain desired architecture
- deleting or renaming source docs before all slices close
- making AGENTS.md the only surviving place for a non-negotiable
- letting glossary definitions carry edge-case behavior
- skipping work-area validation during slices that touch implementation-shaped
  decisions

## Expected First Packet Deliverable

The next agent should produce a Pass 2C planning artifact, probably:

- `local/goal_research/PASS2C_REWRITE_PLAN.md`

That artifact should answer:

- What is the 2C artifact structure?
- What successor draft docs will be created, and where?
- What is the source-slice template?
- What is the slice closure template?
- What is the proposed slice order?
- How does a slice use Pass 2A traceability, Pass 2A concept coverage, Pass
  2B target interfaces, and Pass 2B.5 canonicalization?
- How does a slice validate against and reconcile relevant
  `goal_136_plan/work-areas` decisions?
- How is repeated authority compressed without losing fidelity?
- What are the cutover preconditions?
- What verification runs after docs-only planning changes?

The first packet should not:

- rewrite source-doc prose
- create final successor docs unless explicitly asked
- rename/rehome/delete source docs
- edit Rust
- ignore `local/goal_136_plan/work-areas` when the slice touches a researched
  implementation route

## Verification

For docs-only planning work in `local/goal_research`, run:

```text
git diff --check -- local/goal_research
rg -n "[ \t]$" local/goal_research
```

Normal CRLF warnings may appear on Windows.

No Rust tests are needed for docs-only Pass 2C planning artifacts.
