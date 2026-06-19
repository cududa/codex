import {
  AgentActorRefSchema,
  AgentReviewRecordedEventPayloadSchema,
  ConcernAreaSelectionSchema,
  MarkdownStringSchema,
  ReviewMarkSchema,
  type AgentActorRef,
  type ConcernAreaSelection,
  type ReviewMark,
  type ReviewVersionRead,
} from "@prompt-reviews/contracts";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { ReviewDatabase } from "../db/client.js";
import {
  agentReviewConcernAreas,
  agentReviews,
  reviewCommits,
  reviewEvents,
  reviewFiles,
} from "../db/schema/index.js";
import { notFound, stateConflict } from "./errors.js";
import type { ReviewReadStore } from "./read-store.js";

export type AgentReviewStore = {
  recordCommitAgentReview: (input: {
    commitId: string;
    actor: AgentActorRef;
    reviewedMark: ReviewMark;
    reviewedConcernAreas: ConcernAreaSelection;
    notesMarkdown: string | null;
  }) => Promise<ReviewVersionRead>;
  recordFileAgentReview: (input: {
    fileId: string;
    actor: AgentActorRef;
    reviewedMark: ReviewMark;
    notesMarkdown: string | null;
  }) => Promise<ReviewVersionRead>;
};

export function createAgentReviewStore(db: ReviewDatabase, readStore: ReviewReadStore): AgentReviewStore {
  return {
    async recordCommitAgentReview({ actor, commitId, reviewedMark, reviewedConcernAreas, notesMarkdown }) {
      const parsedActor = AgentActorRefSchema.parse(actor);
      const parsedReviewedMark = ReviewMarkSchema.parse(reviewedMark);
      const parsedConcernAreas = ConcernAreaSelectionSchema.parse(reviewedConcernAreas);
      const parsedNotesMarkdown = notesMarkdown === null ? null : MarkdownStringSchema.parse(notesMarkdown);

      const versionId = await db.transaction(async (tx) => {
        const commit = await findCommit(tx, commitId);
        const createdAt = new Date().toISOString();
        const agentReviewId = randomUUID();

        await tx.insert(agentReviews).values({
          id: agentReviewId,
          commitId: commit.id,
          fileId: null,
          reviewedMark: parsedReviewedMark,
          reviewerActorType: parsedActor.type,
          reviewerActorId: parsedActor.id,
          reviewerActorDisplayName: parsedActor.displayName ?? null,
          notesMarkdown: parsedNotesMarkdown,
          createdAt,
        });
        if (parsedConcernAreas.length > 0) {
          await tx.insert(agentReviewConcernAreas).values(
            parsedConcernAreas.map((concernAreaSlug, position) => ({
              agentReviewId,
              commitId: commit.id,
              concernAreaSlug,
              position,
            })),
          );
        }
        await tx.insert(reviewEvents).values({
          id: randomUUID(),
          scopeType: "commit",
          scopeId: commit.id,
          actorType: parsedActor.type,
          actorId: parsedActor.id,
          actorDisplayName: parsedActor.displayName ?? null,
          kind: "agent_review_recorded",
          summary: "Agent review evidence recorded for commit.",
          payloadJson: JSON.stringify(
            AgentReviewRecordedEventPayloadSchema.parse({
              agentReviewId,
              target: { type: "commit", id: commit.id },
              reviewedMark: parsedReviewedMark,
              reviewedConcernAreas: parsedConcernAreas,
            }),
          ),
          createdAt,
        });

        return commit.versionId;
      });

      return requireUpdatedVersion(readStore, versionId);
    },

    async recordFileAgentReview({ actor, fileId, reviewedMark, notesMarkdown }) {
      const parsedActor = AgentActorRefSchema.parse(actor);
      const parsedReviewedMark = ReviewMarkSchema.parse(reviewedMark);
      const parsedNotesMarkdown = notesMarkdown === null ? null : MarkdownStringSchema.parse(notesMarkdown);

      const versionId = await db.transaction(async (tx) => {
        const file = await findFile(tx, fileId);
        const commit = await findCommit(tx, file.commitId);
        const createdAt = new Date().toISOString();
        const agentReviewId = randomUUID();

        await tx.insert(agentReviews).values({
          id: agentReviewId,
          commitId: null,
          fileId: file.id,
          reviewedMark: parsedReviewedMark,
          reviewerActorType: parsedActor.type,
          reviewerActorId: parsedActor.id,
          reviewerActorDisplayName: parsedActor.displayName ?? null,
          notesMarkdown: parsedNotesMarkdown,
          createdAt,
        });
        await tx.insert(reviewEvents).values({
          id: randomUUID(),
          scopeType: "file",
          scopeId: file.id,
          actorType: parsedActor.type,
          actorId: parsedActor.id,
          actorDisplayName: parsedActor.displayName ?? null,
          kind: "agent_review_recorded",
          summary: "Agent review evidence recorded for file.",
          payloadJson: JSON.stringify(
            AgentReviewRecordedEventPayloadSchema.parse({
              agentReviewId,
              target: { type: "file", id: file.id },
              reviewedMark: parsedReviewedMark,
            }),
          ),
          createdAt,
        });

        return commit.versionId;
      });

      return requireUpdatedVersion(readStore, versionId);
    },
  };
}

type StoreTransaction = Parameters<Parameters<ReviewDatabase["transaction"]>[0]>[0];

async function findCommit(db: ReviewDatabase | StoreTransaction, commitId: string) {
  const [commit] = await db.select().from(reviewCommits).where(eq(reviewCommits.id, commitId)).limit(1);
  if (commit === undefined) {
    throw notFound(`Review commit not found: ${commitId}`);
  }
  return commit;
}

async function findFile(db: ReviewDatabase | StoreTransaction, fileId: string) {
  const [file] = await db.select().from(reviewFiles).where(eq(reviewFiles.id, fileId)).limit(1);
  if (file === undefined) {
    throw notFound(`Review file not found: ${fileId}`);
  }
  return file;
}

async function requireUpdatedVersion(
  readStore: ReviewReadStore,
  versionId: string,
): Promise<ReviewVersionRead> {
  const version = await readStore.getReviewVersion(versionId);
  if (version === null) {
    throw stateConflict(`Owning review version not found after agent review write: ${versionId}`);
  }
  return version;
}
