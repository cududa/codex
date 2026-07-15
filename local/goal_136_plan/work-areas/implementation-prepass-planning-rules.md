# Implementation Pre-Pass Planning Rules

This file defines the work that may need to happen before a Work Area is split
into implementation pass docs.

It is execution guidance only. The authority docs under `local/goal_research`
still win.

Status: WA01-WA06 pre-pass planning is complete. Retain this file as process
context for why the maps, readiness notes, and split docs exist. A fresh
implementation session should not rerun pre-pass work or re-verify the split
because this file exists. Reopen pre-pass planning only when a required
deliverable is missing, directly conflicts with `local/goal_research`, or a
concrete implementation pass finds a missing earlier replacement seam.

Use this file when the next question is:

```text
What code-grounded validation, map, or remediation do we need before we write
implementation pass docs?
```

Once the required pre-pass work for a Work Area is complete, use
`local/goal_136_plan/work-areas/implementation-pass-planning-rules.md` to
write the actual pass docs.

## Purpose

The problem to avoid is jumping directly from a large Work Area doc into pass
docs when the real implementation seams are still unclear.

Pre-pass planning is not implementation. It is not an implementation pass doc.
It is not authority. It is context compression before splitting.

A good pre-pass deliverable lets the next agent write or execute concrete pass
docs without rereading the entire Work Area and half the repo.

## Terms

Pre-pass deliverable:

- a validation note, appendage map, reachability map, ordering map, or surface
  map produced before implementation pass docs

Split planning:

- the later act of writing ordered implementation pass docs from a ready Work
  Area or completed pre-pass deliverable

Implementation pass:

- an executable slice on the same rewrite branch, not a PR boundary or
  standalone acceptance checkpoint

## Required Posture

Before creating a pre-pass deliverable, read:

- `local/goal_research/AGENTS.md`
- the authority docs named by the active Work Area
- `local/goal_136_plan/AGENTS.md`
- `local/goal_136_plan/work-areas/AGENTS.md`
- `local/goal_136_plan/work-areas/goal-work-area-coordination-note.md`
- the active Work Area doc

Then walk the bounded code terrain needed to answer that pre-pass question.

Existing local code and upstream tags are terrain, not mission. Use them to
find real files, hooks, state shapes, call order, and tests. Do not let them
weaken `local/goal_research`.

## Concept Discipline

Pre-pass work may name implementation seams, maps, or temporary labels, but it
must not invent architecture that outruns the authority docs.

Before adding a new concept, type family, proof mechanism, service boundary, or
planning vocabulary, first check the existing Work Area docs and coordination
notes for the concept or a nearby term. This prevents duplicate local names and
keeps split planning consistent across Work Areas.

Then trace that concept back to the applicable `local/goal_research`
contracts before adopting it:

- if the concept already exists in authority docs, use the authority wording
  and keep the meaning intact
- if the concept exists only in Work Area docs, treat it as planning precedent,
  not authority; verify it against `local/goal_research` before carrying it
  forward
- if the concept is an implementation name for an authority requirement, say
  which requirement it carries and which files/functions make it necessary
- if the concept is only a tentative organizing label for a pre-pass map, mark
  it as such and do not let later split docs treat it as authority
- if the concept would replace, soften, or bypass an authority seam, do not add
  it; name the conflict instead

Do not create layers whose only job is to make a plan sound complete. In this
Goal work, especially reject new "proof" or compatibility language that turns
helper output, classifiers, raw notifications, ordinary rollout items,
recorded evidence, current code shape, or upstream topology into active Goal
authority. If a pre-pass needs a new term to compress code findings, keep it
code-grounded, narrow, and subordinate to the authority docs.

## Completed Pre-Pass Deliverables

Completed pre-pass deliverables are required route context for later pre-pass
and split-planning work.

They are not peer authority with `local/goal_research`, but they do carry
code-grounded findings, chosen local vocabulary, and dependency constraints
that later Work Areas should not rediscover or silently contradict.

Before creating a new pre-pass deliverable or implementation pass split, read:

- the active Work Area doc
- completed pre-pass deliverables for earlier Work Areas that the active Work
  Area depends on
- any completed pre-pass deliverable for the active Work Area

Use those deliverables to find existing local concepts and route decisions.
Then validate those concepts against `local/goal_research`.

If a completed pre-pass deliverable conflicts with `local/goal_research`, name
the conflict and update or supersede the pre-pass deliverable. Do not treat a
pre-pass artifact as authority against the research docs.

Use upstream this way:

- `rust-v0.136.0`: v136 landing topology and upstream product baseline
- `rust-v0.139.0` and `rust-v0.140.0`: migration pressure, especially
  `ext/goal` ownership and typed replay precedent
- `upstream/main`: drift clarification only when needed

## Direction Lock Required

Every pre-pass session must include a visible Direction Lock after authority
reading and code terrain inspection, before writing the deliverable:

