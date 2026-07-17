# Temporary 136 Blueprint Sync Packets

This temporary file turns the Packet 2 scope guard into executable follow-up
packets. It sits beside `TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md` and should be
deleted or archived after Packet 2A-2E have completed.

## Why Packet 2 Split

Packet 2 was originally scoped as "Blueprint Standalone Correction And
Authority Sync." The guard in `TEMP_136_BLUEPRINT_SYNC_SCOPE.md` correctly
stopped that as too broad:

- Packet 1 found 20 decisions needing later authority-doc rewrite.
- 8 of 9 concept families need later rewrite.
- More than 4-6 authority/support docs are affected.

Running Packet 2 as one pass would either create a blueprint override layer or
spread partial corrections across too many authority docs. Treat Packet 2 as a
mini-series: 2A, 2B, 2C, 2D, and 2E.

## Shared Rules For 2A-2E

- Work from `TEMP_136_ROUTE_DECISION_INVENTORY.md` and
  `TEMP_136_BLUEPRINT_SYNC_SCOPE.md`.
- `local/goal_136_plan` remains absolute authority for alignment decisions,
  but corrected `goal_research` prose must be standalone and must not require
  future readers to open `goal_136_plan`.
- Rewrite owning authority docs directly when they say a stale, incomplete, or
  conflicting thing. Do not add addenda, superseding tables, or blueprint
  override notes that leave wrong prose standing.
- Do not validate against current code.
- Do not use source-heading rows as the writing method.
- Do not create successor authority docs or the drafting protocol.
- Stop and name the exact conflict if a later read finds an internal 136-plan
  conflict that Packet 1 missed.

## Recommended Order

1. `2A`: Container and standalone topology sync.
2. `2B`: Idle, history, watermark, metadata, retry/carry sync.
3. `2C`: Extension and app-server route sync.
4. `2D`: Cleanup, projection, shim terrain, test proof sync.
5. `2E`: Blueprint closure check.

Do not start Packet 3 until 2E confirms the blueprint no longer bypasses stale
authority docs.

## Packet 2A Handoff

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 2A Container And Standalone Topology Sync

Context:
- Use local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md as the source
  packet for this session.
- Packet 1 created local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md.
- Packet 2 scoping created local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md.
- `local/goal_136_plan` is absolute authority for this alignment work, but
  Packet 2A should work from the Packet 1 inventory and Packet 2 scope doc.
- Packet 2A handles only container/topology decisions that can be made without
  rewriting behavior, cadence, idle, extension, or test authority prose.
- The final successor `goal_research` docs must be standalone and must not
  depend on references to `local/goal_136_plan`.
- Do not use source-heading rows as the writing method.
- Do not create one-to-one target drafts.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- Operations stay in `AGENTS.md`.
- Navigation stays in `README.md`.
- Glossary stays in `CONTEXT.md`.
- Recorded request evidence remains standalone.
- Fake-shim demolition terrain should not remain a long-lived successor
  authority doc; route that terrain to the `goal_136_plan` root for separate
  handling by another agent, but do not move files in this packet.
- When a 136 decision and current `goal_research` prose differ, the 136
  decision wins.
- If this packet finds that making the blueprint standalone requires behavior
  prose that still belongs to an uncorrected authority doc, leave that behavior
  to Packet 2B, 2C, or 2D instead of adding a blueprint override.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/AGENTS.md
- local/goal_research/README.md
- local/goal_research/CONTEXT.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md

Output:
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- Update local/goal_research/AGENTS.md only for container/standalone topology
  posture, if needed
- Update local/goal_research/README.md only for navigation container posture,
  if needed
- Update local/goal_research/CONTEXT.md only for glossary container posture,
  if needed

Fill:
- Remove long-lived successor doc entries for operations, navigation, and
  glossary from the blueprint.
- Preserve operations, navigation, and glossary as existing-container roles:
  `AGENTS.md`, `README.md`, `CONTEXT.md`.
- Keep recorded request evidence as a standalone successor surface.
- Remove fake-shim demolition as a long-lived successor authority surface and
  record it as separate demolition terrain to be handled outside successor
  authority topology.
- Remove future-authority dependency on `local/goal_136_plan` from topology
  language where doing so does not require behavior-prose correction.
- Leave behavior/cadence/idle/extension/test corrections to 2B-2D.

