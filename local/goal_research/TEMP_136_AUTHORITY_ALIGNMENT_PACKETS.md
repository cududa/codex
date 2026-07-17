# Temporary 136 Authority Alignment Packets

This temporary planning file gives copy/paste-ready packets for aligning
`local/goal_research` with the completed `local/goal_136_plan` architecture
before successor authority docs are drafted.

Delete or archive this file after the alignment packets have been executed and
their results have been integrated into the real `goal_research` docs.

## Controlling Posture

- `local/goal_136_plan` is the absolute authority for these alignment passes.
- Existing `goal-authority-*` docs in `local/goal_research` are lagging
  authority surfaces. They are not locked against the 136 plan.
- If a 136-plan decision conflicts with, sharpens, or supersedes a current
  `goal-authority-*` doc, update or rewrite the applicable authority doc in
  place. Do not add an external override note or a table that leaves the old
  prose standing.
- Future successor docs in `local/goal_research` must be standalone. They must
  absorb the 136-plan decisions rather than refer readers to
  `local/goal_136_plan`.
- These passes should not validate against current code. Code may be consulted
  only for limited orientation, existing function/type names, or when a packet
  explicitly allows a narrow upstream-baseline name check.
- If local code, current source prose, or old Pass 2 artifacts encourage
  mechanical source-order execution, treat that as stale process shape.

## Reusable Packet Prompt Shape

Copy this shape into each packet session, then fill the packet-specific slots.
This is intentionally shaped like the Packet 1 handoff prompt: a fresh agent
should see the source packet, packet context, user authority, Direction Lock
requirement, read list, output, fill rules, exclusions, and verification in one
place.

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: [PACKET_ID] [PACKET_TITLE]

Context:
- Use local/goal_research/TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md as the source
  packet for this session.
- Pass 2B / Pass 2B.5 prep is complete.
- `local/goal_136_plan` is absolute authority for this alignment work.
- Existing `local/goal_research/goal-authority-*` docs are lagging authority
  surfaces. Later packets must update or rewrite them directly when they
  diverge from the 136 plan.
- The final successor `goal_research` docs must be standalone and must not
  depend on references to `local/goal_136_plan`.
- [PACKET_SPECIFIC_CONTEXT]
- Do not use source-heading rows as the writing method.
- Do not create one-to-one target drafts.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code unless this packet explicitly allows a
  narrow orientation check.

User authority:
- The user wants `goal_research` brought into alignment with the 136-plan
  architecture before successor-doc drafting.
- When the 136 plan and current `goal_research` authority docs differ, the
  136 plan wins.
- Do not preserve conflicting `goal-authority-*` clauses by adding override
  notes later. Correction packets must update or rewrite the owning authority
  docs.
- If the 136 plan itself contains an internal conflict,
  stop and name the conflict with exact files/sections.
- If code appears to disagree with the 136 plan, ignore code for these packets
  unless the packet explicitly says the code read is only for orientation.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/AGENTS.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_136_plan/work-areas/AGENTS.md
- local/goal_136_plan/work-areas/implementation-route-index.md
- [PACKET_INPUTS]

Output:
- [PACKET_OUTPUTS]

Fill:
- [PACKET_FILL]

Do not:
- [PACKET_DO_NOT]

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

## Packet 1: Route Decision Inventory

Use this packet to extract settled 136-plan decisions into a temporary bridge
inventory before editing the topology or authority docs broadly.

Packet 1 is intentionally an inventory pass. A successful Packet 1 does not
fix the current `goal-authority-*` docs. It gives the next packet enough
structured evidence to fix those docs without rereading every 136-plan file
from scratch.

### Ready-To-Send Packet 1 Handoff

This is the preferred handoff text when starting Packet 1 with a fresh agent.
It repeats the core posture so the agent does not need this conversation.

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 1 Route Decision Inventory

Context:
- Use local/goal_research/TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md as the source
  packet for this session.