```text
Request:
Authority:
Terrain:
Code-shape temptation:
Locked direction:
Exclusions:
```

The lock should name the specific pre-pass artifact being produced, such as
WA03 appendage map, WA04 reachability and ordering map, or WA01 validation.

## Current Pre-Pass Queue

These items come before implementation-pass split planning.

### WA01 Existing Pass Validation

Existing pass docs:

- `01a-durable-facts-version-plumbing.md`
- `01b-pending-cadence-intent-storage.md`
- `01c-cadence-aware-store-operations.md`

Status:

- complete in `01-existing-pass-validation.md`
- result: existing 01a/01b/01c split is passable for implementation, with the
  constraints recorded there

Pre-pass task:

- validate these pass docs against current `local/goal_research`, recorded
  request evidence boundaries, and the v136-to-v139/v140 migration posture
  before trusting them for implementation

Required terrain:

- `codex-rs/state/goals_migrations/0001_thread_goals.sql`
- `codex-rs/state/src/model/thread_goal.rs`
- `codex-rs/state/src/runtime/goals.rs`
- any tests named by the WA01 pass docs
- `rust-v0.136.0` versions of the same state files when baseline comparison
  is needed

The validation must answer:

- do the pass docs still keep `GoalStore` durable-only?
- do facts version and pending-intent storage still match the current
  authority docs?
- do the atomic mutation APIs keep Goal facts and pending Initial,
  ObjectiveUpdated, or BudgetLimit intent in the same transaction?
- do the pass docs accidentally require independent PR/build acceptance?
- do they mention recorded evidence only within its metadata-only boundary?

Proceed to split or implementation only after stale wording or stale pass
requirements are fixed.

### WA02 Direct-Split Readiness Check

WA02 does not need an appendage map by default.

Status:

- complete in `02-direct-split-readiness-check.md`
- result: WA02 is ready for direct implementation-pass split planning, using
  the request-loop spine and constraints recorded there

Pre-pass task:

- do a bounded request-loop and producer terrain reread so the direct split is
  based on actual v136 code, then proceed to split instructions

Required terrain:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/goals.rs`
- `codex-rs/core/src/codex_thread.rs`
- request/response test utilities that inspect captured `/responses` input
- matching `rust-v0.136.0` request-loop terrain

The readiness check must answer:

- where does the request-input shaper run on every retry/follow-up attempt?
- where is the Created-event commit handler wired?
- what metadata moves through current-turn carry?
- which core producers still create pre-shaper Goal model input?
- which tests inspect final request input rather than helper output?

If those answers are clear, do not write a separate WA02 map. Move directly to
implementation pass split docs.

### WA03 Appendage Map

WA03 needs an appendage map before final implementation pass docs unless a
fresh code walk proves the active agent can already name safe concrete pass
boundaries.

Before producing the WA03 appendage map, read:

- `01-existing-pass-validation.md`
- `02-direct-split-readiness-check.md`

WA03 depends on WA01 durable facts/pending-intent state and the WA02
per-attempt request-input shaping / Created-event commit seam.

Required terrain:

- `codex-rs/core/src/session/turn.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/state/src/runtime/goals.rs`
- state model and migration terrain touched by WA01 and WA03
- `rust-v0.136.0` request/history/state terrain where needed
- `rust-v0.140.0` typed replay terrain only where evidence or replay shape
  needs migration clarification

The map must cover:

- model-visible history key projection
- eligible progress projection and Goal-item exclusions
- durable automatic Continuation suppression storage or equivalent structured
  committed-delivery record
- `GoalTurnRequest` metadata lifecycle
- idle stage ordering
- pending durable cadence delivery from idle
- automatic Continuation preflight and request-input shaper recheck
- stale synthetic Goal-owned turn abort-before-submit behavior
- Created-event Continuation commit
- resume hydration
- compaction, rollback, fork, and reconstruction key behavior
- retry and failure semantics

The map must identify which appendages are coupled and which ones become
separate implementation passes.

### WA04 Reachability And Ordering Map

WA04 needs a bounded reachability and ordering map before pass docs unless a
fresh code walk already proves every extension/app-server producer path and
ordering constraint.

Before producing the WA04 reachability and ordering map, read:

- `01-existing-pass-validation.md`
- `02-direct-split-readiness-check.md`
- the WA03 appendage map, once it exists

WA04 depends on durable mutation outcomes, metadata-only request/wake behavior,
request-input shaping, Created-event commit timing, and idle ordering.

Required terrain:

- `codex-rs/ext/goal/src/extension.rs`
- `codex-rs/ext/goal/src/runtime.rs`
- `codex-rs/ext/goal/src/steering.rs`
- `codex-rs/ext/goal/src/tool.rs`
- `codex-rs/ext/goal/src/lib.rs`
- `codex-rs/core/src/codex_thread.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/core/src/tasks/regular.rs`
- `codex-rs/core/src/session/turn.rs`
- `codex-rs/app-server/src/request_processors/thread_goal_processor.rs`
- `codex-rs/app-server/tests/suite/v2/thread_resume.rs`
- `codex-rs/ext/goal/tests/goal_extension_backend.rs`
- `rust-v0.136.0` extension/runtime topology
- `rust-v0.139.0` and `rust-v0.140.0` service topology only as migration
  pressure

The map must answer:

- which extension/app-server paths are Goal mutation entry points to preserve,
  such as extension-owned `create_goal`, versus active model-input construction
  paths to convert or delete?
- which reachable extension/app-server producers still construct active model
  input or call active-turn injection?
- can the v136 adapter/runtime path carry shared mutation and accounting
  ordering?
- is a thin `ext/goal/src/api.rs` facade actually needed, or is it
  premature?
- how do app-server and extension mutations create durable pending Initial,
  ObjectiveUpdated, or BudgetLimit intent atomically?
- how does same-turn recheck or wake behavior avoid prebuilt model input?
- which tests prove extension/app-server-origin cadence reaches final
  `/responses` input as exactly one current developer-role Goal
  `ResponseItem`?

Default answer remains adapter/runtime conversion. A thin facade or full
service move needs code-grounded justification.

### WA05 Surface Map

WA05 may use direct split planning only if a fresh code walk keeps the
classifier/projection surfaces bounded. Otherwise produce a surface map first.

Before producing the WA05 surface map, read:

- `02-direct-split-readiness-check.md`
- the WA03 appendage map, once it exists
- the WA04 reachability and ordering map, once it exists

WA05 depends on the request-input authority seam, committed carry/evidence
boundaries, idle metadata behavior, and producer routing so classifier and
projection work stays cleanup-only.

Required terrain:

- `codex-rs/core/src/context/goal_context.rs`
- `codex-rs/core/src/context/contextual_user_message.rs`
- `codex-rs/core/src/event_mapping.rs`
- `codex-rs/core/src/context_manager/history.rs`
- `codex-rs/core/src/compact.rs`
- `codex-rs/core/src/compact_remote.rs`
- `codex-rs/core/src/compact_remote_v2.rs`
- `codex-rs/core/src/session/rollout_reconstruction.rs`
- `codex-rs/core/src/session/mod.rs`
- `codex-rs/core/src/session/input_queue.rs`
- `codex-rs/core/src/state/turn.rs`
- `codex-rs/app-server/src/bespoke_event_handling.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `rust-v0.136.0` internal-context and raw-notification terrain
- `rust-v0.140.0` typed replay terrain where evidence wording needs
  migration clarification

