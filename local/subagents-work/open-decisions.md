# Open Decisions

This file tracks decisions that should not be silently resolved by source
shape. Each item should say what it blocks and which slice owns resolution.

If a slice is decomposed because a decision blocks only part of the work, keep
the decision here and name the subslice that owns resolution. Do not create a
second decision tracker inside a subslice directory.

## Decision States

- `open`: needs user or reviewer decision.
- `defaulted`: a default direction exists, but final prose should still name
  the choice.
- `resolved`: decision has been recorded in the owning live doc.

## Thread-Spawn Scope

- State: resolved.
- Slice: `slices/00-scope-ledger.md`.
- Question: Should this doc set treat review, compact, memory consolidation,
  and other internal subagent variants as first-class scope?
- Decision: No. The live scope is thread-spawn subagents; internal variants are
  related terrain or explicit non-owned variants.
- Blocks: none.
- Owning live doc: `local/subagents/AGENTS.md`.

## Realtime Scope

- State: resolved.
- Slice: `slices/04-hooks-realtime/04b-realtime-handoff-scope.md`.
- Question: Is realtime `background_agent` handoff part of subagents authority
  or only a sibling adapter doc?
- Decision: Keep realtime `background_agent` handoff as a sibling Adapter doc.
  It is related delegation terrain, but it does not create a thread-spawn
  subagent, does not enter `AgentControl`/`AgentRegistry`, does not persist a
  thread-spawn edge, and does not own mailbox or TUI subagent behavior.
- Blocks: none; `04z` confirmed the parent hooks/realtime slice can complete.
- Owning live doc: `local/subagents/realtime-background-agent-handoff.md`.

## Hook Exposure Scope

- State: resolved.
- Slice: `slices/04-hooks-realtime/04a-hooks.md`.
- Question: Should user-configured subagent lifecycle hooks apply to every
  `SessionSource::SubAgent` variant or only to thread-spawn subagents?
- Decision: Only thread-spawn subagents expose `SubagentStart` and
  `SubagentStop`. Internal and synthetic subagent sessions remain related
  terrain and do not dispatch those lifecycle hooks. Normal hook requests can
  carry optional subagent context when they run inside a thread-spawn child.
- Blocks: none.
- Owning live doc: `local/subagents/hooks-and-integrations.md`.

## v1 Compatibility Posture

- State: resolved.
- Slice: `slices/01-core-trio/01a-delegation-interface.md`.
- Question: Should v1 multi-agent tools be documented as compatibility terrain,
  historical behavior, or active parallel Interface?
- Decision: Treat v2 as canonical and v1 as compatibility surface unless terrain
  or user intent says otherwise.
- Blocks: none.
- Owning live doc: `local/subagents/delegation-interface.md`.

## Canonical Result Semantics

- State: resolved.
- Slice: `slices/02-communication-results.md`.
- Question: Which result delivery path should be considered the canonical v2
  parent-visible completion behavior, and which legacy watcher behavior should
  be documented only as compatibility terrain?
- Decision: Treat v2 parent completion forwarding as canonical for v2
  thread-spawn subagents. V2 `wait_agent` remains a mailbox wake summary and
  does not return results, content, status maps, or selected-agent details.
  Legacy watcher and v1 wait/status behavior are compatibility terrain.
- Blocks: none.
- Owning live doc: `local/subagents/communication-and-results.md`.

## Client Projection Authority

- State: resolved.
- Slice: `slices/03-state-client-projection/03z-consolidation.md`.
- Question: How much app-server and TUI detail belongs in the state/projection
  doc before it becomes client-specific behavior authority?
- Decision: Persisted state owns durable graph and metadata behavior.
  App-server details are Adapter projections over state, source metadata, live
  thread ids, and collab events. TUI details are Adapter projections over
  app-server/state data and runtime events. Rendering layout specifics stay
  terrain or proof.
- Blocks: none.
- Owning live doc: `local/subagents/state-and-client-projection.md`.

## Proof Hardening Split

- State: resolved.
- Slice: `slices/05-proof-hardening.md`.
- Question: Should proof mapping, reader hardening, cold-reader review, and
  work-packet retirement be completed in one parent pass?
- Decision: No. Decompose `05` into proof matrix, reader hardening,
  cold-reader review, and final retirement/consolidation so proof docs do not
  become behavior authority and cleanup waits for actual readiness evidence.
- Blocks: none.
- Owning live doc: `local/subagents/proof-and-readiness.md`.

## Proof Authority Posture

- State: resolved.
- Slice: `slices/05-proof-hardening/05a-proof-matrix.md`.
- Question: Should proof terrain define behavior when tests are more concrete
  than the live seam docs?
- Decision: No. Proof validates owning docs through focused proof clusters.
  Behavior questions route back to the owning live doc, and a conflicting test
  expectation should be fixed rather than promoted into behavior authority.
- Blocks: none.
- Owning live doc: `local/subagents/proof-and-readiness.md`.

## Reader Surface Posture

- State: resolved.
- Slice: `slices/05-proof-hardening/05b-reader-hardening.md`.
- Question: Should live docs keep skeleton/future-slice language after the
  proof matrix exists?
- Decision: No. Live docs should read as a populated authority surface. Seam
  docs may keep local proof reminders, but broad proof clusters and validation
  posture route to `proof-and-readiness.md`.
- Blocks: none.
- Owning live doc: `local/subagents/README.md`.

## Cold-Reader Route

- State: resolved.
- Slice: `slices/05-proof-hardening/05c-cold-reader-review.md`.
- Question: Can cold-reader review depend on work-dir tasks, ledgers, or hidden
  process context?
- Decision: No. `proof-and-readiness.md` owns the live-doc-only prompt,
  criteria, and output shape. If a future fresh reviewer cannot answer those
  questions from `local/subagents/` alone, the finding belongs in the owning
  live doc or in explicit readiness posture.
- Blocks: none.
- Owning live doc: `local/subagents/proof-and-readiness.md`.

## Work Packet Disposition

- State: resolved.
- Slice: `slices/05-proof-hardening/05z-retirement.md`.
- Question: Should `local/subagents-work/` be deleted, archived, or left in
  place after documentation population completes?
- Decision: Leave it in place as retired operational scaffolding outside the
  normal reader path. It is not behavior authority; future agents should read
  `local/subagents/` first unless deliberately reopening population work.
- Blocks: none.
- Owning live doc: none; operational posture is recorded in
  `local/subagents-work/README.md`.