- Pass 2B / Pass 2B.5 prep is complete.
- `local/goal_136_plan` is absolute authority for this alignment work.
- Existing `local/goal_research/goal-authority-*` docs are lagging authority
  surfaces. Later packets must update or rewrite them directly when they
  diverge from the 136 plan.
- Packet 1 is inventory only. It identifies settled 136-plan decisions and
  likely current-doc discrepancies; it does not correct the authority docs yet.
- The final successor `goal_research` docs must be standalone and must not
  depend on references to `local/goal_136_plan`.
- Do not use source-heading rows as the writing method.
- Do not create one-to-one target drafts.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- The user wants `goal_research` brought into alignment with the 136-plan
  architecture before successor-doc drafting.
- When the 136 plan and current `goal_research` authority docs differ, the
  136 plan wins.
- Do not preserve conflicting `goal-authority-*` clauses by adding override
  notes later; later correction packets must update or rewrite the owning
  authority docs.
- If the 136 plan itself contains an internal conflict, stop and name the
  conflict with exact files/sections.
- If code appears to disagree with the 136 plan, ignore code for this packet.
  Code is not validation input here.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md
- local/goal_research/AGENTS.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_136_plan/work-areas/AGENTS.md
- local/goal_136_plan/work-areas/implementation-route-index.md
- local/goal_136_plan/work-areas/00-test-prep-and-baseline-reset.md
- local/goal_136_plan/work-areas/01-durable-cadence-state.md
- local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md
- local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md
- local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md
- local/goal_136_plan/work-areas/04-ext-goal-conversion.md
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md
- local/goal_136_plan/work-areas/06-cleanup-and-acceptance.md
- local/goal_136_plan/work-areas/06g-final-acceptance-tests-and-audit-gates.md

Output:
- Create or update local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md

Fill:
- Settled 136 decisions grouped by concept, not by source heading.
- For each decision:
  - decision statement
  - 136-plan source file/section
  - affected current `goal_research` authority docs
  - affected successor topology surface
  - whether current authority prose appears aligned, stale, incomplete, or
    conflicting
  - whether the decision needs direct authority-doc rewrite in a later packet
- Internal 136-plan conflicts, if any.
- Keep the inventory compact enough for Packet 2 to use directly.

Do not:
- Do not edit `goal-authority-*` docs in this packet.
- Do not update the topology blueprint in this packet.
- Do not validate against current code.
- Do not use source-heading order as the inventory structure.
- Do not decide final successor prose.
- Do not start Packet 2.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

### Packet 1 Output Shape

The inventory should be compact and concept-shaped. Use this structure unless
the 136 plan exposes a better concept grouping:

```markdown
# 136 Route Decision Inventory

This is a temporary Packet 1 inventory. It does not rewrite authority docs and
does not become successor authority.

## Status

- Packet: 1 Route Decision Inventory
- Scope: settled 136-plan decisions only
- Code validation: not performed and not applicable
- Internal 136-plan conflicts: none found / listed below

## Decision Index

| Concept family | Decision count | Current authority status | Later rewrite needed |
| --- | ---: | --- | --- |
| Active authority and final input |  | aligned / stale / incomplete / conflicting | yes/no |

## Decisions

### [Concept Family]

#### [Short Decision Name]

- Decision:
- 136 source:
- Affected current authority docs:
- Affected successor topology surface:
- Current authority status:
- Later authority-doc rewrite needed:
- Notes for later packet:

## Internal 136-Plan Conflicts

- None found.
```

### Suggested Concept Families

Use these as starting buckets. Merge or split them only when the 136 plan's
actual decisions make that clearer.

- Active authority and final request input
- Durable facts, pending intent, exact-key consumption, and state non-ownership
- Idle lifecycle, model-visible history key, Continuation, resume, retry, and
  committed carry
- Recorded request evidence and metadata-only replay/audit boundaries
- Extension/app-server lifecycle, adapter/runtime route, metadata wake, and
  facade decision
- Classifier, request repair, projection, raw notifications, compaction, and
  reconstruction
- Fake-shim demolition and old active-root deletion terrain
- Test prep, upstream baseline, replacement proof, and final acceptance
- Operations, navigation, glossary, readiness, and standalone-doc posture

