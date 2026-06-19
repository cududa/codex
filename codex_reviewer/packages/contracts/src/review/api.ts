import { z } from "zod";
import { ActorRefSchema, AgentActorRefSchema } from "./actors.js";
import { ConcernAreaSchema, ConcernAreaSelectionSchema } from "./concern-areas.js";
import {
  ExplicitFileReviewMarkSchema,
  ReviewMarkDefinitionSchema,
  ReviewMarkSchema,
} from "./review-marks.js";
import { ReviewVersionReadSchema } from "./reviewables.js";
import { MarkdownStringSchema, NonEmptyStringSchema } from "../shared/primitives.js";

export const ConcernAreasResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
  })
  .strict()
  .describe("Response containing the canonical concern area registry.");

export const ReviewMarksResponseSchema = z
  .object({
    reviewMarks: z
      .array(ReviewMarkDefinitionSchema)
      .describe("Canonical review marks and workflow metadata."),
  })
  .strict()
  .describe("Response containing the canonical review mark registry.");

export const ReviewBootstrapResponseSchema = z
  .object({
    concernAreas: z.array(ConcernAreaSchema).describe("Canonical concern areas available for commit review."),
    reviewMarks: z
      .array(ReviewMarkDefinitionSchema)
      .describe("Canonical review marks and workflow metadata."),
  })
  .strict()
  .describe("Bootstrap response for review UI and MCP clients.");

export const ReviewVersionsResponseSchema = z
  .object({
    versions: z.array(ReviewVersionReadSchema).describe("Persisted review versions and their commits."),
  })
  .strict()
  .describe("Response containing persisted review workbench data.");

export const ReviewVersionResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.nullable().describe("Persisted review version, or null when absent."),
  })
  .strict()
  .describe("Response containing one persisted review version.");

export const ReviewMarkWriteResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.describe(
      "Updated review version after a review mark or concern-area write.",
    ),
  })
  .strict()
  .describe("Response containing the owning review version after a review mark or concern-area write.");

export const RecordAgentReviewResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.describe("Review version after recording agent review evidence."),
  })
  .strict()
  .describe("Response containing the owning review version after recording agent review evidence.");

export const IngestReviewVersionRequestSchema = z
  .object({
    repositoryId: NonEmptyStringSchema.describe("Stable repository identity for this review version."),
    baseRefOrSha: NonEmptyStringSchema.describe("Submitted base ref or SHA for the upstream range."),
    targetRefOrSha: NonEmptyStringSchema.describe("Submitted target ref or SHA for the upstream range."),
    label: NonEmptyStringSchema.optional().describe("Optional human-readable review version label."),
    source: NonEmptyStringSchema.describe("System-scoped ingest source."),
    concernMapVersion: NonEmptyStringSchema.describe(
      "Version identifier for deterministic concern-map rules.",
    ),
  })
  .strict()
  .describe("Request to ingest one initialized review version from a repository range.");

export const IngestReviewVersionResponseSchema = z
  .object({
    version: ReviewVersionReadSchema.describe("Persisted initialized review version."),
    created: z.boolean().describe("Whether this ingest created a new review version."),
  })
  .strict()
  .describe("Response from deterministic review version ingest.");

export const SetCommitReviewMarkRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the review mark change."),
    reviewMark: ReviewMarkSchema.describe("New commit-level review mark."),
  })
  .strict()
  .describe("Request to set the current review mark for a commit.");

export const SetFileReviewMarkRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the review mark change."),
    reviewMark: ExplicitFileReviewMarkSchema.describe("New explicit file-level review mark, or null."),
  })
  .strict()
  .describe("Request to set the explicit review mark for a file.");

export const SetCommitConcernAreasRequestSchema = z
  .object({
    actor: ActorRefSchema.describe("Actor responsible for the concern area change."),
    concernAreas: ConcernAreaSelectionSchema.describe("Ordered commit concern areas."),
  })
  .strict()
  .describe("Request to replace the ordered concern areas for a commit.");

export const RecordCommitAgentReviewRequestSchema = z
  .object({
    actor: AgentActorRefSchema.describe("Agent recording review evidence."),
    reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
    reviewedConcernAreas: ConcernAreaSelectionSchema.describe(
      "Ordered commit concern areas the agent believes are correct.",
    ),
    notesMarkdown: MarkdownStringSchema.nullable().describe("Optional agent-authored review notes."),
  })
  .strict()
  .describe("Request to record agent review evidence for a commit.");

export const RecordFileAgentReviewRequestSchema = z
  .object({
    actor: AgentActorRefSchema.describe("Agent recording review evidence."),
    reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
    notesMarkdown: MarkdownStringSchema.nullable().describe("Optional agent-authored review notes."),
  })
  .strict()
  .describe("Request to record agent review evidence for a file.");

export type ConcernAreasResponse = z.infer<typeof ConcernAreasResponseSchema>;
export type ReviewMarksResponse = z.infer<typeof ReviewMarksResponseSchema>;
export type ReviewBootstrapResponse = z.infer<typeof ReviewBootstrapResponseSchema>;
export type ReviewVersionsResponse = z.infer<typeof ReviewVersionsResponseSchema>;
export type ReviewVersionResponse = z.infer<typeof ReviewVersionResponseSchema>;
export type ReviewMarkWriteResponse = z.infer<typeof ReviewMarkWriteResponseSchema>;
export type RecordAgentReviewResponse = z.infer<typeof RecordAgentReviewResponseSchema>;
export type IngestReviewVersionRequest = z.infer<typeof IngestReviewVersionRequestSchema>;
export type IngestReviewVersionResponse = z.infer<typeof IngestReviewVersionResponseSchema>;
export type SetCommitReviewMarkRequest = z.infer<typeof SetCommitReviewMarkRequestSchema>;
export type SetFileReviewMarkRequest = z.infer<typeof SetFileReviewMarkRequestSchema>;
export type SetCommitConcernAreasRequest = z.infer<typeof SetCommitConcernAreasRequestSchema>;
export type RecordCommitAgentReviewRequest = z.infer<typeof RecordCommitAgentReviewRequestSchema>;
export type RecordFileAgentReviewRequest = z.infer<typeof RecordFileAgentReviewRequestSchema>;
