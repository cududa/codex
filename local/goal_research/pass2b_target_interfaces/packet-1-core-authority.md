# Packet 1: Core Authority

This is a Pass 2B prep artifact. It is not authority, does not supersede any source contract in `local/goal_research`, and does not close any Pass 2A row.

Shared Pass 2B rules live in [README.md](README.md).

Status: complete and bottom-up reviewed.

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


## Packet 1 Interface Entries

The Core Authority packet found no wrong/stale Pass 2A mappings that need
prep-artifact repair before these entries. Rows listed below still need
source-bounded Pass 2C rewrite before they become successor authority.

The entries below preserve the reviewed Packet 1 wording. Heading levels were adjusted for this packet file.

### T-BEHAVIOR: Goal Authority Behavioral Contract

Purpose:

- Define the behavioral truth for Goal authority: what counts as active Goal
  steering, what never counts, and which implementation shapes must be
  rejected even if they appear to preserve Goal text.
- Give later target docs a compact behavioral spine they can point to when
  they own narrower seams.

Owns:

- The definition of Goal authority as current Goal steering in final model
  request input as an outer developer-role model item.
- The allowed active steering shape at the behavior level: current Goal
  internal-context text, `source = "goal"` provenance when that representation
  is used, escaped objective text, and outer developer-role message authority.
- The forbidden shapes: Goal every ordinary turn, user-role active steering,
  rendered text as authority, helper-only or fake provenance authority,
  runtime archaeology, tool output as steering, hiddenness as authority, and
  repair as cadence.
- Acceptance-level truth that final model payloads or structured recorded
  request evidence must prove the same logical final request input when replay
  or audit evidence is in scope.
- Steering-role compatibility as a behavioral rule: user-role active Goal
  steering has no compatibility exception.

Does Not Own:

- Cadence timing, steering-kind selection, supersedence, or deciding when Goal
  should speak. That belongs to `T-CADENCE`.
- Durable facts mutation, pending intent storage, facts-version allocation, or
  exact-key consumption mechanics. That belongs to `T-DURABLE`.
- Per-attempt request-input shaping, cleanup mechanics inside shaping, commit
  point behavior, retry/follow-up orchestration, current-turn carry, or item
  fingerprints. That belongs to `T-FINAL`.
- Classifier shape, projection hiding, compaction, reconstruction, raw
  notifications, or legacy-artifact cleanup mechanics. Those belong to
  `T-CLEANUP`.
- Extension lifecycle/reachability, fake-shim demolition, readiness checklists,
  or the replacement test matrix.

Shared / Local Non-Negotiables:

- Final request-input developer-role proof remains local because this target
  is the place future readers use to reject helper-output and hidden-provenance
  substitutes.
- Active durable Goal state alone is not steering and is not
  cadence-required authority.
- Internal-context provenance is useful as text/source identity but is not
  authority without outer developer role in final input.
- Runtime must not parse rendered Goal artifacts to recover active Goal state,
  current objective, budget state, cadence intent, or pending steering kind.
- Tool output, UI projections, raw events, classifier output, source tags, and
  hidden metadata do not prove model authority.
- Legacy `<goal_context>` handling is artifact handling only and must not keep
  active `GoalContext` architecture alive.

Pointer-Only Dependencies:

- `T-FINAL` owns the exact final request-input shaping and commit mechanics
  that make the behavioral proof real.
- `T-CADENCE` owns cadence events, ordinary-user-turn limits,
  cadence-required authority, and supersedence.
- `T-DURABLE` owns current durable Goal facts and pending intent state used to
  render or validate current Goal steering.
- `T-CLEANUP` owns classifier, projection, and legacy cleanup details that
  support the behavioral prohibition on helper or projection authority.
- `T-EVIDENCE` owns structured recorded request evidence persistence and
  replay semantics; `T-BEHAVIOR` only owns the rule that evidence cannot
  become authority or rendered-text recovery.
