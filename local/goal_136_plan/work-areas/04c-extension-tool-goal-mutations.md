# WA04c Extension Tool Goal Mutations

This implementation pass converts extension-owned Goal tool mutations to the
WA01 durable cadence state model while preserving tool product behavior.

The main conversion is `create_goal`: successful create writes active durable
Goal facts plus pending Initial intent. Terminal `update_goal` remains a
product status mutation and does not create active cadence intent; when it
moves the Goal out of active delivery, it clears or supersedes any active-state
pending intent that can no longer be delivered.

This pass preserves extension-owned tools while removing any temptation to make
tool code an active model-input authority. Tool output, metrics, events, and
accounting are product/runtime effects. The WA02 final request-input shaper is
the next delivery authority.

## Direction Lock

Request:

- convert extension `create_goal` to atomic active facts plus pending Initial
  intent
- preserve terminal `update_goal` behavior and final usage reporting
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `GoalToolExecutor::handle_create(...)` currently validates input and calls
  `insert_thread_goal(...)`
- create fills empty thread preview, marks current-turn accounting active,
  records metrics, emits Goal update event, and returns structured tool output
- `GoalToolExecutor::handle_update(...)` only permits complete/blocked,
  accounts final progress, updates status, clears current-turn accounting, and
  reports completion usage
- neither tool path needs to construct active model input

Code-shape temptation:

- delete `create_goal` because active steering moves out of the extension
- add direct steering construction after create to compensate for the missing
  pending Initial
- make terminal `update_goal` create a cadence item because it mutates Goal
  state

Locked direction:

- preserve `create_goal` as extension-owned mutation
- successful create uses a WA01 cadence-aware insert operation
- tool-origin create creates an active Goal only; every successful create
  writes pending Initial intent for the new `goal_id` and facts version
- duplicate create remains a product error and writes no new intent
- normal tool output follow-up or WA04a metadata recheck gives WA02 the next
  chance to deliver pending Initial
- terminal `update_goal` remains terminal product behavior and creates no
  Initial, ObjectiveUpdated, or BudgetLimit intent
- terminal `update_goal` uses a WA01 status operation that clears or supersedes
  stale active-state pending intent for the Goal it completes or blocks

Exclusions:

- no active `ResponseItem` or `ResponseInputItem` construction
- no role selection
- no pending-intent consumption
- no Continuation watermark changes
- no recorded request evidence writer
- no app-server mutation changes

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-cadence-contract.md`
- `local/goal_research/goal-durable-state-and-pending-intent.md`
- `local/goal_research/goal-extension-lifecycle-and-reachability.md`
- `local/goal_research/goal-request-repair-and-artifact-classification.md`
- `local/goal_research/goal-test-prep-and-replacement-proof.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/src/tool.rs`
  - `GoalToolExecutor::handle_create(...)`
  - `GoalToolExecutor::handle_update(...)`
  - `fill_empty_thread_preview_if_possible(...)`
  - `emit_goal_updated_from_tool_call(...)`
- `codex-rs/ext/goal/src/runtime.rs`
  - accounting state access used by tools
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - `installed_goal_tools_create_goal_and_fill_empty_preview`
  - `installed_goal_tools_reject_duplicate_goal_creation`
  - `create_goal_resets_baseline_before_turn_stop_accounting`
  - `update_goal_can_block_and_accounts_final_progress`
- WA01 state APIs in `codex-rs/state/src/runtime/goals.rs`

## Pass Goal

Convert tool-origin create from:

```text
insert_thread_goal(...)
  -> mark accounting active
  -> tool output only
```

to:

```text
insert_thread_goal_with_initial_intent(...)
  -> mark accounting active
  -> tool output
  -> pending Initial remains until WA02 final request-input commit
