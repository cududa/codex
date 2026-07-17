# 136 Route Decision Inventory

This is a temporary Packet 1 inventory. It does not rewrite authority docs and
does not become successor authority.

## Status

- Packet: 1 Route Decision Inventory
- Scope: settled 136-plan decisions only
- Code validation: not performed and not applicable
- Internal 136-plan conflicts: none found

## Decision Index

| Concept family | Decision count | Current authority status | Later rewrite needed |
| --- | ---: | --- | --- |
| Active authority and final request input | 5 | aligned to incomplete | yes |
| Durable facts, pending intent, exact-key consumption, and state non-ownership | 3 | aligned to incomplete | yes |
| Idle lifecycle, history key, Continuation, resume, retry, and carry | 6 | aligned to stale | yes |
| Recorded request evidence and metadata-only replay/audit boundaries | 3 | aligned | no |
| Extension/app-server lifecycle, route, metadata wake, and facade decision | 5 | incomplete to stale | yes |
| Classifier, repair, projection, raw, compaction, and reconstruction | 5 | aligned to incomplete | yes |
| Fake-shim demolition and old active-root deletion terrain | 2 | aligned to stale | yes |
| Test prep, upstream baseline, replacement proof, and final acceptance | 3 | incomplete to stale | yes |
| Operations, navigation, glossary, readiness, and standalone-doc posture | 3 | incomplete to stale | yes |

## Decisions

### Active Authority And Final Request Input

#### Final Developer-Role Input Is The Authority Boundary

- Decision: Active Goal authority exists only when the final logical model
  request input contains exactly one current outer developer-role Goal
  `ResponseItem`; durable state, helper output, rendered markers, projection
  hiding, raw notifications, tool output, and user-role items do not prove
  authority.
- 136 source: `02-final-request-input-shaping-and-commit.md` /
  `Work Area 02: Final Request-Input Shaping And Commit`, `Direction Lock`,
  `Target State`; `06-cleanup-and-acceptance.md` / `Add Final Acceptance
  Tests`, `Target State`.
- Affected current authority docs:
  `goal-authority-grounding-truth.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-final-request-input-and-commit.md`.
- Affected successor topology surface: `goal-authority-behavior.md`,
  `goal-final-request-input.md`, `goal-test-prep-and-replacement-proof.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Keep as canonical behavior/final-input split, not as
  helper or projection language.

#### `core/src/goal_cadence/` Owns The Final-Input Seam

- Decision: The v136 route selects a private `core/src/goal_cadence/` module
  directory for final request-input shaping, cleanup, selected developer-role
  item construction, commit metadata, and Continuation support; `goals.rs`
  remains adapter/prompt-body terrain, not a service or request-input owner.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Ownership
  Split For This Work Area`, `Add Core Goal Cadence Module Directory`;
  `03-history-key-and-idle-continuation.md` / `Realignment Note`, `Ownership
  Split For This Work Area`; `06-cleanup-and-acceptance.md` / `Realignment
  Note`.
- Affected current authority docs:
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-fake-shim-removal-map.md`.
- Affected successor topology surface: `goal-final-request-input.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-readiness-and-execution-handoff.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current prose has the seam concept, but later docs
  should absorb the selected v136 directory/default placement and avoid older
  "finalizer" or single-file route language.

#### Shaping Runs For Every Attempt Inside The Retry Loop

- Decision: Final request-input shaping runs inside `run_sampling_request(...)`
  for every sampling attempt, after the attempt's base `Vec<ResponseItem>` is
  known and before `build_prompt(...)`; retry and follow-up attempts get fresh
  attempt ordinals and rerun shaping from rebuilt history.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Wire Shaping
  Into Every Sampling Attempt`, `Retry And Follow-Up`, `Target State`.
- Affected current authority docs:
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-recorded-request-evidence.md`.
- Affected successor topology surface: `goal-final-request-input.md`,
  `goal-recorded-request-evidence.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: This is already present conceptually; preserve the
  retry-loop placement as a standalone rule in successor prose.

#### Commit Is `ResponseEvent::Created`

- Decision: `ResponseEvent::Created` is the selected commit point. Pending
  intent consumption, Continuation watermark advancement, committed carry, and
  structured request evidence may occur only after verifying the exact
  finalized request identity for that Created-event attempt.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Commit On
  ResponseEvent::Created`; `03-history-key-and-idle-continuation.md` / `Commit
  Automatic Continuation Watermark On Created`; `06g-final-acceptance-tests-and-audit-gates.md`
  / `Required Edits`.
