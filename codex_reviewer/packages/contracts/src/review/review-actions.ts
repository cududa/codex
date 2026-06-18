import { z } from "zod";
import { AgentActorRefSchema, ActorRefSchema, HumanActorRefSchema } from "./actors.js";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { LocalChangeRefSchema } from "./local-change-refs.js";
import { FinalReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import { CommitOrFileScopeSchema, CommitScopeSchema, ReviewScopeSchema } from "./scopes.js";
import { GitShaSchema, IdSchema, IsoDateTimeSchema, MarkdownStringSchema } from "../shared/primitives.js";

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
    if (review.scope.type === "commit" && review.reviewedConcernAreas === undefined) {
      context.addIssue({
        code: "custom",
        message: "commit agent reviews must verify concern areas",
        path: ["reviewedConcernAreas"],
      });
    }

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
    if (approval.scope.type === "commit" && approval.approvedConcernAreas === undefined) {
      context.addIssue({
        code: "custom",
        message: "commit approvals must approve concern areas",
        path: ["approvedConcernAreas"],
      });
    }

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

const reviewEventBaseShape = {
  id: IdSchema.describe("Identifier for this review event."),
  actor: ActorRefSchema.describe("Actor that caused the event."),
  summary: MarkdownStringSchema.describe("Human-readable summary of the event."),
  createdAt: IsoDateTimeSchema.describe("When the event occurred."),
} as const;

export const ReviewMarkChangedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("reviewMarkChanged").describe("A commit or file review mark changed."),
    scope: CommitOrFileScopeSchema.describe("Commit or file whose review mark changed."),
    previousReviewMark: ReviewMarkSchema.nullable().describe("Previous review mark; null when a file mark was previously unset."),
    newReviewMark: ReviewMarkSchema.describe("New review mark."),
  })
  .strict()
  .describe("Audit event for a commit or file review mark change.");

export const ConcernAreasChangedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("concernAreasChanged").describe("Commit concern areas changed."),
    scope: CommitScopeSchema.describe("Commit whose ordered concern areas changed."),
    previousConcernAreas: ConcernAreaSelectionSchema.describe("Previous ordered concern areas."),
    newConcernAreas: ConcernAreaSelectionSchema.describe("New ordered concern areas."),
  })
  .strict()
  .describe("Audit event for a commit concern-area change.");

export const AgentReviewRecordedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("agentReviewRecorded").describe("An agent review record was added."),
    scope: CommitOrFileScopeSchema.describe("Commit or file reviewed by the agent."),
    agentReviewId: IdSchema.describe("Agent review record that was added."),
  })
  .strict()
  .describe("Audit event for an agent review record.");

export const HumanApprovalRecordedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("humanApprovalRecorded").describe("A human approval record was added."),
    scope: CommitOrFileScopeSchema.describe("Commit or file approved by the human."),
    humanApprovalId: IdSchema.describe("Human approval record that was added."),
    approvedMark: FinalReviewMarkSchema.describe("Final mark approved by the human."),
  })
  .strict()
  .describe("Audit event for a human approval record.");

export const HumanApprovalRevokedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("humanApprovalRevoked").describe("A human approval record was revoked."),
    scope: CommitOrFileScopeSchema.describe("Commit or file whose human approval was revoked."),
    humanApprovalId: IdSchema.describe("Human approval record that was revoked."),
  })
  .strict()
  .describe("Audit event for a revoked human approval.");

export const LocalChangeLinkedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("localChangeLinked").describe("A local change reference was linked."),
    scope: CommitOrFileScopeSchema.describe("Commit or file that received the local change reference."),
    localChangeRefId: IdSchema.describe("Local change reference that was linked."),
    localChangeSha: GitShaSchema.describe("Local commit SHA that was linked."),
  })
  .strict()
  .describe("Audit event for linked local work.");

export const CommentResolvedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("commentResolved").describe("A threaded comment was resolved."),
    scope: ReviewScopeSchema.describe("Review scope containing the resolved comment."),
    commentId: IdSchema.describe("Comment that was resolved."),
    threadId: IdSchema.describe("Thread containing the resolved comment."),
  })
  .strict()
  .describe("Audit event for comment resolution.");

export const PlanUpdatedEventSchema = z
  .object({
    ...reviewEventBaseShape,
    kind: z.literal("planUpdated").describe("A review plan was updated."),
    scope: ReviewScopeSchema.describe("Review scope containing the updated plan."),
    reviewPlanId: IdSchema.describe("Review plan that was updated."),
  })
  .strict()
  .describe("Audit event for review plan updates.");

export const ReviewEventSchema = z
  .discriminatedUnion("kind", [
    ReviewMarkChangedEventSchema,
    ConcernAreasChangedEventSchema,
    AgentReviewRecordedEventSchema,
    HumanApprovalRecordedEventSchema,
    HumanApprovalRevokedEventSchema,
    LocalChangeLinkedEventSchema,
    CommentResolvedEventSchema,
    PlanUpdatedEventSchema,
  ])
  .describe("Typed audit event for material review changes.");

export const ReviewEventRecordSchema = z
  .object({
    id: IdSchema.describe("Identifier for this review event."),
    scope: ReviewScopeSchema.describe("Review scope affected by the event."),
    kind: ReviewEventKindSchema.describe("Review event kind."),
    actor: ActorRefSchema.describe("Actor that caused the event."),
    summary: MarkdownStringSchema.describe("Human-readable summary of the event."),
    createdAt: IsoDateTimeSchema.describe("When the event occurred."),
  })
  .strict()
  .describe("Common persisted columns shared by typed review events.");

export type AgentReview = z.infer<typeof AgentReviewSchema>;
export type HumanApproval = z.infer<typeof HumanApprovalSchema>;
export type ReviewEventKind = z.infer<typeof ReviewEventKindSchema>;
export type ReviewEvent = z.infer<typeof ReviewEventSchema>;
export type ReviewEventRecord = z.infer<typeof ReviewEventRecordSchema>;
