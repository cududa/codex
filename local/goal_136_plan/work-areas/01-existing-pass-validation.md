# Work Area 01 Existing Pass Validation

This pre-pass validates the existing Work Area 01 pass docs before they are
used for implementation:

- `01a-durable-facts-version-plumbing.md`
- `01b-pending-cadence-intent-storage.md`
- `01c-cadence-aware-store-operations.md`

## Direction Lock

Request:

- validate the existing WA01 pass docs against current Goal authority docs,
  recorded-evidence boundaries, and v136-to-v139/v140 migration posture
- ground the validation in the real state code and upstream terrain
- do not implement Rust code

Authority:

- `local/goal_research/goal-authority-grounding-truth.md`
- `local/goal_research/goal-authority-primary-cadence-contract.md`
- `local/goal_research/goal-authority-durable-cadence-state.md`
- `local/goal_research/goal-authority-final-request-input-and-commit.md`
- `local/goal_research/goal-authority-model-visible-history-key.md`
- `local/goal_research/goal-authority-recorded-request-evidence.md`
- `local/goal_136_plan/AGENTS.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/implementation-prepass-planning-rules.md`

Terrain:

- local `codex-rs/state` Goal terrain is still facts-only:
  - `codex-rs/state/goals_migrations/0001_thread_goals.sql`
  - `codex-rs/state/src/model/thread_goal.rs`
  - `codex-rs/state/src/runtime/goals.rs`
- local callers in core, app-server, and `ext/goal` call facts-only
  `GoalStore` methods today
- `rust-v0.136.0` has the same facts-only state shape
- `rust-v0.139.0` and `rust-v0.140.0` keep the state store facts-only while
  moving more Goal orchestration toward `ext/goal` API/service terrain
- `rust-v0.140.0` typed replay is useful evidence-carrier precedent, not a
  WA01 state-store responsibility

Code-shape temptation:

- use current facts-only `GoalStore` methods as if they were the cadence API
- use `updated_at_ms` as the cadence facts identity
- pull recorded request evidence, request fingerprints, or `GoalService`
  ordering into WA01 because later Work Areas need them
- switch production callers to cadence-aware APIs before the final
  request-input shaper and Created-event commit path exist

Locked direction:

- WA01 remains durable-state-only
- `GoalStore` exposes durable facts, facts versions, pending intent storage,
  exact-key consumption, mechanical cleanup, and transaction outcomes
- `GoalStore` does not select cadence, render prompts, construct model input,
  write recorded request evidence, or own extension/app-server ordering
- the existing 01a/01b/01c pass split is passable for implementation after
  this validation note, with the constraints below

Exclusions:

- no Rust implementation
- no authority-doc edits
- no request-input shaping or Created-event commit work
- no producer conversion in core, app-server, or `ext/goal`
- no `GoalRequestEvidence` carrier or replay integration
- no automatic Continuation persisted pending intent

## Code Findings

Local state terrain:

- `thread_goals` currently stores one row per thread with `goal_id`,
  objective, status, budget, usage, and timestamps. It has no
  `facts_version`, no pending-intent table, and no Continuation watermark
  table.
- `ThreadGoal` and `ThreadGoalRow` do not carry a durable facts identity.
- `GoalStore` uses explicit `SELECT` / `RETURNING` column lists, so adding
  `facts_version` requires touching every row materialization path.
- Current write surfaces are:
  - `replace_thread_goal`
  - `insert_thread_goal`
  - `update_thread_goal`
  - `pause_active_thread_goal`
  - `usage_limit_active_thread_goal`
  - `delete_thread_goal`
  - `account_thread_goal_usage`
- Existing state tests live in `codex-rs/state/src/runtime/goals.rs`; the
  same file is the right home for `goal_facts_version`,
  `goal_pending_intent`, and `goal_cadence` focused tests.
- The goals DB migrator is `sqlx::migrate!("./goals_migrations")`, and
  `codex-rs/state/BUILD.bazel` already includes `goals_migrations/**`.
- Other state runtime modules already use SQL transactions through
  `self.pool.begin()` and `self.pool.begin_with("BEGIN IMMEDIATE")`, so WA01
  does not need a new storage abstraction to express atomic facts-plus-intent
  mutations.

Local caller terrain:

- `codex-rs/core/src/goals.rs`,
  `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`,
  `codex-rs/ext/goal/src/tool.rs`, and
  `codex-rs/ext/goal/src/runtime.rs` call existing facts-only store methods.
- Those callers also sit near old active steering/runtime behavior. Switching
  them inside WA01 would create pending cadence intent before WA02 can consume
  it at final request input.

Upstream terrain:

- `rust-v0.136.0` matches the local state shape: no `facts_version`, no
  pending-intent table, and no `GoalService` state facade.
- `rust-v0.139.0` and `rust-v0.140.0` still do not provide facts versioning or
  pending cadence intent in `codex-state`.
- `rust-v0.139.0` / `rust-v0.140.0` add `ext/goal/src/api.rs` and
  `GoalService`, but that service continues to call facts-only state methods.
  This is migration pressure for WA04 ordering, not a reason to move cadence
  policy or service ownership into `GoalStore`.
- `rust-v0.140.0` `RolloutItem::InterAgentCommunication` is typed replay
  precedent for later recorded evidence. It does not change WA01: pending
  intent remains durable state, while recorded request evidence remains later
  Created-event metadata.

## Validation Answers

### Does WA01 keep `GoalStore` durable-only?

Yes.

The parent Work Area and 01a/01b/01c consistently keep `GoalStore` limited to
durable facts, facts versioning, pending intent storage, exact-key cleanup,
mechanical stale-intent cleanup, and transaction outcomes.

