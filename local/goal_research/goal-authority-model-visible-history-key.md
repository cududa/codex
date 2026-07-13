# Goal Authority Model Visible History Key

## Purpose

This document defines the `model_visible_history_key` used by automatic Goal
Continuation duplicate suppression.

The key answers one narrow question:

```text
Has model-visible, non-Goal progress changed enough to justify another
automatic Continuation for the same active Goal and durable facts version?
```

It is not Goal authority. It does not decide Initial, ObjectiveUpdated, or
BudgetLimit delivery. It does not consume pending intent. It is runtime
accounting support for `MaybeContinueIfIdle`.

## Code Terrain

Current relevant terrain:

- `codex-rs/core/src/context_manager/history.rs`
  - `ContextManager::history_version()` is a rewrite counter.
  - It changes on operations such as `replace`, `remove_last_item`,
    `drop_last_n_user_turns`, and image replacement.
  - It does not change merely because ordinary response items are appended by
    `record_items`.
- `codex-rs/core/src/session/mod.rs`
  - `record_conversation_items` appends to in-memory history, persists rollout
    response items, and emits raw response item events.
  - `replace_compacted_history` replaces history and persists a compaction
    rollout item.
- `codex-rs/core/src/session/turn.rs`
  - each sampling attempt builds prompt input from
    `sess.clone_history().await.for_prompt(...)`
  - retries rebuild prompt input from current history
- `codex-rs/core/src/session/rollout_reconstruction.rs`
  - resume/fork/rollback reconstruction rebuilds `ContextManager` from rollout
    items and compaction replacement history

Current `ContextManager::history_version()` is not a valid Continuation key by
itself. It misses ordinary model-visible progress and can change for history
rewrites that do not necessarily mean new autonomous work happened.

## Key Shape

The implementation must introduce a stable logical key equivalent to:

```text
ModelVisibleHistoryKey {
  schema_version,
  eligible_progress_count,
  eligible_progress_fingerprint,
  latest_eligible_progress_fingerprint,
  compaction_basis_fingerprint,
}
```

The stored wire/string form may be a single digest, but tests and code reviews
must be able to see which inputs feed it.

Required inputs:

- `eligible_progress_count`: count of model-visible progress items included in
  the key projection
- `eligible_progress_fingerprint`: digest of the ordered eligible progress
  projection
- `latest_eligible_progress_fingerprint`: digest of the newest eligible
  progress item, or `None`
- `compaction_basis_fingerprint`: digest of compaction or replacement-history
  facts that changed the model-visible projection, or `None`

The exact hash function is an implementation choice. The projection inputs are
not.

## Eligible Progress Projection

Compute the key from the same logical model-visible history used for the next
request attempt, before inserting a new automatic Continuation item.

Eligible progress items include model-visible items that can represent user
work, assistant work, tool work, mailbox work, or a compaction of such work:

- ordinary user messages and hook prompts that reach model input
- assistant messages
- reasoning items
- tool calls
- tool outputs
- local shell calls
- web-search and image-generation calls
- compaction and context-compaction items that alter the model-visible summary
  of prior eligible progress

The projection must exclude:

- the automatic Continuation Goal item being considered
- all pure current Goal internal-context items
- all pure legacy `<goal_context>` artifacts
- duplicate, stale, wrong-role, or pre-injected Goal-looking items
- pure contextual developer/user fragments that are not work progress
- raw response notification counts
- typed or materialized UI projection counts
- helper outputs that did not reach final request input

If the only model-visible change since the last automatic Continuation is a
Goal cadence, repair, cleanup, or internal-context item, the key must not
change for Continuation suppression purposes.

## Capture Point

The key must be computed per request attempt from the final request-input
shaping path.

Logical order:

```text
base prompt input for this attempt
  -> classify and ignore Goal-only cleanup items for key purposes
  -> compute model_visible_history_key from eligible progress projection
  -> select pending durable intent or runtime Continuation
  -> insert or verify selected developer-role Goal item when due
```

The selected Goal item must not feed the key for the same request. In
particular, a Continuation steering item must not become the history change
that permits another automatic Continuation.

## Runtime Watermark

Automatic Continuation suppression compares:

```text
{
  goal_id,
  model_visible_history_key,
  durable_facts_version,
}
```

A repeated idle hook with the same triple must not launch another automatic
Continuation.

The watermark advances only after the Continuation item appears in final
request input as an outer developer-role Goal `ResponseItem` and the request
has reached the commit point defined by
`goal-authority-final-request-input-and-commit.md`.

The watermark must not advance when:

- the idle hook fires
- a candidate is selected
- a turn is reserved
- text is rendered
- a helper item is constructed
- request shaping fails
- final request input is built but the request is not submitted
- submission fails before the commit point

## Resume And Restart

Resume must not clear duplicate suppression in a way that permits another
automatic Continuation when eligible history and durable Goal facts are
unchanged.

The implementation must persist or reconstruct the latest committed automatic
Continuation suppression triple.

Acceptable storage shape:

```sql
CREATE TABLE thread_goal_continuation_watermarks (
    thread_id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    facts_version INTEGER NOT NULL,
    model_visible_history_key TEXT NOT NULL,
    committed_turn_id TEXT NOT NULL,
    item_fingerprint TEXT NOT NULL,
    committed_at_ms INTEGER NOT NULL
);
```

This is not persisted pending cadence intent. It records that a Continuation
already reached model execution for a specific history/facts key.

An equivalent rollout-derived implementation is acceptable only if it records
structured committed Continuation metadata and can reconstruct the same triple
without parsing rendered Goal text.

Resume behavior:

```text
reload durable Goal facts
rebuild or load latest automatic Continuation suppression triple
compute current model_visible_history_key from reconstructed model-visible history
allow automatic Continuation only if the current triple differs from the latest
  committed automatic Continuation triple
```

## Compaction And Reconstruction

Compaction affects the key only through the eligible progress projection.

Rules:

- pure Goal items removed or repaired by compaction must not change the key
- compaction summaries that replace eligible progress participate in the
  projection
- compaction metadata with no model-visible effect on eligible progress must
  not by itself permit another Continuation
- rollout reconstruction must compute the same key for the reconstructed
  history that live history would compute for the same model-visible items

Rollback and fork compute keys from the surviving reconstructed history. They
must not resurrect active Goal state or Continuation eligibility from rendered
Goal artifacts.

## Tests

Focused tests must prove:

- `ContextManager::history_version()` is not used as the sole Continuation key
- ordinary assistant output changes the key
- ordinary user or mailbox input that reaches model input changes the key
- tool calls or tool outputs change the key
- the automatic Continuation steering item itself does not change the key used
  to permit another Continuation
- pure current Goal internal-context items do not change the key
- pure legacy `<goal_context>` artifacts do not change the key
- compaction changes the key only when the eligible progress projection changes
- resume with unchanged eligible history and unchanged durable facts suppresses
  duplicate automatic Continuation
- resume after new eligible model-visible progress permits automatic
  Continuation
- durable facts version changes permit automatic Continuation even when the
  eligible history key is unchanged
