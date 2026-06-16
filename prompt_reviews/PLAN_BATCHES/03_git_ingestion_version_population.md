# Batch 03: Git Ingestion And Version Population

## Owner

Git ingestion subagent.

## Purpose

Replace markdown generation as the primary review input with structured database population from Git intervals.

## Dependencies

Requires Batches 00, 01, and 02.

## Write Scope

Allowed:

```text
src/git/gitClient.ts
src/git/diffParser.ts
src/git/changeFiles.ts
src/git/commitLog.ts
src/git/**/*.test.ts
src/ingestion/populateNextVersion.ts
src/ingestion/diffBlockBuilder.ts
src/ingestion/**/*.test.ts
src/services/ingestionService.ts
src/services/ingestionService.test.ts
src/test-support/fixtures/**
```

Allowed repository changes:

- Narrow additions needed by ingestion, reviewed by the lead.

Forbidden:

- HTTP routes.
- MCP tools.
- Frontend changes.
- Legacy markdown importer.
- Any `.prompt-review.md` output as part of normal population.

## Required Boundary Schemas

Use hand-authored schemas from Batch 01:

```text
PopulateNextVersionParamsSchema
PopulateNextVersionResponseSchema
DiffBlockViewSchema
VersionSummarySchema
```

Do not use generated row schemas as external command/response contracts.

## Functional Requirements

Implement `populateNextVersion` behavior:

- Default target is `upstream/main`.
- Default base is the most recent closed version `target_sha`.
- Allow explicit `baseRefOrSha` and `targetRef`.
- Resolve refs to full SHAs before storing.
- Create a version row for `(base_sha, target_sha)`.
- Import commits in stable chronological/review order with ordinal.
- Store parent SHA, subject, body, author, and commit timestamps where available.
- Import changed files with `old_path`, `new_path`, `change_type`, additions, and deletions.
- Support added, modified, deleted, renamed, copied, and mode-changed files.
- Parse Git diff into structured `diff_blocks`.
- Each block has stable `block_key`, ordinal, range metadata, content hash, and diff text.
- Reruns are idempotent or fail with a clear duplicate-version/domain conflict error.

## Diff Block Rules

- `block_key` must not be a markdown heading ID.
- Prefer deterministic keys based on file-level ordinal and hunk/range position, such as `hunk-0001`.
- Store `content_hash` so changed block content can be detected.
- Blocks must be addressable later by comments and MCP tools.
- Deleted files must still produce reviewable file rows and diff blocks.
- Renamed files must preserve both old and new paths.

## Tests

Use fixture Git repositories or controlled Git command doubles to prove:

- Default base selection uses last closed version target SHA.
- Explicit base/target overrides work.
- Commit ordinal order is stable.
- Added file imports correctly.
- Modified file imports correctly.
- Deleted file imports correctly.
- Renamed file imports correctly.
- Diff block ranges, ordinals, keys, hashes, and diff text are stable.
- Rerun behavior is idempotent or returns a typed conflict.
- No `.prompt-review.md` files are created.
- No legacy comments import runs during normal population.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for ingestion tests.
- Ingestion uses repositories or service abstractions, not raw Drizzle in Git modules.
- Ingestion is decoupled from Fastify, MCP SDK, React, and frontend code.
- Populated database can answer version, commit, file, and diff block queries without markdown.

## Rejection Criteria

Reject the batch if:

- It writes markdown as normal output.
- It treats repo file paths as stable review entity IDs.
- It imports old comments or markdown during normal population.
- Git parsing is coupled to API, MCP, or UI modules.
- Diff blocks cannot support later comment anchoring.

