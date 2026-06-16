# Batch 08: Legacy Import, Export, And Decommission

## Owner

Migration subagent.

## Purpose

Provide a one-time bridge from prototype markdown/comments artifacts into the new domain model without allowing those artifacts to shape the schema or primary workflow.

## Dependencies

Requires Batches 00 through 07. This batch must stay last.

## Write Scope

Allowed:

```text
scripts/import-legacy-review-data.ts
src/legacy/markdownImport.ts
src/legacy/commentsJsonImport.ts
src/legacy/exportMarkdownReport.ts
src/legacy/types.ts
src/legacy/**/*.test.ts
src/test-support/fixtures/legacy/**
```

Allowed service usage:

- Importers should call services/domain commands where possible.
- Direct repository insertion is allowed only for carefully documented bulk import steps that preserve service invariants or recompute statuses afterward.

Forbidden:

- Core schema changes to accommodate legacy artifacts.
- Primary API/MCP/frontend workflow changes.
- Runtime dependency on legacy markdown for review state.

## Import Requirements

Importer may support:

- Existing `prompt_reviews/**/*.prompt-review.md` files.
- Existing `prompt_reviews/data/comments.json`.
- Existing `local/commit_reviews/**/*.md` only as best-effort human notes if useful.

Importer must:

- Map old artifacts into versions, commits, files, diff blocks, comments, decisions, or plans where possible.
- Record unresolved or ambiguous mappings as import warnings.
- Avoid hidden data loss.
- Be repeatable or safely detect duplicates.
- Leave the primary domain schema unchanged.
- Recompute affected statuses after import.

Importer must not:

- Create `reviewPath`, `bundle`, markdown path, or comments JSON columns.
- Make markdown files active storage.
- Tell future agents to use markdown as the work surface.

## Export Requirements

If export is implemented:

- Export is a read-only projection from DB state.
- Exported markdown is a report, not source of truth.
- Export must include a header saying edits must go through the app/API/MCP, not the markdown file.

## Tests

Add tests proving:

- Legacy comments JSON imports into structured comments.
- Legacy markdown imports best-effort into domain records or warnings.
- Duplicate import is safe.
- Ambiguous anchors become warnings, not silent data loss.
- Import does not require schema changes.
- Import does not create primary markdown/folder/bundle entities.
- Export reads from DB and does not mutate state.
- Architecture checker allows legacy terms only under `src/legacy/**`, `scripts/import-legacy-review-data.ts`, and legacy fixtures.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for legacy tests.
- Import has dry-run mode.
- Import reports counts: versions, commits, files, comments, decisions/plans if any, warnings.
- `comments.json` is no longer active storage.
- Old markdown APIs/tools are deleted, quarantined, or clearly marked as legacy-only after import path is verified.

## Rejection Criteria

Reject the batch if:

- Legacy import changes core schema.
- Legacy files remain active storage.
- Importer becomes a runtime dependency for ordinary review workflows.
- New agents are instructed to work through markdown.
- Failed/ambiguous imports disappear silently.

