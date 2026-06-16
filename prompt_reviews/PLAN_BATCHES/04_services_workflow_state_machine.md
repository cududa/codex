# Batch 04: Services And Workflow State Machine

## Owner

Workflow services subagent.

## Purpose

Implement review workflow truth above repositories: scope invariants, classification, comments, decisions, plans, status recomputation, and remaining-work queries.

## Dependencies

Requires Batches 00, 01, 02, and 03 for full version population. Some service tests may use repository fixtures directly.

## Write Scope

Allowed:

```text
src/services/serviceContext.ts
src/services/errors.ts
src/services/statusService.ts
src/services/versionService.ts
src/services/reviewQueueService.ts
src/services/classificationService.ts
src/services/commentService.ts
src/services/decisionService.ts
src/services/planService.ts
src/services/ingestionService.ts
src/services/index.ts
src/services/**/*.test.ts
```

Allowed repository changes:

- Small query additions needed for service invariants, with tests.

Forbidden:

- HTTP route logic.
- MCP tool logic.
- Frontend changes.
- Direct Drizzle query builders in services.

## Service Boundary Contract

API and MCP must later call services for every mutation. Services call repositories. Services validate command schemas, enforce cross-row invariants, mutate rows, and refresh derived statuses.

Services may return domain response/view schemas from `src/domain/schemas/**`. They must not return storage-shaped rows when a domain view is required.

## Required Services

`classificationService`:

- `classifyCommit`
- `classifyFile`
- Enforce exactly one primary tag per target.
- Allow secondary tags and rationale.
- Update classification summary, risk, and confidence.
- Trigger status refresh.

`commentService`:

- `addComment`
- `resolveComment`
- `reopenComment`
- `supersedeComment` if supported.
- Enforce scope parent rules.
- Set author/resolver actor fields and timestamps.
- Trigger status refresh.

`decisionService`:

- `proposeDecision`
- `updateDecision`
- `finalizeDecision`
- `supersedeDecision`
- Agents and humans may propose.
- Only human actors may finalize accepted/rejected/superseded decisions.
- Enforce one accepted non-superseded decision per target.
- Trigger status refresh.

`planService`:

- `createPlan`
- `updatePlan`
- `createPlanItem`
- `updatePlanItem`
- `completePlan`
- Link plans to comments, decisions, commits, files, and diff blocks.
- Accepted plans with incomplete items block false completion.
- Trigger status refresh.

`statusService`:

- Recompute file status.
- Recompute commit status from files.
- Recompute version readiness from commits and unresolved work.
- Respect explicit `status_override` only when paired with a reason.
- Never auto-close versions.

`reviewQueueService`:

- `listRemainingCommits`
- `listRemainingFiles`
- `listMissingDecisions`
- `listOpenComments`
- `listOpenPlans`
- `getRemainingWork`

`versionService`:

- `populateNextVersion` wrapper over ingestion.
- `listVersions`
- `getVersionDetail`
- `closeVersion`
- Version closure requires human actor.

## State Rules

Implement and test:

- A file with no tags is `needs_classification`.
- A file with no accepted human-final decision is `needs_decision`.
- Accepted `accept` can become `accepted` only when unresolved comments and incomplete accepted plan items are absent.
- Accepted `accept_with_watch` becomes `accepted_with_watch` subject to unresolved-work gates.
- Accepted `patch_required` becomes `patch_required`.
- Accepted `reject_for_local_build` becomes `rejected`.
- Accepted `blocked_on_context` becomes `blocked`.
- Commit status is strictest child file status.
- Version `ready` is derived.
- Version `closed` is explicit human action.
- Agent finalization attempts fail.

## Tests

Add service tests for:

- Classify commit and file with one primary tag.
- Reject two primary tags for one target.
- Add comment with valid scope.
- Reject invalid mixed scope parent IDs.
- Resolve comment sets status, resolver, note, timestamp.
- Reopen comment clears resolution fields.
- Agent can propose decision.
- Human can propose decision.
- Agent cannot finalize decision.
- Human can finalize decision.
- Accepted decision recomputes file and commit status.
- Unresolved comments block accepted status.
- Incomplete accepted plan items block accepted status.
- Completing plan items updates remaining work.
- Commit aggregation precedence.
- Version ready vs version closed.
- Status override requires reason.
- Remaining-work service returns missing decisions, unresolved comments, incomplete plans, and blocked items.

Use whole-object equality where possible.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for service tests.
- No service imports Fastify, MCP SDK, React, `drizzle-orm`, or `better-sqlite3`.
- Every mutation path refreshes affected derived status.
- Human-only finalization is enforced in services.
- Remaining-work queries are service-level features, not UI-only calculations.

## Rejection Criteria

Reject the batch if:

- Business rules live only in Zod or DB constraints.
- Services trust API/MCP/UI to enforce human-only actions.
- Status recomputation is optional or caller-dependent.
- Comments, decisions, or plans mutate without refreshing statuses.
- Services expose raw persistence rows as the primary domain result.
- Version closure is automatic.

