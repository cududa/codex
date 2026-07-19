# Goal Final Request Input

## Navigation Header

This successor doc is the final-input contract for Goal authority. It answers
which exact request input proves active Goal steering for one model attempt
and when delivery side effects become valid.

- Role: canonical final request-input shaping and commit contract.
- Owns: the logical final `Vec<ResponseItem>` before `Prompt.input`;
  per-attempt Goal shaping; selected item identity; cleanup inside shaping;
  developer-role item insertion or verification; final payload proof; commit
  metadata; item and request fingerprints; Created-event commit side effects;
  retry and follow-up shaping; current-turn committed carry; and producer
  adapter non-ownership for active model input.
- Does not own: behavioral truth about authority, durable facts storage,
  pending-intent persistence, facts-version allocation, idle scheduling,
  model-visible history-key computation, recorded-evidence persistence and
  replay policy, broad projection/raw behavior, extension lifecycle, or the
  replacement test matrix.
- Primary pointers: `goal-authority-behavior.md` for the authority rule,
  `goal-cadence-contract.md` for due kinds,
  `goal-durable-state-and-pending-intent.md` for durable facts and exact-key
  operations, and `goal-idle-history-lifecycle.md` for Continuation metadata.
- Fidelity note: helper output, rendered text, active-turn injection,
  reservation, same-turn metadata, pre-finalizer carry, raw notifications,
  projection hiding, evidence metadata, and active durable state alone are not
  final input and are not commits.

## Core Rule

Active Goal authority is proven for a request attempt only when the finalized
logical model request input contains exactly one selected current Goal item as
an outer developer-role model item:

```text
ResponseItem::Message.role = "developer"
ContentItem::InputText.text = rendered internal Goal context
internal context source = "goal"
body = current rendered Goal steering prompt
objective = escaped as untrusted text
```

`final model request input` means the logical input list that becomes
`Prompt.input` and then `ResponsesApiRequest.input`, before any
transport-specific full request or incremental delta is derived.

The concrete Rust finalizer module name is implementation-owned, but the call
site must sit after base logical input construction and before `Prompt.input`
or client request input is derived.

Final request-input shaping is the only seam that may turn due Goal cadence
or request-local repair into active model input. It implements the behavior
rule; it does not redefine the authority rule. It applies the cadence
selection; it does not create cadence events. It invokes durable exact
operations at commit; it does not store pending intent.

An active durable Goal by itself selects no item. Rendering Goal text,
constructing a helper object, accepting same-turn recheck metadata, reserving
a Goal-owned turn, carrying prior metadata, or finding a Goal-looking item in
history does not prove active authority and does not consume pending intent.

## Per-Attempt Finalization

Final request-input shaping must run for every model request attempt after the
base input for that attempt is known and before the model client receives it.

This includes:

- the first request attempt in a turn
- retry attempts whose prompt input is rebuilt from current history
- same-turn follow-up attempts after tool output, mailbox input, or other
  pending work
- Goal-owned synthetic cadence-delivery or automatic Continuation turns after
  idle lifecycle has selected or scheduled them
- WebSocket incremental transport paths, where the delta may be incremental
  but finalization still attaches to the full logical request input used to
  derive the delta

The logical interface is equivalent to:

```text
finalize_goal_request_input(
  attempt_context,
  base_input: Vec<ResponseItem>,
) -> FinalizedGoalRequestInput
```

`attempt_context` must carry the logical equivalents of:

- thread id and turn id
- attempt ordinal for this model request attempt
- current durable Goal snapshot, including facts version
- pending Initial, ObjectiveUpdated, and BudgetLimit intent snapshot
- optional same-turn or idle request metadata for pending-intent delivery
- optional automatic Continuation request metadata selected by idle lifecycle
- feature and collaboration-mode eligibility facts
- model-visible history key for this attempt, computed by the history owner
  from the same logical base model-visible input before inserting a new Goal
  item
- transport context needed to distinguish full logical input from deltas
- repair context for compaction, resume, rollback, reconstruction, retry,
  follow-up, previous-response reuse, or model-context transitions

