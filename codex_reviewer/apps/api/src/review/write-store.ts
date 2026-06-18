import {
  AddReviewNoteCommandSchema,
  AddThreadedCommentCommandSchema,
  DeleteReviewNoteCommandSchema,
  GenerateReviewLedgerCommandSchema,
  LinkLocalChangeRefCommandSchema,
  RecordAgentReviewCommandSchema,
  RecordHumanApprovalCommandSchema,
  ResolveThreadedCommentCommandSchema,
  SetCommitConcernAreasCommandSchema,
  SetCommitReviewMarkCommandSchema,
  SetFileReviewMarkCommandSchema,
  UpdateReviewNoteCommandSchema,
  UpsertReviewPlanCommandSchema,
  type CommitOrFileScope,
  type LocalChangeRefCommandInput,
  type ReviewAnchor,
  type ReviewNoteScope,
  type ReviewScope,
} from "@prompt-reviews/contracts";
import { asc, eq } from "drizzle-orm";
import type { ReviewDatabase } from "../db/client.js";
import {
  agentCommitReviewConcernAreas,
  agentCommitReviews,
  agentFileReviews,
  commitConcernAreas,
  humanCommitApprovalConcernAreas,
  humanCommitApprovals,
  humanFileApprovals,
  localChangeRefs,
  reviewCommits,
  reviewEventNewConcernAreas,
  reviewEventPreviousConcernAreas,
  reviewEvents,
  reviewFiles,
  reviewLedgerEntries,
  reviewLedgerEntryConcernAreas,
  reviewLedgerEntryLocalChangeRefs,
  reviewLedgers,
  reviewNoteRevisions,
  reviewNotes,
  reviewPlans,
  threadedComments,
} from "../db/schema/index.js";

export type ReviewWriteStore = {
  setCommitReviewMark(input: unknown): Promise<void>;
  setFileReviewMark(input: unknown): Promise<void>;
  setCommitConcernAreas(input: unknown): Promise<void>;
  recordAgentReview(input: unknown): Promise<void>;
  recordHumanApproval(input: unknown): Promise<void>;
  linkLocalChangeRef(input: unknown): Promise<void>;
  addThreadedComment(input: unknown): Promise<void>;
  resolveThreadedComment(input: unknown): Promise<void>;
  addReviewNote(input: unknown): Promise<void>;
  updateReviewNote(input: unknown): Promise<void>;
  deleteReviewNote(input: unknown): Promise<void>;
  upsertReviewPlan(input: unknown): Promise<void>;
  generateReviewLedger(input: unknown): Promise<void>;
};

