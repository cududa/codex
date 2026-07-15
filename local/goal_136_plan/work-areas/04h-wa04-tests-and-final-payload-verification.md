# WA04h Tests And Final Payload Verification

This implementation pass consolidates WA04-focused test updates after
extension and app-server producers have been converted.

Extension tests may inspect durable state, pending intent, accounting, events,
and metadata outcomes. Final active Goal authority must be proven through
captured final `/responses` input.

Final-payload test ownership must be explicit. In current v136 terrain,
app-server does not host `codex-goal-extension`, and core tests cannot import
`codex-goal-extension` without reversing the existing dependency direction. An
implementation may use an extension integration test as true extension-origin
final-payload coverage only if that test can drive a real extension producer
through a real core request path with mock Responses. Otherwise, extension
tests cover durable producer effects and app-server/core tests cover the shared
WA02 shaper from equivalent pending intent; those app-server/core tests should
be named and described as shared-shaper final-payload coverage, not end-to-end
extension-origin coverage.

## Direction Lock

Request:

- update WA04 tests after producer conversion
- prove app-server-origin cadence reaches final model input through WA02
  request-input shaping, and choose an explicit true-extension or paired
  shared-shaper route for extension-related final payload coverage
- do not implement Rust from this planning document

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

Terrain:

- `ext/goal/tests/goal_extension_backend.rs` currently covers tool product
  behavior, accounting, runtime effects, and steering-role config
- 04f owns extension-level config cleanup tests; this pass owns captured final
  payload proof that no old role config can change active Goal authority
- `app-server/tests/suite/v2/thread_resume.rs` contains
  `thread_goal_set_active_schedules_developer_role_goal_steering`, currently
  asserting `<goal_context>` text
- `core_test_support::responses` helpers can inspect captured
  `ResponsesApiRequest.input`
- final request payload tests must not be replaced by extension helper-output
  tests

Code-shape temptation:

- treat extension state/runtime tests as enough to prove model authority
- assert rendered Goal text in history, raw notifications, or rollout trace
  instead of captured final `/responses` input
- use recorded request evidence alone as a substitute for final payload
  inspection

Locked direction:

- extension crate tests cover state/runtime/product behavior
- app-server or core integration tests cover final request payloads
- true extension-origin final payload coverage requires an integration route
  that drives an extension producer into a real core request path; otherwise
  pair extension durable-effect tests with shared-shaper payload tests from
  equivalent pending intent
- final payload assertions require exactly one current Goal
  `ResponseItem::Message { role: "developer", ... }`
- no active `<goal_context>` or user-role Goal item may reach final request
  input for converted WA04 scenarios

Exclusions:

- no broad WA06 final acceptance audit
- no WA05 classifier/projection/raw-notification cleanup tests except where a
  converted WA04 path directly touches them
- no extension-owned evidence writer
- no helper-output authority tests

## Authority Docs Read

Implementation should reread:

- `local/goal_research/AGENTS.md`
- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-ext-goal-ownership.md`
- `local/goal_research/goal-authority-fake-shim-removal-map.md`
- `local/goal_research/goal-test-deletion-map.md`
- `local/goal_136_plan/work-areas/01-existing-pass-validation.md`
- `local/goal_136_plan/work-areas/02-direct-split-readiness-check.md`
- `local/goal_136_plan/work-areas/03-history-key-and-idle-continuation-appendage-map.md`
- `local/goal_136_plan/work-areas/04-ext-goal-conversion.md`
- `local/goal_136_plan/work-areas/04-ext-goal-reachability-and-ordering-map.md`

## Code Terrain Read

Read around:

- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
  - create, duplicate create, update complete/blocked, BudgetLimit,
    UsageLimited, runtime external mutation, resume accounting, config tests
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
  - app-server Goal product tests
  - `thread_goal_set_active_schedules_developer_role_goal_steering`
- `codex-rs/core/tests/common/responses.rs`
  - `ResponseMock::single_request()`
  - `ResponseMock::requests()`
  - `ResponsesRequest::input()`
  - `ResponsesRequest::message_input_texts(...)`
  - `ResponsesRequest::message_input_text_groups(...)`
- `codex-rs/core/tests/suite/goal_authority.rs` or the WA02-selected core
  request-payload test home, if present
- `codex-rs/core/src/config/mod.rs` and `codex-rs/core/src/config/config_tests.rs`
  only if the final-payload scenario keeps an old user-role config value
  parseable until WA06 cleanup

## Pass Goal

Finish WA04's test profile:

```text
extension tests prove producer state/runtime outcomes
app-server/core tests prove final `/responses` payload authority
stale fake-shim tests are removed or rewritten
```

## Exact Files To Edit

- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/core/tests/suite/goal_authority.rs` if this is the WA02-selected
  final payload home
