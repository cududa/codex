# Target Review Journey

This note captures the desired product journey and approved vocabulary for the prompt review applet rewrite. The current implementation is prototype residue, not legacy. Existing data does not need to be preserved.

## Non-Negotiable Rewrite Boundary

This is a backend rewrite, not a migration.

This is not a compatibility pass, wrapper, adapter layer, bridge, dual-write period, fallback read path, or vocabulary rename over the existing implementation.

The current backend storage and projection model is not source material for the new architecture. Existing review data, migrations, and tables are disposable.

The new backend must be modeled from the target schemas and domain concepts first. Database tables must represent the target concepts directly.

Existing route or service code may only be reused when rewritten against the new schemas and new tables. It must not call old repositories, old projection helpers, or old storage concepts through renamed interfaces.

Old concepts must be removed from active code, not aliased:

- tag
- tagging
- classification
- classify
- primary tag
- secondary tag
- `primaryTagSlug`
- `secondaryTagSlugs`
- `tagSlug`
- `ConcernTag`
- `Tagging`
- `ClassificationView`
- `ClassifyCommitParams`
- `ClassifyFileParams`
- old decision outcome/action machinery
- old plan item workflow machinery
- old flat comments
- old finalized/status substitutes for human approval

The replacement concepts are:

- `ConcernArea`
- `ReviewMark`
- `AgentReview`
- `HumanApproval`
- `ReviewEvent`
- `LocalChangeRef`
- `DecisionNote`
- `ThreadedComment`
- `ReviewPlan`

Tests should enforce that active code uses the replacement concepts directly. Importing the new schemas and reshaping them into the old structures is a failure.

## Core Purpose

The app reviews upstream Codex changes before they are accepted locally. Detector tooling and agents reduce the amount of human attention needed, but the human reviewer owns final approval.

The app should support:

- ingesting a review version
- detecting concern areas from changed code
- assigning review marks to commits and files
- letting agents verify or correct detector output
- letting humans approve the final state
- preserving an audit trail of material review changes
- supporting threaded comments, decision notes, and markdown plans

## Reviewable Ladder

The reviewable ladder remains:

- `Version`
- `Commit`
- `File`
- `DiffBlock`

This ladder describes the product surface. It does not imply that the current persistence model should be preserved.

## Approved Vocabulary

`ConcernArea`

The canonical set of eight concern domains sourced from the concern map work. Concern areas are assigned at the commit level. Files do not have concern areas.

`ReviewMark`

The operational mark for a commit or file:

- `PASS`
- `FLAG`
- `MODIFY`
- `DONE`

`FLAG` is transient. A version cannot be finalized while commits or files remain flagged.

`MODIFY` means the upstream change requires intentional local adaptation before the reviewed version can be accepted.

`DONE` means the required local adaptation has been completed and linked to durable evidence.

`AgentReview`

An agent-authored verification record for a commit or file. Agents can verify whether marks and concern areas are appropriate, but they cannot human-approve work.

`HumanApproval`

A human-authored approval record for a commit or file. Human approval is required before the work is accepted as final.

`ReviewEvent`

An audit/history entry for changes to review-relevant fields, including review marks, concern areas, agent reviews, and human approvals.

`LocalChangeRef`

A durable reference to local work that resolves a `MODIFY` mark and allows it to become `DONE`. This should include one or more local commit SHAs, who linked them, and when they were linked.

`DecisionNote`

A simple human- or agent-authored markdown note. It is not an action-state machine and has no workflow outcome association beyond its scope, author, content, and timestamps.

`ThreadedComment`

A comment model that supports human and agent replies. Existing comments do not need to be preserved or migrated.

`ReviewPlan`

A markdown planning workspace attached to the relevant review scope. The existing plan model should be replaced rather than preserved.

## Mark And Approval Rules

Commits always have a `ReviewMark`.

Files can have an explicit `ReviewMark`, but file marks are only operationally required when the commit is not `PASS`.

If a commit is `PASS`, file marks may still exist internally for fidelity, MCP access, audit, or prior agent work. The UI may hide file mark controls in that case.

A `PASS` commit still requires human review and human approval.

A commit cannot receive human approval while it is `FLAG`.

A commit cannot receive human approval while any of its files are `FLAG`.

All threaded comments for the relevant approval scope must be resolved before human approval.

Before a version is finalized, all remaining `FLAG` marks must be resolved.

A `MODIFY` mark must become `DONE` before human approval and version finalization.

A `DONE` mark requires at least one linked `LocalChangeRef`.

Linked local changes are evidence for `DONE`; they are not a replacement for human approval.

## Concern Area Ordering

Concern areas are ordered by selection order.

The first selected concern area is primary. The second and third selected areas are related/secondary by order. If the first is removed, the next selected area becomes primary.

This ordering rule must be enforced by the API/domain model, not only by frontend state.

## Detector And Agent Flow

The ingest version endpoint starts the review journey.

Concern map tooling supplies the canonical concern areas and should eventually integrate with the ingestion pipeline.

Detector output is a first pass. Agents and humans can correct it.

The detector or agent review process can set commit and file review marks.

For commits, agents verify both the review mark and concern areas.

For files, agents verify the review mark only.

## Human And Agent Permissions

Agents may:

- verify commits and files
- set or correct review marks where allowed
- set or correct commit concern areas
- add threaded comments
- add decision notes
- add or update review plans through MCP

Agents may not:

- create human approvals
- approve commits
- approve files
- finalize a version

Humans may perform final approvals and version finalization.

## UI Journey Notes

Commit cards should replace the current `needs classification` display with the commit `ReviewMark`. Clicking it should open a small in-place control to change the mark.

Commit cards should replace the current tag display with concern areas. Display the first concern area and use a compact `+1`, `+2`, etc. indicator for additional areas.

File cards should replace the current tag area with the file `ReviewMark` control when relevant.

File cards should display change type compactly:

- bright green `+`
- darker green `/`
- red `-`

The diff panel and comment path access for agents should remain conceptually stable.

The right panel should rename `Classification` to `Concern Areas`.

Concern area selection should not use a primary dropdown plus secondary checkboxes. It should use one ordered checkbox-style selection model, where selection order determines primary and related areas.

The current decisions UI and model should be replaced. Decision notes should appear in the diff panel before diffs.

The plan surface should move into the diff panel after diffs and become a larger markdown editor experience.

The existing `Finalized` concept should be replaced by the new human approval and version finalization model.

## Persistence Direction

Start with a fresh Drizzle/database instance.

Do not preserve existing review data.

Do not preserve existing migrations.

Do not port the current backend storage/projection model.

Routes and services may contain useful behavior, but persistence should be rebuilt around the target schemas and domain concepts.

The new persistence model should have tables for the actual target concepts, not document projections that must be rehydrated into review objects through ETL-like code.

If old persistence concepts remain active after the rewrite, the rewrite failed.

## Open Design Notes

The exact representation of file marks under a `PASS` commit needs care. The current direction is to preserve internal fidelity while allowing the UI and derived readiness logic to treat file marks as non-operational when the commit is `PASS`.

The `DONE` transition should be constrained by schema/domain rules so it cannot become a trust-me checkbox. It should require linked local work evidence.