- Affected current authority docs:
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-model-visible-history-key.md`.
- Affected successor topology surface: `goal-final-request-input.md`,
  `goal-recorded-request-evidence.md`, `goal-idle-history-lifecycle.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Preserve exact identity verification before side
  effects, not just the event name.

#### Committed Carry Replaces Pre-Shaper Concrete Carry

- Decision: Current-turn carry is committed metadata about a finalized Goal
  request item, including attempt/item/request fingerprints, not a stored
  `ResponseInputItem` or `ResponseItem`; uncommitted turn request metadata is
  cleared or made obsolete after Created commit.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Record
  Finalized Cadence Items, Not Pre-Request-Shaping Items`; `03-history-key-and-idle-continuation.md`
  / `Extend Work Area 02 Request-Input Shaper Runtime Request`; `06-cleanup-and-acceptance.md`
  / `Delete Core Active Steering Producer Terrain`.
- Affected current authority docs:
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`.
- Affected successor topology surface: `goal-final-request-input.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-projection-reconstruction-and-raw-history.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs reject concrete carry, but successor
  docs should carry the 136 metadata lifecycle and stale-metadata rule.

### Durable Facts, Pending Intent, Exact-Key Consumption, And State Non-Ownership

#### Durable State Owns Facts Version And Pending Non-Continuation Intent

- Decision: Durable state owns monotonic Goal facts versioning and structured
  pending Initial, ObjectiveUpdated, and BudgetLimit intent; intent is keyed by
  thread, goal, kind, and facts version and is not rollout text, marker text,
  UI metadata, raw events, or prompt helper output.
- 136 source: `01-durable-cadence-state.md` / `Storage Shape`, `Mutation
  Rules`, `Required Edits`, `Target State`.
- Affected current authority docs:
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-primary-cadence-contract.md`,
  `CONTEXT.md`.
- Affected successor topology surface: `goal-durable-state-and-pending-intent.md`,
  `goal-cadence-contract.md`, `goal-glossary.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Keep this as durable-state canonical text.

#### Facts-Plus-Intent Mutations Are Atomic And Exact-Key Consumption Is Narrow

- Decision: Cadence-aware create, replace, objective update, budget accounting,
  status, and delete operations mutate durable facts and pending intent in one
  transaction; consumption deletes only the exact matching pending intent and
  supersedence cleanup cannot become request selection.
- 136 source: `01-durable-cadence-state.md` / `Add Cadence-Aware Store
  Operations`, `Pending Intent Mutation Rules`, `Focused Tests`.
- Affected current authority docs:
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-primary-cadence-contract.md`.
- Affected successor topology surface: `goal-durable-state-and-pending-intent.md`,
  `goal-final-request-input.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Preserve exact-key wording where final-input commit
  consumes pending intent.

#### State Is Not A Model-Input, Evidence, Or Cadence Selector Owner

- Decision: State APIs expose facts, pending intent, exact-key mutation
  outcomes, and later Continuation watermark records; state does not choose
  request cadence, render prompts, construct model input, decide repair, or
  store structured request evidence carrier fields.
- 136 source: `01-durable-cadence-state.md` / `Ownership Split For This Work
  Area`, `Production Caller Policy`; `03-history-key-and-idle-continuation.md`
  / `Persist Latest Automatic Continuation Watermark`.
- Affected current authority docs:
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-model-visible-history-key.md`.
- Affected successor topology surface: `goal-durable-state-and-pending-intent.md`,
  `goal-recorded-request-evidence.md`, `goal-idle-history-lifecycle.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current durable-state prose is aligned for pending
  intent, but later docs should absorb the 136 default state-owned Continuation
  watermark boundary without making it pending intent or evidence.

### Idle Lifecycle, History Key, Continuation, Resume, Retry, And Carry

#### Idle Lifecycle Stage Order Is Fixed

- Decision: `MaybeContinueIfIdle` is an idle lifecycle hook with strict stage
  order: active-turn check, pending non-Goal work first, pending durable
  Initial/ObjectiveUpdated/BudgetLimit delivery second, automatic Continuation
  last. Pending durable intent delivery from idle is not automatic
  Continuation.
- 136 source: `03-history-key-and-idle-continuation.md` / `Refactor Idle Hook
  Stage Order`, `Deliver Pending Durable Cadence Intent From Idle`,
  `WA03-Owned Branch Continuation State`.
- Affected current authority docs:
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-primary-cadence-contract.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-cadence-contract.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Keep idle scheduling and cadence-kind semantics
  separate inside the successor lifecycle doc.

#### Goal Turn Requests Are Metadata, Not Model Input

- Decision: Same-turn cadence recheck, idle pending cadence delivery, and idle
  automatic Continuation use structured `GoalTurnRequest`-style metadata.
  Metadata carries goal id, kind, facts version, and Continuation preflight key
  where relevant; it never carries rendered Goal text, role-bearing model
  input, pending Continuation intent, or authority proof.
- 136 source: `03-history-key-and-idle-continuation.md` / `Extend Work Area 02
  Request-Input Shaper Runtime Request`; `04-ext-goal-reachability-and-ordering-map.md`
  / `Same-Turn Metadata/Wake Bridge`.
- Affected current authority docs:
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-ext-goal-ownership.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-final-request-input.md`,
  `goal-extension-lifecycle-and-reachability.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs say same-turn delivery is metadata/wake
  only, but they do not fully own the 136 `GoalTurnRequest` lifecycle,
  stale-abort, and post-commit obsolescence details.

#### Model-Visible History Key Is Structured Eligible Progress

- Decision: `model_visible_history_key` is a structured key computed from the
  same logical model-visible input used for the request attempt, before
  inserting a new Continuation item. It excludes Goal cadence/repair/cleanup
  artifacts and cannot be `ContextManager::history_version()` alone.
- 136 source: `03-history-key-and-idle-continuation.md` / `Add
  ModelVisibleHistoryKey To Goal Cadence`, `Define The Eligible Progress
  Projection`, `Compaction, Rollback, Fork, And Reconstruction Key Behavior`.
- Affected current authority docs:
  `goal-authority-model-visible-history-key.md`,
  `goal-authority-idle-continuation-contract.md`,
  `CONTEXT.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-glossary.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Preserve the exclusion of the Continuation item
  itself from the key that would permit another Continuation.