- `T-EXT` owns extension lifecycle and config reachability; `T-BEHAVIOR` owns
  only the no-user-role compatibility rule.
- `T-TEST-PREP` owns the replacement matrix; `T-BEHAVIOR` keeps local behavior
  obligations that tests must prove.

Canonical Source Inputs:

- `goal-authority-grounding-truth.md`: title, Purpose, Core Truth, Required
  Active Steering Shape, Terminology, Durable State, Legacy Goal Artifact
  Handling, Anti-Patterns and each anti-pattern subsection, Acceptance
  Standard, Conformance Requirements.
- `goal-authority-primary-cadence-contract.md`: Non-Negotiable Shape and
  Current Authority.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Core Rule,
  Final Request-Input Shaping, Commit Metadata, Commit Point, Current-Turn
  Carry, Tests.
- `goal-authority-primary-cadence-contract.md`: Proving Current Authority,
  Legacy Goal Artifact, Shared Classification, and Verification Checklist,
  only as behavior reinforcement and proof/test obligations.
- `goal-authority-recorded-request-evidence.md`: Core Rule and Correctness
  Split, only for the evidence-is-not-authority boundary.
- `goal-authority-ext-goal-ownership.md`: Upstream v136 Shape and
  Configuration, only for user-role compatibility and source-tagged helper
  caution.
- `goal-authority-fake-shim-removal-map.md`: Purpose, What To Replace With,
  Required Legacy Artifact Handling, Work Area 1, Work Area 4.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs,
  Purity Rules, Final Request-Input Repair, Classifier Ownership.
- `goal-test-deletion-map.md`: Revert Steering-Role Config Overlay and
  Replacement Test Profile, only for behavior obligations and compatibility
  caveats.
- `goal-authority-open-design-deliverables.md`: Corrected Posture, only for
  the final-input seam as the authority posture.

Concept Ledger Inputs:

- Owns: Goal authority; Developer-role active steering; Runtime archaeology
  forbidden; Tool output and UI state.
- Shared: Internal-context provenance; Active Goal steering text shape; Final
  model request input; Steering-role config compatibility; Fake-shim removal;
  Replacement test profile.
- Pointer-only: Recorded request evidence; Current authority proof sources;
  Request repair; Durable Goal facts; Pending cadence intent; Cadence events;
  Classifier outputs; Purity rules.

Fidelity Tripwires / Review Debt:

- Do not compress "developer-role final request input" into "Goal text was
  rendered" or "a helper produced a developer-role item."
- Preserve each anti-pattern as a distinct negative rule; do not flatten them
  into a generic "avoid old shims" paragraph.
- Keep source/provenance text separate from the outer model role that carries
  authority.
- Preserve the no-compatibility exception for user-role active Goal steering,
  including old config paths.
- Acceptance prose must keep final payload and structured recorded request
  evidence tied to the same logical final request input, without turning
  evidence into authority.

Pass 2C Rewrite Notes:

- Start this successor section from `goal-authority-grounding-truth.md`, then
  merge repeated behavioral clauses from cadence, final, evidence, and
  extension only after the local non-negotiables above are explicit.
- Use explicit pointers rather than restating final-input, durable-state,
  cleanup, extension, and evidence mechanics in full.
- Keep enough acceptance examples to prevent later agents from replacing the
  behavioral contract with the smallest possible summary.

True Open Questions:

- None found in Packet 1. Remaining `Review debt` here is fidelity debt for
  Pass 2C, not unresolved behavior.

### T-CADENCE: Primary Cadence Contract

Purpose:

- Define when Goal steering is due and how cadence selects the steering kind
  before the final request-input seam proves delivery.
- Keep cadence separate from repair, durable mutation mechanics, idle
  scheduling details, and final-input commit mechanics.

Owns:

- Cadence events: Initial, ObjectiveUpdated, BudgetLimit, and automatic
  Continuation.
