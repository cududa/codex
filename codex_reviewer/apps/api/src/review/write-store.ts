import {
  ConcernAreaSelectionSchema,
  ReviewEventTargetSchema,
  type ActorRef,
  type ConcernAreaSelection,
  type ExplicitFileReviewMark,
  type ReviewMark,
  type ReviewVersionRead,
} from "@prompt-reviews/contracts";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { ReviewDatabase } from "../db/client.js";
import { commitConcernAreas, reviewCommits, reviewEvents, reviewFiles } from "../db/schema/index.js";
import { notFound, stateConflict } from "./errors.js";
import type { ReviewReadStore } from "./read-store.js";

export type ReviewWriteStore = {
  setCommitReviewMark: (input: {
    commitId: string;
    reviewMark: ReviewMark;
    actor: ActorRef;
  }) => Promise<ReviewVersionRead>;
  setFileReviewMark: (input: {
    fileId: string;
    reviewMark: ExplicitFileReviewMark;
    actor: ActorRef;
  }) => Promise<ReviewVersionRead>;
  setCommitConcernAreas: (input: {
    commitId: string;
    concernAreas: ConcernAreaSelection;
    actor: ActorRef;
  }) => Promise<ReviewVersionRead>;
};

export function createReviewWriteStore(db: ReviewDatabase, readStore: ReviewReadStore): ReviewWriteStore {
  return {
    async setCommitReviewMark({ actor, commitId, reviewMark }) {
      const versionId = await db.transaction(async (tx) => {
        const commit = await findCommit(tx, commitId);

        if (commit.reviewMark === reviewMark) {
          return commit.versionId;
        }

        const updatedAt = new Date().toISOString();

        if (reviewMark === "PASS") {
          const blockingFiles = await tx
            .select({ id: reviewFiles.id })
            .from(reviewFiles)
            .where(
              and(eq(reviewFiles.commitId, commit.id), inArray(reviewFiles.reviewMark, ["FLAG", "MODIFY"])),
            )
            .limit(1);
          if (blockingFiles.length > 0) {
            throw stateConflict("Cannot mark a commit PASS while one of its files is FLAG or MODIFY.");
          }
        }

        await tx.update(reviewCommits).set({ reviewMark, updatedAt }).where(eq(reviewCommits.id, commit.id));
        await tx.insert(reviewEvents).values({
          id: randomUUID(),
          scopeType: "commit",
          scopeId: commit.id,
          actorType: actor.type,
          actorId: actor.id,
          actorDisplayName: actor.displayName ?? null,
          kind: "review_mark_changed",
          summary: `Commit review mark changed from ${commit.reviewMark} to ${reviewMark}.`,
          payloadJson: JSON.stringify({
            target: ReviewEventTargetSchema.parse({ type: "commit", id: commit.id }),
            previousReviewMark: commit.reviewMark,
            newReviewMark: reviewMark,
          }),
          createdAt: updatedAt,
        });

        return commit.versionId;
      });

      return requireUpdatedVersion(readStore, versionId);
    },

    async setFileReviewMark({ actor, fileId, reviewMark }) {
      const versionId = await db.transaction(async (tx) => {
        const file = await findFile(tx, fileId);
        const commit = await findCommit(tx, file.commitId);

        if (file.reviewMark === reviewMark) {
          return commit.versionId;
        }

        const updatedAt = new Date().toISOString();

        if (commit.reviewMark === "PASS" && (reviewMark === "FLAG" || reviewMark === "MODIFY")) {
          throw stateConflict("Cannot mark a file FLAG or MODIFY while its commit is PASS.");
        }

        await tx.update(reviewFiles).set({ reviewMark, updatedAt }).where(eq(reviewFiles.id, file.id));
        await tx.insert(reviewEvents).values({
          id: randomUUID(),
          scopeType: "file",
          scopeId: file.id,
          actorType: actor.type,
          actorId: actor.id,
          actorDisplayName: actor.displayName ?? null,
          kind: "review_mark_changed",
          summary: `File review mark changed from ${file.reviewMark ?? "null"} to ${reviewMark ?? "null"}.`,
          payloadJson: JSON.stringify({
            target: ReviewEventTargetSchema.parse({ type: "file", id: file.id }),
            previousReviewMark: file.reviewMark,
            newReviewMark: reviewMark,
          }),
          createdAt: updatedAt,
        });

        return commit.versionId;
      });

      return requireUpdatedVersion(readStore, versionId);
    },

    async setCommitConcernAreas({ actor, commitId, concernAreas }) {
      const parsedConcernAreas = ConcernAreaSelectionSchema.parse(concernAreas);
      const versionId = await db.transaction(async (tx) => {
        const commit = await findCommit(tx, commitId);
        const previousRows = await tx
          .select()
          .from(commitConcernAreas)
          .where(eq(commitConcernAreas.commitId, commit.id))
          .orderBy(asc(commitConcernAreas.position));
        const previousConcernAreas = previousRows.map((row) => row.concernAreaSlug);

        if (orderedConcernAreasEqual(previousConcernAreas, parsedConcernAreas)) {
          return commit.versionId;
        }

        const updatedAt = new Date().toISOString();

        await tx.delete(commitConcernAreas).where(eq(commitConcernAreas.commitId, commit.id));
        if (parsedConcernAreas.length > 0) {
          await tx.insert(commitConcernAreas).values(
            parsedConcernAreas.map((concernAreaSlug, position) => ({
              commitId: commit.id,
              concernAreaSlug,
              position,
            })),
          );
        }
        await tx.update(reviewCommits).set({ updatedAt }).where(eq(reviewCommits.id, commit.id));
        await tx.insert(reviewEvents).values({
          id: randomUUID(),
          scopeType: "commit",
          scopeId: commit.id,
          actorType: actor.type,
          actorId: actor.id,
          actorDisplayName: actor.displayName ?? null,
          kind: "concern_areas_changed",
          summary: "Commit concern areas changed.",
          payloadJson: JSON.stringify({
            target: ReviewEventTargetSchema.parse({ type: "commit", id: commit.id }),
            commitId: commit.id,
            previousConcernAreas,
            newConcernAreas: parsedConcernAreas,
          }),
          createdAt: updatedAt,
        });

        return commit.versionId;
      });

      return requireUpdatedVersion(readStore, versionId);
    },
  };
}

function orderedConcernAreasEqual(left: ConcernAreaSelection, right: ConcernAreaSelection): boolean {
  return left.length === right.length && left.every((slug, index) => slug === right[index]);
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
    throw stateConflict(`Owning review version not found after state write: ${versionId}`);
  }
  return version;
}
