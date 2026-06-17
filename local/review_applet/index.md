# Review Applet Replacement Sketch

These files are implementation contracts for replacing `prompt_reviews`, not
migration notes for polishing the current implementation. The current
tag/classification workflow is tainted evidence. It may reveal failure modes and
callers that must be removed, but it is not the shape to preserve.

The replacement is commit-centered:

- `ConcernArea` is the canonical area of prompt/harness risk.
- `ReviewMark` is the commit-level review stance: `PASS`, `FLAG`, or `MODIFY`.
- Files, diff blocks, comments, decisions, and plans support commit review.
- File-level concern areas may help large commits, but files do not get
  `ReviewMark` and must not become a parallel verdict workflow.

## Execution Order

Agents must update this table as work progresses. Keep `Status` honest. Use
`Implementation Notes` for verification commands, blockers, rejected designs, or
handoff details that matter to the next agent.

| Order | Batch | Status | Implementation Notes |
| --- | --- | --- | --- |
| 1 | `batch-01-shared-model.md` | Sketching | Design the real canonical Zod model first. Batch 2 depends on this being concrete enough to write root-out tests almost verbatim. |
| 2 | `batch-02-root-out-tests.md` | Not started | Build the eye that finds degenerate old concepts. No mercy for active tag/classification machinery. |
| 3 | `batch-03-parser-detector-threading.md` | Not started | Make detector evidence consume canonical concern definitions without legacy reshaping. |
| 4 | `batch-04-app-data-model-replacement.md` | Not started | Replace persistence from the new model outward. No compatibility data shape. |
| 5 | `batch-05-services-api-mcp.md` | Not started | Replace service, HTTP, MCP, and read contracts. Delete old active tools/routes. |
| 6 | `batch-06-ui-workflow.md` | Not started | Replace UI affordances with the actual review workbench flow. |

## Non-Negotiable Rules

- The old workflow is not a requirement. Treat it as hostile until the new model
  explicitly adopts a concept.
- Do not preserve `ConcernTag`, `Tagging`, `ClassificationView`,
  `primaryTagSlug`, `secondaryTagSlugs`, `classify_*`, `/classification`,
  `/taggings`, or `/concern-tags` in active code.
- Do not build bridges, shims, dual-write paths, compatibility maps, or renamed
  old mechanics. This app is local and unshipped. All callers can be updated.
- Hand-authored Zod schemas own the domain, API, MCP, frontend payloads, and
  structured agent payloads. Generated JSON schema is output, not source.
- TypeScript types must be inferred from Zod schemas. Do not create parallel
  handwritten types that drift into a second model.
- Parser indexes, detector anchors, UI choices, service contracts, MCP
  contracts, fixtures, and tests must derive from the canonical model.
- Do not import canonical schemas and immediately reshape them into old-friendly
  arrays, tag payloads, or file-centered bureaucracy.
- `ReviewMark` is not lifecycle status, human final approval, version
  readiness, queue status, or a file verdict.
- Detector findings are evidence. They can suggest review attention, but they
  do not mutate review state, finalize decisions, or auto-assign truth.

## Intended Flow Sketch

Ingest a version/range, evaluate commits in order against detector evidence, and
surface commit-centered review work. A reviewer inspects commits, drills into
files and diff blocks for evidence, leaves anchored comments, proposes or
finalizes decisions where the workflow requires human judgment, tracks plans,
and closes the version only when real review work is complete.

Commit detail is the primary review surface: detector summaries, editable
commit `ConcernArea`, commit `ReviewMark`, comments, decisions, plans, and
supporting file evidence. File detail is a supporting surface: file concern
areas, detector findings, diff blocks, anchored comments, and evidence. Diff
blocks carry findings and comments, not editable concern assignments or review
marks.

## Failure Modes To Avoid

- Treating professional-looking current code as a stabilizing architecture.
- Preserving file-centered red tape because it already has tests.
- Replacing labels while leaving the old taxonomy mechanics intact.
- Making Batch 1 a sketch so Batch 2 cannot write sharp root-out tests.
- Letting detector evidence become editable review state.
- Letting `PASS`/`FLAG`/`MODIFY` become approval, queue status, or version
  readiness.
- Letting file review become the center of the app because the old workflow did
  that.

## Shared Verification Commands

Each batch should run the strictest available subset of:

```bash
cd prompt_reviews
npm run typecheck
npm run test:structure
npm run test
npm run db:generate
npm run db:check
npm run schema:json
npm run build
```

If a command is introduced by a later batch, earlier batches must say so in
their implementation notes.
