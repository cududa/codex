# Durable Cadence State

Status: Pass 2C staged successor. It becomes standing authority only through
cutover; closed sections are written as successor contract text.

## Role

This target is the durable state seam for Goal cadence. It owns current Goal
facts, durable facts version identity, pending non-Continuation cadence intent,
atomic mutation outcomes, exact-key pending-intent consumption, and mechanical
stale-intent cleanup.

This target does not own request shaping, model roles, `ResponseItem`
construction, prompt rendering, request repair, legacy or current Goal item
classification, idle ordering, automatic Continuation selection, or automatic
Continuation watermark policy.

Durable state supplies facts and pending-intent records to cadence, idle, final
request-input shaping, and history-key seams. It does not decide whether a
request attempt carries Goal steering, and it does not prove model authority.

## Purpose

Durable cadence state is the persisted source for the Goal facts and pending
non-Continuation work that later request-input shaping can deliver.

The durable layer owns state identity and transaction results. It gives other
targets the facts, facts version, pending intent, and exact-key operations they
need without becoming a model-input, repair, scheduling, or evidence layer.

## Current Terrain To Replace

Current durable Goal terrain stores one Goal facts row per thread with Goal
identity, objective, status, token budget, usage, and created/updated
timestamps. It has no structured pending cadence intent table, no
transactionally allocated durable facts version, and no exact-key pending-intent
consumption operation.

