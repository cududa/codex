# Prompt Reviews Concern Detector Tracker

Source requirements: `local/prompt-review-concern-detector-requirements.md`.

Use this file as the slim compaction-safe work ledger. Keep checklist items
short, and add dated notes under the relevant item whenever work lands,
deviates, or needs follow-up.

Status legend:

- `[ ]` not started
- `[-]` in progress
- `[x]` complete
- `[!]` blocked or needs decision

## Upfront Checklist

- [x] Requirements contract written.
  - Requirements reference: lines 1-1220.
  - Notes: created 2026-06-16 from the grounded concern-map planning pass.

- [x] Supplemental tracker created.
  - Requirements reference: lines 1112-1193.
  - Notes: created 2026-06-16 so progress tracking stays separate from the
    long-form requirements contract.

- [x] Batch 1: concern map and schemas.
  - Requirements reference: lines 783-807, 903-923, 1007-1013, 1117-1131.
  - Must deliver: tracked concern map, detector domain schemas, DB tables,
    migrations, repositories, map/schema tests.
  - Completion notes:
    - 2026-06-16: Started implementation. Scope is the foundational detector
      map/schema/storage/repository layer only; later batches remain open.
    - 2026-06-16: Subagent `019ed254-adfe-77f2-9a59-23aefdecb37d`
      implemented the first Batch 1 patch and has now been closed. Patch adds
      concern map coverage for all eight areas, detector zod schemas, Drizzle
      tables/migration artifacts, row schemas/relations, detector repository
      functions, and focused map/schema/storage/repository tests.
    - 2026-06-16: Local verification passed for `npm run db:check`, focused
      Vitest files, and `npm run typecheck`.
    - 2026-06-16: Batch 1 is still in progress, not complete. Full
      `npm test` failed on architecture checks: `src/db/schema.ts` exceeds the
      500-line source limit, `src/domain/concernMap.ts` exceeds the 500-line
      source limit, and `src/domain/schemas` exceeds the flat-directory file
      limit. Next step is to split the schema/map/schema-module layout without
      weakening Batch 1 requirements, then rerun full tests.
    - 2026-06-16: Rechecked after resuming the Batch 1 subagent. The same
      architecture violations remain in the current worktree, and `npm test`
      still fails on `src/__tests__/public-contracts.test.ts`. Batch 1 remains
      assigned back to the subagent for correction.
    - 2026-06-16: Batch 1 subagent reported partial architecture correction:
      DB table definitions were split into `src/db/schema/reviewTables.ts` and
      `src/db/schema/detectorTables.ts`, `src/db/schema.ts` became a smaller
      barrel/schema table list, and detector schemas moved under
      `src/domain/schemas/concernDetector/index.ts`. Remaining subagent work:
      update imports, split `src/domain/concernMap.ts`, rerun `npm test`,
      `npm run db:check`, and `npm run typecheck`, and ensure no local SQLite
      data artifact is modified.
    - 2026-06-16: Subagent completed architecture correction by splitting the
      concern map into `src/domain/concernMapData/*` while preserving the
      tracked eight-area map. Local verification passed for full `npm test`,
      `npm run db:check`, and `npm run typecheck`.
    - 2026-06-16: Final Batch 1 gates passed locally: full `npm test` (35
      files, 152 tests), `npm run db:check`, `npm run typecheck`,
      `npm run test:structure`, and `npm run build`. Batch 1 is complete and
      ready for its focused commit.
    - 2026-06-16: Batch 1 was committed in a focused git commit excluding the
      unrelated `AGENTS.md` worktree change.

