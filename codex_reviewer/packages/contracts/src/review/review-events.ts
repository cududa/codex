import { z } from "zod";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { ExplicitFileReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import { IdSchema } from "../shared/primitives.js";

export const ReviewEventTargetSchema = z
  .object({
    type: z.enum(["version", "commit", "file", "diffBlock"]),
    id: IdSchema,
  })
  .strict()
  .describe("Review event payload target.");

const CommitReviewMarkChangedTargetSchema = z
  .object({
    type: z.literal("commit"),
    id: IdSchema,
  })
  .strict();

const FileReviewMarkChangedTargetSchema = z
  .object({
    type: z.literal("file"),
    id: IdSchema,
  })
  .strict();

const ConcernAreasChangedTargetSchema = z
  .object({
    type: z.literal("commit"),
    id: IdSchema,
  })
  .strict();

const CommitAgentReviewTargetSchema = z
  .object({
    type: z.literal("commit"),
    id: IdSchema,
  })
  .strict();

const FileAgentReviewTargetSchema = z
  .object({
    type: z.literal("file"),
    id: IdSchema,
  })
  .strict();

export const ReviewMarkChangedEventPayloadSchema = z
  .union([
    z
      .object({
        target: CommitReviewMarkChangedTargetSchema.describe("Commit whose current review mark changed."),
        previousReviewMark: ReviewMarkSchema.describe("Previous commit review mark."),
        newReviewMark: ReviewMarkSchema.describe("New commit review mark."),
      })
      .strict(),
    z
      .object({
        target: FileReviewMarkChangedTargetSchema.describe("File whose explicit review mark changed."),
        previousReviewMark: ExplicitFileReviewMarkSchema.describe("Previous explicit file review mark."),
        newReviewMark: ExplicitFileReviewMarkSchema.describe("New explicit file review mark."),
      })
      .strict(),
  ])
  .describe("Payload for review_mark_changed audit events.");

export const ConcernAreasChangedEventPayloadSchema = z
  .object({
    target: ConcernAreasChangedTargetSchema.describe("Commit whose concern areas changed."),
    commitId: IdSchema.describe("Commit whose concern areas changed."),
    previousConcernAreas: ConcernAreaSelectionSchema.describe("Previous ordered commit concern areas."),
    newConcernAreas: ConcernAreaSelectionSchema.describe("New ordered commit concern areas."),
  })
  .strict()
  .refine((payload) => payload.commitId === payload.target.id, {
    message: "commitId must match target.id",
    path: ["commitId"],
  })
  .describe("Payload for concern_areas_changed audit events.");

export const AgentReviewRecordedEventPayloadSchema = z
  .union([
    z
      .object({
        agentReviewId: IdSchema.describe("Agent review evidence row identifier."),
        target: CommitAgentReviewTargetSchema.describe("Commit reviewed by the agent."),
        reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
        reviewedConcernAreas: ConcernAreaSelectionSchema.describe(
          "Ordered commit concern areas the agent believes are correct.",
        ),
      })
      .strict(),
    z
      .object({
        agentReviewId: IdSchema.describe("Agent review evidence row identifier."),
        target: FileAgentReviewTargetSchema.describe("File reviewed by the agent."),
        reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is correct."),
      })
      .strict(),
  ])
  .describe("Payload for agent_review_recorded audit events.");

export type ReviewEventTarget = z.infer<typeof ReviewEventTargetSchema>;
export type ReviewMarkChangedEventPayload = z.infer<typeof ReviewMarkChangedEventPayloadSchema>;
export type ConcernAreasChangedEventPayload = z.infer<typeof ConcernAreasChangedEventPayloadSchema>;
export type AgentReviewRecordedEventPayload = z.infer<typeof AgentReviewRecordedEventPayloadSchema>;
