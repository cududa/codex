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

- [ ] Batch 2: extractor and scanners.
  - Requirements reference: lines 808-852, 1014-1038, 1133-1146.
  - Must deliver: Rust-aware extractor, text/template scanners, deterministic
    JSON, fixtures, extractor/scanner tests.
  - Completion notes:

- [ ] Batch 3: graph builder and detector engine.
  - Requirements reference: lines 854-901, 1040-1055, 1148-1163.
  - Must deliver: seed graph builder, bounded expansion, commit/file/diff
    detection, diff-block mapping, persistence, deterministic rerun behavior.
  - Completion notes:

- [ ] Batch 4: ingestion and post-commit automation.
  - Requirements reference: lines 42-56, 925-956, 1057-1073, 1165-1178.
  - Must deliver: `populate_next_version` integration, post-commit graph refresh,
    hook install/check path, debug rerun command, automation tests.
  - Completion notes:

- [ ] Batch 5: review and MCP surfacing.
  - Requirements reference: lines 65-75, 958-1003, 1075-1081, 1180-1193.
  - Must deliver: read model finding summaries, MCP finding exposure, web UI
    summaries, service/API/MCP tests.
  - Completion notes:

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
