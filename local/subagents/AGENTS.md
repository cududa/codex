# Subagents Documentation Instructions

This feature-area doc set is the local authority surface for thread-spawn
subagents. Use it to route planning, implementation, review, and maintenance
work before relying on source terrain.

## Authority Order

- Root `AGENTS.md`.
- `local/how-we-document.md`.
- This file for subagents documentation posture and scope.
- The owning seam doc for the specific behavior being documented.
- Current source code as terrain, not authority.

## Scope

This doc set is for thread-spawned subagents: agents exposed to model-facing
multi-agent tools, their runtime lifecycle, communication model, persisted
thread tree, and client/hook projections.

This doc set does not own guardian review, compact/review subagents, memory
consolidation subagents, or other internal subagent variants except as related
terrain. It does not own realtime `background_agent` handoff behavior except
where `realtime-background-agent-handoff.md` explicitly documents that sibling
Adapter.

## Writing Rules

- Organize by ownership seam and reader job, not source-file order.
- Use the codebase-design terms `Module`, `Interface`, `Implementation`,
  `Seam`, `Adapter`, `Depth`, `Leverage`, and `Locality` deliberately.
- Give every durable rule one owning doc.
- Keep README material to routing and terrain anchors.
- Keep proof and readiness material out of behavior authority docs unless the
  proof obligation is local to that seam.
- Mark source paths as terrain anchors, not as the reason behavior is
  canonical.

## Stop Conditions

Stop and return to the user when:

- a current implementation detail conflicts with an intended behavior rule;
- a rule appears to belong to more than one owning doc;
- realtime handoff, internal subagents, or client projection work would widen
  the thread-spawn subagents scope silently;
- a doc would need to decide product behavior rather than document the local
  fork's intended architecture.

## Validation Posture

For docs-only changes, no Rust validation is required unless the change also
touches code, generated contracts, or fixtures. Review changed docs for
routing clarity, single ownership, explicit non-ownership, and whether a fresh
reader can identify the next doc to open. Broader proof and readiness posture
lives in `proof-and-readiness.md`.
