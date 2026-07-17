# Successor-Doc Drafting Protocol Handoffs

This file contains reusable handoffs for creating
`SUCCESSOR_DOC_DRAFTING_PROTOCOL.md` in three bounded sessions.

These handoffs are not the drafting protocol, not successor authority prose,
and not implementation planning. They are prompts to run one at a time after
the successor topology blueprint has been accepted.

## Repeatable Header

Use this header with each session block below.

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: Drafting Protocol And Coverage Checks
Session: <drop in one session block below>

Context:
- Pass 2B / Pass 2B.5 prep is complete.
- The current docs are source corpus and concept record, not immutable prose.
- Session 1 requirements live at:
  - local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- The accepted topology blueprint lives at:
  - local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- The expected output for this phase is:
  - local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md
- The topology blueprint is accepted input. Do not redesign it unless this
  session finds a direct gap that makes the requested protocol impossible.
- Do not draft successor authority docs.
- Do not use source-heading rows as the writing method.
- Do not create one-to-one target drafts.
- Traceability is a coverage check, not the writing algorithm.

User authority:
- The user wants successor-doc architecture and drafting protocol designed
  before any rewrite execution.
- Current source docs and prep artifacts inform the design, but they do not
  dictate the final topology or drafting order.
- The topology blueprint controls the proposed successor doc list,
  control/conflict order, ownership boundaries, routing, and reconciliation
  posture.
- Temporary route inventory is optional reconciliation/provenance input only
  when a conflict or missing represented route decision is suspected, not
  future authority for successor readers.
- If a route decision needed for drafting is not represented in corrected
  local source docs or the topology blueprint, stop and name the missing owner
  or conflict. Do not make successor docs depend on temporary route inventory.
- If a source concept and work-area route decision truly conflict, stop and
  name the conflict.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Deliverable rules:
- Produce only this session's update to
  local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md.
- Keep it compact enough for the next agent.
- Preserve concept authority and implementation-relevant detail.
- Do not start the next session unless explicitly asked.
- Do not edit successor authority docs.
- Do not edit topology files unless a direct gap makes this session impossible;
  if so, stop and report the gap instead of patching it.
- For docs-only edits, verify with:
  - git diff --check -- local/goal_research
  - rg -n "[ \t]$" local/goal_research
```

## Session 3.1: Drafting Order And Per-Doc Inputs

```text
Session: 3.1 Drafting Order And Per-Doc Inputs

Objective:
Create the drafting protocol skeleton and define the order in which successor
docs should be drafted, plus the required inputs for each successor doc.

Read first:
- local/goal_research/AGENTS.md
- local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_research/PASS2_CONCEPT_LEDGER.md
- local/goal_research/PASS2_SECTION_TRACEABILITY.md

Target output:
- Create local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md

Fill only:
- Purpose and scope of the drafting protocol.
- Drafting order for the successor docs listed in the topology blueprint.
- Required inputs for each successor doc.
- Optional route-provenance check:
  - use temporary route provenance only if a conflict or missing represented
    route decision is suspected and a provenance copy is available
  - require successor prose to stand on corrected local docs and topology
  - stop if a needed route decision is not represented in corrected local docs
    or the topology blueprint
- Stop conditions for missing authority, direct source/route conflict, or a
  topology gap.

Drafting-order expectations:
- Start with behavior, cadence, durable state, and final request input because
  they define the high-authority core.
- Draft idle/history after durable/final because it depends on pending intent,
  commit, carry, and watermark ownership boundaries.
- Draft request repair/classification before projection/reconstruction/raw
  history because projection must not become repair or authority.
- Draft recorded request evidence after final request input and before review
  checks that rely on evidence.
- Draft extension/reachability after behavior, cadence, durable, final, and
  idle/history because extension routes into those seams.
- Draft test-prep/proof and readiness/handoff last because they collect proof
  and handoff obligations but do not own behavior.

Do not fill:
- Concept coverage matrix.
- Traceability check method.
- Repeated-authority compression rules.
- Review checklist.
- Successor authority prose.

Deliverable:
- Report the file created and summarize the drafting order plus stop
  conditions.
