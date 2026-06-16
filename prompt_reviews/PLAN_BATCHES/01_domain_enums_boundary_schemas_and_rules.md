# Batch 01: Domain Enums, Boundary Schemas, And Pure Rules

## Owner

Domain subagent.

## Purpose

Define the shared vocabulary, hand-authored Zod boundary contracts, taxonomy seed data, and pure rule helpers that every later batch must obey. This batch must not introduce persistence, HTTP routes, MCP tools, or UI behavior.

## Dependencies

Requires Batch 00.

## Write Scope

Allowed:

```text
src/domain/enums.ts
src/domain/taxonomy.ts
src/domain/errors.ts
src/domain/schemas/actors.ts
src/domain/schemas/scopes.ts
src/domain/schemas/versions.ts
src/domain/schemas/commits.ts
src/domain/schemas/files.ts
src/domain/schemas/diffBlocks.ts
src/domain/schemas/tags.ts
src/domain/schemas/comments.ts
src/domain/schemas/decisions.ts
src/domain/schemas/plans.ts
src/domain/schemas/remainingWork.ts
src/domain/schemas/index.ts
src/domain/jsonSchemas.ts
src/domain/rules/scopes.ts
src/domain/rules/status.ts
src/domain/rules/actors.ts
src/domain/rules/index.ts
src/domain/**/*.test.ts
src/domain/**/*.schema.test.ts
```

Forbidden:

- `src/db/**`
- `src/repositories/**`
- `src/services/**`
- `src/api/**`
- `src/mcp/**`
- `web/src/**`
- Any generated row schema import

## Enum Vocabulary

`src/domain/enums.ts` must export literal arrays and inferred types for:

```ts
actorTypes = ["human", "agent", "system"]
versionStatuses = ["open", "reviewing", "ready", "closed", "archived"]
reviewStatuses = [
  "unreviewed",
  "needs_classification",
  "reviewing",
  "needs_decision",
  "patch_required",
  "accepted",
  "accepted_with_watch",
  "rejected",
  "blocked",
]
changeTypes = ["added", "modified", "deleted", "renamed", "copied", "mode_changed"]
commentStatuses = ["open", "resolved", "wont_fix", "superseded"]
decisionStatuses = ["proposed", "accepted", "rejected", "superseded"]
decisionOutcomes = [
  "accept",
  "accept_with_watch",
  "patch_required",
  "reject_for_local_build",
  "needs_tests",
  "needs_policy_decision",
  "blocked_on_context",
]
planStatuses = ["draft", "proposed", "accepted", "in_progress", "complete", "abandoned", "superseded"]
planItemStatuses = ["todo", "in_progress", "blocked", "complete", "abandoned"]
riskLevels = ["low", "medium", "high", "critical"]
confidenceLevels = ["low", "medium", "high"]
```

Drizzle tables and Zod schemas must later import these arrays. Do not duplicate enum literals elsewhere.

## Boundary Schemas

Hand-author Zod schemas for these commands:

```text
PopulateNextVersionParamsSchema
ClassifyCommitParamsSchema
ClassifyFileParamsSchema
CreateTaggingParamsSchema
DeleteTaggingParamsSchema
AddCommentParamsSchema
ResolveCommentParamsSchema
ReopenCommentParamsSchema
ProposeDecisionParamsSchema
UpdateDecisionParamsSchema
FinalizeDecisionParamsSchema
CreatePlanParamsSchema
UpdatePlanParamsSchema
CreatePlanItemParamsSchema
UpdatePlanItemParamsSchema
CompletePlanParamsSchema
CloseVersionParamsSchema
```

Hand-author Zod schemas for these views/responses:

```text
VersionSummarySchema
VersionDetailSchema
VersionProgressSchema
CommitQueueItemSchema
CommitDetailSchema
CommitFileQueueItemSchema
CommitFileDetailSchema
DiffBlockViewSchema
FileReviewViewSchema
ConcernTagViewSchema
TaggingViewSchema
CommentSummarySchema
CommentDetailSchema
DecisionSummarySchema
DecisionDetailSchema
PlanSummarySchema
PlanDetailSchema
PlanItemDetailSchema
RemainingWorkSchema
PaginatedResponseSchema
NextActionHintSchema
```

These are API/MCP/frontend/domain contracts. They may include IDs and persisted facts, but must be shaped around user and agent actions, not DB row nullability.

## Scope Shapes

Define discriminated scope schemas:

