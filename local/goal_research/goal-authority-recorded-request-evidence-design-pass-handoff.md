# Recorded Request Evidence Design Pass Handoff

This is a compact-forward note for the next Goal authority design pass. It is
not authority and does not supersede the source contracts in this directory.

Status update: this handoff has been executed. The resolved seam is now
`goal-authority-recorded-request-evidence.md`, and
`PASS2_CONCEPT_LEDGER.md` no longer marks `Recorded rollout evidence` as
requiring a design pass.

## Suggested Skills

- `task-alignment`: required before terrain inspection and before writing the
  design pass output.
- `codebase-design`: useful if the pass needs to decide the deepest module/API
  boundary for structured recorded request evidence.
- `handoff`: use only if another compact handoff is needed after this pass.

Do not implement Rust code during this design pass unless the user explicitly
changes scope.

## Objective

Produce the recorded request evidence design pass for Goal authority.

The pass should decide how structured committed Goal request evidence is
represented, persisted, replayed, and tested when recorded rollout evidence is
used as replay evidence for the same logical final model request input.

Likely output shape:

- either a new source doc under `local/goal_research`, or
- tightly scoped updates to:
  - `goal-authority-final-request-input-and-commit.md`
  - `goal-authority-model-visible-history-key.md`
  - `goal-authority-repair-classifier-integration.md`
  - `goal-test-deletion-map.md`
  - `PASS2_CONCEPT_LEDGER.md`

Choose the artifact shape after re-reading `local/goal_research/AGENTS.md` and
the relevant source contracts.

## Current State

The code-grounding debt for `Recorded rollout evidence` has been completed.
It is no longer an unknown terrain question.

Original ledger status before this handoff was executed:

- `PASS2_CONCEPT_LEDGER.md` marks `Recorded rollout evidence` as
  requiring a design pass.
- `goal-authority-final-request-input-and-commit.md` now has a
  `Recorded Request Evidence` section.

Current ledger status after execution:

- `PASS2_CONCEPT_LEDGER.md` marks `Recorded rollout evidence` as
  `High-risk, Test-critical`.
- `goal-authority-recorded-request-evidence.md` defines the structured
  committed evidence carrier, replay semantics, failure policy, version notes,
  and focused tests.

The current conclusion is:

- final model payload remains the primary proof
- existing ordinary rollout replay is not enough to evidence Goal commit
  identity
- optional rollout trace is not durable replay state
- recorded proof, if used, requires structured committed Goal request evidence
- the design pass must decide the exact carrier and replay semantics

## Authority To Reground

Read these directly top to bottom before writing the design pass:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-final-request-input-and-commit.md`
6. `local/goal_research/goal-authority-model-visible-history-key.md`
7. `local/goal_research/goal-authority-repair-classifier-integration.md`
8. `local/goal_research/goal-authority-durable-cadence-state.md`
9. `local/goal_research/goal-test-deletion-map.md`
10. `local/goal_research/PASS2_CONCEPT_LEDGER.md`

Navigation aids that are useful but not peer authority:

- `local/goal_research/README.md`
- `local/goal_research/CONTEXT.md`
- `local/goal_research/PASS2_SECTION_TRACEABILITY.md`

## Direction Lock For Next Pass

Use this as the starting lock, then restate it after code terrain inspection:

```text
Request:
Design the structured recorded request evidence seam for Goal authority.

Authority:
Goal authority is still only the selected developer-role Goal `ResponseItem`
in final model request input. Recorded evidence can prove or reconstruct that
same logical request only when it carries structured commit identity; it is not
a second authority mechanism.

Terrain:
v135, rust-v0.136.0, and the available rust-v0.139.0 all persist ordinary
rollout replay items without Goal commit identity. Optional rollout trace can
record upstream inference requests, but it is best-effort diagnostics rather
than normal replay state.

Code-shape temptation:
Treat `RolloutItem::ResponseItem`, raw response notifications, rollout trace
request payloads, or rendered Goal text as already-sufficient proof.

Locked direction:
Design a structured committed Goal request evidence carrier or explicitly
limit recorded evidence to audit/test-only use while relying on durable state
for correctness. Do not weaken final request-input authority.