#### State-Owned Continuation Watermark Is The v136 Default

- Decision: WA03 selects a state-owned latest automatic Continuation watermark
  table as the default live duplicate-suppression correctness path. Structured
  evidence may be replay/audit metadata, but it does not replace the state
  table unless a later implementation explicitly selects a non-best-effort
  evidence-backed path.
- 136 source: `03-history-key-and-idle-continuation.md` / `Persist Latest
  Automatic Continuation Watermark`, `Commit Automatic Continuation Watermark
  On Created`, `Non-Goals`.
- Affected current authority docs:
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-model-visible-history-key.md`,
  `goal-authority-recorded-request-evidence.md`,
  `AGENTS.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-durable-state-and-pending-intent.md`,
  `goal-recorded-request-evidence.md`.
- Current authority status: stale.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current prose often says "runtime-only"
  Continuation watermarking. Later correction should preserve "not persisted
  pending Continuation intent" while replacing any literal runtime-only
  wording that conflicts with the state-owned v136 default.

#### Resume Is Hydration And Must Rebuild Suppression Basis

- Decision: Resume reloads durable Goal facts, pending intent, accounting
  baselines, and the Continuation suppression basis. It must not create Initial
  from active facts, emit steering, consume intent, advance watermarks, or
  reconstruct active Goal state from rendered text.
- 136 source: `03-history-key-and-idle-continuation.md` / `Resume Hydration`,
  `WA03-Owned Branch Continuation State`; `06g-final-acceptance-tests-and-audit-gates.md`
  / `Durable state and commit acceptance`.
- Affected current authority docs:
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-recorded-request-evidence.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-recorded-request-evidence.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Keep the distinction between existing pending
  Initial and fabricated Initial.

#### Stale Synthetic Turns Abort Before Model Submission

- Decision: A Goal-owned synthetic turn whose pending intent, Continuation
  preflight key, durable facts, watermark, reservation, or pending-work
  ordering becomes stale must abort internally before model submission, without
  consuming intent, advancing watermark, writing evidence, or surfacing as a
  user-facing model/request error.
- 136 source: `03-history-key-and-idle-continuation.md` / `Extend Work Area 02
  Request-Input Shaper Runtime Request`, `Launch Automatic Continuation With
  Preflight And Request-Input Shaper Recheck`, `Failure And Retry Semantics`.
- Affected current authority docs:
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-final-request-input-and-commit.md`.
- Affected successor topology surface: `goal-idle-history-lifecycle.md`,
  `goal-final-request-input.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current idle contract has stale reservation behavior,
  but the 136 submit-or-internal-abort path should be made explicit.

### Recorded Request Evidence And Metadata-Only Replay/Audit Boundaries

#### Evidence Is Structured Created-Event Metadata, Not Authority

- Decision: `GoalRequestEvidence` or the equivalent carrier records committed
  final request-input identity after Created; it is not current Goal facts,
  cadence selection, pending intent storage, model input, raw notification
  content, projection content, or rendered-text recovery.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Commit On
  ResponseEvent::Created`; `05-repair-classifiers-and-projections.md` /
  `Realignment Note`, `Target State`; `06g-final-acceptance-tests-and-audit-gates.md`
  / `Recorded request evidence acceptance`.
