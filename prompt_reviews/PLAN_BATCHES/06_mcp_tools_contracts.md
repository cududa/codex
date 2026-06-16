# Batch 06: MCP Tools And Resources Contracts

## Owner

MCP subagent.

## Purpose

Replace prototype markdown-oriented MCP tools with structured tools that call the same services and boundary schemas as HTTP.

## Dependencies

Requires Batches 00 through 05.

## Write Scope

Allowed:

```text
src/mcp.ts
src/mcp/server.ts
src/mcp/tools/populateNextVersion.ts
src/mcp/tools/listVersions.ts
src/mcp/tools/listRemainingCommits.ts
src/mcp/tools/listCommitFiles.ts
src/mcp/tools/getFileReview.ts
src/mcp/tools/classifyCommit.ts
src/mcp/tools/classifyFile.ts
src/mcp/tools/comments.ts
src/mcp/tools/decisions.ts
src/mcp/tools/plans.ts
src/mcp/resources.ts
src/mcp/schemaJson.ts
src/mcp/format.ts
src/mcp/**/*.test.ts
```

Forbidden:

- Direct Drizzle or repository calls.
- Generated row schema imports.
- Frontend changes.
- Legacy markdown resources as primary navigation.

## Tool Requirements

Implement tools:

```text
populate_next_version
list_versions
list_remaining_commits
list_commit_files
get_file_review
classify_commit
classify_file
list_concern_tags
add_comment
resolve_comment
list_open_comments
propose_decision
finalize_decision
list_missing_decisions
create_plan
update_plan
update_plan_item
complete_plan
```

MCP tools must:

- Reuse or generate JSON Schema from the same hand-authored Zod boundary schemas used by HTTP.
- Call services only.
- Return JSON summaries that parse against shared response schemas.
- Include `nextAction` hints where useful.
- Never instruct agents to edit markdown, `comments.json`, or generated artifacts.

## Resource Requirements

Add structured resources:

```text
prompt-reviews://versions
prompt-reviews://version/{versionId}
prompt-reviews://version/{versionId}/remaining-commits
prompt-reviews://commit/{commitId}
prompt-reviews://commit/{commitId}/remaining-files
prompt-reviews://file/{commitFileId}
prompt-reviews://comments/open
prompt-reviews://decisions/missing/{versionId}
prompt-reviews://plans/open/{versionId}
prompt-reviews://concern-tags
```

Resources return JSON, not markdown review files.

## Bootstrap Composition

`src/mcp.ts` should become a thin compatibility/bootstrap entrypoint if kept:

- Create/register MCP server.
- Wire service context.
- Avoid tool business logic.

## Tests

Add MCP tests for:

- Tool input schemas derive from boundary Zod schemas.
- Tool outputs validate against shared response schemas.
- `populate_next_version` calls ingestion/version service.
- `list_remaining_commits` returns queue-shaped output.
- `get_file_review` returns structured diff blocks.
- `classify_file` enforces tag command validation.
- `add_comment` uses scope/anchor schema.
- `propose_decision` accepts agent actor.
- `finalize_decision` rejects agent actor.
- `create_plan` and `complete_plan` update service state.
- Tool outputs include next-action hints.
- No MCP tool/resource mentions `reviewPath`, `.prompt-review.md`, `bundle`, or `comments.json` as primary workflow fields.
- MCP modules do not import repositories, DB schema, or row schemas.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run test:structure` passes.
- `npm run test` passes for MCP tests.
- HTTP and MCP call the same services for equivalent mutations.
- MCP contracts are generated from or directly reuse boundary schemas.
- Agents can no longer complete review work by editing markdown or JSON files.

## Rejection Criteria

Reject the batch if:

- MCP has a separate mutation implementation from HTTP.
- MCP tools call repositories directly.
- MCP schemas are generated from DB row schemas.
- Markdown resources remain primary navigation.
- Tool names or payloads are centered on `reviewPath` rather than domain IDs/scopes.