- [x] Batch 2: extractor and scanners.
  - Requirements reference: lines 808-852, 1014-1038, 1133-1146.
  - Must deliver: Rust-aware extractor, text/template scanners, deterministic
    JSON, fixtures, extractor/scanner tests.
  - Completion notes:
    - 2026-06-16: Started Batch 2 after Batch 1 commit `774645a0d8`.
      Scope is the extractor/scanner foundation required by lines 808-852,
      1014-1038, and 1133-1146; no graph-builder/diff-detection success should
      be claimed under this batch.
    - 2026-06-16: Subagent `019ed277-b618-7691-885e-486fac629432`
      was closed after checkpointing. It did not implement extractor/scanner
      modules or fixtures. It left starter shared files
      `src/detector/extraction/types.ts` and `sourceText.ts`; unrelated
      untracked `prompt_reviews/REFACTOR.md` remains outside Batch 2 scope.
      Batch 2 remains in progress and is being reassigned as concrete
      extractor/scanner milestones.
    - 2026-06-16: Text/template scanner milestone completed by subagent
      `019ed27d-2dab-76e2-8aad-3dd4ce0412d9`. Added
      `src/detector/extraction/textScanner.ts`, scanner tests, and text
      fixtures for prompt markers, tool names, RPC methods, config keys, SQL
      migration table names, and hidden-context tags. Subagent reported focused
      scanner tests, structure check, typecheck, and full `npm test` passing.
      Integrated Batch 2 remains open pending Rust-aware extractor milestone.
    - 2026-06-16: Rust-aware extractor milestone files appeared from subagent
      `019ed27c-e644-7741-a982-01b9cae587d3`, including `rustExtractor.ts`,
      tests, and a Rust fixture covering functions, impls, trait impls, enum
      variants, calls, match arms, string markers, role literals,
      `include_str!`, and registration arrays. Local structure check currently
      fails because `src/detector/extraction/rustExtractor.ts` is 517 lines;
      sent back to split under the architecture limit without changing scope.
    - 2026-06-16: Rust-aware extractor milestone completed after refactor into
      `rustExtractor.ts` and `rustSyntax.ts`, both under architecture limits.
      Integrated local validation passed: focused extractor/scanner tests (2
      files, 7 tests), full `npm test` (37 files, 159 tests),
      `npm run test:structure`, `npm run typecheck`, `npm run build`, and
      `npm run db:check`. Batch 2 is complete and ready for its focused commit.
    - 2026-06-16: Batch 2 was committed in a focused git commit excluding
      unrelated `AGENTS.md` and `prompt_reviews/REFACTOR.md`.

- [x] Batch 3: graph builder and detector engine.
  - Requirements reference: lines 854-901, 1040-1055, 1148-1163.
  - Must deliver: seed graph builder, bounded expansion, commit/file/diff
    detection, diff-block mapping, persistence, deterministic rerun behavior.
  - Completion notes:
    - 2026-06-16: Started Batch 3 after Batch 2 commit `12a785f366`.
      Scope is the graph-builder/detector engine required by lines 854-901,
      1040-1055, and 1148-1163. This batch must not claim ingestion hook
      automation or MCP/UI surfacing; those remain Batch 4/5.
    - 2026-06-16: Subagent `019ed289-993b-7c90-8588-ee76dd8f34aa`
      recommended splitting Batch 3 into three implementation milestones:
      graph builder/bounded expansion (`src/detector/graph/*`), diff mapping
      (`src/detector/diff/*`), and engine/persistence
      (`src/detector/engine/*`). Split accepted because it preserves the full
      Batch 3 scope while keeping write scopes reviewable.
    - 2026-06-16: Graph milestone completed by subagent
      `019ed289-993b-7c90-8588-ee76dd8f34aa`. Added deterministic seed graph
      construction, extractor/scanner graph nodes, bounded one-hop expansion,
      per-concern edge allow-list filtering, and expansion metadata. Subagent
      reported focused graph tests, structure check, typecheck, and full
      `npm test` passing.
    - 2026-06-16: Diff mapping milestone completed by subagent
      `019ed28c-ca8c-73e3-9030-3e090325ee2e`. Added unified diff changed-line
      extraction, commit-file/diff-block mapping, old/new side ranges,
      `mapSourceRangeToDiff(...)`, path-only fallback behavior, and focused
      diff mapping tests. Subagent reported focused diff tests, structure
      check, typecheck, and full `npm test` passing.
    - 2026-06-16: Local integrated verification passed for graph+diff focused
      tests (2 files, 11 tests), `npm run test:structure`, and
      `npm run typecheck`. Engine/persistence milestone is next.
    - 2026-06-16: Engine/persistence subagent
      `019ed292-d7e0-7d43-97dc-258a912fc5ec` checkpointed with no files changed
      yet, no blocker, and committed to implement
      `src/detector/engine/runDetector.ts` plus focused tests next.
    - 2026-06-16: Engine/persistence subagent
      `019ed292-d7e0-7d43-97dc-258a912fc5ec` returned the same no-files
      checkpoint and was closed. Engine/persistence remains unimplemented and
      is being reassigned to a fresh subagent.
    - 2026-06-16: Reassigned engine/persistence subagent
      `019ed296-7dff-7190-a3a8-f6bbe786ee72` also returned a no-progress
      checkpoint and was closed. Engine work is being split further into
      engine-core finding construction followed by persistence/rerun/sequential
      repository integration, preserving the full Batch 3 scope.
    - 2026-06-16: Engine-core subagent
      `019ed29a-39c7-7860-9766-fabdc5fae688` also returned no progress and was
      closed. Next engine-core reassignment will be test-first with exact
      function signatures and current graph/diff contracts.
    - 2026-06-16: Engine-core finding builder completed by subagent
      `019ed29e-2d0b-7393-addc-cd3225c29d62`. Added
      `src/detector/engine/*` finding builder/types/tests that produce
      deterministic detector finding inserts from graph nodes plus diff
      mappings, including high/medium/low confidence behavior and stable keys.
      Persistence/rerun/sequential repository integration remains.
    - 2026-06-16: Persistence/rerun reassignment subagent
      `019ed2a4-107f-7f53-8ddd-85f9b88fc2df` returned a no-progress checkpoint
      and was closed. Remaining Batch 3 work is being reassigned as a narrower
      `runDetector` persistence slice with explicit repository contracts.
    - 2026-06-16: Persistence/rerun/sequential integration completed by
      subagent `019ed2a9-05e8-76d1-a650-d2134b1099f7`. Added detector runner
      persistence for runs, graph nodes, graph edges, findings, graph-node-id
      mapping, deterministic same-run replacement, review-artifact separation,
      and sequential A/B expanded-node detection tests.
    - 2026-06-16: Parent review found a stale graph rerun gap when a refreshed
      concern/source scope becomes empty. Sent correction back to the same
      subagent. Correction added explicit `graphReplacementScopes`, empty-scope
      stale node/edge deletion, root-database transaction rollback, and focused
      regression tests.
    - 2026-06-16: Final Batch 3 gates passed locally: focused graph/diff/engine
      tests (5 files, 22 tests), `npm run test:structure`, `npm run typecheck`,
      `npm run db:check`, full `npm test` (42 files, 181 tests), and
      `npm run build`. Batch 3 is complete and ready for its focused commit.