- Affected current authority docs:
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-repair-classifier-integration.md`.
- Affected successor topology surface: `goal-recorded-request-evidence.md`,
  `goal-final-request-input.md`,
  `goal-projection-reconstruction-and-raw-history.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Evidence should stay standalone and metadata-only in
  successor docs.

#### Evidence Shape Carries Exact Attempt And Fingerprints

- Decision: Evidence includes schema version, thread/turn/attempt identity,
  goal id, kind, facts version, model-visible history key, item fingerprint,
  request-input fingerprint, item index, inserted-or-verified placement,
  `ResponseCreated`, and timestamp; fingerprints bind it to the exact
  finalized logical input.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Commit On
  ResponseEvent::Created`; `goal-authority-recorded-request-evidence.md`
  already owns this shape; `06g-final-acceptance-tests-and-audit-gates.md` /
  `Recorded request evidence acceptance`.
- Affected current authority docs:
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-final-request-input-and-commit.md`.
- Affected successor topology surface: `goal-recorded-request-evidence.md`,
  `goal-final-request-input.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Keep paired item/request identity; do not collapse to
  "recorded proof".

#### Replay Evidence Has Paired-Write And Failure Boundaries

- Decision: When replay evidence matters, the committed Goal `ResponseItem`
  and structured evidence record are one logical thread-history write; partial
  writes must be rejected, retried, or explicitly unreplayable. Durable state
  remains live correctness unless an explicitly selected evidence-backed path
  has a non-best-effort failure policy.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Paired-write
  rule`; `03-history-key-and-idle-continuation.md` / `Persist Latest Automatic
  Continuation Watermark`; `05-repair-classifiers-and-projections.md` /
  `Convert Rollout Reconstruction, Rollback, And Fork Cleanup`.
- Affected current authority docs:
  `goal-authority-recorded-request-evidence.md`,
  `goal-authority-model-visible-history-key.md`.
- Affected successor topology surface: `goal-recorded-request-evidence.md`,
  `goal-projection-reconstruction-and-raw-history.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: The topology may stay standalone for evidence; no
  authority-doc correction appears necessary here.

### Extension/App-Server Lifecycle, Route, Metadata Wake, And Facade Decision

#### v136 Selects Adapter/Runtime Conversion, Not A Default Facade

- Decision: The selected WA04 v136 route is existing
  `GoalExtension`/`GoalRuntimeHandle` adapter/runtime conversion. Do not add
  `ext/goal/src/api.rs` or adopt the full v139/v140 `GoalService` topology by
  default. A thin facade is blocker-triggered only after updating the WA04 map.
- 136 source: `04-ext-goal-reachability-and-ordering-map.md` / `Ordering Shape
  Decision`, `Selected Route: Adapter/Runtime Conversion`, `Thin Facade Revisit
  Only On Blocker`, `Full GoalService Adoption`; `04-ext-goal-conversion.md` /
  `Confirm The Work Area 04 Ordering Shape`.
- Affected current authority docs:
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-final-request-input-and-commit.md`,
  `goal-authority-open-design-deliverables.md`.
- Affected successor topology surface:
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-readiness-and-execution-handoff.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: The current extension doc owns the boundary but does
  not settle the v136 adapter/runtime default or blocker-only facade rule.

#### App-Server Goal Mutations Use WA01 State And Metadata Wake

- Decision: App-server `thread/goal/get` remains read-only. `set` and `clear`
  preserve product response/notification ordering while routing durable
  mutation through cadence-aware state APIs and requesting metadata-only
  same-turn cadence recheck or idle Stage 2 delivery when pending intent
  exists.
- 136 source: `04-ext-goal-reachability-and-ordering-map.md` / `App-Server
  thread/goal/set: New Active Goal`, `Objective Edit`, `Status Or Budget
  Update`, `thread/goal/clear`, `Ordering Constraints`; `04-ext-goal-conversion.md`
  / `Convert App-Server Goal Mutation Through The Selected Adapter/Runtime
  Path`.
