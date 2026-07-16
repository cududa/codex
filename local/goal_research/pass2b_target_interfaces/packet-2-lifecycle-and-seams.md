# Packet 2: Lifecycle And Seams

This is a Pass 2B prep artifact. It is not future implementation authority and
does not close any Pass 2A row.

Shared Pass 2B rules live in [README.md](README.md).

Status: complete and bottom-up reviewed.

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


## Packet 2 Interface Entries

The Lifecycle And Seams packet found no wrong/stale Pass 2A mappings that need
prep-artifact repair before these entries. Rows listed below still need
source-bounded Pass 2C rewrite before they become successor authority.

### T-IDLE: Idle Goal Lifecycle

Purpose:

- Define the idle lifecycle seam that orders pending non-Goal work, pending
  durable Goal cadence intent delivery, and automatic Continuation without
  turning ordinary user turns into cadence events.
- Keep Goal-owned synthetic turn scheduling, reservation, stale-candidate
  handling, resume hydration, and same-turn cadence recheck request metadata
  separate from final request-input authority.

Owns:

- Legal idle hook callers and the rule that the hook may run only after an
  ordered idle opportunity such as turn finish, abort/interrupt active-turn
  clear, resume ordering completion, external mutation persistence, or an
  explicit ordered API hook.
- Idempotence and reentrancy for repeated or racing idle calls.
- Required stage order: active-turn check, pending non-Goal work, lock and
  recheck, pending durable cadence intent delivery, recheck, and automatic
  Continuation.
- Pending non-Goal work precedence for queued response items, trigger-turn
  mailbox input, and future regular pending work.
- Idle delivery of persisted Initial, ObjectiveUpdated, and BudgetLimit
  intent as cadence-delivery turns that are not automatic Continuation.
- Automatic Continuation eligibility after earlier stages decline, including
  feature/collaboration eligibility and active current Goal checks.
- Goal idle scheduling lock, reservations, stale candidate abort-before-submit,
  reservation clearing, and non-user-facing stale synthetic turn outcomes.
- Goal-owned synthetic turn request metadata lifecycle while it remains
  uncommitted scheduling metadata.
- Resume hydration ordering at the idle seam: reload facts, pending intent,
  accounting basis, and suppression basis before later idle decisions.
- Same-turn cadence recheck/wake request routing after external Goal mutation,
  only as turn-local metadata/wake behavior.
- Idle-facing acceptance obligations for pending work precedence, pending
  intent delivery, resume cases, stale reservations, and automatic
  Continuation gating.

Does Not Own:

- Behavioral truth about active Goal authority. That belongs to `T-BEHAVIOR`.
- Cadence event definitions, steering-kind semantics, or supersedence ranking
  except where the idle hook applies them to select pending delivery. Those
  belong to `T-CADENCE`.
- Durable facts storage, pending intent persistence, facts-version allocation,
  exact-key consumption, or atomic mutation semantics. Those belong to
  `T-DURABLE`.
- Final request-input shaping, selected item insertion/verification, commit
  point side effects, retry/follow-up shaping, or final payload proof. Those
  belong to `T-FINAL`.
- Model-visible history key construction, eligible progress projection, or
  committed suppression reconstruction. Those belong to `T-HISTORY`.
- Structured recorded request evidence persistence/replay semantics. Those
  belong to `T-EVIDENCE`.
- Classifier, projection, compaction, reconstruction, raw-notification, and
  repair mechanics. Those belong to `T-CLEANUP`.
- Extension lifecycle/config ownership or replacement test matrix ownership.

Shared / Local Non-Negotiables:

- Pending non-Goal work outranks every Goal-owned synthetic turn.
- Pending durable Initial, ObjectiveUpdated, and BudgetLimit intent outranks
  automatic Continuation and is not automatic Continuation merely because the
  idle hook launches delivery.
- Automatic Continuation may run only after no active turn, pending non-Goal
  work, or pending durable non-Continuation intent is eligible.
- Ordinary user turns are not cadence events; a regular pending-work turn may
  deliver already-pending non-Continuation intent only through final input.
- Pending intent is not consumed when selected, rendered, constructed,
  reserved, or when same-turn cadence recheck/request metadata is requested,
  accepted, rejected, or unavailable.
- Same-turn cadence recheck/request metadata must not construct active model
  input, choose model role, or consume pending intent.
- Reservation is not recording and does not prove final model request input.
- Stale Goal-owned synthetic candidates abort before submit without consuming
  pending intent, advancing watermark, or surfacing as user-facing model
  request failure.