Request metadata is input to shaping only. It may carry Goal identity, kind,
facts version, source, reservation identity, or Continuation preflight key. It
must not carry rendered Goal text, role-bearing model input, a prebuilt
`ResponseItem`, a prebuilt `ResponseInputItem`, pending Continuation intent,
committed carry, evidence, or authority proof.

`FinalizedGoalRequestInput` must include the logical equivalents of:

```text
input: Vec<ResponseItem>
commit: Option<GoalRequestCommit>
repair_report: GoalRepairReport
```

The returned commit metadata is inert. It authorizes no durable mutation,
watermark advancement, evidence write, or carry update until the request
reaches the commit point.

## Eligibility Gates

Feature and collaboration-mode facts are delivery gates. They are not cadence
authority, not durable Goal facts, not helper authority, and not proof that
Goal steering reached final input.

If Goals are disabled, collaboration mode does not allow Goal steering, the
durable Goal no longer matches the selected pending intent, or the durable
status does not allow the selected kind, finalization must select no active
Goal item and must consume no pending intent.

Ineligible finalization may still clean invalid Goal-looking items from the
attempt input according to the cleanup contract. It must not insert a fresh
Goal item merely because durable state exists.

## Selection Inputs And Order

Finalization selects at most one Goal item for the request attempt.

The possible selected kinds are:

```text
Initial
ObjectiveUpdated
BudgetLimit
Continuation
```

The selection order for one request opportunity is:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

Selection consumes no pending intent. It only chooses which item, if any, the
finalized request input should contain and which inert commit metadata should
be returned.

Pending Initial, ObjectiveUpdated, and BudgetLimit intent comes from durable
state and must match the current thread, Goal identity, status, and facts
version, or an explicit supersedence rule. Continuation comes from the idle
lifecycle's selected request metadata and ranks below pending
non-Continuation intent. Continuation never supersedes persisted pending
intent.

Ordinary user turns do not create cadence. They may still deliver already
pending Initial, ObjectiveUpdated, or BudgetLimit intent when finalization
selects that intent and the request later commits. That is delivery of
pre-existing pending intent, not a fresh user-turn cadence event.

Same-turn cadence recheck or wake metadata from app-server, extension, or core
mutation paths is not delivery. `AcceptedForActiveTurn` means only that the
active turn accepted metadata or wake state. Pending intent remains pending
unless this finalizer includes the matching developer-role item and the
request reaches the commit point.

## Cleanup And Request-Local Repair

Finalization owns cleanup inside the request input it is about to send. It
uses classifier semantics owned by
`goal-request-repair-and-artifact-classification.md`, but the finalizer owns
how those classifications affect this attempt's final input.

For every attempt, finalization must inspect the actual base input and handle:

- stale current Goal internal-context items
- duplicate current Goal items
- wrong-role current Goal-looking items
- legacy `<goal_context>` artifacts
- pre-injected concrete Goal-looking items from old active-turn terrain
- mixed ordinary prose that merely contains marker-like text

The finalizer may remove, ignore, deduplicate, or replace pure Goal-looking
items when doing so is required to leave the finalized input with no invalid
authority substitute and at most one selected current Goal item.

Classifier output is cleanup metadata. It cannot select cadence, prove
authority, infer durable Goal facts, parse objective text, consume pending
intent, advance a Continuation suppression record, write evidence, or create
model input by itself.

Request-local repair is allowed only when the request would otherwise lose,
stale, duplicate, downgrade, or omit cadence-required authority. Repair may
support normal pending-intent delivery through this finalizer. Repair must not
turn active durable state alone into steering, create pending intent, or
advance a Continuation suppression record.

Repair inside finalization does not record rollout or thread history by
itself. Recording is limited to the normal commit path for selected cadence
delivery or to evidence-owned structured reconstruction of a previously
committed item.

