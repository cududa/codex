## Navigation Header

- Role: Lifecycle/interface doc for persisted subagent state and downstream
  client projections.
- Owns: Thread-spawn edge persistence, thread metadata projection, app-server
  event/thread views, and TUI subagent presentation as downstream adapters.
- Does not own: Core spawn validation, mailbox delivery, hook schemas, or
  realtime handoff behavior.
- Primary pointers: `runtime-architecture.md`,
  `spawn-context-lifecycle.md`, `communication-and-results.md`,
  `proof-and-readiness.md`.
- Fidelity note: Populated authority doc; broad proof posture lives in
  `proof-and-readiness.md`.

## Core Rule

The durable thread-spawn graph is represented by directional parent-child
edges between thread ids plus thread metadata that identifies spawned agents.
Core runtime and lifecycle paths write and read this state; app-server and TUI
surfaces project it as downstream Adapters.

Persisted state owns graph shape and durable open/closed edge semantics. It
does not own spawn validation, mailbox delivery, or client rendering. Client
projections must derive from persisted state, runtime events, or thread
metadata instead of inventing an alternate subagent tree.

## Persisted Thread-Spawn Graph

`thread_spawn_edges` is the durable edge table for thread-spawn subagents. Each
row stores:

- `parent_thread_id`: the parent thread id;
- `child_thread_id`: the spawned child thread id and primary key;
- `status`: the directional edge status.

Because `child_thread_id` is the primary key, a child has at most one incoming
persisted thread-spawn edge. Upserting an edge for an existing child replaces
the parent/status pair. This matches the runtime model where a spawned thread
belongs to one parent path in one session tree.

The known edge statuses are `open` and `closed`. `open` means the edge remains
eligible for persisted tree operations such as resume traversal. `closed`
means the incoming edge was explicitly closed and should not be treated as an
open child of its parent.

## Edge Writes

`AgentControl` writes an `open` edge when a thread-spawn child is created and
state persistence is available. State runtime also inserts an `open` edge from
serialized `SessionSource::SubAgent(ThreadSpawn)` metadata when a thread row
is inserted or upserted and no edge already exists. That fallback lets durable
state recover an edge from rollout-derived metadata without overwriting an
edge that was already written explicitly.

Closing a spawned agent marks the target's incoming persisted edge `closed`
before the live target and its live descendants are shut down. Close does not
need to rewrite every descendant edge to preserve resume semantics: a closed
ancestor edge stops status-filtered traversal from that ancestor, while a
direct resume of a still-open descendant subtree can still see that subtree.

Lifecycle meaning for close and resume belongs to
`spawn-context-lifecycle.md`. This doc owns the persisted state those lifecycle
paths use.

## Traversal Rules

Direct child queries can ask for all children or only children whose incoming
edge has a specific status. All direct-child results are ordered by child
thread id.

Descendant queries walk the persisted tree recursively and return descendants
breadth-first by depth, then by thread id for stable ordering. Status-filtered
descendant traversal includes only edges with the requested status and only
continues through matching edges. Unfiltered descendant traversal ignores edge
status and walks the entire recorded subtree.

Path lookup joins persisted edges to thread metadata. Direct-child lookup
searches children of one parent by canonical `agent_path`. Descendant lookup
searches the recorded subtree by canonical `agent_path`. Runtime path
construction and target resolution remain owned by `runtime-architecture.md`.

## Thread Metadata

Thread metadata stores the durable fields that let state and clients identify
thread-spawn subagents:

- serialized `source`, including `SessionSource::SubAgent(ThreadSpawn)` when
  the thread is a thread-spawn child;
- optional `thread_source` analytics classification;
- optional `agent_nickname`;
- optional `agent_role`;
- optional canonical `agent_path`.

When metadata is built from a session source, `agent_path` is copied from the
source unless an explicit metadata value is already present. The nickname and
role are persisted as thread metadata so resumed threads, app-server thread
views, and TUI presentation can keep user-facing labels even when the live
runtime registry is not the original source of truth.

`runtime-architecture.md` owns the runtime identity shape carried by
`SessionSource::SubAgent(ThreadSpawn)`. This doc owns the durable projection
of that identity into state.

## Resume And Archive State

