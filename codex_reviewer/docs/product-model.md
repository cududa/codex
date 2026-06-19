# Product Model

This is the first authority document for `codex_reviewer`.

`codex_reviewer` exists to review upstream Codex changes before accepting them
locally. The product tracks upstream commits, the files and diffs they changed,
the workflow state of the review, evidence from humans, agents, and detectors,
local adaptation work, and a final human-generated ledger saying what was
accepted.

That is the product. Everything else must justify itself against that.

## Product Surface

The product surface is intentionally small:

Review a version's commits and files, discuss findings, record evidence, track
required local adaptations, get human approval, and generate a final ledger.

This is a CRUD application with review workflow semantics. It should have a
boring application spine:

- canonical schemas for product contracts
- durable database records for product entities
- services that read and write those records
- API routes that validate and return canonical contract shapes
- a web workbench backed by those API routes

Architectural artifacts are not product value. Registries, guardrails, command
schemas, row schemas, and read schemas are useful only when they protect this
spine.

## Core Entities

### ReviewVersion

A review session for one upstream range in one repository. This is the root
aggregate for a batch of reviewed commits.

Owns:

- repository identity
- base and target refs or SHAs
- creation and update metadata
- commits under review
- eventual completed ledger

This is not a lifecycle/status object. Completion is represented by a ledger,
not by a version status flag.

### ReviewCommit

One upstream commit in a review version.

Owns:

- upstream SHA
- order within the version
- title, message, and author metadata
- current commit-level review mark
- ordered commit concern areas
- linked local changes
- agent review records
- human approval, if any
- files changed by the commit

This is one of the central records. It should be boring and durable.

### ReviewFile

One changed file inside a reviewed commit.

Owns:

- path and old path
- change kind
- order within the commit
- optional explicit file-level review mark
- linked local changes
- file-level agent review and human approval
- diff blocks

Files do not own concern areas. Concern areas are commit-level in this model.

### DiffBlock

One anchorable diff block inside a review file.

Owns:

- order within the file
- heading, if any
- old and new line ranges
- patch text

This exists because comments and evidence need stable anchors more precise than a
file.

### ConcernArea

Controlled product vocabulary for why a commit matters to the user's workflow,
for example harness prompts, hidden context, tool affordances, and permission
defaults.

This is registry/config data, not user-created review state.

### ReviewMark

Controlled workflow mark for review state.

Current values:

- `PASS`
- `FLAG`
- `MODIFY`

This is state on commits and files, not a separate entity. `DONE` is not a
review mark; completion is represented by human approval, linked local change
evidence when required, and a generated review ledger.

### ActorRef

A stable reference to the actor responsible for a review operation.

Actor kinds are controlled:

- `human`
- `agent`
- `system`

Use exact actor contracts at command boundaries:

- `HumanActorRefSchema` for human approval and review ledger generation
- `AgentActorRefSchema` for agent review evidence
- `SystemActorRefSchema` for detector processes and future system-authored
  commands that need actor-shaped attribution

Do not accept the generic `ActorRefSchema` at a command boundary when the
product boundary requires a specific actor kind. Generic actor refs are
appropriate only for operations that intentionally allow multiple actor kinds,
such as local-change linking.

The first ingest implementation uses an explicit system-scoped `source` field
and persisted `concernMapVersion` rather than an actor-shaped reviewer. That
source must not be modeled as a human reviewer or agent reviewer.

### LocalChangeRef

A link to local work that adapts or fixes something required by the review.

Owns:

- local commit SHA
- optional title and summary
- actor who linked it
- timestamp
- exactly one target: commit or file

This is not a generic attachment system. It exists specifically as evidence for
completed local adaptation work.

### AgentReview

An agent-authored record saying it reviewed a commit or file and what mark or
concern state it believes is correct.

Owns:

- scope: commit or file
- reviewed mark
- reviewed concern areas for commit scope only
- notes
- reviewer actor
- timestamp

This is evidence/history, not final approval.

### HumanApproval

A human-authored approval of a commit or file.

Owns:

- scope: commit or file
- final approved mark: `PASS` or `MODIFY`
- approved concern areas for commit scope only
- local change refs accepted as evidence when approving `MODIFY`
- optional notes
- approver
- timestamp

This is a real product boundary. Agents must not create these.

### ThreadedComment

A discussion thread comment attached to a review scope or precise anchor.

Owns:

- scope: version, commit, file, or diff block
- anchor: scope, diff block, or line range
- thread ID and parent comment ID
- body markdown
- open/resolved state
- author
- created, updated, and resolved metadata

This is for review discussion, not durable rationale.

### ReviewNote

Freeform markdown note attached to a commit, file, or diff block. See
`docs/canonical-review-note.md` for the focused note model.

Owns:

- scope
- body markdown
- author
- created and updated metadata
- soft-delete metadata
- revision history

This is for rationale and context that should not live as threaded discussion.

### ReviewPlan

A markdown planning workspace attached to a review scope.

Owns:

- scope
- body markdown
- created and updated actor metadata

This is acceptable only if the product needs a planning note distinct from
`ReviewNote`. If plans become checklist items, statuses, decisions, or mini
workflow objects, that requires a separate product decision. The current
"markdown plan per scope" model is the least dangerous version.

### DetectorRun

A machine analysis pass over a review version.

Owns:

- version ID
- concern map version
- state: running, completed, or failed
- start, completion, and failure metadata

This is diagnostic/evidence generation, not editable review state.

### DetectorEvidence

A machine-produced evidence record.

Owns:

- detector run
- affected review scope
- concern area
- optional suggested review mark
- title and summary
- typed detail: path, symbol, marker, template marker, diff, or graph
- creation timestamp

This must remain distinct from review state. Evidence can suggest; it must not
silently become approval.

### ReviewEvent

Audit trail for material review changes.

Owns:

- actor
- scope
- kind
- summary
- typed event payload
- timestamp

Useful event kinds:

- review mark changed
- concern areas changed
- agent review recorded
- human approval recorded or revoked
- local change linked
- comment resolved
- plan updated

This is history, not the source of current state unless the product deliberately
becomes event-sourced. It should not.

### ReviewLedger

The final completed review record for a version.

Owns:

- version ID
- human generator
- generated timestamp
- optional summary
- entries

This is the completion artifact.

### ReviewLedgerEntry

One final accepted commit result inside a ledger.

Owns:

- commit ID
- upstream SHA
- final approved mark: `PASS` or `MODIFY`
- final concern areas
- local change refs
- human approver
- approval timestamp

This should be immutable once generated, or at least treated as an audit artifact
with very explicit replacement rules.

## Commands, Not Entities

These are operations, not product objects:

- set commit review mark
- set file review mark
- set commit concern areas
- record agent review
- record human approval
- link local change ref
- add or resolve threaded comment
- add, update, or delete review note
- upsert review plan
- generate review ledger

Commands validate intent and produce durable row changes. They must not become a
parallel domain model.

## Derived Read Fields

These belong in API response composition, not as first-class persistence tables
unless proven otherwise:

- `fileCount`
- `unresolvedCommentCount`
- nested `localChangeRefs`
- nested `agentReviews`
- nested `humanApproval`
- nested ledger `entries`
- schema catalog/bootstrap metadata

Those are normal read-service composition results.

## Explicit Non-Surface

These should not exist in the product model:

- decisions
- actions
- outcomes
- classifications
- tags or taggings
- primary/secondary tag systems
- version finalization, readiness, or status
- document-shaped review blobs
- projection/materialized document machinery
- compatibility adapters to old prototype shapes
- generated OpenAPI or JSON Schema as authority

## Implementation Priority

The next useful engineering plan is a narrow vertical slice:

`ReviewVersion -> ReviewCommit -> ReviewFile -> DiffBlock -> read API -> web workbench`

That path must be real before layering comments, notes, plans, local changes,
approvals, detector evidence, or ledger generation on top.

The first slice should prove:

- persisted records match the product entities
- API reads compose canonical response shapes from those records
- the workbench consumes real API data instead of static preview objects
- tests verify behavior at the service and route boundaries

Only after that spine exists should secondary workflow entities be added.