- Affected current authority docs:
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-durable-cadence-state.md`.
- Affected successor topology surface:
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-durable-state-and-pending-intent.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs name external mutation ordering, but
  the app-server route and no-extension-dependency decision need direct
  authority prose.

#### Extension Tool And Runtime Producers Remain Product Paths But Not Model-Input Owners

- Decision: Extension-owned `create_goal` remains a valid mutation path and
  writes active facts plus pending Initial intent on success; terminal
  `update_goal` preserves product behavior without creating active cadence
  intent; runtime ObjectiveUpdated and post-tool BudgetLimit persist pending
  intent and request metadata/wake, not model input.
- 136 source: `04-ext-goal-reachability-and-ordering-map.md` / `Extension
  create_goal Tool`, `Extension update_goal Tool`, `Extension Runtime External
  Objective Update`, `Extension Post-Tool BudgetLimit`; `04-ext-goal-conversion.md`
  / `Convert Extension Tool Mutations To Cadence-Aware State`, `Convert
  External Objective Updates`, `Convert BudgetLimit Reporting`.
- Affected current authority docs:
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-durable-cadence-state.md`,
  `goal-authority-primary-cadence-contract.md`.
- Affected successor topology surface:
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-cadence-contract.md`,
  `goal-durable-state-and-pending-intent.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: The current extension doc says conversion is
  required, but later prose should name the settled producer outcomes.

#### Same-Turn Delivery Is Metadata/Wake With Three Outcomes

- Decision: Same-turn cadence delivery from app-server or extension uses a
  public core adapter or `CodexThread` translation carrying metadata only, with
  outcomes equivalent to `AcceptedForActiveTurn`, `NoActiveTurn`, and
  `ActiveTurnCannotAccept`. Unavailable delivery is not loss; pending intent
  remains for ordinary turns or idle Stage 2.
- 136 source: `04-ext-goal-reachability-and-ordering-map.md` / `Same-Turn
  Metadata/Wake Bridge`; `04-ext-goal-conversion.md` / `Add Non-Model-Input
  Cadence Delivery Request`.
- Affected current authority docs:
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-idle-continuation-contract.md`,
  `goal-authority-final-request-input-and-commit.md`.
- Affected successor topology surface:
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-idle-history-lifecycle.md`,
  `goal-final-request-input.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: This is the shared app-server/extension same-turn
  bridge that replaces concrete pending input.

#### Steering Role Config Cannot Affect Active Goal Authority

- Decision: `GoalContextRole`, `GoalSteeringRole`, extension steering-role
  config, and old `goals.steering_role` influence are removed or hard-mapped
  so active Goal output is always developer-role; extension-level tests do not
  prove final payload authority, and final-payload coverage must use either
  true extension-origin integration or explicit paired shared-shaper coverage.
- 136 source: `04-ext-goal-reachability-and-ordering-map.md` / `GoalContextRole
  / Steering Role Config`, `Final Payload Test Routes`; `04-ext-goal-conversion.md`
  / `Remove Extension Steering Role Configuration`, `Core/App-Server Payload
  Tests`; `06-cleanup-and-acceptance.md` / `Remove Goal Steering Role Config
  As Active API`.
- Affected current authority docs:
  `goal-authority-ext-goal-ownership.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-test-deletion-map.md`.
- Affected successor topology surface:
  `goal-extension-lifecycle-and-reachability.md`,
  `goal-fake-shim-demolition-terrain.md`,
  `goal-test-prep-and-replacement-proof.md`.
- Current authority status: stale.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs reject user-role steering, but the 136
  test-route distinction and config removal/hard-map policy need direct sync.

### Classifier, Repair, Projection, Raw, Compaction, And Reconstruction

#### Generic Internal Context Is Helper Infrastructure Only

- Decision: v136 uses source-tagged internal context text such as
  `<codex_internal_context source="goal">...</codex_internal_context>` for
  rendering/parsing support. The helper validates and parses source-tagged
  text but does not construct active Goal `ResponseItem`s, select cadence, or
  prove authority.
- 136 source: `05-repair-classifiers-and-projections-surface-map.md` /
  `Generic Internal-Context Rendering And Parsing`; `05-repair-classifiers-and-projections.md`
  / `Add Generic Internal-Context Rendering And Parsing`.
- Affected current authority docs:
  `goal-authority-grounding-truth.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`.
- Affected successor topology surface:
  `goal-authority-behavior.md`,
  `goal-request-repair-and-artifact-classification.md`,
  `goal-projection-reconstruction-and-raw-history.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs are conceptually aligned; add the
  source-tagged helper boundary without making it authority.