- [x] Batch 4: ingestion and post-commit automation.
  - Requirements reference: lines 42-56, 925-956, 1057-1073, 1165-1178.
  - Must deliver: `populate_next_version` integration, post-commit graph refresh,
    hook install/check path, debug rerun command, automation tests.
  - Completion notes:
    - 2026-06-16: Started Batch 4 after Batch 3 commit `6a32bfd9f2`.
      Scope is automatic upstream ingestion detection, local post-commit graph
      refresh/hook check, debug rerun command, and corresponding automation
      tests. Batch 5 read/API/MCP surfacing remains separate.
    - 2026-06-16: Split Batch 4 into two implementation milestones to preserve
      scope while keeping ownership clear: upstream sequential ingestion
      integration first, then local post-commit/debug automation using the same
      detector refresh path.
    - 2026-06-16: Milestone A upstream sequential ingestion integration landed
      in the worktree. `populateNextVersion` now creates/reuses a
      `version_ingestion` detector run after version rows exist; the detector
      reads changed file content at each commit, evaluates each commit against
      the graph state from prior commits, then grows the graph for later
      commits. The populate response now includes deterministic detector
      summary counts. Validation passed: focused ingestion/runner Vitest (3
      files, 11 tests), `npm run test:structure`, `npm run typecheck`,
      `npm test` (42 files, 182 tests), `npm run db:check`, and
      `npm run build`. Batch 4 remains open for milestone B post-commit hook
      and debug rerun automation.
    - 2026-06-16: Parent review sent the modified
      `prompt_reviews/data/prompt_reviews.sqlite` artifact back to subagent
      `019ed2b7-4ec0-7553-b1ac-28ea602fd712` for cleanup. The subagent
      restored only that generated data file. Parent validation then passed:
      focused ingestion/runner Vitest (3 files, 11 tests),
      `npm run test:structure`, `npm run typecheck`, `npm run db:check`, and
      full `npm test` (42 files, 182 tests).
    - 2026-06-16: Milestone B local post-commit/debug automation landed in
      the worktree via subagent `019ed2cb-35df-7681-8c6b-07c4765e8458`.
      Added post-commit refresh tests and hook check/install tests first,
      then implemented `src/detector/postCommit/*`,
      `src/automation/postCommitHook*`, `src/detector/graph/persistExpansion.ts`,
      and detector CLI scripts under `scripts/`. Local refresh reads changed
      file content at a commit, persists only detector-discovered graph rows
      with upsert semantics, creates no findings by default, and documents
      `PROMPT_REVIEWS_SKIP_POST_COMMIT_REFRESH=1`.
    - 2026-06-16: Parent review verified Batch 4B does not call broad graph
      replacement from the local refresh path, preserves unrelated graph/review
      rows in focused tests, and leaves `prompt_reviews/data/prompt_reviews.sqlite`
      untouched. Final Batch 4 gates passed locally: focused post-commit/hook
      Vitest (2 files, 4 tests), `npm run test:structure`,
      `npm run typecheck`, `npm run db:check`, full `npm test` (44 files,
      186 tests), and `npm run build`. Batch 4 is complete and ready for its
      focused commit.

