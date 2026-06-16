# Batch 09 Final Acceptance Notes

## Commands

- `npm run typecheck`: passed.
- `npm run test:structure`: passed for 160 source files.
- `npm run test`: passed, 30 test files / 132 tests.
- `npm run db:generate`: passed with no schema drift.
- `npm run db:check`: passed.
- `npm run schema:json`: passed, 42 boundary schemas exported.
- `npm run build`: passed.

No mandatory command was skipped.

## Manual Verification

Ran a real migrated SQLite workflow against `data/batch09-manual.sqlite`, then removed the database artifact.

Verified:

- Open version listing and commit/file/diff-block read views are DB/API shaped, not markdown shaped.
- File classification with one primary concern and rationale moved the file to `needs_decision`.
- Human comment creation produced unresolved work.
- Agent proposed an `accept` decision.
- Agent finalization was rejected by the service guard.
- Human finalization succeeded, but the unresolved comment kept the file `blocked`.
- Resolving the comment allowed the accepted decision to drive file status to `accepted`.
- Accepted plan with an incomplete item moved file/commit back to `blocked`.
- Completing the plan item and plan restored file/commit to `accepted`.
- Version recomputed to `ready` with only `version_closure` remaining.
- Agent version closure was rejected.
- Human version closure succeeded.
- No step required editing markdown or JSON artifacts.

Final manual output:

```json
{
  "version": "closed",
  "commit": "accepted",
  "file": "accepted",
  "remainingBeforeClose": ["version_closure"],
  "agentFinalizeRejected": true,
  "agentCloseRejected": true,
  "markdownEdited": false,
  "jsonEdited": false
}
```

## Review Evidence

- Schema authority:
  - Drizzle table definitions live in `src/db/schema.ts`.
  - Generated row schemas live in `src/db/rowSchemas.ts`.
  - Hand-authored boundary schemas live under `src/domain/schemas/**`.
  - `npm run test:structure` and source scans confirmed generated row schemas do not leak into API, MCP, or frontend contracts.

- Service invariants:
  - Human-only decision finalization: `src/services/decisionService.test.ts`.
  - Explicit human version closure: `src/services/versionService.test.ts`.
  - Accepted decisions, unresolved comments, incomplete accepted plans, and overrides: `src/services/statusService.test.ts`.
  - Remaining-work queries: `src/services/reviewQueueService.test.ts`.
  - Plan blockers and completion: `src/services/planService.test.ts`.

- Boundary checks:
  - API/MCP/frontend source scan found no imports from DB, repositories, services, generated row schemas, Drizzle, or SQLite.
  - Architecture checker passed for 160 source files.

- Legacy boundary:
  - Legacy import/export is isolated under `src/legacy/**` and `scripts/import-legacy-review-data.ts`.
  - `src/legacy/legacyImport.test.ts` proves comments JSON import, markdown best-effort warnings, duplicate safety, no legacy schema columns, and read-only export.
  - Primary workflows do not depend on `.prompt-review.md` or `comments.json`.
  - No DB schema models review folders, markdown paths, bundles, or artifact files as primary entities.

## Residual Notes

- Pre-existing root prototype modules remain present but quarantined by architecture tests; primary server, API, MCP, and frontend no longer import them.
- No skipped tests.