#### Shared Goal Artifact Classifier Requires Whole-Message Purity

- Decision: The shared classifier distinguishes pure current Goal internal
  context, pure legacy `<goal_context>`, pure non-Goal internal context, and
  mixed/ordinary items. It classifies only whole `ResponseItem::Message` values
  with a single text content item and must not expose a
  `has_current_goal_authority`-style predicate.
- 136 source: `05-repair-classifiers-and-projections-surface-map.md` /
  `Strict Shared Goal Artifact Classifier`; `05-repair-classifiers-and-projections.md`
  / `Add Shared Goal Artifact Classifier`, `Classifier Interface Contract`.
- Affected current authority docs:
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-primary-cadence-contract.md`,
  `goal-authority-fake-shim-removal-map.md`.
- Affected successor topology surface:
  `goal-request-repair-and-artifact-classification.md`,
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-glossary.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Exact interface names are implementation-shaped; the
  purity and non-authority rules are the authority decisions.

#### Request Cleanup Uses Classifier But Authority Stays In `goal_cadence`

- Decision: Final request-input cleanup may use classifier output to remove
  legacy, stale, wrong-role, duplicate, and pre-injected Goal-looking items,
  but cadence selection, durable matching, selected developer-role item
  construction, commit metadata, and repair reports stay in `goal_cadence`.
- 136 source: `05-repair-classifiers-and-projections-surface-map.md` /
  `Request-Input Cleanup Helper Integration`; `05-repair-classifiers-and-projections.md`
  / `Convert Request-Input Shaper Cleanup To Shared Classification`.
- Affected current authority docs:
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-final-request-input-and-commit.md`.
- Affected successor topology surface:
  `goal-request-repair-and-artifact-classification.md`,
  `goal-final-request-input.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Preserve "classifier output is cleanup support" as
  a local reminder in both request-repair and final-input docs.

#### Typed Projection Hides Pure Artifacts; Raw Notifications Stay Raw

- Decision: Typed/materialized projections hide pure current Goal internal
  context and pure legacy artifacts while preserving mixed ordinary prose.
  Raw response item notifications emit pure current, pure legacy, and mixed
  Goal-looking `ResponseItem`s unchanged; the local app-server raw Goal
  suppression overlay is deleted.
- 136 source: `05-repair-classifiers-and-projections-surface-map.md` /
  `Event Mapping And Typed/Materialized Projection`, `App-Server Raw Response
  Overlay Deletion`; `05-repair-classifiers-and-projections.md` / `Remove
  App-Server Raw Goal Suppression`, `Target State`.
- Affected current authority docs:
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-test-deletion-map.md`.
- Affected successor topology surface:
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-test-prep-and-replacement-proof.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: Current docs already reject raw suppression; test
  deletion map alignment still needs the WA00/WA05 additions below.

#### Compaction And Reconstruction Cannot Use Concrete Carry Or Rendered Text

- Decision: Local/remote compaction and reconstruction filter pure artifacts
  and preserve mixed prose, but they must not reinsert pre-shaper concrete
  Goal `ResponseInputItem`s, synthesize steering/evidence/watermarks, or
  recover Goal facts, pending intent, objective, or Continuation suppression
  by parsing rendered Goal text. Structured evidence, if present, must be
  paired by fingerprint before replay metadata use.
- 136 source: `05-repair-classifiers-and-projections-surface-map.md` / `Local
  And Remote Compaction Cleanup`, `Rollout Reconstruction, Rollback, And Fork
  Cleanup`; `05-repair-classifiers-and-projections.md` / `Convert Local And
  Remote Compaction Cleanup`, `Convert Rollout Reconstruction, Rollback, And
  Fork Cleanup`.
- Affected current authority docs:
  `goal-authority-repair-classifier-integration.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-authority-recorded-request-evidence.md`.
- Affected successor topology surface:
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-recorded-request-evidence.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs say the boundary, but the 136 route
  makes concrete-carry removal a dependency condition for WA05.

### Fake-Shim Demolition And Old Active-Root Deletion Terrain

#### Legacy `<goal_context>` Survives Only As Cleanup Fixture/Terrain

