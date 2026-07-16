# Packet 3: Support And Execution

This is a Pass 2B prep artifact. It is not future implementation authority and
does not close any Pass 2A row.

Shared Pass 2B rules live in [README.md](README.md).

Status: complete and bottom-up reviewed.

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


## Packet 3 Interface Entries

The Support And Execution packet found no wrong/stale Pass 2A mappings that
need prep-artifact repair before these entries. Rows listed below still need
source-bounded Pass 2C rewrite before they become successor authority.

### T-EXT: Extension Goal Ownership And Reachability

Purpose:

- Define how `ext/goal` participates in the Goal authority rewrite without
  letting extension lifecycle or tool ownership become model-input authority.
- Keep extension-owned mutation, accounting, configuration, and reachability
  responsibilities separate from final request-input shaping and commit.

Owns:

- Extension lifecycle, tool registration, Goal tool execution entry points,
  metrics, event emission, and active/idle usage accounting when those remain
  extension-owned.
- Extension-origin Goal mutation entry points, including allowed `create_goal`
  behavior when no Goal currently exists.
- Calls into durable Goal state APIs and cadence-request APIs after extension
  mutation or budget/accounting work.
- Typed cadence request metadata and prompt-body/rendering helpers consumed by
  shared final request-input shaping, through a producer-facing adapter seam
  that does not expose private cadence or finalizer implementation types.
- Configuration treatment for Goal steering role compatibility: removal,
  rejection, or hard-mapping so user-role active steering cannot survive.
- Reachability classification for extension active steering paths: converted
  to shared final request-input shaping, removed, or proven unreachable under
  every supported configuration.
- File-specific extension work-area routing for `ext/goal` steering/runtime,
  extension config, core thread injection adapters, input queue, and turn
  state carry.
- Extension TODO/config cleanup where old comments or settings still describe
  role-neutral `<goal_context>` wrapping or host-applied steering role as the
  future active shape.
- Extension-focused proof obligations that show no reachable extension path
  emits fake-shim, user-role, or pre-finalizer concrete active Goal input.

Does Not Own:

- Active Goal authority or the behavioral definition of developer-role
  steering. That belongs to `T-BEHAVIOR`.
- Cadence event semantics, steering-kind ranking, or when Goal should speak.
  Those belong to `T-CADENCE`.
- Durable facts storage, pending intent shape, facts-version allocation, or
  exact-key consumption. Those belong to `T-DURABLE`.
- Active model-input construction, `ResponseItem` / `ResponseInputItem`
  construction for active steering, model role selection, final payload proof,
  final request-input shaping, commit metadata, pending-intent consumption, or
  Continuation watermark update. Those belong to `T-FINAL` and `T-HISTORY`.
- Final request-input cleanup or repair decisions. Those belong to `T-FINAL`
  and `T-CLEANUP`.
- Fake-shim demolition outside extension reachability and conversion terrain.
  That belongs to `T-SHIM`.
- Replacement matrix ownership or readiness handoff.

Shared / Local Non-Negotiables:

- Extension-origin mutation can create durable Goal facts and pending cadence
  intent, but it does not itself create active model input or prove authority.
- Extension-origin `create_goal` may create an active durable Goal and pending
  Initial intent only when no Goal exists; duplicate create remains a product
  error.
- A reachable extension producer must route active steering through the shared
  final request-input shaping path, be removed, or be proven unreachable.
- Extension same-turn behavior is metadata-only same-turn cadence
  recheck/request metadata. It must not inject a prebuilt Goal item into an
  active turn.
- Extension-facing typed requests are adapter metadata, not permission for
  `ext/goal` to name private cadence/finalizer internals or pass rendered
  Goal text, a model role, or prebuilt model input.
- Accepted same-turn cadence recheck/request metadata still consumes pending
  intent only after the active turn's final request input contains the
  matching outer developer-role Goal item and reaches commit.
