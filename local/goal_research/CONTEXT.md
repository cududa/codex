# Goal Research Context

This file defines the domain language used by the Goal authority docs. It is a
glossary only. It does not define implementation plans, code ownership, or test
requirements.

This file remains the glossary container for successor topology work. Do not
split its vocabulary into a long-lived `goal-glossary.md` successor authority
doc.

## Glossary

**Goal** - A persisted thread objective with status, budget, usage, and timing
facts. A Goal can influence model behavior only through the authority rules
defined by the Goal authority contracts.

**Goal authority** - The condition where the model actually receives current
Goal steering as developer-role model input. State, UI, hidden markers,
projections, rendered marker text, and tool output are not Goal authority by
themselves.

**Active Goal steering** - The current Goal steering content that may become a
model-visible developer-role item when cadence or repair requires it.

**Durable Goal facts** - Persisted structured facts about the current Goal:
identity, objective, status, budget, usage, and timestamps.

**Durable Goal state** - Durable Goal facts plus structured durable cadence
state. It is the source of truth for current Goal facts, not a rendered model
item.

**Durable facts version** - A durable identity for the Goal facts used to render
or validate Goal steering. It changes when steering-relevant Goal facts change.

**Cadence** - The rules that decide when Goal steering is due. Cadence decides
when Goal should speak; repair does not.

**Cadence event** - A specific reason Goal steering becomes due. The cadence
events are Initial, ObjectiveUpdated, BudgetLimit, and automatic Continuation.

**Steering kind** - The kind of Goal steering being delivered: Initial,
ObjectiveUpdated, BudgetLimit, or Continuation.

**Automatic Continuation** - A Goal-owned synthetic turn selected only by the
idle lifecycle after pending non-Goal work and pending durable cadence intent
are absent. It is not any next request.

**Supersedence** - Choosing the correct due steering kind when more than one
could apply to the same final request opportunity. BudgetLimit outranks
ObjectiveUpdated, Initial, and Continuation.

**Pending cadence intent** - Structured durable state recording that Initial,
ObjectiveUpdated, or BudgetLimit steering remains due until final model request
input contains the matching developer-role Goal item.

**Exact-key consumption** - Clearing pending cadence intent only when the
thread, Goal, steering kind, and durable facts version match the delivered
Goal item.

**Cadence item** - A developer-role Goal steering item recorded because cadence
requires Goal steering for the request.

**Final model request input** - The actual logical input list for the model
request. Goal authority is proven only at this level, not by helper output,
rendered text, reservation, or pre-shaper carry.

**Final request-input shaping** - The per-attempt operation that inspects the
actual model input list, cleans or repairs Goal-looking items as allowed,
selects at most one due Goal item, and returns commit evidence for that exact
item.

**Selected Goal item** - The one current Goal steering item chosen for a
request opportunity by cadence or final request-input shaping.

**Current Goal authority** - A current, non-legacy, non-duplicated,
developer-role Goal steering item that matches current durable Goal state and is
present in final model request input.

**Cadence-required Goal authority** - Goal authority required by a real cadence
obligation for the current request, or by seam preservation or repair of an
already-required cadence item. Active durable Goal state alone is not
cadence-required authority.

**Commit** - The point where a Goal steering item that is present in final model
request input is known to have entered model execution. Pending intent and
Continuation suppression update only at a valid commit point.

**Commit metadata** - Structured evidence tying a delivered Goal item to its
request, turn, Goal, steering kind, durable facts version, model-visible history
key, and item fingerprint.

**Item fingerprint** - A stable identity for the exact Goal steering item in
final model request input. It proves commit or carry evidence refers to the
item sent to the model, not to helper output.

**Request repair** - A backstop that restores or corrects cadence-required Goal
authority when a seam would otherwise lose, stale, duplicate, or downgrade it.
Repair is request-local by default and is not cadence.

