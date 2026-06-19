# Slice: Ingest And Initial Review State

Ingest is the front door for the real persisted review model.

This slice creates one initialized review version from a repository range:

`ReviewVersion -> ReviewCommit -> ReviewFile -> DiffBlock`

It also initializes current review state as part of the same product command:

- initial `ReviewCommit.reviewMark`
- initial ordered `commitConcernAreas`
- explicit `ReviewFile.reviewMark` only when deterministic rules require
  file-level attention

Ingest must not become the back door for old prototype classifications, tags,
projections, preview data, or compatibility shapes.

## Authority

Use these docs as authority:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

Current source is not product authority. Use it only to identify the reset spine
and safe extension points.

`prompt_reviews` may be read only for proven mechanics such as git range
discovery, commit/file enumeration, diff parsing, and hunk/block extraction. Do
not port its product model, vocabulary, DTOs, decisions, classifications, tags,
actions, outcomes, readiness, projection shapes, or compatibility adapters.

## Product Boundary

This slice owns deterministic ingest and baseline initialization.

It creates:

- `review_versions`
- `review_commits`
- `review_files`
- `diff_blocks`
- `commit_concern_areas`
- ingest metadata that records the concern-map version used for the baseline

It initializes:

- each commit's current review mark
- each commit's ordered concern areas
- file review marks only when deterministic rules require explicit file state

This slice must not create or preserve:

- agent review evidence
- detector evidence
- human approval
- local change evidence
- threaded comments
- review notes
- review plans
- review ledgers
- preview data
- projection machinery
- compatibility adapters

## Inputs

Add an explicit ingest command contract:

- `repositoryId`: stable repository identity for the source repository.
- `baseRefOrSha`: base ref or SHA for the upstream range.
- `targetRefOrSha`: target ref or SHA for the upstream range.
- `label`: optional human-readable version label.
- `source`: system-scoped ingest source. This may be a minimal source field for
  the first implementation, but it must not be modeled as a human reviewer or
  agent reviewer.
- `concernMapVersion`: explicit deterministic concern-map version identifier.

Ingest must resolve `baseRefOrSha` and `targetRefOrSha` during the command.
For ingested review versions, `baseSha` and `targetSha` are required. If either
endpoint cannot be resolved to a SHA, ingest must fail before creating rows.

Store both the caller-provided range inputs and the resolved SHAs:

- `ReviewVersion.repositoryId`
- `ReviewVersion.baseRef`
- `ReviewVersion.targetRef`
- `ReviewVersion.baseSha`
- `ReviewVersion.targetSha`
- `ReviewVersion.label`

When the caller provides a SHA instead of a symbolic ref, store that input in
the matching `baseRef` or `targetRef` field as the submitted range endpoint and
also store the resolved SHA in `baseSha` or `targetSha`.

If no label is provided, derive a deterministic label from the repository
identity and resolved range. Do not use wall-clock time in the default label.

## Idempotency

Ingest is idempotent for the resolved repository/range pair.

If an existing `review_versions` row has the same `repositoryId`, `baseSha`, and
`targetSha`, the ingest command must return that existing review version through
the normal read composition. It must not create a duplicate version, rewrite
baseline review marks, replace concern areas, update files, or append events.

The database should enforce this with a unique index on:

- `repository_id`
- `base_sha`
- `target_sha`

If a caller submits different symbolic refs that resolve to an already-ingested
range, the existing version wins. The stored original `baseRef` and `targetRef`
from the first ingest are not rewritten.

## Persistence

Persist the ingest result as ordinary durable rows:

- `review_versions`
- `review_commits`
- `review_files`
- `diff_blocks`
- `commit_concern_areas`

Add an ordinary durable table for ingest metadata:

- `review_version_ingests`

There is exactly one `review_version_ingests` row per ingested
`review_versions` row. Enforce this with `version_id` as a unique foreign key,
or as the primary key.

`review_version_ingests` should store:

- `version_id`
- `repository_id`
- submitted `base_ref_or_sha`
- submitted `target_ref_or_sha`
- resolved `base_sha`
- resolved `target_sha`
- `concern_map_version`
- `source`
- created timestamp

The metadata must be enough to identify the deterministic concern-map rules
used to create the initialized baseline. It is not detector evidence, agent
review evidence, or a projection document.