Resume uses persisted `open` direct-child edges to rebuild live descendants
from rollout history. The traversal is breadth-first from the resumed thread,
and a child that fails to resume does not enqueue its children for further
resume traversal.

Archive-style state operations use unfiltered descendant traversal when the
operation should apply to the whole recorded subtree, regardless of open or
closed edge status. The app-server archive request is one such projection
consumer: it gathers the selected thread plus all recorded descendants and
then archives unarchived rows it can read. The app-server request shape and
notification behavior are owned by the app-server projection rules below.

## App-Server Projection

App-server thread and event projection is a downstream Adapter over persisted
thread metadata, source classification, runtime status, and collab events. The
projection must not redefine the persisted graph rules in this doc.

The v2 app-server thread view preserves `SessionSource::SubAgent(ThreadSpawn)`
inside the thread `source` field. It also exposes top-level `agent_nickname`
and `agent_role` fields for user-facing labels. `agent_path` remains part of
the source metadata rather than a separate top-level thread field.

When app-server builds thread summaries or thread responses from stored
metadata, it merges persisted `agent_nickname` and `agent_role` back into the
thread-spawn source if the source did not already carry them. The same merged
source is used to populate top-level `agent_nickname` and `agent_role` in the
thread response. This keeps recovered, stored, and live thread views using the
same label data.

## Source Filtering

Thread list and search requests accept source-kind filters. Omitted or empty
filters default to interactive sources. Filters that target source families
which cannot be represented by a simple stored-source allowlist, including
subagent variants, use post-filtering after each candidate thread is loaded
and its source metadata is reconstructed.

`SubAgentThreadSpawn` matches only
`SessionSource::SubAgent(SubAgentSource::ThreadSpawn { .. })`. It does not
match review, compact, or other internal subagent variants. `SubAgent` matches
any subagent source variant. This distinction is a projection rule for
app-server thread discovery; scope authority for this doc set remains in
`AGENTS.md`.

List and search pagination may read additional pages when post-filtering drops
items, and they stop if a backend cursor would repeat. That behavior keeps
source-kind filtering usable without changing the persisted state model.

## Thread Views And Loaded Threads

`thread/read` builds an app-server thread view from persisted metadata plus
optional live state. Loaded threads can contribute runtime status, path, and
history when available; persisted metadata contributes durable source,
nickname, role, timestamps, preview, archive state, and thread source
classification.

`thread/loaded/list` returns sorted live thread ids from the thread manager. It
does not classify subagents by itself. Clients that need subagent structure
must pair the live id list with `thread/read` or persisted metadata projection
and then apply thread-spawn source rules.

Archive requests are app-server projection consumers of the persisted graph.
They gather the selected thread plus recorded descendants through unfiltered
state traversal, then archive the rows that can be read and are not already
archived. The graph traversal rule is owned by the persisted-state section;
the app-server projection only applies that rule to the archive operation.

## Event And History Projection

App-server maps collab lifecycle events into `ThreadItem::CollabAgentToolCall`
items for live notifications and persisted thread history reconstruction. The
projected tools include spawn, send-input/follow-up interaction, wait, close,
and resume. The projected item carries sender thread id, receiver thread ids,
prompt/model/reasoning metadata where available, tool-call status, and agent
state summaries derived from runtime `AgentStatus`.

This event projection is display data. It must not be used as the authority
for mailbox delivery, wait result semantics, completion notification, or
spawn lifecycle rules. Those remain owned by
`communication-and-results.md` and `spawn-context-lifecycle.md`.

## TUI Projection

TUI subagent presentation is a downstream Adapter over app-server/state data
and runtime events. It must not redefine persisted graph rules, lifecycle
meaning, app-server source filtering, or mailbox delivery.

The TUI discovers loaded subagent threads by combining `thread/loaded/list`
with `thread/read`. The loaded list is a flat set of live thread ids, so the
TUI reads thread metadata and walks
`SessionSource::SubAgent(ThreadSpawn { parent_thread_id, .. })` links from the
primary thread to find descendants. Non-thread-spawn sources, unrelated
thread-spawn trees, invalid ids, and the primary thread itself are excluded.