The pass docs explicitly exclude:

- request cadence selection
- prompt rendering
- model-role choice
- `ResponseItem` / `ResponseInputItem` construction
- request repair
- recorded request evidence
- extension/app-server producer conversion

That split matches `goal-authority-durable-cadence-state.md`.

### Do facts version and pending-intent storage match authority?

Yes, with one implementation constraint.

The pass docs correctly replace `updated_at_ms` with a dedicated
`facts_version` and use it in pending intent keys. Pending intent is structured
state with:

```text
thread_id
goal_id
kind: Initial | ObjectiveUpdated | BudgetLimit
facts_version
created_at_ms
```

Implementation constraint:

- `facts_version` must be monotonically allocated by state for steering-
  relevant durable fact writes. It must not be derived from wall-clock
  timestamps or `updated_at_ms`.

### Are facts-plus-intent mutations atomic?

Yes in 01c.

The split correctly delays pending-intent-producing APIs until 01c and requires
one SQL transaction for:

- Goal create/replace plus pending Initial
- objective update plus pending ObjectiveUpdated
- budget-limit transition plus pending BudgetLimit
- stale/superseded intent cleanup where required
- returned snapshot/outcome using the same facts version as the write

Implementation constraint:

- any public cadence-aware mutation added in 01c must perform the facts write,
  pending intent write/cleanup, and returned cadence snapshot/outcome inside
  one transaction. A facts write followed by a separate intent insert outside
  the transaction would violate the authority docs.

### Is exact-key consumption sufficiently keyed?

Yes.

01b and 01c require deletion by:

```text
thread_id + goal_id + kind + facts_version
```

That is the compare-and-delete shape required by the current authority docs.
State must return success only when the exact row was deleted.

### Do the pass docs accidentally require independent PR/build acceptance?

No.

The WA01 parent and branch-continuation sections say the passes are ordered
units on the same rewrite branch, not standalone release or acceptance
contracts.

Implementation constraint:

- because these are not independent release units, 01a may create the shared
  `0002_goal_cadence_state.sql` and 01b may complete its pending-intent DDL
  before the rewrite lands. Once a migration has landed or been applied as a
  released artifact, do not rewrite it; add a later migration instead.

### Is recorded request evidence kept within its metadata-only boundary?

Yes.

The WA01 docs correctly keep `GoalRequestEvidence`, item fingerprints,
request-input fingerprints, replay pairing, rollout trace policy, and raw
notification behavior out of `GoalStore`.

Recorded evidence appears only as an exclusion or later-work boundary. That
matches the authority split:

- WA01 owns durable pending intent before delivery
- WA02/WA03 commit paths own Created-event commit metadata and evidence
  integration where in scope

### Is the v136-to-v139/v140 migration posture preserved?

Yes.

WA01 keeps the state additions in `codex-state`, where v136 already stores
Goal facts and where v139/v140 services still read/write facts. It does not
force v136 to adopt `GoalService`, and it does not make `GoalStore` a cadence
policy object.

This supports the later migration bridge:

- WA01 state APIs can be called by v136 core/app-server/extension adapter
  paths after producer conversion
- v139/v140 `GoalService`-style routing can later call the same durable
  operations without moving active model-input authority into the service

## Pass-By-Pass Result

### 01a Durable Facts Version Plumbing

Passable.

Implementation focus should stay on:

- adding `facts_version`
- updating row models and explicit SQL projections
- maintaining facts version in existing facts-only writes
- updating existing state tests plus focused `goal_facts_version` tests

Do not add pending-intent producer behavior, evidence fields, or caller
conversion in 01a.

### 01b Pending Cadence Intent Storage

Passable.

Implementation focus should stay on:

- pending-intent enum/model/snapshot types
- exact-key consumption
- mechanical cleanup helpers
- snapshot reads
- focused `goal_pending_intent` tests

Do not let `GoalStore` select which pending intent is due for a request.

### 01c Cadence-Aware Store Operations

Passable.

Implementation focus should stay on:

- transaction-shaped facts-plus-intent APIs
- accounting outcome that distinguishes unchanged facts, updated facts without
  BudgetLimit intent, and updated facts with BudgetLimit intent
- BudgetLimit transition detection inside the transaction
- focused `goal_cadence` tests

Do not switch production callers in 01c except for compile fallout from public
type changes. Producer conversion belongs to later Work Areas after final
request-input shaping and Created-event commit exist.

## Required Implementation Carry-Forward

When WA01 is implemented, carry these constraints into the pass docs and code
review:

- `GoalStore` remains durable-only.
- `facts_version` is monotonic state data, not `updated_at_ms`.
- pending Initial, ObjectiveUpdated, and BudgetLimit intent is durable
  structured state.
- automatic Continuation is not pending intent.
- cadence-aware mutations are atomic.
- pending intent consumption is exact-key compare-and-delete.
- facts-only production methods do not create new pending intent.
- recorded request evidence is not stored in pending intent rows or returned
  as a state correctness source.
- v139/v140 `GoalService` is migration terrain for WA04, not WA01 authority.

## Proceed Criteria

WA01 can proceed to implementation pass execution or pass-doc refinement using
the existing 01a/01b/01c split.

No appendage map is required for WA01. If implementation discovers that
production callers must switch to cadence-aware APIs before WA02 commit exists,
stop and move that work to the later producer conversion pass instead of
expanding WA01.

## Validation

Docs-only validation for this pre-pass:

```powershell
git diff --check -- local\goal_research local\goal_136_plan
```

Implementation validation remains the focused `codex-state` commands named by
01a/01b/01c. Do not run broad Rust suites for this planning-only pre-pass.
