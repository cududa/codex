# WA05b: Request-Input Cleanup Integration

This pass connects the shared Goal artifact classifier to the Work Area 02
request-input shaping module. It keeps cleanup subordinate to cadence
selection and final request-input authority. Classifier output identifies
request-local cleanup terrain only; it does not select Goal cadence, consume
pending intent, advance a Continuation watermark, or validate delivery.

## Direction Lock

Request:

- integrate WA05 classifier output with `core/src/goal_cadence/` request-input
  cleanup
- do not make the classifier select cadence or commit delivery

Authority:

- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- current code injects concrete Goal-looking items before request shaping
  through `InputQueue::inject_goal_response_items(...)`
- WA02 owns per-attempt request shaping in `core/src/goal_cadence/`
- WA05a supplies strict current and legacy artifact classification
- any existing or historical helper output, raw notifications, rollout items,
  rendered text, classifier matches, or recorded evidence are terrain for
  cleanup only, not substitutes for the final `/responses` input

Code-shape temptation:

- let the classifier decide that a Goal item is current enough to satisfy
  cadence
- repair every active-Goal request because a Goal artifact was found or absent
- treat pre-injected Goal-looking items as evidence that delivery already
  happened

Locked direction:

- the classifier only identifies cleanup terrain
- `core/src/goal_cadence/` remains the only request-input owner for cadence
  selection, selected item construction, repair reports, and commit metadata
- the shaper re-reads current durable Goal facts and pending/idle request
  metadata for the exact attempt before selecting or inserting an item

Exclusions:

- no durable state mutation
- no pending-intent consumption
- no Continuation watermark advancement
- no recorded request evidence writes
- no broad projection, compaction, or app-server conversion

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-behavior.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-final-request-input.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-projection-reconstruction-and-raw-history.md`
- `local/goal_research/goal-idle-history-lifecycle.md`
- `local/goal_research/goal-recorded-request-evidence.md`
- `local/how-we-test.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`

## Code Terrain Read

- `codex-rs/core/src/goal_cadence/` if present from WA02
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/goal_artifacts.rs` from WA05a

## Pass Goal

Have the request-input shaper use the shared classifier when cleaning the
actual per-attempt base input before selecting or inserting the single current
Goal item. This pass does not create a new shaper if WA02 has not landed; it
binds cleanup behavior to the WA02 final request-input seam when that seam is
available.

## Exact Files To Edit

- `codex-rs/core/src/goal_cadence/mod.rs`
- `codex-rs/core/src/goal_cadence/cleanup.rs` or equivalent private submodule
- `codex-rs/core/src/goal_cadence/tests.rs` or focused request-shaper tests
- `codex-rs/core/src/goal_artifacts.rs`

## Required Edits

- Replace any shaper-local Goal marker parsing with calls into
  `goal_artifacts`.
- Ensure cleanup runs over the actual `Vec<ResponseItem>` supplied to the
  shaper for the current attempt.
- Use classifier output to remove or report:
  - pure legacy `<goal_context>` artifacts
  - wrong-role current Goal internal-context items
  - stale current Goal internal-context items
  - duplicate current Goal internal-context items
  - pre-injected Goal-looking items
- Keep durable Goal matching inside `goal_cadence`. The classifier must not
  receive a durable `ThreadGoal` snapshot or infer facts from rendered text.
- Keep cadence kind selection inside `goal_cadence` using the WA02/WA03
  snapshots and request metadata for the exact attempt. A classifier match or
  absence of a classifier match must not make Initial, ObjectiveUpdated,
  BudgetLimit, or Continuation due.
- Preserve mixed marker-like ordinary messages.
- Keep `GoalRepairReport` or equivalent reporting cleanup-only. It can explain
  what was removed or replaced; it cannot be a commit.
- Ensure the selected current Goal item is still inserted or verified only
  through WA02 cadence logic and still returns inert `GoalRequestCommit`
  metadata tied to the exact final item.
- Do not treat helper output, raw notifications, ordinary rollout items,
  rollout trace payloads, rendered Goal text, classifier matches, projection
  hiddenness, structured evidence, or `history_version()` as live delivery or
  duplicate-suppression authority.

## Tests And Checks

Use `local/how-we-test.md` and the cleanup triage doc. This pass should burn
down tests that defend helper output, pre-finalizer carry, classifier matches,
or rendered Goal artifacts as request authority after those code paths are
removed. Delete bad fake-shim tests with no replacement by default. Keep or add
focused request-shaper coverage only if this pass changes a real current
cleanup contract and no existing boundary validates it; do not create a
replacement-test backlog and do not add tests whose only purpose is confirming
old tests were removed.

Only keep or add focused boundary cases when they protect a real current
request-input cleanup contract and are not already covered:

- cleanup removes pure current duplicates and pure legacy artifacts
- cleanup preserves mixed marker-like prose
- wrong-role current Goal item is replaced only when cadence-required authority
  is due
- active durable Goal with no pending intent does not cause ordinary-turn
  repair by itself
- final shaper output contains at most one selected current Goal item
- helper output, classifier matches, raw notifications, rollout trace, and
  rendered Goal text are not accepted as substitutes for final request input

Assertions should inspect request-shaper output or captured final
`/responses` input, not classifier output alone.
For docs/test-deletion-only work, diff inspection is valid validation.

## Branch Continuation State

After this pass:

- `core/src/goal_cadence/` uses the shared classifier for request-local cleanup
- projection, compaction, reconstruction, and app-server raw paths may still
  use old predicates until their passes convert them
- final authority remains in the selected outer developer-role Goal
  `ResponseItem`

## Non-Goals

- no event mapping or typed projection conversion
- no compaction carry cleanup
- no rollout reconstruction conversion
- no app-server raw overlay deletion
- no final payload tests beyond request-input cleanup behavior introduced here
