import { z } from "zod";
import { ActorRefSchema } from "./actors.js";
import {
  GitShaSchema,
  IdSchema,
  IsoDateTimeSchema,
  MarkdownStringSchema,
  NonEmptyStringSchema,
} from "../shared/primitives.js";

export const LocalChangeRefReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this local change reference."),
    sha: GitShaSchema.describe("Local commit SHA that implements the required adaptation."),
    title: NonEmptyStringSchema.optional().describe("Short title for the local commit, when known."),
    summary: MarkdownStringSchema.optional().describe(
      "Optional summary of how the local change resolves the review work.",
    ),
    linkedBy: ActorRefSchema.describe("Human, agent, or system actor that linked this local change."),
    linkedAt: IsoDateTimeSchema.describe("When the local change was linked to the review item."),
  })
  .strict()
  .describe("Durable evidence that local work was completed for a modified upstream change.");

export const LocalChangeRefsReadSchema = z
  .array(LocalChangeRefReadSchema)
  .describe("Local change references linked to a review item.");

export type LocalChangeRefRead = z.infer<typeof LocalChangeRefReadSchema>;