- Resume is hydration, not cadence; it must not fabricate Initial, infer
  intent from artifacts, emit steering, consume intent, or advance watermark.
- Request repair inside idle-created requests remains request-local and cannot
  create pending intent, consume unrelated pending intent, or advance the
  Continuation watermark.

Pointer-Only Dependencies:

- `T-CADENCE` owns cadence event semantics and supersedence order that idle
  applies when pending intent is eligible.
- `T-DURABLE` owns the persisted pending intent and durable Goal facts idle
  reads before scheduling delivery.
- `T-FINAL` owns final request-input proof, commit point, exact pending-intent
  consumption call timing, and the clearing/obsoleting of request metadata
  after `ResponseEvent::Created`.
- `T-HISTORY` owns model-visible history key construction, watermark
  comparison inputs, and resume/restart suppression reconstruction; idle uses
  those results for automatic Continuation eligibility.
- `T-EVIDENCE` owns the non-best-effort structured evidence boundary when a
  built-but-not-submitted request or replay-derived suppression claim would
  otherwise be asserted.
- `T-CLEANUP` owns request-local repair/classifier mechanics used by requests
  launched from idle.
- `T-EXT` owns extension lifecycle and mutation entry points; idle owns the
  lifecycle ordering after such mutations persist cadence work.
- `T-TEST-PREP` owns the replacement matrix; `T-IDLE` keeps local proof
  obligations that those tests must cover.

Canonical Source Inputs:

- `goal-authority-idle-continuation-contract.md`: title, Purpose,
  Non-Negotiables, Semantic Contract, Legal Callers, Required Stage Order,
  Stage 1, Stage 2, Stage 3, Lock And Reservation, Resume Behavior, External
  Goal Mutation Behavior, Request Repair Interaction, Current Terrain To
  Replace, Acceptance Tests.
- `goal-authority-primary-cadence-contract.md`: Ordering With Pending Work,
  Continuation, Ordinary User Turns, Initial, ObjectiveUpdated, BudgetLimit,
  Verification Checklist, Version Plan Requirements.
- `goal-authority-grounding-truth.md`: Primary Cadence, Ordinary User Turns,
  Durable State, Request Repair, Acceptance Standard, Conformance
  Requirements.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Commit Point, Retry And Follow-Up, Current-Turn Carry, Tests.
- `goal-authority-model-visible-history-key.md`: Runtime Watermark and Resume
  And Restart, only as Continuation suppression inputs used by idle.
- `goal-authority-durable-cadence-state.md`: Storage Shape, Mutation Rules,
  Supersedence, Required Store Operations, Continuation.
- `goal-authority-recorded-request-evidence.md`: Commit Timing, Commit
  Ordering And Failure Policy, Resume And Continuation Suppression.
- `goal-authority-ext-goal-ownership.md`: Required Replacement Shape,
  Configuration, Reachability Rule, Tests, only where external mutation enters
  idle lifecycle.
- `goal-authority-repair-classifier-integration.md`: Final Request-Input
  Repair, only for idle-created request repair limits.
- `goal-test-deletion-map.md`: Replacement Test Profile, only for idle proof
  obligations.

Concept Ledger Inputs:

- Owns: Automatic Continuation; Feature and collaboration eligibility; Resume
  hydration; Idle legal callers and reentrancy; Idle hook stage order; Pending
  non-Goal work precedence; Goal-owned synthetic turns; Lock, reservation, and
  stale candidates; External Goal mutation ordering.
- Shared: Pending cadence intent; Cadence events; Supersedence; Initial
  steering; ObjectiveUpdated steering; BudgetLimit steering; Ordinary user
  turns; Request repair; Retry behavior; Same-turn follow-up; Model-visible
  history key; Continuation watermark; Replacement test profile.
- Pointer-only: Final model request input; Final request-input shaping; Commit
  point; Commit metadata and item fingerprint; Recorded request evidence;
  Durable Goal facts; Durable facts version; Exact-key consumption;
  Classifier outputs; Purity rules; Raw response notifications.

Fidelity Tripwires / Review Debt:

- Do not call idle-launched Initial, ObjectiveUpdated, or BudgetLimit delivery
  automatic Continuation.
- Preserve the exact stage order and the return-after-starting-work rule.
- Preserve that same-turn cadence recheck/request metadata is metadata/wake
  behavior only, not prebuilt model input.
- Preserve the successful same-turn recheck rule: accepted metadata still
  consumes pending intent only when that active turn's final request input
  contains the matching outer developer-role Goal item and reaches commit.
- Preserve unavailable/rejected same-turn recheck behavior: pending intent
  remains pending for a later ordinary turn or idle-hook cadence-delivery turn.
