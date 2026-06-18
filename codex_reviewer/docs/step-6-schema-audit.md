# Step 6 Schema Audit

This audit checks the current `codex_reviewer` contracts and Drizzle schema against the target review journey. It deliberately treats ingest and detector code as producers, not as sources for persistence shape.

## Audit Yardstick

Canonical app state includes:

- ReviewVersion
- ReviewCommit
- ReviewFile
- DiffBlock
- ReviewMark
- ordered commit ConcernArea rows
- detector evidence
- AgentReview
- HumanApproval
- ReviewEvent
- LocalChangeRef
- ThreadedComment
- DecisionNote
- ReviewPlan
- VersionFinalization and review ledger entries

## What Is Already Aligned

- The contracts package owns Zod schemas with field descriptions for the main review ladder and review collaboration objects.
- The eight canonical ConcernArea values are centralized in `concern-areas.ts` with labels, descriptions, ordering, and ordered unique selection.
- ReviewMark is centralized as `PASS`, `FLAG`, `MODIFY`, `DONE`, with DONE requiring local change evidence in the commit, file, approval, and ledger schemas.
- Files do not have concern areas in the public file schema.
- Drizzle uses direct tables for the core target concepts rather than the old tag/classification model:
  - review versions
  - review commits
  - review files
  - diff blocks
  - commit concern areas
  - local change refs
  - agent reviews
  - human approvals
  - review events
  - threaded comments
  - decision notes
  - review plans
  - version finalizations
  - review ledger entries

## Schema Gaps To Repair Before Producers

### Detector Evidence Is Missing

The target journey and Step 6 checkpoint both name detector evidence as canonical app state, but `codex_reviewer` currently has no first-class detector evidence contract and no detector evidence tables.

This should be repaired before ingest or detector integration. The detector should emit typed canonical evidence and first-pass review state; it should not reintroduce private concern-map objects, arbitrary finding blobs, or old detector response shapes as persistence.

### ReviewEvent Is Too Generic

`ReviewEventSchema` currently has a generic `payload: JsonRecordSchema`, and the database stores `review_events.payload_json`.

That is the one current schema area most likely to become hand-turned JSON. Review events need kind-specific typed payloads, or a direct relational history model, so changes to review marks, concern areas, agent reviews, human approvals, and local change refs are recorded without a loose JSON escape hatch.

The current event scope is also only commit-or-file, while the event kind list includes collaboration events such as `commentResolved` and `planUpdated` that can naturally belong to version or diff-block scopes. Either ReviewEvent should use full ReviewScope where appropriate, or review-state history and collaboration events should be split.

### Commit/File/Diff Ordering Is Not Canonical Yet

The product ladder needs stable ordering:

- commits within a review version
- files within a commit
- diff blocks within a file

The current contracts and tables do not model those positions. This is not because git happens to emit an order; it is because the review UI, MCP resources, ledger generation, and agent targeting need stable app-owned order.

Add order fields only as canonical product state. Do not copy parser internals wholesale.

### Commit Review Verification Should Require Concern Areas

The target journey says agents verify both review marks and concern areas for commits, and humans approve the final commit state.

Current schemas allow commit-scoped `AgentReview` and `HumanApproval` records to omit concern areas. File scopes correctly forbid concern areas. Commit scopes should require ordered concern areas when the record is commit-scoped.

### DB Allows Invalid Concern-Area Attachments Through Join Tables

The public schemas forbid file concern areas, but the database can currently attach rows in `agent_review_concern_areas` or `human_approval_concern_areas` to an agent review or human approval whose parent row is file-scoped.

That mismatch should be removed by schema design rather than trusted to callers. Reasonable repairs include explicit scope typing with constraints or separate commit/file review tables.

### Local Type Unions Duplicate Contract Types

`apps/api/src/db/schema/types.ts` duplicates contract-owned unions such as ActorKind, ReviewScopeType, ChangeKind, ReviewVersionState, ThreadedCommentState, and ReviewEventKind.

Those unions should come from the canonical contracts package wherever possible so the DB layer cannot drift from the shared schemas.

### Entity Schemas Mix Stored Entities With Derived Counts

`ReviewCommitSchema` and `ReviewFileSchema` include `fileCount` and `unresolvedCommentCount`, but those are not stored on the corresponding tables.

This can be valid, but it needs to be explicit. Either those fields become part of a response/view schema, or persistence owns them as maintained app state. They should not quietly force ad hoc projection helpers.

### Version State Needs A Tight Boundary

`ReviewVersionState` currently includes `open`, `readyForApproval`, and `finalized`.

This is acceptable only if it remains a lifecycle field and does not become a substitute for the old status/readiness machinery. Readiness should be derived from canonical marks, comments, approvals, local changes, and finalization rules unless we explicitly choose to store it.

## Recommended Repair Slice

Before producer work, repair the schema baseline in this order:

1. Add canonical detector evidence contracts and tables.
2. Replace generic ReviewEvent payload JSON with typed history/event schemas and matching persistence.
3. Add canonical order fields for commits, files, and diff blocks.
4. Tighten AgentReview and HumanApproval commit/file invariants, especially commit concern-area requirements.
5. Remove duplicated DB-local enum unions in favor of contract-owned types.
6. Decide whether counts belong to entity schemas or response/view schemas, then make contracts and DB match that decision.

Only after those repairs should GitHub/upstream ingest and concernMap/detector code write into the canonical model.
