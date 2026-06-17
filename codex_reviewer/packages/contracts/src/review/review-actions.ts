import { z } from "zod";
import { AgentActorRefSchema, ActorRefSchema, HumanActorRefSchema } from "./actors.js";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { LocalChangeRefSchema } from "./local-change-refs.js";
import { FinalReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import { CommitOrFileScopeSchema } from "./scopes.js";
import { IdSchema, IsoDateTimeSchema, JsonRecordSchema, MarkdownStringSchema } from "../shared/primitives.js";

export const AgentReviewSchema = z
  .object({
    id: IdSchema.describe("Identifier for this agent review record."),
    scope: CommitOrFileScopeSchema.describe("Commit or file reviewed by the agent."),
    reviewedMark: ReviewMarkSchema.describe("Review mark the agent believes is appropriate for the scope."),
    reviewedConcernAreas: ConcernAreaSelectionSchema.optional().describe(
      "Ordered concern areas verified by the agent; commit scopes only.",
    ),
    notes: MarkdownStringSchema.optional().describe("Optional agent rationale or investigation summary."),
    reviewer: AgentActorRefSchema.describe("Agent that performed the review."),
    reviewedAt: IsoDateTimeSchema.describe("When the agent review was recorded."),
  })
  .strict()
  .superRefine((review, context) => {
    if (review.scope.type === "file" && review.reviewedConcernAreas !== undefined) {
      context.addIssue({
        code: "custom",
        message: "files cannot have concern areas",
        path: ["reviewedConcernAreas"],
      });
    }
  })
  .describe("Agent-authored verification of a commit or file review state.");

export const HumanApprovalSchema = z
  .object({
    id: IdSchema.describe("Identifier for this human approval record."),
    scope: CommitOrFileScopeSchema.describe("Commit or file approved by the human reviewer."),
    approvedMark: FinalReviewMarkSchema.describe("Final review mark accepted by the human reviewer."),
    approvedConcernAreas: ConcernAreaSelectionSchema.optional().describe(
      "Ordered concern areas accepted by the human reviewer; commit scopes only.",
    ),
    localChangeRefs: z
      .array(LocalChangeRefSchema)
      .describe("Local changes accepted as evidence when the approved mark is DONE."),
    notes: MarkdownStringSchema.optional().describe("Optional approval note."),
    approvedBy: HumanActorRefSchema.describe("Human reviewer who approved this scope."),
    approvedAt: IsoDateTimeSchema.describe("When the human approval was recorded."),
  })
  .strict()
  .superRefine((approval, context) => {
    if (approval.scope.type === "file" && approval.approvedConcernAreas !== undefined) {
      context.addIssue({
        code: "custom",
        message: "files cannot have concern areas",
        path: ["approvedConcernAreas"],
      });
    }

    if (approval.approvedMark === "DONE" && approval.localChangeRefs.length === 0) {
      context.addIssue({
        code: "custom",
        message: "DONE approvals require at least one local change reference",
        path: ["localChangeRefs"],
      });
    }
  })
  .describe("Human approval of a reviewed commit or file.");

export const ReviewEventKindSchema = z
  .enum([
    "reviewMarkChanged",
    "concernAreasChanged",
    "agentReviewRecorded",
    "humanApprovalRecorded",
    "humanApprovalRevoked",
    "localChangeLinked",
    "commentResolved",
    "planUpdated",
  ])
  .describe("The kind of review audit event.");

export const ReviewEventSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review event."),
    scope: CommitOrFileScopeSchema.describe("Commit or file affected by the event."),
    kind: ReviewEventKindSchema.describe("Review event kind."),
    actor: ActorRefSchema.describe("Actor that caused the event."),
    summary: MarkdownStringSchema.describe("Human-readable summary of the event."),
    payload: JsonRecordSchema.describe("Schema-owned event metadata for the specific event kind."),
    createdAt: IsoDateTimeSchema.describe("When the event occurred."),
  })
  .strict()
  .describe("Audit event for material review changes.");

export type AgentReview = z.infer<typeof AgentReviewSchema>;
export type HumanApproval = z.infer<typeof HumanApprovalSchema>;
export type ReviewEventKind = z.infer<typeof ReviewEventKindSchema>;
export type ReviewEvent = z.infer<typeof ReviewEventSchema>;