Current terrain anchors are:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`;
- `codex-rs/state/src/model/thread_goal.rs`; and
- `codex-rs/state/src/runtime/goals.rs`.

`updated_at_ms` is product metadata. It is not the sole cadence facts identity.
Cadence requires a durable monotonic facts version that changes when
steering-relevant Goal facts change.

## Durable Ownership

The durable state layer owns:

- Goal fact reads and writes;
- monotonic durable facts version allocation;
- pending Initial, ObjectiveUpdated, and BudgetLimit intent persistence;
- exact-key pending-intent cleanup and delivery commit support;
- mechanical cleanup for stale intent that can no longer be delivered; and
- factual transaction outcomes for callers.

The durable state layer must not own:

- final request-input shaping;
- model role selection or `ResponseItem` construction;
- Goal prompt rendering;
- cadence selection for a request opportunity;
- idle continuation selection;
- request repair decisions;
- legacy or current Goal item classification; or
- automatic Continuation watermark policy.

Durable Goal state is current fact state. It is not model-visible steering and
does not by itself make cadence due.

## Storage Shape

The logical durable model includes a monotonic `facts_version` on the Goal facts
row and structured pending intent records for non-Continuation cadence.

Each pending intent record carries:

```text
thread_id
goal_id
kind: Initial | ObjectiveUpdated | BudgetLimit
facts_version
created_at_ms
```

The exact delivery identity is:

```text
thread_id + goal_id + kind + facts_version
```

Storage uniqueness choices must not weaken that exact delivery key. Pending
intent is structured durable state, not rollout text, rendered context, UI
metadata, raw events, helper output, classifier output, recorded request
evidence, or active durable state alone.

Multiple pending kinds can coexist for the same Goal until supersedence or
commit clears them. Replacing a Goal clears pending intent for the replaced
`goal_id`; deleting or clearing a Goal clears all pending intent for the
thread.

## Mutation Rules

All mutations that create, change, supersede, or clear pending cadence intent
are atomic with the durable Goal facts change they describe.

Creating or replacing an active Goal writes the Goal facts, allocates the next
facts version, clears stale intent for any replaced Goal, inserts pending
Initial intent for the current `goal_id` and facts version, and returns the
durable snapshot plus pending-intent summary.

Updating the active objective verifies the current Goal identity and status,
writes the new objective, allocates the next facts version, inserts or replaces
pending ObjectiveUpdated intent for the current `goal_id` and facts version,
and returns the durable snapshot plus pending-intent summary.

Accounting budget state writes usage and status facts first. When the durable
outcome requires model wrap-up, the same transaction allocates the next facts
version, inserts or replaces pending BudgetLimit intent for the current
`goal_id` and facts version, and returns an outcome that distinguishes
unchanged facts, updated facts without pending BudgetLimit intent, and updated
facts with pending BudgetLimit intent.

UsageLimit, terminal status, manual status, delete, and clear mutations write
the durable facts outcome and clear active-state pending intent that can no
longer be delivered. Deleting or clearing a Goal deletes all pending intent for
the thread.

Facts-only product operations remain facts-only. They maintain facts versions
and mechanical stale-intent cleanup when they write durable facts, but they do
not create new pending Initial, ObjectiveUpdated, or BudgetLimit intent unless
the operation is explicitly the cadence-aware mutation for that producer.

## Supersedence And Cleanup

Durable state is limited to mechanical cleanup when a durable mutation makes
older pending intent impossible:

- replacing a Goal clears pending intent for the old `goal_id`;
- deleting or clearing a Goal clears all pending intent for the thread;
- BudgetLimit clears stale Initial and ObjectiveUpdated intent for the same
  `goal_id` when those intents are superseded; and
- terminal statuses clear active-state pending intent that can no longer be
  delivered.

State does not choose among eligible pending intents for a request attempt.
Cadence owns due semantics and supersedence ranking. Final request-input
shaping applies the request-attempt selection order and proves delivery in
final input.

## Store Operations

The durable API exposes logical operations equivalent to:

```text
get_thread_goal_with_cadence(thread_id)
replace_thread_goal_with_initial_intent(...)
insert_thread_goal_with_initial_intent(...)
update_thread_goal_with_objective_intent(...)
account_thread_goal_usage_with_budget_intent(...)
usage_limit_or_status_update_and_clear_intents(...)
delete_thread_goal_and_intents(thread_id)
consume_pending_intent_exact(thread_id, goal_id, kind, facts_version)
clear_superseded_intents(thread_id, goal_id, kinds)
```

`consume_pending_intent_exact` is compare-and-delete for the exact delivery
identity. It must not consume intent for a newer Goal, a different kind, a
different facts version, or a different thread. Broad cleanup of stale or
superseded intent is a separate state operation and does not replace exact-key
commit consumption.

Selecting, rendering, constructing, reserving, accepting same-turn metadata,
launching an idle turn, or producing helper output does not consume pending
intent. Consumption is support for the final-input commit path after the
matching selected developer-role Goal item reaches the commit point.

## Continuation Boundary

Continuation is not persisted pending cadence intent.

Durable state exposes facts versions and, when the chosen history design stores
them in state, committed delivery or suppression records needed by
model-visible history-key reconstruction. Such records are not pending
Continuation intent, do not select automatic Continuation, and do not advance a
watermark by themselves.

Automatic Continuation eligibility belongs to the idle lifecycle and
model-visible history-key targets. Final request-input commit owns the point at
which a committed Continuation delivery can update the suppression basis.

## Evidence Boundary

Structured recorded request evidence is replay and audit metadata for a
committed final request-input decision. It is not pending-intent storage,
cadence selection, durable facts, final-input inspection, or active Goal
recovery.

Durable state remains the live correctness owner for pending Initial,
ObjectiveUpdated, and BudgetLimit intent unless a separate evidence target
explicitly supplies an equivalent non-best-effort persistence and error policy.
Ordinary rollout items, rollout trace payloads, rendered Goal text, raw
notifications, helper output, and classifier matches do not replace durable
pending intent or exact-key consumption.

## Verification Requirements

Focused durable-state tests prove:

- creating an active Goal writes facts and pending Initial intent atomically;
- objective update writes facts and pending ObjectiveUpdated intent atomically;
- budget accounting writes usage/status facts and pending BudgetLimit intent
  atomically when model wrap-up becomes due;
- exact-key commit consumes only the matching pending intent;
- replacing, deleting, clearing, or terminally updating a Goal clears stale
  pending intent;
- facts version changes when steering-relevant facts change;
- facts-only operations do not create pending cadence intent; and
- durable store APIs do not construct model input, render prompts, decide
  cadence selection, repair request input, or classify Goal items.