**Repair item** - A developer-role Goal steering item inserted, replaced, or
deduplicated by repair to preserve cadence-required authority across a seam.

**Seam** - A place where model-visible context can be rebuilt, filtered,
compacted, resumed, rolled back, forked, retried, or transferred through a
model-context path.

**Legacy Goal artifact** - A pure old rendered Goal marker item. It may be
recognized for cleanup or projection hiding only. It must not recover active
Goal state, decide cadence, or create new active steering.

**Generic internal context** - Source-tagged internal text infrastructure,
such as `<codex_internal_context source="goal">...</codex_internal_context>`,
that may render and classify internal context and support projection cleanup.
It can identify provenance, but it is not an authority mechanism by itself.

**Pure item** - A model item, normally a whole message with one text content
item, that wholly consists of one recognized internal or legacy representation,
with no mixed visible prose.

**Mixed or ordinary item** - A model item containing ordinary prose or a mix of
ordinary prose and marker-like text. It must remain visible ordinary content and
must not be treated as Goal authority or cleanup-only artifact.

**Classifier** - A cleanup and projection tool that identifies pure current
Goal internal-context items, pure legacy artifacts, non-Goal internal context,
or mixed ordinary content. A classifier does not decide cadence or prove
authority.

**Typed or materialized projection** - A user-facing parsed view of model
history that may hide pure current or legacy Goal items. Projection hiding is
not Goal authority.

**Raw response item notification** - The raw event stream for response items.
It remains raw and must not get Goal-specific suppression unless the general raw
response contract changes.

**Current-turn carry** - Turn-local evidence that a Goal cadence item was
already included in final model request input for the active turn. It is not
durable Goal state and does not create cadence intent.

**Model-visible history key** - A key for the model-visible non-Goal progress
that can justify another automatic Continuation for the same active Goal and
durable facts version.

**Eligible progress projection** - The subset or fingerprint of model-visible
non-Goal progress used to compute the model-visible history key. Goal steering,
repair, cleanup, and pure internal-context items are excluded.

**Continuation watermark** - A state-owned latest automatic Continuation
suppression record, or an equivalent durable/reconstructable record, for a
committed automatic Continuation tied to a specific Goal, model-visible history
key, and durable facts version.

**Idle lifecycle hook** - The lifecycle operation that runs only when the
thread may be idle, starts pending non-Goal work first, then delivers pending
durable cadence intent if due, and only then considers automatic Continuation.

**Pending non-Goal work** - Queued user, mailbox, or other regular work that
should run before Goal-owned synthetic turns.

**Goal-owned synthetic turn** - A runtime-started turn whose purpose is to
deliver pending durable Goal cadence intent or automatic Continuation when no
pending non-Goal work should run first.

**Turn reservation** - A runtime claim to launch a turn. Reservation is not
commit, does not prove final model request input, and does not consume pending
intent.

**Hydration** - Reloading durable Goal facts, pending intent, and runtime
accounting basis after resume. Hydration is not cadence.

**Structured cadence request** - A typed request to wake or deliver Goal cadence
work that carries cadence metadata instead of model input. Extension code may
issue such requests without owning active Goal authority.

**Reachable extension steering** - An extension path that can still produce
active Goal model input or directly inject active Goal steering under supported
configuration. It must be converted, removed, or proven unreachable.

**Upstream baseline** - The upstream Goal product behavior used as the baseline
when deleting local overlay tests.

**Local overlay** - Fork-specific Goal behavior or tests layered over the
upstream baseline. Some local overlay tests are false-compatibility pressure for
the broken active steering path.

**Replacement test profile** - The new tests added after active steering is
replaced to prove final model input, durable cadence, idle lifecycle, repair,
legacy artifact, and local behavior contracts.

**Runtime archaeology** - Recovering active Goal facts, objective text, budget
state, or cadence intent by parsing rendered historical Goal text. Runtime
archaeology is forbidden.
