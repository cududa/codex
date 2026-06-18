import { z } from "zod";
import { AgentActorRefSchema, ActorRefSchema, HumanActorRefSchema } from "./actors.js";
import { ConcernAreaSelectionSchema } from "./concern-areas.js";
import { FinalReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import { ReviewNoteScopeSchema } from "./review-notes.js";
import { CommitOrFileScopeSchema, ReviewAnchorSchema, ReviewScopeSchema } from "./scopes.js";
import {
  GitShaSchema,
  IdSchema,
  IsoDateTimeSchema,
  MarkdownStringSchema,
  NonEmptyStringSchema,
} from "../shared/primitives.js";

const commandBaseShape = {
  commandId: IdSchema.describe("Stable identifier for this domain write command."),
  actor: ActorRefSchema.describe("Actor requesting this domain write."),
  occurredAt: IsoDateTimeSchema.describe("Timestamp owned by the domain write command."),
} as const;

export const LocalChangeRefCommandInputSchema = z
  .object({
    id: IdSchema.describe("Identifier to use for the local change reference row."),
    sha: GitShaSchema.describe("Local commit SHA that implements the required adaptation."),
    title: NonEmptyStringSchema.optional().describe("Short title for the local commit, when known."),
    summary: MarkdownStringSchema.optional().describe(
      "Optional summary of how the local change resolves the review work.",
    ),
    linkedBy: ActorRefSchema.describe("Human, agent, or system actor linking this local change."),
    linkedAt: IsoDateTimeSchema.describe("When the local change was linked to the review item."),
  })
  .strict()
  .describe("Command input for linking local work evidence to a review item.");

const localChangeRefsField = z
  .array(LocalChangeRefCommandInputSchema)
  .describe("Local change evidence included with this command.");

function requireLocalChangeRefsOnlyForDone(
  reviewMark: string | null,
  localChangeRefs: readonly unknown[],
  context: z.RefinementCtx,
): void {
  if (reviewMark === "DONE" && localChangeRefs.length === 0) {
    context.addIssue({
      code: "custom",
      message: "DONE commands require at least one local change reference",
      path: ["localChangeRefs"],
    });
  }

  if (reviewMark !== "DONE" && localChangeRefs.length > 0) {
    context.addIssue({
      code: "custom",
      message: "local change references are only valid when setting DONE",
      path: ["localChangeRefs"],
    });
  }
}

export const SetCommitReviewMarkCommandSchema = z
  .object({
    ...commandBaseShape,
    commitId: IdSchema.describe("Commit whose review mark should change."),
    reviewMark: ReviewMarkSchema.describe("New commit review mark."),
    localChangeRefs: localChangeRefsField,
    eventId: IdSchema.describe("Review event identifier for the resulting mark change."),
  })
  .strict()
  .superRefine((command, context) =>
    requireLocalChangeRefsOnlyForDone(command.reviewMark, command.localChangeRefs, context),
  )
  .describe("Canonical command to change a commit review mark.");

export const SetFileReviewMarkCommandSchema = z
  .object({
    ...commandBaseShape,
    fileId: IdSchema.describe("File whose review mark should change."),
    reviewMark: ReviewMarkSchema.describe("New explicit file review mark."),
    localChangeRefs: localChangeRefsField,
    eventId: IdSchema.describe("Review event identifier for the resulting mark change."),
  })
  .strict()
  .superRefine((command, context) =>
    requireLocalChangeRefsOnlyForDone(command.reviewMark, command.localChangeRefs, context),
  )
  .describe("Canonical command to change a file review mark.");

export const SetCommitConcernAreasCommandSchema = z
  .object({
    ...commandBaseShape,
    commitId: IdSchema.describe("Commit whose ordered concern areas should change."),
    concernAreas: ConcernAreaSelectionSchema.describe("New ordered commit concern areas."),
    eventId: IdSchema.describe("Review event identifier for the resulting concern-area change."),
  })
  .strict()
  .describe("Canonical command to replace a commit's ordered concern areas.");

export const RecordAgentReviewCommandSchema = z
  .object({
    ...commandBaseShape,
    actor: AgentActorRefSchema.describe("Agent recording this review."),
    reviewId: IdSchema.describe("Agent review record identifier."),
    scope: CommitOrFileScopeSchema.describe("Commit or file reviewed by the agent."),
    reviewedMark: ReviewMarkSchema.describe("Review mark verified by the agent."),
    reviewedConcernAreas: ConcernAreaSelectionSchema.optional().describe(
      "Ordered concern areas verified by the agent; commit scopes only.",
    ),
    notes: MarkdownStringSchema.optional().describe("Optional agent review notes."),
    eventId: IdSchema.describe("Review event identifier for the resulting agent review."),
  })
  .strict()
  .superRefine((command, context) => {
    if (command.scope.type === "commit" && command.reviewedConcernAreas === undefined) {
      context.addIssue({
        code: "custom",
        message: "commit agent review commands must verify concern areas",
        path: ["reviewedConcernAreas"],
      });
    }

    if (command.scope.type === "file" && command.reviewedConcernAreas !== undefined) {
      context.addIssue({
        code: "custom",
        message: "file agent review commands cannot include concern areas",
        path: ["reviewedConcernAreas"],
      });
    }
  })
  .describe("Canonical command to record an agent review.");

export const RecordHumanApprovalCommandSchema = z
  .object({
    ...commandBaseShape,
    actor: HumanActorRefSchema.describe("Human recording this approval."),
    approvalId: IdSchema.describe("Human approval record identifier."),
    scope: CommitOrFileScopeSchema.describe("Commit or file approved by the human."),
    approvedMark: FinalReviewMarkSchema.describe("Final mark approved by the human."),
    approvedConcernAreas: ConcernAreaSelectionSchema.optional().describe(
      "Ordered concern areas approved by the human; commit scopes only.",
    ),
    localChangeRefs: localChangeRefsField,
    notes: MarkdownStringSchema.optional().describe("Optional approval notes."),
    eventId: IdSchema.describe("Review event identifier for the resulting human approval."),
  })
  .strict()
  .superRefine((command, context) => {
    if (command.scope.type === "commit" && command.approvedConcernAreas === undefined) {
      context.addIssue({
        code: "custom",
        message: "commit approval commands must approve concern areas",
        path: ["approvedConcernAreas"],
      });
    }

    if (command.scope.type === "file" && command.approvedConcernAreas !== undefined) {
      context.addIssue({
        code: "custom",
        message: "file approval commands cannot include concern areas",
        path: ["approvedConcernAreas"],
      });
    }

    requireLocalChangeRefsOnlyForDone(command.approvedMark, command.localChangeRefs, context);
  })
  .describe("Canonical command to record a human approval.");

export const LinkLocalChangeRefCommandSchema = z
  .object({
    ...commandBaseShape,
    scope: CommitOrFileScopeSchema.describe("Commit or file receiving local change evidence."),
    localChangeRef: LocalChangeRefCommandInputSchema.describe("Local change evidence being linked."),
    eventId: IdSchema.describe("Review event identifier for the resulting local change link."),
  })
  .strict()
  .describe("Canonical command to link local work evidence.");

export const AddThreadedCommentCommandSchema = z
  .object({
    ...commandBaseShape,
    commentId: IdSchema.describe("Threaded comment identifier."),
    scope: ReviewScopeSchema.describe("Review scope receiving the comment."),
    anchor: ReviewAnchorSchema.describe("Precise comment anchor."),
    threadId: IdSchema.describe("Thread identifier."),
    parentCommentId: IdSchema.nullable().describe("Parent comment identifier for replies, or null."),
    bodyMarkdown: MarkdownStringSchema.describe("Comment body markdown."),
  })
  .strict()
  .describe("Canonical command to add a threaded comment.");

export const ResolveThreadedCommentCommandSchema = z
  .object({
    ...commandBaseShape,
    commentId: IdSchema.describe("Threaded comment being resolved."),
    threadId: IdSchema.describe("Thread containing the resolved comment."),
    scope: ReviewScopeSchema.describe("Review scope containing the resolved comment."),
    eventId: IdSchema.describe("Review event identifier for the resulting comment resolution."),
  })
  .strict()
  .describe("Canonical command to resolve a threaded comment.");

export const AddReviewNoteCommandSchema = z
  .object({
    ...commandBaseShape,
    noteId: IdSchema.describe("Review note identifier."),
    scope: ReviewNoteScopeSchema.describe("Review scope receiving the note."),
    bodyMarkdown: MarkdownStringSchema.describe("Review note body markdown."),
  })
  .strict()
  .describe("Canonical command to add a freeform review note.");

export const UpdateReviewNoteCommandSchema = z
  .object({
    ...commandBaseShape,
    noteId: IdSchema.describe("Review note being updated."),
    bodyMarkdown: MarkdownStringSchema.describe("Replacement review note body markdown."),
  })
  .strict()
  .describe("Canonical command to update a freeform review note.");

export const DeleteReviewNoteCommandSchema = z
  .object({
    ...commandBaseShape,
    noteId: IdSchema.describe("Review note being soft-deleted."),
  })
  .strict()
  .describe("Canonical command to soft-delete a freeform review note.");

export const UpsertReviewPlanCommandSchema = z
  .object({
    ...commandBaseShape,
    reviewPlanId: IdSchema.describe("Review plan identifier."),
    scope: ReviewScopeSchema.describe("Review scope receiving the plan."),
    bodyMarkdown: MarkdownStringSchema.describe("Review plan markdown."),
    eventId: IdSchema.describe("Review event identifier for the resulting plan update."),
  })
  .strict()
  .describe("Canonical command to create or update a review plan.");

const ReviewLedgerEntryCommandInputSchema = z
  .object({
    ledgerEntryId: IdSchema.describe("Identifier to use for this stored ledger entry."),
    commitId: IdSchema.describe("Reviewed commit represented by this ledger entry."),
    upstreamSha: GitShaSchema.describe("Upstream commit SHA accepted by this review entry."),
    finalMark: FinalReviewMarkSchema.describe("Final review mark for the upstream commit."),
    concernAreas: ConcernAreaSelectionSchema.describe("Final ordered concern areas for the commit."),
    localChangeRefIds: z.array(IdSchema).describe("Local change references linked to DONE work."),
    approvedBy: HumanActorRefSchema.describe("Human approval author accepted for this ledger entry."),
    approvedAt: IsoDateTimeSchema.describe("When the final commit state was approved."),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.finalMark === "DONE" && entry.localChangeRefIds.length === 0) {
      context.addIssue({
        code: "custom",
        message: "DONE ledger entries require at least one local change reference",
        path: ["localChangeRefIds"],
      });
    }
    if (entry.finalMark === "PASS" && entry.localChangeRefIds.length > 0) {
      context.addIssue({
        code: "custom",
        message: "PASS ledger entries cannot include local change references",
        path: ["localChangeRefIds"],
      });
    }
  })
  .describe("Command input for one completed review ledger entry.");

