import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import { ReviewScopeSchema } from "./scopes.js";
import { IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const DecisionNoteSchema = z
  .object({
    id: IdSchema.describe("Identifier for this decision note."),
    scope: ReviewScopeSchema.describe("Review scope the note belongs to."),
    bodyMarkdown: MarkdownStringSchema.describe("Decision note content."),
    author: ActorRefSchema.describe("Human or agent that wrote the decision note."),
    createdAt: IsoDateTimeSchema.describe("When the decision note was created."),
    updatedAt: IsoDateTimeSchema.optional().describe("When the decision note was last edited."),
  })
  .strict()
  .describe("A simple markdown note capturing a review decision or rationale.");

export type DecisionNote = z.infer<typeof DecisionNoteSchema>;
