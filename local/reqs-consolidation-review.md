# Requirements Consolidation Review

This is a working rewrite scaffold for `reqs.md`. The goal is to turn the raw
conversation recovery document into a reader-friendly requirements brief. The
source document should remain evidence, not the shape of the new document.

## Reader-Facing Requirements Brief

### Purpose

Replace the current prompt review tagging/classification model with two explicit
shared concepts:

- `ConcernArea`: the kind of workflow, prompt, tool, or permission concern a
  commit or file touches.
- `ReviewMark`: the current review stance for a commit.

The parser/detector and `prompt_reviews` app should share the same canonical
definitions. The implementation should look as though these shared concepts were
designed into the system from the beginning.

### Canonical Shared Model

Create shared Zod-backed definitions for `ConcernArea` and `ReviewMark`, with
field descriptions and runtime validation.

The Zod definitions are the runtime schema, parser, and validator. TypeScript
types should be inferred from those definitions. Parser indexes, maps, UI
choices, service contracts, and tests should derive from the canonical model
rather than from separately maintained objects.

Generated JSON schema may exist as an output artifact, but handwritten JSON or
plain typed objects should not become the domain model.

The parser/detector should be the exemplar implementation of this pattern, not
just another consumer. Wire it through the shared schema in a way that
demonstrates the intended Zod-first TypeScript approach before applying the same
model to the app replacement.

### Concern Areas

The existing detector categories become the canonical `ConcernArea` values:

- `harness-prompts`
- `message-roles`
- `hidden-context`
- `goal-continuation`
- `goal-behavior`
- `context-compaction`
- `tool-affordances`
- `permission-defaults`

Use `ConcernArea` / `ConcernAreas` for this concept. Avoid `tag`,
`classification`, or `disposition` as product/model terminology for these
areas.

Concern areas are editable by users and agents. Detector/parser output is only a
first pass and may be corrected later.

Concern areas may be assigned to commits and files. File-level concern areas are
useful for large commits, but they should remain indicators of relevant concern
areas rather than becoming a separate file-level review workflow.

File-level concern areas are user- and agent-editable. Do not weaken this into
detector-derived-only file signals.

Do not add concern-area assignments to diff blocks, versions, or arbitrary
generic scopes as part of this change.

### Primary And Related Concern Areas

Use one primary concern area plus optional related concern areas.

Prefer explicit names such as `primaryConcernArea` and `relatedConcernAreas`.
Avoid wording that makes this sound like the old primary/secondary tag system.

`PASS` does not require a primary concern area. `FLAG` and `MODIFY` require a
primary concern area so the review mark has a clear reason.

### Review Marks

`ReviewMark` represents the current review stance for a commit:

- `PASS`: accept the commit with no special follow-up.
- `FLAG`: the commit needs closer review.
- `MODIFY`: the commit has an obvious conflict with the user's goals.

Review marks are commit-level only. They are mutable and may be changed by users
or agents across review passes. They are not necessarily final approval.

Do not attach `ReviewMark` to files, diff blocks, versions, or generic review
scopes.

Avoid using `status` for this concept. Existing status/queue/final-approval
language may already describe different lifecycle states.

### Replace The Existing prompt_reviews Model

Fully replace the current `prompt_reviews` tag/classification model now. Do not
do a schema-only pass that leaves the app model, UI, routes, MCP tools, or tests
on the old vocabulary.

This is a removal, not a compatibility migration. Do not preserve, quarantine,
dual-write, shim, migrate through a compatibility layer, or rename the old
machinery in place while keeping the same model underneath.

Remove the old tag/classification vocabulary where it represents the removed
taxonomy, including services, route/API names, MCP contracts, UI labels,
workflow text, review workflow naming, and tests. Internal names should also
change when they still encode the old taxonomy concept.

The replacement app model should express:

- shared `ConcernArea` definitions;
- editable concern-area assignments on commits and files;
- commit-level `ReviewMark`;
- no legacy tag/classification layer between parser output and app behavior.

The parser/detector already appears closer to `ConcernArea` language than the
app workflow does. Preserve that distinction while replacing the app-side tag
and classification model.

### UI And Workflow Language

Replace UI language that presents the old model, especially labels such as
`Primary tag`, `Classification`, `untagged`, and `needs classification`.

This is structural UI replacement, not just relabeling. The current UI presents
the taxonomy through a primary tag dropdown, duplicate checkbox choices, and a
fake distinction between classification and tags. Replace those affordances with
controls that express concern-area assignment and commit-level review marks.

