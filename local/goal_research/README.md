# Goal Research Reader Map

This file is a navigation aid for the Goal successor docs and remaining
source-corpus/provenance artifacts in this directory. It does not supersede
`AGENTS.md` or any authority contract. If this reader map is incomplete or
imprecise, follow the owning successor document it points to.

This file remains the navigation container for successor topology work. Do not
split its reader map into a long-lived `goal-navigation-index.md` successor
authority doc.

The successor docs have been drafted and are the intended Goal authority
surface to harden in place. The next docs work is reader-compression,
navigation cutover, and deletion of superseded source, prep, and temporary
artifacts after the successor docs stand on their own. Older source docs, Pass
2 prep, topology/protocol/cursor artifacts, and temporary route records are
source corpus, provenance, and coverage aids during this transition. Do not
treat their existence as a reason to preserve duplicate reader surface.

Start with:

1. `AGENTS.md`
   - Local instructions, successor reader order, route-decision absorption
     posture, non-negotiables, and verification posture.
2. `CONTEXT.md`
   - Glossary for the Goal authority domain language.
3. `goal-authority-behavior.md`
   - Behavioral source of truth. Use it to reject implementation shapes that
     weaken model-visible Goal authority.

## Successor Authority Spine

Read these successor docs as the working authority spine:

1. `goal-authority-behavior.md`
   - Decides what is allowed and what is forbidden.
2. `goal-cadence-contract.md`
   - Decides when Goal steering is due, what state is required, and when
     pending intent is consumed.
3. `goal-durable-state-and-pending-intent.md`
   - Decides the durable facts, pending intent, supersedence, exact-key
     consumption, and durable suppression record shape.
4. `goal-final-request-input.md`
   - Decides where active Goal authority becomes final model input and when
     commit occurs.
5. `goal-idle-history-lifecycle.md`
   - Decides how the idle lifecycle orders pending work, pending durable
     cadence intent, automatic Continuation, and history-key suppression.

The remaining successor docs own supporting evidence, cleanup, extension,
test-prep, and readiness behavior. Repetition across successor docs should be
kept only when it is a local reminder, proof obligation, pointer, or
operational/test reminder that helps an implementation or review agent.

## Core Through-Line

The current design is carried by two main seams:

1. Durable cadence state records current Goal facts, a durable facts version,
   and pending Initial/ObjectiveUpdated/BudgetLimit intent.
2. Per-attempt final request-input shaping proves authority by placing or
   verifying the selected developer-role Goal item in the actual model input;
   commit happens only after model execution begins.

Everything else supports those seams:

- the idle lifecycle orders pending non-Goal work, pending durable cadence
  intent delivery, and automatic Continuation
- `model_visible_history_key` suppresses duplicate automatic Continuation from
  eligible non-Goal model-visible progress
- classifiers, projection hiding, compaction, reconstruction, and raw
  notification behavior are cleanup and repair support, not authority
- `ext/goal` may own lifecycle, mutation, accounting, and typed cadence
  requests, but not active model-input construction or commit
- fake-shim removal deletes active `GoalContext`/`<goal_context>` authority
  paths while keeping only legacy artifact handling
- test prep removes local false-compatibility pressure before replacement
  tests prove the new authority and cadence contracts

## Supporting Seams

Use these documents when working at a specific implementation seam:

| Question | Read |
| --- | --- |
| What durable state and exact-key consumption must exist before cadence can be implemented? | `goal-durable-state-and-pending-intent.md` |
| Where does active Goal authority become real model input, and how do retry, commit, and carry work? | `goal-final-request-input.md` |
| When rollout/thread history is used as replay evidence, what structured record captures the committed final request input? | `goal-recorded-request-evidence.md` |
| Which eligible progress projection suppresses duplicate automatic Continuation? | `goal-idle-history-lifecycle.md` |
| How does `ext/goal` participate without owning model-input authority, and what reachable/configured paths must be converted? | `goal-extension-lifecycle-and-reachability.md` |
| How do classifiers support cleanup and repair without deciding cadence? | `goal-request-repair-and-artifact-classification.md` |
| How do typed projection, compaction, reconstruction, raw notifications, rollback, fork, and legacy artifacts behave? | `goal-projection-reconstruction-and-raw-history.md` |
| What active Goal-only shim terrain must be removed? | `goal-test-prep-and-replacement-proof.md` |
| Which tests are local false-compatibility pressure versus baseline obligations? | `goal-test-prep-and-replacement-proof.md` |
| Are the implementation-design inputs ready for execution planning? | `goal-readiness-and-execution-handoff.md` |

## Current Terrain Anchors

These anchors help readers connect the contracts to current code. They are
terrain, not mission; do not infer desired architecture from current local code.

