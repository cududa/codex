# Batch 02: Persistence, Drizzle SQLite, Row Schemas, And Repositories

## Owner

Persistence subagent.

## Purpose

Implement SQLite persistence with Drizzle as the source of truth for persisted facts. Generate DB-row Zod schemas from Drizzle tables. Add repositories as the only Drizzle query layer.

## Dependencies

Requires Batch 00 and Batch 01.

## Write Scope

Allowed:

```text
src/db/schema.ts
src/db/relations.ts
src/db/rowSchemas.ts
src/db/client.ts
src/db/migrate.ts
src/db/ids.ts
src/db/timestamps.ts
src/db/seedConcernTags.ts
src/db/**/*.test.ts
src/repositories/database.ts
src/repositories/versionsRepository.ts
src/repositories/commitsRepository.ts
src/repositories/commitFilesRepository.ts
src/repositories/diffBlocksRepository.ts
src/repositories/concernTagsRepository.ts
src/repositories/taggingsRepository.ts
src/repositories/commentsRepository.ts
src/repositories/decisionsRepository.ts
src/repositories/plansRepository.ts
src/repositories/index.ts
src/repositories/**/*.test.ts
src/test-support/db.ts
drizzle.config.ts
drizzle/**
```

Forbidden:

- `src/api/**`
- `src/mcp/**`
- `src/services/**` except tiny interface additions approved by the lead
- `web/src/**`
- legacy importers

## Drizzle Schema Requirements

`src/db/schema.ts` must define these tables:

```text
versions
commits
commit_files
diff_blocks
concern_tags
taggings
comments
decisions
plans
plan_items
plan_comments
plan_decisions
decision_comments
```

Use the enum arrays from `src/domain/enums.ts`. Drizzle owns:

- Column names.
- Nullability.
- Defaults.
- Relations.
- Indexes.
- Foreign keys.
- Unique constraints.
- Migration generation.

Do not hand-maintain an independent persistence schema in Zod.

## Required Table Constraints

Implement at minimum:

```text
versions: unique(label), unique(base_sha, target_sha), index(status), index(target_sha)
commits: unique(version_id, sha), unique(version_id, ordinal), index(version_id, review_status), index(sha)
commit_files: unique(commit_id, old_path, new_path), index(commit_id, review_status), index(new_path), index(old_path)
diff_blocks: unique(commit_file_id, block_key), unique(commit_file_id, ordinal), index(commit_file_id, content_hash)
concern_tags: unique(slug), index(parent_id), index(is_active, sort_order)
taggings: unique(tag_id, target_type, target_id), index(target_type, target_id), index(tag_id)
comments: index(status), index(scope, status), indexes for each nullable parent id
decisions: index(scope, status), indexes for each nullable parent id, index(outcome)
plans: index(version_id, status), index(commit_id)
plan_items: unique(plan_id, ordinal), index(plan_id, status), index(commit_file_id), index(decision_id)
```

Enable and test SQLite foreign keys with `PRAGMA foreign_keys = ON`.

## Row Schemas

`src/db/rowSchemas.ts` must use `drizzle-zod`:

```text
createSelectSchema
createInsertSchema
```

Export schemas with names that make DB-only scope obvious:

```text
versionRowSchemas
commitRowSchemas
commitFileRowSchemas
diffBlockRowSchemas
concernTagRowSchemas
taggingRowSchemas
commentRowSchemas
decisionRowSchemas
planRowSchemas
planItemRowSchemas
```

Generated row schemas may be used by repositories, repository tests, DB tests, and narrow domain composition tests. They must not become default API/MCP/frontend contracts.

## Repository Contract

Only repositories may use Drizzle query builders directly.

Repositories may:

- Insert, update, delete, and query persistence rows.
- Provide transaction helpers.
- Provide cursor/limit pagination.
- Provide idempotent upserts where explicitly needed.
- Return DB rows or repository DTOs.

Repositories must not:

- Enforce human-only finalization.
- Derive review status policy.
- Shape return values for one UI screen.
- Import Fastify, MCP SDK, React, or frontend code.

Required repository capabilities:

```text
versions: create, find by id, find by range, list by status, update status, find last closed target
commits: bulk insert, list by version, list remaining by version, update review fields
commit_files: bulk insert, list by commit, list remaining by commit, update review fields
diff_blocks: bulk insert, list by commit_file, find by id
concern_tags: seed idempotently, list tree, find by slug/id
taggings: add/remove/list, list primary by target
comments: add, list by scope/status, update lifecycle fields
decisions: create, update, find active by target, list missing target decisions support queries
plans: create/update/list, plan item CRUD, list incomplete accepted plan items by target
```

## Migration And Seed Requirements

- Generate a Drizzle migration for the initial schema.
- Store generated migration files under `drizzle/**`.
- Add `src/db/migrate.ts` for runtime migration/bootstrap.
- Add idempotent `seedConcernTags`.
- Seed must preserve local edits to existing tag descriptions and only insert missing tags or reactivate/update stable metadata according to a documented policy.

## Tests

Add tests proving:

- Migrations apply to an empty temp SQLite DB.
- Foreign keys reject orphan rows.
- Unique constraints reject duplicates for all constraints listed above.
- Row schemas parse valid DB rows and reject invalid enum/nullability values.
- Concern tag seed is idempotent.
- Transactions roll back on failure.
- Repository round trips work for each aggregate.
- Cursor pagination is stable for commit and file queues.
- Architecture test rejects table/column names containing `review_path`, `markdown_path`, `folder`, `bundle`, `artifact`, `review_file`, or `comments_json` outside legacy importer tests.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for DB and repository tests.
- `npm run db:generate` and `npm run db:check` pass or documented Drizzle command differences are reflected in scripts.
- Drizzle schema imports enum arrays from `src/domain/enums.ts`.
- Row schemas are generated, not hand-authored duplicates.
- Repositories are the only direct Drizzle query layer.
- No markdown/file artifact table exists.

## Rejection Criteria

Reject the batch if:

- Tables model old generated review files, paths, folders, bundles, or `comments.json`.
- API/MCP/frontend imports are introduced.
- Repositories compute workflow status policy.
- Row schemas are exported through a casual public barrel that API/MCP/frontend can import by accident.
- Migrations are hand-edited in ways not represented in Drizzle table definitions.
- SQLite foreign keys are not enabled and tested.