Before renaming queue/status text, map what the existing queue and status
concepts actually mean. The replacement label depends on whether the UI is
describing a missing review mark, a missing required concern area, final
approval readiness, or another lifecycle state.

### Testing Expectations

Update tests so they enforce the architectural replacement, not just individual
helper behavior.

Coverage should span services, routes/APIs, MCP tools, and relevant UI/workflow
surfaces. Tests should fail if active behavior or exposed contracts still depend
on the old tag/classification taxonomy.

Tests should build fixtures and expectations from the shared TypeScript
model/Zod schema rather than from handcrafted objects that merely satisfy a
type.

### Implementation Workflow

Use subagents for bounded codebase research so the main implementation context
stays focused. Useful research slices include:

- existing tag/taxonomy storage and APIs;
- parser/extractor flow;
- test and read surfaces;
- non-parser tag/classification usage in `prompt_reviews`;
- root-out tests across services, routes/APIs, MCP, and UI.

The next implementation-planning pass should specifically delegate the
non-parser tag/classification map rather than doing that search only in the main
thread.

Keep delegated research bounded, wait for the delegated results before making
planning claims that depend on them, and avoid dumping raw exploration into the
main thread.

### Artifact Quality Bar

The final requirements document should be clean enough for a new reader, but
detailed enough to prevent already-settled decisions from being reopened. It
should read like a recovery document with the frustration removed, not like a
thin executive summary.

### Open Questions To Resolve Before Renaming

- What does the current queue model represent?
- What does `status` currently mean in each app surface?
- Is there a separate final user approval or approval-readiness concept?
- What should replace `needs classification` once its actual meaning is known?

## Duplication And Consolidation Notes

### Shared Schema / Source Of Truth

Repeated or evolved requirement:

- The document opens by requiring a centralized shared schema with runtime
  validation and field descriptions.
- Later, this becomes more specific: the schema must be Zod-backed, should infer
  TypeScript types, should parse/validate runtime data, and should drive derived
  maps/indexes.
- Testing requirements repeat the same idea from another angle: tests should
  prove the system starts from shared `ConcernArea` and `ReviewMark`
  definitions.
- The final north-star paragraph repeats the condensed version.

Consolidation:

Make this one authoritative section named "Canonical Shared Model." Keep the
Zod/runtime/type-inference details there. In testing, refer back to it instead
of restating the model.

### Old Tag / Classification Model Removal

Repeated or evolved requirement:

- The opening states this is not a compatibility pass.
- It specifically rejects preserving, quarantining, dual-writing, shimming,
  compatibility migration, or renaming old machinery in place.
- Naming decisions reject `tag` and `classification`.
- `ReviewMark` scope warns against recreating the old generic tagging machinery.
- File-level concern support repeats the warning against creating a parallel
  review machine.
- The `prompt_reviews` section restates full replacement across app surfaces.
- Tests restate the same goal as a requirement that lingering old concepts fail
  coverage.
- The final north-star paragraph repeats "no compat, no shims, no legacy
  vocabulary path."

Consolidation:

Use one "Replacement Scope And Non-Goals" section. It should calmly state that
legacy tag/classification concepts are removed rather than bridged, and list the
surfaces where vocabulary/contracts must change. Keep the anti-compat language
short and precise.

### ConcernArea Naming And Semantics

Repeated or evolved requirement:

- The category list defines the eight detector categories.
- Naming decisions identify `ConcernArea` as the durable product term.
- Assignment semantics later define editability and attach points.
- Parser/schema requirements say parser output must use the shared
  `ConcernArea` schema.
- The parser/detector is expected to be the exemplar Zod-first TypeScript
  implementation, not merely a downstream consumer.
- App replacement repeats that app and parser share `ConcernArea`.
- Final north star repeats editable commit/file concern areas.

Consolidation:

Use one `ConcernArea` section with subsections for vocabulary, allowed values,
editability, and allowed scopes. Put parser/app usage elsewhere only as
implementation surfaces.

### ReviewMark Naming And Semantics

Repeated or evolved requirement:

- Naming decisions introduce `ReviewMark` for `PASS | FLAG | MODIFY`.
- Semantics define values, mutability, commit-only scope, and required primary
  area for `FLAG`/`MODIFY`.
- Unknowns clarify that final approval/status should not be conflated with
  `ReviewMark`.
