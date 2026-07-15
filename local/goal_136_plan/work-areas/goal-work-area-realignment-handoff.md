# Goal Work Area Realignment Handoff

## Purpose

This note is for agents continuing the v136 Goal plan realignment after the
coordination-note update.

The work is documentation realignment only. Do not implement Rust code from
this note.

## Required Reading

Read these before editing:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-fake-shim-removal-map.md`
6. `local/goal_research/goal-authority-final-request-input-and-commit.md`
7. `local/goal_research/goal-authority-model-visible-history-key.md`
8. `local/goal_research/goal-authority-recorded-request-evidence.md`
9. `local/goal_research/goal-authority-durable-cadence-state.md`
10. `local/goal_research/goal-authority-repair-classifier-integration.md`
11. `local/goal_research/goal-test-deletion-map.md`
12. `local/goal_136_plan/AGENTS.md`
13. `local/goal_136_plan/work-areas/AGENTS.md`
14. `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`

`local/goal_research` is authority. `local/goal_136_plan` is execution
planning and may be rewritten to conform.

## Locked Decisions

- Final request input is the active Goal authority seam.
- The selected active Goal item is a final model input
  `ResponseItem::Message { role: "developer", ... }`.
- Source-tagged Goal text may support provenance and cleanup, but it is not
  authority. Do not write "developer-role internal-context ResponseItem."
- Use `codex-rs/core/src/goal_cadence/` as the private core module directory,
  not a single growing `goal_cadence.rs` file and not `goals.rs`.
- `goal_cadence::finalize_request_input(base_input, GoalRequestContext)`
  should remain a small request-input shaping interface. It receives typed
  facts and metadata assembled per attempt, not `&Session`, `StateDbHandle`, or
  `TurnContext`.
- `GoalFinalizationOutcome` needs a submit branch and an internal
  abort-before-submit branch for stale Goal-owned synthetic turns.
- `core/src/state/turn.rs` stores Goal turn request metadata and committed
  carry metadata only. It stores no rendered Goal prompt and no
  `ResponseInputItem` as authority.
- Same-turn cadence metadata means "re-run cadence selection from fresh durable
  facts"; it does not guarantee the originally requested kind is delivered.
- `ext/goal` must not construct active model input, choose active role,
  consume pending intent, advance Continuation suppression, or commit delivery.
- The v136 default is adapter/runtime conversion in `ext/goal`, not mandatory
  v139/v140 `GoalService` adoption.
- A thin `ext/goal/src/api.rs` facade is allowed only if a code-grounded pass
  proves the adapter/runtime path cannot carry shared mutation/accounting
  ordering. Full service adoption requires explaining why adapter/runtime and a
  thin facade are insufficient.
- Recorded request evidence is structured commit/replay metadata, not Goal
  authority, cadence selection, repair authority, or live correctness by
  default.
- Durable state remains the default correctness owner for pending-intent
  consumption and automatic Continuation suppression. Evidence may become a
  reconstruction source only if the selected implementation gives it a
  non-best-effort persistence and failure policy.
- `GoalRequestEvidence` or an equivalent typed carrier must be written from
  the Created-event commit path for the exact finalized request attempt. It
  must not be emitted as a raw response item, must not materialize model input
  by itself, and must not recover Goal facts from rendered text.

## Completed In This Realignment Pass

- Added the accepted v136 placement default to
  `goal-work-area-coordination-note.md`.
- Changed the open type-placement question into follow-through items.
- Updated `work-areas/AGENTS.md` so the file ownership map uses
  `core/src/goal_cadence/` and treats `ext/goal/src/api.rs` as optional.
- Updated the execution spine ownership map to make adapter/runtime conversion
  the Work Area 04 default and the service facade optional.
- Updated Work Area 04's direction lock, ownership split, and first required
  sections so `GoalService` is no longer mandatory.
- Updated Work Area 02's core shaper interface so it uses
  `GoalRequestContext`, no `&Session` / `TurnContext`, and a submit-or-abort
  outcome.
- Finished the Work Area 02 wording pass:
  - standalone "finalizer" language was replaced with request-input shaping
    language
  - current Goal authority is described as the final developer-role
    `ResponseItem`, not internal-context helper output
  - Created-event commit handling is explicitly separate from
    `goal_cadence::finalize_request_input(...)`
  - `VerifiedExisting` is valid only when the cleaned per-attempt request input
    already contains exactly one selected current developer-role `ResponseItem`
  - Continuation is described as runtime request metadata, never persisted
    pending cadence intent
  - ordinary rollout `ResponseItem`s are not treated as structured commit
    evidence for final request-input authority
- Reviewed `goal-authority-recorded-request-evidence.md` against the local
  request loop, Created-event seam, rollout item shape, and upstream
  v136/v139/v140 typed replay terrain. This handoff now treats that document
  as required work-area input, not as optional background.
- Propagated recorded request evidence through the first bottom-up subset:
  - Work Area 00 now lists the evidence authority doc and reserves replacement
    tests for Created-event evidence, fingerprint matching, and rejection of
    ordinary rollout items, rollout trace payloads, raw notifications,
    classifier matches, and rendered Goal text as evidence.
  - Work Area 01 and passes 01a/01b/01c now keep `GoalStore` durable-only and
    explicitly exclude `GoalRequestEvidence`, request-input/item
    fingerprints, replay pairing, rollout trace policy, and raw notification
    behavior from state ownership.
  - Work Area 01 now records that the propagation pass checked the current
    protocol, request loop, conversation recording, rollout reconstruction,
    live thread append, and rollout persistence policy terrain before editing.
- Propagated recorded request evidence through the Work Area 02 planning doc
  after a fresh bottom-up reread. This completed WA02 evidence propagation
  only; it did not implement Rust or complete the Work Area 02 implementation
  work:
  - `GoalRequestCommit` now carries attempt ordinal, item index,
    `item_fingerprint`, and `request_input_fingerprint` for the exact
    finalized logical request input.
  - the Created-event commit handler is the only legal writer for structured
    committed request evidence.
  - current-turn carry is committed metadata and fingerprints only, not
    rendered prompt text, `ResponseInputItem`, or a substitute evidence
    carrier.
  - WA02 tests and target state now cover Created-event evidence timing,
    fingerprint matching, rejection of ordinary rollout/trace/raw/classifier/
    rendered-text substitutes, and the durable-state live-correctness default.

## Recorded Request Evidence Status

`goal-authority-recorded-request-evidence.md` is conceptually accepted into
the realignment route. It still needs bottom-up propagation into the relevant
work-area docs where they touch request-input commit metadata, idle
Continuation reconstruction, rollout reconstruction, repair/classifier
cleanup, and final acceptance.

Do not treat this handoff update as evidence that all Work Area files have
already been rewritten for the new seam. The next agent should read the code
terrain named by the recorded-evidence doc before making each propagation edit,
especially:

- `codex-rs/core/src/session/turn.rs` for per-attempt request rebuilding and
  the `ResponseEvent::Created` commit point
- `codex-rs/core/src/session/mod.rs` for conversation recording and rollout
  append failure policy
- `codex-rs/protocol/src/protocol.rs` for the current `RolloutItem` shape
- `codex-rs/core/src/session/rollout_reconstruction.rs` for replay and
  rollback/fork behavior
- `codex-rs/thread-store/src/live_thread.rs` and
  `codex-rs/rollout/src/policy.rs` for persistence boundaries
- `rust-v0.136.0`, `rust-v0.139.0`, `rust-v0.140.0`, and `upstream/main`
  protocol/replay terrain where the version bridge matters

Current propagation status after the WA00/WA01/WA02 pass:

- Fully reread and edited:
  - `00-test-prep-and-baseline-reset.md`
  - `01-durable-cadence-state.md`
  - `01a-durable-facts-version-plumbing.md`
  - `01b-pending-cadence-intent-storage.md`
  - `01c-cadence-aware-store-operations.md`
  - `02-final-request-input-shaping-and-commit.md`
- Evidence decisions recorded:
  - WA00 is affected only in replacement-test posture and authority inputs; it
    remains a prep/baseline-reset Work Area and does not add evidence tests
    before the evidence implementation exists.
  - WA01 owns durable facts, facts version, pending intent, exact-key
    consumption, atomic facts-plus-intent mutations, and the default
    state-owned Continuation watermark option. It does not own recorded
    request evidence, replay pairing, request-input fingerprints, rollout
    trace policy, or raw notification behavior.
  - 01a facts version is a durable facts identity for exact pending-intent keys
    and Continuation watermark comparison. It is not request evidence and is
    not a substitute for item/request-input fingerprints.
  - 01b pending intent is before-delivery durable state. It must not carry
    attempt ordinal, item index, item/request-input fingerprints, commit point,
    rendered prompt text, or rollout trace payloads.
  - 01c atomic state APIs do not append, replay, or interpret recorded request
    evidence.
  - WA02 owns per-attempt request-input shaping metadata and the Created-event
    commit hook. It prepares exact commit identity and, when the typed carrier
    is implemented, writes structured evidence only from Created. It keeps the
    request-input shaper pure and durable state as the live correctness owner
    unless a non-best-effort evidence-backed path is explicitly selected.
- Remaining subset for later propagation:
  - `03-history-key-and-idle-continuation.md`
  - `04-ext-goal-conversion.md`
  - `05-repair-classifiers-and-projections.md`
  - `06-cleanup-and-acceptance.md`
  - any implementation pass docs already split from those Work Areas

## Passforward: Evidence Propagation Protocol

Recorded request evidence is not a small section to paste into existing Work
Area docs. It changes the conceptual contract anywhere a Work Area talks about
commit metadata, replay, resume, rollback/fork, compaction, raw notification,
thread history, rollout persistence, or tests that infer what reached the
model. Propagation must be a real reread-and-rewrite pass, not a grep patch.

Before marking the recorded-evidence concept integrated, the next agent must
read each remaining Work Area top to bottom and either edit it or record that
no evidence impact was found. The WA00/WA01/WA02 subset above has been fully
reread after `goal-authority-recorded-request-evidence.md` was introduced; the
remaining required reads are:

- `03-history-key-and-idle-continuation.md`
- `04-ext-goal-conversion.md`
- `05-repair-classifiers-and-projections.md`
- `06-cleanup-and-acceptance.md`
- any implementation pass docs already split from those Work Areas

Work Area 01 was included even though its first planning pass was completed
before the recorded-evidence authority doc landed. Its current files should
continue to follow this split:

- durable Goal state owns current facts, facts version, pending cadence intent,
  exact-key consumption, and the default automatic Continuation watermark
- recorded evidence owns committed request-input replay metadata only
- durable state remains the live correctness fallback when evidence persistence
  is best-effort
- any state API or test that describes commit outcomes must not imply ordinary
  rollout `ResponseItem`s or rendered Goal text are enough to reconstruct
  committed cadence delivery

The propagation pass should check each Work Area for these recurring failure
modes:

- evidence described as authority, proof, cadence selection, repair authority,
  durable Goal facts, or pending intent storage
- request-input shaping described as writing evidence or consuming state before
  `ResponseEvent::Created`
- ordinary rollout `ResponseItem`, rollout trace payloads, raw notifications,
  classifier matches, or rendered Goal text treated as committed request
  evidence
- Continuation suppression described as rollout-derived without the
  non-best-effort persistence and fingerprint-pairing requirements
- v140 `InterAgentCommunication` precedent copied as model-input
  materialization instead of metadata-only typed replay precedent
- tests asserting helper output, rollout text, or projection visibility instead
  of captured final `/responses` input plus structured commit metadata where
  evidence is in scope

This may take more than one session. If context is low, stop after a coherent
subset, update this handoff with exactly which Work Areas were fully reread
and edited, and leave the next subset named. Do not mark the recorded-evidence
propagation complete until every Work Area above has been read top to bottom
after `goal-authority-recorded-request-evidence.md` was introduced.

## Remaining Propagation Work And Baselines

### Work Area 02 Recorded-Evidence Baseline

Use Work Area 02's recorded-evidence alignment as the local baseline for later
Work Areas. This means the evidence concept has been propagated through the
WA02 overview contract; it does not mean the WA02 Rust implementation or all
implementation pass work is complete.

- shaper is pure over base input plus `GoalRequestContext`
- Created-event commit handler may use session/state adapters, but commit
  metadata must refer to the exact final item and finalized logical request
  input
- pending Initial, ObjectiveUpdated, and BudgetLimit intent is consumed by the
  Created-event commit path, not by request shaping

Work Area 02 has already been reopened narrowly for recorded-evidence
integration:

- `GoalRequestCommit` is aligned with the fields needed by
  `CommittedGoalRequestEvidence`, including attempt ordinal, item index,
  `item_fingerprint`, `request_input_fingerprint`, inserted-or-verified
  outcome, commit point, and committed timestamp
- `goal_cadence::finalize_request_input(...)` remains pure. It may return inert
  commit metadata, but the Created-event commit handler owns durable mutation,
  evidence append, and current-turn committed carry updates.
- the evidence carrier is required to be a typed thread-history/rollout metadata
  item if recorded rollout/thread history is used as replay evidence. Ordinary
  rollout `ResponseItem`s remain model-visible content and are not structured
  commit evidence by themselves.
- the paired-write rule is stated: when replay evidence matters, the committed
  Goal `ResponseItem` and `GoalRequestEvidence` must be appended as one
  logical thread-history write, with an explicit failure policy stronger than
  current fire-and-log rollout append behavior.
- durable pending-intent consumption remains the live correctness path unless
  the implementation explicitly chooses and justifies a non-best-effort
  evidence-backed alternative.

### Work Area 03

Update path and interface language:

- replace single-file `goal_cadence.rs` assumptions with
  `core/src/goal_cadence/`
- make Continuation finalization consume `GoalTurnRequest` metadata, not
  prebuilt model input
- ensure stale synthetic Goal-owned turns use
  `GoalFinalizationOutcome::AbortSyntheticGoalTurn` or equivalent
- keep committed automatic Continuation suppression storage described as
  committed metadata, not persisted pending Continuation intent

Additional Work Area 03 propagation learned from the Work Area 02 pass:

- replace standalone "finalizer" terminology with "request-input shaper",
  "per-attempt request-input shaper", or "Created-event commit handler" as
  appropriate. Function names may still use `finalize_*` only when the text
  makes clear they are narrow request-input shaping functions.
- do not say the request-input shaper consumes pending durable intent. The
  shaper selects cadence and returns inert commit metadata; the Created-event
  commit handler consumes exact-key pending intent or advances the Continuation
  watermark.
- replace any `GoalIdleRequest` or similar Work Area 03-only vocabulary with
  the shared `GoalTurnRequest` vocabulary unless the doc explicitly defines a
  narrower private helper that is translated before request shaping.
- pending durable cadence delivery from idle is metadata-only
  `GoalTurnRequest::IdlePendingCadence(...)`; it is not automatic
  Continuation and it does not carry prebuilt model input.
- automatic Continuation launch is metadata-only
  `GoalTurnRequest::IdleAutomaticContinuation(...)`; if the per-attempt
  recheck rejects it, the outcome is an internal abort-before-submit, not a
  model request failure.
- model-visible history key language must say "cleaned base request input" or
  equivalent. The key is computed before inserting the new Continuation item,
  excludes Goal cleanup/cadence items, and must not use
  `ContextManager::history_version()` as the sole key.
- if Work Area 03 uses resume/reconstruction evidence for Continuation
  suppression, that evidence must be structured committed metadata or durable
  state. Do not use ordinary rollout `ResponseItem`s or rendered Goal text as
  the suppression source.
- integrate `goal-authority-recorded-request-evidence.md` without replacing
  the durable watermark default. `thread_goal_continuation_watermarks` or an
  equivalent state-owned record remains the default correctness owner for
  automatic Continuation suppression.
- if Work Area 03 selects rollout-derived Continuation reconstruction, it must
  be based on structured committed `GoalRequestEvidence`, fingerprint pairing,
  and a non-best-effort persistence/failure policy. It must not rely on
  ordinary rollout `ResponseItem`s, rollout trace payloads, or rendered Goal
  text.
- the 03f/03g commit/resume passes should name exactly where Created-event
  commit metadata becomes either durable watermark state, structured evidence,
  or both. Evidence append follows the same commit point but does not itself
  consume pending durable intent.
- because Work Area 03 is large, first do a vocabulary/ownership alignment pass
  before splitting or rewriting implementation passes. Do not solve pass
  boundaries by document length; use the real seams: key projection, watermark
  storage, request-shaper runtime request integration, idle lifecycle, resume,
  and failure/retry behavior.

### Work Area 04

Finish the service-facade cleanup:

- all remaining `GoalService::...` examples must become "selected ordering
  path" unless they sit in an explicitly optional thin-facade subsection
- app-server should not be forced to depend on `codex-goal-extension` unless
  the chosen shape justifies it
- reachable `ext/goal` producers still must be converted, removed, or proven
  unreachable
- tests should prove extension/app-server-origin cadence reaches final
  `/responses` input as exactly one current developer-role Goal `ResponseItem`

### Work Area 05

Scrub wording that makes classifier or internal-context helpers sound like
authority:

- classifiers are cleanup/projection tools only
- current Goal source-tagged text may be classified for cleanup, but the
  authority seam remains final request input
- `goal_cadence/` may call classifier helpers; classifier helpers must not
  select cadence or infer durable Goal facts
- rollout reconstruction may consume structured committed Goal request
  evidence as replay metadata paired by fingerprint. Classifiers must not
  parse rendered Goal text to infer Goal facts, cadence kind, commit status, or
  Continuation watermarks.
- evidence is not a raw response item and must not be hidden, emitted, or
  materialized by projection/classifier helpers as conversation prose.

### Work Area 06

Update final acceptance checks:

- no Goal prompt-body-to-model-input construction outside `goal_cadence/`
- no production active `GoalContext`, `GoalContextRole`, active
  `<goal_context>`, user-role active Goal steering, or pre-finalizer concrete
  Goal injection
- no remaining mandatory `GoalService` adoption unless Work Area 04 selected
  and justified it
- no ordinary rollout `ResponseItem`, rollout trace payload, raw notification,
  or classifier match is accepted as structured Goal request evidence
- any `GoalRequestEvidence` carrier is typed metadata written only from the
  Created-event commit path for the exact finalized request attempt
- evidence failure policy is explicit: durable state remains the live
  correctness owner, or the selected evidence-backed reconstruction path is
  non-best-effort and tested

## Verification

For docs-only edits:

```powershell
git diff --check -- local/goal_research local/goal_136_plan
```

Also scan the touched docs for stale phrases:

```powershell
rg -n 'developer-role internal-context|internal-context ResponseItem|core/src/goal_cadence\.rs|GoalService::|route through `GoalService`' local\goal_136_plan
```

Scan evidence-related docs for vague or stale evidence language. Intentional
boundary mentions of `GoalRequestEvidence` or recorded request evidence are
expected after propagation; inspect hits for authority, ownership, or
rendered-text-recovery claims:

```powershell
rg -n --glob '!goal-work-area-realignment-handoff.md' 'structured proof|authority proof|GoalRequestEvidence.*authority|recorded request evidence.*authority|rollout trace.*as .*evidence|ordinary rollout `ResponseItem`.*as .*evidence|rendered Goal text.*evidence' local\goal_136_plan\work-areas
```

Some `GoalService` references are valid when they describe upstream topology or
the optional facade decision. They are not valid as mandatory v136
implementation instructions unless the doc explicitly carries the required
code-grounded justification.

For the Work Area 03 propagation pass, also scan the touched docs for:

```powershell
rg -n "\bfinalizer\b|pre-finalizer|GoalIdleRequest|pending durable intent|ResponseInputItem" local\goal_136_plan\work-areas\03-history-key-and-idle-continuation.md
```

Some hits are expected before the pass. Each remaining hit after the pass
should be intentionally retained because it names rejected terrain, a file/pass
name, or a compatibility note.