Exclusions:
No Rust implementation, no broad Rust tests, no user-role compatibility, no
rendered-text archaeology, and no v135/v136-only shortcut that harms v139/v140
migration posture.
```

## Code Terrain To Walk

Re-walk these files before writing the design pass. Existing code is terrain,
not mission.

Final request input and commit point:

- `codex-rs/core/src/session/turn.rs`
  - `run_sampling_request(...)`
  - `try_run_sampling_request(...)`
  - `ResponseEvent::Created`
- `codex-rs/core/src/client_common.rs`
  - `Prompt { input: Vec<ResponseItem> }`
- `codex-rs/core/src/client.rs`
  - request construction and rollout trace `record_started(...)`
- `codex-rs/codex-api/src/common.rs`
  - `ResponseEvent`

Thread replay persistence:

- `codex-rs/protocol/src/protocol.rs`
  - `RolloutItem`
- `codex-rs/thread-store/src/live_thread.rs`
  - `LiveThread::append_items(...)`
- `codex-rs/thread-store/src/types.rs`
  - `AppendThreadItemsParams`, `StoredThreadHistory`
- `codex-rs/thread-store/src/store.rs`
  - `ThreadStore::append_items(...)`, `load_history(...)`
- `codex-rs/rollout/src/policy.rs`
  - `persisted_rollout_items(...)`

History and reconstruction:

- `codex-rs/core/src/session/mod.rs`
  - `record_conversation_items(...)`
  - `persist_rollout_response_items(...)`
  - `persist_rollout_items(...)`
  - `record_initial_history(...)`
  - `apply_rollout_reconstruction(...)`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/context_manager/history.rs`

Optional diagnostics only:

- `codex-rs/rollout-trace/src/inference.rs`
- `codex-rs/rollout-trace/src/raw_event.rs`
- `codex-rs/rollout-trace/src/payload.rs`

Version checks:

- compare the above terrain against `rust-v0.136.0`
- compare against available `rust-v0.139.0`
- compare against `rust-v0.140.0`; this tag is available locally and was
  checked during the design pass that produced
  `goal-authority-recorded-request-evidence.md`

## Decisions The Design Pass Must Pin

The design pass should answer these directly:

- Is structured committed Goal request evidence required for correctness, or
  audit/test-only?
- If required for correctness, what durable fallback or error policy prevents a
  failed evidence append from silently weakening resume/reconstruction or
  Continuation suppression?
- Is the carrier a new `RolloutItem` variant, an equivalent thread-store item,
  a state table, or a split between replay evidence and durable watermark
  state?
- What exact fields are required?
- How is `request_input_fingerprint` computed, and which Goal-looking cleanup
  items are included or excluded?
- How is `item_fingerprint` tied to the exact developer-role Goal item in the
  final request input?
- Where is attempt identity captured, given retries and follow-up request
  attempts inside `run_sampling_request(...)`?
- Is evidence appended before or after consuming pending intent / advancing
  Continuation watermark, and what happens on partial failure?
- How does resume load or reconstruct the latest committed Continuation triple
  without parsing rendered Goal text?
- How do rollback and fork treat structured evidence whose corresponding
  model-visible history item was rolled back?
- How does compaction preserve, drop, or rebase structured evidence?
- How do raw response item notifications remain raw while typed/materialized
  projection may hide pure Goal internal context?
- Which tests prove final payload authority versus recorded evidence replay?

## Required Non-Negotiables

- Evidence is not authority by itself.
- The selected developer-role Goal item in final request input remains the
  authority source.
- No commit or evidence record before `ResponseEvent::Created` unless a later
  code walk proves a stricter commit point and the design names it.
- No evidence write on render, helper output, prompt construction without
  submission, stream setup failure, or pre-created submission failure.
- No parsing rendered Goal text to recover Goal facts, objective, pending
  intent, cadence kind, or Continuation suppression.
- Ordinary `RolloutItem::ResponseItem` may record model-visible content, but
  not commit identity.
- Optional rollout trace may help debug or test, but it is not normal durable
  replay state.
- Current-turn carry remains committed metadata, not pre-finalizer concrete
  `ResponseInputItem`.

## Verification Posture

For this docs-only design pass:

```text
git diff --check -- local/goal_research
```

Do not run broad Rust tests. If the design pass proposes later Rust
validation, keep it focused on final model payloads, recorded evidence items,
resume/reconstruction, rollback/fork, and Continuation suppression.
