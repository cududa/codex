# Work Area 02f: Final Payload Tests And Target State

This ordered pass is the integrated Work Area 02 proof pass. It adds focused
final `/responses` payload tests, retry/follow-up tests, cleanup tests, and
commit/evidence tests for the Work Area 02 target state.

## Direction Lock

Request:

- prove Work Area 02 final request-input shaping and Created-event commit
  behavior through captured request payloads
- update or remove old tests that preserve active `<goal_context>` or concrete
  Goal item injection behavior
- keep validation focused; do not turn this into broad workspace acceptance

Authority:

- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_research/goal-authority-repair-classifier-integration.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/02-final-request-input-shaping-and-commit.md`
- `local/goal_136_plan/work-areas/02a-goal-cadence-module-and-shaper-primitives.md`
- `local/goal_136_plan/work-areas/02b-final-request-input-shaper.md`
- `local/goal_136_plan/work-areas/02c-per-attempt-request-loop-wiring.md`
- `local/goal_136_plan/work-areas/02d-created-event-commit-and-evidence.md`
- `local/goal_136_plan/work-areas/02e-core-producer-conversion-and-carry-cleanup.md`

Terrain:

- `codex-rs/core/tests/common/responses.rs` exposes final request capture
  helpers.
- `ResponseMock::single_request().input()` and `ResponseMock::requests()` can
  assert captured `/responses` input.
- `ResponsesRequest::message_input_texts("developer")` and
  `message_input_text_groups("developer")` can inspect role-specific text.
- Work Area 00 should already have deleted or reset tests that assert the old
  active Goal path.

Code-shape temptation:

- prove helper output instead of final `ResponsesApiRequest.input`
- accept raw notifications, rollout trace payloads, ordinary rollout items, or
  classifier matches as proof
- preserve old active `<goal_context>` tests because they still pass locally
- run broad suites to compensate for missing focused assertions

Locked direction:

- final authority tests inspect captured `/responses` input, exact role, count,
  retry timing, follow-up reshaping, cleanup, and Created-event commit behavior
- old tests preserving active concrete Goal item injection are removed or
  rewritten
- broader route acceptance remains for later Work Areas

Exclusions:

- no automatic Continuation acceptance
- no `ext/goal` conversion acceptance
- no broad compaction/projection/raw cleanup acceptance
- no workspace-wide validation by default

## Code Terrain Read

Directly read:

- `codex-rs/core/tests/common/responses.rs`
- request-capture examples in `codex-rs/core/tests/suite/client.rs`
- `codex-rs/core/tests/suite/goal_authority.rs`, if it already exists
- `codex-rs/core/src/session/tests.rs`, if lower-level session tests are used
- old local tests that assert active `<goal_context>`, `GoalContextRole`,
  user-role active Goal steering, or concrete current-turn Goal carry

Observed facts:

- request capture helpers already support final `/responses` payload
  assertions.
- final authority tests must inspect `ResponsesApiRequest.input`, not helper
  output.
- ordinary rollout content and raw notifications are not structured request
  evidence.

## Pass Goal

Prove the integrated Work Area 02 target state with focused tests that inspect
final request input and Created-event commit effects.

## Exact Files To Edit

- `codex-rs/core/tests/suite/goal_authority.rs`
- `codex-rs/core/src/session/tests.rs` only for lower-level session behavior
- old tests that assert deleted active Goal behavior
- implementation files only for fixes discovered by the focused tests

## Required Tests

Prefer integration-style request payload tests under `core/tests/suite` when
the behavior needs to prove `ResponsesApiRequest.input`.

Use:

- `ResponseMock::single_request().input()`
- `ResponseMock::requests()`
- `ResponsesRequest::message_input_texts("developer")`
- `ResponsesRequest::message_input_text_groups("developer")`

Required tests:

- `goal_authority_initial_reaches_final_request_as_single_developer_item`
  - create active Goal through the core path
  - first `/responses` request contains exactly one current Goal `ResponseItem`
    with outer `role: "developer"`
  - no `<goal_context>` item reaches the request
  - pending Initial intent is consumed only after `ResponseEvent::Created`
- `goal_authority_objective_updated_renders_from_persisted_state`
  - update objective
  - captured request uses persisted objective, not request-body archaeology
  - pending ObjectiveUpdated intent is consumed by exact key after Created
- `goal_authority_budget_limit_renders_from_persisted_usage_state`
  - budget crossing writes durable status/usage first
  - captured request renders BudgetLimit from durable facts
  - stale Initial or ObjectiveUpdated intent for the same Goal is cleared after
    committed BudgetLimit
- `goal_authority_retry_before_created_keeps_pending_intent`
  - first stream attempt fails before Created
  - retry request still contains the selected developer-role Goal item
  - pending intent is not consumed until a later Created event
- `goal_authority_retry_after_created_does_not_duplicate_pending_item`
  - stream emits Created and then fails retryably
  - pending intent is consumed
  - retry rebuilds from committed state/history and does not emit a second
    pending Initial/ObjectiveUpdated/BudgetLimit item
- `goal_authority_follow_up_reruns_request_shaper_from_rebuilt_history`
  - tool call response causes a follow-up sampling request
  - follow-up shaping runs from rebuilt history
  - stale/pre-injected Goal-looking items are not trusted as authority
- `goal_authority_removes_wrong_role_duplicate_and_legacy_goal_items`
  - seed a pure wrong-role source-tagged Goal-looking message, duplicate
    developer-role Goal item, and pure legacy `<goal_context>`
  - final request input contains only the selected current developer-role item
    when cadence is due
  - mixed ordinary prose containing marker-like text remains
- `goal_authority_active_goal_without_pending_intent_does_not_emit`
  - active durable Goal exists
  - no pending Initial/ObjectiveUpdated/BudgetLimit intent
  - no automatic Continuation request
  - ordinary user turn does not receive a fresh Goal item
- `goal_authority_created_commit_records_committed_carry_metadata`
  - after Created, current-turn carry stores committed metadata
  - carry does not expose or store pre-request-shaping `ResponseInputItem`
- `goal_authority_created_commit_records_structured_request_evidence`
  - evidence is written only after Created
  - evidence contains attempt ordinal, item index, item fingerprint, and full
    request-input fingerprint
  - evidence is not emitted as a raw response item
- `goal_authority_failed_pre_created_attempt_records_no_evidence`
  - stream setup or stream failure before Created writes no evidence
  - ordinary rollout `ResponseItem`s and rollout trace payloads are not
    accepted as substitute evidence
- `goal_authority_retry_records_evidence_only_for_committed_attempt`
  - failed pre-Created attempt and later committed attempt have distinct attempt
    ordinals
  - only the Created attempt has structured evidence

Update existing local tests that assert:

- active `<goal_context>` emission
- `GoalContextRole` active behavior
- user-role active Goal steering
- current-turn carry of concrete Goal `ResponseInputItem`s

Those tests should have been deleted or reset by Work Area 00. If any remain,
remove or rewrite them rather than preserving the old path.

## Verification

Implementation validation for Work Area 02:

```powershell
cd codex-rs
just fmt
```

Focused tests:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_authority
```

