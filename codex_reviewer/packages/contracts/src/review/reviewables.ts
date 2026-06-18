import { z } from "zod";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { LocalChangeRefReadSchema } from "./local-change-refs.js";
import { AgentReviewReadSchema, HumanApprovalReadSchema } from "./review-records.js";
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

export const ReviewVersionReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review version."),
    label: NonEmptyStringSchema.describe("Human-readable label for the reviewed upstream range."),
    repositoryId: NonEmptyStringSchema.describe("Repository being reviewed."),
    baseRef: NonEmptyStringSchema.optional().describe("Base ref or SHA used for ingestion."),
    targetRef: NonEmptyStringSchema.optional().describe("Target ref or SHA used for ingestion."),
    baseSha: GitShaSchema.optional().describe("Resolved base commit SHA."),
    targetSha: GitShaSchema.optional().describe("Resolved target commit SHA."),
    createdAt: IsoDateTimeSchema.describe("When the version was created."),
    updatedAt: IsoDateTimeSchema.optional().describe("When the version was last updated."),
  })
  .strict()
  .describe("A review version containing upstream commits under review.");

export const ChangeKindSchema = z
  .enum(["added", "modified", "deleted", "renamed", "copied", "modeChanged"])
  .describe("Kind of file change in an upstream commit.");

export const ReviewCommitReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this reviewed commit."),
    versionId: IdSchema.describe("Review version that contains this commit."),
    sha: GitShaSchema.describe("Upstream commit SHA under review."),
    position: ZeroBasedPositionSchema.describe("Stable review order for this commit within the version."),
    title: NonEmptyStringSchema.describe("First-line commit title."),
    message: MarkdownStringSchema.optional().describe("Full upstream commit message."),
    authorName: NonEmptyStringSchema.optional().describe("Upstream commit author name."),
    committedAt: IsoDateTimeSchema.optional().describe("When the upstream commit was authored or committed."),
    reviewMark: ReviewMarkSchema.describe("Current review mark for this commit."),
    concernAreas: ConcernAreaSelectionSchema.describe("Ordered concern areas assigned to this commit."),
    localChangeRefs: z
      .array(LocalChangeRefReadSchema)
      .describe("Local changes linked to this commit when its review mark is DONE."),
    agentReviews: z.array(AgentReviewReadSchema).describe("Agent review records for this commit."),
    humanApproval: HumanApprovalReadSchema.nullable().describe(
      "Human approval for this commit, if recorded.",
    ),
    fileCount: NonNegativeIntegerSchema.describe("Response-derived number of changed files in this commit."),
    unresolvedCommentCount: NonNegativeIntegerSchema.describe(
      "Response-derived count of open threaded comments blocking approval.",
    ),
  })
  .strict()
  .superRefine((commit, context) => {
    if (commit.reviewMark === "DONE" && commit.localChangeRefs.length === 0) {
      context.addIssue({
        code: "custom",
        message: "DONE commits require at least one local change reference",
        path: ["localChangeRefs"],
      });
    }

    if (commit.humanApproval !== null && commit.humanApproval.scope.type !== "commit") {
      context.addIssue({
        code: "custom",
        message: "commit approval must use a commit scope",
        path: ["humanApproval", "scope"],
      });
    }

    if (commit.humanApproval !== null && commit.humanApproval.approvedMark !== commit.reviewMark) {
      context.addIssue({
        code: "custom",
        message: "commit approval must approve the current review mark",
        path: ["humanApproval", "approvedMark"],
      });
    }
  })
  .describe("A reviewed upstream commit with review state and evidence.");

export const ReviewFileReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this reviewed file change."),
    commitId: IdSchema.describe("Reviewed commit that contains this file change."),
    position: ZeroBasedPositionSchema.describe("Stable review order for this file within the commit."),
    path: NonEmptyStringSchema.describe("Current file path."),
    oldPath: NonEmptyStringSchema.optional().describe("Previous path for renamed or copied files."),
    changeKind: ChangeKindSchema.describe("Kind of file change."),
    reviewMark: ExplicitFileReviewMarkSchema.describe("Current explicit file review mark, if operational."),
    localChangeRefs: z
      .array(LocalChangeRefReadSchema)
      .describe("Local changes linked to this file when its review mark is DONE."),
    agentReviews: z.array(AgentReviewReadSchema).describe("Agent review records for this file."),
    humanApproval: HumanApprovalReadSchema.nullable().describe("Human approval for this file, if recorded."),
    unresolvedCommentCount: NonNegativeIntegerSchema.describe(
      "Response-derived count of open threaded comments blocking approval.",
    ),
  })
  .strict()
  .superRefine((file, context) => {
    if (file.reviewMark === "DONE" && file.localChangeRefs.length === 0) {
      context.addIssue({
        code: "custom",
        message: "DONE files require at least one local change reference",
        path: ["localChangeRefs"],
      });
    }

    if (file.humanApproval !== null && file.humanApproval.scope.type !== "file") {
      context.addIssue({
        code: "custom",
        message: "file approval must use a file scope",
        path: ["humanApproval", "scope"],
      });
    }

    if (file.humanApproval !== null && file.reviewMark === null) {
      context.addIssue({
        code: "custom",
        message: "file approval requires an explicit file review mark",
        path: ["reviewMark"],
      });
    }

    if (
      file.humanApproval !== null &&
      file.reviewMark !== null &&
      file.humanApproval.approvedMark !== file.reviewMark
    ) {
      context.addIssue({
        code: "custom",
        message: "file approval must approve the current review mark",
        path: ["humanApproval", "approvedMark"],
      });
    }
  })
  .describe("A reviewed file change with optional file-level review state.");

export const DiffBlockReadSchema = z
  .object({
    id: IdSchema.describe("Identifier for this diff block."),
    fileId: IdSchema.describe("Reviewed file that contains this diff block."),
    position: ZeroBasedPositionSchema.describe("Stable review order for this diff block within the file."),
    heading: NonEmptyStringSchema.optional().describe("Diff block heading, when present."),
    oldStartLine: PositiveLineNumberSchema.optional().describe("First line on the old side."),
    oldEndLine: PositiveLineNumberSchema.optional().describe("Last line on the old side."),
    newStartLine: PositiveLineNumberSchema.optional().describe("First line on the new side."),
    newEndLine: PositiveLineNumberSchema.optional().describe("Last line on the new side."),
    patch: NonEmptyStringSchema.describe("Unified diff patch text for this block."),
  })
  .strict()
  .superRefine((block, context) => {
    if (
      block.oldStartLine !== undefined &&
      block.oldEndLine !== undefined &&
      block.oldStartLine > block.oldEndLine
    ) {
      context.addIssue({
        code: "custom",
        message: "oldStartLine must be less than or equal to oldEndLine",
        path: ["oldEndLine"],
      });
    }

    if (
      block.newStartLine !== undefined &&
      block.newEndLine !== undefined &&
      block.newStartLine > block.newEndLine
    ) {
      context.addIssue({
        code: "custom",
        message: "newStartLine must be less than or equal to newEndLine",
        path: ["newEndLine"],
      });
    }
  })
  .describe("A diff block in a reviewed file.");

export type ReviewVersionRead = z.infer<typeof ReviewVersionReadSchema>;
export type ChangeKind = z.infer<typeof ChangeKindSchema>;
export type ReviewCommitRead = z.infer<typeof ReviewCommitReadSchema>;
export type ReviewFileRead = z.infer<typeof ReviewFileReadSchema>;
export type DiffBlockRead = z.infer<typeof DiffBlockReadSchema>;