export function createReviewWriteStore(db: ReviewDatabase): ReviewWriteStore {
  return {
    async setCommitReviewMark(input) {
      const command = SetCommitReviewMarkCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingCommit] = await tx
          .select({ reviewMark: reviewCommits.reviewMark })
          .from(reviewCommits)
          .where(eq(reviewCommits.id, command.commitId))
          .limit(1);
        if (existingCommit === undefined) {
          throw new Error(`Review commit not found: ${command.commitId}`);
        }

        for (const localChangeRef of command.localChangeRefs) {
          await tx
            .insert(localChangeRefs)
            .values(
              localChangeRefRowForScope({ type: "commit", commitId: command.commitId }, localChangeRef),
            );
        }

        await tx
          .update(reviewCommits)
          .set({ reviewMark: command.reviewMark, updatedAt: command.occurredAt })
          .where(eq(reviewCommits.id, command.commitId));

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          scopeType: "commit",
          commitId: command.commitId,
          kind: "reviewMarkChanged",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: `Set commit review mark to ${command.reviewMark}.`,
          previousReviewMark: existingCommit.reviewMark,
          newReviewMark: command.reviewMark,
          createdAt: command.occurredAt,
        });
      });
    },

    async setFileReviewMark(input) {
      const command = SetFileReviewMarkCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingFile] = await tx
          .select({ reviewMark: reviewFiles.reviewMark })
          .from(reviewFiles)
          .where(eq(reviewFiles.id, command.fileId))
          .limit(1);
        if (existingFile === undefined) {
          throw new Error(`Review file not found: ${command.fileId}`);
        }

        for (const localChangeRef of command.localChangeRefs) {
          await tx
            .insert(localChangeRefs)
            .values(localChangeRefRowForScope({ type: "file", fileId: command.fileId }, localChangeRef));
        }

        await tx
          .update(reviewFiles)
          .set({ reviewMark: command.reviewMark, updatedAt: command.occurredAt })
          .where(eq(reviewFiles.id, command.fileId));

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          scopeType: "file",
          fileId: command.fileId,
          kind: "reviewMarkChanged",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: `Set file review mark to ${command.reviewMark}.`,
          previousReviewMark: existingFile.reviewMark,
          newReviewMark: command.reviewMark,
          createdAt: command.occurredAt,
        });
      });
    },

    async setCommitConcernAreas(input) {
      const command = SetCommitConcernAreasCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const previousConcernAreas = await tx
          .select({
            concernAreaSlug: commitConcernAreas.concernAreaSlug,
            position: commitConcernAreas.position,
          })
          .from(commitConcernAreas)
          .where(eq(commitConcernAreas.commitId, command.commitId))
          .orderBy(asc(commitConcernAreas.position));

        await tx.delete(commitConcernAreas).where(eq(commitConcernAreas.commitId, command.commitId));
        if (command.concernAreas.length > 0) {
          await tx.insert(commitConcernAreas).values(
            command.concernAreas.map((concernAreaSlug, position) => ({
              commitId: command.commitId,
              concernAreaSlug,
              position,
            })),
          );
        }

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          scopeType: "commit",
          commitId: command.commitId,
          kind: "concernAreasChanged",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: "Updated commit concern areas.",
          createdAt: command.occurredAt,
        });

        if (previousConcernAreas.length > 0) {
          await tx
            .insert(reviewEventPreviousConcernAreas)
            .values(previousConcernAreas.map((area) => ({ reviewEventId: command.eventId, ...area })));
        }
        if (command.concernAreas.length > 0) {
          await tx.insert(reviewEventNewConcernAreas).values(
            command.concernAreas.map((concernAreaSlug, position) => ({
              reviewEventId: command.eventId,
              concernAreaSlug,
              position,
            })),
          );
        }
      });
    },

    async recordAgentReview(input) {
      const command = RecordAgentReviewCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        if (command.scope.type === "commit") {
          await tx.insert(agentCommitReviews).values({
            id: command.reviewId,
            commitId: command.scope.commitId,
            reviewedMark: command.reviewedMark,
            notes: command.notes,
            reviewerId: command.actor.id,
            reviewerDisplayName: command.actor.displayName,
            reviewedAt: command.occurredAt,
          });
          const reviewedConcernAreas = command.reviewedConcernAreas ?? [];
          if (reviewedConcernAreas.length > 0) {
            await tx.insert(agentCommitReviewConcernAreas).values(
              reviewedConcernAreas.map((concernAreaSlug, position) => ({
                agentReviewId: command.reviewId,
                concernAreaSlug,
                position,
              })),
            );
          }
        } else {
          await tx.insert(agentFileReviews).values({
            id: command.reviewId,
            fileId: command.scope.fileId,
            reviewedMark: command.reviewedMark,
            notes: command.notes,
            reviewerId: command.actor.id,
            reviewerDisplayName: command.actor.displayName,
            reviewedAt: command.occurredAt,
          });
        }

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          ...eventScopeColumns(command.scope),
          kind: "agentReviewRecorded",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: "Recorded agent review.",
          agentReviewId: command.reviewId,
          createdAt: command.occurredAt,
        });
      });
    },

    async recordHumanApproval(input) {
      const command = RecordHumanApprovalCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        for (const localChangeRef of command.localChangeRefs) {
          await tx.insert(localChangeRefs).values(localChangeRefRowForScope(command.scope, localChangeRef));
        }

        if (command.scope.type === "commit") {
          await tx.insert(humanCommitApprovals).values({
            id: command.approvalId,
            commitId: command.scope.commitId,
            approvedMark: command.approvedMark,
            notes: command.notes,
            approvedById: command.actor.id,
            approvedByDisplayName: command.actor.displayName,
            approvedAt: command.occurredAt,
          });
          const approvedConcernAreas = command.approvedConcernAreas ?? [];
          if (approvedConcernAreas.length > 0) {
            await tx.insert(humanCommitApprovalConcernAreas).values(
              approvedConcernAreas.map((concernAreaSlug, position) => ({
                humanApprovalId: command.approvalId,
                concernAreaSlug,
                position,
              })),
            );
          }
        } else {
          await tx.insert(humanFileApprovals).values({
            id: command.approvalId,
            fileId: command.scope.fileId,
            approvedMark: command.approvedMark,
            notes: command.notes,
            approvedById: command.actor.id,
            approvedByDisplayName: command.actor.displayName,
            approvedAt: command.occurredAt,
          });
        }

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          ...eventScopeColumns(command.scope),
          kind: "humanApprovalRecorded",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: "Recorded human approval.",
          humanApprovalId: command.approvalId,
          approvedMark: command.approvedMark,
          createdAt: command.occurredAt,
        });
      });
    },

    async linkLocalChangeRef(input) {
      const command = LinkLocalChangeRefCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        await tx
          .insert(localChangeRefs)
          .values(localChangeRefRowForScope(command.scope, command.localChangeRef));
        await tx.insert(reviewEvents).values({
          id: command.eventId,
          ...eventScopeColumns(command.scope),
          kind: "localChangeLinked",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: "Linked local change evidence.",
          localChangeRefId: command.localChangeRef.id,
          localChangeSha: command.localChangeRef.sha,
          createdAt: command.occurredAt,
        });
      });
    },

    async addThreadedComment(input) {
      const command = AddThreadedCommentCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        await tx.insert(threadedComments).values({
          id: command.commentId,
          ...scopeTargetColumns(command.scope),
          ...anchorColumns(command.anchor),
          threadId: command.threadId,
          parentCommentId: command.parentCommentId,
          bodyMarkdown: command.bodyMarkdown,
          state: "open",
          authorType: command.actor.type,
          authorId: command.actor.id,
          authorDisplayName: command.actor.displayName,
          createdAt: command.occurredAt,
        });
      });
    },

    async resolveThreadedComment(input) {
      const command = ResolveThreadedCommentCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingComment] = await tx
          .select({ state: threadedComments.state })
          .from(threadedComments)
          .where(eq(threadedComments.id, command.commentId))
          .limit(1);
        if (existingComment === undefined) {
          throw new Error(`Threaded comment not found: ${command.commentId}`);
        }
        if (existingComment.state === "resolved") {
          throw new Error(`Threaded comment already resolved: ${command.commentId}`);
        }

        await tx
          .update(threadedComments)
          .set({
            state: "resolved",
            resolvedByType: command.actor.type,
            resolvedById: command.actor.id,
            resolvedByDisplayName: command.actor.displayName,
            resolvedAt: command.occurredAt,
          })
          .where(eq(threadedComments.id, command.commentId));

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          ...scopeTargetColumns(command.scope),
          kind: "commentResolved",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: "Resolved threaded comment.",
          commentId: command.commentId,
          threadId: command.threadId,
          createdAt: command.occurredAt,
        });
      });
    },

    async addReviewNote(input) {
      const command = AddReviewNoteCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        await tx.insert(reviewNotes).values({
          id: command.noteId,
          ...reviewNoteScopeColumns(command.scope),
          bodyMarkdown: command.bodyMarkdown,
          authorType: command.actor.type,
          authorId: command.actor.id,
          authorDisplayName: command.actor.displayName,
          createdAt: command.occurredAt,
          updatedAt: command.occurredAt,
        });
        await tx.insert(reviewNoteRevisions).values({
          id: command.commandId,
          noteId: command.noteId,
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          changedAt: command.occurredAt,
          changeKind: "created",
          bodyMarkdownBefore: null,
          bodyMarkdownAfter: command.bodyMarkdown,
        });
      });
    },

    async updateReviewNote(input) {
      const command = UpdateReviewNoteCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingNote] = await tx
          .select({
            bodyMarkdown: reviewNotes.bodyMarkdown,
            deletedAt: reviewNotes.deletedAt,
          })
          .from(reviewNotes)
          .where(eq(reviewNotes.id, command.noteId))
          .limit(1);
        if (existingNote === undefined) {
          throw new Error(`Review note not found: ${command.noteId}`);
        }
        if (existingNote.deletedAt !== null) {
          throw new Error(`Deleted review note cannot be updated: ${command.noteId}`);
        }

        await tx
          .update(reviewNotes)
          .set({ bodyMarkdown: command.bodyMarkdown, updatedAt: command.occurredAt })
          .where(eq(reviewNotes.id, command.noteId));
        await tx.insert(reviewNoteRevisions).values({
          id: command.commandId,
          noteId: command.noteId,
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          changedAt: command.occurredAt,
          changeKind: "updated",
          bodyMarkdownBefore: existingNote.bodyMarkdown,
          bodyMarkdownAfter: command.bodyMarkdown,
        });
      });
    },

    async deleteReviewNote(input) {
      const command = DeleteReviewNoteCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingNote] = await tx
          .select({
            bodyMarkdown: reviewNotes.bodyMarkdown,
            deletedAt: reviewNotes.deletedAt,
          })
          .from(reviewNotes)
          .where(eq(reviewNotes.id, command.noteId))
          .limit(1);
        if (existingNote === undefined) {
          throw new Error(`Review note not found: ${command.noteId}`);
        }
        if (existingNote.deletedAt !== null) {
          throw new Error(`Review note already deleted: ${command.noteId}`);
        }

        await tx
          .update(reviewNotes)
          .set({
            deletedAt: command.occurredAt,
            deletedByType: command.actor.type,
            deletedById: command.actor.id,
            deletedByDisplayName: command.actor.displayName,
          })
          .where(eq(reviewNotes.id, command.noteId));
        await tx.insert(reviewNoteRevisions).values({
          id: command.commandId,
          noteId: command.noteId,
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          changedAt: command.occurredAt,
          changeKind: "deleted",
          bodyMarkdownBefore: existingNote.bodyMarkdown,
          bodyMarkdownAfter: null,
        });
      });
    },

    async upsertReviewPlan(input) {
      const command = UpsertReviewPlanCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        const [existingPlan] = await tx
          .select({ id: reviewPlans.id })
          .from(reviewPlans)
          .where(eq(reviewPlans.id, command.reviewPlanId))
          .limit(1);

        if (existingPlan === undefined) {
          await tx.insert(reviewPlans).values({
            id: command.reviewPlanId,
            ...scopeTargetColumns(command.scope),
            bodyMarkdown: command.bodyMarkdown,
            createdByType: command.actor.type,
            createdById: command.actor.id,
            createdByDisplayName: command.actor.displayName,
            createdAt: command.occurredAt,
          });
        } else {
          await tx
            .update(reviewPlans)
            .set({
              bodyMarkdown: command.bodyMarkdown,
              updatedByType: command.actor.type,
              updatedById: command.actor.id,
              updatedByDisplayName: command.actor.displayName,
              updatedAt: command.occurredAt,
            })
            .where(eq(reviewPlans.id, command.reviewPlanId));
        }

        await tx.insert(reviewEvents).values({
          id: command.eventId,
          ...scopeTargetColumns(command.scope),
          kind: "planUpdated",
          actorType: command.actor.type,
          actorId: command.actor.id,
          actorDisplayName: command.actor.displayName,
          summary: existingPlan === undefined ? "Created review plan." : "Updated review plan.",
          reviewPlanId: command.reviewPlanId,
          createdAt: command.occurredAt,
        });
      });
    },

    async generateReviewLedger(input) {
      const command = GenerateReviewLedgerCommandSchema.parse(input);

      await db.transaction(async (tx) => {
        await tx.insert(reviewLedgers).values({
          id: command.ledgerId,
          versionId: command.versionId,
          generatedById: command.actor.id,
          generatedByDisplayName: command.actor.displayName,
          generatedAt: command.occurredAt,
          summary: command.summary,
        });

        for (const entry of command.entries) {
          await tx.insert(reviewLedgerEntries).values({
            id: entry.ledgerEntryId,
            ledgerId: command.ledgerId,
            commitId: entry.commitId,
            upstreamSha: entry.upstreamSha,
            finalMark: entry.finalMark,
            requiredLocalChangeRefId: entry.finalMark === "DONE" ? entry.localChangeRefIds[0] : null,
            approvedById: entry.approvedBy.id,
            approvedByDisplayName: entry.approvedBy.displayName,
            approvedAt: entry.approvedAt,
          });

          if (entry.concernAreas.length > 0) {
            await tx.insert(reviewLedgerEntryConcernAreas).values(
              entry.concernAreas.map((concernAreaSlug, position) => ({
                ledgerEntryId: entry.ledgerEntryId,
                concernAreaSlug,
                position,
              })),
            );
          }
          if (entry.localChangeRefIds.length > 0) {
            await tx.insert(reviewLedgerEntryLocalChangeRefs).values(
              entry.localChangeRefIds.map((localChangeRefId) => ({
                ledgerEntryId: entry.ledgerEntryId,
                localChangeRefId,
              })),
            );
          }
        }
      });
    },
  };
}