Loaded-thread backfill is used after resume, fork, and new-thread setup, and
as an on-demand fallback when next/previous navigation has no local neighbor.
Backfill registers discovered descendants with the navigation cache and the
chat metadata map, but it does not mutate persisted state.

## TUI Navigation And Labels

`AgentNavigationState` is the TUI projection Module for picker order and
labels. It stores the latest metadata per thread id and a first-seen order
vector. `upsert` preserves first-seen traversal order; later nickname, role,
or closed-state updates do not move the thread. Keyboard next/previous and the
`/agent` picker use that stable order.

Closed agent threads remain in the navigation cache and picker so users can
inspect completed or closed transcripts and so navigation does not reshuffle
when an agent exits. Removal is reserved for opportunistically discovered
threads that the backend later confirms are not replayable. Clearing the cache
is session teardown behavior.

The picker can remain available even when the collaboration feature flag is
off if already-known non-primary agent threads exist. Labels are derived from
the same metadata used by history rows: primary renders as the main/default
thread, nickname and role are preferred when present, and generic agent labels
fall back to a thread-id hint when needed.

Thread routing keeps picker metadata and chat metadata paired. New thread
notifications and collab receiver ids can register agent threads. Thread-close
notifications for the active non-primary thread mark the agent closed and
attempt to switch display back to the primary thread.

## TUI History Projection

The TUI renders app-server `ThreadItem::CollabAgentToolCall` items as history
cells. Spawn, send-input/follow-up interaction, wait, close, and resume items
are formatted from the projected thread ids, prompt/model/reasoning metadata,
tool-call status, and agent metadata callback.

Spawn rendering can cache the spawn request summary across begin/end events so
the completed row can still show model and reasoning metadata. Waiting rows
can render begin and end states from the receiver list and projected agent
states. These rows are presentation of app-server projection data, not
authority for the underlying runtime behavior.

TUI snapshot tests are proof for visible presentation changes. They do not own
the behavior rules for state, app-server projection, lifecycle, or mailbox
delivery.

## Owned Behavior

This doc currently owns:

- `thread_spawn_edges` as the durable parent-child graph for thread-spawn
  subagents;
- open and closed directional edge status;
- direct child, descendant, and path lookup traversal rules;
- durable metadata fields that identify thread-spawn subagents;
- the persisted-state role in resume, close, and archive-style operations;
- app-server source-kind filtering and thread/event projection roles;
- TUI loaded-thread discovery, navigation-cache invariants, label projection,
  closed-thread visibility, and history-row projection;
- the rule that app-server and TUI surfaces are downstream Adapters over state
  and runtime facts.

## Non-Ownership

This doc should not define how a child is spawned or what messages it receives.
It should describe persisted state and client projection after core lifecycle
behavior has occurred.

This doc should not define tool schemas, model-facing rejection wording,
mailbox delivery, hook payloads, realtime handoff, or visual layout. Those
rules belong to the owning docs named in the navigation header.

## Terrain Anchors

- `codex-rs/state/migrations/0021_thread_spawn_edges.sql`
- `codex-rs/state/src/model/graph.rs`
- `codex-rs/state/src/runtime/threads.rs`
- `codex-rs/state/src/model/thread_metadata.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs`
- `codex-rs/app-server-protocol/src/protocol/v2/thread.rs`
- `codex-rs/app-server/src/filters.rs`
- `codex-rs/app-server/src/request_processors/thread_processor.rs`
- `codex-rs/app-server/src/request_processors/thread_summary.rs`
- `codex-rs/app-server-protocol/src/protocol/event_mapping.rs`
- `codex-rs/app-server-protocol/src/protocol/thread_history.rs`
- `codex-rs/tui/src/multi_agents.rs`
- `codex-rs/tui/src/app/loaded_threads.rs`
- `codex-rs/tui/src/app/agent_navigation.rs`
- `codex-rs/tui/src/app/session_lifecycle.rs`
- `codex-rs/tui/src/app/thread_routing.rs`
- `codex-rs/tui/src/chatwidget/tool_lifecycle.rs`

## Proof Pointers

Broad proof clusters and validation posture live in
`proof-and-readiness.md`. Local evidence for this seam should cover:

- state DB edge insertion, update, descendants, and resume;
- app-server thread source filtering and event projection;
- TUI snapshot coverage for visible subagent presentation changes.