```

## Session 3.2: Coverage And Compression Checks

```text
Session: 3.2 Coverage And Compression Checks

Objective:
Add the concept coverage, source traceability, and repeated-authority
compression checks to the drafting protocol.

Read first:
- local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md
- local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_research/PASS2_CONCEPT_LEDGER.md
- local/goal_research/PASS2_SECTION_TRACEABILITY.md
- local/goal_research/PASS2B_TARGET_INTERFACES.md
- local/goal_research/pass2b_target_interfaces/repeated-authority-canonicalization.md
- local/goal_research/pass2b_target_interfaces/repeated_authority_canonicalization/README.md

Use targeted reads as needed:
- repeated-authority batch files under
  local/goal_research/pass2b_target_interfaces/repeated_authority_canonicalization/
- Pass 2B packet files only when the topology blueprint does not provide enough
  owner/shared/pointer context for a check.

Target output:
- Update local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md

Fill:
- Concept coverage checklist for each successor doc.
- Traceability check method to run after each successor doc draft.
- Source-coverage expectations:
  - every relevant current source section must be accounted for
  - traceability checks coverage and loss, not drafting order
  - section order must not become prose order by default
- Repeated-authority compression rules:
  - canonical owner carries full source-backed contract
  - local reminders stay only where that seam can violate the rule
  - pointer-only references go where another doc owns the semantics
  - operational/test reminders stay short and non-authoritative
- Compression tripwires:
  - do not flatten negative rules
  - do not erase exceptions
  - do not move behavior into README, AGENTS, CONTEXT, readiness, evidence, or
    test-prep just because those are easier to read
  - do not preserve every repeated sentence when the concept is retained

Do not fill:
- Final review checklist.
- Final readiness criteria.
- Successor authority prose.
- Implementation plan.

Deliverable:
- Report the file updated and summarize the coverage, traceability, and
  compression checks added.
```

## Session 3.3: Review And Closure Gates

```text
Session: 3.3 Review And Closure Gates

Objective:
Complete the drafting protocol with review checks, work-area reconciliation
review, stop conditions, and final readiness criteria before successor-doc
drafting begins.

Read first:
- local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md
- local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_research/PASS2_CONCEPT_LEDGER.md
- local/goal_research/PASS2_SECTION_TRACEABILITY.md

Use targeted reads as needed:
- repeated-authority batch files only when reviewing compression risks.
- optional temporary provenance only if a source/route conflict or missing
  represented route decision is suspected and a provenance copy is available.
  Do not make successor drafting depend on route-plan files.

Target output:
- Update local/goal_research/SUCCESSOR_DOC_DRAFTING_PROTOCOL.md

Fill:
- Review checklist for every successor doc draft:
  - concept loss
  - weakened authority
  - duplicated or drifting authority
  - support mechanism promoted to authority
  - misplaced implementation detail
  - omitted edge case, caveat, exception, or negative rule
  - source coverage gap
  - route reconciliation gap
- Work-area reconciliation review rules:
  - route decisions clarify implementation-shaped details
  - route decisions must be absorbed into successor prose where they preserve
    the underlying concept
  - temporary route records must not remain required future authority
  - true source/route conflict stops drafting for the affected doc
- Final protocol stop conditions:
  - topology gap
  - missing source owner
  - unrepresented route decision
  - conflicting source/route authority
  - inability to preserve a non-negotiable without rewriting topology
  - temptation to draft from section order or target-key order
- Final readiness criteria before successor drafting:
  - drafting order exists
  - per-doc inputs exist
  - concept checks exist
  - traceability method exists
  - repeated-authority compression rules exist
  - work-area reconciliation rules exist
  - review checklist exists
  - stop conditions exist

Do not:
- Do not draft successor authority prose.
- Do not create successor docs.
- Do not start implementation planning.
- Do not redesign the topology unless the protocol cannot be completed without
  naming a direct topology gap.

Deliverable:
- Report the file updated.
- Confirm whether the drafting protocol is complete enough to hand to the
  first successor-doc drafting session.
- If not complete, list exact missing protocol sections only.
```
