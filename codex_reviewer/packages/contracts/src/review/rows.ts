import { z } from "zod";
import { ActorKindSchema } from "./actors.js";
import { ConcernAreaSlugSchema } from "./concern-areas.js";
import { DetectorRunStateSchema } from "./detector-evidence.js";
import { FinalReviewMarkSchema, ReviewMarkSchema } from "./review-marks.js";
import { ReviewNoteRevisionActionSchema, ReviewNoteScopeTypeSchema } from "./review-notes.js";
import { ChangeKindSchema } from "./reviewables.js";
import { DiffSideSchema, ReviewScopeTypeSchema } from "./scopes.js";
import { ThreadedCommentStateSchema } from "./threaded-comments.js";
import {
  GitShaSchema,
  IdSchema,
  IsoDateTimeSchema,
  MarkdownStringSchema,
  NonEmptyStringSchema,
  PositiveLineNumberSchema,
  ZeroBasedPositionSchema,
} from "../shared/primitives.js";

const nullableId = IdSchema.nullable();
const nullableText = NonEmptyStringSchema.nullable();
const nullableMarkdown = MarkdownStringSchema.nullable();
const nullableTimestamp = IsoDateTimeSchema.nullable();
const nullableReviewMark = ReviewMarkSchema.nullable();
const nullableFinalReviewMark = FinalReviewMarkSchema.nullable();
const nullableLineNumber = PositiveLineNumberSchema.nullable();

function requireExactlyOneTarget(
  row: {
    versionId?: string | null;
    commitId?: string | null;
    fileId?: string | null;
    diffBlockId?: string | null;
  },
  context: z.RefinementCtx,
): void {
  const populatedTargets = [row.versionId, row.commitId, row.fileId, row.diffBlockId].filter(
    (target) => target !== null && target !== undefined,
  );
  if (populatedTargets.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "exactly one review scope target column must be populated",
      path: ["scopeType"],
    });
  }
}

function requireScopeTargetMatch(
  row: {
    scopeType: string;
    versionId?: string | null;
    commitId?: string | null;
    fileId?: string | null;
    diffBlockId?: string | null;
  },
  context: z.RefinementCtx,
): void {
  requireExactlyOneTarget(row, context);

  const expectedTarget = `${row.scopeType}Id` as "versionId" | "commitId" | "fileId" | "diffBlockId";
  if (row[expectedTarget] === null || row[expectedTarget] === undefined) {
    context.addIssue({
      code: "custom",
      message: "scopeType must match the populated review target column",
      path: ["scopeType"],
    });
  }
}