```

The logical `create_goal` order is:

```text
parse and validate tool request
persist active Goal facts plus pending Initial intent atomically
fill preview if empty
mark current-turn accounting active
emit metrics and ThreadGoalUpdated event
return structured tool output and remaining-token data
let normal tool follow-up or metadata recheck reach WA02 shaper
```

The normal tool follow-up is not delivery by itself. It merely gives the shared
request-input shaper an opportunity to read fresh durable facts and select the
pending Initial item.

## Exact Files To Edit

- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- WA01 state API callsites only if compile fallout requires small signature
  adjustments

## Required Edits

1. Replace `GoalStore::insert_thread_goal(...)` in
   `handle_create(...)` with the WA01 cadence-aware create/insert API.
2. Require the returned state outcome to include the current durable Goal facts
   and pending Initial intent summary for the same facts version. A successful
   tool-origin create always writes pending Initial for the newly active Goal.
3. Preserve objective trimming, objective validation, budget validation, and
   duplicate-create error behavior.
   Duplicate create must not allocate a new facts version or write any new
   pending intent.
4. Preserve empty preview fill.
5. Preserve current-turn accounting baseline reset through
   `GoalAccountingState`.
6. Preserve created metric, `ThreadGoalUpdated` event, structured tool output,
   and remaining-token calculation.
7. Do not request cadence delivery by constructing model input. If a wake is
   needed beyond normal tool follow-up, use the WA04a metadata adapter only.
8. Keep `handle_update(...)` complete/blocked-only. Use a WA01 status API that
   allocates facts version when facts change and clears or supersedes stale
   active-state pending intent that can no longer be delivered.
9. Do not create active cadence intent for complete/blocked terminal updates.
10. Keep completion budget report behavior for `Complete`.
11. Do not consume pending Initial, ObjectiveUpdated, or BudgetLimit intent from
    tool code. Exact pending-intent consumption belongs to the Created-event
    commit path after final request input contains the selected developer-role
    Goal item.
12. Do not write recorded request evidence. If evidence is in scope, it belongs
    to the WA02 Created-event commit path and must be paired to captured final
    input by fingerprint.

## Tests And Checks

Update extension tests:

- `installed_goal_tools_create_goal_and_fill_empty_preview`
  - keep tool response and preview assertions
  - assert pending Initial intent exists in the state cadence snapshot
- `installed_goal_tools_reject_duplicate_goal_creation`
  - assert duplicate create writes no new pending intent
- `create_goal_resets_baseline_before_turn_stop_accounting`
  - keep accounting baseline behavior
- `update_goal_can_block_and_accounts_final_progress`
  - keep terminal status and usage assertions
  - assert terminal update creates no active cadence intent
  - assert stale active-state pending intent for that Goal is cleared or
    superseded when the terminal update makes it undeliverable

Add or rename focused tests:

- `goal_extension_create_active_goal_writes_initial_intent`
- `goal_extension_duplicate_create_writes_no_new_intent`
- `goal_extension_update_goal_terminal_status_does_not_create_active_intent`
- `goal_extension_update_goal_terminal_status_clears_stale_active_intent`

Extension tests may inspect state, tool output, events, metrics, and pending
intent. They do not prove final model authority; final payload coverage stays
in 04h or core/app-server tests. They also do not write or validate recorded
request evidence, and they must not treat helper output, tool output, rollout
items, raw notifications, classifier matches, or rendered Goal text as delivery
proof.

## Branch Continuation State

After this pass:

- extension `create_goal` produces durable pending Initial intent
- duplicate `create_goal` remains a product error and does not create or alter
  pending intent
- extension terminal `update_goal` preserves product behavior without active
  cadence intent
- extension terminal `update_goal` clears or supersedes stale active-state
  pending intent for terminal Goals
- extension ObjectiveUpdated and BudgetLimit paths may still use old runtime
  injection until 04d/04e
- `ext/goal/src/steering.rs` may still exist until 04g

This is not standalone acceptance.

## Non-Goals

- do not convert app-server `thread/goal/set`
- do not convert `GoalRuntimeHandle::apply_external_goal_set(...)`
- do not convert post-tool BudgetLimit
- do not remove steering-role config
- do not construct model input from extension tool code
- do not consume pending Initial in this pass
