import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import { CommitScopeSchema, DiffBlockScopeSchema, FileScopeSchema } from "./scopes.js";
import { IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const ReviewNoteScopeTypeSchema = z
  .enum(["commit", "file", "diffBlock"])
  .describe("The reviewable entity type that can receive a freeform review note.");

export const ReviewNoteScopeSchema = z
  .discriminatedUnion("type", [CommitScopeSchema, FileScopeSchema, DiffBlockScopeSchema])
  .describe("A commit, file, or diff block scope for a freeform review note.");

export const ReviewNoteRevisionChangeKindSchema = z
  .enum(["created", "updated", "deleted"])
  .describe("The kind of note lifecycle change captured by a revision row.");

export const ReviewNoteReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review note."),
    scope: ReviewNoteScopeSchema.describe("Review scope the note belongs to."),
    bodyMarkdown: MarkdownStringSchema.describe("Review note markdown content."),
    author: ActorRefSchema.describe("Human or agent that created the review note."),
    createdAt: IsoDateTimeSchema.describe("When the review note was created."),
    updatedAt: IsoDateTimeSchema.describe("When the current note body was last changed."),
    deletedAt: IsoDateTimeSchema.nullable().describe("When the review note was soft-deleted, or null."),
    deletedBy: ActorRefSchema.nullable().describe("Actor that soft-deleted the review note, or null."),
  })
  .strict()
  .superRefine((note, context) => {
    if ((note.deletedAt === null) !== (note.deletedBy === null)) {
      context.addIssue({
        code: "custom",
        message: "deletedAt and deletedBy must both be null or both be populated",
        path: ["deletedAt"],
      });
    }
  })
  .describe("Freeform markdown note attached to review work.");

export const ReviewNoteRevisionReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review note revision."),
    noteId: IdSchema.describe("Review note whose lifecycle changed."),
    actor: ActorRefSchema.describe("Actor that changed the review note."),
    changedAt: IsoDateTimeSchema.describe("When the review note changed."),
    changeKind: ReviewNoteRevisionChangeKindSchema.describe("Kind of lifecycle change captured by this revision."),
    bodyMarkdownBefore: MarkdownStringSchema.nullable().describe("Previous note markdown, or null."),
    bodyMarkdownAfter: MarkdownStringSchema.nullable().describe("New note markdown, or null."),
  })
  .strict()
  .superRefine((revision, context) => {
    if (revision.changeKind === "created" && revision.bodyMarkdownBefore !== null) {
      context.addIssue({
        code: "custom",
        message: "created revisions cannot include a previous body",
        path: ["bodyMarkdownBefore"],
      });
    }
    if (revision.changeKind !== "deleted" && revision.bodyMarkdownAfter === null) {
      context.addIssue({
        code: "custom",
        message: "created and updated revisions require a new body",
        path: ["bodyMarkdownAfter"],
      });
    }
    if (revision.changeKind !== "created" && revision.bodyMarkdownBefore === null) {
      context.addIssue({
        code: "custom",
        message: "updated and deleted revisions require the previous body",
        path: ["bodyMarkdownBefore"],
      });
    }
    if (revision.changeKind === "deleted" && revision.bodyMarkdownAfter !== null) {
      context.addIssue({
        code: "custom",
        message: "deleted revisions cannot include a new body",
        path: ["bodyMarkdownAfter"],
      });
    }
  })
  .describe("Audit record for a review note lifecycle change.");

export type ReviewNoteScopeType = z.infer<typeof ReviewNoteScopeTypeSchema>;
export type ReviewNoteScope = z.infer<typeof ReviewNoteScopeSchema>;
export type ReviewNoteRevisionChangeKind = z.infer<typeof ReviewNoteRevisionChangeKindSchema>;
export type ReviewNoteRead = z.infer<typeof ReviewNoteReadSchema>;
export type ReviewNoteRevisionRead = z.infer<typeof ReviewNoteRevisionReadSchema>;