- Final north star repeats commit-only scope and primary concern rules.

Consolidation:

Use one `ReviewMark` section. Include a short "not final approval/status" note
there, then leave detailed queue/status uncertainty to the open questions
section.

### Primary / Related Concern Areas

Repeated or evolved requirement:

- The source records an earlier accepted shape: one main concern plus optional
  related/secondary concerns.
- It then records that a later prompt about alternatives was interrupted.
- `ReviewMark` semantics separately say `FLAG`/`MODIFY` require a primary
  concern area.
- The final north star repeats that primary concern is required for
  `FLAG`/`MODIFY`, not `PASS`.

Consolidation:

State the decision directly: use `primaryConcernArea` and
`relatedConcernAreas`. Move the interrupted-conversation history out of the
reader-facing brief unless it is needed in an appendix.

### File-Level Assignments Versus File-Level Review

Repeated or evolved requirement:

- Concern areas can attach to commits and files.
- File-level concern areas were clarified as editable by users and agents, not
  detector-derived-only signals.
- File-level concern signals are useful for large commits.
- File-level support must not become a parallel review workflow.
- `ReviewMark` must remain commit-only.
- Diff-block/version/arbitrary-scope assignments are explicitly excluded.
- Final north star repeats editable commit/file concern areas and commit-level
  `ReviewMark`.

Consolidation:

Keep this as a scope table or short allowed/disallowed list:

- Commit: `ConcernArea`, `ReviewMark`
- File: `ConcernArea`
- Diff block/version/arbitrary scope: neither in this change

This will be clearer than repeating the concern in prose.

### Status, Queue, And Approval Readiness

Repeated or evolved requirement:

- Naming decisions warn not to use `status` for `PASS | FLAG | MODIFY`.
- UI replacement notes that queue/status text currently reinforces the wrong
  model.
- Unknowns explain that queue/status/final approval readiness need mapping.
- The `needs classification` label depends on what the current surface actually
  means.

Consolidation:

Make this an "Open Questions Before Renaming" section. Do not mix it into the
core model requirements except for the simple rule that `ReviewMark` is not
`status`.

### Testing

Repeated or evolved requirement:

- Tests should root out old tag/classification concepts.
- They should span services, routes/APIs, MCP, and UI/workflow surfaces.
- They should validate shared-schema usage.
- They should use real TypeScript/Zod model data rather than handcrafted typed
  objects.
- Existing comprehensive tests should be updated rather than assumed sufficient.

Consolidation:

Use one testing section with acceptance criteria. Avoid repeating app replacement
scope inside testing; say tests must enforce the replacement across the listed
surfaces.

### UI Model Versus UI Labels

Repeated or evolved requirement:

- The source does not only object to words like `Classification` and
  `Primary tag`.
- It objects to the old UI controls because they embody the wrong model: one
  dropdown and a set of checkboxes both backed by the same taxonomy.
- The replacement must change the affordances to represent concern areas and
  review marks directly.

Consolidation:

Place this under "UI And Workflow Language," but make the section about the UI
model and controls, not only copy changes.

### Subagent / Work Style Requirements

Repeated or evolved requirement:

- The document asks for liberal subagent use to preserve main context.
- It also says raw exploration should not flood the main context.
- It lists specific delegated slices.
- It specifically calls out the non-parser tag/classification map as something
  that should be delegated.

Consolidation:

Make this a short implementation workflow note. It should guide the next agent,
but it should not dominate the requirements brief.

### Emotional / Recovery Context

Repeated or evolved requirement:

- The document explains why detail matters and why repeated questions would be
  painful.
- It frames the artifact as a recovery document, not an executive summary.
- This context explains the quality bar but reads hostile if placed in the main
  requirements body.

Consolidation:

Move this out of the main reader-facing requirements. Preserve the practical
instruction: do not drop settled decisions, objections, or anti-requirements.
The new artifact can be warm and direct without carrying the frustration forward
to the next reader.

## Suggested Final Organization

1. Purpose
2. Canonical Shared Model
3. Domain Concepts
4. Allowed Scopes
5. Replacement Scope
6. UI And Workflow Language
7. Testing Expectations
8. Implementation Workflow
9. Artifact Quality Bar
10. Open Questions
11. Appendix: Source Conversation Decisions To Preserve

The main brief should be calm and action-oriented. The appendix can preserve
decision history and rejected vocabulary without making every reader walk
through the original recovery document.