- Steering-kind semantics and supersedence order:
  BudgetLimit > ObjectiveUpdated > Initial > Continuation.
- The narrow definition of cadence-required Goal authority: pending
  non-Continuation intent, automatic Continuation selected by the idle
  predicate, or seam preservation/repair of an already-required cadence item.
- Ordinary user-turn limits: no fresh Continuation merely because a user sent
  a message or an active Goal exists; ordinary turns may deliver already
  pending Initial/ObjectiveUpdated/BudgetLimit intent.
- Required ordering at the cadence level for Initial, ObjectiveUpdated, and
  BudgetLimit: durable facts first, pending intent first, final input delivery
  later.
- The rule that repair is request-local backstop behavior, not the mechanism
  that decides when Goal should speak.
- Cadence-level verification obligations, while leaving the test matrix to
  `T-TEST-PREP`.

Does Not Own:

- Durable storage shape, facts-version allocation, atomic store APIs, or
  exact-key mutation implementation. Those belong to `T-DURABLE`.
- The detailed idle hook caller sequence, lock/reservation behavior, stale
  synthetic-turn lifecycle, and pending-work queue mechanics. Those belong to
  `T-IDLE`.
- Per-attempt final request-input shaping, commit metadata, retry/follow-up
  orchestration, and Created-event commit side effects. Those belong to
  `T-FINAL`.
- Model-visible history-key construction and Continuation watermark storage or
  reconstruction. Those belong to `T-HISTORY`.
- Classifier/projection/compaction mechanics. Those belong to `T-CLEANUP`.
- Extension lifecycle/config ownership. That belongs to `T-EXT`.

Shared / Local Non-Negotiables:

- Active durable Goal state alone is not cadence-required authority.
- Ordinary user turns are not cadence events.
- Pending Initial, ObjectiveUpdated, and BudgetLimit intent survives until the
  final model request input contains the matching developer-role item and the
  request reaches the commit rule owned by `T-FINAL`.
- Continuation is not persisted pending intent and never supersedes persisted
  pending non-Continuation intent.
- BudgetLimit supersedes older Initial, ObjectiveUpdated, and Continuation
  opportunities for the same final request opportunity.
- Same-turn cadence recheck/request metadata is metadata/wake behavior only;
  it does not construct active model input, choose role, or consume intent.
- Feature/collaboration eligibility is a delivery gate for cadence, not proof
  that Goal steering reached final request input.

Pointer-Only Dependencies:

- `T-DURABLE` owns the durable facts, facts version, pending intent store, and
  exact-key consumption operations that cadence requires.
- `T-FINAL` owns final-input selection/insertion/verification and the commit
  point where pending intent is consumed or Continuation watermarking may
  advance.
- `T-IDLE` owns the automatic Continuation lifecycle and pending durable intent
  delivery from idle hooks; cadence owns the fact that those are cadence events
  and how they rank.
- `T-HISTORY` owns the model-visible history key and Continuation watermark
  comparison/reconstruction seam.
- `T-CLEANUP` owns request repair mechanics; cadence owns that repair cannot
  become primary cadence.
- `T-EVIDENCE` owns recorded request evidence persistence/replay; cadence only
  references it as acceptable verification when it represents the same logical
  final request input.
- `T-EXT` owns extension mutation/lifecycle participation; cadence owns the
  resulting steering-kind obligations when those mutations create cadence work.

Canonical Source Inputs:

- `goal-authority-primary-cadence-contract.md`: title, Purpose,
  Non-Negotiable Shape, Cadence State Model, Durable Goal Facts, Pending
  Cadence Intent, Runtime Continuation Accounting at the cadence overview
  level, Cadence Is Primary, Steering Kinds, Initial, Continuation,
  ObjectiveUpdated, BudgetLimit, Supersedence Rules, Final Model Request
  Input, Ordinary User Turns, Current Authority, Request Repair, Repair
  Decision Table, Legacy Goal Artifact, Fake-Shim Deletion Target, Shared
  Classification, Ordering With Pending Work, Verification Checklist, Version
  Plan Requirements.