- `codex-rs/core/tests/common/responses.rs` only for small structured request
  helpers
- `codex-rs/ext/goal/tests/...` only if an extension integration test can
  drive a real extension producer through a real core request path with mock
  Responses

## Required Edits

1. Update extension tests for `create_goal`:
   - active facts plus pending Initial intent
   - duplicate create writes no new intent
   - preview fill remains
   - accounting baseline remains
2. Update extension tests for terminal `update_goal`:
   - complete/blocked status behavior remains
   - final usage reporting remains
   - no active cadence intent is created
3. Update extension tests for ObjectiveUpdated runtime effects:
   - pending ObjectiveUpdated intent exists after objective mutation
   - failed same-turn metadata delivery leaves intent pending
   - no concrete steering injection is attempted
4. Update extension tests for BudgetLimit:
   - usage/status facts plus pending BudgetLimit intent
   - producer-side reported flag does not consume intent
   - failed same-turn metadata delivery leaves intent pending
5. Update extension config tests:
   - enablement remains testable
   - extension-level role config is removed or ignored by converted producers
   - captured final payload proof for old user-role config lives in the
     app-server/core scenarios below
6. Update app-server payload scenario:
   - keep `thread_goal_set_active_schedules_developer_role_goal_steering`
   - replace `<goal_context>` assertions with final `/responses` assertions
   - require exactly one current outer developer-role Goal item
   - require no active `<goal_context>` item
   - require no user-role active Goal item
7. Add app-server/core final payload scenarios as needed:
   - app-server objective update delivers ObjectiveUpdated from persisted
     objective
   - extension BudgetLimit delivers through request shaping only when the
     chosen test route drives a real extension producer through a real core
     request path; otherwise test equivalent pending BudgetLimit intent through
     the shared WA02 shaper and keep extension BudgetLimit coverage in
     extension state/runtime tests
   - unavailable same-turn delivery keeps pending intent for WA03 idle Stage 2
   - old user-role config value, if still parseable, does not affect final
     payload: captured `/responses` input still contains exactly one current
     outer developer-role Goal item and no user-role active Goal item
8. If recorded request evidence is in scope for a scenario, assert structured
   Created-event metadata paired to captured final input by fingerprint. Do not
   use evidence by itself as the active authority check.

## Tests And Checks

Focused implementation validation should be chosen by actual changed files.
Likely commands:

```powershell
cd codex-rs
cargo test -p codex-goal-extension --test goal_extension_backend
```

If local cost requires a narrower extension filter, list the touched existing
tests and new tests explicitly. Do not rely on a `goal_extension_` prefix,
because many preserved product/accounting tests in
`goal_extension_backend.rs` do not use that prefix.

```powershell
cd codex-rs
cargo test -p codex-app-server --test suite thread_goal_set_active_schedules_developer_role_goal_steering
```

If final payload tests land in core:

```powershell
cd codex-rs
cargo test -p codex-core --test suite goal_extension
cargo test -p codex-core --test suite goal_authority
```

Do not run broad workspace or full crate suites by default on this Windows
ARM64 workstation.

## Branch Continuation State

After this pass:

- WA04 producer conversion has corresponding state/runtime tests
- app-server/core final payload tests prove app-server producers and shared
  WA02 shaper behavior reach the model through final request input
- extension-origin final payload is covered only by an explicit real extension
  producer-to-core-request integration route; otherwise extension producer
  effects and shared-shaper final payload behavior are covered as paired tests
- extension helper output is not used as model authority
- remaining broad cleanup and final audit belong to WA05/WA06

## Non-Goals

- do not make WA04 the final rewrite acceptance gate
- do not add broad projection/raw/compaction tests outside WA04 producer
  scope
- do not accept ordinary rollout items, rollout trace payloads, raw
  notifications, classifier matches, or rendered Goal text as substitutes for
  captured final request input
- do not require `ext/goal/src/api.rs`