- Active fake shim: `codex-rs/core/src/context/goal_context.rs`
- Core Goal steering terrain: `codex-rs/core/src/goals.rs`
- Idle lifecycle terrain: `codex-rs/core/src/goals.rs`
- Final request-input path: `codex-rs/core/src/session/turn.rs`
- `Prompt.input` carrier: `codex-rs/core/src/client_common.rs`
- Responses API request input: `codex-rs/codex-api/src/common.rs`
- Current pre-shaper Goal carry terrain: `codex-rs/core/src/state/turn.rs`
- Current durable Goal facts: `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- Durable Goal model/runtime terrain: `codex-rs/state/src/model/thread_goal.rs`,
  `codex-rs/state/src/runtime/goals.rs`
- History and reconstruction terrain: `codex-rs/core/src/context_manager/history.rs`,
  `codex-rs/core/src/session/mod.rs`,
  `codex-rs/core/src/session/rollout_reconstruction.rs`
- Recorded request evidence terrain: `codex-rs/protocol/src/protocol.rs`,
  `codex-rs/thread-store/src/live_thread.rs`,
  `codex-rs/thread-store/src/types.rs`, `codex-rs/rollout/src/policy.rs`
- Cleanup and projection terrain: `codex-rs/core/src/event_mapping.rs`,
  `codex-rs/core/src/context/contextual_user_message.rs`,
  `codex-rs/core/src/compact.rs`,
  `codex-rs/core/src/compact_remote.rs`,
  `codex-rs/app-server/src/bespoke_event_handling.rs`
- `ext/goal` active steering terrain: `codex-rs/ext/goal/src/steering.rs`
- Extension injection terrain: `codex-rs/ext/goal/src/runtime.rs`,
  `codex-rs/core/src/codex_thread.rs`,
  `codex-rs/core/src/session/input_queue.rs`

## Document Roles

| Document | Role | Owns | Does not own |
| --- | --- | --- | --- |
| `goal-authority-behavior.md` | Behavioral authority | Active authority rule, forbidden authority substitutes, acceptance standard | File-specific implementation order |
| `goal-cadence-contract.md` | Cadence authority | Steering kinds, due rules, supersedence, pending-intent delivery/consumption boundaries | Durable storage shape, idle caller sequence details, final payload mechanics |
| `goal-durable-state-and-pending-intent.md` | Durable state seam | Facts version, pending intent storage, atomic mutations, supersedence cleanup, exact-key consumption, durable suppression record storage | Request shaping, repair decisions, prompt rendering, model roles, cadence selection |
| `goal-final-request-input.md` | Final model-input seam | Per-attempt shaping, selected item insertion/verification, cleanup inside shaping, Created-event commit, retry/follow-up carry | Durable mutation ownership, idle scheduling, evidence persistence |
| `goal-idle-history-lifecycle.md` | Idle and history seam | Legal idle callers, stage order, pending-work precedence, pending durable intent delivery, automatic Continuation, history-key suppression, resume hydration | Active steering shape, durable storage, evidence persistence |
| `goal-recorded-request-evidence.md` | Recorded evidence seam | Structured committed request evidence carrier, persistence timing, replay semantics, fingerprint inputs, rollback/fork/compaction treatment | Goal authority, cadence selection, durable mutation ownership |
| `goal-request-repair-and-artifact-classification.md` | Classifier and repair seam | Pure-item classification, legacy artifact classification, request-local repair, repair reports, whole-message purity | Cadence selection, durable Goal recovery, projection/raw/history behavior |
| `goal-projection-reconstruction-and-raw-history.md` | Projection/history support seam | Typed/materialized hiding, raw notification posture, compaction, reconstruction, rollback/fork effects, legacy artifact cleanup limits | Active authority, cadence selection, durable facts, pending intent |
| `goal-extension-lifecycle-and-reachability.md` | Extension ownership seam | Extension lifecycle, mutation entry points, accounting, typed cadence requests, reachability/config treatment | Model role selection, active model-input construction, final-input commit |
| `goal-test-prep-and-replacement-proof.md` | Test prep and proof map | Local overlay deletion, upstream baseline restoration, replacement proof matrix, snapshot posture, stale-symbol audits | Product redesign, behavior authority, implementation architecture |
| `goal-readiness-and-execution-handoff.md` | Readiness and handoff gate | Ready/Open/Blocker meanings, implementation execution-plan handoff requirements, post-successor source-corpus posture | Successor authority prose, implementation slices, module names |

## Coverage And Prep Artifacts

Use `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` as source
coverage and concept inventory while the successor docs are hardened.

Use `SUCCESSOR_DOC_COMPRESSION_GUIDE.md` as the temporary bridge for
repeated-authority compression rules. It carries the canonical owner, local
reminder, pointer-only, and operational/test reminder routing needed for the
compression sessions without requiring the old Pass 2B workspace.

Successor-doc hardening should check for:

- weakened non-negotiables
- summaries that imply current broken terrain is desired architecture
- missing edge cases, caveats, or exception clauses
- discarded wording that appears small but carries important authority
- loss of detail in repair, retry, resume, compaction, raw-notification, or
  test-prep behavior
- changes that make a support helper look like the authority mechanism

If a source/route conflict is identified, resolve that conflict in the owning
successor or source doc instead of using navigation prose as an override.

## Route-Decision Absorption

The v136 route-decision burn-down is complete. There is no active burn-down
pointer or batch list.

Temporary v136 provenance records, if present in a working copy, are optional
conflict-check material only. They are not common inputs for successor-doc
hardening or future implementation planning, and future readers must not depend
on them.