- `goal-authority-grounding-truth.md`: Primary Cadence, Ordinary User Turns,
  Request Repair, Repair Decision Table, Acceptance Standard, Conformance
  Requirements.

Supporting Source Inputs:

- `goal-authority-durable-cadence-state.md`: Mutation Rules and Supersedence,
  only for cadence-facing durable outcomes and mechanical cleanup limits.
- `goal-authority-idle-continuation-contract.md`: Non-Negotiables, Stage 1,
  Stage 2, Stage 3, External Goal Mutation Behavior, Request Repair
  Interaction, Acceptance Tests.
- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Selection Order, Commit Point, Retry And Follow-Up, Tests.
- `goal-authority-primary-cadence-contract.md`: Current-Turn Carry, only as a
  non-cadence boundary that points to `T-FINAL`.
- `goal-authority-ext-goal-ownership.md`: Required Replacement Shape and
  Reachability Rule, only where extension mutation creates cadence work.
- `goal-authority-fake-shim-removal-map.md`: Core Goal Steering Producer, What
  To Replace With, Work Area 4, Integration With Cadence Contract.
- `goal-test-deletion-map.md`: Replacement Test Profile, only for local
  cadence proof obligations.

Concept Ledger Inputs:

- Owns: Cadence events; Supersedence; Initial steering; ObjectiveUpdated
  steering; BudgetLimit steering; Ordinary user turns; Cadence-required
  authority.
- Shared: Pending cadence intent; Durable Goal facts; Durable facts version;
  Exact-key consumption; Automatic Continuation; Feature and collaboration
  eligibility; Request repair; Same-turn follow-up; External Goal mutation
  ordering; Extension reachability; Tool output and UI state; Replacement
  test profile.
- Pointer-only: Final model request input; Final request-input shaping; Commit
  point; Commit metadata and item fingerprint; Model-visible history key;
  Continuation watermark; Structured recorded request evidence; Classifier
  outputs; Purity rules.

Fidelity Tripwires / Review Debt:

- Do not let "active Goal exists" become a cadence event.
- Preserve ordinary user turns as non-cadence while still allowing them to
  deliver already-pending non-Continuation intent.
- Preserve ObjectiveUpdated and BudgetLimit pending-intent survival when
  same-turn cadence recheck is unavailable or rejected.
- Preserve BudgetLimit supersedence and current durable objective rendering.
- Keep Continuation idle-selected and runtime-watermarked; do not describe it
  as "any next request."
- Keep repair as request-local by default and separate from cadence decision.
- Preserve final payload or structured recorded request evidence as proof
  obligations without making `T-CADENCE` own evidence persistence.

Pass 2C Rewrite Notes:

- Rewrite from `goal-authority-primary-cadence-contract.md` as the canonical
  source, then pull only behavior-level reinforcement from Grounding Truth.
- Do not inline the detailed idle lifecycle or finalizer implementation; use
  local non-negotiables plus pointers to `T-IDLE`, `T-HISTORY`, and `T-FINAL`.
- Keep the four steering kinds in the cadence doc even if final shaping also
  names them, because cadence owns why each kind is due.

True Open Questions:

- None found in Packet 1. Ownership routing to idle, history, and final remains
  source-settled shared or pointer-only work.

### T-DURABLE: Durable Goal Cadence State

Purpose:

- Define the durable state seam for current Goal facts, facts version, pending
  non-Continuation intent, atomic mutations, supersedence cleanup, and
  exact-key consumption.
- Keep durable state deep enough to support cadence without letting state own
  model input, roles, rendering, repair, idle scheduling, or Continuation
  eligibility.

Owns:

- Durable Goal facts: thread/Goal identity, objective, status, budget, usage,
  timing facts, and current active-state facts.
