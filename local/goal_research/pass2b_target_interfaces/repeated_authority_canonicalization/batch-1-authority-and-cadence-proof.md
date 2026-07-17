# Batch 1: Authority And Cadence Proof

This is part of the Pass 2B.5 repeated-authority canonicalization workspace.
It is not future implementation authority.

Return to the [workspace README](README.md) for the canonicalization rules, template, batch order, and future rewrite planning guidance.

## Final Request-Input Developer-Role Proof

Concept:

- Active Goal authority is proven only by the selected current Goal item in
  final model request input as an outer developer-role model item.

Canonical text:

- `T-FINAL` owns the full final request-input shaping, selected-item proof,
  commit metadata, fingerprint, and commit-point contract.
- `T-BEHAVIOR` owns the behavioral definition of Goal authority and the
  forbidden proof substitutes.

Local reminders:

- `T-CADENCE`: cadence decides when Goal is due, but delivery is not proven
  until final input contains the developer-role item.
- `T-CLEANUP`: classifier, projection, provenance, repair, and hiddenness do
  not prove authority.
- `T-EXT`: extension mutation or typed request metadata is not active model
  input.
- `T-TEST-PREP`: replacement tests must inspect final payloads or structured
  recorded request evidence.

Pointer-only:

- `T-DURABLE`, `T-IDLE`, `T-HISTORY`, `T-EVIDENCE`, `T-SHIM`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, and `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep a short invariant.
- `NAV-README` may route readers to `T-BEHAVIOR` and `T-FINAL`.
- `GLOSSARY` may define "final model request input" without contract detail.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Core Truth, Required Active Steering
  Shape, Anti-Patterns, Acceptance Standard.
- `goal-authority-primary-cadence-contract.md`: Non-Negotiable Shape, Final
  Model Request Input, Current Authority, Proving Current Authority.
- `goal-authority-final-request-input-and-commit.md`: Core Rule, Final
  Request-Input Shaping, Commit Metadata, Commit Point, Tests.
- `goal-authority-recorded-request-evidence.md`: Core Rule, Correctness Split,
  Fingerprints, Commit Ordering And Failure Policy, Replay Semantics, Tests.
- `goal-authority-fake-shim-removal-map.md`: Purpose, What To Replace With,
  Work Area 1, Work Area 4.
- `goal-authority-ext-goal-ownership.md`: Required Replacement Shape,
  Configuration, Reachability Rule.
- `goal-test-deletion-map.md`: Replacement Test Profile.

Clauses that must not be lost:

- The relevant proof is the logical final request input that becomes
  `Prompt.input` / `ResponsesApiRequest.input`.
- Helper output, rendered Goal text, source tags, UI projections, raw events,
  hidden metadata, reservations, pre-finalizer carry, and active durable state
  are insufficient.
- User-role active Goal steering has no compatibility exception.
- Final payload and structured recorded request evidence must represent the
  same logical final request input when evidence is used.

Allowed compression:

- Later docs may point from cadence, durable, idle, evidence, cleanup, and
  extension to `T-FINAL` for the mechanics.
- `T-BEHAVIOR` may state the behavioral rule and point to `T-FINAL` for
  mechanics rather than duplicating the full finalizer contract.

Forbidden compression:

- Do not summarize this as "Goal text was rendered" or "the helper produced a
  developer item."
- Do not let recorded evidence, provenance, classifier output, or tests become
  the authority mechanism.

Architecture Design Instruction:

- Write the full proof mechanics in the final-input successor section and the
  behavioral truth in the behavior successor section before replacing repeated
  cadence/cleanup/extension/test prose with explicit pointers.

## Pending Initial, ObjectiveUpdated, And BudgetLimit Until Commit

Concept:

- Initial, ObjectiveUpdated, and BudgetLimit persist as structured pending
  cadence intent until matching final request input reaches commit.

Canonical text:

- `T-DURABLE` owns pending intent shape, durable facts version, mutation
  ordering, supersedence cleanup, and exact-key consumption APIs.
- `T-FINAL` owns the commit point and timing of consumption.

Local reminders:

- `T-CADENCE`: non-Continuation intent outranks Continuation and ordinary user
  turns may deliver already-pending intent.
- `T-IDLE`: idle delivery of pending intent is not automatic Continuation.
- `T-EXT`: extension-origin mutation can create pending intent but cannot
  consume it or construct active input.
- `T-TEST-PREP`: replacement tests must cover pending survival and exact
  commit consumption.

Pointer-only:

- `T-BEHAVIOR`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-SHIM`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, and `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep the short non-negotiable that non-Continuation intent
  persists until final-input commit.
- `T-TEST-PREP` owns the matrix, not the behavior.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Primary Cadence, Acceptance Standard,
  Conformance Requirements.
- `goal-authority-primary-cadence-contract.md`: Pending Cadence Intent,
  Initial, ObjectiveUpdated, BudgetLimit, Supersedence Rules, Final Model
  Request Input, Ordering With Pending Work.
- `goal-authority-durable-cadence-state.md`: Storage Shape, Mutation Rules,
  Supersedence, Required Store Operations.
- `goal-authority-idle-continuation-contract.md`: Stage 2, External Goal
  Mutation Behavior, Resume Behavior.
- `goal-authority-final-request-input-and-commit.md`: Commit Point, Retry And
  Follow-Up.
- `goal-authority-ext-goal-ownership.md`: Required Replacement Shape.

Clauses that must not be lost:

- Intent is structured durable state, not rollout text, UI metadata, raw
  events, helper output, rendered context, or active state alone.
- Selection, rendering, construction, reservation, idle hook firing, and
  same-turn cadence recheck/request metadata do not consume intent.
- Ineligible shaping consumes no pending intent.
- Construction failure or built-not-submitted without an explicitly supported
  non-best-effort evidence path leaves intent pending.
- Submission that begins and then fails before Created defaults to leaving
  Initial, ObjectiveUpdated, and BudgetLimit pending unless an explicit retry
  policy is chosen and tested.
- Continuation is excluded from pending intent.

Allowed compression:

- Repeated "persist first, consume only after commit" prose can become one
  canonical durable/final contract plus short local reminders in cadence,
  idle, extension, and tests.

Forbidden compression:

- Do not say "pending until delivered" unless delivery is tied to matching
  developer-role final input and the commit point.
- Do not erase ObjectiveUpdated/BudgetLimit same-turn unavailable/rejected
  behavior.

Architecture Design Instruction:

- Write durable pending-intent semantics before simplifying cadence or idle
  sections. Keep final-input commit consumption explicit in `T-FINAL`.

## Exact-Key Consumption

Concept:

- Pending intent commit consumption requires matching thread, goal, steering
  kind, and facts version.
- Explicit supersedence cleanup is a separate stale-intent operation, not a
  broad exception to exact-key commit consumption.

Canonical text:

- `T-DURABLE` owns the exact-key operation and store semantics.
- `T-FINAL` owns when the operation may be called.

Local reminders:

- `T-CADENCE`: supersedence ranking must not become broad deletion.
- `T-IDLE`: stale synthetic turns and reservations must not consume.
- `T-TEST-PREP`: tests must cover wrong goal, kind, and facts version.

Pointer-only:

- `T-BEHAVIOR`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`, `T-EXT`, `T-SHIM`,
  `T-READINESS`, `NAV-README`, `GLOSSARY`, and `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may mention exact-key consumption only as a pointer to durable
  and final contracts.

Source sections carrying repeated authority:

- `goal-authority-durable-cadence-state.md`: Required Store Operations.
- `goal-authority-primary-cadence-contract.md`: Final Model Request Input,
  Supersedence Rules.
- `goal-authority-final-request-input-and-commit.md`: Commit Point.

Clauses that must not be lost:

- Do not consume a newer Goal, different kind, or different facts version.
- Mechanical supersedence cleanup is distinct from final-input commit
  consumption.
- Durable state may clean impossible stale intent but does not select request
  intent.

Allowed compression:

- Keep one exact-key definition in durable state and let final/cadence point
  to it.

Forbidden compression:

- Do not replace exact-key consumption with "clear pending intent" or
  "mark delivered."

Architecture Design Instruction:

- Put exact-key definition and examples in the durable successor doc; keep
  final commit timing local in `T-FINAL`.

## Active Durable State Alone Is Not Steering Or Cadence Authority

Concept:

- An active durable Goal is current fact state; it is not model-visible
  steering and does not by itself make cadence due.

Canonical text:

- `T-BEHAVIOR` owns the behavioral negative rule.
- `T-CADENCE` owns the cadence-required authority predicate.
- `T-DURABLE` owns state non-ownership.

Local reminders:

- `T-FINAL`: do not insert merely because an active durable Goal exists.
- `T-CLEANUP`: do not recover active state from artifacts.
- `T-IDLE`: automatic Continuation and pending delivery require lifecycle
  predicates, not active state alone.
- `T-EXT`: extension-owned lifecycle or mutation code may expose durable facts
  or summaries, but it cannot turn active durable facts into model input or
  cadence delivery.

Pointer-only:

- `T-EVIDENCE`, `T-SHIM`, `T-TEST-PREP`, `T-READINESS`,
  `NAV-README`, `GLOSSARY`, and `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep "active durable Goal state alone must not emit Goal
  steering" as a short invariant.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Durable State, Anti-Patterns.