- Unavailable or rejected same-turn cadence recheck/request metadata leaves
  ObjectiveUpdated and BudgetLimit intent pending.
- Extension configuration must not preserve user-role active Goal steering as
  compatibility; temporary deserialization cannot affect active steering role.
- Extension tests alone do not establish active Goal authority unless they
  inspect captured final request input or pair extension state/runtime coverage
  with shared request-shaper coverage for equivalent pending intent.
- Extension baseline tests must not keep `GoalContext`, `GoalContextRole`,
  active `<goal_context>`, user-role internal context, or pre-finalizer
  concrete Goal items alive.
- The current final-input authority seam lives in core request assembly because
  only the sampling path sees the exact per-attempt input; extension ownership
  must not move final model-input authority elsewhere unless later authority
  defines an equivalent final-input proof seam.

Pointer-Only Dependencies:

- `T-BEHAVIOR` owns the no-user-role active Goal authority rule and the
  behavior-level rejection of helper/provenance authority.
- `T-CADENCE` owns the Initial, ObjectiveUpdated, BudgetLimit, and
  Continuation semantics that extension-origin mutations may request.
- `T-DURABLE` owns the durable facts, pending intent, and exact-key state APIs
  extension code may call.
- `T-IDLE` owns the lifecycle ordering after an external mutation persists
  cadence work and requests same-turn or later delivery.
- `T-FINAL` owns the shared final request-input seam extension-origin steering
  must use, including item construction, final payload proof, and commit.
- `T-HISTORY` owns Continuation suppression and watermark comparison/advance
  semantics.
- `T-CLEANUP` owns classifier/projection/legacy cleanup helpers that may share
  source-tagged rendering direction with extension code.
- `T-SHIM` owns deletion terrain for extension paths that still depend on
  active `GoalContext` or pre-finalizer concrete injection.
- `T-TEST-PREP` owns the extension test-prep matrix and upstream-baseline
  caveat.

Canonical Source Inputs:

- `goal-authority-ext-goal-ownership.md`: entire document, especially
  Purpose, Code Terrain, Upstream v136 Shape, Ownership Decision, Required
  Replacement Shape, Configuration, Reachability Rule, File-Specific Work
  Areas, and Tests.
- `goal-authority-fake-shim-removal-map.md`: Extension Goal Steering Producer,
  Required Work Areas, Work Area 5, and Integration With Cadence Contract,
  only for extension demolition/conversion terrain.
- `goal-authority-primary-cadence-contract.md`: ObjectiveUpdated,
  BudgetLimit, Ordering With Pending Work, Verification Checklist, and Version
  Plan Requirements, only for extension-origin cadence work.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Commit Point, Current-Turn Carry, `goals.rs` Adapter, and Tests.
- `goal-authority-idle-continuation-contract.md`: External Goal Mutation
  Behavior.
- `goal-authority-grounding-truth.md`: Required Active Steering Shape,
  User-Role Goal Steering, Acceptance Standard, and Conformance Requirements.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs and
  Classifier Ownership, only for source-tagged helper non-authority.
- `goal-test-deletion-map.md`: Revert Steering-Role Config Overlay, Upstream
  Baseline Tests That Remain Active, and Replacement Test Profile.
- `goal-authority-open-design-deliverables.md`: `ext/goal` Ownership
  readiness criteria.

Concept Ledger Inputs:

- Owns: `ext/goal` ownership; Extension reachability; Steering-role config
  compatibility.
- Shared: ObjectiveUpdated steering; BudgetLimit steering; External Goal
  mutation ordering; Developer-role active steering; Fake-shim removal;
  Upstream Goal product baseline; Replacement test profile.
- Pointer-only: Goal authority; Cadence events; Pending cadence intent;
  Durable Goal facts; Exact-key consumption; Final model request input; Final
  request-input shaping; Commit point; Continuation watermark; Request repair;
  Classifier outputs; Raw response notifications; Snapshot handling.

