# Slice: Agent Review Evidence

Agent reviews are agent-authored evidence. They are not approval, not
classification, and not a mutation of current review state.

This slice extends the implemented persisted review spine:

`ReviewVersion -> ReviewCommit -> ReviewFile -> DiffBlock -> read API -> workbench`

## Authority

Use these docs as authority:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

Do not use old `prompt_reviews` or pre-reset `codex_reviewer` review concepts as
authority.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

Read current source only to identify reset-spine extension points and stale
hazards. Do not preserve or copy these current patterns into agent review
evidence:

- `ReviewStateWriteResponseSchema`
- generic `ActorRefSchema` write requests
- `ReviewWriteStore` mark/concern mutation methods
- mark/concern state mutation routes
- current event payload shapes that omit the event kernels in
  `../review-events.md`
- `@prompt-reviews` package naming as product vocabulary

Do not port generated `dist` contracts, old row schemas, old command schemas,
classification/tagging code, decision/action/outcome vocabulary, projection
documents, compatibility wrappers, or `DONE` marks.

Agent review evidence needs its own contracts, service boundary, routes, and
responses. It must not be implemented as a thin wrapper around current
review-state writes.

## Goal

Allow an agent to record that it reviewed a commit or file and believes a review
mark is correct.

For commit scope only, the agent may also record ordered concern areas.

This is the MCP-backed light review pass after ingest has already initialized
review state with deterministic concern-map output. Agent reviews verify or
challenge current marks and concern areas; they do not perform the ingest
initialization.

The record is durable evidence/history. It must not automatically change:

- the commit review mark
- the file review mark
- commit concern areas
- human approval
- ledger state

## Non-Goals

This slice must not introduce or preserve:

- classifications
- tags or taggings
- primary/secondary tags
- decisions
- actions
- outcomes
- approval
- `DONE`
- version readiness/finalization/status
- projection documents
- compatibility wrappers

Do not rename old classification/tagging code into agent review code. Delete or
replace it.

## Product Model

An `AgentReview` belongs to exactly one target:

- commit
- file

It owns:

- target scope
- reviewed mark: `PASS`, `FLAG`, or `MODIFY`
- reviewed concern areas for commit scope only
- notes markdown
- reviewer actor
- created timestamp

Only an agent actor may create an agent review. Write requests must use the
canonical agent-only actor contract, currently `AgentActorRefSchema`, not a
generic actor contract plus ad hoc runtime checks.

File-scoped agent reviews must not contain concern areas.

## Persistence

Persist agent reviews as ordinary durable rows.

Persist commit-scoped reviewed concern areas as ordered child rows or an
equivalent normalized representation that preserves order and validates the
canonical concern-area vocabulary.

Agent-reviewed concern areas must reuse the canonical concern-area selection
contract, currently `ConcernAreaSelectionSchema`. That includes canonical
slugs, preserved ordering, uniqueness, and the maximum selected concern-area
count. Do not invent parallel validation for agent reviews.

Do not store agent reviews as nested review documents, projection blobs, or
compatibility payloads.

Do not update current commit/file review state as a side effect of inserting an
agent review.

This is a greenfield extension to the current schema. It should add evidence
rows beside `review_commits` and `review_files`; it should not reshape the
existing mark/concern state tables into agent-review storage.

Enforce exactly-one-target at the database and service layers. An agent review
row must not point to both a commit and a file, and must not be targetless.

## Commands

Add commands for:

- record commit agent review
- record file agent review

Add explicit request/response contracts for those commands:

- `RecordCommitAgentReviewRequest`
- `RecordFileAgentReviewRequest`
- `RecordAgentReviewResponse`

`RecordAgentReviewResponse` may return the refreshed owning
`ReviewVersionRead`, but it must not be named as review-state mutation.

Expose these commands through the same API/service boundary used by MCP tools.
Codex CLI or desktop-app agents can call these tools, but the tools must use the
canonical agent actor contract.

Commands must validate:

- actor satisfies the canonical agent actor contract
- target exists
- reviewed mark is valid
- concern areas satisfy the canonical concern-area selection contract
- concern areas are commit-only
- write occurs transactionally with audit history

Evidence writes should not use a response contract named as a review-state
mutation. Returning the owning `ReviewVersionRead` may be useful, but the
contract should be named generically or specifically, for example
`RecordAgentReviewResponse`, not `ReviewStateWriteResponse`.

The agent review write service must not call `setCommitReviewMark`,
`setFileReviewMark`, or `setCommitConcernAreas`.

## Reads

Compose agent reviews into `ReviewCommitRead` and `ReviewFileRead` inside
`ReviewVersionRead`.

Extend the canonical read contracts first:

- `ReviewCommitRead.agentReviews`
- `ReviewFileRead.agentReviews`

Commit agent review reads must include reviewed concern areas inside each agent
review.

File reads must not include reviewed concern areas.

The read API should return canonical contract shapes composed from rows. Do not
add projection machinery for this slice.

## Audit

Recording an agent review must append exactly this review event:

- kind: `agent_review_recorded`
- scope: the reviewed commit or file
- actor: the `AgentActorRefSchema` actor that recorded the review

The event payload must contain at least:

- `agentReviewId`
- `target`
- `reviewedMark`
- `reviewedConcernAreas` for commit-scoped reviews only

This event kernel must match `../review-events.md`. If this slice needs a
different event kind or payload, update `../review-events.md` first.

The event is history, not source of current state.

## Workbench

Initial UI is display-only.

Show agent review evidence where it helps review judgment, but do not add human
approval controls in this slice.

Do not expose old vocabulary in labels, helpers, query keys, fixtures, or tests.

## Tests

Required coverage:

- contracts reject non-agent actors for agent review writes
- contracts reject file-scoped concern areas
- contracts reuse the canonical agent actor and concern-area selection schemas
- persistence enforces exactly one target
- persistence preserves ordered commit concern areas
- persistence and migrations allow the `agent_review_recorded` event kind
- write service records the review and audit event transactionally
- read service nests agent reviews under the correct commit/file
- evidence write responses do not use review-state mutation naming
- route tests validate request and response shapes
- web tests do not use old classification/tagging/decision vocabulary
