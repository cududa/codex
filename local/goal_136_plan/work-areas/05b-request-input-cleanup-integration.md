# WA05b: Request-Input Cleanup Integration

This pass connects the shared Goal artifact classifier to the Work Area 02
request-input shaping module. It keeps cleanup subordinate to cadence
selection and final request-input authority.

## Direction Lock

Request:

- integrate WA05 classifier output with `core/src/goal_cadence/` request-input
  cleanup
- do not make the classifier select cadence or commit delivery

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/05-repair-classifiers-and-projections-surface-map.md`

Terrain:

- current code injects concrete Goal-looking items before request shaping
  through `InputQueue::inject_goal_response_items(...)`
- WA02 owns per-attempt request shaping in `core/src/goal_cadence/`
- WA05a supplies strict current and legacy artifact classification

Code-shape temptation:

- let the classifier decide that a Goal item is current enough to satisfy
  cadence
- repair every active-Goal request because a Goal artifact was found or absent

Locked direction:

- the classifier only identifies cleanup terrain
- `core/src/goal_cadence/` remains the only request-input owner for cadence
  selection, selected item construction, repair reports, and commit metadata

Exclusions:

- no durable state mutation
- no pending-intent consumption
- no Continuation watermark advancement
- no broad projection, compaction, or app-server conversion

## Authority Docs Read

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`

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
Goal item.

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
- Preserve mixed marker-like ordinary messages.
- Keep `GoalRepairReport` or equivalent reporting cleanup-only. It can explain
  what was removed or replaced; it cannot be a commit.
- Ensure the selected current Goal item is still inserted or verified only
  through WA02 cadence logic and still returns inert `GoalRequestCommit`
  metadata tied to the exact final item.

## Tests And Checks

Add or update focused request-shaper tests:

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