Fidelity Tripwires / Review Debt:

- Do not collapse extension ownership into either "remove all extension code"
  or "extension may construct active model input"; the source allows typed
  lifecycle/mutation participation but not authority ownership.
- Preserve `create_goal` as a valid extension-owned mutation path when no Goal
  exists, while keeping Initial delivery in durable intent plus final shaping.
- Preserve duplicate `create_goal` as a product error, not as a second Initial
  or an extension-owned steering shortcut.
- Preserve the current local extension path as active-steering terrain, not
  harmless dead code.
- Preserve same-turn cadence recheck/request metadata as metadata/wake
  behavior only.
- Preserve the adapter-seam distinction for typed cadence metadata: public
  producer-facing facts may cross the seam, private cadence/finalizer
  implementation types must not leak into `ext/goal`.
- Preserve the reachable-extension three-way outcome: convert, remove, or
  prove unreachable.
- Preserve the configuration compatibility rule: user-role active Goal
  steering must not survive through old config keys.
- Preserve the distinction between end-to-end extension-origin payload tests
  and shared-shaper coverage paired with extension state/runtime coverage.
- Do not let source-tagged user-role upstream terrain become acceptable
  active Goal authority.

Pass 2C Rewrite Notes:

- Start this successor section from `goal-authority-ext-goal-ownership.md`.
- Keep extension as a support/lifecycle interface. Use local non-negotiables
  and pointers rather than restating the cadence, durable, final, idle,
  history, cleanup, or evidence contracts in full.
- When importing file-specific work areas, keep them as routing for later
  execution slices, not as authority over final-input semantics.
- If Pass 2C discovers implementation-plan names for cadence request metadata,
  include them only after source authority or the execution plan fixes them.

True Open Questions:

- None found in Packet 3. Exact adapter API names and slice order remain
  implementation-plan work, not unresolved target-interface authority.

### T-SHIM: Fake-Shim Demolition Terrain

Purpose:

- Define the demolition terrain for deleting active Goal-only shim machinery
  without preserving it as compatibility architecture.
- Keep removal maps, old callsite inventories, and consumer-replacement
  routing separate from replacement authority, cadence, final-input commit,
  cleanup classification, and tests.

Owns:

- The active shim roots to remove: active `<goal_context>` emission,
  `GoalContext`, `GoalContextRole`, role-selected active construction paths,
  `GoalSteeringMessage::into_response_input_item` paths that delegate to
  `GoalContext`, extension `GoalContext` producers, user-role active behavior,
  and artifact-based active-state recovery.
- Current shim-dependent consumer terrain that must be replaced carefully:
  event/UI projection, compaction, rollout reconstruction, history/user-turn
  boundaries, and contextual fragment infrastructure.
- Work-area routing for final request-input shaping, generic internal-context
  helpers, classifiers/legacy handling, active core steering, extension
  steering, and cleanup consumers.
- The rule that any remaining `<goal_context>` behavior is legacy artifact
  handling only and cannot keep active Goal-specific context architecture
  alive.
- Demolition-focused fidelity debt: current terrain must be named so later
  execution slices remove or convert it deliberately.

Does Not Own:

- Behavioral truth about Goal authority. That belongs to `T-BEHAVIOR`.
- Cadence timing, steering-kind selection, or when Goal speaks. That belongs
  to `T-CADENCE`.
- Durable pending-intent storage, facts version, mutation atomicity, or
  exact-key consumption. That belongs to `T-DURABLE`.
- Final request-input shaping, selected item insertion/verification, commit
  metadata, retry/follow-up, or current-turn carry. That belongs to `T-FINAL`.
- Strict classifier output semantics, typed/materialized projection behavior,
  compaction cleanup, rollout reconstruction cleanup, raw notifications, or
  request-local repair mechanics. Those belong to `T-CLEANUP`.