- Preserve stale reservation behavior as an internal lifecycle outcome that
  clears without model submission, pending-intent consumption, watermark
  advancement, or user-facing request error.
- Preserve resume cases for already-pending Initial versus already-consumed
  Initial.
- Preserve that final payload or structured recorded request evidence tests
  remain pointers to `T-FINAL`/`T-EVIDENCE`, not idle-owned proof mechanics.

Pass 2C Rewrite Notes:

- Start this successor section from
  `goal-authority-idle-continuation-contract.md` and keep its stage-order
  shape visible.
- Pull cadence, durable, history, final, evidence, and cleanup clauses only as
  local non-negotiables or pointer-only dependencies.
- Keep the semantic distinction between "idle lifecycle hook" and "automatic
  Continuation" in the first screen of the successor doc.
- Treat current `MaybeContinueIfIdle` names as possible external labels, not
  as permission to collapse all idle-launched Goal work into Continuation.

True Open Questions:

- None found in Packet 2. Remaining idle `Review debt` is fidelity debt for
  Pass 2C, not unresolved behavior.

### T-HISTORY: Model-Visible History Key And Continuation Suppression

Purpose:

- Define the seam that computes model-visible history progress for automatic
  Continuation duplicate suppression.
- Keep history-key projection and suppression reconstruction separate from
  Goal authority, cadence selection, final-input construction, durable pending
  intent, evidence authority, and cleanup repair decisions.

Owns:

- The logical `model_visible_history_key` and its stable shape, including
  schema version, eligible progress count/fingerprint, latest eligible
  progress fingerprint, and compaction basis fingerprint.
- Eligible progress projection from the same logical model-visible history
  used for the next request attempt before inserting a new automatic
  Continuation item.
- Inclusion of ordinary user messages, hook prompts, assistant/reasoning
  items, tool calls/outputs, local shell calls, web-search/image-generation
  calls, mailbox input that reaches model input, and compaction summaries that
  alter model-visible eligible progress.
- Exclusion of the Continuation item being considered, pure current Goal
  internal-context items, pure legacy artifacts, duplicate/stale/wrong-role or
  pre-injected Goal-looking items, non-progress contextual fragments, raw/UI
  counts, and helper output that did not reach final request input.
- Capture point for the key in the final shaping path before selected Goal
  insertion.
- Runtime Continuation watermark comparison by goal id,
  model-visible history key, and durable facts version.
- Committed suppression reconstruction on resume/restart, including the
  distinction between comparison triple and stored/reconstructed committed
  suppression evidence.
- Suppression precedence: durable watermark or equivalent state-owned record
  first, explicitly supported non-best-effort structured evidence second, and
  no reconstructed watermark otherwise.
- Compaction, reconstruction, rollback, and fork effects on eligible progress
  and Continuation suppression.
- History-key focused proof obligations.

Does Not Own:

- Goal authority or developer-role active steering truth. That belongs to
  `T-BEHAVIOR` and `T-FINAL`.
- Cadence event creation, steering-kind selection, pending non-Continuation
  delivery, or supersedence. Those belong to `T-CADENCE`, `T-DURABLE`, and
  `T-IDLE`.
- Final request-input item insertion, commit point side effects, or retry and
  follow-up shaping. Those belong to `T-FINAL`.
- Durable Goal facts mutation, pending intent persistence, exact-key
  consumption, or live durable watermark correctness when durable state is the
  chosen owner. Those belong to `T-DURABLE`.
- Recorded request evidence carrier, persistence, replay semantics, or
  partial-failure policy. Those belong to `T-EVIDENCE`.
- Classifier, projection hiding, compaction cleanup, reconstruction repair, or
  raw-notification behavior. Those belong to `T-CLEANUP`.

Shared / Local Non-Negotiables:

- The automatic Continuation item itself must not be the history change that
  permits another automatic Continuation.
- `ContextManager::history_version()` is not a sufficient key by itself.
- The key is computed from model-visible eligible progress, not raw
  notification counts, typed/materialized UI projection counts, helper output,
  or Goal cleanup artifacts.
- The key is captured per request attempt from the final shaping path before
  selected Goal item insertion.
- The Continuation watermark advances only after final request input contains
  the Continuation item as an outer developer-role Goal item and the request
  reaches the commit point.
- The watermark must not advance on idle hook fire, candidate selection, turn
  reservation, rendering, helper construction, shaping failure,
  built-but-not-submitted input, or submission failure before commit.
- Resume must not clear suppression in a way that permits a duplicate
  Continuation for unchanged eligible history and unchanged durable facts.
