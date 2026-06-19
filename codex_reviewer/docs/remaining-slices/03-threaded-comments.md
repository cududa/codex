# Slice: Threaded Comments

Threaded comments are review discussion. They are also the approval gate
primitive because unresolved threads block human approval.

This slice extends the implemented persisted review spine:

`ReviewVersion -> ReviewCommit -> ReviewFile -> DiffBlock -> read API -> workbench`

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce product semantics,
workflow gates, event kinds, or compatibility behavior not present in those
authority docs.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

There is no active durable comment implementation to port. Build comments as a
new discussion surface attached to the reset spine.

Do not resurrect old decision comments, action prompts, outcome prompts,
workflow hints, preview fixtures, or UX-outline language. Do not use
`ReviewStateWriteResponseSchema` for comment writes.

The implementation must add comment-shaped contracts, services, routes, and
responses. It must not turn comments into review state, approval state,
durable rationale, projection documents, or compatibility payloads.

## Boundary

Comments are discussion. They are not durable rationale, approval state,
decisions, actions, outcomes, or workflow hints.

The only workflow power comments have is as an approval gate input: unresolved
comment threads under a commit, its files, or their diff blocks block human
approval for that commit.

Human approval must not ship against a stubbed unresolved-comment reader that
always returns zero.

## First Code Pass

Implement durable threaded comments and unresolved-count composition.

Required first pass:

- comment thread and comment message rows
- version, commit, file, and diff-block scopes
- scope anchors and optional diff-block/line anchors
- open, reply, and resolve commands
- unresolved thread counts composed into the version-rooted read shape
- version-scoped comment-thread read route
- service and route tests for target ownership and counts

Block-level comments should be surfaced in the diff pane. Rich arbitrary
line-selection UI can follow after block-level comments and unresolved counts
are proven.

## Persistence Requirements

Store comment threads as ordinary durable rows. A thread belongs to exactly one
review scope:

- version
- commit
- file
- diff block

Enforce exactly-one-target at the database and service layers. A thread row
must not point to multiple scopes and must not be targetless.

Store thread messages as ordinary durable rows under a thread.

Opening a thread creates the thread and root comment in one transaction.

Replying appends a message to an unresolved thread. Resolved threads reject
replies unless reopen behavior is added as an explicit product change.

Resolving a thread records resolver metadata and does not delete messages.

Anchors must be validated against ownership. If a thread has a precise diff or
line anchor, that anchor must belong inside the thread's review scope.

Thread authors are human or agent actors. Do not introduce system-authored
discussion comments unless the product model is explicitly extended.

Comment author contracts must be the union of `HumanActorRefSchema` and
`AgentActorRefSchema`. Do not use `ActorRefSchema` and reject `system` at
runtime as an afterthought.

Line anchors, when present, must identify side, start line, and end line, and
must fit inside the owning `DiffBlockRead` old or new line range.

## Contracts And API Shape

Add contracts for:

- review scope
- comment anchor
- comment read
- comment thread read
- comment thread list response
- open thread request
- reply request
- resolve request

Add explicit response contracts:

- `CommentThreadListResponse`
- `OpenCommentThreadResponse`
- `ReplyToCommentThreadResponse`
- `ResolveCommentThreadResponse`

Add derived `unresolvedCommentCount` to the version-rooted read shape:

- `ReviewVersionRead`
- `ReviewCommitRead`
- `ReviewFileRead`
- `DiffBlockRead`

Counts are derived read fields. Count unresolved threads, not messages, and roll
them up through the existing tree.

Do not nest comment bodies in the primary `ReviewVersionRead`. Fetch comment
threads through a focused version-scoped thread route.

Suggested API shape:

- `GET /api/review/versions/:versionId/comment-threads`
- `POST /api/review/comment-threads`
- `POST /api/review/comment-threads/:threadId/replies`
- `PATCH /api/review/comment-threads/:threadId/resolution`

MCP tools should use the same commands. Agent comment access does not get a
separate model or bypass route.

## Events

Resolving a thread must append exactly this review event:

- kind: `comment_resolved`
- scope: the resolved thread's target
- actor: the `HumanActorRefSchema` or `AgentActorRefSchema` actor that resolved
  the thread

The event payload must contain at least:

- `commentId`
- `threadId`
- `target`

This event kernel must match `../review-events.md`. If this slice needs a
different event kind or payload, update `../review-events.md` first.

Opening and replying create durable comment rows. They do not introduce extra
review event kinds in this slice.

## Workbench

First UI:

- unresolved badges in commit queue, file queue, and diff blocks
- selected-scope thread display in the diff pane/work area
- block-level thread creation affordance

Line-range selection UI can follow after block-level comments are real.

## Current Code Hazards

The current event enum and migration only include the implemented mark/concern
events. Extending comments must update the event kind set for
`comment_resolved`; do not add slice-local event names.

The current `ReviewVersionRead` has no unresolved-count fields. Add them as
derived read composition, not persisted counters.

## Tests

- contract tests for scopes, anchors, thread reads, and write requests
- DB tests for exactly one scope, anchor ranges, and comment cascade
- write-service tests for open, reply, resolve, and invalid ownership
- read/API tests for version-scoped thread reads and unresolved counts
- web tests for badges and selected-scope comment states
