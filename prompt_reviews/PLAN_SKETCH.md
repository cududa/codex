# Prompt Reviews Domain Rebuild

## Summary

Rebuild prompt_reviews as a SQLite-backed review workbench for upstream Codex versions, commits, files,
concerns, comments, decisions, and durable plans. The system must not model generated markdown folders/files
as primary entities. Markdown and old JSON comments are legacy import/export material only.

Use Drizzle + better-sqlite3 for SQLite persistence, migrations, relations, indexes, foreign keys, and
database row types. Use Zod for shared API, MCP, frontend, and domain-boundary validation. Do not maintain
two independent schema truths: Drizzle table definitions are the authority for persisted row shape, and
baseline row Zod schemas are generated from those tables with Drizzle's Zod integration. Hand-authored Zod
schemas define API/MCP params, responses, frontend form payloads, structured agent payloads, and domain
commands.

Generated row schemas are useful building blocks, not the review-domain contract. Business invariants such
as scope rules, actor authority, human finalization, derived status, unresolved-work gates, and state
transitions live in service functions with tests. Vitest covers schema composition, repositories, services,
and API/MCP contracts. Sources: Drizzle migrations (https://orm.drizzle.team/docs/migrations), Drizzle SQLite
(https://orm.drizzle.team/docs/get-started-sqlite), Drizzle Zod (https://orm.drizzle.team/docs/zod), Zod JSON
Schema (https://zod.dev/json-schema).

## Schema Authority

Persistence schema:

- Drizzle table definitions are the source of truth for SQLite tables, columns, indexes, foreign keys,
  uniqueness, nullability, defaults, and generated migrations.
- Drizzle repositories are the only layer that reads/writes SQLite directly.
- Database rows should stay close to storage facts. Do not smuggle workflow-only concepts into table shape
  just because they are convenient for a screen or agent response.

Generated row schemas:

- Generate `select`, `insert`, and `update` Zod schemas from Drizzle tables for row-level validation and
  repository test fixtures.
- Use generated row schemas as inputs to composed domain schemas when useful.
- Do not expose generated row schemas directly as stable API/MCP contracts unless the endpoint truly returns
  a persistence row.

Domain and boundary schemas:

- Hand-author Zod schemas for API request params, API responses, MCP tool inputs/outputs, frontend forms,
  structured agent payloads, and domain commands.
- Share enum definitions between Drizzle and Zod so status/outcome/tag vocabulary cannot drift.
- Convert Zod schemas to JSON Schema where MCP tools, OpenAPI-style docs, or structured agent outputs need
  machine-readable contracts.

Service invariants:

- Enforce cross-row and workflow rules in services, not only in Drizzle or Zod.
- Required service rules include scope-specific parent IDs, one primary tag per target, comment resolution
  lifecycle, human-only finalization, accepted decisions driving review status, unresolved comments/plans
  blocking false completion, and version closure requiring explicit human action.
- Test service rules directly. A passing typecheck is not evidence that the review state machine is correct.

Suggested module split:

- `src/domain/enums.ts`: shared enum literals used by Drizzle and Zod.
- `src/db/schema.ts`: Drizzle table definitions and relations.
- `src/db/rowSchemas.ts`: generated Zod schemas from Drizzle tables.
- `src/domain/schemas.ts`: hand-authored Zod command, response, and view-model schemas.
- `src/domain/rules.ts`: pure status derivation and state transition helpers.
- `src/services/**`: workflow services that enforce cross-row invariants.
- `src/api/**`: HTTP routes that validate with domain/boundary Zod schemas.
- `src/mcp/**`: MCP tools generated from the same domain/boundary Zod schemas.
- `web/src/**`: frontend code importing shared domain schemas/types, not DB-only modules.

## Canonical Domain Model

Shared enum vocabulary:

type ActorType = "human" | "agent" | "system";
type VersionStatus = "open" | "reviewing" | "ready" | "closed" | "archived";
type ReviewStatus =
  | "unreviewed" | "needs_classification" | "reviewing" | "needs_decision"
  | "patch_required" | "accepted" | "accepted_with_watch" | "rejected" | "blocked";
type ChangeType = "added" | "modified" | "deleted" | "renamed" | "copied" | "mode_changed";
type CommentStatus = "open" | "resolved" | "wont_fix" | "superseded";
type DecisionStatus = "proposed" | "accepted" | "rejected" | "superseded";
type DecisionOutcome =
  | "accept" | "accept_with_watch" | "patch_required" | "reject_for_local_build"
  | "needs_tests" | "needs_policy_decision" | "blocked_on_context";
type PlanStatus = "draft" | "proposed" | "accepted" | "in_progress" | "complete" | "abandoned" | "superseded";
type PlanItemStatus = "todo" | "in_progress" | "blocked" | "complete" | "abandoned";
type RiskLevel = "low" | "medium" | "high" | "critical";
type Confidence = "low" | "medium" | "high";

Tables:

versions {
  id, label, base_ref?, base_sha, target_ref?, target_sha,
  upstream_remote default "upstream", upstream_branch default "main",
  status, notes?, created_at, updated_at, closed_at?
}
unique(base_sha, target_sha), unique(label)

commits {
  id, version_id, sha, parent_sha?, ordinal, subject, body?,
  author_name?, author_email?, authored_at?, committed_at?,
  review_status, primary_concern_tag_id?, classification_summary?,
  risk_level?, confidence?, status_override?, status_override_reason?,
  created_at, updated_at
}
unique(version_id, sha), unique(version_id, ordinal)

commit_files {
  id, commit_id, old_path?, new_path?, change_type, additions, deletions,
  review_status, primary_concern_tag_id?, classification_summary?,
  risk_level?, confidence?, status_override?, status_override_reason?,
  created_at, updated_at
}
unique(commit_id, old_path, new_path)

diff_blocks {
  id, commit_file_id, block_key, kind, old_start?, old_lines?,
  new_start?, new_lines?, header?, old_text?, new_text?, diff_text,
  content_hash, ordinal, created_at, updated_at
}
unique(commit_file_id, block_key), unique(commit_file_id, ordinal)

concern_tags {
  id, slug, parent_id?, name, description, examples_json, pitfalls_json,
  sort_order, is_active, created_at, updated_at
}
unique(slug)

taggings {
  id, tag_id, target_type, target_id, is_primary, rationale?,
  actor_type, actor_id?, created_at
}
unique(tag_id, target_type, target_id)
app invariant: one primary tag per target

comments {
  id, scope, version_id?, commit_id?, commit_file_id?, diff_block_id?,
  anchor_kind, old_line_start?, old_line_end?, new_line_start?, new_line_end?,
  selected_text?, body, status, resolution_note?,
  resolved_by_actor_type?, resolved_by_actor_id?, resolved_at?,
  author_actor_type, author_actor_id?, created_at, updated_at
}
app invariant: scope determines required parent id

decisions {
  id, scope, version_id?, commit_id?, commit_file_id?,
  status, outcome, title, rationale, impact?, confidence?,
  proposed_by_actor_type, proposed_by_actor_id?,
  finalized_by_actor_type?, finalized_by_actor_id?, finalized_at?,
  supersedes_decision_id?, created_at, updated_at
}
app invariant: only human actors may finalize to accepted/closed outcomes

plans {
  id, version_id?, commit_id?, title, summary, body?,
  status, owner_actor_type?, owner_actor_id?,
  created_by_actor_type, created_by_actor_id?,
  accepted_by_actor_type?, accepted_by_actor_id?, accepted_at?,
  completed_at?, supersedes_plan_id?, created_at, updated_at
}

plan_items {
  id, plan_id, commit_id?, commit_file_id?, diff_block_id?, decision_id?,
  title, body?, status, ordinal, blocked_reason?, completed_at?,
  created_at, updated_at
}
unique(plan_id, ordinal)

plan_comments { plan_id, comment_id }
plan_decisions { plan_id, decision_id }
decision_comments { decision_id, comment_id }

Derived status rules:

- Persist review_status for fast queues, but recompute after comment/decision/plan mutations unless
  status_override is set.
- File status is needs_classification without tags, needs_decision without an accepted human-final decision,
  blocked/patch/watch/accepted based on accepted decision outcome, and cannot become accepted while
  unresolved comments or incomplete accepted plan items remain.
- Commit status is derived from child files, with stricter child statuses winning: patch_required, blocked,
  needs_decision, needs_classification, reviewing, accepted_with_watch, then accepted.
- Version status is ready only when all commits have final decisions and no blocking comments/plans; closed
  is explicit human action.

## Concern Taxonomy

Seed editable nested concern_tags with these top-level slugs:

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

Seed nested slugs:

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

Tagging rules:

- Exactly one primary tag per commit/file/block; use the most specific nested tag when clear.
- Secondary tags are allowed for amplifiers.
- Do not make tools the villain by default; use tool tags as secondary unless the tool contract itself
  changed.
- Do not tag storage/accounting refactors as prompt behavior unless model-input construction or authority
  moved there.

## API, MCP, And UI

API and MCP contracts are domain contracts. They may include database IDs and row-like fields, but they
should be shaped around user and agent actions: classify, comment, resolve, propose a decision, finalize a
decision, create a plan, complete a plan item, and ask what remains. They should not casually expose table
rows just because generated row schemas exist.

HTTP endpoints:

POST /api/versions/populate-next
GET /api/versions?status=open|closed|all
GET /api/versions/:versionId
PATCH /api/versions/:versionId

GET /api/versions/:versionId/commits?remaining=true&limit=&cursor=
GET /api/commits/:commitId
PATCH /api/commits/:commitId/classification

GET /api/commits/:commitId/files?remaining=true
GET /api/commit-files/:commitFileId
PATCH /api/commit-files/:commitFileId/classification

GET /api/concern-tags
POST /api/taggings
DELETE /api/taggings/:taggingId

POST /api/comments
GET /api/comments?versionId=&commitId=&commitFileId=&status=
PATCH /api/comments/:commentId/resolve
PATCH /api/comments/:commentId/reopen

POST /api/decisions
PATCH /api/decisions/:decisionId
POST /api/decisions/:decisionId/finalize
GET /api/versions/:versionId/missing-decisions?target=commit|file

POST /api/plans
PATCH /api/plans/:planId
POST /api/plans/:planId/items
PATCH /api/plan-items/:planItemId
POST /api/plans/:planId/complete

MCP tools mirror the same services:

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

Frontend workbench:

- Left rail: open versions and progress counts.
- Commit queue: remaining commits, primary concern, status, missing decision, unresolved comments.
- File queue: changed files, change type, status, primary concern.
- Main pane: structured diff blocks from DB, not markdown.
- Right pane: classification, comments, decisions, plans.
- Dashboard: open versions, remaining commits/files, missing decisions, unresolved comments, open plans,
  blocked items.

## Implementation Batches

Batch 0, lead only: architecture lock.

- Freeze dependencies, schema names, enum vocabulary, Drizzle/Zod authority boundaries, status derivation,
  and review gate checklist.
- Reject any design with reviewPath, markdown files, folders, or bundles as primary DB entities.
- Reject any design where generated database row schemas become the default public API/MCP contract.

Batch 1, schema subagent: shared enums, Zod boundary schemas, and pure rules.

- Write scope: shared enum constants, hand-authored Zod schemas for API/MCP/domain commands, taxonomy seed
  data, status derivation helpers, and tests.
- Acceptance: frontend/backend/MCP can import the same boundary schemas; tests cover taxonomy nesting,
  derived status, scope validation, and command payload validation.

Batch 2, persistence subagent: Drizzle SQLite.

- Write scope: Drizzle table schema, migrations, generated row Zod schemas, DB bootstrap, repositories,
  seed loader, temp DB tests.
- Acceptance: normalized domain tables, foreign keys, uniques, idempotent taxonomy seed, no markdown artifact
  tables, and generated row schemas do not replace API/MCP boundary schemas.

Batch 3, Git ingestion subagent: version population.

- Write scope: Git service, populateNextVersion, diff parser, ingestion tests.
- Acceptance: last closed target SHA -> upstream/main default range, changed files and diff blocks imported,
  reruns are idempotent or fail clearly, no markdown output.

Batch 4, API subagent: structured HTTP.

- Write scope: route modules, API schemas, integration tests.
- Acceptance: API answers open versions, remaining commits/files, missing decisions, open comments/plans;
  human-finalization is enforced; routes validate params/responses through hand-authored boundary schemas
  rather than leaking persistence rows by default.

Batch 5, MCP subagent: structured tools/resources.

- Write scope: MCP server/tools and MCP tests.
- Acceptance: MCP and HTTP share services/schemas; outputs are JSON with next-action hints; agents cannot
  succeed by editing markdown or comments.json; MCP tool schemas are generated from boundary Zod schemas, not
  directly from database row schemas.

Batch 6, frontend subagent: workbench UI.

- Write scope: web/src/**.
- Acceptance: real version -> commit -> file -> decision workflow; no raw markdown viewer as primary UI; no
  static/demo workflow data.

Batch 7, migration subagent: one-time legacy import.

- Write scope: importer script or manual SQL helper, import fixtures/tests.
- Acceptance: old markdown/comments map into domain records best-effort; import choices do not alter schema;
  comments.json is no longer active storage.

## Lead Review Gates

After every batch, the lead reviews code and sends it back if:

- DB schema copies the old filesystem or markdown artifact layout.
- Drizzle and Zod drift into competing authorities instead of Drizzle owning persistence rows and Zod owning
  boundary/domain payloads.
- Generated row schemas are exposed as API/MCP contracts where a domain command or response schema is needed.
- Frontend is polished but cannot drive classification/comments/decisions/plans.
- MCP and HTTP diverge.
- Agent-proposed decisions become final without human action.
- Status is arbitrary manual labels instead of derived from decisions/comments/plans plus explicit override.
- Tests only typecheck and do not verify repository/service effects, schema-boundary validation, and state
  transitions.

Final acceptance requires:

- npm run typecheck
- npm run build
- Drizzle migration generation/check passes
- Generated row Zod schemas compile against Drizzle tables
- Boundary Zod schemas validate API/MCP command and response payloads
- DB migration/repository tests
- Service state-machine tests
- Git ingestion tests
- API/MCP contract tests
- Manual browser verification of a full workflow
- A real human-final accepted decision updating file/commit status
- Unresolved comments or open plan items preventing false completion
- No markdown artifacts in the primary workflow

## Assumptions

- Version means Git interval, not folder, bundle, or release-only bucket.
- Human finalization is required for accepted decisions and version closure.
- Agents may classify, comment, and propose decisions/plans.
- Plans are durable work artifacts authored across one or more agent conversations and consumed later by
  fresh implementers.
- Legacy import is one-time and subordinate to the new domain model.