- Rollback and fork compute keys from surviving reconstructed history and must
  not resurrect active Goal facts or Continuation eligibility from rendered
  Goal artifacts.

Pointer-Only Dependencies:

- `T-IDLE` owns when the idle lifecycle asks whether automatic Continuation is
  eligible and how the lock/reservation lifecycle uses the watermark result.
- `T-FINAL` owns final input construction, commit point, and the side effect
  that advances the watermark after the committed Continuation item is proven.
- `T-DURABLE` owns durable facts version and any state-owned committed
  watermark record used as the correctness owner.
- `T-EVIDENCE` owns the structured evidence carrier and non-best-effort replay
  policy when evidence is explicitly used for suppression reconstruction.
- `T-CLEANUP` owns the classifiers and cleanup behavior whose outputs the
  history projection excludes or accounts for.
- `T-CADENCE` owns the rule that Continuation is a cadence event only when the
  idle predicate selects it.
- `T-TEST-PREP` owns the global replacement matrix; `T-HISTORY` keeps local
  history-key and suppression proof obligations.

Canonical Source Inputs:

- `goal-authority-model-visible-history-key.md`: title, Purpose, Code
  Terrain, Key Shape, Eligible Progress Projection, Capture Point, Runtime
  Watermark, Resume And Restart, Compaction And Reconstruction, Tests.
- `goal-authority-idle-continuation-contract.md`: Stage 3, Lock And
  Reservation, Resume Behavior, Acceptance Tests.
- `goal-authority-primary-cadence-contract.md`: Runtime Continuation
  Accounting, Continuation, Ordering With Pending Work, Verification
  Checklist, Version Plan Requirements.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Commit Metadata, Commit Point, Retry And Follow-Up, Recorded
  Request Evidence.
- `goal-authority-recorded-request-evidence.md`: Evidence Shape, Commit
  Ordering And Failure Policy, Resume And Continuation Suppression, Rollback
  And Fork, Compaction, Tests.
- `goal-authority-repair-classifier-integration.md`: Compaction, Rollout
  Reconstruction/Rollback/Fork, Contextual Parsing And History Boundaries.
- `goal-authority-durable-cadence-state.md`: Durable Ownership, Storage
  Shape, Continuation, Verification Requirements.
- `goal-authority-grounding-truth.md`: Primary Cadence, Request Repair,
  Acceptance Standard.
- `goal-test-deletion-map.md`: Replacement Test Profile, only for history-key
  and resume/idle proof obligations.

Concept Ledger Inputs:

- Owns: Model-visible history key; Eligible progress projection; Continuation
  watermark.
- Shared: Automatic Continuation; Feature and collaboration eligibility;
  Resume hydration; Retry behavior; Same-turn follow-up; Commit point; Commit
  metadata and item fingerprint; Durable facts version; Recorded request
  evidence; Compaction; Rollout reconstruction, rollback, fork; Replacement
  test profile.
- Pointer-only: Goal authority; Final model request input; Final
  request-input shaping; Pending cadence intent; Exact-key consumption;
  Request repair; Classifier outputs; Purity rules; Raw response
  notifications; External Goal mutation ordering.

Fidelity Tripwires / Review Debt:

- Do not describe history projection as authority, cadence selection, or
  pending intent consumption.
- Preserve the capture point before selected Goal item insertion.
- Preserve the eligible progress include/exclude lists, especially mailbox and
  hook-prompt inclusion and raw/UI/helper exclusion.
- Preserve the distinction between the comparison triple and stored committed
  suppression evidence with turn/item/timestamp identity.
- Preserve durable watermark or state-owned record as the default correctness
  owner unless evidence has an explicitly supported non-best-effort policy.
- Preserve the rule that ordinary `RolloutItem::ResponseItem`, rollout trace,
  and rendered Goal text cannot reconstruct suppression by themselves.
- Preserve compaction semantics: pure Goal removal does not change the key,
  but summaries replacing eligible progress can.
- Preserve rollback/fork behavior from surviving history only.

Pass 2C Rewrite Notes:

- Start this successor section from
  `goal-authority-model-visible-history-key.md`.
- Keep `T-HISTORY` narrow: key/projection/watermark/reconstruction only.
  Reference `T-IDLE` for scheduling and `T-FINAL` for commit.
- Do not inline the evidence carrier; point to `T-EVIDENCE` for replay
  metadata and partial-failure policy.
- Keep examples tied to the projection inputs rather than current Rust
  counters or one implementation's history version.

True Open Questions:

- None found in Packet 2. Exact storage form for the watermark remains
  implementation-plan work as long as it satisfies the source contract.