Create all rows transactionally. A failed ingest must not leave a partial
review spine.

## Ordering

Ordering must be stable and persisted:

- Commits are ordered by upstream range order.
- Files are ordered deterministically within each commit.
- Diff blocks are ordered by file patch order.
- Concern areas are ordered by deterministic concern-map output.

Use zero-based positions for persisted order, matching the existing read
contracts.

File ordering should use git's patch order when available. If the lower-level
git helper does not provide a stable file order, sort by the effective path
(`path`, then `oldPath`) and then by change kind as a deterministic tie-breaker.

Diff block order follows the order hunks appear in the file patch. Do not sort
diff blocks by heading or line number after parsing.

## Deterministic Concern Map

The deterministic concern map is the ingest-time initializer. It is not a
separate post-ingest state mutation for the first implementation.

It uses the same canonical concern-area vocabulary as
`ConcernAreaSelectionSchema`, including:

- canonical slugs
- ordering
- uniqueness
- maximum selected concern area count

Ingest initializes the baseline concern-area selection. Later human correction
of a commit's selected concern areas is outside ingest, uses the normal
review-state write path, and appends `concern_areas_changed`. Corrections do
not rerun ingest or the concern map.

It must not create:

- classifications
- tags or taggings
- primary or secondary tags
- detector evidence
- agent reviews

Rule inputs may include:

- path patterns
- diff markers
- commit title and message metadata
- explicit concern-map config identified by `concernMapVersion`

Rules must be versioned and reproducible. The first implementation may use a
small deterministic rule table, but it must name the version, persist that
version, and keep the output reproducible for the same resolved commit data.

Each rule maps to exactly one concern-area slug. If a category can map to more
than one slug, split it into separate ordered rules with explicit predicates.

Minimal first rule families:

- path or diff markers for prompt, instruction, system/developer message, or
  base instruction changes map to `harness-prompts`
- path or diff markers for role handling, message conversion, transcript item
  typing, or hidden/developer/user role boundaries map to `message-roles`
- explicit predicates for injected context, summaries, or hidden context map to
  `hidden-context`
- explicit predicates for compaction, truncation, summarization, or context
  recovery map to `context-compaction`
- explicit predicates for continuation, resumption, or budget behavior while a
  goal is active map to `goal-continuation`
- explicit predicates for goal creation, update, completion, blocking, display,
  or enforcement map to `goal-behavior`
- path or diff markers for tool schemas, tool descriptions, MCP tools, tool
  routing, or command execution affordances map to `tool-affordances`
- path or diff markers for sandboxing, approvals, trust, permissions, or policy
  gates map to `permission-defaults`

When more than three rules match a commit, choose the first three by the
concern-map version's deterministic rule order. Do not invent primary/secondary
tag semantics.

## Initial Review Marks

Initial marks are current review state initialized before any human or agent
review. They are not evidence.

Commits must start as one of:

- `PASS`
- `FLAG`
- `MODIFY`

Files may have an explicit review mark only when deterministic rules require
file-level attention. Files do not get concern areas.

`DONE` must not exist in contracts, persistence, services, routes, tests, or UI
labels.

Minimal first mark rules:

- `FLAG` when the deterministic concern map selects at least one concern area.
- `PASS` when no concern areas are selected and no file-level deterministic rule
  requires attention.
- `MODIFY` only when a deterministic rule is explicit that local adaptation is
  required before the change can be accepted.

The first implementation may choose not to emit `MODIFY` from ingest until a
specific deterministic rule exists. It must still support storing `MODIFY` as a
valid initial mark because `ReviewMark` allows it.

File-level explicit marks should be rare:

- leave `ReviewFile.reviewMark` null when commit-level state is enough
- set `ReviewFile.reviewMark = FLAG` when a specific file needs attention that
  should remain visible independently of the commit
- set `ReviewFile.reviewMark = MODIFY` only when a specific deterministic rule
  requires local adaptation for that file
- do not set explicit file `PASS` unless there is a concrete product reason to
  record file-level state

If a commit is initialized as `PASS`, its files must not carry explicit `FLAG`
or `MODIFY` marks.

## Events

Ingest creates the initialized baseline. The initial review marks and concern
areas are stored directly on the review rows created by ingest. Ingest records
the concern-map version / ingest metadata needed to reproduce that baseline,
but it does not append review events for those initial values. Review events
begin only after ingest, when a later command changes existing review state.

