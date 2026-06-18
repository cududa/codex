# Canonical ReviewNote

`ReviewNote` is the canonical model for freeform markdown notes attached to review work.

It replaces only the intended product need: humans and agents need a place to record review rationale, working notes, or context that does not belong in a threaded code comment.

It does not preserve, rename, or wrap any old decision machinery. There is no action dropdown, no outcome field, no decision association graph, and no stored compatibility path.

## Scope

Review notes may be attached to exactly one review scope:

```ts
type ReviewNoteScope =
  | { type: "commit"; commitId: string }
  | { type: "file"; fileId: string }
  | { type: "diffBlock"; diffBlockId: string };
```

There are many notes per scope.

## Read Model

```ts
type ReviewNote = {
  id: string;
  scope: ReviewNoteScope;
  bodyMarkdown: string;
  author: ActorRef;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
  deletedBy: ActorRef | null;
};
```

Default app, API, and MCP reads should omit soft-deleted notes unless an explicit audit/history path requests them.

## Commands

```ts
type AddReviewNoteCommand = {
  noteId: string;
  scope: ReviewNoteScope;
  bodyMarkdown: string;
  author: ActorRef;
  createdAt: ISODateTime;
};

type UpdateReviewNoteCommand = {
  noteId: string;
  bodyMarkdown: string;
  actor: ActorRef;
  updatedAt: ISODateTime;
};

type DeleteReviewNoteCommand = {
  noteId: string;
  actor: ActorRef;
  deletedAt: ISODateTime;
};
```

Commands are canonical write intent. Routes, MCP tools, ingest, agents, and UI actions may feed these commands, but they do not bypass them or write note rows directly.

## Stored Rows

The database stores current note state in `review_notes`.

The database also stores note lifecycle history in `review_note_revisions`.

```ts
type ReviewNoteRevision = {
  id: string;
  noteId: string;
  actor: ActorRef;
  changedAt: ISODateTime;
  action: "created" | "updated" | "deleted";
  bodyMarkdownBefore: string | null;
  bodyMarkdownAfter: string | null;
};
```

Revision rows are the audit trail for edits and deletes. `updatedAt` on `ReviewNote` is current-state metadata; it is not enough to preserve review traceability by itself.

## Required Behavior

- Add creates one `review_notes` row and one `review_note_revisions` row with action `created`.
- Update changes `bodyMarkdown` and `updatedAt`, then writes a revision with before and after bodies.
- Delete is a soft delete: set `deletedAt` and `deletedBy`, then write a revision with action `deleted`.
- Deleted notes are omitted from ordinary reads.
- A deleted note cannot be updated.
- A deleted note cannot be deleted again.
- All writes go through the canonical command schemas and centralized write-store methods.

## Explicit Non-Goals

- No old decision tables.
- No old decision schemas.
- No action dropdown.
- No outcome enum.
- No migration or preservation of prototype notes.
- No compatibility adapters.
- No aliases that let old concepts keep working under new names.
