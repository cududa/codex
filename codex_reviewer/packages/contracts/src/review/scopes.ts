import { z } from "zod";
import { IdSchema, NonEmptyStringSchema, PositiveLineNumberSchema } from "../shared/primitives.js";

export const ReviewScopeTypeSchema = z
  .enum(["version", "commit", "file", "diffBlock"])
  .describe("The reviewable entity type addressed by a review artifact.");

export const VersionScopeSchema = z
  .object({
    type: z.literal("version").describe("A review version scope."),
    versionId: IdSchema.describe("Identifier of the review version."),
  })
  .strict()
  .describe("A review version scope.");

export const CommitScopeSchema = z
  .object({
    type: z.literal("commit").describe("A commit scope."),
    commitId: IdSchema.describe("Identifier of the upstream commit under review."),
  })
  .strict()
  .describe("A commit review scope.");

export const FileScopeSchema = z
  .object({
    type: z.literal("file").describe("A file scope."),
    fileId: IdSchema.describe("Identifier of the file change under review."),
  })
  .strict()
  .describe("A file review scope.");

export const DiffBlockScopeSchema = z
  .object({
    type: z.literal("diffBlock").describe("A diff block scope."),
    diffBlockId: IdSchema.describe("Identifier of the diff block under review."),
  })
  .strict()
  .describe("A diff block review scope.");

export const ReviewScopeSchema = z
  .discriminatedUnion("type", [VersionScopeSchema, CommitScopeSchema, FileScopeSchema, DiffBlockScopeSchema])
  .describe("A review artifact scope.");

export const CommitOrFileScopeSchema = z
  .discriminatedUnion("type", [CommitScopeSchema, FileScopeSchema])
  .describe("A scope that can receive review marks, agent reviews, and human approvals.");

export const DiffSideSchema = z.enum(["old", "new"]).describe("The side of a diff range.");

export const ReviewAnchorSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("scope").describe("Anchor the artifact to the whole review scope."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("diffBlock").describe("Anchor the artifact to a diff block."),
        diffBlockId: IdSchema.describe("Identifier of the anchored diff block."),
      })
      .strict(),
    z
      .object({
        kind: z.literal("range").describe("Anchor the artifact to a source range in a file change."),
        fileId: IdSchema.describe("Identifier of the file containing the selected range."),
        side: DiffSideSchema.describe("The old or new side of the diff."),
        startLine: PositiveLineNumberSchema.describe("First selected line."),
        endLine: PositiveLineNumberSchema.describe("Last selected line."),
        selectedText: NonEmptyStringSchema.optional().describe("Text selected by the reviewer, when available."),
      })
      .strict()
      .refine((anchor) => anchor.startLine <= anchor.endLine, {
        message: "startLine must be less than or equal to endLine",
        path: ["endLine"],
      }),
  ])
  .describe("A precise anchor inside a review scope.");

export type ReviewScopeType = z.infer<typeof ReviewScopeTypeSchema>;
export type ReviewScope = z.infer<typeof ReviewScopeSchema>;
export type CommitOrFileScope = z.infer<typeof CommitOrFileScopeSchema>;
export type ReviewAnchor = z.infer<typeof ReviewAnchorSchema>;
export type DiffSide = z.infer<typeof DiffSideSchema>;
