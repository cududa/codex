## Navigation Header

- Role: Proof and readiness doc for the subagents documentation set.
- Owns: Validation posture, test anchors, proof matrix, and cold-reader review
  expectations.
- Does not own: Behavior rules for tools, lifecycle, runtime, persistence,
  hooks, clients, or realtime handoff.
- Primary pointers: All behavior and lifecycle docs in this directory.
- Fidelity note: Skeleton only; fill proof clusters after the behavior docs are
  drafted.

## Core Rule

TODO: Define how future subagents documentation changes and implementation
changes prove they match the owning docs.

## Proof Matrix To Fill

- Delegation Interface tests.
- Spawn/context lifecycle tests.
- Runtime architecture tests.
- Communication and result ingestion tests.
- State persistence and resume tests.
- App-server projection tests.
- TUI rendering or navigation snapshots.
- Hook exposure tests.
- Realtime handoff adapter tests when realtime is in scope.

## Readiness Checklist To Fill

- A fresh reader can name the live authority docs.
- A fresh reader can distinguish thread-spawn subagents from internal subagent
  variants.
- A fresh reader can explain fresh, full-history, and partial-history spawn
  modes without reading source files.
- A reviewer can map each durable rule to exactly one owning doc.
- Implementation prompts can name a bounded seam, relevant terrain, and stop
  conditions.

## Terrain Anchors

- `codex-rs/core/src/tools/handlers/multi_agents_tests.rs`
- `codex-rs/core/src/realtime_conversation_tests.rs`
- `codex-rs/core/tests/suite/realtime_conversation.rs`
- `codex-rs/app-server/tests/suite/v2/realtime_conversation.rs`
- TUI snapshot tests related to multi-agent rendering, once identified.