```ts
ReviewEntityScope =
  | { type: "version"; versionId: string }
  | { type: "commit"; commitId: string }
  | { type: "commit_file"; commitFileId: string }
  | { type: "diff_block"; diffBlockId: string }

DecisionScope =
  | { type: "version"; versionId: string }
  | { type: "commit"; commitId: string }
  | { type: "commit_file"; commitFileId: string }

SourceAnchor =
  | { kind: "scope" }
  | { kind: "block"; diffBlockId: string }
  | {
      kind: "range";
      commitFileId: string;
      side: "old" | "new";
      startLine: number;
      endLine: number;
      startColumn?: number;
      endColumn?: number;
      selectedText?: string;
    }
```

Scope validation must reject mixed parent IDs, missing parent IDs, and mismatched anchor/scope combinations.

## Taxonomy Seed Data

`src/domain/taxonomy.ts` must export seed rows with:

```ts
type ConcernTagSeed = {
  slug: string;
  label: string;
  parentSlug: string | null;
  description: string;
  examples: string[];
  pitfalls: string[];
  sortOrder: number;
};
```

Required top-level slugs:

```text
goal-steering-contract
message-role-authority
prompt-source-authority
hidden-context-transcript
continuation-lifecycle
goal-state-accounting
tool-execution-surface
permissions-workspace-environment
storage-boundary-movement
repo-context-durability
```

Required nested slugs:

```text
goal.initial-steering
goal.continuation
goal.objective-update
goal.completion-audit
role.runtime-owned-frame
role.configurable-steering
role.policy-boundary-drift
prompt.artifact-proving-risk
prompt.proximity-authority
prompt.get-goal-regrounding
prompt.fidelity
hidden.goal-context-marker
hidden.visible-leak
lifecycle.interrupt-pause
lifecycle.thread-resume
lifecycle.suppression
state.blocked
state.usage-limited
accounting.progress-lifecycle
tools.discovery-amplifier
tools.mcp-contract
permissions.workspace-root
permissions.runtime-refresh
boundary.core-to-extension
boundary.goal-store
boundary.app-server-api
context.agents-md
context.compaction-history
```

Also export tagging guidance constants:

- Exactly one primary tag per commit/file/block.
- Secondary tags are amplifiers.
- Tool tags are usually secondary unless the tool contract itself changed.
- Storage/accounting tags are not prompt behavior unless model-input construction or authority moved there.

## Pure Rules

Implement pure helpers in `src/domain/rules/**`:

```text
validateReviewEntityScope
validateDecisionScope
assertHumanFinalizer
deriveCommitFileStatus
deriveCommitStatus
deriveVersionReadiness
statusPrecedence
canMarkAccepted
canCloseVersion
```

Inputs must be plain objects. No DB, repository, API, MCP, filesystem, or UI imports.

Rules:

- A file with no primary/secondary tags is `needs_classification`.
- A file without an accepted human-final decision is `needs_decision`.
- Accepted `patch_required` drives `patch_required`.
- Accepted `accept_with_watch` drives `accepted_with_watch`.
- Accepted `reject_for_local_build` drives `rejected`.
- `blocked_on_context` drives `blocked`.
- Unresolved comments block `accepted`.
- Incomplete accepted plan items block `accepted`.
- Commit status is strictest child status in this order: `patch_required`, `blocked`, `needs_decision`, `needs_classification`, `reviewing`, `accepted_with_watch`, `accepted`.
- Version `ready` can be derived. Version `closed` cannot; it requires explicit human action.

## Tests

Add tests for:

- Enum drift: all schema enums derive from `enums.ts`.
- Taxonomy: required slugs exist, parent slugs resolve, sort orders are stable.
- Scope validation: valid version/commit/file/block scopes pass; mixed or missing IDs fail.
- Command schemas: classify, comment, resolve, reopen, propose/finalize decision, create/update plans, complete plan.
- Actor rules: agent can propose; agent cannot finalize accepted/closed decisions.
- Status rules: all rule bullets above.
- JSON schema generation: exported boundary schemas can be converted by `jsonSchemas.ts` without importing row schemas.

Use whole-object equality where practical.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test` passes for domain tests.
- `npm run test:structure` passes.
- Boundary schemas do not import `src/db/**`, `src/db/rowSchemas.ts`, `drizzle-orm`, or `better-sqlite3`.
- No schema exposes `reviewPath`, `bundle`, `.prompt-review.md`, or `comments.json` as a primary command field.
- Frontend, API, and MCP can later import from `src/domain/**` without pulling in server-only DB modules.

## Rejection Criteria

Reject the batch if:

- Generated DB row schemas are used as command/response schemas.
- Domain schemas mirror snake_case DB rows by default instead of domain/action payloads.
- Actor authority is represented as `isHuman` or another boolean.
- Human-only finalization is deferred to API/UI instead of expressed in rules/services.
- Status derivation is just manual labels.
- Markdown, review paths, or bundles reappear as core domain concepts.