### Status Labels

Use these labels consistently so Packet 2 can sort work quickly:

- `aligned`: current authority prose already says the 136 decision clearly.
- `stale`: current authority prose says an older or weaker thing and needs
  direct rewrite.
- `incomplete`: current authority prose is not wrong, but it lacks a settled
  136 detail needed for standalone successor drafting.
- `conflicting`: current authority prose contradicts the 136 decision.
- `needs-scope`: the inventory found too many affected clauses to correct in
  one later packet without a scoping pass.

### What Counts As A Decision

Include a 136-plan statement when it would change or constrain future
`goal_research` authority prose. Examples:

- selected ownership or non-ownership of a behavior
- chosen route among alternatives
- explicit rejection of an architecture
- commit point or correctness boundary
- failure/retry/resume semantics
- test proof layer
- support surface that must not become authority

Do not include ordinary implementation steps unless they carry authority
meaning for future docs. For example, "add migration file X" is usually not a
successor-authority decision, while "durable state owns pending intent and
state does not construct model input" is.

### Packet 1 Success Criteria

Packet 1 is successful when:

- the inventory is readable without opening this temp packet file
- decisions are grouped by concept family rather than 136 work-area order
- each decision cites exact 136-plan source files/sections
- each decision names affected current authority docs and successor topology
  surfaces
- stale, incomplete, and conflicting current authority surfaces are marked
  explicitly for later correction
- no current authority doc has been rewritten yet
- no code validation was performed
- Packet 2 can begin by reading the inventory and targeted authority docs,
  instead of rereading all of WA00-WA06

```text
PACKET_ID: 1
PACKET_TITLE: Route Decision Inventory

PACKET_INPUTS:
- local/goal_136_plan/work-areas/00-test-prep-and-baseline-reset.md
- local/goal_136_plan/work-areas/01-durable-cadence-state.md
- local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md
- local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md
- local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md
- local/goal_136_plan/work-areas/04-ext-goal-conversion.md
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md
- local/goal_136_plan/work-areas/06-cleanup-and-acceptance.md
- local/goal_136_plan/work-areas/06g-final-acceptance-tests-and-audit-gates.md

PACKET_OUTPUTS:
- Create or update local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md

PACKET_FILL:
- Settled 136 decisions grouped by concept, not by source heading.
- For each decision:
  - decision statement
  - 136-plan source file/section
  - affected current `goal_research` authority docs
  - affected successor topology surface
  - whether current authority prose appears aligned, stale, incomplete, or
    conflicting
  - whether the decision needs direct authority-doc rewrite in a later packet
- Internal 136-plan conflicts, if any.

PACKET_DO_NOT:
- Do not edit `goal-authority-*` docs in this packet unless the user explicitly
  asks to combine inventory and correction.
- Do not validate against current code.
- Do not use source-heading order as the inventory structure.
- Do not decide final successor prose.
```

Expected size: likely one session if the agent keeps the inventory compact. If
the decision list starts becoming pass-by-pass commentary, stop and scope it
into concept batches instead.

## Packet 2: Blueprint Standalone Correction And Authority Sync

Use this packet to make the topology blueprint standalone and correct against
the route decision inventory. This packet must also update current authority
docs when the blueprint correction depends on a 136 decision that current
authority prose does not yet say correctly.

