# Review Events

Review events are the audit trail for material review changes. They are history,
not the source of current state, and `codex_reviewer` is not event-sourced.

This document defines the canonical event kinds and minimum payload shapes.
Implementations may include additional payload fields when they are useful for
debugging or display, but they must not replace durable product rows with event
payloads.

## Event Row

Every review event owns:

- `id`
- scope: version, commit, file, or diff block
- actor
- kind
- summary
- typed JSON payload
- created timestamp

## Event Kinds

### `review_mark_changed`

Recorded when the current review mark changes for a commit or file.

Minimum payload:

- `target`
- `previousReviewMark`
- `newReviewMark`

### `concern_areas_changed`

Recorded when ordered commit concern areas change.

Minimum payload:

- `commitId`
- `previousConcernAreas`
- `newConcernAreas`

Concern areas must use the canonical concern-area selection contract, currently
`ConcernAreaSelectionSchema`.

### `agent_review_recorded`

Recorded when an agent review evidence row is created.

Minimum payload:

- `agentReviewId`
- `target`
- `reviewedMark`
- `reviewedConcernAreas` for commit-scoped reviews only

This event must not imply approval and must not mutate current review state.

### `human_approval_recorded`

Recorded when a human approval row is created.

Minimum payload:

- `humanApprovalId`
- `target`
- `approvedMark`
- `approvedConcernAreas` for commit-scoped approvals only
- `localChangeRefIds`

Only a human actor may record approval.

### `human_approval_revoked`

Recorded when a human approval is revoked.

Minimum payload:

- `humanApprovalId`
- `target`
- `reason`

Only a human actor may revoke approval.

### `local_change_linked`

Recorded when local adaptation evidence is linked to a commit or file.

Minimum payload:

- `localChangeRefId`
- `target`
- `localCommitSha`

### `comment_resolved`

Recorded when a threaded comment is resolved.

Minimum payload:

- `commentId`
- `threadId`
- `target`

### `plan_updated`

Recorded when a review plan markdown workspace is created or updated.

Minimum payload:

- `planId`
- `target`

## Implementation Rules

The event kind set is a product contract. If a slice introduces a material
review change, update this document before adding the event to code.

Do not create catch-all event kinds to avoid naming a product action.

Do not store compatibility payloads for old classifications, taggings,
decisions, actions, outcomes, finalization, readiness, or `DONE`.