- [x] Batch 5: review and MCP surfacing.
  - Requirements reference: lines 65-75, 958-1003, 1075-1081, 1180-1193.
  - Must deliver: read model finding summaries, MCP finding exposure, web UI
    summaries, service/API/MCP tests.
  - Completion notes:
    - 2026-06-16: Started Batch 5 after Batch 4 commit `8de14c99a0`.
      Scope is read model extensions, MCP/API output surfacing, and web UI
      finding visibility where review decisions happen. Split into read/API/MCP
      contract work first, then web UI once the contract is stable.
    - 2026-06-16: Milestone A read/API/MCP contract landed in the worktree.
      Commit/file queue items now include compact detector finding summaries,
      commit/file detail views carry the same summaries, and file plus
      diff-block review surfaces expose full detector finding detail. MCP
      outputs for `list_remaining_commits`, `list_commit_files`, and
      `get_file_review` validate those fields through the shared schemas.
      Validation passed: focused read/API/MCP/schema/repository Vitest (6
      files, 30 tests), `npm run test:structure`, `npm run typecheck`, full
      `npm test` (44 files, 187 tests), `npm run db:check`, and
      `npm run build`. Batch 5 remains open for web UI finding visibility.
    - 2026-06-16: Milestone B web UI finding visibility landed in the
      worktree. Commit and file queues now show compact detector finding
      summaries, file review surfaces show file-level detector evidence, and
      diff block cards show diff-block-level detector evidence as compact
      review bands. Detector findings remain evidence only and are not wired
      into tags, statuses, decisions, or plans. Frontend tests now run through
      Vitest and cover API parsing plus server-rendered queue/panel visibility.
      Validation passed: focused web Vitest (3 files, 13 tests),
      `npm run test:structure`, `npm run typecheck`, full `npm test` (47
      files, 200 tests), and `npm run build`. Verified
      `prompt_reviews/data/prompt_reviews.sqlite` remained untouched. Batch 5
      is complete in the worktree and remains uncommitted per instruction.

- [ ] Acceptance pass.
  - Requirements reference: lines 1083-1110.
  - Must verify: automatic upstream findings, diff-block mapping, post-commit
    graph refresh, all eight concern areas, API/MCP surfacing, review-artifact
    separation, test coverage, deterministic reruns, graph growth without agent
    memory.
  - Completion notes:

## Concern Map Reference

- Harness prompts: requirements lines 92-160.
- Message roles: requirements lines 162-217.
- Hidden context: requirements lines 219-293.
- Continuation behavior around `/goal`: requirements lines 295-380.
- `/goal` behavior generally: requirements lines 382-478.
- Context management and compaction: requirements lines 480-581.
- Tool affordances: requirements lines 583-677.
- Permission defaults: requirements lines 679-781.

## Constraints Reference

- Non-negotiables: requirements lines 22-75.
- Detector architecture: requirements lines 783-1003.
- Required tests: requirements lines 1005-1081.
- Known constraints: requirements lines 1195-1206.
- Out of scope: requirements lines 1208-1220.