```text
PACKET_ID: 2
PACKET_TITLE: Blueprint Standalone Correction And Authority Sync

PACKET_INPUTS:
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- local/goal_research/PASS2_CONCEPT_LEDGER.md, only for coverage checks
- local/goal_research/PASS2_SECTION_TRACEABILITY.md, only for coverage checks
- current `goal-authority-*` docs named by the inventory

PACKET_OUTPUTS:
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- Update affected current `goal-authority-*` docs directly when needed

PACKET_FILL:
- Remove `goal_136_plan` references from the blueprint as future authority
  dependencies.
- Convert 136-plan reconciliation notes into standalone topology decisions.
- Resolve open questions answered by the user:
  - operations should stay in `AGENTS.md`
  - navigation should stay in `README.md`
  - glossary should stay in `CONTEXT.md`
  - fake-shim demolition terrain should not remain a long-lived successor
    authority doc; route it to `goal_136_plan` root for separate handling
  - evidence remains standalone
- Update or rewrite any current authority doc whose prose disagrees with the
  standalone topology decision being made.
- Record any remaining open questions only when the 136 plan does not answer
  them.

PACKET_DO_NOT:
- Do not leave a stale authority clause in place with a note saying the
  blueprint supersedes it.
- Do not draft successor authority docs.
- Do not create a drafting protocol.
- Do not move files into `goal_136_plan`; only reflect the topology decision
  unless the user explicitly asks for the move.
```

Expected size: likely more than one session if many authority-doc discrepancies
surface. If the inventory marks more than 4-6 authority docs as needing direct
rewrite, run a scoping pass first and split this into correction batches.

## Packet 3: Per-Doc Conformance Sweep

This packet is too broad to execute safely as one session unless Packet 1 shows
very few discrepancies. Run a scoping pass first, then split into successor
surface batches.

```text
PACKET_ID: 3
PACKET_TITLE: Per-Doc Conformance Sweep

PACKET_INPUTS:
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- all current `goal-authority-*` docs
- local/goal_research/AGENTS.md
- local/goal_research/README.md
- local/goal_research/CONTEXT.md

PACKET_OUTPUTS:
- Update affected current authority docs directly
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if the
  sweep finds a direct topology gap
- Optionally create/update a temporary packet-specific checklist under
  local/goal_research/TEMP_136_CONFORMANCE_SCOPE.md if splitting is needed

PACKET_FILL:
- For each successor surface:
  - current source authority docs that feed it
  - 136 decisions that must already be reflected in those docs
  - stale or missing authority clauses
  - exact source docs updated in this session
  - concepts left for a later scoped packet
- Rewrite stale current authority prose in place.
- Keep all resulting authority prose standalone from `goal_136_plan`.

PACKET_DO_NOT:
- Do not try to sweep every successor surface in one session if the mismatch
  list is large.
- Do not validate against current code.
- Do not convert the sweep into source-heading migration.
- Do not use the blueprint as an override when the owning authority doc still
  says the wrong thing; update the owner.
```

Scoping guidance for Packet 3:

- Start from concept families in the route decision inventory, not file order.
- Count distinct authority docs requiring edits and distinct concept families.
- If more than 2-3 concept families or more than 4 authority docs need edits,
  split before rewriting.
- Prefer these batches:
  1. behavior, cadence, durable state, and final request input
  2. idle/history, evidence, retry/follow-up, carry, and resume
  3. extension/app-server lifecycle and same-turn metadata routing
  4. classifier, repair, projection, raw, compaction, reconstruction
  5. test prep, readiness, operations, navigation, glossary cleanup
- Each batch should leave the authority docs it touches internally coherent.
  Do not make one doc say "X" while another still says "not X" unless the
  packet stops and names the conflict.

## Packet 4: Extension Route Resolution

Use this packet only if extension/facade decisions need focused treatment
outside Packet 2 or Packet 3. The goal is to make the current extension
authority doc standalone and aligned with the 136 plan.

```text
PACKET_ID: 4
PACKET_TITLE: Extension Route Resolution

PACKET_INPUTS:
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/goal-authority-ext-goal-ownership.md
- local/goal_research/goal-authority-final-request-input-and-commit.md
- local/goal_research/goal-authority-durable-cadence-state.md
- local/goal_research/goal-authority-idle-continuation-contract.md
- local/goal_research/goal-authority-fake-shim-removal-map.md
- local/goal_research/goal-test-deletion-map.md
- local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md
- local/goal_136_plan/work-areas/04-ext-goal-conversion.md

PACKET_OUTPUTS:
- Update local/goal_research/goal-authority-ext-goal-ownership.md
- Update neighboring current authority docs only where needed to keep the
  extension route coherent
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if it
  still carries an open extension/facade question

PACKET_FILL:
- Standalone statement of the selected v136 extension route.
- Whether a facade is selected, rejected, or conditional, using the 136 plan as
  authority.
- Extension lifecycle, tool/accounting, app-server ordering, metadata/wake,
  and active-model-input non-ownership.
- Steering-role compatibility outcome.
- Test-proof route for extension-origin behavior, including paired
  shared-shaper coverage if true end-to-end extension-origin payload coverage
  is not the chosen route.

PACKET_DO_NOT:
- Do not leave the extension doc saying the facade question is open if the 136
  plan answers it.
- Do not validate against current code.
- Do not import 136-plan references into the final authority prose.
- Do not move active model-input authority into `ext/goal`.
```

