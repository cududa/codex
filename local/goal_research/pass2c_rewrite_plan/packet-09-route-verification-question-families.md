# Packet 09: Route Verification Question Families

Status: closed.

## Purpose

Decide which future source slices require verification against researched
v136 implementation-route material before successor prose is closed.

## Scope

This packet owns route-verification families, route files to consult, what
route material may sharpen, mismatch criteria, and temporary evidence
boundaries. It does not reopen Packet 08's source order or create execution
records.

## Required Grounding

- Packets 03, 07, and 08
- `PASS2C_PLANNING_HANDOFF.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-route-index.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- relevant numbered work-area and pass docs under
  `local/goal_136_plan/work-areas/`

## Decisions

Route material is a reconciliation input during Pass 2C source-slice
execution. It may sharpen older source wording only when it preserves the
underlying source concept and reflects the latest researched v136 route.
Successor docs should integrate the verified decision directly; they should
not carry standing citations to route planning docs.

Packet 08 row ranges below identify the primary rows that carry each route
flag. A later slice may still read another route family when its source text
or secondary target checks cross that seam.

| Flag | Packet 08 rows and concepts | Route files to verify | Route material may sharpen | User-review mismatch |
| --- | --- | --- | --- | --- |
| `RV-FINAL` | Rows 001-006, 009, 012, 020-029, 096, 098, 101, 105, 111, 116, 125, 132, 134, 138. Final request-input proof, per-attempt shaping, selected item identity, commit, retry/follow-up, current-turn carry, final-payload tests. | `02-final-request-input-shaping-and-commit.md`; `02-direct-split-readiness-check.md`; `03g-continuation-created-commit.md`; `03i-retry-failure-and-stale-synthetic-turn-tests.md`; `04a-adapter-runtime-ordering-and-cadence-request-adapter.md`; `04h-wa04-tests-and-final-payload-verification.md`; `06b-core-active-producer-and-carry-deletion.md`; `06g-final-acceptance-tests-and-audit-gates.md`; coordination note. | Exact request-loop placement, `core/src/goal_cadence/` module shape, attempt ordinal, commit metadata, Created-event commit behavior, committed carry fields, final payload test shape. | Route would make helper output, prebuilt input, classifier output, durable state alone, or current-turn carry authority; route commits before Created; route skips retry/follow-up reshaping; route makes successor docs cite route files instead of owning final-input rules. |
| `RV-DURABLE` | Rows 007-008, 010-016, 018, 112, 115, 120, 126, 133, 137. Durable facts, facts version, pending Initial/ObjectiveUpdated/BudgetLimit intent, exact-key consumption, state non-ownership. | `01-durable-cadence-state.md`; `01-existing-pass-validation.md`; `01a-durable-facts-version-plumbing.md`; `01b-pending-cadence-intent-storage.md`; `01c-cadence-aware-store-operations.md`; producer conversion notes in `02`, `03e`, `04c`, `04d`, and `04e`. | State schema/API names, facts-version behavior, pending-intent transaction shape, exact-key consume semantics, supersedence cleanup, which producers may write pending intent after final-input commit exists. | Route lets state choose cadence, construct model input, consume without exact key, persist Continuation as pending intent, drop pending intent when same-turn delivery is unavailable, or bury recorded-evidence fields in durable state as live authority. |
| `RV-IDLE` | Rows 017, 019, 030, 032-043, 106, 127. Idle legal callers, stage order, pending-work precedence, pending durable cadence delivery, automatic Continuation, reservation, resume, stale synthetic turns. | `03-history-key-and-idle-continuation.md`; `03-history-key-and-idle-continuation-appendage-map.md`; `03c-goal-turn-request-metadata.md`; `03d-idle-stage-order-refactor.md`; `03e-idle-pending-durable-intent-delivery.md`; `03f-automatic-continuation-preflight-shaper-recheck.md`; `03g-continuation-created-commit.md`; `03h-resume-hydration-and-watermark-reconstruction.md`; `03i-retry-failure-and-stale-synthetic-turn-tests.md`; coordination note. | `GoalTurnRequest` vocabulary, metadata-only same-turn/idle delivery, idle stage ordering, reservation and recheck points, stale synthetic-turn abort semantics, resume hydration wording. | Route treats ordinary user turns as cadence, lets idle inject prebuilt model input, launches Continuation before pending work or pending durable cadence intent, fabricates Initial on resume, or surfaces stale synthetic turns as user-visible model errors. |
| `RV-HISTORY` | Rows 031, 044-050, 107, 139. Model-visible history key, eligible progress projection, capture point, watermark comparison, resume/restart, compaction effects. | `03-history-key-and-idle-continuation.md`; `03-history-key-and-idle-continuation-appendage-map.md`; `03a-watermark-schema-store-apis.md`; `03b-model-visible-history-key-projection.md`; `03f-automatic-continuation-preflight-shaper-recheck.md`; `03g-continuation-created-commit.md`; `03h-resume-hydration-and-watermark-reconstruction.md`; `03i-retry-failure-and-stale-synthetic-turn-tests.md`; `05c-contextual-parsing-projection-history-boundaries.md`; `05d-compaction-cleanup.md`; `05e-rollout-reconstruction-rollback-fork-cleanup.md`. | Structured key fields, eligible-progress inclusions/exclusions, key capture timing, state-owned watermark storage, resume/restart reconstruction wording, compaction/rollback/fork key behavior. | Route uses `ContextManager::history_version()` alone, includes the Continuation item in the key that permits another Continuation, suppresses from rendered Goal text or rollout text, advances watermark before Created, or makes evidence the default live watermark owner without explicit non-best-effort policy. |
| `RV-EVIDENCE` | Rows 022, 051-061, 108, 129. Structured recorded request evidence, carrier shape, fingerprints, commit timing, replay, resume, rollback/fork, compaction, raw/projection boundaries. | `02-final-request-input-shaping-and-commit.md`; `03g-continuation-created-commit.md`; `03h-resume-hydration-and-watermark-reconstruction.md`; `05-repair-classifiers-and-projections.md`; `05d-compaction-cleanup.md`; `05e-rollout-reconstruction-rollback-fork-cleanup.md`; `05f-app-server-raw-and-materialized-projection.md`; `06g-final-acceptance-tests-and-audit-gates.md`; coordination note. | Evidence carrier fields, item/request fingerprints, paired-write and failure policy, replay/rollback/fork boundaries, whether evidence is audit-only or a non-best-effort reconstruction input. | Route treats ordinary rollout items, rollout trace payloads, raw notifications, classifier matches, or rendered text as evidence; emits evidence as raw or projection content; writes evidence before Created; or lets evidence replace durable pending-intent/watermark correctness without an explicit tested failure policy. |
| `RV-CLEANUP` | Rows 042, 062-075, 089-093, 095, 099-100, 103, 109, 128, 141. Repair, classifiers, projection, raw notifications, compaction, reconstruction, rollback, fork. | `05-repair-classifiers-and-projections.md`; `05-repair-classifiers-and-projections-surface-map.md`; `05a-internal-context-and-goal-artifact-classifier.md`; `05b-request-input-cleanup-integration.md`; `05c-contextual-parsing-projection-history-boundaries.md`; `05d-compaction-cleanup.md`; `05e-rollout-reconstruction-rollback-fork-cleanup.md`; `05f-app-server-raw-and-materialized-projection.md`; `05g-wa05-test-surface-and-cross-checks.md`; `06e-legacy-context-consumer-and-raw-cleanup.md`; `06g-final-acceptance-tests-and-audit-gates.md`; coordination note. | Shared classifier module shape, whole-message purity, request-local repair placement, typed/materialized projection behavior, raw notifications remaining raw, compaction/reconstruction cleanup and rejection of rendered-text recovery. | Route makes classifier/projection output authority, repair cadence-like, raw Goal hiding survive, mixed ordinary prose disappear, compaction preserve pre-shaper Goal input, or reconstruction recover durable facts/pending intent/watermark by parsing artifacts. |
| `RV-EXT` | Rows 076-082, 102, 110, 118, 124, 140. Extension ownership, reachability, config compatibility, tool/app-server/extension mutation routing, same-turn metadata. | `04-ext-goal-conversion.md`; `04-ext-goal-reachability-and-ordering-map.md`; `04a-adapter-runtime-ordering-and-cadence-request-adapter.md`; `04b-app-server-core-external-mutation-ordering.md`; `04c-extension-tool-goal-mutations.md`; `04d-extension-runtime-objective-effects.md`; `04e-extension-budget-limit-cadence-intent.md`; `04f-extension-steering-role-config-removal.md`; `04g-steering-module-and-injection-api-cleanup.md`; `04h-wa04-tests-and-final-payload-verification.md`; `06d-extension-steering-cleanup.md`; coordination note. | Selected v136 adapter/runtime route, when a thin facade is allowed, product-preserving `create_goal` behavior, metadata-only cadence requests, extension/app-server mutation ordering, config compatibility language. | Route makes `ext/goal` construct active model input, choose active role, consume pending intent, advance watermarks, write evidence, drop ObjectiveUpdated/BudgetLimit when same-turn delivery is unavailable, or require a full service move without code-grounded reason. |
| `RV-SHIM` | Rows 043, 083-088, 094, 097, 104, 113-114. Fake-shim roots, active `GoalContext`/`<goal_context>` terrain, shim-dependent consumers, local overlay test deletion, final audit. | `00-test-prep-and-baseline-reset.md`; `04g-steering-module-and-injection-api-cleanup.md`; `05d-compaction-cleanup.md`; `05e-rollout-reconstruction-rollback-fork-cleanup.md`; `05f-app-server-raw-and-materialized-projection.md`; `06-cleanup-and-acceptance.md`; `06a-final-precondition-and-reachability-audit.md`; `06b-core-active-producer-and-carry-deletion.md`; `06c-steering-role-config-removal.md`; `06d-extension-steering-cleanup.md`; `06e-legacy-context-consumer-and-raw-cleanup.md`; `06f-test-deletion-map-closeout.md`; `06g-final-acceptance-tests-and-audit-gates.md`. | Demolition sequence, allowed legacy fixture boundary, stale-symbol audit expectations, old injection/carry deletion, config-role removal, local overlay test treatment, final acceptance audit wording. | Route preserves active `GoalContext`, `GoalContextRole`, `<goal_context>`, `GoalSteeringRole`, concrete injection/carry, raw Goal hiding, user-role steering, or resume-fabricated Initial as compatibility. |
| `None` | Rows 117, 119, 121-123, 130-131, 135-136, 142-159. TUI/app-server baseline rows, snapshot handling, readiness/navigation/operations/glossary rows, and source units whose ordering does not depend on implementation-shaped route details. | No route check required by default. Read route material only if the source-slice read finds an implementation-shaped dependency not represented by the row's `None` flag. | Route material should not sharpen these rows unless a concrete source clause points into a route family above. | User review is needed if a `None` row turns out to carry behavior authority, route-sensitive implementation detail, or a route conflict that Packet 08 failed to flag. |

## Evidence Boundary

Temporary route-check evidence belongs in the future source-slice record that
Packet 10 will define. Packet 10 must reserve enough record shape to capture:

- route flag family or `None`,
- route files checked,
- route conclusion integrated into successor prose,
- source concept preserved by the integration,
- whether no route check was required, and
- mismatch or user-review status when applicable.

The evidence is temporary execution proof for the slice. It is not successor
authority prose and should not become a permanent citation layer in successor
docs.

## Mismatch Rule

A source-slice agent may resolve ordinary precision differences by integrating
the route decision when the route preserves the source concept. User review is
required only when:

- route material would drop, invert, or weaken a source concept or
  non-negotiable;
- route docs disagree with each other on a point the slice cannot reconcile
  from closed authority;
- following the route would preserve rejected fake-shim terrain, helper
  authority, classifier authority, evidence authority, user-role steering, or
  pre-final request-input authority; or
- following the source wording literally would contradict a later settled
  route decision while the route still preserves the underlying concept.

## Packet 10 Readiness

Packet 10 is unblocked. It has enough input to define the per-slice workflow
and record shape from:

- Packet 08 ordered rows and route flags,
- this packet's route-family matrix and evidence boundary,
- the Pass 2A traceability and concept-ledger inputs,
- Pass 2B target-interface inputs, and
- Pass 2B.5 repeated-authority inputs.

Packet 10 should not execute a slice or create records. It should define the
workflow and small record template future slice agents will use.

## Output Expected

A route-verification matrix by question family. Do not cite route material as
standing authority for future successor docs.

## Closure Criteria

- Every Packet 08 route flag is assigned a verification family.
- Relevant route files are named for each family.
- Sharpening criteria and user-review mismatch criteria are explicit.
- Temporary route-check evidence boundaries are explicit.
- Packet 10 is either unblocked or blocked for a concrete reason.

## Non-Goals

- Editing route plans.
- Starting rewrite slices.
- Creating source-slice records.
- Carrying route citations into durable successor docs.