- Extension lifecycle/config ownership except where extension paths remain
  fake-shim terrain. That belongs to `T-EXT`.
- Replacement test matrix ownership or readiness handoff.

Shared / Local Non-Negotiables:

- The fake-shim map is demolition terrain, not architecture to preserve.
- Active Goal steering must not keep `GoalContext`, `GoalContextRole`, or
  active `<goal_context>` behind compatibility language.
- Legacy `<goal_context>` recognition may remain only for cleanup,
  projection, compaction, reconstruction, and mixed-content tests.
- Legacy artifact handling must not infer current objective text, recover
  active Goal state, decide cadence, create active steering, preserve
  user-role behavior, or migrate sessions into active Goals.
- Active Goal item construction must not call legacy artifact matching as part
  of the replacement path.
- Consumer replacement is part of active shim removal; deleting callsites
  without strict replacement classification can expose or erase Goal content
  incorrectly.
- Generic internal-context helpers may render or classify source-tagged text,
  but helper output and `source = "goal"` provenance are not authority.
- A completed implementation cannot leave any compiled reachable active Goal
  producer on the fake shim, including extension producers.

Pointer-Only Dependencies:

- `T-BEHAVIOR` owns why the shim is behaviorally invalid and why final
  developer-role request input is authority.
- `T-FINAL` owns the replacement final request-input shaping seam and commit
  metadata.
- `T-CADENCE` owns when active Goal steering is due; shim demolition does not
  decide when Goal speaks.
- `T-CLEANUP` owns the strict classifiers, projection, raw, compaction, and
  reconstruction behavior that replace shim-dependent consumers.
- `T-EXT` owns extension lifecycle and reachability decisions for old
  extension steering paths.
- `T-TEST-PREP` owns deletion of false-compatibility tests and replacement
  proof matrix.
- `T-READINESS` owns whether demolition work areas are ready to translate into
  implementation execution slices.

Canonical Source Inputs:

- `goal-authority-fake-shim-removal-map.md`: entire document, especially
  Purpose, Active Shim Roots To Remove, Shim-Dependent Consumers To Replace
  Carefully, What To Remove, Required Legacy Artifact Handling, What To
  Replace With, Required Work Areas, and Integration With Cadence Contract.
- `goal-authority-grounding-truth.md`: Legacy Goal Artifact Handling,
  Anti-Patterns, Acceptance Standard, and Conformance Requirements.
- `goal-authority-primary-cadence-contract.md`: Legacy Goal Artifact,
  Fake-Shim Deletion Target, Shared Classification, and Version Plan
  Requirements.

Supporting Source Inputs:

- `goal-authority-ext-goal-ownership.md`: Code Terrain, Required Replacement
  Shape, Reachability Rule, File-Specific Work Areas, and Tests.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs,
  Purity Rules, Event Mapping And Typed Projection, Compaction, Rollout
  Reconstruction/Rollback/Fork, Raw Response Notifications, and Classifier
  Ownership.
- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Current-Turn Carry, `goals.rs` Adapter, and Tests.
- `goal-test-deletion-map.md`: Delete Local-Only Fake Context Tests, Upstream
  Baseline Tests That Remain Active, Replacement Test Profile.

Concept Ledger Inputs:

- Owns: Fake-shim removal.
- Shared: Legacy Goal artifact handling; Runtime archaeology forbidden;
  Internal-context provenance; Active Goal steering text shape; Extension
  reachability; Upstream Goal product baseline; Replacement test profile.
- Pointer-only: Goal authority; Developer-role active steering; Cadence
  events; Final model request input; Final request-input shaping; Request
  repair; Classifier outputs; Purity rules; Typed/materialized projection;
  Raw response notifications; Compaction; Rollout reconstruction, rollback,
  fork; Snapshot handling.

Fidelity Tripwires / Review Debt:

- Do not turn the demolition map into an architecture to keep alive.
- Preserve that "legacy artifact handling" is narrower than active shim
  compatibility.
