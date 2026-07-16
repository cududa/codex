# Batch 3: Cleanup, Evidence, And Reconstruction

This is part of the Pass 2B.5 repeated-authority canonicalization workspace. It is not authority and does not supersede any source contract in `local/goal_research`.

Return to the [workspace README](README.md) for the canonicalization rules, template, batch order, and Pass 2C usage.

## Request Repair Is Request-Local, Not Cadence

Concept:

- Repair is a request-local backstop for seam loss, staleness, duplication, or
  wrong role. It does not decide when Goal should speak.

Canonical text:

- `T-CLEANUP` owns classifier and repair semantics.
- `T-FINAL` owns the only active authority callsite that may apply repair to
  final request input.
- `T-CADENCE` owns the negative cadence rule: repair is not primary cadence.

Local reminders:

- `T-IDLE`: idle-created request repair cannot create pending intent, consume
  unrelated intent, or advance watermark.
- `T-TEST-PREP`: tests must cover repair without Goal-every-turn behavior.

Pointer-only:

- `T-BEHAVIOR`, `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-EXT`, `T-SHIM`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "request repair is request-local and not cadence" as a
  short invariant.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Request Repair, Repair Decision Table,
  Anti-Patterns/Repair As Cadence.
- `goal-authority-primary-cadence-contract.md`: Request Repair, Repair
  Decision Table, Cadence Is Primary.
- `goal-authority-idle-continuation-contract.md`: Request Repair
  Interaction.
- `goal-authority-final-request-input-and-commit.md`: Shaping
  Responsibilities.
- `goal-authority-repair-classifier-integration.md`: Final Request-Input
  Repair.

Clauses that must not be lost:

- Active durable state alone cannot be repaired into steering.
- Repair may preserve or restore already-required cadence authority but cannot
  make cadence due.
- Request-local repair must render from durable Goal state when
  cadence-required authority is due; it must not infer state or objective from
  rendered artifacts.
- Repair records to history only for normal pending-intent cadence consumption
  or when structured reconstruction proves a previously recorded cadence item
  was lost. It must not record merely because durable active Goal state exists.
- Classifier output is not authority proof.
- Previous-response/model-context reuse is not proof by itself.

Allowed compression:

- Put the repair decision table or equivalent in cleanup, with local cadence
  and final reminders.

Forbidden compression:

- Do not make repair the way Goal appears on every request.

Pass 2C rewrite instruction:

- Keep a compact decision table or checklist in cleanup and point cadence and
  final docs to it for mechanics.

## Classifier, Provenance, Helper Output, And Projection Are Not Authority

Concept:

- Generic internal context, source tags, classifier output, projection hiding,
  and helper-rendered Goal text support cleanup/rendering but do not prove
  active Goal authority.

Canonical text:

- `T-CLEANUP` owns classifier, provenance, projection, purity, and helper
  support boundaries.
- `T-BEHAVIOR` owns the behavior-level negative rule.
- `T-FINAL` owns the only seam where helper-rendered content can become
  active authority.

Local reminders:

- `T-EXT`: source-tagged extension/helper output is not active steering.
- `T-SHIM`: fake provenance machinery is deletion terrain.
- `T-TEST-PREP`: tests must not prove behavior by projection hiding or helper
  output.

Pointer-only:

- `T-CADENCE`, `T-DURABLE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `GLOSSARY` may define classifier/projection terms only.
- `OP-AGENTS` may keep generic internal-context non-authority as a short
  reminder.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Core Truth, Required Active Steering
  Shape, Anti-Patterns.
- `goal-authority-primary-cadence-contract.md`: Current Authority, Proving
  Current Authority, Shared Classification.
- `goal-authority-repair-classifier-integration.md`: Classifier Outputs,
  Purity Rules, Event Mapping And Typed Projection, Classifier Ownership.
- `goal-authority-fake-shim-removal-map.md`: Shim-Dependent Consumers,
  Contextual Fragment Infrastructure, What To Replace With.
- `goal-authority-ext-goal-ownership.md`: Upstream v136 Shape, Required
  Replacement Shape.

Clauses that must not be lost:

- Structured classifier outputs carry role, source or legacy identity, body
  fingerprint where applicable, and purity. Those fields are cleanup metadata,
  not authority.
- Pure classification requires the whole-message purity rule:
  `ResponseItem::Message`, `user` or `developer` role for cleanup
  classification, exactly one text item,
  recognized whole representation after trimming, and no mixed visible prose.
- Current classification is not authority unless final input also contains the
  selected outer developer-role item matching durable facts.
- Wrong-role current Goal items may be cleanup-classified but remain invalid
  authority.
- Projection hiding does not establish authority.
- Mixed ordinary prose remains visible and ordinary.

Allowed compression:

- Keep full classifier/projection details in cleanup; keep negative reminders
  in behavior/final/extension/shim.

Forbidden compression:

- Do not use `source = "goal"`, hiddenness, classifier output, or projection
  hiding as proof.

Pass 2C rewrite instruction:

- Preserve classifier/projection detail in the cleanup successor doc even if
  behavior/final docs point to it.

## Structured Recorded Request Evidence

Concept:

- Structured recorded request evidence records a committed final request-input
  decision for replay/audit support. It is not authority, cadence selection,
  pending intent storage, final-input inspection replacement, or active Goal
  recovery.

Canonical text:

- `T-EVIDENCE` owns carrier, shape, fingerprints, persistence timing, replay,
  rollback/fork/compaction treatment, raw/typed projection treatment, and
  evidence tests.
- `T-FINAL` owns finalized-input identity and commit metadata produced for
  evidence.

Local reminders:

- `T-DURABLE`: live correctness defaults to durable state unless evidence has
  equivalent non-best-effort persistence/error policy.
- `T-HISTORY`: suppression reconstruction may use evidence only under the
  documented precedence.
- `T-CLEANUP`: reconstruction may use structured metadata, not rendered text.
- `T-TEST-PREP`: tests may use final payload or structured evidence, not
  rollout trace.
- `T-READINESS`: evidence is a support seam, not a new authority mechanism.

Pointer-only:

- `T-BEHAVIOR`, `T-CADENCE`, `T-IDLE`, `T-EXT`, `T-SHIM`, `NAV-README`,
  `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `GLOSSARY` may define "structured recorded request evidence."
- `OP-AGENTS` should avoid carrying evidence mechanics.

Source sections carrying repeated authority:

- `goal-authority-recorded-request-evidence.md`: entire document.
- `goal-authority-final-request-input-and-commit.md`: Recorded Request
  Evidence, Commit Metadata, Commit Point.
- `goal-authority-grounding-truth.md`: Acceptance Standard, Conformance
  Requirements.
- `goal-authority-model-visible-history-key.md`: Resume And Restart, Tests.
- `goal-authority-repair-classifier-integration.md`: Rollout Reconstruction,
  Raw Response Notifications.
- `goal-test-deletion-map.md`: Replacement Test Profile.

Clauses that must not be lost:

- Ordinary `RolloutItem::ResponseItem`, optional rollout trace, helper output,
  raw notifications, and typed projections are insufficient structured Goal
  request evidence.
- Evidence must be created only by the commit path after `ResponseEvent::Created`.
- Stream failure after `ResponseEvent::Created` keeps committed evidence valid;
  pre-Created setup/submission failure writes no evidence.
- Evidence identity includes schema version, exact thread/turn/attempt
  identity, goal id, cadence kind, facts version, model-visible history key,
  item fingerprint, request-input fingerprint, item index,
  inserted-or-verified status, commit point, and commit timestamp. Schema must
  change when fingerprint inputs or replay meaning changes.
- Evidence excludes parsed objective text, prompt body fields, budget facts
  recovered from text, and legacy marker-derived facts.
- When replay evidence matters, the paired committed Goal `ResponseItem` and
  `GoalRequestEvidence` append must be one logical thread-history write; a
  partial append must be rejected, retried, or made unreplayable.
- Evidence append failure must be observable and cannot silently weaken live
  pending-intent or Continuation suppression correctness.
- Evidence must not materialize model input or expose active steering.

Allowed compression:

- Use the evidence successor doc as the full carrier contract; final/history/
  durable/cleanup can keep local boundary reminders.

Forbidden compression:

- Do not say "recorded rollout proof" or rely on rollout trace.
- Do not let evidence replace final-input inspection.

Pass 2C rewrite instruction:

- Keep evidence as its own successor target. Do not fold it into final or
  history just because those targets depend on its metadata.

## Raw Response Item Notifications

Concept:

- Raw response item notifications remain raw for current Goal items, legacy
  artifacts, and mixed prose unless the general raw-response contract changes.

Canonical text:

- `T-CLEANUP` owns raw notification behavior and typed/materialized projection
  distinction.

Local reminders:

- `T-EVIDENCE`: evidence is not a raw response item.
- `T-TEST-PREP`: raw tests should delete local suppression but keep/adapt
  desired raw-emits coverage.

Pointer-only:

- `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-FINAL`, `T-IDLE`, `T-HISTORY`,
  `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "raw remains raw" as a short invariant.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Legacy Goal Artifact Handling,
  Acceptance Standard.
- `goal-authority-primary-cadence-contract.md`: Legacy Goal Artifact,
  Verification Checklist.
- `goal-authority-repair-classifier-integration.md`: Raw Response
  Notifications.
- `goal-authority-fake-shim-removal-map.md`: Event And UI Hiding, Work Area
  6.
- `goal-authority-recorded-request-evidence.md`: Raw And Typed Projection.
- `goal-test-deletion-map.md`: Delete Local-Only Fake Context Tests,
  Replacement Test Profile.

Clauses that must not be lost:

- Typed/materialized projection hiding does not apply to raw notifications.
- Current Goal items and legacy artifacts are not specially suppressed from
  raw notifications by Goal-specific code.
- Mixed ordinary prose remains ordinary and raw; it must not be hidden or
  suppressed merely because it contains marker-like text.
- Evidence records are metadata and not raw response items.

Allowed compression:

- State full raw/projection split in cleanup and use test-prep reminders for
  coverage.

Forbidden compression:

- Do not hide raw behavior under "projection hides Goal items."

Pass 2C rewrite instruction:

- Keep raw notification behavior explicit in cleanup and test-prep slices.

## Compaction, Reconstruction, Rollback, And Fork

Concept:

- Cleanup may filter legacy/stale/duplicate items and preserve committed
  metadata, but reconstruction paths must not recover active Goal state,
  pending intent, or current objective by parsing rendered artifacts.

Canonical text:

- `T-CLEANUP` owns cleanup/reconstruction behavior.
- `T-HISTORY` owns eligible progress and suppression key effects.
- `T-EVIDENCE` owns structured committed metadata used for replay support.
- `T-FINAL` owns committed carry metadata and request-local repair at final
  input.

Local reminders:

- `T-BEHAVIOR`: runtime archaeology remains forbidden.
- `T-DURABLE`: active facts and pending intent come from durable state, not
  artifacts.
- `T-TEST-PREP`: tests must cover compaction/reconstruction/rollback/fork.

Pointer-only:

- `T-CADENCE`, `T-IDLE`, `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`,
  `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep runtime archaeology as a short invariant.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Request Repair, Runtime Archaeology,
  Acceptance Standard.
- `goal-authority-repair-classifier-integration.md`: Compaction, Rollout
  Reconstruction/Rollback/Fork, Contextual Parsing And History Boundaries.
- `goal-authority-fake-shim-removal-map.md`: Compaction, Rollout
  Reconstruction, History And User-Turn Boundaries.
- `goal-authority-model-visible-history-key.md`: Compaction And
  Reconstruction.
- `goal-authority-recorded-request-evidence.md`: Replay Semantics, Rollback
  And Fork, Compaction.

Clauses that must not be lost:

- Pure Goal cleanup does not create authority.
- Mixed ordinary messages remain ordinary.
- Structured committed metadata may repair a lost recorded item only through
  evidence/fingerprint rules, not text parsing.
- Lost recorded item repair must render from current durable Goal facts when
  repairing current authority, not from historical rendered text.
- Compaction must not synthesize evidence from surviving Goal items, durable
  state, or cleanup. Correctness across compaction uses durable state or an
  explicit carry-forward evidence checkpoint when replay evidence matters.
- Rollout-only Continuation suppression across compaction requires a
  structured carry-forward record for the latest committed Continuation triple,
  not copied rendered Goal text.
- Rollback and fork ignore rolled-back evidence, and ignore evidence whose
  paired model-visible Goal item was rolled back.
- Rollback/fork use surviving history and state/evidence only.

Allowed compression:

- Keep concrete cleanup algorithms in cleanup; history/evidence/final carry
  only their local effects.

Forbidden compression:

- Do not summarize reconstruction as "recover Goal from history."

Pass 2C rewrite instruction:

- Treat this as a cross-slice fidelity hotspot. Any source slice touching
  compaction or reconstruction should audit cleanup, history, evidence, and
  final carry together.