- `goal-authority-primary-cadence-contract.md`: Durable Goal Facts, Cadence Is
  Primary, Current Authority.
- `goal-authority-durable-cadence-state.md`: Durable Ownership, Verification
  Requirements.
- `goal-authority-final-request-input-and-commit.md`: Shaping
  Responsibilities.
- `goal-authority-repair-classifier-integration.md`: Compaction,
  Reconstruction.
- `goal-authority-ext-goal-ownership.md`: Ownership Decision, Required
  Replacement Shape.

Clauses that must not be lost:

- Durable facts render current Goal text only when another owner decides a
  Goal item is due.
- State alone does not prove authority, emit steering, recover active state
  from history, or become cadence-required authority.

Allowed compression:

- Put the durable-state role in `T-DURABLE`; repeat the negative rule locally
  in behavior/cadence/final/cleanup/extension.

Forbidden compression:

- Do not summarize as "durable state is the authority" without specifying
  current facts versus model authority.

Architecture Design Instruction:

- Keep this rule visible in the first screen of behavior, cadence, durable,
  and final successor docs, with a local extension reminder where extension
  lifecycle or mutation prose exposes durable facts.

## Ordinary User Turns Are Not Cadence Events

Concept:

- An ordinary user turn does not create fresh automatic Continuation merely
  because a Goal is active.

