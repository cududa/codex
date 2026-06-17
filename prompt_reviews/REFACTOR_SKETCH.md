# prompt_reviews Refactor Sketch

This is a planning brief for a substantial refactor of `prompt_reviews`.

It is not an implementation spec. It is not a migration script. It is not a
complete inventory of the existing codebase. It is a guardrail document meant
to preserve product intent while preventing a future implementation agent from
treating a rough sketch as settled architecture.

If a current table, service, route, MCP tool, UI panel, fixture, migration, or
test is not mentioned here, do not infer that it can be deleted. Audit the
code. Make a conscious keep/replace/migrate/remove decision.

## Purpose

`prompt_reviews` exists to help review upstream Codex commits that may disrupt
the user's workflow with the model and harness.

The review target is not "code quality" in the generic sense. The review target
is workflow-sensitive Codex behavior: prompts, roles, hidden context,
continuation, `/goal`, compaction, tool affordances, and permission defaults.

Small upstream changes in those areas can change whether Codex keeps pushing
toward the user's intended final state or collapses into a low-churn
interpretation of the task. The application should support that review
workflow directly.

## Trust Profile

Treat this section as the hierarchy of authority for the rest of the document.

### Settled Product Intent

- Review disposition is centered on commits.
- The key commit dispositions are `IGNORE`, `FLAG`, and `MODIFY`.
- Those dispositions are routing labels, not final verdicts.
- Concern categories apply at the commit level.
- Detector evidence may point to files, diff blocks, symbols, markers, graph
  nodes, graph edges, and line ranges.
- A file is supporting evidence/context for a commit-level review.
- A commit can have a plan.
- A file should not have its own plan in the target workflow.
- Commit approval is human-only.
- A commit cannot be approved until required plan/comment gates are satisfied.
- Comments remain first-class on commits and files.
- Comment resolution should answer "is this thread resolved?" without making a
  special resolution note the core concept.
- Commits and files need markdown notes.
- Files need durable design-decision records.
- The current proposed-decision model should be removed or replaced.
- The current classification/tag/risk/confidence/rationale stack should be
  removed or replaced for human review workflow.

### Working Hypotheses

These are plausible directions, not settled schema contracts:

- Commit disposition may need both current state and history.
- Commit concern categories may be stored separately from detector findings.
- Notes may be one mutable markdown document per entity, multiple note records,
  or both.
- There may be one active plan per commit plus historical plans.
- Action queues may be computed services rather than database views.
- Old tables may need compatibility bridges before removal.

### Open Until Designed

Do not implement these by guessing:

- What exactly makes a commit plan "valid".
- Whether `IGNORE` commits require a plan before closure/approval.
- Whether `FLAG` commits require a plan before closure/approval.
- Whether approval can be revoked.
- Whether new comments after approval reopen or invalidate approval.
- How `wont_fix` and `superseded` comments migrate.
- Whether detector `riskLevel`, `confidence`, and `rationale` should be
  removed, renamed, narrowed, or preserved as detector-only evidence metadata.
- Whether version closure remains separate from commit approval.
- How legacy imports/exports preserve older review data.

## Rejected Current Concepts

The following user language is intentionally blunt because it captures the real
product mismatch:

> Tag, classification, risk, confidence, and rationale are absolutely a mess
> and not at all what I wanted here. So we're going to be completely ripping
> that out.

> The whole "propose decision" concept makes no sense.

> The "resolution note" is the entirely wrong concept.

Interpret this as: do not preserve the current workflow by renaming it. It does
not mean: delete every table immediately without migration, compatibility, or
consumer analysis.

## Current Model Inventory Required Before Editing

Before making schema or API changes, inventory the actual code. At minimum,
audit these areas:

- domain enums and Zod schemas
- database schema and relations
- repositories
- status rules
- services
- REST API routes
- MCP tools and resources
- web API wrappers
- web panels/dashboards
- ingestion and legacy import/export
- tests and architecture boundary tests
- migrations and seeded data

Known current concepts affected by this refactor:

| Current concept | Current role | Target direction | Risk |
| --- | --- | --- | --- |
| `reviewStatuses` | Broad workflow lifecycle for commits/files | Replace with separate axes, including commit disposition | A direct enum rename would preserve wrong semantics |
| file `reviewStatus` | Files currently drive commit status | Remove as workflow authority or make transitional/read-only | Large fallout in status rules, queues, UI |
| `concern_tags` / `taggings` | Generic classification taxonomy over multiple scopes | Replace human workflow use with commit concern categories | Detector concern slugs are separate; do not conflate |
| `classification_metadata` | Summary/risk/confidence per target | Remove/replace for review workflow | May affect read models and MCP tools |
| `decisions` | Proposed/finalized decision workflow | Remove/replace with notes, plans, design decisions, approval | Tightly coupled to status, plans, MCP, UI |
| `plans` | Version/commit/file-scoped plans | Keep/adapt for commit plans only | Current file/version scopes need migration decisions |
| `plan_items` | Plan checklist, can link files/decisions | Possibly keep, but unlink from decisions | Need new link story for files/diff blocks/design decisions |
| `comments` | Scoped/anchored threads with multiple resolution statuses | Keep, simplify resolution semantics | Preserve anchors and audit metadata intentionally |
| `remainingWork` | Computed classification/decision/plan/comment summary | Replace with explicit action queues | Not a DB view today; services/UI/MCP depend on it |
| detector tables | Evidence graph and findings | Likely keep/adapt | Do not make detector evidence final review state |
| version status | Version-level lifecycle and closure | Re-evaluate alongside commit approval | Commit approval is new state, not a rename |

This table is not exhaustive.

## State Model: Separate Axes

The target workflow should not compress everything into one status enum.

Keep these axes conceptually separate:

| Axis | Meaning | Owned by |
| --- | --- | --- |
| Commit disposition | `IGNORE`, `FLAG`, or `MODIFY` routing label | Detector/agent can suggest; human can override |
| Detector pass state | Whether deterministic review ran and what it found | System/detector |
| Agent review state | Whether lightweight agent review ran and what it concluded | Agent/system |
| Concern categories | Which workflow-sensitive areas the commit may touch | Detector/agent suggest; human may adjust |
| Comment state | Whether threads are open/resolved | Humans and agents, subject to rules |
| Plan state | Whether a commit has a valid plan and plan items | Humans and agents can edit; validity rules TBD |
| Approval state | Whether human approved the commit | Human only |
| Implementation readiness | Whether approved work is ready to implement locally | Derived queue/service state |
| Version closure | Whether the version as a whole is ready/closed | Separate design decision |

`IGNORE | FLAG | MODIFY` must not become the new overloaded lifecycle. A commit
can be `MODIFY`, have unresolved comments, have no valid plan, and be
unapproved. Those are separate facts.

## Authority Matrix

Use this as a design guardrail. It is not a finished permission model.

| Action | Deterministic pass | Lightweight agent | Human |
| --- | --- | --- | --- |
| Suggest `IGNORE` | Yes | Yes | Yes |
| Suggest `FLAG` | Yes | Yes | Yes |
| Suggest `MODIFY` | Yes | Yes | Yes |
| Downgrade detector `MODIFY` | No | No silent downgrade | Yes |
| Override any disposition | No | No | Yes |
| Add detector evidence | Yes | No, unless modeled as agent evidence | Possibly manual |
| Add comments | Maybe system comments if desired | Yes | Yes |
| Resolve comments | TBD | Yes, unless user-only policy says otherwise | Yes |
| Write notes | No | Yes | Yes |
| Add file design decisions | No | Yes | Yes |
| Create/update commit plan | No | Yes | Yes |
| Mark plan valid | No | TBD | Yes or derived rules |
| Approve commit | No | No | Yes only |

Important rule: if the deterministic pass marks a commit `MODIFY`, the agent
pass should not quietly downgrade it. The agent should add evidence, explain
its best guess, or record uncertainty. The human may override the status.

## Concern Categories

Use the current detector concern-map source of truth when implementing. The
currently aligned slugs are:

- `harness-prompts`
- `message-roles`
- `hidden-context`
- `goal-continuation`
- `goal-behavior`
- `context-compaction`
- `tool-affordances`
- `permission-defaults`

These are commit-level concern categories. They are not generic tags. They are
not mutually exclusive. They should not carry generic primary/secondary,
risk/confidence, or decision-style rationale as part of the human review
workflow.

Detector findings may still target files and diff blocks because evidence has a
location. That does not make the file the owner of the category.

Do not conflate these slugs with older taxonomy seed concepts unless the
implementation explicitly migrates or removes that older taxonomy.

## Information Placement Guide

Use this to avoid creating four places for the same fact.

| Information | Belongs in | Notes |
| --- | --- | --- |
| A machine-found path/symbol/marker/range | Detector finding/evidence | Evidence, not final review state |
| Why a commit was routed to attention | Commit disposition note or agent comment | Keep short and review-facing |
| A discussion thread requiring response/resolution | Comment | Comments are threads, not long-term design records |
| Durable context that is not a thread | Commit/file markdown note | Good for summaries and external context |
| A file-level design choice | File design decision | Structured record, not approval |
| Work required before accepting/modifying a commit | Commit plan | Commit-scoped only in target workflow |
| Human sign-off that the commit is ready/closed | Commit approval | Human-only |