Do not add `review_mark_changed` or `concern_areas_changed` events for initial
ingest values.

If later implementation changes require audit for the ingest command itself,
that requires an explicit product decision and an update to
`../review-events.md` before code changes.

## Service Boundary

Add an ingest service that owns creation of the initialized review spine.

The ingest service is separate from:

- agent review service
- detector evidence service
- human approval service
- manual mark/concern write service

The ingest service may call shared lower-level helpers for:

- git range discovery
- ref resolution
- commit enumeration
- file enumeration
- diff parsing
- hunk/block extraction

Those helpers must not own product state decisions. The ingest service owns the
transaction that creates the rows and initializes current review state.

Do not implement ingest as a wrapper around manual state mutation methods such
as `setCommitReviewMark`, `setFileReviewMark`, or `setCommitConcernAreas`.

## API Shape

Add explicit contracts:

- `IngestReviewVersionRequest`
- `IngestReviewVersionResponse`

Suggested route:

- `POST /api/review/versions/ingest`

`IngestReviewVersionRequest` should contain the command inputs named above.

`IngestReviewVersionResponse` may return:

- `version: ReviewVersionRead`
- `created: boolean`

The response may return the initialized `ReviewVersionRead`, but it must not use
`ReviewStateWriteResponse`. Ingest is its own product command, not a manual
review-state write.

## Read Composition

No special ingest read model exists.

After ingest, the normal version-rooted read API returns:

`ReviewVersionRead -> ReviewCommitRead -> ReviewFileRead -> DiffBlockRead`

The read service composes the initialized review version from persisted rows:

- `ReviewVersionRead.commits`
- `ReviewCommitRead.reviewMark`
- `ReviewCommitRead.concernAreas`
- `ReviewCommitRead.files`
- `ReviewFileRead.reviewMark`
- `ReviewFileRead.diffBlocks`

Do not add projection documents, compatibility response shapes, preview data, or
ingest-specific read models.

## Source Cleanup Before Build

Before implementing, scan implementation-looking source and tests for old
vocabulary:

- `classification`
- `classify`
- `tags`
- `taggings`
- `primaryTag`
- `secondaryTag`
- `tagSlug`
- `decisions`
- `actions`
- `outcomes`
- `remainingWork`
- `nextAction`
- `finalization`
- `finalized`
- `readiness`
- `readyForApproval`
- `version_closure`
- `DONE`
- `projections`
- `compatibility adapters`
- `preview`
- `mock data`

Delete or rewrite matching implementation surfaces unless they are authority
docs explaining deletion targets.

Do not port from generated `dist` packages, old app data, archived notes,
prototype docs, or `prompt_reviews` product concepts.

## Tests

Required coverage:

- ingest creates `review_versions`, `review_commits`, `review_files`, and
  `diff_blocks`
- ingest creates `commit_concern_areas`
- ingest persists `review_version_ingests.concern_map_version`
- ingest stores submitted refs and resolved SHAs on `ReviewVersion`
- same `repositoryId` + resolved `baseSha` + resolved `targetSha` returns the
  existing review version without duplicating rows
- commits are ordered by upstream range order
- files are ordered deterministically within each commit
- diff blocks are ordered by file patch order
- concern areas use canonical slugs from `ConcernAreaSelectionSchema`
- concern areas preserve deterministic order, uniqueness, and max cardinality
- files never own concern areas
- initial commit marks accept only `PASS`, `FLAG`, or `MODIFY`
- file review mark contracts accept only `PASS`, `FLAG`, `MODIFY`, or null, but
  ingest does not set explicit file `PASS` without a specific product rule
- initial marks reject `DONE` at contract, service, and persistence boundaries
- a `PASS` commit cannot be initialized with explicit `FLAG` or `MODIFY` file
  marks
- reads return the ingested version through normal `ReviewVersionRead`
- ingest does not create detector run or detector evidence rows
- ingest does not create agent review rows
- ingest does not append `review_mark_changed` or `concern_areas_changed`
  events for initial values
- no old classification/tagging/decision vocabulary appears in source tests

Route tests should validate request and response shapes for
`POST /api/review/versions/ingest`.

Service tests should use deterministic git/diff fixtures so the same range
always produces the same rows, order, marks, concern areas, and
`concernMapVersion` metadata.
