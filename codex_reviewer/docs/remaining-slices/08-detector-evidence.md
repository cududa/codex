# Slice: Detector Evidence

Detector evidence is machine-produced diagnostic context for a review version.
It can suggest concern areas or review marks, but it must stay distinct from
review state, agent review, human approval, and ledger completion.

This slice is not the ingest concern-map initializer. Ingest concern-map output
sets initial current review state for newly ingested commits/files. Detector
evidence is a later evidence surface unless a separate product change merges
those pipelines deliberately.

## Authority

This document is subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not introduce editable review
state, approval, readiness/finalization, or event kinds not present in those
authority docs.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve detector, classification, tagging, decision, readiness,
projection, or compatibility code because it exists.

## Source Cleanup Before Build

Do not port generated `dist` detector, classification, tagging, decision,
readiness, projection, compatibility, or old evidence-as-state surfaces.

Do not use:

- `ReviewStateWriteResponseSchema`
- `ReviewWriteStore` mark/concern mutation methods
- `review_events` rows for detector evidence
- `ConcernAreaSelectionSchema` for an individual evidence concern
- persisted evidence counters on versions, commits, files, or diff blocks
- detector routes that mutate `review_commits.review_mark`,
  `review_files.review_mark`, or `commit_concern_areas`

Build detector evidence as a separate evidence service beside the reset spine,
for example `detector-read-store` and `detector-write-store`, not inside the
current review-state write store.

## Boundary

Detector runs are system/detector-authored operational records for one review
version.

Detector evidence records are durable observations produced by a detector run.
They may point at a version, commit, file, or diff block; they may carry one
canonical concern area; and they may suggest one canonical review mark.

Detector evidence uses the same canonical concern-area and review-mark
vocabulary, but it does not use `ConcernAreaSelectionSchema`; evidence carries
at most one suggested concern area per evidence record. Use
`ConcernAreaSlugSchema` for the nullable evidence concern and
`ReviewMarkSchema` for the nullable suggested mark.

Evidence insertion must never update:

- commit marks
- file marks
- ordered commit concern areas
- agent reviews
- human approvals
- ledger rows
- derived readiness/status fields

If the UI offers an "apply suggestion" command, that command calls the canonical
explicit review-state write route with a real actor and normal audit behavior.
It does not mutate detector evidence into review state, hidden approval, or a
pending action item.

## Persistence Requirements

Store detector runs as ordinary durable rows owned by a review version.

Each detector run must store `concernMapVersion`, matching the `DetectorRun`
entity in `../product-model.md`.

Run state is operational only:

- `running`
- `completed`
- `failed`

Completed and failed states are terminal. Running runs have no terminal
timestamp; completed runs have a completion timestamp and no failure; failed
runs have a failure timestamp and failure message.

Store detector evidence as ordinary durable rows under a detector run.

Evidence scope IDs must exist and belong to the run's review version.

Evidence may include:

- nullable canonical concern area slug
- nullable suggested review mark: `PASS`, `FLAG`, or `MODIFY`
- title and summary
- typed detail: path, symbol, marker, template marker, diff, or graph

If storage uses JSON for detail payloads, services must parse and validate the
payload through canonical contract schemas on write and read. Arbitrary detector
blobs are not product records.

Do not persist evidence counters on versions, commits, files, or diff blocks.
Counts are derived reads.

## Contracts And API Shape

Add detector contracts under `packages/contracts/src/review/`, reusing existing
primitive, concern-area, and review-mark schemas where they match the authority
docs.

Add contracts for:

- detector run state
- detector evidence scope
- detector evidence detail
- detector evidence read
- detector run read
- create detector run request
- record detector evidence request
- complete detector run request
- fail detector run request
- detector run list response
- detector evidence list response

`DetectorRunRead` and create-run requests must include `concernMapVersion`.

Detector write contracts must identify the detector/system source explicitly.
They are not agent reviews and not human approvals.

Detector writes must use `SystemActorRefSchema`. Do not accept
`HumanActorRefSchema`, `AgentActorRefSchema`, or generic `ActorRefSchema` for
detector writes.

Detector runs and evidence should use explicit response contracts:

- `DetectorRunResponse`
- `DetectorRunListResponse`
- `DetectorEvidenceResponse`
- `DetectorEvidenceListResponse`

Use a focused service boundary separate from review-state writes. Do not stuff
detector evidence into the current mark/concern write store.

Suggested API shape:

- `GET /api/review/versions/:versionId/detector-runs`
- `GET /api/review/versions/:versionId/detector-evidence`
- `POST /api/review/versions/:versionId/detector-runs`
- `POST /api/review/detector-runs/:runId/evidence`
- `POST /api/review/detector-runs/:runId/complete`
- `POST /api/review/detector-runs/:runId/fail`

## Events

This slice does not add review events.

If a later product change adds audit visibility for detector evidence, update
`../review-events.md` first with a concrete event kind and payload shape. Do
not use event rows as the source of detector evidence.

There is no detector event kernel in this slice. Do not add
`detector_run_created`, `detector_evidence_recorded`, classifier, readiness, or
status events.

## Workbench Touchpoints

Expose detector evidence as context around the selected review scope:

- version rail: latest detector run result/count for the selected version
- commit queue: evidence count or subtle indicator for the commit
- file queue: evidence count or subtle indicator for the file
- diff pane: evidence attached to the selected diff block near the block header
- review panel: evidence list for the selected commit/file/diff block with
  concern area, suggested mark, title, and summary

Do not add old classifier UI, tag chips as state, decision prompts, readiness
badges, or automatic approval flows.

## Current Code Hazards

The old detector/classification/tag surfaces were deleted by the reset. Do not
revive them.

The current review write store is only for mark and concern-area mutation.
Detector evidence must be a separate evidence surface.

The current version-rooted read spine is reusable only because it matches the
product model. Extend it with derived counts/context only where useful; do not
turn detector evidence into current review state.

Any detector count or latest-run summary in `ReviewVersionRead`,
`ReviewCommitRead`, `ReviewFileRead`, or `DiffBlockRead` must be derived by read
composition. Do not add detector counter columns to review spine tables.

## Tests

Contract tests:

- detector run state is exactly `running | completed | failed`
- detector writes use `SystemActorRefSchema` and reject human/agent actors
- evidence scopes are version/commit/file/diffBlock only
- suggested review mark is nullable and limited to `PASS | FLAG | MODIFY`
- concern area is nullable or canonical only
- evidence detail is typed and strict

DB tests:

- migrations create detector run and evidence rows
- evidence cascades when a run/version is deleted
- terminal run timestamps are enforced
- invalid concern areas, review marks, scope types, and detail types are
  rejected

Service/API tests:

- create run for an existing version
- reject run creation for a missing version
- record evidence against version, commit, file, and diff-block scopes in the
  same version
- reject evidence for a scope outside the run's version
- reject evidence writes after completion/failure
- completing/failing a run is terminal
- evidence insertion does not mutate commit marks, file marks, ordered concern
  areas, human approvals, or ledger data

Web tests:

- API client calls detector routes with contract-shaped payloads
- workbench renders detector evidence for selected scopes
- applying a suggestion calls the existing explicit review-state route, not the
  detector route
