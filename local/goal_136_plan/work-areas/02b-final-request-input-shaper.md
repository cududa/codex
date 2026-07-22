# Work Area 02b: Final Request-Input Shaper

This ordered pass implements the pure request-input shaper over
`Vec<ResponseItem>` plus typed facts. It selects pending Initial,
ObjectiveUpdated, and BudgetLimit intent and returns inert commit metadata, but
it does not wire the shaper into every sampling attempt.

## Direction Lock

Request:

- implement final request-input shaping behavior inside `core/src/goal_cadence/`
- clean active request input, select durable pending intent, render exactly one
  current developer-role Goal item when due, and return commit metadata
- keep state loading and stream commit outside the pure shaper

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-idle-continuation-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02a-goal-cadence-module-and-shaper-primitives.md`

Terrain:

- `core/src/goal_cadence/` owns pure shaping after 02a.
- `core/src/goals.rs` has existing prompt body helpers and old Goal steering
  item construction.
- `core/src/context/goal_context.rs` is old active steering terrain, not the
  target wire shape.
- Work Area 01 cadence snapshots expose durable facts and pending intent.

Code-shape temptation:

- load state or call session APIs from the shaper
- treat active durable Goal state alone as enough to emit a Goal item
- trust historical rendered Goal items, old carry items, or classifier matches
  as authority
- use `<goal_context>` because existing helper code can render it

Locked direction:

- `finalize_request_input(...)` is a pure function over base input and
  `GoalRequestContext`
- the shaper removes only pure Goal artifacts from the active request input,
  applies eligibility gates, selects pending cadence by priority, renders from
  durable state, and returns inert commit metadata
- Continuation remains inactive until Work Area 03 supplies the real
  model-visible history key and policy

Exclusions:

- no retry-loop wiring
- no Created-event commit side effects
- no pending intent consumption
- no automatic Continuation selection
- no broad compaction/projection/raw classifier cleanup
- no `ext/goal` conversion

## Code Terrain Read

Directly read:

- `codex-rs/core/src/goal_cadence/mod.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/client_common.rs`
- `codex-rs/core/tests/common/responses.rs`

Observed facts:

- final request input must contain a final outer developer-role `ResponseItem`
  before `build_prompt(...)`.
- old concrete Goal-looking items may already exist in request input from local
  fork terrain and must be cleaned at this final seam.
- request-local cleanup is narrower than Work Area 05 classifier/projection
  cleanup.

## Pass Goal

Implement the pure final request-input shaper and focused module tests for
selection, cleanup, fingerprints, and no-selection behavior.

## Exact Files To Edit

- `codex-rs/core/src/goal_cadence/mod.rs`
- optional private files under `codex-rs/core/src/goal_cadence/`
- `codex-rs/core/src/goals.rs` only for prompt-body helpers if needed

## Required Edits

Add:

```rust
pub(crate) fn finalize_request_input(
    base_input: Vec<ResponseItem>,
    context: GoalRequestContext,
) -> GoalFinalizationOutcome;
```

Shaping order:

```text
receive base Vec<ResponseItem> for this attempt
classify/remove pure legacy <goal_context> artifacts from active request input
classify/remove stale, wrong-role, duplicate, or pre-injected Goal-looking items
apply feature/collaboration eligibility gates for active Goal delivery
capture real model_visible_history_key before inserting selected Goal item,
  when Work Area 03 has implemented the key; otherwise keep None for
  non-Continuation commits
select cadence request from durable snapshot and turn metadata:
  pending BudgetLimit
  pending ObjectiveUpdated
  pending Initial
  runtime Continuation request, inactive until Work Area 03
render selected Goal text from durable state
insert exactly one developer-role Goal ResponseItem when selected
return FinalizedGoalRequestInput { input, commit, repair_report }
```

Selection rules:

- pending BudgetLimit supersedes ObjectiveUpdated and Initial for the same
  request opportunity
- pending ObjectiveUpdated supersedes Initial
- pending Initial is selected only when no higher-priority pending intent is due
- Continuation is not selected in Work Area 02
- Continuation is never persisted pending cadence intent
- active durable Goal state alone selects nothing
- historical rendered Goal items select nothing
- same-turn or idle turn metadata never guarantees delivery; the shaper
  rechecks durable facts, pending intent, eligibility, and supersedence

Cleanup rules:

- remove pure legacy `<goal_context>` items
- remove wrong-role source-tagged Goal-looking messages
- remove duplicate current developer-role Goal items
- remove stale source-tagged Goal-looking messages that do not match current
  durable Goal facts, selected kind, or final item shape
- remove pre-injected Goal-looking items from old producer/carry paths
- preserve mixed ordinary prose containing marker-like strings

Rendering rules:

- final `ResponseItem` construction belongs to `goal_cadence/`
- prompt body helpers may stay in `goals.rs`
- use current source-tagged internal-context shape, not `<goal_context>`
- required logical shape is a developer-role message containing
  `render_internal_context(source = "goal", body = rendered_goal_prompt)`
- if generic rendering helpers are not ready, add a narrow private renderer in
  `goal_cadence/prompt.rs` and move it in Work Area 05

Eligibility rules:

- feature-disabled or collaboration-ineligible attempts select no active Goal
  item and consume no pending intent
- eligibility facts are gates on delivery, not cadence authority

Commit rules:

- pending intent is not consumed by the shaper
- `GoalRequestCommit` identifies the exact finalized input and item
- `commit_point` and `committed_at_ms` are not set here

## Tests And Checks

Add focused pure tests near `core/src/goal_cadence/` for:

- BudgetLimit > ObjectiveUpdated > Initial priority
- active durable Goal without pending intent emits no item
- feature-disabled or collaboration-ineligible attempts emit no item
- wrong-role, duplicate, stale, pre-injected, and pure legacy Goal-looking items
  are cleaned
- mixed ordinary prose with marker-like text remains
- commit metadata contains item index and stable fingerprints for the finalized
  logical input

Suggested implementation validation:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_cadence
```

Run formatting if Rust files changed:

```powershell
cd codex-rs
just fmt
```

These checks are the local confidence bar for the 02b slice.

## Branch Continuation State

After this pass, the pure shaper should work in module tests but no sampling
attempt calls it yet. Pending intent remains durable and unconsumed until the
Created-event commit pass.

The next pass, 02c, wires the shaper into `run_sampling_request(...)` for every
attempt.

## Non-Goals

This pass does not:

- wire `run_sampling_request(...)`
- commit on `ResponseEvent::Created`
- consume pending intent
- append request evidence
- store committed current-turn carry
- convert core producers
- implement automatic Continuation
- perform Work Area 05 classifier/projection cleanup
