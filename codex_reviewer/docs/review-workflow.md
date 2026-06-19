# Review Workflow

This is the workflow authority for `codex_reviewer`. It captures product rules
that the database, services, API routes, MCP tools, and web workbench must
enforce.

## Review Marks

`ReviewMark` has exactly three values:

- `PASS`
- `FLAG`
- `MODIFY`

`DONE` is not a review mark. Completion is represented by human approval, linked
local change evidence when required, and the generated review ledger.

`PASS` means no local adaptation is required for the reviewed scope.

`FLAG` means unresolved review work exists. It is transient. A version cannot be
completed while any commit or file remains flagged.

`MODIFY` means local adaptation work is required for the reviewed scope. A
`MODIFY` approval must be backed by linked local change evidence.

## Scope Rules

Every commit has a current review mark.

A file may have an explicit review mark only when it needs file-specific review
state. Files do not have concern areas.

If a commit is `PASS`, its files must not carry explicit `FLAG` or `MODIFY`
marks. A `PASS` commit does not require file-level review records.

Concern areas belong to commits only. They are an ordered list of controlled
vocabulary values. The first selected concern area is first in the list; if it
is removed, the next value becomes first. Selections are currently limited to at
most three values per commit. There is no primary/secondary tag system.

## Ingest And Concern Map

Ingest creates the initial persisted review version, commits, files, and diff
blocks.

During ingest, the deterministic concern-map process initializes current review
state before any human or agent has reviewed the version:

- commit review marks
- commit concern areas
- explicit file review marks when file-level review state is needed

Concern-map output uses the same canonical concern-area contract as the rest of
the product: canonical slugs, ordering, uniqueness, and maximum selected concern
area count.

This initial assignment is not detector evidence and not agent review evidence.
It writes the current review state for the newly ingested version.

## Agent Review

Agents may record review evidence for commits and files.

Agent review records may include:

- reviewed mark
- reviewed concern areas for commit scope only
- notes
- reviewer actor
- timestamp

Agent review is evidence and history. It is not approval.

## Human Approval

Only a human may approve a commit or file.

Human approval records may include:

- approved mark
- approved concern areas for commit scope only
- linked local changes when approving `MODIFY`
- notes
- approver
- timestamp

A human cannot approve a flagged commit.

A human cannot approve any commit while one of its files is flagged.

A human cannot approve a commit while unresolved comments exist on the commit,
its files, or their diff blocks.

Files marked `MODIFY` require human approval before the owning commit can be
approved.

Agents must not create, update, or revoke human approvals.

## Access Paths

The web app, API routes, MCP tools, ingest pipeline, agents, and detector
processes all feed the same product commands and durable rows. They are access
paths, not separate domain models.

Codex CLI or desktop-app agents may use MCP tools to record agent reviews,
threaded comments, review notes, review plans, and allowed local-change refs.
They must not use MCP to create, update, or revoke human approvals or generate
the review ledger.

Human approval and ledger generation require human actor contracts at the API
boundary. Agent-accessible tools must not expose those commands under alternate
names.

## Comments, Notes, And Plans

Threaded comments are discussion. They can be created by humans or agents and
must support replies, resolution, and precise anchors.

Review notes are durable markdown rationale. The old "decisions" surface maps
to notes, not to a decision entity. There is no action dropdown, outcome enum,
decision association graph, or compatibility wrapper.

Review plans are markdown workspaces attached to review scopes. A plan is not a
checklist, status model, decision model, or workflow engine unless that product
decision is made explicitly later.

## History

Material review changes must leave audit history.

History must cover:

- review mark changes
- concern area changes
- agent review records
- human approval records and revocations
- local change links
- comment resolution
- plan updates

The audit trail is history, not the source of current state. The product is not
event-sourced. See `docs/review-events.md` for the event kind and payload map.

## Version Completion

A version is complete when a human generates a review ledger.

The ledger can be generated only when:

- every commit has human approval
- no commit is `FLAG`
- no file is `FLAG`
- every `MODIFY` commit or file has linked local change evidence
- all comments under the version are resolved

There is no version status, readiness flag, finalized flag, or close-version
workflow object.
