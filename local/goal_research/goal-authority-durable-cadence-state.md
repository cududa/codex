# Goal Authority Durable Cadence State

## Purpose

This document defines the durable state needed by Goal cadence.

It consolidates the previous state/behavior and GoalStore-interface design
notes. State owns durable facts and durable pending cadence intent. It does not
own request shaping, repair, prompt rendering, model roles, idle ordering, or
Continuation policy.

## Code Terrain

Current durable Goal facts live in:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`

Current terrain has:

- one `thread_goals` row per thread
- `goal_id`, objective, status, token budget, tokens used, time used, created
  and updated timestamps
- no pending cadence intent table
- no transactionally allocated durable facts version
- no exact-key pending intent consumption operation

Current `updated_at_ms` is useful product metadata, but it should not be the
only durable facts identity for cadence. Cadence needs an exact facts version
that changes when Goal facts change in a way that can affect Goal steering.

## Durable Ownership

The state layer owns:

- Goal fact reads and writes
- monotonic durable facts version allocation
- pending Initial, ObjectiveUpdated, and BudgetLimit intent persistence
- exact-key pending intent cleanup and delivery commit
- factual transaction outcomes for callers

The state layer must not own:

- final request-input shaping
- model role or `ResponseItem` construction
- Goal prompt rendering
- idle continuation selection
- repair decisions
- legacy/current Goal item classification
- automatic Continuation watermark policy

## Storage Shape

Add a migration after `0001_thread_goals.sql`.

Required logical additions:

```sql
ALTER TABLE thread_goals
ADD COLUMN facts_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE thread_goal_pending_intents (
    thread_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN (
        'initial',
        'objective_updated',
        'budget_limit'
    )),
    facts_version INTEGER NOT NULL,
    created_at_ms INTEGER NOT NULL,
    PRIMARY KEY (thread_id, kind)
);

CREATE INDEX thread_goal_pending_intents_thread_goal_idx
ON thread_goal_pending_intents(thread_id, goal_id);
```

The exact SQL file number may vary, but the logical model may not:

- facts version is durable and monotonic per Goal facts row
- pending intent is structured state, not rollout text or rendered context
- pending intent is keyed by `thread_id`, `goal_id`, `kind`, and
  `facts_version`
- multiple kinds may exist until supersedence or commit clears them
- replacing a Goal must not leave pending intent for the replaced `goal_id`

## Mutation Rules

All mutations below must be atomic with the durable facts change they describe.

Creating or replacing an active Goal:

```text
write thread_goals row
allocate next facts_version
clear pending intent for replaced goal_id/thread_id as needed
insert pending Initial intent for current goal_id and facts_version
return durable snapshot plus pending intent summary
```

Updating the active objective:

```text
verify current goal_id/status
write new objective
allocate next facts_version
insert or replace pending ObjectiveUpdated intent for current goal_id and
  facts_version
return durable snapshot plus pending intent summary
```

Accounting budget state:

```text
account usage
if budget/status requires model wrap-up:
  write status/usage facts
  allocate next facts_version
  insert or replace pending BudgetLimit intent for current goal_id and
    facts_version
return durable snapshot plus pending intent summary
```

UsageLimit and terminal/manual status updates:

```text
write durable facts
allocate next facts_version when facts change
clear pending active-state intents that can no longer be delivered
return durable snapshot
```

Deleting or clearing a Goal:

```text
delete thread_goals row
delete all pending intent for thread_id
```

## Supersedence

State may perform mechanical cleanup when a durable mutation makes older
pending intent impossible:

- replacing a Goal clears pending intent for the old `goal_id`
- deleting a Goal clears all pending intent for the thread
- BudgetLimit may clear stale Initial and ObjectiveUpdated intent for the same
  `goal_id`
- terminal statuses may clear active-state pending intent that can no longer be
  delivered

State must not choose between eligible pending intent for a request attempt.
That selection belongs to final request-input shaping.

## Required Store Operations

The implementation plan should name exact Rust types, but the durable API must
provide the logical equivalents of:

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

`consume_pending_intent_exact` must be exact-key. It must not consume intent for
a newer Goal, a different kind, or a different facts version.

## Continuation

Continuation is not persisted pending cadence intent.

This durable-state contract may expose facts versions and committed delivery
records needed by the model-visible history key design, but state must not
decide automatic Continuation eligibility.

## Verification Requirements

Focused state tests should prove:

- creating an active Goal writes facts and pending Initial intent atomically
- objective update writes facts and pending ObjectiveUpdated intent atomically
- budget accounting writes usage/status facts and pending BudgetLimit intent
  atomically
- exact-key commit consumes only the matching pending intent
- replacing or deleting a Goal clears stale pending intent
- facts version changes when steering-relevant facts change
- GoalStore APIs do not construct model input, render prompts, or decide
  cadence selection
