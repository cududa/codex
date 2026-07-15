# WA05 Implementation Pass Review Packet Passforward

We are in `C:\Users\cullendudas\Documents\GitHub\codex-pinned`.

The work is review-only unless the user explicitly asks for edits. Do not
implement Rust code.

Authority is `local/goal_research`; `local/goal_136_plan` is execution
planning and may be rewritten only if the review identifies concrete fixes and
the user asks for them. Existing local and upstream code is terrain, not
mission.

## Current State

WA05 implementation pass docs have been created:

- `local/goal_136_plan/work-areas/05a-internal-context-and-goal-artifact-classifier.md`
- `local/goal_136_plan/work-areas/05b-request-input-cleanup-integration.md`
- `local/goal_136_plan/work-areas/05c-contextual-parsing-projection-history-boundaries.md`
- `local/goal_136_plan/work-areas/05d-compaction-cleanup.md`
- `local/goal_136_plan/work-areas/05e-rollout-reconstruction-rollback-fork-cleanup.md`
- `local/goal_136_plan/work-areas/05f-app-server-raw-and-materialized-projection.md`
- `local/goal_136_plan/work-areas/05g-wa05-test-surface-and-cross-checks.md`

The review goal is to validate the assigned packet against:

- `local/goal_research` authority
- the WA05 parent plan: `05-repair-classifiers-and-projections.md`
- the WA05 surface map: `05-repair-classifiers-and-projections-surface-map.md`
- actual local code terrain
- `rust-v0.136.0` landing topology and helper/projection/raw baseline
- `rust-v0.140.0` typed replay/evidence migration pressure where relevant

Upstream is terrain only. Do not let upstream override `local/goal_research`.

## Required Reading Before Review

Read top to bottom:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-final-request-input-and-commit.md`
4. `local/goal_research/goal-authority-model-visible-history-key.md`
5. `local/goal_research/goal-authority-recorded-request-evidence.md`
6. `local/goal_research/goal-authority-repair-classifier-integration.md`
7. `local/goal_research/goal-authority-fake-shim-removal-map.md`
8. `local/goal_research/goal-test-deletion-map.md`
9. `local/goal_136_plan/AGENTS.md`
10. `local/goal_136_plan/work-areas/AGENTS.md`
11. `local/goal_136_plan/work-areas/implementation-pass-planning-rules.md`
12. `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections.md`
13. `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`
14. The assigned packet docs appended below

Read assigned pass docs bottom-to-top first:

- `Non-Goals`
- `Branch Continuation State`
- `Tests And Checks`
- `Required Edits`
- `Exact Files To Edit`
- `Code Terrain Read`
- `Direction Lock`

Then do a top-to-bottom coherence pass.

## Direction Lock Requirement

Before findings, state:

- Request:
- Authority:
- Terrain:
- Upstream terrain:
- Code-shape temptation:
- Locked direction:
- Exclusions:

The lock must preserve:

- classifiers/projections are cleanup-only
- final request input remains active Goal authority
- raw response item notifications remain raw
- recorded request evidence is metadata-only
- WA05 does not decide cadence, mutate durable Goal state, consume pending
  intent, advance Continuation watermarks, or construct active model input

## Review Method

Do not do a grep-only review.

For the assigned packet:

- read the docs directly
- walk the bounded local files named in the packet
- compare with `rust-v0.136.0` for landing topology and baseline behavior
- compare with `rust-v0.140.0` only for typed replay/evidence migration
  pressure where relevant
- separate authority contradictions from code-terrain implementation pressure
- flag any apparent `goal_research` gap instead of inventing architecture

## Output Shape

Produce findings ordered by severity:

- contradictions with `local/goal_research`
- contradictions with WA05 parent or WA05 surface map
- code-terrain mismatches
- sequencing or dependency gaps
- stale wording or overreach
- migration-shape concerns
- passability verdict for each reviewed doc:
  - passable
  - passable after wording fixes
  - needs redesign before implementation

Do not edit by default. If fixes are requested, keep them scoped.

## Validation If Edits Are Made

For docs-only edits:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

Also scan touched WA05 docs for stale architecture language:

```powershell
rg -n --glob '05*.md' 'developer-role internal-context|internal-context ResponseItem|core/src/goal_cadence\.rs|\bfinalizer\b|structured proof|authority proof|GoalRequestEvidence.*authority|recorded request evidence.*authority|rendered Goal text.*evidence|classifier.*authority|raw Goal suppression|raw suppression' local\goal_136_plan\work-areas
```

Inspect every hit. Some hits are valid only when naming rejected terrain, old
test names, or explicitly preserving the authority/evidence/raw boundary.
```

## Packet 1: Classifier Foundation And Request Cleanup

Docs:

- `05a-internal-context-and-goal-artifact-classifier.md`
- `05b-request-input-cleanup-integration.md`
- `05c-contextual-parsing-projection-history-boundaries.md`
- WA05 parent/surface-map sections 1-6