### T-EVIDENCE: Structured Recorded Request Evidence

Purpose:

- Define the structured committed evidence seam used when rollout or
  thread-history evidence is used as replay/audit evidence for Goal request
  delivery.
- Keep evidence metadata separate from Goal authority, durable state
  correctness, cadence selection, final request-input selection, and cleanup
  repair.

Owns:

- Recorded request evidence as metadata for a committed final request-input
  decision, created only by the commit path after the exact finalized request
  attempt reaches the commit point.
- Carrier choice for structured replay metadata, logically equivalent to
  `RolloutItem::GoalRequestEvidence(CommittedGoalRequestEvidence)` or an
  equivalent storage-neutral thread-history item.
- Evidence shape: schema version, thread/turn/attempt identity, goal id, kind,
  facts version, model-visible history key, item fingerprint,
  request-input fingerprint, item index, inserted-or-verified status,
  commit point, and commit timestamp.
- Fingerprint input rules for the exact selected developer-role Goal item and
  the whole finalized logical request input.
- Evidence commit timing after `ResponseEvent::Created`, and no evidence for
  shaping success, rendered text, helper output, reservation, accepted
  same-turn recheck, unsubmitted requests, or pre-Created failures.
- Commit ordering and partial-failure policy when evidence is used for replay
  correctness, including paired committed Goal item plus evidence append as
  one logical thread-history write where replay evidence matters.
- Replay semantics for pairing evidence with surviving model-visible Goal
  items by fingerprint and for reconstructing committed delivery metadata,
  carry metadata, or supported Continuation suppression basis.
- Resume, rollback, fork, compaction, raw, and typed projection treatment for
  evidence records.
- Evidence-focused replacement proof obligations.

Does Not Own:

- Goal authority or the behavioral rule for active steering. That belongs to
  `T-BEHAVIOR`.
- Final request-input selection, rendering, insertion/verification, commit
  metadata production, or final payload proof. Those belong to `T-FINAL`.
- Durable Goal facts, pending intent storage, exact-key consumption, or live
  durable Continuation suppression correctness. Those belong to `T-DURABLE`
  unless source authority explicitly chooses an equivalent evidence-backed
  correctness path.
- Cadence event selection, supersedence, or idle scheduling. Those belong to
  `T-CADENCE` and `T-IDLE`.
- Model-visible history key projection or watermark comparison semantics.
  Those belong to `T-HISTORY`.
- Classifier, request repair, projection hiding, compaction filtering, or
  reconstruction cleanup. Those belong to `T-CLEANUP`.
- Test matrix ownership or readiness handoff.

Shared / Local Non-Negotiables:

- Evidence records a committed final request-input decision; it is not the
  source of current Goal facts, pending intent, cadence selection, model input,
  or active Goal recovery.
- Final model payload remains the primary live verification evidence; recorded
  replay/audit evidence must represent the same logical final model request
  input when it is used.
- Ordinary `RolloutItem::ResponseItem`, optional rollout trace, helper output,
  raw notifications, and typed projections are not sufficient structured Goal
  request evidence.
- Live correctness defaults to durable state unless evidence is persisted
  through a non-best-effort path with an equivalent error policy for the
  behavior that depends on it.
- Evidence append failure must be observable and cannot silently weaken live
  pending-intent or Continuation suppression correctness.
- Evidence is metadata-only and must not materialize model input or expose a
  `to_model_input_item`-style steering path.
- Replay must never parse rendered Goal text to recover active Goal facts,
  objective, budget state, cadence kind, pending intent, or watermark.
- Evidence is not a raw response item and must not be emitted through raw
  response item notifications.

Pointer-Only Dependencies:

- `T-FINAL` owns the finalizer output, commit metadata, finalized-input
  identity, fingerprints, item index, attempt ordinal, and commit point that
  evidence records.
- `T-DURABLE` owns the live correctness mutation for pending intent and the
  durable or state-owned Continuation suppression record unless evidence is
  explicitly chosen with equivalent persistence/error policy.
- `T-HISTORY` owns the model-visible history key and suppression comparison;
  evidence may supply committed metadata only under the documented precedence.
- `T-CLEANUP` owns repair/reconstruction logic that may use evidence to
  reconstruct a lost recorded item without parsing rendered text.
- `T-IDLE` owns idle lifecycle decisions that may later use durable or
  supported evidence-derived suppression state.
- `T-CADENCE` owns which cadence kind was due; evidence records the committed
  kind but does not decide it.
- `T-TEST-PREP` owns the global evidence/replay replacement matrix.