- Preserve the exact active roots named by the source, including
  `GoalSteeringMessage::into_response_input_item` delegating to `GoalContext`.
- Preserve the extension inclusion rule: reachable extension producers must
  be converted, removed, or proven unreachable.
- Preserve consumer-replacement pitfalls for UI hiding, raw notifications,
  compaction, rollout reconstruction, history boundaries, and generic
  contextual fragments.
- Preserve that `source = "goal"` and generic helper output do not prove
  authority.
- Preserve that current developer-role Goal input is not an "artifact" to be
  casually filtered; cleanup must distinguish current selected items from
  legacy or stale items.

Pass 2C Rewrite Notes:

- Start this successor section from `goal-authority-fake-shim-removal-map.md`.
- Keep it as a map of terrain to delete or convert. Avoid rewriting it into
  the finalizer, classifier, cadence, or extension docs.
- Use explicit pointers from each work area to the target that owns the
  replacement behavior.
- Keep file lists and implementation-terrain anchors because Pass 2C and
  later execution slices need them to avoid missing old shim callsites.

True Open Questions:

- None found in Packet 3. Which exact slices delete which callsites is
  execution-plan work after Pass 2B/2C.

### T-TEST-PREP: Test Prep, Baseline, Replacement Matrix, And Snapshots

Purpose:

- Define the prep and replacement-test matrix that removes false compatibility
  pressure while preserving upstream Goal product baseline obligations.
- Collect proof obligations from behavior-owning targets without turning test
  lists into behavior authority.

Owns:

- The prep sequence: revert Goal-related upstream test hunks to
  `rust-v0.136.0`, delete local-only broken overlay tests, keep upstream
  product tests active, and add replacement tests after the active steering
  implementation is replaced.
- Local-only test deletion lists for fake context, local core overlay,
  app-server steering overlay, local TUI overlay, steering-role config overlay,
  and old raw suppression expectations.
- Upstream baseline restoration for listed core, app-server, TUI, review,
  action, and extension backend test files.
- File-specific diffs against `rust-v0.136.0`; prep must not blindly reset
  unrelated work in upstream test files.
- The rule that upstream Goal API/UI/status/budget/usage behavior remains
  baseline unless a separate product change explicitly replaces it.
- Replacement Test Profile as the global proof matrix for final model request
  input, durable pending cadence intent, resume/idle lifecycle, repair/legacy
  artifacts, recorded request evidence, and local behavior re-additions.
- Snapshot handling posture: delete only with local-only owner tests, restore
  upstream-owned snapshots to baseline, and update/add snapshots only for
  intentional UI changes.
- Test-prep-specific caveats, including extension baseline updates when
  extension active steering is removed or converted.

Does Not Own:

- The behavioral contract each replacement test proves. Those contracts belong
  to `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`,
  `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, and `T-EXT`.
- Implementation architecture, module/function names, migrations, or slice
  order. Those are later execution-plan work constrained by authority docs.
- Product redesign or permission to delete upstream Goal product tests.
- Final payload, structured recorded request evidence, classifier, durable
  state, history-key, extension, or readiness semantics.

Shared / Local Non-Negotiables:

- The prep target is not fewer Goal tests; it is removing tests that defend
  the broken local overlay while retaining upstream product baseline.
- Do not keep a local test merely because current broken code passes it.
- Do not delete an upstream Goal behavior test merely because current code
  fails it after fake-shim removal.
- Budget, usage, status, `/goal`, app-server Goal APIs, TUI status/footer,
  pause/edit/clear, and upstream Goal product behavior remain baseline facts
  unless a separate product change replaces them.
- Exact upstream budget and usage fields remain part of the replacement
  profile: `token_budget`, `tokens_used`, `time_used_seconds`,
  `UsageLimited`, and `BudgetLimited`.
- Local TUI Ctrl+C, queue, pause/resume, and interruption behaviors are removed
  from the prep suite as local overlay tests; they are not rejected as product
  behavior and may be re-added from replacement command/state-machine
  contracts.
- Replacement tests must prove behavior through final model request payloads
  or structured recorded request evidence where applicable, not helper output,
  projection hiding, raw notifications, or rollout trace.
- Extension conversion/removal slices must update or remove old extension
  tests in the same slice and must not let extension baseline preserve
  `GoalContext` or `<goal_context>`.
- Steering-role config test prep must not preserve user-role active Goal
  steering compatibility.
- Raw response tests should preserve the desired raw contract: raw
  notifications remain raw for legacy artifacts, current internal-context
  items, and mixed prose.

Pointer-Only Dependencies:

- `T-BEHAVIOR` owns the authority shape that replacement active-steering tests
  prove.
- `T-CADENCE` owns steering-kind, ordinary user turn, supersedence, and repair
  as non-cadence obligations.
- `T-DURABLE` owns durable pending intent and exact-key state tests.
- `T-FINAL` owns final payload, commit, retry/follow-up, fingerprint, and
  current-turn carry proof obligations.
- `T-IDLE` owns resume/idle lifecycle, pending-work precedence, synthetic
  turns, stale reservations, and automatic Continuation tests.
- `T-HISTORY` owns model-visible history key and Continuation suppression
  tests.
- `T-EVIDENCE` owns structured evidence persistence/replay/fingerprint tests.
- `T-CLEANUP` owns classifier, projection, raw, compaction, and reconstruction
  tests.
- `T-EXT` owns extension reachability and config proof obligations.
- `T-SHIM` owns the false-compatibility deletion terrain that test prep must
  remove from the prep suite.
- `T-READINESS` owns whether test-prep inputs are ready to feed an execution
  plan.

Canonical Source Inputs:

- `goal-test-deletion-map.md`: entire document, especially Prep Rule, Delete
  Local-Only Fake Context Tests, Delete Local-Only Core Overlay Tests, Delete
  Local-Only App-Server Steering Overlay, Delete Local-Only TUI Overlay Tests,
  Revert Steering-Role Config Overlay, Revert Existing Test Files To Upstream
  Baseline, Upstream Baseline Tests That Remain Active, Replacement Test
  Profile To Add After Prep, and Snapshot Handling.
- `AGENTS.md`: Test Prep Posture and Non-Negotiables, only as operational
  pointers to the test-prep source doc and upstream baseline facts.

Supporting Source Inputs:

- `goal-authority-grounding-truth.md`: Acceptance Standard and Conformance
  Requirements.
- `goal-authority-primary-cadence-contract.md`: Verification Checklist and
  Version Plan Requirements.
- `goal-authority-idle-continuation-contract.md`: Acceptance Tests.
- `goal-authority-final-request-input-and-commit.md`: Tests.
- `goal-authority-model-visible-history-key.md`: Tests.
- `goal-authority-recorded-request-evidence.md`: Tests.
- `goal-authority-repair-classifier-integration.md`: Tests.
- `goal-authority-ext-goal-ownership.md`: Tests.
- `goal-authority-fake-shim-removal-map.md`: Required Work Areas and work-area
  test bullets.

Concept Ledger Inputs:

- Owns: Upstream Goal product baseline; Local overlay deletion; Replacement
  test profile; Snapshot handling.
- Shared: Goal authority; Developer-role active steering; Recorded request
  evidence; ObjectiveUpdated steering; BudgetLimit steering; Goal-owned
  synthetic turns; Extension reachability; Steering-role config
  compatibility; Fake-shim removal; Legacy Goal artifact handling; Raw
  response notifications.
- Pointer-only: Durable Goal facts; Pending cadence intent; Exact-key
  consumption; Final request-input shaping; Commit point; Model-visible
  history key; Continuation watermark; Request repair; Classifier outputs;
  Purity rules; Typed/materialized projection; Design readiness vs execution
  plan.

Fidelity Tripwires / Review Debt:

- Do not let `T-TEST-PREP` become the source of behavior truth. It names what
  tests must prove; other targets own the contracts.
- Preserve the local-only versus upstream-baseline distinction for every named
  file and test function.
- Preserve app-server protocol rollout-replay fake-context coverage as part of
  local-only fake-context test deletion, not as an upstream behavior deletion.
- Preserve the extension baseline caveat; old extension backend tests must not
  keep fake-shim active steering alive after extension conversion/removal.
- Preserve budget and usage as upstream Goal facts, not local experiments.
- Preserve raw notification test posture: delete local suppression, keep or
  adapt raw-emits coverage for the desired raw contract.
- Preserve snapshot handling distinctions between deleted local-only owner
  tests, upstream-owned snapshots, and intentional new UI output.
- Preserve that upstream snapshots are not deleted merely because they mention
  Goal, budget, usage, statuses, or `/goal`.
- Preserve replacement evidence wording as final payload or structured
  recorded request evidence, never generic rollout trace.

Pass 2C Rewrite Notes:

- Start this successor section from `goal-test-deletion-map.md`.
- Keep the prep sequence and named test files concrete; that concreteness is
  the value of the target.
- When referencing replacement tests, point each cluster back to the target
  that owns the behavior being proved.
- Do not use Pass 2C to trim replacement coverage merely because another doc
  already states the behavior. The matrix remains the execution-prep index.

True Open Questions:

- None found in Packet 3. Exact test file names for new replacement tests are
  execution-plan work, not unresolved interface authority.

### T-READINESS: Design Readiness And Execution Handoff

Purpose:

- Define the readiness gate for moving from authority contracts and target
  interfaces into an implementation execution plan.
- Keep readiness status, deliverable criteria, and handoff rules from becoming
  a second source of Goal behavior authority.

Owns:

- Readiness status terms: Ready, Open, and Blocker as implementation-design
  input status, not file/function/slice completion.
- Consolidated-doc posture: do not recreate separate cadence-module,
  finalizer/commit, goals-adapter, GoalStore-interface, or state/behavior docs
  unless code inspection proves the consolidated docs too large to execute.
- The required deliverable grouping and readiness assessment for durable
  cadence state, final request-input shaping and commit, model-visible history
  key, `ext/goal` ownership, repair/classifier integration, and recorded
  request evidence support.
- The rule that an implementation execution plan may be written only after the
  required deliverables are Ready or explicitly superseded by later authority.
- Handoff criteria for the next execution plan: translate ready design inputs
  into ordered file-specific slices without reopening core architecture absent
  direct conflict.
- Exclusion of non-authority handoff artifacts from source-slice closure when
  their resolved seam now lives in a source authority doc.

Does Not Own:

- Goal authority, cadence, durable state, final shaping/commit, idle lifecycle,
  history key, recorded evidence, cleanup/classifier behavior, extension
  lifecycle, shim demolition, or test matrix semantics.
- Concrete Rust type names, module names, migrations, call ordering inside
  files, or implementation slice order.
- Authority over source docs through checklist wording.
- Navigation, glossary, or operational instructions beyond readiness handoff.

Shared / Local Non-Negotiables:

- Ready means ready as design input. It does not mean already translated into
  concrete files, functions, migrations, tests, or slice order.
- Durable cadence state and per-attempt final request-input shaping/commit are
  the two concepts that carry the replacement design; every other readiness
  item must support those directly or remain implementation detail.
- Generic internal-context role support is not deliverable-level authority.
  Final request input remains the authority seam.
- Recorded request evidence is a support seam for final request-input commit
  and replay/audit evidence; it does not add an authority mechanism.
- The execution plan should not reopen the core architecture unless a code walk
  finds a direct conflict with the authority docs or a later authority update
  explicitly supersedes them.
- If implementation-plan details are settled and needed for readiness or
  target-interface work, they must be represented in the applicable source
  authority doc before prep artifacts rely on them.
- Handoff checklists are gates and routing aids, not behavior contracts.

Pointer-Only Dependencies:

- `T-DURABLE` owns durable cadence state criteria referenced by readiness.
- `T-FINAL` owns final request-input shaping and commit criteria referenced by
  readiness.
- `T-HISTORY` owns model-visible history key criteria referenced by readiness.
- `T-EXT` owns extension ownership criteria referenced by readiness.
- `T-CLEANUP` owns repair/classifier integration criteria referenced by
  readiness.
- `T-EVIDENCE` owns recorded request evidence support seam criteria referenced
  by readiness.
- `T-TEST-PREP` owns test prep and replacement matrix readiness inputs.
- `OP-AGENTS` owns operational instruction that agents read design
  deliverables before implementation planning.
- `NAV-README` may point readers to readiness status, but it does not own the
  readiness rule.

Canonical Source Inputs:

- `goal-authority-open-design-deliverables.md`: entire document, especially
  Corrected Posture, Consolidated Docs, Current Status, Required Deliverables,
  each numbered deliverable, and Readiness Rule.
- `AGENTS.md`: Design Deliverables and Working Posture, only for operational
  pointers and execution-gate framing.

Supporting Source Inputs:

- `goal-authority-durable-cadence-state.md`: source of durable state readiness
  criteria.
- `goal-authority-final-request-input-and-commit.md`: source of final shaping
  and commit readiness criteria.
- `goal-authority-model-visible-history-key.md`: source of history-key
  readiness criteria.
- `goal-authority-ext-goal-ownership.md`: source of extension ownership
  readiness criteria.
- `goal-authority-repair-classifier-integration.md`: source of cleanup and
  classifier readiness criteria.
- `goal-authority-recorded-request-evidence.md`: source of recorded evidence
  support-seam readiness criteria.
- `goal-test-deletion-map.md`: source of test-prep readiness inputs.
- `goal-authority-recorded-request-evidence-design-pass-handoff.md`: executed
  non-authority handoff artifact to exclude from source-slice closure except
  as provenance for why the evidence doc exists.

Concept Ledger Inputs:

- Owns: Design readiness vs execution plan.
- Shared: Recorded request evidence; `ext/goal` ownership; Extension
  reachability; Replacement test profile.
- Pointer-only: Goal authority; Cadence events; Durable Goal facts; Pending
  cadence intent; Final model request input; Final request-input shaping;
  Model-visible history key; Continuation watermark; Request repair;
  Classifier outputs; Fake-shim removal; Local overlay deletion; Snapshot
  handling; Navigation and operational pointers.

Fidelity Tripwires / Review Debt:

- Do not treat Ready as implementation complete.
- Do not let readiness checklist prose supersede the detailed authority docs
  it references.
- Preserve the consolidated-doc posture; do not recreate helper-framework docs
  unless code inspection proves the consolidated docs too large to execute.
- Preserve final request input as the authority seam in the corrected posture.
- Preserve recorded evidence as a support seam, not an authority mechanism.
- Preserve that the next implementation plan translates to ordered
  file-specific slices and does not reopen core architecture absent direct
  conflict.
- Preserve the executed-handoff exclusion: use resolved source authority docs,
  not the old handoff, for source-slice closure.

Pass 2C Rewrite Notes:

- Start this successor section from
  `goal-authority-open-design-deliverables.md`.
- Keep readiness compact. Its job is to tell later agents whether design
  inputs are mature enough for execution planning, not to restate each target
  contract.
- Use explicit pointers to target interfaces for the details behind each
  readiness criterion.
- Keep "true design debt" distinct from fidelity debt and from execution-plan
  work.

True Open Questions:

- None found in Packet 3. Remaining file/function/migration/test assignment
  is execution-plan work after Pass 2C, not readiness-interface uncertainty.