Open question: whether "disposition note" is a field, a note type, or derived
from the latest suggestion. Do not create duplicate free-text fields casually.

## Desired Review Flow

### 1. Ingest Version

The system imports commits, files, and diff blocks. Existing ingestion behavior
may already do much of this. Do not change ingestion semantics just to satisfy
this sketch unless needed.

### 2. Deterministic Pass

A deterministic AST/text/graph heuristic pass reviews the version and produces
evidence-backed suggestions.

It may suggest:

- commit concern categories
- commit disposition
- evidence locations
- why the evidence matters

It should not approve commits or create final decisions.

### 3. Lightweight-Agent Pass

A lightweight agent reviews each relevant commit with detector evidence and the
actual diff context.

It may:

- suggest or confirm disposition
- add comments
- write notes
- record file design decisions
- draft or update commit plans
- point to uncertainty or evidence gaps

It must not approve commits.

### 4. Human Review

The human may:

- override disposition
- edit categories
- respond to/resolve comments
- edit notes
- edit design decisions
- approve or reject plan validity, depending on final design
- approve the commit

### 5. Implementation Queue

Approved commits with required plans and resolved comments can move into an
implementation-ready queue. The exact relationship between approval and local
implementation remains a design detail.

## Comments

Keep comments as first-class, anchored review threads.

Target resolution semantics:

- open
- resolved

The important correction is that a required "resolution note" should not be the
core concept. However, do not accidentally strip useful audit metadata.

Likely still useful:

- resolver actor
- resolved time
- updated time
- anchor/range/block metadata
- author metadata

Migration question: map or preserve existing `wont_fix` and `superseded`
statuses intentionally.

## Notes

Commits and files need markdown notes.

Notes should hold durable review context that is not a thread and not a plan.

Design questions:

- one mutable note per entity?
- multiple note records?
- note history?
- separate agent notes and human notes?
- whether notes should be addressable from MCP independently of comments?

Do not use the old quarantined prototype note store as an implementation
foundation without checking architecture tests and current boundaries.

## File Design Decisions

Files need durable design-decision records.

These replace the actual use case that the current proposed-decision model was
poorly serving. They are not formal approval decisions.

Likely fields:

- file id
- title
- body
- author
- created time
- updated time

Open questions:

- Can a design decision attach to multiple files?
- Should commit-level design decisions exist later?
- Should design decisions link to plan items or comments?

Stay with file-level records for the first design unless a concrete workflow
requires broader scope.

## Commit Plans

A commit has a plan. A file does not have a plan.

For `MODIFY` commits, the plan is where required local modification or
mitigation work is spelled out.

Potentially salvageable from the current model:

- plan title/summary
- plan items
- comment links
- diff-block links
- file links from plan items

Likely to remove or redesign:

- version-scoped plans
- file-scoped plans
- decision-linked plans
- plan-item decision links
- completion semantics that do not match the new workflow

Open questions:

- What makes a plan valid?
- Is there one active plan per commit?
- Are old plans preserved as history?
- Do plan items need statuses?
- Who can mark plan items complete?
- Is "plan complete" different from "implementation complete"?

## Human Approval

Commit approval is new state. It is not a rename of accepted decisions or
version closure.

Hard rule:

- Agents cannot approve commits.

Approval requires at least:

- valid commit-level plan, unless a future explicit rule exempts some
  dispositions
- resolved comments on the commit
- resolved comments on the commit's files

Open questions:

- Are diff-block comments included through their parent file?
- Can approval be revoked?
- Can new comments reopen an approved commit?
- Does `IGNORE` need approval, a separate close action, or neither?
- Does `FLAG` need a plan before approval?
- Does approval need an optional human note?

## Action Queues

Replace old `remainingWork` with workflow-specific queues.

`remainingWork` is currently computed, not a materialized database view. It is
nevertheless coupled through services, REST, MCP, UI dashboards, progress
counts, tests, and frontend query keys.

Useful replacement queues:

- commits needing deterministic review
- commits needing lightweight-agent review
- commits marked `FLAG`
- commits marked `MODIFY`
- commits with unresolved comments
- user-authored comments needing agent response
- `MODIFY` commits lacking a valid plan
- commits with a plan awaiting human approval
- approved commits ready for implementation
- blocked commits with missing plan/comment/design-decision prerequisites