function eventScopeColumns(
  scope: CommitOrFileScope,
): { scopeType: "commit"; commitId: string } | { scopeType: "file"; fileId: string } {
  if (scope.type === "commit") {
    return { scopeType: "commit", commitId: scope.commitId };
  }

  return { scopeType: "file", fileId: scope.fileId };
}

function localChangeRefRowForScope(scope: CommitOrFileScope, localChangeRef: LocalChangeRefCommandInput) {
  return {
    id: localChangeRef.id,
    commitId: scope.type === "commit" ? scope.commitId : null,
    fileId: scope.type === "file" ? scope.fileId : null,
    sha: localChangeRef.sha,
    title: localChangeRef.title ?? null,
    summary: localChangeRef.summary ?? null,
    linkedByType: localChangeRef.linkedBy.type,
    linkedById: localChangeRef.linkedBy.id,
    linkedByDisplayName: localChangeRef.linkedBy.displayName ?? null,
    linkedAt: localChangeRef.linkedAt,
  };
}

function scopeTargetColumns(scope: ReviewScope) {
  return {
    scopeType: scope.type,
    versionId: scope.type === "version" ? scope.versionId : null,
    commitId: scope.type === "commit" ? scope.commitId : null,
    fileId: scope.type === "file" ? scope.fileId : null,
    diffBlockId: scope.type === "diffBlock" ? scope.diffBlockId : null,
  };
}