Do not:
- Do not rewrite behavior, cadence, durable-state, final-input, idle/history,
  extension, cleanup, or test authority prose in this packet.
- Do not move fake-shim files into `goal_136_plan`.
- Do not create successor authority docs.
- Do not create the drafting protocol.
- Do not validate against current code.
- Do not start Packet 2B.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

Success: the blueprint/container layer no longer advertises operations,
navigation, glossary, or fake-shim demolition as long-lived successor authority
docs, and it does not bypass any uncorrected behavior owner.

## Packet 2B Handoff

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 2B Idle, History, Watermark, And Metadata Lifecycle Sync

Context:
- Use local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md as the source
  packet for this session.
- Packet 1 created local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md.
- Packet 2 scoping created local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md.
- `local/goal_136_plan` is absolute authority for this alignment work, but
  Packet 2B should work from the Packet 1 inventory and the named 136 route
  docs when needed.
- Packet 2B corrects current authority prose for idle/history/watermark,
  metadata lifecycle, retry/follow-up, stale synthetic turn abort, and
  committed carry.
- The final `goal_research` prose must be standalone and must not cite
  `local/goal_136_plan` as future authority.
- Do not use source-heading rows as the writing method.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- The 136 plan wins over stale current authority prose.
- Rewrite owning authority docs directly. Do not leave stale runtime-only,
  concrete-carry, or metadata wording standing with a superseding note
  elsewhere.
- Preserve the key distinction: state-owned Continuation watermark is not
  persisted pending Continuation intent and not recorded-request evidence.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/AGENTS.md
- local/goal_research/goal-authority-primary-cadence-contract.md
- local/goal_research/goal-authority-durable-cadence-state.md
- local/goal_research/goal-authority-final-request-input-and-commit.md
- local/goal_research/goal-authority-idle-continuation-contract.md
- local/goal_research/goal-authority-model-visible-history-key.md
- local/goal_research/goal-authority-recorded-request-evidence.md
- local/goal_136_plan/work-areas/03-history-key-and-idle-continuation.md,
  only to resolve missing detail from the inventory

Output:
- Update affected current authority docs directly.
- Update SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if a direct idle/history
  topology mismatch remains after authority-doc correction.

Fill:
- Replace stale literal "runtime-only watermarking" authority with the v136
  default: state-owned latest automatic Continuation watermark or equivalent
  durable/reconstructable suppression record.
- Preserve that Continuation is not persisted pending cadence intent.
- Preserve that recorded evidence is metadata-only and not the default live
  Continuation suppression correctness owner.
- Add standalone `GoalTurnRequest`-style metadata lifecycle where current docs
  are incomplete: metadata-only same-turn or idle request, no rendered prompt,
  no prebuilt model input, stale metadata obsoleted after Created commit.
- Add stale synthetic turn internal abort semantics where missing.
- Add committed carry semantics where missing: committed metadata for the
  finalized request item, not pre-shaper concrete `ResponseInputItem`.
- Keep idle scheduling, history key/watermark, and final commit advance
  distinct.

Do not:
- Do not make evidence the default live correctness owner.
- Do not create persisted pending Continuation intent.
- Do not move final-input authority into idle docs.
- Do not validate against current code.
- Do not start Packet 2C.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

Success: no current authority doc still says or implies runtime-only
Continuation watermarking as the v136 default, concrete pre-shaper carry as
authority, or metadata as model input.

## Packet 2C Handoff

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 2C Extension And App-Server Route Sync

Context:
- Use local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md as the source
  packet for this session.
- Packet 1 created local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md.
- Packet 2 scoping created local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md.
- `local/goal_136_plan` is absolute authority for this alignment work.
- Packet 2C corrects extension/app-server authority prose for the selected
  v136 adapter/runtime route, blocker-only facade, metadata-only same-turn
  delivery, steering-role config outcome, and extension proof route.
- The final `goal_research` prose must be standalone and must not cite
  `local/goal_136_plan` as future authority.
- Do not use source-heading rows as the writing method.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- The extension/facade question has been answered by the 136 plan and should
  not remain open in `goal_research`.
- Rewrite owning authority docs directly. Do not leave extension uncertainty
  standing with a superseding note elsewhere.
