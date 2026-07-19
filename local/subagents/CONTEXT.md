## Navigation Header

- Role: Glossary for the subagents documentation set.
- Owns: Short definitions needed to read the seam docs.
- Does not own: Lifecycle rules, tool semantics, persistence rules, adapter
  behavior, or proof requirements.
- Primary pointers: `README.md`, `delegation-interface.md`,
  `spawn-context-lifecycle.md`, `communication-and-results.md`.
- Fidelity note: Glossary is populated; keep definitions short and move
  behavior to the owning doc.

## Terms

Thread-spawn subagent: A subagent created through model-facing multi-agent
tools and represented by `SessionSource::SubAgent(ThreadSpawn)`.

Root agent: The user-facing session that owns the root of the thread-spawn
agent tree.

Agent path: A stable tree reference used by v2 tools to address agents by
canonical or relative path.

Task name: The v2 spawn-time label used to identify the child task and form
part of the agent path.

Fork mode: The choice of whether a spawned subagent starts fresh, with full
parent context, or with a partial parent history.

Fresh session: A spawned subagent that inherits runtime configuration but does
not fork parent thread history.

Full-history fork: A spawned subagent that forks the parent thread's stored
history.

Partial-history fork: A spawned subagent that forks only a bounded recent
portion of parent thread history.

Inter-agent communication: A structured message from one agent to another that
is delivered through the session mailbox.

Mailbox: Session input queue storage for pending inter-agent communication.

Client projection: A downstream presentation of subagent state or events, such
as app-server thread items or TUI history rows.

Realtime background-agent handoff: A realtime delegation front-door that is
related to subagent delegation but does not itself create a thread-spawn
subagent.