If tests are added to `session/tests.rs` instead of the integration suite:

```powershell
cd codex-rs
cargo test -p codex-core --lib goal_authority
```

Optional focused client/request checks:

```powershell
cd codex-rs
cargo test -p codex-core --test suite retry_before_created
```

Do not run broad workspace suites by default on this workstation.

## Target State

After this pass:

- `core/src/goal_cadence/` owns final request-input shaping and commit metadata
- `run_sampling_request(...)` invokes shaping for every attempt inside its
  retry loop before `build_prompt(...)`
- `try_run_sampling_request(...)` commits selected Goal delivery on
  `ResponseEvent::Created`
- final request input contains exactly one selected current developer-role Goal
  item when pending Initial, ObjectiveUpdated, or BudgetLimit intent is due
- active durable Goal state alone emits no Goal steering
- constructing or injecting a `ResponseInputItem` is not a commit path
- pending Initial, ObjectiveUpdated, and BudgetLimit intent is consumed by exact
  key only after Created
- retry before Created leaves pending intent intact
- retry after Created does not duplicate pending intent delivery
- current-turn carry stores committed metadata, not pre-request-shaping model
  input
- `GoalRequestCommit` includes exact item index, item fingerprint, and full
  request-input fingerprint
- structured request evidence, when implemented, is written only from the
  Created-event commit handler and is not replaced by ordinary rollout items,
  rollout trace payloads, raw notifications, classifier matches, or rendered
  text
- durable state remains live correctness owner unless a pass explicitly chooses
  a non-best-effort evidence-backed path
- core Initial, ObjectiveUpdated, and BudgetLimit producers no longer depend on
  active `GoalContext` construction or concrete Goal `ResponseInputItem`
  injection
- request payload tests inspect captured `ResponsesApiRequest.input`

## Branch Continuation State

After Work Area 02, the branch may still be in an ordered rewrite state:

- automatic idle Continuation selection and real model-visible history key
  projection remain Work Area 03
- `ext/goal` conversion remains Work Area 04
- generic classifier/projection/raw-response cleanup remains Work Area 05
- final deletion of old `GoalContext` helpers and dead carry terrain remains
  Work Area 06

Do not present active Goal authority as fully rewritten while reachable
producers still use the old path.

## Non-Goals

This pass does not:

- implement automatic idle Continuation selection
- define the full `model_visible_history_key` projection for Continuation
  suppression
- advance Continuation watermarking
- convert `ext/goal`
- complete generic classifier/projection/raw-response cleanup
- finish compaction and rollout reconstruction rewrite
- delete every old `GoalContext` helper or legacy artifact predicate
- change app-server APIs, `/goal`, status/footer projection, pause/edit/clear,
  budget, or usage