The surface map must cover:

- generic internal-context rendering and strict pure-item classification
- request-input cleanup helpers used by `goal_cadence/`
- contextual user parsing
- event mapping and typed/materialized projection
- history boundary and rollback trimming
- local and remote compaction cleanup
- rollout reconstruction, rollback, and fork cleanup
- app-server raw notification cleanup
- tests that keep classifier/projection behavior separate from final request
  authority tests

The map must keep classifiers as cleanup/projection tools only. They must not
select cadence, infer durable facts, consume pending intent, advance
watermarks, or write evidence.

### WA06 Hold

Do not split WA06 early.

WA06 is final cleanup and acceptance after WA01 through WA05 have replacement
surfaces and implementation pass docs. It should delete old active-path
surfaces and prove the completed rewrite.

Before deciding the WA06 final cleanup split, read all completed pre-pass
deliverables and all completed implementation pass docs for WA01 through WA05.
WA06 is an audit of completed replacement paths, not a place to invent new
cadence, state, extension, classifier, evidence, or request-input architecture.

Pre-pass task:

- after WA01 through WA05 pass docs exist, reread WA06 and decide whether it
  can be one final cleanup/audit pass or needs a small number of final audit
  passes

WA06 must not become an early bucket for deleting terrain before replacement
paths exist.

## Deliverable Shape

A pre-pass deliverable should be short enough to be useful after compaction.

Include:

- Direction Lock
- authority docs read
- local code terrain read
- upstream terrain read, if used
- direct findings that change the split
- required map, validation, or readiness answers
- proceed criteria for actual split planning
- validation command

Do not include:

- a broad summary of every authority doc
- exhaustive read logs
- speculative architecture
- implementation pass docs disguised as a map
- instructions to make any pass independently mergeable

## Passforward Notes

When a pre-pass cannot be finished in one context window, write a passforward
note in the same style:

- workspace path
- docs-only versus Rust implementation scope
- authority docs to read
- active Work Area and current state
- bounded code terrain to walk
- upstream tags to consult, if needed
- specific review or edit targets
- invariants to preserve
- validation command

## Validation

For docs-only edits to Work Area or planning documents, run:

```text
git diff --check -- local/goal_research local/goal_136_plan
```

For Rust implementation, follow the root `AGENTS.md` validation rules and the
focused validation named by the active implementation pass. Do not run broad
Rust suites for planning-only work.
