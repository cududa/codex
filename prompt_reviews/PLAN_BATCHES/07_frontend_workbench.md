# Batch 07: Frontend Workbench

## Owner

Frontend subagent.

## Purpose

Replace the raw markdown review UI with a structured workbench for versions, commits, files, diff blocks, classification, comments, decisions, and plans.

## Dependencies

Requires Batches 00 through 06. The frontend should not start until API contract tests exist and core endpoints are usable.

## Write Scope

Allowed:

```text
web/src/entities/review/types.ts
web/src/entities/review/api.ts
web/src/features/review-workspace/ReviewWorkspacePage.tsx
web/src/features/review-workspace/hooks/reviewQueries.ts
web/src/features/review-workspace/model/reviewWorkspaceStore.ts
web/src/features/review-workspace/components/VersionRail.tsx
web/src/features/review-workspace/components/VersionHeader.tsx
web/src/features/review-workspace/components/CommitQueue.tsx
web/src/features/review-workspace/components/CommitDetailHeader.tsx
web/src/features/review-workspace/components/FileQueue.tsx
web/src/features/review-workspace/components/FileReviewPane.tsx
web/src/features/review-workspace/components/DiffBlockViewer.tsx
web/src/features/review-workspace/components/SourceRangeSelector.tsx
web/src/features/review-workspace/components/ConcernTagPicker.tsx
web/src/features/review-workspace/components/ClassificationPanel.tsx
web/src/features/review-workspace/components/CommentsPanel.tsx
web/src/features/review-workspace/components/DecisionPanel.tsx
web/src/features/review-workspace/components/PlansPanel.tsx
web/src/features/review-workspace/components/RemainingWorkDashboard.tsx
web/src/**/*.test.tsx
```

Allowed backend changes:

- None, except tiny API client type exports approved by the lead.

Forbidden:

- `src/db/**` imports.
- `src/repositories/**` imports.
- `src/services/**` imports.
- DB row schema imports.
- Static/demo data in production code.

## Type And API Contract

Frontend types must be inferred from shared domain boundary schemas or generated API client types derived from them.

Frontend must not:

- Duplicate DB row types as web-only types.
- Construct DB-shaped snake_case payloads if the boundary contract is domain-shaped.
- Import generated row schemas.
- Use `/api/file`, `/api/reviews`, generated markdown files, or `comments.json` as the primary workflow.

## Workbench Layout

Primary screen:

- Left rail: versions and progress counts.
- Commit queue: remaining commits for selected version.
- File queue: changed files for selected commit.
- Main pane: structured diff blocks for selected file.
- Right pane: classification, comments, decisions, plans.
- Dashboard area: unresolved work and blocked items.

No landing page. The first screen is the usable workbench.

## Required Workflows

Version workflow:

- List open versions.
- Select version.
- Show commit/file/comment/decision/plan counts.
- Show remaining-work summary.

Commit workflow:

- List remaining commits.
- Show SHA, subject, status, primary concern, missing decision flag, unresolved comments count.
- Select commit.

File workflow:

- List changed files for selected commit.
- Show old/new path, change type, status, primary concern, unresolved comments count.
- Select file.
- Render structured diff blocks from API data.

Classification workflow:

- Pick primary concern tag.
- Add/remove secondary tags.
- Add rationale, risk, confidence where supported.
- Submit through structured endpoint.

Comment workflow:

- Add comment to version, commit, file, diff block, or source range.
- Resolve/reopen comments.
- Counts update after mutation.

Decision workflow:

- Show proposed and finalized decisions separately.
- Agents/historical proposals are visibly distinct from human finalization.
- Human finalization action is explicit.
- UI cannot show accepted completion unless API confirms finalization/status update.

Plan workflow:

- Create plan for version, commit, or file.
- Add/update plan items.
- Complete plan items.
- Show incomplete accepted plans as blockers.

## Tests

Add frontend tests if the test harness supports React:

- Version rail renders open versions and progress counts.
- Commit queue renders remaining status, tags, missing decision flag, and unresolved comments.
- File queue renders changed files and status.
- Diff pane renders structured diff blocks, not markdown text.
- Classification panel sends structured command.
- Comments panel resolves/reopens and updates counts.
- Decision panel requires explicit human finalization action.
- Plans panel shows incomplete accepted plan items as blockers.
- Production code contains no static/demo workflow data.

If component test infrastructure is not ready, add API client schema tests and document manual verification steps. Do not skip `npm run typecheck` or `npm run build`.

## Manual Browser Verification

Run the app and verify:

- Version -> commit -> file navigation works.
- Diff blocks render from DB/API response.
- A classification mutation updates visible status.
- An unresolved comment blocks accepted status.
- A human-final decision updates file/commit status.
- An incomplete accepted plan item blocks completion.
- Completing plan item updates remaining-work counts.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run build` passes.
- Frontend uses structured endpoints.
- Primary UI is not a markdown editor/viewer.
- The workflow can drive classification, comments, decisions, and plans.
- UI states reflect service results, not local optimism alone.

## Rejection Criteria

Reject the batch if:

- The primary UI remains a raw markdown viewer.
- Frontend imports backend DB/repository/service modules.
- Frontend can display accepted/done without a human-final accepted decision from the API.
- UI is polished but cannot drive real services.
- Static/demo data appears in production workflow.
- The API client still depends on `/api/file`, `/api/reviews`, generated review markdown files, or notes JSON as the main path.