Terrain:

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/context/mod.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/goal_cadence/` if present
- `codex-rs/core/src/goal_artifacts.rs` if present

Upstream:

- `rust-v0.136.0:codex-rs/core/src/context/internal_model_context.rs`
- `rust-v0.136.0:codex-rs/core/src/context/contextual_user_message.rs`
- `rust-v0.136.0:codex-rs/core/src/event_mapping.rs`

Question:

Do `05a`/`05b`/`05c` correctly establish cleanup-only classifier
infrastructure, integrate it into request-input cleanup without moving cadence
authority into the classifier, and convert projection/history boundaries
without hiding mixed ordinary prose?

Specific checks:

- `05a` keeps generic internal context as rendering/parsing support only.
- `05a` enforces whole-message purity and avoids authority-shaped classifier
  names.
- `05b` keeps durable Goal matching, cadence selection, selected item
  construction, repair reports, and commit metadata in `core/src/goal_cadence/`.
- `05b` does not make classifier output a substitute for final request input.
- `05c` converts contextual parsing, typed projection, and history boundaries
  without broad text-level marker suppression.
- `05c` does not redefine `model_visible_history_key`; it only supplies
  cleanup/projection support.

## Packet 2: Compaction And Reconstruction

Docs:

- `05d-compaction-cleanup.md`
- `05e-rollout-reconstruction-rollback-fork-cleanup.md`
- WA05 parent/surface-map sections 7-8
- WA03 appendage map sections that discuss compaction, rollback, fork, and
  reconstruction key behavior

Terrain:

- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`

Upstream:

- `rust-v0.136.0:codex-rs/core/src/compact.rs`
- `rust-v0.136.0:codex-rs/core/src/compact_remote.rs`
- `rust-v0.136.0:codex-rs/core/src/session/rollout_reconstruction.rs`
- `rust-v0.140.0:codex-rs/core/src/session/rollout_reconstruction.rs`

Question:

Do `05d`/`05e` remove concrete pre-shaper Goal carry from compaction and
reconstruction paths, while keeping artifact filtering separate from Goal facts,
cadence, Continuation suppression, and structured evidence?

Specific checks:

- `05d` refuses to keep `sess.current_turn_goal_steering_items()` as WA05
  continuation state.
- `05d` depends on WA02/WA03 committed carry metadata instead of copying
  rendered or prebuilt Goal input into replacement history.
- `05d` keeps compaction from synthesizing pending intent, watermarks, or
  `GoalRequestEvidence`.
- `05e` filters pure current and legacy artifacts while preserving mixed
  messages.
- `05e` rejects rendered-text recovery for active Goal facts, pending intent,
  current objective, and Continuation suppression.
- `05e` treats v140 typed replay as metadata-carrier precedent only and does
  not copy `to_model_input_item` behavior for Goal request evidence.

## Packet 3: App-Server Raw And Materialized Projection

Docs:

- `05f-app-server-raw-and-materialized-projection.md`
- WA05 parent/surface-map sections 9-10
- `goal-test-deletion-map.md` raw-notification and app-server protocol entries

Terrain:

- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/core/src/event_mapping.rs`
- app-server request processor tests only if materialized projection behavior
  is routed there

Upstream:

- `rust-v0.136.0:codex-rs/app-server/src/bespoke_event_handling.rs`
- `rust-v0.136.0:codex-rs/app-server-protocol/src/protocol/thread_history.rs`

Question:

Does `05f` cleanly delete the local app-server raw overlay while keeping
typed/materialized projection hiding separate and avoiding app-server-only Goal
classification?

Specific checks:

- raw response item notifications remain raw for pure current, pure legacy,
  and mixed Goal-looking `ResponseItem`s
- app-server materialized projection does not make raw behavior depend on
  projection hiding
- `GoalRequestEvidence` is not emitted as raw response item data and is not
  materialized as conversation prose
- tests replace raw-hiding assertions with raw-emits equality assertions
- no app-server-local marker parser survives as a hidden replacement for the
  old raw overlay

## Packet 4: Test Surface And Cross-Doc Coherence

Docs:

- `05g-wa05-test-surface-and-cross-checks.md`
- all `05a` through `05f`, bottom-up then top-down
- WA05 parent and surface map
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/06-cleanup-and-acceptance.md` only for
  final-audit boundary checks

Terrain:

- `codex-rs/core/src/goal_artifacts.rs` if present
- `codex-rs/core/src/context/contextual_user_message_tests.rs`
- `codex-rs/core/src/event_mapping_tests.rs`
- `codex-rs/core/src/context_manager/history_tests.rs`
- `codex-rs/core/src/compact_tests.rs`
- `codex-rs/core/src/session/rollout_reconstruction_tests.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- old local fake-shim tests named by `goal-test-deletion-map.md`

Upstream:

- `rust-v0.136.0` for upstream baseline tests and raw-notification behavior
- `rust-v0.140.0` only for typed replay/evidence precedent if evidence wording
  is involved

Question:

Do WA05 tests prove the right things in the right layer: classifier tests for
classification, projection/history tests for user-visible hiding and
boundaries, compaction/reconstruction tests for cleanup and no rendered-text
recovery, raw tests for raw emission, and no substitution for final request
input authority?

Specific checks:

- `05g` does not convert every deleted active-steering test into a classifier
  test.
- WA05 tests reject helper output, classifier matches, raw notifications,
  ordinary rollout items, rollout trace payloads, and rendered Goal text as
  active authority or structured commit evidence.
- final `/responses` payload tests remain WA02/WA04/WA06 unless a WA05
  request-input cleanup path directly needs a final-input assertion.
- WA00 owns initial false-pressure test deletion; WA05 owns replacement
  classifier/projection/raw/reconstruction tests; WA06 owns final stale-symbol
  audit and acceptance.
- No pass doc claims WA05 is an independent PR, release unit, or standalone
  acceptance checkpoint.

## Packet Handoff Guidance

After each packet review, compact with only:

- findings and severity
- passability verdicts
- edits requested but not yet made
- unresolved authority or code-terrain conflict
- any `goal_research` gap that should be resolved before continuing

Do not carry a full transcript forward. The next packet should reread the
required docs and walk its own bounded terrain.
