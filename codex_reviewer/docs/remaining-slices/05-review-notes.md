# Slice: Review Notes

Review notes are durable markdown rationale or context. They are not threaded
discussion and they are not the old decision/action/outcome machinery.

This slice is subordinate to `../canonical-review-note.md`.

## Authority

This document is also subordinate to:

- `../product-model.md`
- `../review-workflow.md`
- `../review-events.md`
- `../code-kill-list.md`

It may add implementation detail, but it must not fork the note model or
introduce compatibility behavior for old decisions/actions/outcomes.

Use current code only to extend the reset spine or to identify deletion hazards.
Do not preserve a route, store, contract, migration, table, or UI shape merely
because it exists.

## Source Cleanup Before Build

There is no active note implementation to port. Build notes as a greenfield
rationale surface attached to commits, files, and diff blocks.

Do not preserve or copy old decision/action/outcome structures into notes. Do
not use `ReviewStateWriteResponseSchema`, mark/concern write-store methods,
projection documents, compatibility payloads, association graphs, action
dropdowns, outcome enums, or workflow transitions.

The word `action` is allowed only for the review-note revision discriminator
defined by `../canonical-review-note.md`: `created`, `updated`, or `deleted`.

## Boundary

A review note is markdown rationale with author metadata, soft deletion, and
revision history.

Do not rename "decisions" to notes while keeping the old decision structure.
There are no action dropdowns, outcome fields, association graphs, or workflow
transitions.

## Product Rules

- Notes attach to exactly one commit, file, or diff block.
- There can be many notes per scope.
- Notes are omitted from ordinary reads after soft deletion.
- Add, update, and delete writes go through canonical note commands.
- Each write updates current note state and writes a note revision in the same
  transaction.
- Revision rows use the canonical `action` discriminator from
  `../canonical-review-note.md`: `created`, `updated`, or `deleted`.
- Deleted notes cannot be updated or deleted again.

## Persistence Requirements

Store current note state in ordinary durable rows.

Store lifecycle history in ordinary durable revision rows. Revision rows are the
audit trail for note edits and deletes; do not create `ReviewEvent` rows for
note body edits unless the root event authority changes.

Validate target existence for commit, file, and diff-block scopes.

Enforce exactly-one-target at the database and service layers. A note row must
not point to more than one scope and must not be targetless.

## Contracts And API Shape

Add contracts for:

- note scope
- note read
- note revision read
- note list response
- note response
- add note request
- update note request
- delete note request

Note writes must return note-shaped responses, not `ReviewStateWriteResponse`.
Notes are rationale records, not current review-state mutations.

Use explicit response contracts:

- `ReviewNoteListResponse`
- `ReviewNoteResponse`
- `ReviewNoteRevisionListResponse` only if revisions are intentionally exposed
  through a focused audit route

Note actor contracts may use the union of `HumanActorRefSchema` and
`AgentActorRefSchema`. Do not use `ActorRefSchema` if system-authored notes are
not part of the product model.

Fetch notes on demand for the selected scope. Do not add note collections to the
primary `ReviewVersionRead` in this slice.

Revision rows are internal audit history unless this slice deliberately adds a
focused revision-read route. Ordinary note list responses must not include full
revision history.

MCP tools may use the same note commands for humans or agents. There is no
agent-specific note model.

Suggested API shape:

- `GET /api/review/commits/:commitId/notes`
- `POST /api/review/commits/:commitId/notes`
- `GET /api/review/files/:fileId/notes`
- `POST /api/review/files/:fileId/notes`
- `GET /api/review/diff-blocks/:diffBlockId/notes`
- `POST /api/review/diff-blocks/:diffBlockId/notes`
- `PATCH /api/review/notes/:noteId`
- `DELETE /api/review/notes/:noteId`

## Workbench

Minimal first UI:

- selected commit notes
- selected file notes surfaced in the diff/review work area before the diff
  blocks
- add note textarea
- edit note body
- soft delete note

Diff-block notes should be exposed from the diff pane when there is a clear
block-level interaction target.

## Current Code Hazards

There is no current note implementation to port. This slice is greenfield.

The existing review write store is mark/concern-state oriented. Do not copy
`ReviewStateWriteResponse` or mark/concern mutation patterns into note writes.

## Tests

- contract tests for note scope, actor, markdown body, and revision action
- DB tests for current rows, revisions, and soft deletion
- write-service tests for add/update/delete and deleted-note conflicts
- route tests for validation and omitted deleted notes
- web API/helper tests without old decision/action/outcome vocabulary