Canonical Source Inputs:

- `goal-authority-recorded-request-evidence.md`: entire document, especially
  Purpose, Core Rule, Correctness Split, Carrier Choice, Evidence Shape,
  Fingerprints, Commit Timing, Commit Ordering And Failure Policy, Replay
  Semantics, Resume And Continuation Suppression, Rollback And Fork,
  Compaction, Raw And Typed Projection, Version Plan Notes, Tests.
- `goal-authority-final-request-input-and-commit.md`: Recorded Request
  Evidence, Commit Metadata, Commit Point, Retry And Follow-Up, Current-Turn
  Carry, Tests.
- `goal-authority-grounding-truth.md`: Acceptance Standard and Conformance
  Requirements, only for evidence as acceptable verification of the same
  logical final request input.

Supporting Source Inputs:

- `goal-authority-model-visible-history-key.md`: Resume And Restart,
  Runtime Watermark, Tests, only for structured evidence in suppression
  reconstruction.
- `goal-authority-durable-cadence-state.md`: Continuation and Verification
  Requirements, only for durable correctness fallback.
- `goal-authority-idle-continuation-contract.md`: Stage 2, Stage 3, Resume
  Behavior, Acceptance Tests, only for built-not-submitted and suppression
  interactions.
- `goal-authority-repair-classifier-integration.md`: Rollout Reconstruction,
  Rollback, And Fork; Raw Response Notifications.
- `goal-authority-primary-cadence-contract.md`: Final Model Request Input and
  Verification Checklist.
- `goal-test-deletion-map.md`: Replacement Test Profile, only for evidence
  proof obligations.

Concept Ledger Inputs:

- Owns: Recorded request evidence.
- Shared: Final model request input; Commit metadata and item fingerprint;
  Commit point; Retry behavior; Model-visible history key; Continuation
  watermark; Resume hydration; Compaction; Rollout reconstruction, rollback,
  fork; Raw response notifications; Replacement test profile.
- Pointer-only: Goal authority; Developer-role active steering; Durable Goal
  facts; Pending cadence intent; Exact-key consumption; Cadence events;
  Supersedence; Final request-input shaping; Request repair; Classifier
  outputs; Purity rules; Typed/materialized projection.

Fidelity Tripwires / Review Debt:

- Do not reintroduce vague rollout-as-proof language where structured recorded
  request evidence is intended.
- Preserve the correctness split: durable state owns live correctness by
  default; evidence owns replay/audit support unless it has equivalent
  persistence and error policy.
- Preserve that the evidence record excludes parsed objective text, prompt
  body fields, budget facts recovered from text, and legacy marker-derived
  facts.
- Preserve whole-input fingerprint scope, including non-Goal items actually
  sent and repair changes that affected final input.
- Preserve no-evidence cases: reservation, accepted same-turn recheck,
  rendered helper output, shaping success without submit, stream setup
  failure, submission failure before Created, and raw notification emission.
- Preserve paired append/partial-failure rules when evidence matters for
  replay.
- Preserve rollback/fork ignoring evidence outside surviving history or whose
  paired Goal item was rolled back.
- Preserve compaction no-synthesis: evidence is not created from cleanup,
  durable state, or surviving rendered Goal items.

Pass 2C Rewrite Notes:

- Start this successor section from
  `goal-authority-recorded-request-evidence.md`; it is already the dedicated
  design pass.
- Keep `T-EVIDENCE` metadata-only. Use explicit pointers to `T-FINAL` for
  shaping/commit and to `T-DURABLE`/`T-HISTORY` for correctness and
  suppression.
- State the non-best-effort condition in any place that evidence is allowed to
  support resume or suppression reconstruction.
- Do not present evidence as a shortcut that can bypass final-input
  inspection or durable state.

True Open Questions:

- None found in Packet 2. Concrete enum/table names remain implementation
  work as long as they satisfy the source evidence contract.

### T-CLEANUP: Cleanup, Repair, Projection, And Reconstruction

Purpose:

- Define the cleanup seam for classifiers, request-local repair support,
  typed/materialized projection hiding, contextual parsing, compaction,
  rollout reconstruction, rollback, fork, raw notifications, and legacy Goal
  artifact handling.
- Keep cleanup helpers from becoming cadence selectors, authority proof,
  durable state recovery, pending intent storage, or final-input commit
  owners.

Owns:

- Strict classifier output semantics for current Goal internal context,
  legacy Goal artifact, non-Goal internal context, and mixed/ordinary content.
- Purity rules for whole-message classification: `ResponseItem::Message`,
  user or developer role for cleanup classification, exactly one text content
  item, recognized representation after trimming, and no mixed visible prose.