- Do not move active model-input authority into `ext/goal`.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/goal-authority-ext-goal-ownership.md
- local/goal_research/goal-authority-final-request-input-and-commit.md
- local/goal_research/goal-authority-idle-continuation-contract.md
- local/goal_research/goal-authority-durable-cadence-state.md
- local/goal_research/goal-authority-primary-cadence-contract.md
- local/goal_research/goal-authority-fake-shim-removal-map.md
- local/goal_research/goal-test-deletion-map.md
- local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md,
  only to resolve missing detail from the inventory
- local/goal_136_plan/work-areas/04-ext-goal-conversion.md, only to resolve
  missing detail from the inventory

Output:
- Update local/goal_research/goal-authority-ext-goal-ownership.md.
- Update neighboring current authority docs only where needed to keep the
  extension route coherent.
- Update SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if it still carries an open
  extension/facade question.

Fill:
- State the selected v136 route: adapter/runtime conversion by default.
- State that full v139/v140 `GoalService` adoption is not the v136 default.
- State that a thin facade is blocker-triggered only, and name the condition
  without leaving it as an ordinary open question.
- Preserve extension-owned lifecycle, tools, accounting, metrics, events,
  mutation entry points, durable state calls, and typed cadence/wake requests.
- State app-server/core mutation ordering and no mandatory app-server
  dependency on `codex-goal-extension`.
- State same-turn delivery as metadata/wake/recheck only, with accepted,
  no-active-turn, and cannot-accept outcomes.
- State unavailable same-turn delivery leaves pending intent for ordinary turn
  or idle Stage 2.
- State steering-role config removal/hard-map outcome: active Goal authority
  remains developer-role and cannot be user-role by compatibility config.
- State extension final-payload proof route, including paired shared-shaper
  coverage if true extension-origin end-to-end payload coverage is not the
  selected route.

Do not:
- Do not adopt a long-lived facade or service route by default.
- Do not move active `ResponseItem` or `ResponseInputItem` construction into
  extension or app-server code.
- Do not let extension/app-server consume pending intent, advance watermarks,
  or write recorded request evidence.
- Do not validate against current code.
- Do not start Packet 2D.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

Success: extension/app-server authority prose no longer leaves the facade route
open, no longer permits active model-input construction in extension/app-server
surfaces, and names the metadata-only delivery route standalone.

## Packet 2D Handoff

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 2D Cleanup, Projection, Shim Terrain, And Test Proof Sync

Context:
- Use local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md as the source
  packet for this session.
- Packet 1 created local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md.
- Packet 2 scoping created local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md.
- `local/goal_136_plan` is absolute authority for this alignment work.
- Packet 2D corrects cleanup/projection/shim/test authority prose for generic
  source-tagged internal context, classifier/projection boundaries, raw
  behavior, compaction/reconstruction, fake-shim terrain, WA00 test prep, and
  WA06 acceptance posture.
- The final `goal_research` prose must be standalone and must not cite
  `local/goal_136_plan` as future authority.
- Do not use source-heading rows as the writing method.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- Fake-shim demolition should not remain a long-lived successor authority
  surface, but current source docs may still need correction so stale shim
  concepts do not pollute successor drafting.
- Rewrite owning authority docs directly. Do not leave stale cleanup,
  projection, raw, concrete-carry, or test-proof clauses standing with a
  superseding note elsewhere.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/goal-authority-repair-classifier-integration.md
- local/goal_research/goal-authority-fake-shim-removal-map.md
- local/goal_research/goal-test-deletion-map.md
- local/goal_research/goal-authority-open-design-deliverables.md
- local/goal_research/goal-authority-recorded-request-evidence.md, only if
  evidence/reconstruction wording is touched
- local/goal_research/AGENTS.md, only if operational test-prep posture is
  touched
- local/goal_136_plan/work-areas/00-test-prep-and-baseline-reset.md, only to
  resolve missing detail from the inventory
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md,
  only to resolve missing detail from the inventory
- local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md,
  only to resolve missing detail from the inventory
- local/goal_136_plan/work-areas/06-cleanup-and-acceptance.md, only to resolve
  missing detail from the inventory
- local/goal_136_plan/work-areas/06g-final-acceptance-tests-and-audit-gates.md,
  only to resolve missing detail from the inventory

Output:
- Update affected current authority/support docs directly.
- Update SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md only if a direct cleanup/shim/test
  topology mismatch remains after authority-doc correction.

Fill:
- Add generic source-tagged internal-context helper boundary where missing:
  rendering/parsing support only, not authority.
