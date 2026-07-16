# Goal Research Reader Map

This file is a navigation aid for the Goal authority docs in this directory.
It does not supersede `AGENTS.md` or any authority contract. If this reader map
is incomplete or imprecise, follow the source document it points to.

Start with:

1. `AGENTS.md`
   - Local instructions, authority order, non-negotiables, and verification
     posture.
2. `CONTEXT.md`
   - Glossary for the Goal authority domain language.
3. `goal-authority-grounding-truth.md`
   - Behavioral source of truth. Use it to reject implementation shapes that
     weaken model-visible Goal authority.

## Authority Spine

Read these documents as the stable conceptual spine:

1. `goal-authority-grounding-truth.md`
   - Decides what is allowed and what is forbidden.
2. `goal-authority-primary-cadence-contract.md`
   - Decides when Goal steering is due, what state is required, and when
     pending intent is consumed.
3. `goal-authority-idle-continuation-contract.md`
   - Decides how the idle lifecycle orders pending work, pending durable
     cadence intent, and automatic Continuation.

The spine intentionally repeats some non-negotiables. Treat that repetition as
authority reinforcement, not as an invitation to merge or weaken the clauses.

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
| What durable state and exact-key consumption must exist before cadence can be implemented? | `goal-authority-durable-cadence-state.md` |
| Where does active Goal authority become real model input, and how do retry, commit, and carry work? | `goal-authority-final-request-input-and-commit.md` |
| When rollout/thread history is used as replay evidence, what structured record captures the committed final request input? | `goal-authority-recorded-request-evidence.md` |
| Which eligible progress projection suppresses duplicate automatic Continuation? | `goal-authority-model-visible-history-key.md` |
| How does `ext/goal` participate without owning model-input authority, and what reachable/configured paths must be converted? | `goal-authority-ext-goal-ownership.md` |
| How do classifiers support cleanup, typed projection, compaction, reconstruction, raw notifications, and repair without deciding cadence? | `goal-authority-repair-classifier-integration.md` |
| What active Goal-only shim terrain must be removed? | `goal-authority-fake-shim-removal-map.md` |
| Which tests are local false-compatibility pressure versus baseline obligations? | `goal-test-deletion-map.md` |
| Are the implementation-design deliverables ready as design inputs for a version execution plan? | `goal-authority-open-design-deliverables.md` |

## Current Terrain Anchors

These anchors help readers connect the contracts to current code. They are
terrain, not mission; do not infer desired architecture from current local code.

- Active fake shim: `codex-rs/core/src/context/goal_context.rs`
- Core Goal steering terrain: `codex-rs/core/src/goals.rs`
- Idle lifecycle terrain: `codex-rs/core/src/goals.rs`
- Final request-input path: `codex-rs/core/src/session/turn.rs`
- `Prompt.input` carrier: `codex-rs/core/src/client_common.rs`
- Responses API request input: `codex-rs/codex-api/src/common.rs`
- Current pre-finalizer Goal carry: `codex-rs/core/src/state/turn.rs`
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
| `goal-authority-grounding-truth.md` | Behavioral authority | Allowed shape, forbidden patterns, acceptance standard | File-specific execution plan |
| `goal-authority-primary-cadence-contract.md` | Implementable cadence contract | Durable facts, pending intent, steering kinds, repair limits, verification checklist | Idle caller sequence details, state SQL specifics |
| `goal-authority-idle-continuation-contract.md` | Idle lifecycle contract | Pending-work precedence, pending durable intent delivery, automatic Continuation, resume hydration | Active steering shape, repair architecture |
| `goal-authority-durable-cadence-state.md` | Durable state seam | Facts version, pending intent storage, atomic mutations, supersedence cleanup, exact-key consumption | Request shaping, repair decisions, prompt rendering, model roles, Continuation policy |
| `goal-authority-final-request-input-and-commit.md` | Final model-input seam | Per-attempt shaping, cleanup, selected item insertion, commit metadata, item fingerprint, retry/follow-up behavior, current-turn carry replacement | Durable mutation ownership, idle scheduling |
| `goal-authority-recorded-request-evidence.md` | Recorded evidence seam | Structured committed request evidence carrier, persistence timing, replay semantics, fingerprint inputs, rollback/fork/compaction treatment | Goal authority, cadence selection, durable mutation ownership |
| `goal-authority-model-visible-history-key.md` | Continuation suppression support | Eligible progress projection, key shape, capture point, runtime watermark, resume/restart suppression, compaction effects | Goal authority, pending intent delivery, pending intent consumption, cadence selection |
| `goal-authority-ext-goal-ownership.md` | Extension ownership seam | Extension lifecycle, mutation, accounting, typed cadence participation, reachability/config treatment | Model role selection, active model-input construction, commit, pending-intent consumption, Continuation watermark updates |
| `goal-authority-repair-classifier-integration.md` | Classifier and repair integration | Pure-item classification, projection behavior, history/user-turn handling, compaction, reconstruction, raw notification behavior, request-local repair support | Cadence selection, authority proof, durable Goal recovery, active Goal state inference |
| `goal-authority-fake-shim-removal-map.md` | Demolition terrain map | Existing active Goal-only context path, dependent consumers to replace, legacy artifact handling | Cadence timing decisions |
| `goal-test-deletion-map.md` | Test prep map | Local overlay deletion, upstream baseline restoration, replacement profile, snapshot posture | Product redesign or permission to delete upstream Goal behavior tests |
| `goal-authority-open-design-deliverables.md` | Readiness checklist | Which design artifacts are Ready as implementation-design inputs | File-specific implementation slices, function names, migrations, test files |

## Pass 2 Guardrails

Do not move or rewrite authority content until the navigation layer has been
reviewed against the full source docs.

Use `PASS2_SECTION_TRACEABILITY.md` and `PASS2_CONCEPT_LEDGER.md` as the
review inventory before any content is renamed, rehomed, merged, split, or
rewritten.

Use `PASS2B_TARGET_INTERFACES.md` and `pass2b_target_interfaces/` as the Pass
2B target-interface workspace. Its repeated-authority canonicalization
workspace is Pass 2B.5 prep for deciding which repeated clauses become
canonical text, local reminders, pointer-only references, or operational/test
reminders before Pass 2C source-bounded rewrites.

Before any content is rehomed, create or maintain a section traceability table
that maps every existing section to its new location. The review must check for:

- weakened non-negotiables
- summaries that imply current broken terrain is desired architecture
- missing edge cases, caveats, or exception clauses
- discarded wording that appears small but carries important authority
- loss of detail in repair, retry, resume, compaction, raw-notification, or
  test-prep behavior
- changes that make a support helper look like the authority mechanism

Pass 1 may add navigation around authority. Pass 2 may move authority only with
traceability and a fidelity review.