Previous-response or model-context reuse is not proof by itself. It is proof
only when the implementation can inspect or account for the finalized logical
input and show that exactly one selected current developer-role Goal item is
already present. If it cannot, finalization must restore cadence-required
developer-role authority for that request or select no Goal item when cadence
does not require one.

Same-turn WebSocket reuse may be treated as proof only when the full logical
request input is known to match the finalized baseline. A transport delta that
does not carry or prove the full logical input is not authority proof.

## Selected Item Rendering

When finalization selects a Goal item, the item must render from current
durable Goal facts, not from pending-intent bodies, tool request bodies,
app-server request bodies, UI projection, prior rendered Goal text, ordinary
rollout items, raw notifications, traces, classifier output, or evidence.

The selected item must:

- be an outer `ResponseItem::Message`
- use role `developer`
- contain current internal Goal context text when that representation is part
  of the active design
- identify internal context source `goal` through the rendering format
- include the current rendered Goal steering body
- escape objective text as untrusted text
- match the selected Goal identity, steering kind, and facts version
- be the only selected current Goal authority item in the finalized input

If an already-present item exactly matches the selected current item after
cleanup, finalization may verify it instead of inserting a new one. Wrong-role
items, stale items, duplicates, legacy artifacts, helper-only output, or
pre-finalizer concrete carry cannot be verified as current authority.

## Commit Metadata

`GoalRequestCommit` records the exact item finalization selected. It is
metadata for a possible later commit, not a side effect by itself.

Logical shape:

```text
GoalRequestCommit {
  thread_id,
  turn_id,
  attempt_ordinal,
  goal_id,
  kind: Initial | ObjectiveUpdated | BudgetLimit | Continuation,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
  request_input_fingerprint,
  item_index,
  inserted_or_verified,
}
```

`attempt_ordinal` must identify the exact model request attempt. It is
allocated before per-attempt finalization and reused by the commit path.

`item_fingerprint` must identify the exact selected developer-role Goal item
as it appears in the finalized logical input. It may be a digest rather than a
persisted copy of the whole item, but tests and commit logic must be able to
reconstruct or compare it from the captured finalized input.

`request_input_fingerprint` must identify the entire finalized logical
`Vec<ResponseItem>` that becomes `Prompt.input` and
`ResponsesApiRequest.input`. It includes the selected Goal item and every
non-Goal item actually sent. It excludes helper output, raw notifications,
projection state, removed Goal-looking items, rollout trace payloads, and
transport-only deltas that omit the full logical request.

`item_index` must point to the selected item's position inside the finalized
logical input. `inserted_or_verified` records whether the finalizer inserted
the selected item or accepted an already-present exact item after cleanup.

These fields are also the finalized-input identity that recorded request
evidence may persist. Evidence persistence, replay pairing, rollback, fork,
compaction treatment, and evidence failure policy are owned by the recorded
evidence doc.

## Commit Point

Commit happens only after the request is known to have entered model
execution. The expected commit point is:

```text
ResponseEvent::Created
```

If a later implementation code walk proves a more precise model-execution
point, the owning authority must be updated before this contract uses that
point. Until then, use `ResponseEvent::Created`.

Before any side effect, the commit path must verify:

- the finalized logical request input still matches `request_input_fingerprint`
- `item_index` still identifies the selected item
- the selected item still matches `item_fingerprint`

When those checks pass, the commit path may run the side effects associated
with the selected kind:

- Initial consumes pending Initial intent by durable exact key
- ObjectiveUpdated consumes pending ObjectiveUpdated intent by durable exact
  key
- BudgetLimit consumes pending BudgetLimit intent by durable exact key and
  may request durable cleanup of explicitly superseded Initial or
  ObjectiveUpdated intent for the same Goal
- Continuation advances the state-owned automatic Continuation suppression
  record, or equivalent durable/reconstructable record, for the committed
  Goal id, model-visible history key, and facts version
- committed carry may record that this turn already delivered this exact Goal
  item
- evidence metadata may be handed to the recorded-evidence owner if evidence
  is in scope

