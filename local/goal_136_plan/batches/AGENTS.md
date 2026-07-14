# Batch Plan Instructions

These batch docs are v136 execution artifacts. They should be executable by an
agent that knows only the current v136 tree, the parent `AGENTS.md`, the
`local/goal_research` authority docs, and the active batch file.

The authority docs still win. This file adds batch-local guardrails so the
implementation route stays compatible with the ownership model in the
authority docs.

## Slice Execution Posture

Slice docs are ordered work packets for one branch. They are meant to be
picked up in succession across compactions, not merged, released, or accepted
as independent units.

When a slice says what must exist before or after it, read that as task
ordering and handoff state. Do not add no-op modules, artificial compile
states, test-only hooks, or broad adapter APIs merely to make a slice look
independently complete. Focus validation on behavior or interfaces actually
introduced by the packet, and leave integrated acceptance to the owning batch
acceptance packet.

When creating or revising slice docs, follow `slice-planning-rules.md` in this
directory. Do the relevant tree-walk before naming boundaries; a plausible
split from the batch prose is not enough.

## Migration-Stable Goal Ownership

- Keep durable Goal facts and pending cadence intent in state APIs.
- Keep final active Goal model-input construction in the Batch 02 final
  request-input shaping path at core request assembly, where the actual
  per-attempt `Vec<ResponseItem>` becomes `Prompt.input`.
- Treat `codex-rs/core/src/goals.rs` references in batch docs as v136 terrain
  and transitional adapter work. Do not grow it into a new long-lived Goal
  service, runtime, or orchestration module.
- If a shared mutation/accounting owner is needed, use or introduce the
  Batch 04 `ext/goal` `GoalService`-style boundary. Do not create a parallel
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

When a batch says to edit `codex-rs/core/src/goals.rs`, keep the edit bounded
to the existing v136 producer or adapter responsibility needed for that batch.
Prefer moving shared authority behavior into `codex-rs/core/src/goal_cadence.rs`
or the state APIs named by the batch. Prefer moving shared Goal mutation
ordering into the Batch 04 extension service boundary.

Do not add broad public core APIs that make later extension ownership harder.
If the only reason for a core helper is to support one local caller, keep the
logic at the caller instead of adding the helper.

## File Ownership Map

Use this map to resolve ambiguous "edit this file" instructions inside batch
docs:

- `codex-rs/state/src/runtime/goals.rs` owns durable facts, facts versions,
  pending cadence intent, exact-key consumption, and Continuation watermark
  storage. It does not choose request cadence or construct model input.
- `codex-rs/core/src/goal_cadence.rs` owns the active Goal authority seam:
  per-attempt final request-input shaping, Goal artifact cleanup, cadence
  selection, developer-role Goal item construction, model-visible history key
  projection, and commit metadata.
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
- `codex-rs/ext/goal/src/api.rs` owns the extension-side `GoalService` style
  interface for mutation/accounting ordering and typed cadence delivery
  requests. It does not construct active model input or commit delivery.
- `codex-rs/ext/goal/src/tool.rs`, `runtime.rs`, and `extension.rs` are
  adapters into that service and runtime accounting. They must not preserve
  independent active-steering injection chains.
- `codex-rs/ext/goal/src/steering.rs` should be deleted or reduced to
  prompt-body helpers only; it must not output active steering items.
