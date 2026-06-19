import { z } from "zod";
import { AgentActorRefSchema } from "./actors.js";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { ExplicitFileReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import {
  GitShaSchema,
  IdSchema,
  IsoDateTimeSchema,
  MarkdownStringSchema,
  NonEmptyStringSchema,
  NonNegativeIntegerSchema,
  PositiveLineNumberSchema,
  ZeroBasedPositionSchema,
} from "../shared/primitives.js";

export const ChangeKindSchema = z
  .enum(["added", "modified", "deleted", "renamed", "copied", "modeChanged"])
  .describe("How a reviewed file changed in the upstream commit.");

export const DiffBlockReadSchema = z
  .object({
    id: IdSchema.describe("Diff block identifier."),
    fileId: IdSchema.describe("Parent reviewed file identifier."),
    position: ZeroBasedPositionSchema.describe("Diff block order within the file."),
    heading: NonEmptyStringSchema.nullable().describe("Optional hunk or symbol heading."),
    oldStartLine: PositiveLineNumberSchema.nullable().describe("First old-side line, or null."),
    oldEndLine: PositiveLineNumberSchema.nullable().describe("Last old-side line, or null."),
    newStartLine: PositiveLineNumberSchema.nullable().describe("First new-side line, or null."),
    newEndLine: PositiveLineNumberSchema.nullable().describe("Last new-side line, or null."),
    patch: NonEmptyStringSchema.describe("Unified diff text for this block."),
  })
  .strict()
  .superRefine((block, context) => {
    if (block.oldStartLine !== null && block.oldEndLine !== null && block.oldStartLine > block.oldEndLine) {
      context.addIssue({
        code: "custom",
        message: "oldStartLine must be less than or equal to oldEndLine",
        path: ["oldEndLine"],
      });
    }

    if (block.newStartLine !== null && block.newEndLine !== null && block.newStartLine > block.newEndLine) {
      context.addIssue({
        code: "custom",
        message: "newStartLine must be less than or equal to newEndLine",
        path: ["newEndLine"],
      });
    }
  })
  .describe("One anchorable diff block inside a reviewed file.");

export const CommitAgentReviewReadSchema = z
  .object({
    id: IdSchema.describe("Agent review evidence row identifier."),
    commitId: IdSchema.describe("Reviewed commit identifier."),
    reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
    reviewedConcernAreas: ConcernAreaSelectionSchema.describe(
      "Ordered commit concern areas the agent believes are correct.",
    ),
    notesMarkdown: MarkdownStringSchema.nullable().describe("Optional agent-authored review notes."),
    reviewer: AgentActorRefSchema.describe("Agent that recorded the review evidence."),
    createdAt: IsoDateTimeSchema.describe("When the agent review evidence was recorded."),
  })
  .strict()
  .describe("Agent-authored evidence attached to a reviewed commit.");

export const FileAgentReviewReadSchema = z
  .object({
    id: IdSchema.describe("Agent review evidence row identifier."),
    fileId: IdSchema.describe("Reviewed file identifier."),
    reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
    notesMarkdown: MarkdownStringSchema.nullable().describe("Optional agent-authored review notes."),
    reviewer: AgentActorRefSchema.describe("Agent that recorded the review evidence."),
    createdAt: IsoDateTimeSchema.describe("When the agent review evidence was recorded."),
  })
  .strict()
  .describe("Agent-authored evidence attached to a reviewed file.");

export const ReviewFileReadSchema = z
  .object({
    id: IdSchema.describe("Reviewed file identifier."),
    commitId: IdSchema.describe("Parent reviewed commit identifier."),
    position: ZeroBasedPositionSchema.describe("File order within the commit."),
    path: NonEmptyStringSchema.describe("Current file path."),
    oldPath: NonEmptyStringSchema.nullable().describe("Previous path for renames or copies, or null."),
    changeKind: ChangeKindSchema.describe("How the file changed."),
    reviewMark: ExplicitFileReviewMarkSchema.describe("Explicit file-level review mark, or null."),
    createdAt: IsoDateTimeSchema.describe("When the file row was created."),
    updatedAt: IsoDateTimeSchema.nullable().describe("When file review state last changed, or null."),
    agentReviews: z.array(FileAgentReviewReadSchema).describe("Agent-authored evidence for this file."),
    diffBlocks: z.array(DiffBlockReadSchema).describe("Diff blocks owned by this file."),
  })
  .strict()
  .describe("One changed file inside a reviewed commit.");

export const ReviewCommitReadSchema = z
  .object({
    id: IdSchema.describe("Reviewed commit identifier."),
    versionId: IdSchema.describe("Parent review version identifier."),
    sha: GitShaSchema.describe("Upstream commit SHA."),
    position: ZeroBasedPositionSchema.describe("Commit order within the review version."),
    title: NonEmptyStringSchema.describe("Upstream commit title."),
    message: MarkdownStringSchema.nullable().describe("Upstream commit message, or null."),
    authorName: NonEmptyStringSchema.nullable().describe("Upstream commit author name, or null."),
    committedAt: IsoDateTimeSchema.nullable().describe("Upstream commit timestamp, or null."),
    reviewMark: ReviewMarkSchema.describe("Current commit-level review mark."),
    concernAreas: ConcernAreaSelectionSchema.describe("Ordered commit-level concern areas."),
    createdAt: IsoDateTimeSchema.describe("When the commit row was created."),
    updatedAt: IsoDateTimeSchema.nullable().describe("When commit review state last changed, or null."),
    agentReviews: z.array(CommitAgentReviewReadSchema).describe("Agent-authored evidence for this commit."),
    files: z.array(ReviewFileReadSchema).describe("Files changed by this commit."),
  })
  .strict()
  .describe("One upstream commit in a review version.");

export const ReviewVersionReadSchema = z
  .object({
    id: IdSchema.describe("Review version identifier."),
    label: NonEmptyStringSchema.describe("Human-readable review version label."),
    repositoryId: NonEmptyStringSchema.describe("Repository identity for this review version."),
    baseRef: NonEmptyStringSchema.nullable().describe("Base ref, or null."),
    targetRef: NonEmptyStringSchema.nullable().describe("Target ref, or null."),
    baseSha: GitShaSchema.describe("Resolved base SHA."),
    targetSha: GitShaSchema.describe("Resolved target SHA."),
    createdAt: IsoDateTimeSchema.describe("When the review version was created."),
    updatedAt: IsoDateTimeSchema.nullable().describe("When the review version was last updated, or null."),
    commitCount: NonNegativeIntegerSchema.describe("Number of commits in this version."),
    commits: z.array(ReviewCommitReadSchema).describe("Upstream commits under review."),
  })
  .strict()
  .describe("A review session for one upstream range in one repository.");

export type ChangeKind = z.infer<typeof ChangeKindSchema>;
export type DiffBlockRead = z.infer<typeof DiffBlockReadSchema>;
export type CommitAgentReviewRead = z.infer<typeof CommitAgentReviewReadSchema>;
export type FileAgentReviewRead = z.infer<typeof FileAgentReviewReadSchema>;
export type ReviewFileRead = z.infer<typeof ReviewFileReadSchema>;
export type ReviewCommitRead = z.infer<typeof ReviewCommitReadSchema>;
export type ReviewVersionRead = z.infer<typeof ReviewVersionReadSchema>;
