# Batch 09: Final Acceptance And Lead Review

## Owner

Lead only.

## Purpose

Verify the rebuilt app behaves as one coherent system: Drizzle for persistence, Zod for boundary contracts, services for workflow truth, and UI/MCP/API as clients of the same domain workflow.

## Dependencies

Requires Batches 00 through 08.

## Mandatory Commands

Run from `prompt_reviews`:

```bash
npm run typecheck
npm run test:structure
npm run test
npm run db:generate
npm run db:check
npm run schema:json
npm run build
```

If any command is intentionally unavailable, that is a release blocker unless the lead documents why the command was superseded and updates this batch file.

## Code Review Checklist

Schema authority:

- Drizzle owns table definitions, row shape, relations, indexes, FKs, defaults, and migrations.
- Generated row schemas come from Drizzle tables.
- Generated row schemas are not public API/MCP/frontend contracts.
- Hand-authored Zod schemas own commands, responses, forms, structured agent payloads, and domain views.

Service boundaries:

- Repositories are the only Drizzle query layer.
- Services are the only workflow mutation boundary.
- API and MCP call services.
- Frontend calls API only.
- Web code does not import DB/repository/service modules.

Domain behavior:

- Human-only finalization is enforced in services.
- Version closure is explicit human action.
- Accepted decisions drive review status.
- Unresolved comments block false acceptance.
- Incomplete accepted plan items block false acceptance.
- Status overrides require reasons.
- Remaining-work queries are service-backed.

Legacy boundary:

- No primary workflow depends on `.prompt-review.md`.
- No primary workflow depends on `comments.json`.
- Legacy import/export is isolated under `src/legacy/**` and scripts.
- No DB schema models review folders, markdown paths, bundles, or artifact files as primary entities.

## Manual Verification Scenario

Use a real or fixture Git range:

1. Populate a version from Git.
2. Confirm version list shows open version and progress counts.
3. Select a remaining commit.
4. Select a changed file.
5. Confirm structured diff blocks render from DB/API data.
6. Classify the file with one primary concern and at least one rationale.
7. Add an unresolved comment.
8. Propose an `accept` decision as agent.
9. Attempt to finalize as agent and verify rejection.
10. Finalize as human and verify unresolved comment still blocks accepted status.
11. Resolve the comment.
12. Add an accepted plan with an incomplete plan item and verify accepted status remains blocked.
13. Complete the plan item.
14. Verify file and commit statuses recompute.
15. Verify remaining-work queues update.
16. Close the version as human only after it is ready.
17. Confirm no step required editing markdown or JSON artifacts.

## Required Evidence

Final review notes must include:

- Commands run and results.
- Manual verification notes.
- Any skipped tests with reasons.
- Links or paths to key tests proving service invariants.
- Confirmation that architecture-boundary checks passed.
- Confirmation that legacy artifacts are not primary workflow state.

## Rejection Criteria

Reject the rebuild if:

- DB schema mirrors old filesystem or markdown layout.
- Generated row Zod schemas leak into public API/MCP contracts by default.
- HTTP and MCP diverge in services or schemas.
- Human finalization can be bypassed.
- Status is arbitrary mutable state instead of derived state plus explicit override.
- Tests only typecheck and do not prove state transitions.
- Frontend cannot complete the real structured workflow.
- Legacy markdown is active storage or the primary agent path.
- Any batch left TODO placeholders in production paths.