- Preserve whole-message classifier purity and non-authority.
- Preserve final-input authority in the final-input seam, not classifier or
  projection code.
- Preserve typed/materialized projection hiding for pure current/legacy Goal
  artifacts and raw notifications remaining raw.
- Add concrete carry removal from compaction/reconstruction authority where
  missing.
- Preserve that compaction/reconstruction do not synthesize steering,
  evidence, pending intent, Goal facts, objective, or watermarks from rendered
  text.
- Sync fake-shim terrain as deletion/conversion terrain, not compatibility
  architecture and not long-lived successor authority.
- Sync WA00 test-deletion additions and final acceptance proof layers.
- Sync WA06 posture: cleanup and acceptance only; missing architecture returns
  to the owning earlier surface.
- Preserve final audit gates as review gates, not architecture.

Do not:
- Do not keep fake-shim demolition as a long-lived successor authority
  surface.
- Do not turn audit regexes into architecture.
- Do not make classifier, projection, raw notification, ordinary rollout item,
  rollout trace, or rendered text a substitute for final payload or structured
  evidence.
- Do not validate against current code.
- Do not start Packet 2E.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

Success: cleanup/projection/shim/test docs no longer preserve active shim
compatibility pressure, concrete carry as compaction authority, raw suppression,
or rendered-text reconstruction, and WA06 is clearly cleanup/acceptance only.

## Packet 2E Handoff

```text
$task-alignment

Repo: C:\Users\cullendudas\Documents\GitHub\codex-pinned
Area: local/goal_research

Current phase: 136-plan authority alignment before successor-doc drafting
Session: 2E Blueprint Closure Check

Context:
- Use local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md as the source
  packet for this session.
- Packets 2A-2D should already be complete.
- Packet 1 created local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md.
- Packet 2 scoping created local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md.
- `local/goal_136_plan` is absolute authority for alignment decisions already
  absorbed into current `goal_research` authority docs.
- Packet 2E closes the blueprint only after owning authority docs have been
  corrected. It must not make the blueprint an override layer.
- The final `goal_research` prose must be standalone and must not cite
  `local/goal_136_plan` as future authority.
- Do not use source-heading rows as the writing method.
- Traceability is a coverage check, not the writing algorithm.
- Do not validate against current code.

User authority:
- Do not start successor drafting until the topology blueprint no longer
  bypasses stale authority docs.
- If an authority mismatch remains, stop and send the work back to the owning
  2A-2D packet instead of closing the blueprint.

Before producing the deliverable, state:

## Direction Lock
- Request:
- Authority:
- Terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

Read first:
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_PACKETS.md
- local/goal_research/TEMP_136_BLUEPRINT_SYNC_SCOPE.md
- local/goal_research/TEMP_136_ROUTE_DECISION_INVENTORY.md
- local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md
- local/goal_research/AGENTS.md
- local/goal_research/README.md
- local/goal_research/CONTEXT.md
- current authority/support docs touched by Packets 2A-2D

Output:
- Update local/goal_research/SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md.
- Update an owning authority/support doc only if a directly owned mismatch
  remains and the fix is small and coherent; otherwise stop and name the
  owning 2A-2D packet that must resume.

Fill:
- Remove stale open questions and explicit non-decisions already answered by
  Packet 1 and completed 2A-2D corrections.
- Confirm operations/navigation/glossary are existing-container roles, not
  long-lived successor authority docs.
- Confirm recorded request evidence remains standalone.
- Confirm fake-shim demolition is not a long-lived successor authority doc.
- Confirm extension route is not open and no facade uncertainty remains unless
  a true 136 internal conflict is named.
- Confirm idle/history/watermark, extension, cleanup/projection, test prep,
  and readiness topology entries no longer require future readers to open
  `goal_136_plan`.
- Confirm the blueprint does not override or supersede stale authority prose.
- Confirm Packet 3 successor drafting has not started.

Do not:
- Do not create successor authority docs.
- Do not create the drafting protocol.
- Do not validate against current code.
- Do not leave `goal_136_plan` as required future authority input.
- Do not close the blueprint if any current authority doc still says the
  opposite of the blueprint.

Verification:
- git diff --check -- local/goal_research
- rg -n "[ \t]$" local/goal_research
```

Success: the topology blueprint is standalone and current authority/support
docs no longer force a future successor-drafting agent to consult
`goal_136_plan` for the truths captured by Packets 2A-2D.