export const ReviewVersionRowSchema = z
  .object({
    id: IdSchema.describe("Stored review version row identifier."),
    label: NonEmptyStringSchema.describe("Stored review version label."),
    repositoryId: NonEmptyStringSchema.describe("Stored repository identifier."),
    baseRef: nullableText.describe("Stored base ref or null."),
    targetRef: nullableText.describe("Stored target ref or null."),
    baseSha: GitShaSchema.nullable().describe("Stored resolved base SHA or null."),
    targetSha: GitShaSchema.nullable().describe("Stored resolved target SHA or null."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedAt: nullableTimestamp.describe("Stored update timestamp or null."),
  })
  .strict()
  .describe("Stored row for the review_versions table.");

export const ReviewCommitRowSchema = z
  .object({
    id: IdSchema.describe("Stored reviewed commit row identifier."),
    versionId: IdSchema.describe("Stored parent review version identifier."),
    sha: GitShaSchema.describe("Stored upstream commit SHA."),
    position: ZeroBasedPositionSchema.describe("Stored commit order within the review version."),
    title: NonEmptyStringSchema.describe("Stored upstream commit title."),
    message: nullableMarkdown.describe("Stored upstream commit message or null."),
    authorName: nullableText.describe("Stored upstream author name or null."),
    committedAt: nullableTimestamp.describe("Stored upstream commit timestamp or null."),
    reviewMark: ReviewMarkSchema.describe("Stored current commit review mark."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedAt: nullableTimestamp.describe("Stored update timestamp or null."),
  })
  .strict()
  .describe("Stored row for the review_commits table.");

export const ReviewFileRowSchema = z
  .object({
    id: IdSchema.describe("Stored reviewed file row identifier."),
    commitId: IdSchema.describe("Stored parent reviewed commit identifier."),
    position: ZeroBasedPositionSchema.describe("Stored file order within the commit."),
    path: NonEmptyStringSchema.describe("Stored current file path."),
    oldPath: nullableText.describe("Stored previous path for renamed/copied files or null."),
    changeKind: ChangeKindSchema.describe("Stored file change kind."),
    reviewMark: nullableReviewMark.describe("Stored explicit file review mark or null."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedAt: nullableTimestamp.describe("Stored update timestamp or null."),
  })
  .strict()
  .describe("Stored row for the review_files table.");

export const DiffBlockRowSchema = z
  .object({
    id: IdSchema.describe("Stored diff block row identifier."),
    fileId: IdSchema.describe("Stored parent reviewed file identifier."),
    position: ZeroBasedPositionSchema.describe("Stored diff block order within the file."),
    heading: nullableText.describe("Stored diff block heading or null."),
    oldStartLine: nullableLineNumber.describe("Stored first old-side line or null."),
    oldEndLine: nullableLineNumber.describe("Stored last old-side line or null."),
    newStartLine: nullableLineNumber.describe("Stored first new-side line or null."),
    newEndLine: nullableLineNumber.describe("Stored last new-side line or null."),
    patch: NonEmptyStringSchema.describe("Stored unified diff patch."),
  })
  .strict()
  .superRefine((row, context) => {
    if (row.oldStartLine !== null && row.oldEndLine !== null && row.oldStartLine > row.oldEndLine) {
      context.addIssue({
        code: "custom",
        message: "oldStartLine must be less than or equal to oldEndLine",
        path: ["oldEndLine"],
      });
    }

    if (row.newStartLine !== null && row.newEndLine !== null && row.newStartLine > row.newEndLine) {
      context.addIssue({
        code: "custom",
        message: "newStartLine must be less than or equal to newEndLine",
        path: ["newEndLine"],
      });
    }
  })
  .describe("Stored row for the diff_blocks table.");

export const CommitConcernAreaRowSchema = z
  .object({
    commitId: IdSchema.describe("Stored reviewed commit identifier."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored concern area slug."),
    position: z.number().int().min(0).max(2).describe("Stored concern area order for the commit."),
  })
  .strict()
  .describe("Stored row for the commit_concern_areas table.");

export const LocalChangeRefRowSchema = z
  .object({
    id: IdSchema.describe("Stored local change reference row identifier."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    sha: GitShaSchema.describe("Stored local commit SHA."),
    title: nullableText.describe("Stored local commit title or null."),
    summary: nullableMarkdown.describe("Stored local change summary or null."),
    linkedByType: ActorKindSchema.describe("Stored linking actor kind."),
    linkedById: IdSchema.describe("Stored linking actor identifier."),
    linkedByDisplayName: nullableText.describe("Stored linking actor display name or null."),
    linkedAt: IsoDateTimeSchema.describe("Stored local change linking timestamp."),
  })
  .strict()
  .superRefine((row, context) => requireExactlyOneTarget(row, context))
  .describe("Stored row for the local_change_refs table.");

export const AgentCommitReviewRowSchema = z
  .object({
    id: IdSchema.describe("Stored agent commit review row identifier."),
    commitId: IdSchema.describe("Stored reviewed commit identifier."),
    reviewedMark: ReviewMarkSchema.describe("Stored review mark verified by the agent."),
    notes: nullableMarkdown.describe("Stored agent notes or null."),
    reviewerId: IdSchema.describe("Stored agent identifier."),
    reviewerDisplayName: nullableText.describe("Stored agent display name or null."),
    reviewedAt: IsoDateTimeSchema.describe("Stored agent review timestamp."),
  })
  .strict()
  .describe("Stored row for the agent_commit_reviews table.");

export const AgentCommitReviewConcernAreaRowSchema = z
  .object({
    agentReviewId: IdSchema.describe("Stored agent commit review identifier."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored verified concern area slug."),
    position: z.number().int().min(0).max(2).describe("Stored verified concern area order."),
  })
  .strict()
  .describe("Stored row for the agent_commit_review_concern_areas table.");

export const AgentFileReviewRowSchema = z
  .object({
    id: IdSchema.describe("Stored agent file review row identifier."),
    fileId: IdSchema.describe("Stored reviewed file identifier."),
    reviewedMark: ReviewMarkSchema.describe("Stored file review mark verified by the agent."),
    notes: nullableMarkdown.describe("Stored agent notes or null."),
    reviewerId: IdSchema.describe("Stored agent identifier."),
    reviewerDisplayName: nullableText.describe("Stored agent display name or null."),
    reviewedAt: IsoDateTimeSchema.describe("Stored agent review timestamp."),
  })
  .strict()
  .describe("Stored row for the agent_file_reviews table.");

export const HumanCommitApprovalRowSchema = z
  .object({
    id: IdSchema.describe("Stored human commit approval row identifier."),
    commitId: IdSchema.describe("Stored approved commit identifier."),
    approvedMark: FinalReviewMarkSchema.describe("Stored final commit mark approved by the human."),
    notes: nullableMarkdown.describe("Stored approval notes or null."),
    approvedById: IdSchema.describe("Stored human approver identifier."),
    approvedByDisplayName: nullableText.describe("Stored human approver display name or null."),
    approvedAt: IsoDateTimeSchema.describe("Stored approval timestamp."),
  })
  .strict()
  .describe("Stored row for the human_commit_approvals table.");

export const HumanCommitApprovalConcernAreaRowSchema = z
  .object({
    humanApprovalId: IdSchema.describe("Stored human commit approval identifier."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored approved concern area slug."),
    position: z.number().int().min(0).max(2).describe("Stored approved concern area order."),
  })
  .strict()
  .describe("Stored row for the human_commit_approval_concern_areas table.");

export const HumanFileApprovalRowSchema = z
  .object({
    id: IdSchema.describe("Stored human file approval row identifier."),
    fileId: IdSchema.describe("Stored approved file identifier."),
    approvedMark: FinalReviewMarkSchema.describe("Stored final file mark approved by the human."),
    notes: nullableMarkdown.describe("Stored approval notes or null."),
    approvedById: IdSchema.describe("Stored human approver identifier."),
    approvedByDisplayName: nullableText.describe("Stored human approver display name or null."),
    approvedAt: IsoDateTimeSchema.describe("Stored approval timestamp."),
  })
  .strict()
  .describe("Stored row for the human_file_approvals table.");

export const ReviewEventRowSchema = z
  .object({
    id: IdSchema.describe("Stored review event row identifier."),
    scopeType: ReviewScopeTypeSchema.describe("Stored event scope type."),
    versionId: nullableId.describe("Stored version target or null."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    diffBlockId: nullableId.describe("Stored diff block target or null."),
    kind: z
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
      .describe("Stored review event kind."),
    actorType: ActorKindSchema.describe("Stored event actor kind."),
    actorId: IdSchema.describe("Stored event actor identifier."),
    actorDisplayName: nullableText.describe("Stored event actor display name or null."),
    summary: MarkdownStringSchema.describe("Stored event summary."),
    previousReviewMark: nullableReviewMark.describe("Stored previous review mark or null."),
    newReviewMark: nullableReviewMark.describe("Stored new review mark or null."),
    agentReviewId: nullableId.describe("Stored agent review reference or null."),
    humanApprovalId: nullableId.describe("Stored human approval reference or null."),
    approvedMark: nullableFinalReviewMark.describe("Stored approved mark or null."),
    localChangeRefId: nullableId.describe("Stored local change reference or null."),
    localChangeSha: GitShaSchema.nullable().describe("Stored linked local commit SHA or null."),
    commentId: nullableId.describe("Stored comment reference or null."),
    threadId: nullableId.describe("Stored thread reference or null."),
    reviewPlanId: nullableId.describe("Stored review plan reference or null."),
    createdAt: IsoDateTimeSchema.describe("Stored event timestamp."),
  })
  .strict()
  .superRefine((row, context) => {
    requireScopeTargetMatch(row, context);

    const unexpectedByKind: Record<typeof row.kind, string[]> = {
      reviewMarkChanged: [
        "agentReviewId",
        "humanApprovalId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      concernAreasChanged: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "humanApprovalId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      agentReviewRecorded: [
        "previousReviewMark",
        "newReviewMark",
        "humanApprovalId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      humanApprovalRecorded: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      humanApprovalRevoked: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      localChangeLinked: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "humanApprovalId",
        "approvedMark",
        "commentId",
        "threadId",
        "reviewPlanId",
      ],
      commentResolved: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "humanApprovalId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "reviewPlanId",
      ],
      planUpdated: [
        "previousReviewMark",
        "newReviewMark",
        "agentReviewId",
        "humanApprovalId",
        "approvedMark",
        "localChangeRefId",
        "localChangeSha",
        "commentId",
        "threadId",
      ],
    };

    for (const field of unexpectedByKind[row.kind]) {
      if (row[field as keyof typeof row] !== null) {
        context.addIssue({ code: "custom", message: `${field} is not valid for ${row.kind}`, path: [field] });
      }
    }

    const requiredByKind: Record<typeof row.kind, string[]> = {
      reviewMarkChanged: ["newReviewMark"],
      concernAreasChanged: [],
      agentReviewRecorded: ["agentReviewId"],
      humanApprovalRecorded: ["humanApprovalId", "approvedMark"],
      humanApprovalRevoked: ["humanApprovalId"],
      localChangeLinked: ["localChangeRefId", "localChangeSha"],
      commentResolved: ["commentId", "threadId"],
      planUpdated: ["reviewPlanId"],
    };

    for (const field of requiredByKind[row.kind]) {
      if (row[field as keyof typeof row] === null) {
        context.addIssue({ code: "custom", message: `${field} is required for ${row.kind}`, path: [field] });
      }
    }
  })
  .describe("Stored row for the review_events table.");

export const ReviewEventConcernAreaRowSchema = z
  .object({
    reviewEventId: IdSchema.describe("Stored review event identifier."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored concern area slug."),
    position: z.number().int().min(0).max(2).describe("Stored concern area order."),
  })
  .strict()
  .describe("Stored row for review event concern-area history tables.");

export const DetectorRunRowSchema = z
  .object({
    id: IdSchema.describe("Stored detector run row identifier."),
    versionId: IdSchema.describe("Stored analyzed review version identifier."),
    concernMapVersion: z.number().int().positive().describe("Stored concern map version."),
    state: DetectorRunStateSchema.describe("Stored detector run state."),
    startedAt: IsoDateTimeSchema.describe("Stored detector start timestamp."),
    completedAt: nullableTimestamp.describe("Stored detector completion timestamp or null."),
    failureMessage: nullableMarkdown.describe("Stored detector failure message or null."),
  })
  .strict()
  .superRefine((row, context) => {
    if (row.state === "completed" && row.completedAt === null) {
      context.addIssue({
        code: "custom",
        message: "completed detector run rows require completedAt",
        path: ["completedAt"],
      });
    }
    if (row.state === "failed" && row.failureMessage === null) {
      context.addIssue({
        code: "custom",
        message: "failed detector run rows require failureMessage",
        path: ["failureMessage"],
      });
    }
    if (row.state === "running" && (row.completedAt !== null || row.failureMessage !== null)) {
      context.addIssue({
        code: "custom",
        message: "running detector run rows cannot include completion or failure fields",
        path: ["state"],
      });
    }
  })
  .describe("Stored row for the detector_runs table.");

export const DetectorEvidenceRowSchema = z
  .object({
    id: IdSchema.describe("Stored detector evidence row identifier."),
    runId: IdSchema.describe("Stored detector run identifier."),
    scopeType: ReviewScopeTypeSchema.describe("Stored evidence scope type."),
    versionId: nullableId.describe("Stored version target or null."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    diffBlockId: nullableId.describe("Stored diff block target or null."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored concern area slug."),
    suggestedReviewMark: nullableReviewMark.describe("Stored suggested review mark or null."),
    title: NonEmptyStringSchema.describe("Stored evidence title."),
    summary: nullableMarkdown.describe("Stored evidence summary or null."),
    detailKind: z
      .enum(["path", "symbol", "marker", "templateMarker", "diff", "graph"])
      .describe("Stored evidence detail kind."),
    detailPath: nullableText.describe("Stored path detail or null."),
    detailSymbolName: nullableText.describe("Stored symbol detail or null."),
    detailMarker: nullableText.describe("Stored marker detail or null."),
    detailDiffBlockId: nullableId.describe("Stored detail diff block identifier or null."),
    detailSide: DiffSideSchema.nullable().describe("Stored detail diff side or null."),
    detailStartLine: nullableLineNumber.describe("Stored detail start line or null."),
    detailEndLine: nullableLineNumber.describe("Stored detail end line or null."),
    detailGraphNodeId: nullableText.describe("Stored graph node identifier or null."),
    detailGraphNodeLabel: nullableText.describe("Stored graph node label or null."),
    createdAt: IsoDateTimeSchema.describe("Stored evidence timestamp."),
  })
  .strict()
  .superRefine((row, context) => {
    requireScopeTargetMatch(row, context);
    if (
      row.detailStartLine !== null &&
      row.detailEndLine !== null &&
      row.detailStartLine > row.detailEndLine
    ) {
      context.addIssue({
        code: "custom",
        message: "detailStartLine must be less than or equal to detailEndLine",
        path: ["detailEndLine"],
      });
    }

    const requiredByKind: Record<typeof row.detailKind, string[]> = {
      path: ["detailPath"],
      symbol: ["detailSymbolName"],
      marker: ["detailMarker"],
      templateMarker: ["detailMarker"],
      diff: ["detailDiffBlockId"],
      graph: ["detailGraphNodeId"],
    };
    for (const field of requiredByKind[row.detailKind]) {
      if (row[field as keyof typeof row] === null) {
        context.addIssue({
          code: "custom",
          message: `${field} is required for ${row.detailKind} evidence`,
          path: [field],
        });
      }
    }

    const unexpectedByKind: Record<typeof row.detailKind, string[]> = {
      path: [
        "detailSymbolName",
        "detailMarker",
        "detailDiffBlockId",
        "detailSide",
        "detailStartLine",
        "detailEndLine",
        "detailGraphNodeId",
        "detailGraphNodeLabel",
      ],
      symbol: [
        "detailMarker",
        "detailDiffBlockId",
        "detailSide",
        "detailStartLine",
        "detailEndLine",
        "detailGraphNodeId",
        "detailGraphNodeLabel",
      ],
      marker: [
        "detailSymbolName",
        "detailDiffBlockId",
        "detailSide",
        "detailStartLine",
        "detailEndLine",
        "detailGraphNodeId",
        "detailGraphNodeLabel",
      ],
      templateMarker: [
        "detailSymbolName",
        "detailDiffBlockId",
        "detailSide",
        "detailStartLine",
        "detailEndLine",
        "detailGraphNodeId",
        "detailGraphNodeLabel",
      ],
      diff: ["detailPath", "detailSymbolName", "detailMarker", "detailGraphNodeId", "detailGraphNodeLabel"],
      graph: [
        "detailPath",
        "detailSymbolName",
        "detailMarker",
        "detailDiffBlockId",
        "detailSide",
        "detailStartLine",
        "detailEndLine",
      ],
    };
    for (const field of unexpectedByKind[row.detailKind]) {
      if (row[field as keyof typeof row] !== null) {
        context.addIssue({
          code: "custom",
          message: `${field} is not valid for ${row.detailKind} evidence`,
          path: [field],
        });
      }
    }
  })
  .describe("Stored row for the detector_evidence table.");

export const ThreadedCommentRowSchema = z
  .object({
    id: IdSchema.describe("Stored threaded comment row identifier."),
    scopeType: ReviewScopeTypeSchema.describe("Stored comment scope type."),
    versionId: nullableId.describe("Stored version target or null."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    diffBlockId: nullableId.describe("Stored diff block target or null."),
    anchorKind: z.enum(["scope", "diffBlock", "range"]).describe("Stored comment anchor kind."),
    anchorDiffBlockId: nullableId.describe("Stored anchored diff block identifier or null."),
    anchorFileId: nullableId.describe("Stored anchored file identifier or null."),
    anchorSide: DiffSideSchema.nullable().describe("Stored anchored diff side or null."),
    anchorStartLine: nullableLineNumber.describe("Stored anchor start line or null."),
    anchorEndLine: nullableLineNumber.describe("Stored anchor end line or null."),
    selectedText: nullableText.describe("Stored selected text or null."),
    threadId: IdSchema.describe("Stored thread identifier."),
    parentCommentId: nullableId.describe("Stored parent comment identifier or null."),
    bodyMarkdown: MarkdownStringSchema.describe("Stored comment body."),
    state: ThreadedCommentStateSchema.describe("Stored threaded comment state."),
    authorType: ActorKindSchema.describe("Stored author actor kind."),
    authorId: IdSchema.describe("Stored author identifier."),
    authorDisplayName: nullableText.describe("Stored author display name or null."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedAt: nullableTimestamp.describe("Stored update timestamp or null."),
    resolvedByType: ActorKindSchema.nullable().describe("Stored resolving actor kind or null."),
    resolvedById: nullableId.describe("Stored resolving actor identifier or null."),
    resolvedByDisplayName: nullableText.describe("Stored resolving actor display name or null."),
    resolvedAt: nullableTimestamp.describe("Stored resolution timestamp or null."),
  })
  .strict()
  .superRefine((row, context) => {
    requireScopeTargetMatch(row, context);
    if (row.anchorKind === "scope") {
      for (const field of [
        "anchorDiffBlockId",
        "anchorFileId",
        "anchorSide",
        "anchorStartLine",
        "anchorEndLine",
        "selectedText",
      ] as const) {
        if (row[field] !== null) {
          context.addIssue({
            code: "custom",
            message: `${field} must be null for scope anchors`,
            path: [field],
          });
        }
      }
    }
    if (row.anchorKind === "diffBlock" && row.anchorDiffBlockId === null) {
      context.addIssue({
        code: "custom",
        message: "diffBlock anchors require anchorDiffBlockId",
        path: ["anchorDiffBlockId"],
      });
    }
    if (row.anchorKind === "diffBlock" && row.selectedText !== null) {
      context.addIssue({
        code: "custom",
        message: "selectedText must be null for diffBlock anchors",
        path: ["selectedText"],
      });
    }
    if (row.anchorKind === "range") {
      for (const field of ["anchorFileId", "anchorSide", "anchorStartLine", "anchorEndLine"] as const) {
        if (row[field] === null) {
          context.addIssue({
            code: "custom",
            message: `${field} is required for range anchors`,
            path: [field],
          });
        }
      }
      if (
        row.anchorStartLine !== null &&
        row.anchorEndLine !== null &&
        row.anchorStartLine > row.anchorEndLine
      ) {
        context.addIssue({
          code: "custom",
          message: "anchorStartLine must be less than or equal to anchorEndLine",
          path: ["anchorEndLine"],
        });
      }
    }
    if (
      row.state === "open" &&
      (row.resolvedByType !== null || row.resolvedById !== null || row.resolvedAt !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: "open comments cannot include resolution fields",
        path: ["state"],
      });
    }
    if (
      row.state === "resolved" &&
      (row.resolvedByType === null || row.resolvedById === null || row.resolvedAt === null)
    ) {
      context.addIssue({
        code: "custom",
        message: "resolved comments require resolution fields",
        path: ["state"],
      });
    }
  })
  .describe("Stored row for the threaded_comments table.");

export const ReviewNoteRowSchema = z
  .object({
    id: IdSchema.describe("Stored review note row identifier."),
    scopeType: ReviewNoteScopeTypeSchema.describe("Stored review note scope type."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    diffBlockId: nullableId.describe("Stored diff block target or null."),
    bodyMarkdown: MarkdownStringSchema.describe("Stored review note body."),
    authorType: ActorKindSchema.describe("Stored author actor kind."),
    authorId: IdSchema.describe("Stored author identifier."),
    authorDisplayName: nullableText.describe("Stored author display name or null."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedAt: IsoDateTimeSchema.describe("Stored current body update timestamp."),
    deletedAt: nullableTimestamp.describe("Stored soft-delete timestamp or null."),
    deletedByType: ActorKindSchema.nullable().describe("Stored deleting actor kind or null."),
    deletedById: nullableId.describe("Stored deleting actor identifier or null."),
    deletedByDisplayName: nullableText.describe("Stored deleting actor display name or null."),
  })
  .strict()
  .superRefine((row, context) => {
    requireScopeTargetMatch(row, context);
    const hasDeleteFields = row.deletedAt !== null || row.deletedByType !== null || row.deletedById !== null;
    const hasCompleteDeleteFields =
      row.deletedAt !== null && row.deletedByType !== null && row.deletedById !== null;
    if (hasDeleteFields && !hasCompleteDeleteFields) {
      context.addIssue({
        code: "custom",
        message: "soft-deleted review note rows require deletedAt, deletedByType, and deletedById",
        path: ["deletedAt"],
      });
    }
  })
  .describe("Stored row for the review_notes table.");

export const ReviewNoteRevisionRowSchema = z
  .object({
    id: IdSchema.describe("Stored review note revision row identifier."),
    noteId: IdSchema.describe("Stored review note identifier."),
    actorType: ActorKindSchema.describe("Stored actor kind."),
    actorId: IdSchema.describe("Stored actor identifier."),
    actorDisplayName: nullableText.describe("Stored actor display name or null."),
    changedAt: IsoDateTimeSchema.describe("Stored revision timestamp."),
    action: ReviewNoteRevisionActionSchema.describe("Stored note lifecycle action."),
    bodyMarkdownBefore: nullableMarkdown.describe("Stored previous note body or null."),
    bodyMarkdownAfter: nullableMarkdown.describe("Stored new note body or null."),
  })
  .strict()
  .superRefine((row, context) => {
    if (row.action === "created" && row.bodyMarkdownBefore !== null) {
      context.addIssue({
        code: "custom",
        message: "created note revisions cannot include bodyMarkdownBefore",
        path: ["bodyMarkdownBefore"],
      });
    }
    if (row.action !== "deleted" && row.bodyMarkdownAfter === null) {
      context.addIssue({
        code: "custom",
        message: "created and updated note revisions require bodyMarkdownAfter",
        path: ["bodyMarkdownAfter"],
      });
    }
    if (row.action !== "created" && row.bodyMarkdownBefore === null) {
      context.addIssue({
        code: "custom",
        message: "updated and deleted note revisions require bodyMarkdownBefore",
        path: ["bodyMarkdownBefore"],
      });
    }
    if (row.action === "deleted" && row.bodyMarkdownAfter !== null) {
      context.addIssue({
        code: "custom",
        message: "deleted note revisions cannot include bodyMarkdownAfter",
        path: ["bodyMarkdownAfter"],
      });
    }
  })
  .describe("Stored row for the review_note_revisions table.");

export const ReviewPlanRowSchema = z
  .object({
    id: IdSchema.describe("Stored review plan row identifier."),
    scopeType: ReviewScopeTypeSchema.describe("Stored review plan scope type."),
    versionId: nullableId.describe("Stored version target or null."),
    commitId: nullableId.describe("Stored commit target or null."),
    fileId: nullableId.describe("Stored file target or null."),
    diffBlockId: nullableId.describe("Stored diff block target or null."),
    bodyMarkdown: MarkdownStringSchema.describe("Stored review plan body."),
    createdByType: ActorKindSchema.describe("Stored creator actor kind."),
    createdById: IdSchema.describe("Stored creator identifier."),
    createdByDisplayName: nullableText.describe("Stored creator display name or null."),
    createdAt: IsoDateTimeSchema.describe("Stored creation timestamp."),
    updatedByType: ActorKindSchema.nullable().describe("Stored updater actor kind or null."),
    updatedById: nullableId.describe("Stored updater identifier or null."),
    updatedByDisplayName: nullableText.describe("Stored updater display name or null."),
    updatedAt: nullableTimestamp.describe("Stored update timestamp or null."),
  })
  .strict()
  .superRefine((row, context) => requireScopeTargetMatch(row, context))
  .describe("Stored row for the review_plans table.");

export const ReviewLedgerRowSchema = z
  .object({
    id: IdSchema.describe("Stored review ledger row identifier."),
    versionId: IdSchema.describe("Stored completed review version identifier."),
    generatedById: IdSchema.describe("Stored human ledger generator identifier."),
    generatedByDisplayName: nullableText.describe("Stored human ledger generator display name or null."),
    generatedAt: IsoDateTimeSchema.describe("Stored ledger generation timestamp."),
    summary: nullableMarkdown.describe("Stored ledger summary or null."),
  })
  .strict()
  .describe("Stored row for the review_ledgers table.");

export const ReviewLedgerEntryRowSchema = z
  .object({
    id: IdSchema.describe("Stored review ledger entry row identifier."),
    ledgerId: IdSchema.describe("Stored review ledger identifier."),
    commitId: IdSchema.describe("Stored reviewed commit identifier."),
    upstreamSha: GitShaSchema.describe("Stored accepted upstream commit SHA."),
    finalMark: FinalReviewMarkSchema.describe("Stored final review mark."),
    requiredLocalChangeRefId: nullableId.describe(
      "Stored required local change reference for DONE entries, or null for PASS.",
    ),
    approvedById: IdSchema.describe("Stored approving human identifier."),
    approvedByDisplayName: nullableText.describe("Stored approving human display name or null."),
    approvedAt: IsoDateTimeSchema.describe("Stored approval timestamp."),
  })
  .strict()
  .superRefine((row, context) => {
    if (row.finalMark === "DONE" && row.requiredLocalChangeRefId === null) {
      context.addIssue({
        code: "custom",
        message: "DONE ledger rows require requiredLocalChangeRefId",
        path: ["requiredLocalChangeRefId"],
      });
    }
    if (row.finalMark === "PASS" && row.requiredLocalChangeRefId !== null) {
      context.addIssue({
        code: "custom",
        message: "PASS ledger rows cannot include requiredLocalChangeRefId",
        path: ["requiredLocalChangeRefId"],
      });
    }
  })
  .describe("Stored row for the review_ledger_entries table.");

export const ReviewLedgerEntryConcernAreaRowSchema = z
  .object({
    ledgerEntryId: IdSchema.describe("Stored ledger entry identifier."),
    concernAreaSlug: ConcernAreaSlugSchema.describe("Stored final concern area slug."),
    position: z.number().int().min(0).max(2).describe("Stored final concern area order."),
  })
  .strict()
  .describe("Stored row for the review_ledger_entry_concern_areas table.");

export const ReviewLedgerEntryLocalChangeRefRowSchema = z
  .object({
    ledgerEntryId: IdSchema.describe("Stored ledger entry identifier."),
    localChangeRefId: IdSchema.describe("Stored linked local change reference identifier."),
  })
  .strict()
  .describe("Stored row for the review_ledger_entry_local_change_refs table.");

export type ReviewVersionRow = z.infer<typeof ReviewVersionRowSchema>;
export type ReviewCommitRow = z.infer<typeof ReviewCommitRowSchema>;
export type ReviewFileRow = z.infer<typeof ReviewFileRowSchema>;
export type DiffBlockRow = z.infer<typeof DiffBlockRowSchema>;
export type ReviewEventRow = z.infer<typeof ReviewEventRowSchema>;
export type DetectorEvidenceRow = z.infer<typeof DetectorEvidenceRowSchema>;
export type ThreadedCommentRow = z.infer<typeof ThreadedCommentRowSchema>;
export type ReviewNoteRow = z.infer<typeof ReviewNoteRowSchema>;
export type ReviewNoteRevisionRow = z.infer<typeof ReviewNoteRevisionRowSchema>;
export type ReviewPlanRow = z.infer<typeof ReviewPlanRowSchema>;
export type ReviewLedgerRow = z.infer<typeof ReviewLedgerRowSchema>;
export type ReviewLedgerEntryRow = z.infer<typeof ReviewLedgerEntryRowSchema>;
export type ReviewLedgerEntryConcernAreaRow = z.infer<typeof ReviewLedgerEntryConcernAreaRowSchema>;
export type ReviewLedgerEntryLocalChangeRefRow = z.infer<typeof ReviewLedgerEntryLocalChangeRefRowSchema>;
