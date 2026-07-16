# Batch 2: Lifecycle And Attempt Semantics

This is part of the Pass 2B.5 repeated-authority canonicalization workspace.
It is not future implementation authority.

Return to the [workspace README](README.md) for the canonicalization rules, template, batch order, and Pass 2C usage.

## Automatic Continuation And Watermarking

Concept:

- Automatic Continuation is selected only by the idle lifecycle and duplicate
  suppression uses model-visible history key plus Goal/facts identity.

Canonical text:

- `T-IDLE` owns automatic Continuation selection and lifecycle.
- `T-HISTORY` owns model-visible history key and watermark comparison.
- `T-FINAL` owns commit-time watermark advancement.

Local reminders:

- `T-CADENCE`: Continuation is a cadence event only when selected by idle and
  never supersedes pending non-Continuation intent.
- `T-DURABLE`: facts version supports suppression, and any state-owned
  committed suppression record supports resume/restart suppression; that record
  is not persisted pending intent and does not choose Continuation.
- `T-EVIDENCE`: structured evidence may support reconstruction only under the
  documented non-best-effort conditions.
- `T-TEST-PREP`: tests must cover suppression and changed history/facts.

Pointer-only:

- `T-BEHAVIOR`, `T-CLEANUP`, `T-EXT`, `T-SHIM`, `T-READINESS`,
  `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "automatic Continuation uses runtime-only
  watermarking" as a short pointer until cutover.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Primary Cadence.
- `goal-authority-primary-cadence-contract.md`: Runtime Continuation
  Accounting, Continuation, Ordering With Pending Work.
- `goal-authority-idle-continuation-contract.md`: Stage 3, Lock And
  Reservation, Resume Behavior, Acceptance Tests.
- `goal-authority-model-visible-history-key.md`: Key Shape, Eligible Progress
  Projection, Capture Point, Runtime Watermark, Resume And Restart.
- `goal-authority-final-request-input-and-commit.md`: Commit Point.
- `goal-authority-recorded-request-evidence.md`: Resume And Continuation
  Suppression.

Clauses that must not be lost:

- Continuation is not any next request, not active Goal existence, not a user
  turn, and not pending non-Continuation delivery.
- Continuation still requires Goals feature and collaboration-mode eligibility,
  active current durable Goal state, and the idle lifecycle's stage order.
- `model_visible_history_key` is computed from the same logical model-visible
  history used for the next request attempt, before inserting a new automatic
  Continuation item.
- The Continuation item being considered must not be the history change that
  permits another Continuation.
- Watermark advances only after final input contains the Continuation item as
  an outer developer-role Goal item and the request reaches commit.
- Resume/restart suppression must not use rendered Goal text.
- Resume/restart suppression defaults to a durable or equivalent state-owned
  committed suppression record unless explicitly supported non-best-effort
  structured evidence can reconstruct the same triple.

Allowed compression:

- Split canonical prose: selection in idle, key/watermark in history, commit
  advance in final.

Forbidden compression:

- Do not make one target own both idle selection and history projection in a
  way that hides their separate failure modes.

Pass 2C rewrite instruction:

- Keep the split explicit wherever Continuation appears. Use the phrase
  "idle selection; history watermark; final commit advance" as the pointer
  pattern.

## Resume Hydration

Concept:

- Resume reloads state and suppression basis; it does not create cadence or
  fabricate Initial.

Canonical text:

- `T-IDLE` owns resume hydration ordering at the lifecycle seam.
- `T-DURABLE` owns reloaded facts and pending intent.
- `T-HISTORY` owns suppression basis reconstruction.

Local reminders:

- `T-CADENCE`: resume is not cadence; already-pending Initial remains due.
- `T-EVIDENCE`: evidence must not create active Goal state and can support
  suppression only from surviving structured committed Continuation metadata
  under its non-best-effort evidence rules.
- `T-TEST-PREP`: tests must cover already-pending versus already-consumed
  Initial.

Pointer-only:

- `T-FINAL`, `T-CLEANUP`, `T-BEHAVIOR`, `T-EXT`, `T-SHIM`, `T-READINESS`,
  `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "resume is hydration, not cadence" as a short
  invariant.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Primary Cadence, Acceptance Standard.
- `goal-authority-primary-cadence-contract.md`: Ordering With Pending Work.
- `goal-authority-idle-continuation-contract.md`: Resume Behavior.
- `goal-authority-model-visible-history-key.md`: Resume And Restart.
- `goal-authority-recorded-request-evidence.md`: Resume And Continuation
  Suppression.
- `goal-test-deletion-map.md`: Delete Local-Only Core Overlay Tests,
  Replacement Test Profile.

Clauses that must not be lost:

- Resume must not create Initial merely because an active Goal exists.
- Resume must not infer intent from artifacts, emit steering, consume intent,
  or advance watermark.
- Already-pending Initial remains pending; already-consumed Initial is not
  re-emitted.
- Resume must clear stopped-goal runtime state when durable Goal status is not
  eligible for active Goal behavior.
- Resume must rebuild or load the committed Continuation suppression basis; it
  must not simply empty suppression and permit duplicate Continuation for
  unchanged history and facts.

Allowed compression:

- Put full resume lifecycle in idle, with durable/history details pointed to
  their owners.

Forbidden compression:

- Do not say "resume checks active Goal and continues" without the hydration
  and no-fabricated-Initial limits.

Pass 2C rewrite instruction:

- Keep resume examples in the idle successor doc and use test-prep pointers
  for replacement coverage.