- Decision: `GoalContext`, `GoalContextRole`, active `<goal_context>`
  emission, `GoalSteeringRole`, concrete injection/carry APIs, and old
  active-root consumers are demolition terrain. Legacy `<goal_context>` may
  remain only as pure artifact handling behind the shared classifier and
  cleanup/projection/raw-contract tests.
- 136 source: `06-cleanup-and-acceptance.md` / `Delete Core GoalContext Active
  Shim`, `Delete Core Active Steering Producer Terrain`, `Finish Work Area 05
  Consumer Cleanup Audit`, `Target State`; `00-test-prep-and-baseline-reset.md`
  / `Delete Local-Only Fake Context Tests`.
- Affected current authority docs:
  `goal-authority-fake-shim-removal-map.md`,
  `goal-authority-repair-classifier-integration.md`,
  `goal-test-deletion-map.md`.
- Affected successor topology surface:
  `goal-fake-shim-demolition-terrain.md`,
  `goal-projection-reconstruction-and-raw-history.md`,
  `goal-test-prep-and-replacement-proof.md`.
- Current authority status: aligned.
- Later authority-doc rewrite needed: No.
- Notes for later packet: The authority is the demolition concept; successor
  topology still needs to decide whether this remains a long-lived doc.

#### WA06 Cannot Invent Missing Architecture

- Decision: WA06 is final cleanup and acceptance only. If cadence policy,
  classifier semantics, extension route, evidence behavior, or state shape is
  still missing, implementation returns to the owning earlier Work Area
  instead of inventing new architecture in cleanup.
- 136 source: `06-cleanup-and-acceptance.md` / `Work Area 06: Cleanup And
  Acceptance`, `Required Preconditions`, `Non-Goals`, `Continuation
  Constraints`; `06g-final-acceptance-tests-and-audit-gates.md` / `Non-Goals`.
- Affected current authority docs:
  `goal-authority-open-design-deliverables.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-test-deletion-map.md`.
- Affected successor topology surface:
  `goal-readiness-and-execution-handoff.md`,
  `goal-fake-shim-demolition-terrain.md`,
  `goal-test-prep-and-replacement-proof.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Later readiness/handoff prose should make "final
  cleanup is not architecture" standalone.

### Test Prep, Upstream Baseline, Replacement Proof, And Final Acceptance

#### WA00 Resets False-Compatibility Tests Before Replacement Proof

- Decision: Delete local-only tests that defend active `<goal_context>`,
  `GoalContext`, `GoalContextRole`, configured user-role steering, local raw
  suppression, broken resume Initial, and concrete carry; restore modified
  upstream-owned Goal tests to `rust-v0.136.0` behavior without deleting
  upstream product tests.
- 136 source: `00-test-prep-and-baseline-reset.md` / `Locked direction`,
  `Required Edits`, `Target State`; `goal-test-deletion-map.md` is the current
  authority map with known additions from WA00.
- Affected current authority docs:
  `goal-test-deletion-map.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `AGENTS.md`.
- Affected successor topology surface:
  `goal-test-prep-and-replacement-proof.md`,
  `goal-operations-and-authority-order.md`.
- Current authority status: stale.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: WA00 adds at least the local `goals.rs`
  `goal_steering_message_uses_configured_role_for_all_kinds` deletion that the
  current deletion map does not list directly.

#### Replacement Tests Prove Final Payloads, State, Commit, Evidence, Projection, And Raw Boundaries

- Decision: Replacement proof uses focused tests at the correct layer:
  captured `/responses` payload for active authority; state tests for facts,
  pending intent, exact-key consumption, and watermarks; Created-event tests
  for commit/evidence/carry; projection/raw tests for UI/raw boundaries; and
  compaction/reconstruction tests for cleanup without rendered-text recovery.
- 136 source: `02-final-request-input-shaping-and-commit.md` / `Focused Tests`;
  `03-history-key-and-idle-continuation.md` / `Focused Test Coverage`;
  `05-repair-classifiers-and-projections.md` / `Focused Tests`;
  `06-cleanup-and-acceptance.md` / `Add Final Acceptance Tests`;
  `06g-final-acceptance-tests-and-audit-gates.md` / `Required Edits`.
- Affected current authority docs:
  `goal-test-deletion-map.md`,
  `goal-authority-open-design-deliverables.md`,
  all seam authority docs with test sections.
- Affected successor topology surface:
  `goal-test-prep-and-replacement-proof.md`,
  behavior and seam docs as local proof obligations.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current docs have many proof obligations, but the
  final acceptance matrix should be consolidated and 136-specific.