Durable exact-key consumption remains owned by durable state. Continuation
selection and model-visible history-key computation remain owned by
idle/history. Evidence persistence and replay semantics remain owned by the
recorded-evidence doc.

No commit occurs when:

- Goal text is rendered
- a helper output exists
- a response item is constructed but not in final input
- same-turn metadata is accepted
- a turn is reserved
- finalization returns an error
- prompt construction fails before submission
- final input is built but the request is not submitted under the default
  live-correctness policy
- stream setup fails before model execution begins
- submission fails before `ResponseEvent::Created`
- raw notifications or typed projections expose Goal-looking items

Stream failure after `ResponseEvent::Created` does not undo committed durable
effects, committed carry, or any committed evidence because the model request
has entered execution.

## Retry, Follow-Up, And Stale Metadata

Finalization must run for every model request attempt. It must not shape only
the first pre-loop input snapshot.

Retry before commit leaves pending Initial, ObjectiveUpdated, and BudgetLimit
intent pending and leaves the automatic Continuation suppression record
unchanged. If final input is built but not submitted, the default is no
pending-intent consumption and no Continuation suppression advancement. Any
claim that a structured evidence path proves otherwise must satisfy the
recorded-evidence doc's non-best-effort persistence and error-policy boundary.

Submission failure before `ResponseEvent::Created` defaults to leaving
pending non-Continuation intent pending and leaving the Continuation
suppression record unchanged unless an explicit retry policy is chosen and
tested.

Retry after commit reruns finalization against committed durable state,
current history, committed carry, and current pending or suppression state.

Same-turn follow-up after tool output, mailbox input, or other pending work
must assemble fresh finalization context from durable Goal state, pending
intent or Continuation suppression state, optional new request metadata, and
committed carry. It must not reuse stale pre-commit request metadata as if the
original cadence request were still pending.

Uncommitted same-turn or Goal-owned synthetic request metadata may survive
retries before `ResponseEvent::Created`. A Created-event commit must clear or
make that metadata obsolete for follow-up shaping. If the metadata becomes
stale before submission because durable facts, pending intent, reservation,
pending-work ordering, or Continuation preflight state no longer matches, the
request must abort or decline before model submission without consuming
intent, advancing suppression, writing evidence, or surfacing as a user-facing
model/request failure for a stale Goal-owned turn.

The idle/history doc owns the lifecycle of Goal-owned synthetic request
metadata and stale synthetic aborts. This doc owns the retry and follow-up
finalization rule once a request attempt proceeds toward model submission.

## Current-Turn Committed Carry

Current-turn carry is committed metadata for a Goal item already included in
final request input and committed for this turn. It is not durable Goal state,
pending intent, evidence persistence, request metadata, or prebuilt model
input.

Logical shape:

```text
CommittedGoalRequestCarry {
  turn_id,
  goal_id,
  kind,
  facts_version,
  model_visible_history_key,
  item_fingerprint,
}
```

Committed carry may support same-turn follow-up accounting or mid-turn
compaction repair for an item already finalized and committed. It cannot
create new cadence intent, prove a different request attempt, or store a
concrete `ResponseItem` or `ResponseInputItem` waiting to be injected.

Uncommitted same-turn recheck metadata and Goal-owned synthetic request
metadata are not carry. Source request metadata must stop driving follow-up
after Created-event commit records committed carry for the selected item.

## Evidence Metadata Boundary

Finalization owns the commit metadata and finalized-input identity that
structured evidence may persist. It does not own evidence carrier storage,
replay semantics, rollback/fork treatment, compaction treatment, raw/typed
projection behavior, or evidence failure policy.

When recorded rollout or thread history is used as replay or audit evidence,
the evidence must represent the same logical finalized request input captured
by this doc's fingerprints, item index, attempt ordinal, selected kind, Goal
identity, facts version, model-visible history key, and commit point.

Ordinary rollout `ResponseItem`s, rollout trace payloads, raw response item
notifications, typed projections, classifier matches, rendered Goal text, and
helper output are not structured Goal request evidence.

