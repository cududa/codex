# Work Area Instructions

Work Area docs are coarse planning regions for the v136 Goal rewrite. They
should be usable by an agent that knows only the current v136 tree, the parent
`AGENTS.md`, the `local/goal_research` authority docs, and the active Work
Area file.

A Work Area is not a checkpoint, release phase, PR boundary, or promise that
the branch builds after that region alone. It names a topic/dependency region
so related work can be planned without turning the whole rewrite into one
unusable document.

The authority docs still win. This file adds work-area-local guardrails so the
implementation route stays compatible with the ownership model in the
authority docs.

## Implementation Pass Posture

Implementation pass docs are ordered units of work for one branch. They are
meant to be picked up in succession across compactions, not merged, released,
or accepted as independent units.

Implementation passes exist to solve a practical workload problem: some Work Area
docs are too large for one agent window, but a split by headings or word count
creates fake work units. Keep the split tied to actual implementation seams.

When a pass says what must exist before or after it, read that as task ordering
and handoff state. Do not add no-op modules, artificial compile states,
test-only hooks, or broad adapter APIs merely to make a pass look
self-contained. Focus validation on behavior or interfaces actually introduced
by the pass. Final rewrite acceptance belongs to the final cleanup and
acceptance work, not to every Work Area or pass.

When creating or revising implementation pass docs, follow
`implementation-pass-planning-rules.md` in this directory. Do the relevant
tree-walk before naming boundaries; a plausible split from the Work Area prose is
not enough. Prefer direct pass planning after targeted code reads when the
Work Area has clear seams. Use an appendage map only for broad, cross-cutting
Work Areas where it compresses the route for the next agent instead of becoming
another planning layer. Work Area 02 should use direct implementation pass
planning from targeted request-construction reads, not a prep-map layer.

## Migration-Stable Goal Ownership

- Keep durable Goal facts and pending cadence intent in state APIs.
- Keep final active Goal model-input construction in the Work Area 02 final
  request-input shaping path at core request assembly, where the actual
  per-attempt `Vec<ResponseItem>` becomes `Prompt.input`.
- Treat `codex-rs/core/src/goals.rs` references in Work Area docs as v136 terrain
  and transitional adapter work. Do not grow it into a new long-lived Goal
  service, runtime, or orchestration module.
- Default Work Area 04 to converting the existing v136 `ext/goal`
  adapter/runtime path. Introduce an `ext/goal` service facade only when a
  code-grounded pass proves the adapter/runtime route cannot carry shared
  app-server, extension, and tool mutation ordering. Do not create a parallel
  core `GoalService`.
- State and service outcomes should carry durable facts, previous facts,
  pending intent metadata, accounting effects, or typed delivery requests.
  They must not carry prebuilt active Goal `ResponseItem` /
  `ResponseInputItem` values as authority.
- Same-turn Goal delivery requests must carry metadata or wake/recheck intent,
  not rendered Goal prompt text and not model-visible items.
- `ext/goal` may own lifecycle, tools, accounting, metrics, mutation entry
  points, prompt-body helpers, and typed cadence data. It must not choose the
  active steering role, construct active model input, consume pending intent,
  advance Continuation watermarks, or commit delivery.
- Do not treat baseline product behavior as permission to preserve
  user-role active steering, active `<goal_context>`, `GoalContextRole`,
  concrete pre-finalizer Goal injection, or Goal-every-turn behavior.

## Core Adapter Rule

When a Work Area says to edit `codex-rs/core/src/goals.rs`, keep the edit bounded
to the existing v136 producer or adapter responsibility needed for that Work Area.
Prefer moving shared authority behavior into the private
`codex-rs/core/src/goal_cadence/` module directory or the state APIs named by
the Work Area. Prefer the Work Area 04 v136 adapter/runtime conversion for
shared Goal mutation ordering; introduce an extension service facade only with
a code-grounded reason.

Do not add broad public core APIs that make later extension ownership harder.
If the only reason for a core helper is to support one local caller, keep the
logic at the caller instead of adding the helper.

## File Ownership Map

Use this map to resolve ambiguous "edit this file" instructions inside Work Area
docs:

- `codex-rs/state/src/runtime/goals.rs` owns durable facts, facts versions,
  pending cadence intent, exact-key consumption, and Continuation watermark
  storage. It does not choose request cadence or construct model input.
- `codex-rs/core/src/goal_cadence/` owns the active Goal authority seam:
  per-attempt final request-input shaping, Goal artifact cleanup, cadence
  selection, developer-role Goal `ResponseItem` construction,
  model-visible history key projection, and commit metadata. Its external
  interface should stay small; callers pass base request input plus typed
  facts/request metadata and receive a submit-or-internal-abort outcome.
- `codex-rs/core/src/session/turn.rs` owns sampling placement: call the
  finalizer before `build_prompt(...)` on every attempt and commit on
  `ResponseEvent::Created`.
- `codex-rs/core/src/goals.rs` is v136 legacy terrain and transitional
  adapter/prompt-body helper work. It is not the long-lived service,
  scheduler, finalizer, role owner, or model-input owner.
- `codex-rs/core/src/session/input_queue.rs` and
  `codex-rs/core/src/state/turn.rs` may carry pending-work state,
  cadence-delivery metadata, and committed carry metadata. They must not carry
  rendered Goal prompts or prebuilt Goal `ResponseInputItem`s as authority.
- `codex-rs/core/src/codex_thread.rs` is the public thread-facing adapter for
  extension and app-server callers. If `ext/goal` needs to request cadence
  work, the callable type must be public from core or translated by
  `CodexThread` into private `goal_cadence` metadata.
- `codex-rs/ext/goal/src/tool.rs`, `runtime.rs`, and `extension.rs` remain the
  default v136 adapter/runtime topology. They may own lifecycle, runtime
  accounting, metrics, events, durable state calls, and typed cadence requests.
  They must not preserve independent active-steering injection chains.
- `codex-rs/ext/goal/src/api.rs`, if introduced by Work Area 04, is a thin
  optional facade for shared mutation/accounting ordering and typed cadence
  delivery requests. It does not construct active model input or commit
  delivery, and it must be justified against the default adapter/runtime route.
- `codex-rs/ext/goal/src/steering.rs` should be deleted or reduced to
  prompt-body helpers only; it must not output active steering items.
