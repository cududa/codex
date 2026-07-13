# Goal Authority Implementation Execution Spine

This file is the v136 Goal rewrite control spine.

It is not authority and it is not enough to implement from by itself. The
authority lives in `local/goal_research`. The batch docs under
`local/goal_136_plan/batches/` will carry file-specific implementation work
after they are written and approved.

## Read First

Before writing or executing any batch, read these directly:

1. `local/goal_research/AGENTS.md`
2. `local/goal_research/goal-authority-grounding-truth.md`
3. `local/goal_research/goal-authority-primary-cadence-contract.md`
4. `local/goal_research/goal-authority-idle-continuation-contract.md`
5. `local/goal_research/goal-authority-fake-shim-removal-map.md`
6. `local/goal_research/goal-test-deletion-map.md`
7. `local/goal_research/goal-authority-open-design-deliverables.md`
8. all five Ready deliverables named by that checklist

Then do a bounded code walk for the batch being planned or executed. Existing
Rust code is terrain, not mission.

## Architecture Lock

Keep these decisions fixed unless a later authority update explicitly changes
them:

- active Goal authority is established only by final model request input
  containing exactly one selected current developer-role Goal `ResponseItem`
- in current code, final model request input means the logical
  `Vec<ResponseItem>` that becomes `Prompt.input` and then
  `ResponsesApiRequest.input`
- generic internal context may render and classify Goal text, but it is not an
  authority mechanism
- active Goal steering must not use `GoalContext`, `GoalContextRole`, active
  `<goal_context>`, user-role steering, or pre-finalizer concrete Goal item
  injection
- Initial, ObjectiveUpdated, and BudgetLimit use durable pending cadence intent
  until the matching developer-role Goal item reaches final request input and
  the commit point is reached
- automatic Continuation is idle-derived and duplicate-suppressed by
  `{ goal_id, model_visible_history_key, durable_facts_version }`
- request repair is a seam backstop, not cadence
- classifiers are strict cleanup/projection tools; they do not decide cadence,
  consume intent, prove authority, or recover active Goal state
- raw response item notifications remain raw unless the general raw-response
  contract is explicitly changed
- budget, usage, app-server Goal APIs, `/goal`, status/footer projection, and
  pause/edit/clear are upstream Goal product obligations unless a separate
  product change replaces them

## Ownership Guardrails

The v136 tree still has core Goal producer/runtime terrain. Treat that terrain
as implementation input, not the long-term ownership target.

Keep these rules visible during every batch:

- `codex-rs/core/src/goals.rs` edits are transitional adapter or producer
  conversion work only. Do not expand it into a new long-lived Goal service,
  runtime, or orchestration module.
- shared Goal mutation/accounting ordering belongs behind the Batch 04
  `ext/goal` `GoalService`-style boundary when such a boundary is introduced;
  do not create a parallel core `GoalService`.
- cadence-aware state operations and service outcomes should carry durable
  facts, previous facts, pending intent metadata, accounting effects, or typed
  delivery requests, not prebuilt active Goal model input.
- same-turn delivery uses metadata/wake/recheck requests. It must not inject a
  rendered Goal prompt, `ResponseItem`, or `ResponseInputItem` before final
  request-input shaping.
- final active Goal model input is constructed only at the Batch 02 final
  request-input shaping path in core request assembly, because that path sees
  the actual per-attempt `Vec<ResponseItem>` that becomes `Prompt.input`.
- `ext/goal` may own lifecycle, tools, accounting, metrics, mutation entry
  points, prompt-body helpers, and typed cadence data. It must not choose the
  active steering role, construct active model input, consume pending intent,
  advance Continuation watermarks, or commit delivery.

## Architecture File Ownership

Use this file split when writing or executing batches. If a batch says to edit
a file, the edit must still fit that file's ownership role here.

