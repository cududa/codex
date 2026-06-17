# Batch 1: Shared Model

## Required Changes

- Design the canonical Zod-backed domain model before any root-out tests or
  implementation work begins. This batch is not a sketch once accepted; it is
  the contract Batch 2 tests against.
- Make the model commit-centered. `ReviewMark` is commit-only. Commit
  `ConcernArea` is first-class. File `ConcernArea` is supporting review
  evidence/correction for large commits, not a parallel file verdict workflow.
- Define the canonical `ConcernArea` registry for exactly:
  - `harness-prompts`
  - `message-roles`
  - `hidden-context`
  - `goal-continuation`
  - `goal-behavior`
  - `context-compaction`
  - `tool-affordances`
  - `permission-defaults`
- Define `ReviewMark` as exactly `PASS | FLAG | MODIFY`.
- Encode the validation rule directly in the schemas: `PASS` may omit
  `primaryConcernArea`; `FLAG` and `MODIFY` require `primaryConcernArea`.
- Decide the actual schema shape for commit review state, file supporting
  concern areas, detector findings, comments, decisions, plans, and version
  readiness boundaries before writing Batch 2.
- Use Zod schemas as the runtime parser/validator and infer TypeScript types
  from them. Export JSON schemas only as generated artifacts.
- Keep raw registry input private, parse it immediately, and export only parsed
  canonical data, inferred types, schemas, and schema-derived indexes.
- Include detector anchor metadata in the canonical concern model only when it
  is a real domain need. Do not recreate legacy `seedSymbols`,
  `seedStringMarkers`, `seedTemplateMarkers`, tag payloads, or local
  compatibility arrays.
- Remove active dependency on old tag/classification schemas. Any consumer that
  needs concern data imports the canonical model or a schema-derived helper.
- Produce enough concrete schema names, fields, scopes, and validation rules
  that Batch 2 can write root-out tests without guessing what the replacement
  is supposed to be.