Evidence metadata must not include parsed objective text, rendered prompt body
fields, budget facts recovered from text, or legacy marker-derived facts.
Evidence must not materialize model input or provide an active steering path.

## Producer And Adapter Boundary

Producer-facing Goal code may create durable facts, pending-intent summaries,
accounting outcomes, and metadata-only wake or recheck requests. It must route
active steering through this final request-input contract.

Goal lifecycle, app-server, and extension adapters may own:

- tool command handling
- protocol and state conversion
- validation
- external Goal mutation entry points
- usage accounting entry points
- metrics and event facts
- prompt-body helpers when those helpers remain small and do not construct
  active model input
- producer-facing metadata requests for same-turn recheck or idle wakeup

They must not own:

- per-attempt final request-input shaping
- selected item insertion or verification
- active model role selection
- final request-input cleanup or repair decisions
- commit metadata construction
- pending-intent selection for a request attempt
- pending-intent consumption
- Continuation suppression advancement
- recorded request evidence writes
- pre-finalizer concrete Goal item injection as authority

Concrete module names such as a private `goal_cadence` route or a
`goals.rs` adapter are implementation terrain. The contract is the ownership
split: adapters may feed durable facts and typed metadata into finalization,
but the finalizer owns the actual model input and commit metadata for each
attempt.

## Primary Pointers

- `goal-authority-behavior.md` owns the behavioral authority rule; this doc
  owns the mechanics that make that proof real for a request attempt.
- `goal-cadence-contract.md` owns due timing and ranking; this doc applies the
  selected kind to one finalized request opportunity.
- `goal-durable-state-and-pending-intent.md` owns durable facts, pending
  non-Continuation intent, exact-key operations, and state-owned Continuation
  suppression storage. This doc owns commit timing and the call site.
- `goal-idle-history-lifecycle.md` owns idle selection, Goal-owned synthetic
  metadata, model-visible history key computation, and suppression comparison.
  This doc commits advancement only after final input reaches execution.
- Cleanup/projection, evidence, extension, and test-prep docs own their
  support surfaces; this doc owns only final-input cleanup, emitted commit
  identity, producer routing into the shared finalizer, and local proof
  obligations.

## Local Proof Obligations

Final-input coverage must prove:

- Initial final request input contains exactly one current outer
  developer-role Goal item and no active `<goal_context>` item
- ObjectiveUpdated renders from persisted updated durable facts and commits
  only the matching pending intent
- BudgetLimit renders from persisted usage/status and objective facts and may
  clear only explicitly superseded stale intent after exact commit
- automatic Continuation appears only when selected by idle lifecycle and
  advances suppression only after final-input commit
- feature or collaboration-mode ineligibility selects no active Goal item and
  consumes no pending intent
- ordinary user turns do not receive fresh Continuation merely because a Goal
  is active, but may deliver already-pending non-Continuation intent
- stale, duplicate, wrong-role, legacy, and pre-injected Goal-looking items
  are removed, ignored, or replaced inside finalization
- helper output, projection output, raw notifications, rendered text,
  reservation, same-turn metadata, pre-finalizer concrete carry, and active
  durable state alone are rejected as authority or commit proof
- item fingerprint, request-input fingerprint, item index, attempt ordinal,
  and inserted-or-verified status identify the exact finalized input
- no pending intent is consumed and no Continuation suppression advances
  before `ResponseEvent::Created`
- retry before commit leaves pending intent and suppression unchanged
- same-turn follow-up reruns finalization from rebuilt context after commit
- current-turn carry stores committed metadata, not prebuilt model input, and
  cannot prove a different request attempt
- previous-response or model-context reuse is accepted only when it proves the
  finalized logical input already contains the selected current
  developer-role item
- final payload tests inspect the captured finalized request input, or
  structured recorded request evidence tied to the same logical input when
  evidence is in scope

The test-prep successor doc owns how these obligations join the broader state,
idle/history, evidence, repair/projection/raw, extension, and UI proof matrix.
