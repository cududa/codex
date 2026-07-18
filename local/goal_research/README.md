# Goal Research Reader Map

This file is the navigation aid for the Goal successor docs in this directory.
It does not supersede `AGENTS.md` or any successor authority doc. If this
reader map is incomplete or imprecise, follow the owning successor doc and
update this map.

This file remains the navigation container. Do not split its reader map into a
long-lived `goal-navigation-index.md` successor authority doc.

## Start Here

1. `AGENTS.md`
   - Local instructions, authority order, non-negotiables, working posture, and
     verification posture.
2. `CONTEXT.md`
   - Glossary for Goal authority domain language.
3. `goal-authority-behavior.md`
   - Behavioral source of truth for active Goal authority and forbidden proof
     substitutes.

## Authority Spine

Read these successor docs as the authority spine:

1. `goal-authority-behavior.md`
   - Decides what counts as active Goal authority and what cannot prove it.
2. `goal-cadence-contract.md`
   - Decides when Goal steering is due and which steering kind wins.
3. `goal-durable-state-and-pending-intent.md`
   - Decides durable Goal facts, pending intent, exact-key consumption, and
     durable suppression storage.
4. `goal-final-request-input.md`
   - Decides where active Goal authority becomes final model input and when
     commit occurs.
5. `goal-idle-history-lifecycle.md`
   - Decides idle ordering, pending-work precedence, automatic Continuation,
     history-key suppression, resume, and restart.

The remaining successor docs own evidence, cleanup, extension, test-prep, and
readiness/handoff behavior.

## Core Through-Line

The current design is carried by two main seams:

1. Durable cadence state records current Goal facts, a durable facts version,
   pending Initial/ObjectiveUpdated/BudgetLimit intent, and durable suppression
   state where used.
2. Per-attempt final request-input shaping proves authority by placing or
   verifying the selected developer-role Goal item in the actual model input;
   commit happens only after model execution begins.

Everything else supports those seams:

- idle lifecycle orders pending non-Goal work, pending durable cadence intent,
  and automatic Continuation
- model-visible history keys suppress duplicate automatic Continuation from
  eligible non-Goal model-visible progress
- classifiers, projection hiding, compaction, reconstruction, and raw
  notification behavior are cleanup and repair support, not authority
- `ext/goal` may own lifecycle, mutation, accounting, and typed cadence
  requests, but not active model-input construction or commit
- test prep removes local false-compatibility pressure before replacement
  tests prove the successor authority and cadence contracts

## Supporting Seams

Use these documents when working at a specific implementation seam:

| Question | Read |
| --- | --- |
| What counts as active Goal authority? | `goal-authority-behavior.md` |
| When is Goal steering due, and which kind wins? | `goal-cadence-contract.md` |
| What durable state and exact-key consumption must exist? | `goal-durable-state-and-pending-intent.md` |
| Where does active Goal authority become real model input, and how do retry, commit, and carry work? | `goal-final-request-input.md` |
| How does idle ordering choose pending work, pending durable intent, or automatic Continuation? | `goal-idle-history-lifecycle.md` |
| What structured metadata records the committed final request input for replay/audit? | `goal-recorded-request-evidence.md` |
| How do classifiers and request-local repair support cleanup without deciding cadence? | `goal-request-repair-and-artifact-classification.md` |
| How do projection, compaction, reconstruction, raw notifications, rollback, fork, and legacy artifacts behave? | `goal-projection-reconstruction-and-raw-history.md` |
| How does `ext/goal` participate without owning active model-input authority? | `goal-extension-lifecycle-and-reachability.md` |
| Which tests are false-compatibility pressure, baseline obligations, or replacement proof? | `goal-test-prep-and-replacement-proof.md` |
| Are design inputs ready for execution planning, and what must a handoff contain? | `goal-readiness-and-execution-handoff.md` |

## Document Roles

| Document | Role | Owns | Does not own |
| --- | --- | --- | --- |
| `goal-authority-behavior.md` | Behavioral authority | Active authority rule, forbidden authority substitutes, acceptance standard | File-specific implementation order |
| `goal-cadence-contract.md` | Cadence authority | Steering kinds, due rules, supersedence, pending-intent delivery/consumption boundaries | Durable storage shape, idle caller sequence details, final payload mechanics |
| `goal-durable-state-and-pending-intent.md` | Durable state seam | Facts version, pending intent storage, atomic mutations, supersedence cleanup, exact-key consumption, durable suppression record storage | Request shaping, repair decisions, prompt rendering, model roles, cadence selection |
| `goal-final-request-input.md` | Final model-input seam | Per-attempt shaping, selected item insertion/verification, cleanup inside shaping, final-input commit, retry/follow-up carry | Durable mutation ownership, idle scheduling, evidence persistence |
| `goal-idle-history-lifecycle.md` | Idle and history seam | Legal idle callers, stage order, pending-work precedence, pending durable intent delivery, automatic Continuation, history-key suppression, resume hydration | Active steering shape, durable storage, evidence persistence |
| `goal-recorded-request-evidence.md` | Recorded evidence seam | Structured committed request evidence carrier, persistence timing, replay semantics, fingerprint inputs, rollback/fork/compaction treatment | Goal authority, cadence selection, durable mutation ownership |
| `goal-request-repair-and-artifact-classification.md` | Classifier and repair seam | Pure-item classification, legacy artifact classification, request-local repair, repair reports, whole-message purity | Cadence selection, durable Goal recovery, projection/raw/history behavior |
| `goal-projection-reconstruction-and-raw-history.md` | Projection/history support seam | Typed/materialized hiding, raw notification posture, compaction, reconstruction, rollback/fork effects, legacy artifact cleanup limits | Active authority, cadence selection, durable facts, pending intent |
| `goal-extension-lifecycle-and-reachability.md` | Extension ownership seam | Extension lifecycle, mutation entry points, accounting, typed cadence requests, reachability/config treatment | Model role selection, active model-input construction, final-input commit |
| `goal-test-prep-and-replacement-proof.md` | Test prep and proof map | Local overlay deletion, upstream baseline restoration, replacement proof matrix, snapshot posture, stale-symbol audits | Product redesign, behavior authority, implementation architecture |
| `goal-readiness-and-execution-handoff.md` | Readiness and handoff gate | Ready/Open/Blocker meanings, implementation execution-plan handoff requirements, source-corpus posture, demolition boundary, final cleanup routing | Successor authority prose, implementation slices, module names |

## Current Terrain Anchors

These anchors help readers connect the contracts to current code. They are
terrain, not mission; do not infer desired architecture from current local
code.

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

## Repository History

The live checked-in reader surface is the successor docs plus `AGENTS.md`,
`README.md`, and `CONTEXT.md`.

Use repository history only for a named provenance question, suspected concept
loss, or direct conflict that cannot be resolved from the live docs.
