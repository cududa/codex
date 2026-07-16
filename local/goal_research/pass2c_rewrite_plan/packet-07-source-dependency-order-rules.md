# Packet 07: Source Dependency Order Rules

Status: closed.

## Purpose

Define the dependency principles that should order source slices before Packet
08 builds the ordered source-slice table.

## Scope

This packet owns sequencing policy. It does not assign final slice IDs, final
ordered rows, per-slice target destinations, workflow records, or execution
status.

## Required Grounding

- `PASS2C_PLANNING_HANDOFF.md`
- `AGENTS.md`
- `PASS2C_REWRITE_PLAN.md`
- packet README
- Packets 03, 04, 05, and 06e
- `PASS2_SECTION_TRACEABILITY.md`
- `PASS2_CONCEPT_LEDGER.md`
- source authority docs where dependency meaning controls order
- Pass 2B target-interface packets for owner and seam routing
- Pass 2B.5 repeated-authority batches for canonical-owner, local-reminder,
  and pointer-only sequencing

## Decisions

Ordering terms:

- Owner anchor means the first source slice that writes the full successor
  owner rule for a concept family.
- Local reminder means short prose in another target whose seam can violate
  the owner rule.
- Pointer-only means a later target may cite the owner without restating the
  rule.

Core rule: an owner anchor must precede local reminders and pointer-only
references that depend on it. Packet 08 may place adjacent or tightly coupled
source slices near each other, but it must not make a support, test,
navigation, operations, or glossary slice the first durable home for behavior
or seam authority.

Dependency families:

| Family | Ordering rule for Packet 08 |
| --- | --- |
| Behavioral authority and final-input proof | Start with the behavioral truth and final-input proof anchors. Other targets can point to Goal authority only after `T-BEHAVIOR` owns the authority definition and `T-FINAL` owns concrete developer-role final request-input proof. |
| Durable cadence state | Place durable facts, durable facts version, pending Initial/ObjectiveUpdated/BudgetLimit intent, and exact-key consumption before slices that deliver, consume, repair, test, or route those intents. Durable state is a prerequisite for cadence, idle Stage 2, final commit consumption, extension mutation routing, and test-prep proof obligations. |
| Cadence event semantics | Place cadence event rules, supersedence, ordinary-user-turn limits, and cadence-required authority before idle lifecycle refinements, repair reminders, and tests that distinguish pending non-Continuation intent from automatic Continuation. |
| Final request-input shaping and commit | Place per-attempt shaping, selection, cleanup of Goal-looking items, commit metadata, commit point, retry/follow-up, and committed carry before evidence, history watermark advance, cleanup repair mechanics, extension adapter prose, shim replacement prose, and replacement tests. |
| Idle lifecycle | Place idle stage order after durable, cadence, and final-input anchors. Idle slices may introduce the stage skeleton before every history/evidence detail is written, but Stage 2 and Stage 3 prose must point to the durable, final, and history owners rather than re-owning those rules. |
| Model-visible history key | Place history-key and watermark detail after final-input capture/commit anchors and the idle Continuation selection anchor. History owns eligible progress projection and suppression comparison; final owns commit advance; idle owns selection. |
| Recorded request evidence | Place recorded-evidence detail after final-input commit metadata and history-key concepts that evidence records or reconstructs. Evidence must remain replay/audit support and must not become authority, cadence selection, pending-intent storage, or live durable correctness by default. |
| Cleanup, repair, projection, compaction, and reconstruction | Place cleanup/classifier repair after behavior, cadence, and final-input anchors. For compaction/reconstruction/rollback/fork clauses, Packet 08 must order the slice after the related final carry, history key, and evidence anchors, because cleanup audits all of those seams together. |
| Extension ownership | Place extension lifecycle and mutation routing after durable, cadence, and final-input anchors are available to point to. Extension may request cadence delivery and own lifecycle/configuration/reachability, but it cannot own active model-input construction, commit, pending-intent consumption, or Continuation watermark updates. |
| Fake-shim demolition | Place shim-removal terrain after replacement anchors for behavior, final input, cleanup/classifiers, cadence, and extension are available. `T-SHIM` must stay a concrete demolition map, not a compatibility layer or replacement authority owner. |
| Test prep and replacement matrix | Place test-prep source slices after the behavior and seam owners that the tests prove. `T-TEST-PREP` owns prep sequence, upstream baseline restoration, replacement matrix, and snapshots; it must point to behavior/seam owners for what each proof obligation means. |
| Readiness and implementation handoff | Place readiness after the primary seam contracts it summarizes. `T-READINESS` may say designs are ready as inputs and name remaining execution-plan work, but it must not own behavior, final ordering rows, file/function assignments, or implementation slices. |
| Navigation, operations, and glossary | Place README, AGENTS, and CONTEXT rewrite slices last. They should route to successor owner docs after those owners exist. They may keep operational warnings and vocabulary, but no non-negotiable or edge-case behavior may survive only in navigation, operations, or glossary prose. |