Canonical text:

- `T-CADENCE` owns ordinary-user-turn cadence limits.
- `T-IDLE` owns pending-work precedence and idle hook ordering.

Local reminders:

- `T-FINAL`: ordinary turns may deliver already-pending non-Continuation
  intent only if final shaping selects and commits it.
- `T-TEST-PREP`: tests must cover user-turn non-cadence and pending delivery.

Pointer-only:

- `T-BEHAVIOR`, `T-DURABLE`, `T-HISTORY`, `T-EVIDENCE`, `T-CLEANUP`,
  `T-EXT`, `T-SHIM`, `T-READINESS`, `NAV-README`, `GLOSSARY`, `OP-AGENTS`.

Operational/test reminders:

- `OP-AGENTS` may keep the invariant as a short reminder.

Source sections carrying repeated authority:

- `goal-authority-grounding-truth.md`: Ordinary User Turns.
- `goal-authority-primary-cadence-contract.md`: Ordinary User Turns, Ordering
  With Pending Work.
- `goal-authority-idle-continuation-contract.md`: Legal Callers, Stage 1.

Clauses that must not be lost:

- Ordinary user turns may deliver already-pending Initial, ObjectiveUpdated,
  or BudgetLimit.
- Ordinary user turns may rely on already-valid current Goal authority only
  when final model request input can prove it; that is not fresh Continuation.
- Pending work outranks Goal-owned synthetic turns.
- Repair for cadence-required seam loss is not fresh cadence.

Allowed compression:

- Keep the full rule in cadence/idle and use pointers elsewhere.

Forbidden compression:

- Do not collapse ordinary turn non-cadence into "Goal only speaks from idle";
  pending non-Continuation intent can still be delivered in an ordinary turn.

Architecture Design Instruction:

- Preserve both halves: no fresh Continuation from a user turn, and pending
  non-Continuation intent may still be delivered.