Expected size: likely one focused session if the route decision inventory is
already done. If the inventory shows extension changes also affect final-input,
idle metadata, and test-prep docs heavily, scope Packet 4 into a two-step
extension authority rewrite plus neighboring-doc consistency sweep.

## Packet 5: Drafting Protocol Gate

Use this packet after Packets 1-4 have made the current authority docs and
blueprint standalone. This packet decides whether Session 3 can safely create
the drafting protocol.

```text
PACKET_ID: 5
PACKET_TITLE: Drafting Protocol Gate

PACKET_INPUTS:
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/TEMP_136_CONFORMANCE_SCOPE.md, if it exists
- all current `goal-authority-*` docs touched by Packets 2-4
- local/goal_research/SUCCESSOR_DOC_ARCHITECTURE_REQUIREMENTS.md
- local/goal_research/PASS2_CONCEPT_LEDGER.md
- local/goal_research/PASS2_SECTION_TRACEABILITY.md
- local/goal_research/pass2b_target_interfaces/repeated-authority-canonicalization.md
- local/goal_research/pass2b_target_interfaces/repeated_authority_canonicalization/

PACKET_OUTPUTS:
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if a
  gate-blocking topology gap remains
- Optionally create local/goal_research/TEMP_SUCCESSOR_DRAFTING_GATE.md
  recording whether Session 3 is ready
- Do not create `SUCCESSOR_DOC_DRAFTING_PROTOCOL.md` unless explicitly asked

PACKET_FILL:
- Confirm current `goal_research` authority docs no longer depend on
  `goal_136_plan` for their truth.
- Confirm all 136-derived decisions needed by the blueprint have been absorbed
  into current authority docs or explicitly scoped as not needed for successor
  drafting.
- Confirm fake-shim demolition is no longer listed as a long-lived successor
  authority doc.
- Confirm operations/navigation/glossary container decisions.
- Confirm extension route is not an open question unless the 136 plan itself
  has an internal conflict.
- Confirm recorded evidence treatment is standalone and metadata-only.
- List any stop conditions that block Session 3.

PACKET_DO_NOT:
- Do not start the drafting protocol if any current authority doc still needs
  a 136-plan correction.
- Do not use `goal_136_plan` as a required future input to successor drafting.
- Do not draft successor authority prose.
```

Expected size: one session if earlier packets were scoped well. If this gate
finds unresolved authority mismatches, stop and send the work back to the
owning packet instead of creating the drafting protocol.

## General Scoping Instructions For Agents

Use a scoping pass whenever a packet threatens to update many authority docs or
cross several concept families.

A good scoping pass:

- reads the 136-plan route docs named by the packet
- extracts decisions into concept groups
- names the current `goal_research` files that must change
- counts likely edit surfaces
- proposes sequential packets that each leave touched docs coherent
- stops if two 136-plan docs disagree with each other

A poor scoping pass:

- lists every source heading
- copies the implementation pass order as the writing order
- says "add note to blueprint" when the current authority doc still says the
  wrong thing
- asks the next agent to validate against current code
- leaves `goal_research` dependent on `goal_136_plan` for core truth

Prefer small, concept-complete passes over broad file-complete passes. The
right stopping point is: every doc touched by the pass is internally coherent
with the 136-plan decision it just absorbed, and no neighboring authority doc
is known to say the opposite.