Tie-break rules:

- If a source slice contains both owner authority and support/reminder prose,
  Packet 08 should order the slice by the owner authority it establishes and
  require secondary checks for the support prose.
- If two slices mutually reference each other, order the first owner anchor
  for each target before local reminder cleanup. The later slice may then
  tighten pointers without reopening owner semantics.
- If a source slice is mostly terrain, demolition, test, navigation, or
  operations material, place it after the replacement owner anchors it must
  reference.
- Whole-doc dispositions from Packet 06e still obey these dependency rules.
  For example, the durable-state whole-doc slice is early because it is one
  focused owner anchor, not because whole-doc slices automatically come first.

Implementation-route verification that affects ordering:

- Durable-state migration/store shape, facts version, pending-intent exact-key
  operations, and any state-owned Continuation watermark must be checked
  before Packet 08 treats durable-state slices as sufficient prerequisites.
- Final request-input shaping, the per-attempt capture point, retry/follow-up
  behavior, and the commit point must be checked before Packet 08 places
  evidence, history, cleanup repair, extension, shim, or test slices that rely
  on finalized-input identity.
- Idle lifecycle legal callers, resume hydration ordering, external mutation
  same-turn cadence metadata, and stale reservation behavior must be checked
  before Packet 08 finalizes idle/history/test ordering.
- History-key projection, capture point, resume/restart reconstruction, and
  compaction effects must be checked before Packet 08 finalizes
  Continuation-suppression and cleanup/reconstruction ordering.
- Recorded-evidence persistence policy, paired item/evidence writes, replay,
  rollback/fork, and compaction behavior must be checked before Packet 08
  relies on evidence as a reconstruction or audit support prerequisite.
- Extension reachability, config compatibility, and conversion/removal route
  must be checked before Packet 08 orders extension, shim, and extension-test
  slices.
- Fake-shim roots, shim-dependent consumers, and local overlay test deletion
  terrain must be checked before Packet 08 orders demolition and test-prep
  slices.

Packet 08 readiness:

- Packet 08 may now build the ordered source-slice table from Packet 04 source
  feeds, Packet 06e split dispositions, and the dependency rules above.
- Packet 08 must still record route-verification flags for slices in the
  implementation-sensitive families above.
- Packet 08 must not use these rules as permission to assign target
  destinations from memory; target checks still come from Packet 04 and owner
  boundaries still come from Packet 03.

## Output Expected

A concrete ordering policy that Packet 08 can apply to build the ordered
source-slice table without inventing its own dependency model.

## Closure Criteria

- The rules explain why behavior, cadence, durable state, final input, idle,
  history, evidence, cleanup, extension, shim, test, readiness, navigation,
  operations, and glossary work is sequenced.
- Owner anchors precede local reminders and pointer-only references.
- Support targets are not allowed to become early behavior or seam owners.
- Implementation-route verification families that affect ordering are named.
- Packet 08 has enough policy to build a table.

## Non-Goals

- Source-slice table.
- Final route-verification matrix.
- Workflow or audit templates.
- Successor prose.
- Source rewrite execution.