- Durable facts version as the steering-relevant facts identity; current
  product timestamps are terrain and should not be the only cadence facts
  identity.
- Structured pending Initial, ObjectiveUpdated, and BudgetLimit intent.
- Atomic mutation expectations for create/replace Goal, update objective,
  budget accounting, terminal/manual status updates, and delete/clear Goal.
- Mechanical supersedence cleanup when durable mutations make older pending
  intent impossible.
- Exact-key pending intent consumption and logical GoalStore-like operations.
- State-layer verification obligations that prove state APIs do not construct
  model input, render prompts, or decide cadence selection.

Does Not Own:

- Model role selection, `ResponseItem` construction, prompt rendering, final
  request-input shaping, or commit metadata construction. Those belong to
  `T-FINAL`.
- Steering-kind selection for a request opportunity. That belongs to
  `T-CADENCE` and `T-FINAL`.
- Automatic Continuation eligibility or idle lifecycle selection. Those belong
  to `T-IDLE` and `T-HISTORY`.
- Request repair decisions, cleanup classification, projection hiding,
  compaction, or reconstruction behavior. Those belong to `T-CLEANUP`.
- Recorded request evidence persistence/replay semantics. Those belong to
  `T-EVIDENCE`.
- Test prep sequencing or replacement matrix ownership. That belongs to
  `T-TEST-PREP`.

Shared / Local Non-Negotiables:

- Durable Goal state is the source of truth for current Goal facts, not a
  model-visible Goal item.
- Pending cadence intent is structured durable state, not rollout text,
  rendered context, UI metadata, raw response events, or helper output.
- Initial, ObjectiveUpdated, and BudgetLimit are persisted until exact final
  request-input commit; Continuation is excluded from pending intent.
- `consume_pending_intent_exact` must match thread, goal, steering kind, and
  facts version, or an explicit supersedence rule.
- Replacing, deleting, and terminal-status changes clear stale pending intent
  when that intent can no longer be delivered.
- State may do mechanical cleanup but must not choose among eligible intents
  for a request attempt.
- Durable state alone must not emit Goal steering or prove model authority.

Pointer-Only Dependencies:

- `T-CADENCE` owns which pending or runtime cadence event is due for a request
  opportunity and the supersedence ranking used by final shaping.
- `T-FINAL` owns final-input commit verification and calls exact-key
  consumption after the selected item reaches the commit point.
- `T-IDLE` owns idle-hook delivery of pending durable intent and automatic
  Continuation scheduling.
- `T-HISTORY` owns Continuation watermark comparison and reconstruction, while
  `T-DURABLE` may expose facts versions or state-owned committed records.
- `T-EVIDENCE` owns structured recorded request evidence when replay evidence
  is used; durable state remains the default live correctness owner unless an
  authority source explicitly chooses an equivalent non-best-effort evidence
  policy.
- `T-EXT` owns extension calls into durable mutation/accounting APIs; durable
  state owns the mutation results.

Canonical Source Inputs:

- `goal-authority-durable-cadence-state.md`: title, Purpose, Code Terrain,
  Durable Ownership, Storage Shape, Mutation Rules, Supersedence, Required
  Store Operations, Continuation, Verification Requirements.
- `goal-authority-primary-cadence-contract.md`: Durable Goal Facts, Pending
  Cadence Intent, and Supersedence Rules, only for durable facts, pending
  intent, and mechanical cleanup constraints.
- `goal-authority-grounding-truth.md`: Durable State and Primary Cadence, only
  for durable facts and no-runtime-archaeology truth.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Commit Point, Retry And
  Follow-Up, Recorded Request Evidence, only for commit callers and evidence
  boundaries that interact with durable correctness.
- `goal-authority-primary-cadence-contract.md`: Runtime Continuation
  Accounting, Final Model Request Input, Ordering With Pending Work, and
  Version Plan Requirements, only as constraints on what durable state must
  expose without owning those seams.