Implementation question: expose queues as service methods, REST routes, MCP
tools/resources, database views, or UI projections only after auditing current
consumers.

## MCP And API Surface

The current MCP/API surface mirrors the old model. It includes concepts such as
classification, concern tags, missing decisions, proposed decisions, finalized
decisions, plans, and remaining work.

Target MCP/API capabilities should guide agents through the new workflow:

- list action queues
- read commit review context
- read file evidence/context
- record detector suggestions/findings, if exposed
- record lightweight-agent review output
- suggest or set commit disposition according to authority rules
- add comments
- resolve/reopen comments
- read/write commit notes
- read/write file notes
- add/list/update file design decisions
- create/update commit plans
- read approval state
- request human approval through UI/workflow, without granting agent approval

Do not design tools by one-to-one table CRUD alone. Design them around the
workflow an agent should follow.

## Web UI Surface

Expect UI fallout. The current UI is shaped around classification, decisions,
plans, remaining work, file review, status pills, detector chips, and comments.

Likely target UI areas:

- action queue/dashboard
- commit queue grouped by disposition/action state
- commit detail with categories, disposition, evidence, comments, notes, plan,
  and approval
- file list as evidence/context under the commit
- file detail with diff blocks, comments, notes, design decisions, and detector
  evidence
- comments panel
- notes editor
- design decisions panel
- commit plan panel
- human approval control

Do not let the UI imply file approval or file plans unless a later design
explicitly reintroduces them.

## Replacement Map For Old Workflow

Use this as a starting point for implementation planning, not a final migration
script.

| Old workflow concept | Problem | Replacement direction |
| --- | --- | --- |
| classify commit/file | Encodes generic taxonomy and file-level classification | deterministic/agent review suggests commit categories and disposition |
| primary/secondary tags | Wrong shape for concern categories | commit-level multi-category concern list |
| risk/confidence on classification | Not desired human review model | remove from review workflow; decide separately for detector evidence |
| proposed/finalized decisions | Wrong approval abstraction | comments, notes, file design decisions, commit plan, human approval |
| missing decisions queue | Old decision lifecycle artifact | queues for plan/approval/comment/disposition states |
| file-level plans | Wrong owner | commit plans with file/diff-block references if needed |
| accepted/rejected review statuses | Overloaded lifecycle | separate disposition, approval, implementation readiness, version closure |
| remaining work summary | Hides workflow reason behind generic categories | explicit action queues |

## Implementation Phasing

A safe sequence is likely:

1. Audit current schema, services, API/MCP tools, UI consumers, tests, and
   legacy import/export.
2. Write a concrete schema proposal for new state and transitional mappings.
3. Add new domain schemas and storage without deleting old consumers.
4. Add services for commit disposition, categories, notes, design decisions,
   commit plans, approval, and action queues.
5. Add replacement MCP/API surfaces.
6. Update read models and UI panels.
7. Migrate or bridge existing data.
8. Remove old classification/decision/tagging surfaces only after consumers are
   gone.

Avoid a long-lived state where both old and new concepts look authoritative.

## Footguns

Watch for these specific failure modes:

- Renaming old statuses to `IGNORE | FLAG | MODIFY` while preserving old
  lifecycle behavior.
- Keeping file status as the hidden driver of commit review state.
- Recreating decisions under the name "design decisions".
- Letting detector evidence become final review state.
- Letting agent comments become approvals.
- Making approval available through agent-accessible MCP tools.
- Dropping comment anchors while simplifying resolution.
- Dropping `wont_fix`/`superseded` without migration policy.
- Removing decisions without replacing status derivation.
- Removing classification without deciding how detector concern slugs relate to
  old taxonomy/tag data.
- Keeping action queues that still mean "missing classification" or "missing
  decision" under softer names.
- Passing generated schema tests while MCP guidance still routes agents through
  the old workflow.
- Ignoring legacy import/export because it is not part of the happy-path UI.
- Treating this document's omissions as permission.

## Desired End State

The application should help humans and agents answer:

- What changed in this upstream commit?
- Which workflow-sensitive concern areas might it touch?
- Why did the detector or agent flag it?
- What evidence supports that?
- Is the commit currently `IGNORE`, `FLAG`, or `MODIFY`?
- Who set or overrode that disposition?
- What comments remain unresolved?
- What durable notes or file design decisions matter?
- What plan is needed?
- Has the human approved the commit?
- Is the commit ready for local implementation or acceptance?

It should not feel like a generic taxonomy, risk, confidence, and proposed
decision system.
