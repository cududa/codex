# Open Decisions

This file tracks decisions that should not be silently resolved by source
shape. Each item should say what it blocks and which slice owns resolution.

## Decision States

- `open`: needs user, reviewer, or later research decision.
- `defaulted`: a default direction exists, but final prose should still name
  the choice.
- `resolved`: decision has been recorded in the owning live doc or accepted
  work-packet posture.

## Source Authority Unit

- State: open.
- Slice: `slices/01-source-corpus-map.md`.
- Question: What is the unit that carries invocation authority: `TurnInput`
  variant, original `Op`, source producer, message role, structured mention
  type, or a new normalized source classification?
- Default: Source provenance should decide eligibility; message role and
  response shape alone are insufficient.
- Blocks: authority map, mention resolution Interface, implementation plan.
- Future owner: `invocation-authority.md` or `source-provenance.md`.

## Skills, Plugins, And Apps Share Policy

- State: open.
- Slice: `slices/03-open-decisions.md`.
- Question: Should skills, plugins, and apps use the same invocation-bearing
  source policy, or can each family define separate accepted sources?
- Default: Use one source policy unless research finds a product-level reason
  to split them.
- Blocks: proof matrix and collection Interface design.
- Future owner: `invocation-authority.md`.

## Response-Shaped User-Like Input

- State: open.
- Slice: `slices/01-source-corpus-map.md`.
- Question: Which response-shaped items represent fresh user or trusted runtime
  instructions rather than replay, evidence, or helper context?
- Default: Do not infer from `ResponseItem::Message { role: "user" }` alone.
- Blocks: bug fix design.
- Future owner: `source-provenance.md`.

## Mailbox And Inter-Agent Communication

- State: open.
- Slice: `slices/03-open-decisions.md`.
- Question: Can mailbox or inter-agent communication text invoke skills,
  plugins, or apps in the recipient turn?
- Default: Treat as open. It is task-like and model-visible, but may also carry
  quoted content or child-output summaries.
- Blocks: subagent-related test cases and source policy.
- Future owner: `source-provenance.md`.

## Goal Continuation And Synthetic Work

- State: open.
- Slice: `slices/01-source-corpus-map.md`.
- Question: Can goal continuation, queued task continuation, or synthetic
  runtime work include operative skill/plugin/app invocations?
- Default: Do not couple this to Goal authority. Research the source category
  independently and keep Goal docs as related terrain.
- Blocks: continuation bug coverage.
- Future owner: `source-provenance.md`.

## Additional Context

- State: open.
- Slice: `slices/01-source-corpus-map.md`.
- Question: Should additional context converted to `ResponseItem` be scanned
  for mentions?
- Default: No by default; additional context sounds model-visible-only unless
  a producer marks it as operative.
- Blocks: source map and negative proof.
- Future owner: `source-provenance.md`.

## Hook Output

- State: open.
- Slice: `slices/01-source-corpus-map.md`.
- Question: Can hook output or hook-provided additional context invoke skills,
  plugins, or apps?
- Default: No by default; hook output should not silently expand runtime tool
  exposure without an explicit contract.
- Blocks: hook terrain classification and negative proof.
- Future owner: `source-provenance.md`.

## Structured Mentions In Response-Shaped Sources

- State: open.
- Slice: `slices/02-concept-ledger.md`.
- Question: If response-shaped sources are allowed to invoke anything, must
  they carry structured selections rather than plain `$name` text?
- Default: Open. Structured selections are more explicit, but the motivating
  bug includes plain text `$task-alignment`.
- Blocks: mention-resolution Interface.
- Future owner: `mention-resolution.md`.

## Injection Timing

- State: open.
- Slice: `slices/04-authority-map.md`.
- Question: Should invocation detection occur before input is recorded, during
  pending-input drain, or as part of request assembly before `Prompt.input`?
- Default: Detection should happen before sampling for the current turn, but
  the exact seam must follow source policy and retry/follow-up behavior.
- Blocks: implementation planning.
- Future owner: `injection-placement.md`.

## Replay And Resume

- State: open.
- Slice: `slices/03-open-decisions.md`.
- Question: Can replay, fork, resume, or compaction reconstruction ever
  re-trigger invocations from historical text?
- Default: No. Replayed model-visible text is not a fresh operative request.
- Blocks: negative proof and source policy.
- Future owner: `source-provenance.md`.

## Debug Signature And Telemetry

- State: open.
- Slice: `slices/05-proof-readiness.md`.
- Question: Should implementation expose a prompt/debug signature that shows
  when a mention was scanned but rejected by source policy?
- Default: Useful for diagnosis, but not required for the first fix unless
  proof is otherwise weak.
- Blocks: diagnostics plan, not core authority.
- Future owner: `proof-and-readiness.md` or implementation plan.