## Retry, Follow-Up, And Same-Turn Cadence Recheck Metadata

Concept:

- Final shaping runs per attempt; pre-commit retry/failure preserves pending
  state, while same-turn cadence recheck is metadata/wake behavior only.

Canonical text:

- `T-FINAL` owns retry/follow-up shaping, commit timing, Created-event
  semantics, and stale pre-commit request metadata handling after commit.
- `T-IDLE` owns Goal-owned synthetic request metadata lifecycle, stale abort
  before submit, and same-turn cadence recheck/wake request routing.

Local reminders:

- `T-CADENCE`: same-turn metadata does not decide cadence or consume intent.
- `T-DURABLE`: pending intent survives until exact commit.
- `T-HISTORY`: follow-up reads updated watermark/history after commit.
- `T-EVIDENCE`: built-not-submitted and replay claims need structured
  evidence rules.
- `T-EXT`: extension same-turn behavior is metadata-only.

Pointer-only:

- `T-BEHAVIOR`, `T-CLEANUP`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`,
  `NAV-README`, `GLOSSARY`, `OP-AGENTS`, except for test reminders.

Operational/test reminders:

- `T-TEST-PREP` collects retry/follow-up and same-turn tests, but behavior
  owners remain final/idle/durable/cadence.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Acceptance Standard.
- `goal-authority-primary-cadence-contract.md`: ObjectiveUpdated,
  BudgetLimit, Final Model Request Input, Ordering With Pending Work,
  Verification Checklist.
- `goal-authority-idle-continuation-contract.md`: External Goal Mutation
  Behavior, Lock And Reservation.
- `goal-authority-final-request-input-and-commit.md`: Retry And Follow-Up,
  Current-Turn Carry, Commit Point.
- `goal-authority-recorded-request-evidence.md`: Commit Timing, Commit
  Ordering And Failure Policy.
- `goal-authority-ext-goal-ownership.md`: Required Replacement Shape.

Clauses that must not be lost:

- Shaping runs for every model request attempt.
- Retry before commit leaves pending intent and watermark unchanged.
- Built-not-submitted defaults to no consumption/no watermark advance unless a
  structured evidence path with equivalent error policy is explicitly chosen.
- Stream setup or submission failure before `ResponseEvent::Created` defaults
  to no pending-intent consumption, no watermark advance, and no stale evidence
  unless an explicit tested retry policy says otherwise.
- Stream failure after `ResponseEvent::Created` does not undo committed durable
  effects, any committed evidence, or committed carry metadata because the
  model request entered execution.
- Same-turn cadence recheck/request metadata does not construct active model
  input, choose role, or consume intent.
- Accepted metadata still consumes only when final input contains the matching
  outer developer-role Goal item and reaches commit.
- Unavailable or rejected metadata leaves intent pending for a later ordinary
  turn or idle-hook cadence-delivery turn.
- ObjectiveUpdated and BudgetLimit must not be dropped merely because no turn
  was active at mutation time.

Allowed compression:

- Combine retry and follow-up in `T-FINAL`; keep same-turn metadata lifecycle
  in `T-IDLE`/`T-EXT` with pointers to final commit.

Forbidden compression:

- Do not use "same-turn injection" as the planned replacement target.
- Do not say accepted metadata means delivered intent.

Pass 2C rewrite instruction:

- Preserve separate paragraphs for retry/follow-up and same-turn metadata
  wherever source prose currently intertwines them.

## Current-Turn Carry

Concept:

- Current-turn carry is committed metadata for an item already included in
  final input; it is not pre-finalizer concrete model input.

Canonical text:

- `T-FINAL` owns committed carry shape and commit-time creation.

Local reminders:

- `T-CLEANUP`: compaction may preserve committed carry metadata but cannot
  carry pre-finalizer concrete input.
- `T-IDLE`: uncommitted synthetic request metadata is not carry.
- `T-HISTORY`: carry can support same-turn/follow-up accounting but not
  history-key ownership.
- `T-TEST-PREP`: tests must reject pre-finalizer concrete carry authority.

Pointer-only:

- `T-BEHAVIOR`, `T-CADENCE`, `T-DURABLE`, `T-EVIDENCE`, `T-EXT`, `T-SHIM`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep the pre-finalizer carry warning as a short terrain
  warning until cutover.

Source sections carrying repeated authority:

- `goal-authority-primary-cadence-contract.md`: Current-Turn Carry.
- `goal-authority-final-request-input-and-commit.md`: Current-Turn Carry,
  Commit Metadata, Retry And Follow-Up.
- `goal-authority-repair-classifier-integration.md`: Compaction.
- `goal-authority-fake-shim-removal-map.md`: Compaction, Work Area 4.
- `goal-test-deletion-map.md`: Replacement Test Profile.

Clauses that must not be lost:

- Carry cannot create new cadence intent or prove a different request attempt.
- Carry stores logical committed metadata, not a concrete `ResponseInputItem`
  waiting to be injected.
- Carry metadata must preserve logical identity such as turn id, goal id, kind,
  facts version, model-visible history key, and selected item fingerprint, not
  rendered body text as authority.
- Source request metadata must not keep driving follow-up after Created
  commit.

Allowed compression:

- State full carry contract once in `T-FINAL`; cleanup/idle/history can use
  short local reminders.

Forbidden compression:

- Do not call pre-finalizer turn-local request metadata "carry."

Pass 2C rewrite instruction:

- Keep the committed versus uncommitted metadata split explicit in final,
  cleanup, and idle slices.