- `goal-authority-recorded-request-evidence.md`: Correctness Split, Commit
  Ordering And Failure Policy, Resume And Continuation Suppression, Compaction.
- `goal-authority-idle-continuation-contract.md`: Stage 2, Resume Behavior,
  External Goal Mutation Behavior.
- `goal-authority-model-visible-history-key.md`: Runtime Watermark and Resume
  And Restart, only for durable facts version and possible state-owned
  watermark record.
- `goal-authority-open-design-deliverables.md`: Durable Cadence State
  readiness criteria.

Concept Ledger Inputs:

- Owns: Durable Goal facts; Durable facts version; Pending cadence intent;
  Exact-key consumption.
- Shared: Supersedence; Initial steering; ObjectiveUpdated steering;
  BudgetLimit steering; Resume hydration; External Goal mutation ordering;
  Continuation watermark; Recorded request evidence; Replacement test profile.
- Pointer-only: Goal authority; Final model request input; Commit point;
  Final request-input shaping; Request repair; Runtime archaeology forbidden;
  Automatic Continuation.

Fidelity Tripwires / Review Debt:

- Do not turn the illustrative SQL/storage shape into the only possible file
  naming, but preserve the logical model exactly.
- Preserve that multiple pending kinds may exist until supersedence or commit
  clears them.
- Preserve atomicity between durable fact changes and pending-intent writes.
- Preserve exact-key consumption, including the prohibition on consuming a
  newer Goal, different kind, or different facts version.
- Preserve state non-ownership: no model role, prompt rendering, repair
  decision, idle selection, or final-input proof in the state seam.
- Preserve the distinction between durable facts version and product metadata
  timestamps.

Pass 2C Rewrite Notes:

- Start this interface from `goal-authority-durable-cadence-state.md`; fold in
  cadence references only where they explain why state must expose the durable
  field or operation.
- Treat SQL and API names as logical equivalents unless a later implementation
  plan has source-authority-backed names.
- Keep verification requirements local as state obligations, not as the global
  replacement test matrix.

True Open Questions:

- None found in Packet 1. The exact implementation names remain execution-plan
  work, not an unresolved authority question.

### T-FINAL: Final Request-Input Shaping And Commit

Purpose:

- Define the seam where active Goal authority becomes real model input for
  each request attempt and where committed delivery side effects become valid.
- Concentrate per-attempt shaping, cleanup, selected item identity, commit
  metadata, retry/follow-up, current-turn carry, and final-input proof behind a
  single interface.

Owns:

- The final model request input as the logical `Vec<ResponseItem>` that becomes
  `Prompt.input` and `ResponsesApiRequest.input`, before transport-specific
  deltas.
- Per-attempt final request-input shaping after the base input for that attempt
  is known and before the model client receives it.
- Selection of at most one due Goal item for the attempt, using cadence inputs
  and supersedence order.
- Cleanup inside shaping for stale, wrong-role, duplicate, legacy, and
  pre-injected Goal-looking items.
- Rendering selected Goal text from current durable facts and inserting or
  verifying exactly one outer developer-role selected Goal item.
- Attempt context requirements: thread/turn, attempt ordinal, durable snapshot,
  pending intent snapshot, optional runtime Continuation request,
  collaboration/feature eligibility, model-visible history key, transport
  context, and repair context.
- Commit metadata, item fingerprint, request-input fingerprint, item index,
  inserted-or-verified identity, and finalizer output shape.
- Commit point semantics, expected at `ResponseEvent::Created`, including
  fingerprint verification before side effects.
- Retry and follow-up shaping behavior, including pre-Created retry,
  post-Created follow-up, WebSocket delta boundaries, and uncommitted cadence
  request metadata lifecycle.
- Current-turn carry replacement as committed metadata, not pre-finalizer
  concrete model input.
- `goals.rs` adapter non-ownership for shaping, repair, commit, pending
  selection, watermark, and pre-finalizer injection.

Does Not Own:

- Behavioral truth about what authority means. That belongs to `T-BEHAVIOR`.
- Cadence event creation, steering-kind due rules, or durable mutation ordering
  before delivery. That belongs to `T-CADENCE`.
- Durable facts storage, pending intent persistence, facts-version allocation,
  and exact-key store operations. That belongs to `T-DURABLE`.
- Idle hook ordering, legal callers, lock/reservation, stale synthetic-turn
  abort, and pending-work queue precedence. That belongs to `T-IDLE`.
- Model-visible history key construction and Continuation suppression
  reconstruction. That belongs to `T-HISTORY`.
- Recorded request evidence carrier, persistence, replay semantics, and
  failure policy beyond producing the metadata used by that carrier. That
  belongs to `T-EVIDENCE`.
- General classifier/projection/compaction/reconstruction/raw-notification
  mechanics outside final shaping. Those belong to `T-CLEANUP`.
- Extension lifecycle/reachability or test-prep matrix ownership.

Shared / Local Non-Negotiables:

- Authority and commit are proven only by the selected developer-role Goal item
  in final model request input, not helper output, pre-finalizer active-turn
  item injection, reservation, pre-finalizer carry, raw notifications,
  projections, or durable state alone.
- Pending Initial, ObjectiveUpdated, and BudgetLimit intent is consumed only
  after matching final input reaches the commit point and exact-key checks
  pass.
- Continuation watermark advancement waits for the Continuation item in final
  input plus commit point.
- Final request-input shaping must run for every model request attempt,
  including retries and same-turn follow-up attempts.
- Feature/collaboration ineligibility selects no active Goal item and consumes
  no pending intent.
- Same-turn cadence recheck/request metadata is an input to shaping, not
  prebuilt model input or proof of delivery.
- Current-turn carry is committed metadata and cannot prove a different
  attempt or create new cadence intent.
- Structured recorded request evidence supports replay/audit and needs
  finalized-input identity; it does not replace final-input inspection or
  become authority.

Pointer-Only Dependencies:

- `T-BEHAVIOR` owns the authority definition that final shaping implements.
- `T-CADENCE` owns why a selected Goal item is due and the steering-kind
  ordering final shaping applies.
- `T-DURABLE` owns durable snapshots, pending intent state, and exact-key
  consumption operations invoked at commit.
- `T-HISTORY` owns model-visible history-key computation and Continuation
  watermark comparison/reconstruction; `T-FINAL` uses the key and commits
  watermark advancement.
- `T-IDLE` owns Goal-owned synthetic request metadata lifecycle and stale
  abort-before-submit; `T-FINAL` owns retry/follow-up shaping and commit once a
  request attempt proceeds.
- `T-EVIDENCE` owns persistence/replay; `T-FINAL` exposes the commit metadata,
  fingerprints, item index, attempt ordinal, and finalized-input identity used
  by evidence.
- `T-CLEANUP` owns shared classifier and cleanup semantics; `T-FINAL` owns use
  of those classifiers to repair active authority inside final input.
- `T-EXT` is pointer-only for extension-origin cadence requests that must route
  through the same final-input seam.

Canonical Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: title, Purpose, Code
  Terrain, Core Rule, Final Request-Input Shaping, Shaping Responsibilities,
  Selection Order, Commit Metadata, Recorded Request Evidence, Commit Point,
  Retry And Follow-Up, Current-Turn Carry, `goals.rs` Adapter, Tests.
- `goal-authority-grounding-truth.md`: Core Truth, Required Active Steering
  Shape, Terminology, Request Repair, Acceptance Standard, Conformance
  Requirements.
- `goal-authority-primary-cadence-contract.md`: Non-Negotiable Shape,
  Cadence Is Primary, Final Model Request Input, Current Authority, Proving
  Current Authority, Request Repair, Shared Classification, Ordering With
  Pending Work, Verification Checklist, Version Plan Requirements.

Supporting Source Inputs:

- `goal-authority-recorded-request-evidence.md`: Core Rule, Correctness Split,
  Evidence Shape, Fingerprints, Commit Timing, Commit Ordering And Failure
  Policy, Replay Semantics, Tests.
- `goal-authority-model-visible-history-key.md`: Capture Point and Runtime
  Watermark.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs,
  Final Request-Input Repair, Compaction, Rollout Reconstruction/Rollback/Fork,
  Classifier Ownership.
- `goal-authority-idle-continuation-contract.md`: Stage 2, Stage 3, Lock And
  Reservation, External Goal Mutation Behavior, Request Repair Interaction,
  Acceptance Tests.
- `goal-authority-ext-goal-ownership.md`: Ownership Decision, Required
  Replacement Shape, Reachability Rule, Tests.
- `goal-authority-fake-shim-removal-map.md`: Purpose, Core Goal Steering
  Producer, What To Replace With, Work Area 1, Work Area 4, Work Area 5.
- `goal-authority-open-design-deliverables.md`: Corrected Posture and Final
  Request-Input Shaping And Commit readiness criteria.

Concept Ledger Inputs:

- Owns: Active Goal steering text shape; Final model request input; Final
  request-input shaping; Commit point; Commit metadata and item fingerprint;
  Current authority proof sources; Retry behavior; Same-turn follow-up;
  Current-turn carry; Previous response/model-context transitions.
- Shared: Goal authority; Developer-role active steering; Internal-context
  provenance; Pending cadence intent; Exact-key consumption; Cadence events;
  Supersedence; Initial steering; ObjectiveUpdated steering; BudgetLimit
  steering; Automatic Continuation; Feature and collaboration eligibility;
  Request repair; Eligible progress projection; Continuation watermark;
  Classifier outputs; Purity rules; Compaction; Rollout reconstruction,
  rollback, fork; Extension reachability; Replacement test profile.
- Pointer-only: Recorded request evidence persistence/replay; Durable Goal
  facts mutation; Model-visible history key ownership; Idle legal callers and
  stage order; `ext/goal` ownership; Raw response notifications;
  Typed/materialized projection; Local overlay deletion and snapshot handling.

Fidelity Tripwires / Review Debt:

- Do not let final shaping run only on the first pre-loop input snapshot;
  retries rebuild prompt input and must be shaped per attempt.
- Preserve `ResponseEvent::Created` as the expected commit point unless a
  later source authority update names a better point.
- Preserve fingerprint verification before side effects: finalized request
  input, selected item index, and selected item fingerprint.
- Preserve pre-Created failure semantics: render/build/setup/submission failure
  before Created does not consume pending intent or advance watermark by
  default.
- Preserve that structured recorded request evidence needs non-best-effort
  persistence/error policy when used for replay correctness, and cannot rely on
  ordinary rollout items or trace.
- Preserve the distinction between uncommitted request metadata and committed
  current-turn carry.
- Preserve WebSocket delta wording: the delta may be incremental, but shaping
  attaches to the full logical request input.
- Preserve `goals.rs` as adapter scope, not finalizer ownership.

Pass 2C Rewrite Notes:

- Rewrite this entry from `goal-authority-final-request-input-and-commit.md`
  first. It is the canonical final-input seam.
- When importing cadence, state, history, evidence, and cleanup clauses, keep
  them as local obligations or pointers only; do not duplicate their full
  successor contracts.
- Keep logical interface shapes (`finalize_goal_request_input`,
  `GoalRequestCommit`, `CommittedGoalRequestCarry`) as logical equivalents
  unless a later source-backed implementation plan fixes Rust names.
- This target should be detailed enough for implementation agents to avoid
  building another helper/proof layer, but it must not become the evidence
  carrier, durable store, or idle scheduler doc.

True Open Questions:

- None found in Packet 1. The exact Rust function/module names and any
  alternate commit point require later implementation-code walk or authority
  update, but the interface ownership is source-settled.
