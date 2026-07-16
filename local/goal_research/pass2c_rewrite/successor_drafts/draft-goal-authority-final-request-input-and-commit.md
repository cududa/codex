# Goal Authority Final Request Input And Commit

Status: Pass 2C staged successor. It becomes standing authority only through
cutover; closed sections are written as successor contract text.

## Role

This target is the central final model-input seam for active Goal authority.
It implements the behavior-level authority rule by owning the actual
per-attempt request input that reaches the model client.

This target owns:

- per-attempt final request-input shaping;
- selected Goal item insertion or verification;
- stale, wrong-role, duplicate, legacy, and pre-injected Goal-looking item
  cleanup inside final shaping;
- commit metadata and the commit point for selected Goal delivery;
- retry and follow-up shaping behavior;
- current-turn carry replacement as committed metadata rather than
  pre-finalizer concrete model input; and
- the remaining `goals.rs` adapter boundary where it touches final input.

This target does not own behavioral truth about what Goal authority means,
durable mutation semantics, idle scheduling, extension lifecycle, general
cleanup/projection mechanics outside final shaping, recorded-evidence
persistence, test-prep deletion policy, or reader navigation.

## Purpose

The replacement architecture is not a new context helper layer. It is
per-attempt ownership of the actual model request input.

This successor consolidates the final-input parts of the earlier
cadence-module, finalizer/commit, and `goals.rs` adapter design notes. Cadence,
durable, history, cleanup, evidence, and extension targets supply their owned
inputs; this target owns the seam where those inputs become, or fail to become,
final model request input.

## Request Path

The current model request path is:

```text
codex-rs/core/src/session/turn.rs
  run_sampling_request(...)
  -> build_prompt(input, ...)

codex-rs/core/src/client_common.rs
  Prompt { input: Vec<ResponseItem> }

codex-rs/core/src/client.rs
  build_responses_request(...)
  -> let input = prompt.get_formatted_input()

codex-rs/codex-api/src/common.rs
  ResponsesApiRequest { input: Vec<ResponseItem> }
```

`ResponseItem::Message.role` is the model role. There is no deeper authority
layer after `Prompt.input`.

The final request-input shaping point must run for every request attempt after
that attempt's base `Vec<ResponseItem>` is known and before `build_prompt(...)`
hands it to the model client.

## Core Rule

Active Goal authority is established only when the final request input contains
exactly one selected current Goal item:

```text
ResponseItem::Message {
  role: "developer",
  content: [ContentItem::InputText { text: current rendered Goal context }],
  ...
}
```

Rendering text, constructing helper output, injecting a `ResponseInputItem`,
reserving a turn, or carrying current-turn metadata is not authority and is not
a commit.

Commit refers only to the selected current Goal item that was in the final
request input for that attempt. Commit metadata, commit timing, and side-effect
ordering are defined by the commit sections, and they remain tied to that
selected final-input item.

## Final Request-Input Shaping

The request-input shaper owns Goal authority for one model request attempt. It
runs after that attempt's base `Vec<ResponseItem>` is known and before the input
becomes `Prompt.input`.

Its logical contract is:

```text
finalize_goal_request_input(
  attempt_context,
  base_input: Vec<ResponseItem>,
) -> FinalizedGoalRequestInput
```

`attempt_context` includes the logical equivalents of thread id, turn id,
attempt ordinal, current durable Goal snapshot with facts version, pending
Initial, ObjectiveUpdated, and BudgetLimit intent snapshot, optional runtime
Continuation request selected by the idle lifecycle, feature and collaboration
eligibility facts, model-visible history key for the attempt, transport context
for the full logical request versus WebSocket delta, and request-local repair
context for compaction, resume, rollback, reconstruction, retry, and
previous-response or model-context transitions.

`FinalizedGoalRequestInput` returns:

```text
input: Vec<ResponseItem>
commit: Option<GoalRequestCommit>
repair_report: GoalRepairReport
```

The returned `input` is the only shaped model input for the attempt. `commit`
is inert metadata for the exact selected final-input item, and `repair_report`
is diagnostic and test support, not cadence authority.

If the Goals feature is disabled or the collaboration mode does not allow Goal
steering for the attempt, the shaper selects no active Goal item and consumes no
pending cadence intent. Eligibility facts are delivery gates only. They are not
cadence authority, durable Goal facts, helper authority, or proof that Goal
steering reached final model request input.

## Shaping Responsibilities

For every attempt, the shaper must inspect the actual `Vec<ResponseItem>` that
would otherwise become `Prompt.input`. It must classify pure current Goal
internal-context items and pure legacy `<goal_context>` artifacts, then remove,
ignore, or replace stale, wrong-role, duplicate, legacy, and pre-injected
Goal-looking items according to the authority and cleanup contracts.

After cleanup, the shaper selects at most one Goal cadence item for the request.
It renders selected Goal text from current durable Goal facts, inserts or
verifies exactly one outer developer-role Goal `ResponseItem` when
cadence-required authority is due, and returns commit metadata tied to that
exact item.

The shaper does not insert Goal steering merely because an active durable Goal
exists. Same-turn or idle request metadata asks the shaper to re-run selection
from current durable facts, eligibility, and supersedence; it is not prebuilt
model input, selected authority, or pending-intent consumption.

## Selection Order

When more than one Goal item is due for the same request opportunity, the shaper
applies this order:

```text
BudgetLimit
ObjectiveUpdated
Initial
Continuation
```

BudgetLimit supersedes ObjectiveUpdated, Initial, and Continuation for the
opportunity. ObjectiveUpdated supersedes Initial and Continuation. Initial is
selected only when no higher-priority pending intent is due. Continuation is
selected only from a runtime request chosen by the idle lifecycle, and it never
supersedes persisted pending Initial, ObjectiveUpdated, or BudgetLimit intent.

## Current Terrain To Replace

The current terrain that this target must account for includes:

- `run_sampling_request(...)` receives an initial `Vec<ResponseItem>`, while
  later retry attempts rebuild prompt input from
  `sess.clone_history().await.for_prompt(...)`;
- `build_prompt(...)` is the last local construction point before the model
  client receives request input;
- `ResponseEvent::Created` currently has no Goal commit behavior;
- current Goal steering builds concrete `ResponseInputItem`s through
  `GoalContext::into_response_input_item(...)`; and
- current concrete same-turn injection and carry store concrete Goal
  `ResponseInputItem`s before final request shaping.

Helper output, active-turn injection, reservation, and pre-finalizer carry are
not commits.