function reviewNoteScopeColumns(scope: ReviewNoteScope) {
  return {
    scopeType: scope.type,
    commitId: scope.type === "commit" ? scope.commitId : null,
    fileId: scope.type === "file" ? scope.fileId : null,
    diffBlockId: scope.type === "diffBlock" ? scope.diffBlockId : null,
  };
}

function anchorColumns(anchor: ReviewAnchor) {
  if (anchor.kind === "scope") {
    return {
      anchorKind: "scope" as const,
      anchorDiffBlockId: null,
      anchorFileId: null,
      anchorSide: null,
      anchorStartLine: null,
      anchorEndLine: null,
      selectedText: null,
    };
  }

  if (anchor.kind === "diffBlock") {
    return {
      anchorKind: "diffBlock" as const,
      anchorDiffBlockId: anchor.diffBlockId,
      anchorFileId: null,
      anchorSide: null,
      anchorStartLine: null,
      anchorEndLine: null,
      selectedText: null,
    };
  }

  return {
    anchorKind: "range" as const,
    anchorDiffBlockId: null,
    anchorFileId: anchor.fileId,
    anchorSide: anchor.side,
    anchorStartLine: anchor.startLine,
    anchorEndLine: anchor.endLine,
    selectedText: anchor.selectedText ?? null,
  };
}