export const GenerateReviewLedgerCommandSchema = z
  .object({
    ...commandBaseShape,
    actor: HumanActorRefSchema.describe("Human generating the completed review ledger."),
    ledgerId: IdSchema.describe("Identifier to use for the generated review ledger."),
    versionId: IdSchema.describe("Review version summarized by the ledger."),
    summary: MarkdownStringSchema.optional().describe("Optional completed review summary."),
    entries: z
      .array(ReviewLedgerEntryCommandInputSchema)
      .min(1)
      .describe("Completed commit-level ledger entries."),
  })
  .strict()
  .describe("Canonical command to generate the completed review ledger.");

export type SetCommitReviewMarkCommand = z.infer<typeof SetCommitReviewMarkCommandSchema>;
export type SetFileReviewMarkCommand = z.infer<typeof SetFileReviewMarkCommandSchema>;
export type SetCommitConcernAreasCommand = z.infer<typeof SetCommitConcernAreasCommandSchema>;
export type RecordAgentReviewCommand = z.infer<typeof RecordAgentReviewCommandSchema>;
export type RecordHumanApprovalCommand = z.infer<typeof RecordHumanApprovalCommandSchema>;
export type LinkLocalChangeRefCommand = z.infer<typeof LinkLocalChangeRefCommandSchema>;
export type AddThreadedCommentCommand = z.infer<typeof AddThreadedCommentCommandSchema>;
export type ResolveThreadedCommentCommand = z.infer<typeof ResolveThreadedCommentCommandSchema>;
export type AddReviewNoteCommand = z.infer<typeof AddReviewNoteCommandSchema>;
export type UpdateReviewNoteCommand = z.infer<typeof UpdateReviewNoteCommandSchema>;
export type DeleteReviewNoteCommand = z.infer<typeof DeleteReviewNoteCommandSchema>;
export type UpsertReviewPlanCommand = z.infer<typeof UpsertReviewPlanCommandSchema>;
export type GenerateReviewLedgerCommand = z.infer<typeof GenerateReviewLedgerCommandSchema>;
export type LocalChangeRefCommandInput = z.infer<typeof LocalChangeRefCommandInputSchema>;
