Upstream already moved Goal lifecycle out of core/src/goals.rs. In those refs, there is no codex-rs/core/src/
goals.rs; Goal lives in codex-rs/ext/goal, and app-server depends on codex-goal-extension.

But upstream did not solve your authority problem. It moved ownership to ext/goal while still handing prebuilt
model-visible ResponseItems into core.

Upstream Shape

Useful upstream direction:

- ext/goal/src/api.rs has GoalService.
- App-server routes thread/goal/set|get|clear through GoalService.
- GoalService registers live GoalRuntimeHandles by thread.
- GoalRuntimeHandle owns lifecycle/accounting:
    - thread start/resume/idle/stop
    - turn start/stop/abort/error
    - token usage
    - tool finish accounting
    - external mutation accounting/order

- Core exposes generic extension bridges:
    - ThreadManager / CodexThread::try_start_turn_if_idle(...)
    - CodexThread::inject_if_running(...)
    - thread idle lifecycle emission after active turn clears

Bad upstream direction for this fork:

- ext/goal/src/steering.rs constructs ResponseItems.
- It uses ContextualUserFragment::into(InternalModelContextFragment::new(source="goal", ...)), which is user-
  role.

- runtime.continue_if_idle() builds a Continuation item and calls thread.try_start_turn_if_idle(vec![item]).
- ObjectiveUpdated and BudgetLimit build items and call active-turn injection.
- There is no durable pending Initial/ObjectiveUpdated/BudgetLimit intent and no Created-event commit discipline
  in that upstream shape.

So I would treat upstream as the ownership migration map, not the authority implementation.

Recommended Direction

For your architecture, ext/goal should own Goal lifecycle, accounting, mutation ordering, idle predicate, and
typed cadence requests. Core should not own Goal Continuation policy. But core still must host the final request-
input seam because only request assembly sees the actual per-attempt Vec<ResponseItem> before Prompt.input.

So the clean shape is:

ext/goal owns Goal semantics
core owns generic request-finalization and lifecycle hook plumbing
ext/goal implements/uses that plumbing for Goal

That implies the Work Area 02/03 rewrite should avoid hardening core/src/goal_cadence.rs into a long-lived Goal
policy module if the migration target is “only ext/goal.”

Instead, either:

1. Make core/src/goal_cadence.rs explicitly transitional and extraction-shaped, or
2. Better: define a generic core/extension final-request-input hook, with ext/goal providing the Goal finalizer/
    commit behavior.

The second matches upstream’s direction more naturally and avoids re-centralizing Goal in core.

Interface Shape

The missing core host interface is something like:

trait RequestInputFinalizer {
    fn finalize_request_input(
        &self,
        ctx: FinalizationContext,
        base_input: Vec<ResponseItem>,
    ) -> impl Future<Output = FinalizationDisposition> + Send;

    fn commit_request_input(
        &self,
        commit: ExtensionCommitToken,
    ) -> impl Future<Output = Result<()>> + Send;
}

Then ext/goal owns the Goal-specific implementation:

load durable Goal cadence snapshot
select BudgetLimit > ObjectiveUpdated > Initial > Continuation
render current Goal text
insert exactly one developer-role Goal item
return Goal commit token
on Created, consume exact pending intent or advance Continuation watermark

Core remains generic:

run_sampling_request
  -> build base input
  -> call registered request-input finalizers
  -> build_prompt(finalized_input)
  -> on ResponseEvent::Created, call commit for returned tokens

Continuation With ext/goal

For Continuation specifically, upstream’s runtime.continue_if_idle() should become:

ext/goal on_thread_idle
  -> acquire Goal runtime/state permit
  -> verify no active turn / no pending non-Goal work through core host API
  -> load durable Goal snapshot and pending intent snapshot
  -> if pending durable intent exists, request cadence-delivery turn metadata
  -> else compute/preflight model_visible_history_key
  -> if watermark allows, request automatic-continuation turn metadata

But it must not pass Vec<ResponseItem> to core.

Instead of upstream:

try_start_turn_if_idle(vec![continuation_item])

you want:

try_start_extension_turn_if_idle(GoalIdleRequest::AutomaticContinuation { ... })

Then the request finalizer sees that metadata and decides whether to insert the developer-role Goal item from
actual per-attempt base input.

Key Questions Before Rewriting 02/03

These should be answered explicitly before splitting 03 again:

- Is the finalizer a core Goal module, an ext/goal implementation of a generic core hook, or a temporary core
  module with a removal plan?

- How do we avoid a crate cycle? ext/goal already depends on codex-core, so core cannot directly depend on codex-
  goal-extension. A generic trait likely belongs in codex-extension-api or a small shared crate.

- What replaces try_start_turn_if_idle(Vec<ResponseItem>) for Goal? It needs metadata, not model input.
- What replaces inject_if_running(Vec<ResponseItem>) for ObjectiveUpdated/BudgetLimit? Again, metadata/wake/
  recheck, not model input.

- Who owns model_visible_history_key computation if finalization lives in ext/goal? The finalizer needs the
  actual base input; classifier/rendering helpers may need to be shared.

- How does core store returned commit tokens until ResponseEvent::Created without knowing Goal internals?
- How does app-server resume preserve upstream ordering: emit snapshot first, then call idle lifecycle?
- Which upstream GoalService methods are adapted to write durable pending intent instead of facts-only state?

My read: if 02 is written as “add core/src/goal_cadence.rs and put all Goal finalizer policy there,” it risks
fighting the 139/140 migration direction. If it is written as “core hosts the final request-input seam; ext/goal
owns Goal semantics through that seam,” then 03’s Continuation work has a stable home and should stop failing
from ambiguous ownership.