| File or module | Ownership role | Must not own |
| --- | --- | --- |
| `codex-rs/state/src/runtime/goals.rs` | Durable Goal facts, facts version, pending Initial/ObjectiveUpdated/BudgetLimit intent, exact-key intent consumption, and Continuation watermark storage APIs. | Cadence selection for a request, model roles, prompt rendering, `ResponseItem` / `ResponseInputItem` construction, request repair, or idle scheduling. |
| `codex-rs/core/src/goal_cadence.rs` | The core finalizer module. It owns per-attempt final request-input shaping, cleanup of active Goal artifacts, cadence selection from durable snapshots and request metadata, current Goal prompt-body-to-developer-item construction, model-visible history key projection, and commit metadata. | Tool/app-server lifecycle mutation ordering, durable SQL ownership, extension service ownership, or background idle scheduling. |
| `codex-rs/core/src/session/turn.rs` | Sampling orchestration. It calls the finalizer for every attempt after the attempt's base `Vec<ResponseItem>` is known and before `build_prompt(...)`; it commits selected Goal delivery on `ResponseEvent::Created`. | Goal cadence policy, prompt-body rendering, state mutation semantics, or extension ownership. |
| `codex-rs/core/src/goals.rs` | v136 legacy terrain plus transitional adapter work: runtime event adapter, tool/lifecycle adapter, accounting hook adapter, and prompt-body helpers when useful. | Long-lived Goal service/runtime/orchestration ownership, final request-input authority, role selection, or concrete active model-input injection after the producer is converted. |
| `codex-rs/core/src/session/input_queue.rs` and `codex-rs/core/src/state/turn.rs` | Pending non-Goal work queues, active-turn metadata, same-turn cadence delivery requests, and committed carry metadata for finalized Goal delivery. | Prebuilt Goal model input as authority, rendered Goal prompt carry, pending-intent consumption, Continuation watermark advancement, or model-role selection. |
| `codex-rs/ext/goal/src/api.rs` | Extension-owned `GoalService` style interface for shared app-server/tool/extension mutation ordering, accounting effects, event facts, and typed cadence delivery requests. | Active `ResponseItem` / `ResponseInputItem` construction, role choice, pending-intent consumption, Continuation watermark advancement, or final request-input commit. |
| `codex-rs/ext/goal/src/tool.rs`, `runtime.rs`, and `extension.rs` | Adapters into `GoalService`, runtime accounting, metrics, and extension events. | Independent mutation ordering, active `GoalContext` construction, configured active steering role, or concrete injection into active turns. |
| `codex-rs/ext/goal/src/steering.rs` | Delete it or reduce it to prompt-body helpers only if those helpers are still useful. | Active steering construction, `GoalContext`, `GoalContextRole`, or `ResponseInputItem` output. |
| `codex-rs/app-server/src/request_processors/thread_goal_processor.rs` | Product API adapter that calls `GoalService` and emits product-equivalent responses/notifications. | Direct durable Goal mutation sequencing or model-input delivery. |

The deep module seam for active Goal authority is `goal_cadence.rs`: callers
give it the actual per-attempt request input plus typed state/request facts,
and it returns finalized input plus commit metadata or an internal abort
outcome. Keep that interface small enough that tests and callers do not need
to know how cadence selection, artifact cleanup, key projection, and Goal item
construction are implemented.

## Plan Shape

Use a spine-and-batches plan, not a monolith.

The spine records ordering, dependencies, invariants, and acceptance gates.
Batch docs carry exact file edits, API shapes, tests, migration names, and
slice-level verification.

Do not implement code from this spine alone. Write or approve the relevant
batch doc first.

## Batch Order

Create batch docs by implementation dependency, not by source authority doc.

Planned batch docs:

1. `batches/00-test-prep-and-baseline-reset.md`
2. `batches/01-durable-cadence-state.md`
3. `batches/02-final-request-input-shaping-and-commit.md`
4. `batches/03-history-key-and-idle-continuation.md`
5. `batches/04-ext-goal-conversion.md`
6. `batches/05-repair-classifiers-and-projections.md`
7. `batches/06-cleanup-and-acceptance.md`

## Dependency Rules

Batch 00 may delete local false-compatibility pressure and restore upstream
baseline tests. It must not delete upstream Goal product behavior.

Batch 01 must land durable facts versioning and pending cadence intent before
producers rely on it.

Batch 02 must own the per-attempt final request-input shaping point and commit
dataflow before classifiers or extension code can be treated as complete.

Batch 03 depends on Batch 02 because the `model_visible_history_key` is
captured by final request-input shaping and automatic Continuation watermarking
commits only after the selected item reaches model execution.

Batch 04 depends on Batches 01 and 02 because reachable `ext/goal` producers
must stop emitting prebuilt model input and route through durable cadence plus
shared final request-input shaping.

Batch 05 depends on Batch 02 because cleanup classifiers must not become the
replacement authority mechanism.

Batch 06 is final cleanup and acceptance only. It should remove dead active
shim terrain, finish replacement tests, and prove no reachable active Goal
producer remains on the old path.

## Batch Requirements

Each batch doc must include:

- authority docs read
- bounded code terrain inspected
- exact files to edit
- exact files/tests to delete, restore, add, or update
- API/schema/module names proposed for that batch
- ordering inside the batch
- rollback or partial-landing constraints
- focused verification commands
- acceptance criteria
- explicit non-goals

Each batch doc must include its own Direction Lock before implementation.

## Global Acceptance Gates

The completed rewrite must prove:

- final `/responses` payloads contain exactly one selected current
  developer-role Goal item when cadence or repair requires it
- no active Goal steering item is user-role
- no active Goal steering item uses active `<goal_context>`
- no reachable active producer uses `GoalContext` or `GoalContextRole`
- pending Initial, ObjectiveUpdated, and BudgetLimit intent survives until the
  commit point and is consumed by exact key only
- automatic Continuation does not repeat for unchanged
  `{ goal_id, model_visible_history_key, durable_facts_version }`
- resume hydrates state and does not fabricate Initial
- ordinary user turns are not automatic Continuation events
- request repair does not become Goal every turn
- legacy `<goal_context>` handling is artifact cleanup only
- raw response item notifications are not specially suppressed for Goal context
- upstream Goal product tests remain part of the baseline unless explicitly
  replaced by a product change

## Verification Posture

For docs-only edits in this directory:

```text
git diff --check -- local/goal_research local/goal_136_plan
```

For implementation batches, follow the root `AGENTS.md` validation rules. Keep
Rust validation focused on the files and behavior touched by the batch.