#### Final Audits Are Review Gates, Not Blind Deletion Scripts

- Decision: Final acceptance includes stale-symbol audits for active shim
  symbols, concrete injection/carry, pre-finalizer model-input construction,
  raw suppression, and request-payload proof. Matches must be inspected; only
  cleanup fixtures or explicit rejection comments remain allowed.
- 136 source: `06-cleanup-and-acceptance.md` / `Final Audit Commands`;
  `06g-final-acceptance-tests-and-audit-gates.md` / `Final stale-symbol
  audits`, `Tests And Checks`.
- Affected current authority docs:
  `goal-test-deletion-map.md`,
  `goal-authority-open-design-deliverables.md`,
  `AGENTS.md`.
- Affected successor topology surface:
  `goal-test-prep-and-replacement-proof.md`,
  `goal-readiness-and-execution-handoff.md`,
  `goal-operations-and-authority-order.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Later docs should not turn audit regexes into
  architecture, but they should retain audit gates as acceptance posture.

### Operations, Navigation, Glossary, Readiness, And Standalone-Doc Posture

#### Route Index Is Execution Order, Not Drafting Or Authority Order

- Decision: `implementation-route-index.md` is an ordered execution bearings
  map only. Work-area route decisions are reconciliation input for successor
  authority, not successor drafting order, source-heading order, or one-to-one
  target drafts.
- 136 source: `implementation-route-index.md` / `How To Use`, `Status
  Discipline`, `Ordered Route`; `TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md` /
  `Controlling Posture`, `Packet 1 Output Shape`.
- Affected current authority docs:
  `AGENTS.md`,
  `README.md`,
  `goal-authority-open-design-deliverables.md`.
- Affected successor topology surface:
  `goal-operations-and-authority-order.md`,
  `goal-navigation-index.md`,
  `goal-readiness-and-execution-handoff.md`.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Existing `goal_research` already warns against
  source-heading writing, but later docs must absorb route decisions
  standalone without citing `goal_136_plan` as authority.

#### Successor Docs Must Be Standalone From `goal_136_plan`

- Decision: Final successor `goal_research` docs must absorb the settled 136
  route decisions and not require future readers to open
  `local/goal_136_plan` for core truth. Current `goal-authority-*` docs must
  be rewritten directly when they diverge; stale clauses cannot be preserved
  with later override notes.
- 136 source: `TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md` / `Controlling
  Posture`, `Packet 1 Success Criteria`; user packet authority for Session 1.
- Affected current authority docs:
  all current `goal-authority-*` docs as needed,
  `AGENTS.md`,
  `README.md`,
  `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`.
- Affected successor topology surface: all successor authority surfaces.
- Current authority status: incomplete.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: Current `AGENTS.md` and README still frame v136
  work-area material as reconciliation input; later successor docs must not
  depend on that external input for truth.

#### Operations, Navigation, Glossary, And Fake-Shim Topology Need Later Correction

- Decision: Later topology/successor packets should keep operations in
  `AGENTS.md`, navigation in `README.md`, glossary in `CONTEXT.md`, keep
  evidence standalone, and avoid treating fake-shim demolition terrain as a
  long-lived successor authority doc.
- 136 source: `TEMP_136_AUTHORITY_ALIGNMENT_PACKETS.md` / `Packet 2:
  Blueprint Standalone Correction And Authority Sync`; `SUCCESSOR_DOC_TOPOLOGY_BLUEPRINT.md`
  currently records the older open-question state.
- Affected current authority docs:
  `AGENTS.md`,
  `README.md`,
  `CONTEXT.md`,
  `goal-authority-fake-shim-removal-map.md`,
  `goal-authority-recorded-request-evidence.md`.
- Affected successor topology surface:
  `goal-operations-and-authority-order.md`,
  `goal-navigation-index.md`,
  `goal-glossary.md`,
  `goal-fake-shim-demolition-terrain.md`,
  `goal-recorded-request-evidence.md`.
- Current authority status: stale.
- Later authority-doc rewrite needed: Yes.
- Notes for later packet: This packet does not update the blueprint, but Packet
  2 should remove the old open topology questions and make the container
  decisions standalone.

## Internal 136-Plan Conflicts

- None found.
- Note: WA06 mentions `ext/goal/src/api.rs` as a possible owner only with "or
  Work Area 04 equivalent" language, and its realignment note says service
  adoption is not mandatory for v136 unless WA04 selects it. This is resolved
  by the WA04 blocker-only facade rule, not an internal conflict.