- Cleanup/projection interpretation of source-tagged internal context and
  legacy `<goal_context>` artifacts, including the rule that classification is
  not authority.
- Final request-input repair support from classifiers, while leaving actual
  selected item insertion/verification and commit to `T-FINAL`.
- Typed/materialized projection behavior: hide pure current Goal
  internal-context items and pure legacy artifacts, keep mixed ordinary prose
  visible, and avoid treating projection hiding as proof.
- Contextual parsing and history boundary behavior for pure current/legacy
  Goal internal context versus ordinary messages and mixed content.
- Compaction behavior for filtering legacy artifacts, filtering stale or
  duplicate current items when not selected cadence items, preserving only
  committed carry metadata, and distinguishing preservation from repair.
- Rollout reconstruction, rollback, and fork cleanup: filter legacy artifacts,
  filter/dedupe current items, preserve mixed messages, and never recover
  active state or intent from rendered artifacts.
- Raw response notification contract for Goal items and legacy artifacts:
  raw remains raw unless the general raw-response contract changes.
- Classifier ownership split among generic internal-context helpers, legacy
  Goal artifact detection, and Goal cadence/final shaping.
- Cleanup-focused replacement proof obligations.

Does Not Own:

- Behavioral authority truth or acceptance-level active steering shape. That
  belongs to `T-BEHAVIOR`.
- Cadence decision, steering-kind selection, supersedence, or deciding when
  Goal should speak. That belongs to `T-CADENCE`.
- Durable Goal facts, pending intent, facts-version allocation, exact-key
  consumption, or active Goal state recovery. That belongs to `T-DURABLE`.
- Final request-input shaping ownership, selected item commit, retry/follow-up
  orchestration, or current-turn carry commit metadata. That belongs to
  `T-FINAL`.
- Idle hook scheduling, reservations, stale aborts, resume lifecycle, or
  automatic Continuation gating. That belongs to `T-IDLE`.
- History key construction and Continuation suppression reconstruction. That
  belongs to `T-HISTORY`.
- Structured recorded evidence carrier, persistence, replay semantics, or
  partial-failure policy. That belongs to `T-EVIDENCE`.
- Shim demolition sequencing, test-prep matrix ownership, readiness handoff,
  navigation, or glossary ownership.

Shared / Local Non-Negotiables:

- Classifiers are cleanup tools; they do not decide cadence and do not prove
  authority.
- Current Goal internal-context classification is not authority unless final
  request input also contains the selected outer developer-role item matching
  current durable Goal facts.
- Wrong-role current Goal items may be classified for cleanup but remain
  invalid authority.
- Mixed marker-like ordinary prose must not be hidden, dropped, deduplicated,
  or treated as Goal authority.
- Legacy `<goal_context>` detection is artifact handling only: no active
  steering, state recovery, objective inference, cadence, user-role
  preservation, or migration.
- Request repair is request-local by default and cannot become cadence.
- Compaction must not carry pre-finalizer concrete Goal input, create durable
  facts or pending intent, create active-state-only Goal items, or treat
  filtering as authority.
- Reconstruction, rollback, and fork must never recover active Goal facts,
  pending cadence intent, or current objective text by parsing rendered Goal
  artifacts.
- Raw response item notifications remain raw; typed/materialized hiding does
  not apply to raw notifications.
- Current-turn carry used by cleanup is committed metadata for an item already
  included in final input, not pre-finalizer concrete model input.

Pointer-Only Dependencies:

- `T-FINAL` owns the only callsite that may use classifiers to repair active
  authority, and owns selected item insertion/verification, repair report,
  commit metadata, and carry metadata.
- `T-CADENCE` owns cadence-required authority; cleanup/repair may preserve or
  restore already-required cadence items but cannot make cadence due.
- `T-DURABLE` owns current Goal facts and pending intent; cleanup must not
  infer or mutate them.
- `T-HISTORY` owns how cleanup exclusions affect eligible progress projection
  and Continuation suppression.
- `T-EVIDENCE` owns structured committed metadata used for lost recorded item
  repair or suppression reconstruction; cleanup may consume it only through
  evidence fingerprint rules.
- `T-SHIM` owns demolition terrain for active `GoalContext` paths; cleanup
  owns the strict replacement classifier/projection behavior that remains.
- `T-IDLE` owns repair limits for idle-created requests.
- `T-TEST-PREP` owns the global cleanup and raw-notification replacement
  matrix.

Canonical Source Inputs:

- `goal-authority-repair-classifier-integration.md`: entire document,
  especially Purpose, Classifier Outputs, Purity Rules, Final Request-Input
  Repair, Event Mapping And Typed Projection, Contextual Parsing And History
  Boundaries, Compaction, Rollout Reconstruction/Rollback/Fork, Raw Response
  Notifications, Classifier Ownership, Tests.
- `goal-authority-fake-shim-removal-map.md`: Shim-Dependent Consumers To
  Replace Carefully, Event And UI Hiding, Compaction, Rollout Reconstruction,
  History And User-Turn Boundaries, Contextual Fragment Infrastructure,
  Required Legacy Artifact Handling, What To Replace With, Work Areas 1-3 and
  6, Integration With Cadence Contract.
- `goal-authority-primary-cadence-contract.md`: Request Repair, Repair
  Decision Table, Legacy Goal Artifact, Shared Classification, Current
  Authority, Proving Current Authority, Verification Checklist.
- `goal-authority-grounding-truth.md`: Legacy Goal Artifact Handling, Request
  Repair, Repair Decision Table, Anti-Patterns, Acceptance Standard,
  Conformance Requirements.

Supporting Source Inputs:

- `goal-authority-final-request-input-and-commit.md`: Final Request-Input
  Shaping, Shaping Responsibilities, Current-Turn Carry, `goals.rs` Adapter,
  Tests.
- `goal-authority-model-visible-history-key.md`: Eligible Progress Projection,
  Compaction And Reconstruction, Tests.
- `goal-authority-recorded-request-evidence.md`: Replay Semantics, Rollback
  And Fork, Compaction, Raw And Typed Projection, Tests.
- `goal-authority-idle-continuation-contract.md`: Request Repair Interaction,
  Current Terrain To Replace, Acceptance Tests.
- `goal-authority-ext-goal-ownership.md`: Upstream v136 Shape and Required
  Replacement Shape, only for source-tagged helper and user-role compatibility
  caution.
- `goal-test-deletion-map.md`: Delete Local-Only Fake Context Tests and
  Replacement Test Profile, only for cleanup/raw proof obligations.

Concept Ledger Inputs:

- Owns: Internal-context provenance; Request repair; Legacy Goal artifact
  handling; Classifier outputs; Purity rules; Typed/materialized projection;
  Raw response notifications; Compaction; Rollout reconstruction, rollback,
  fork; History and user-turn boundaries.
- Shared: Active Goal steering text shape; Final request-input shaping;
  Current authority proof sources; Current-turn carry; Eligible progress
  projection; Recorded request evidence; Cadence-required authority; Runtime
  archaeology forbidden; Fake-shim removal; Replacement test profile.
- Pointer-only: Goal authority; Developer-role active steering; Durable Goal
  facts; Pending cadence intent; Exact-key consumption; Automatic
  Continuation; Model-visible history key; Continuation watermark; Commit
  point; Commit metadata and item fingerprint; Extension reachability.

Fidelity Tripwires / Review Debt:

- Do not let "classifier says Goal" become authority proof.
- Preserve the full purity rule, including exactly one text content item and
  whole-representation match after trimming.
- Preserve mixed-content visibility and ordinary-message treatment.
- Preserve wrong-role current Goal as cleanup-classified but not valid
  authority.
- Preserve raw notifications remaining raw for current Goal items, legacy Goal
  artifacts, and mixed prose.
- Preserve request repair as a request-local backstop, not a cadence mechanism.
- Preserve compaction's distinction between committed carry metadata,
  request-local repair, and forbidden pre-finalizer concrete carry.
- Preserve reconstruction/fork/rollback no-runtime-archaeology rules.
- Preserve that structured committed metadata may repair a lost recorded item
  only under cadence/evidence fingerprint rules, not by parsing text.
- Preserve generic internal-context helper ownership without reintroducing
  active Goal-specific `GoalContext` architecture.

Pass 2C Rewrite Notes:

- Start this successor section from
  `goal-authority-repair-classifier-integration.md`, then merge fake-shim
  consumer replacement clauses and legacy-artifact limits.
- Keep the cleanup doc operationally concrete because many callsites depend on
  the classifier/projection/compaction distinctions, but use pointers for
  final shaping, cadence, durable state, evidence, and history-key mechanics.
- Keep raw notification behavior explicit; do not hide it under typed
  projection behavior.
- Preserve enough test-facing detail for Pass 2C to avoid over-compressing
  purity, mixed-content, and current-turn carry rules.

True Open Questions:

- None found in Packet 2. Remaining cleanup `Review debt` is fidelity debt for
  Pass 2C, not unresolved behavior.
