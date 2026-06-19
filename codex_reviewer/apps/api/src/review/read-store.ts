import { ReviewVersionResponseSchema, ReviewVersionsResponseSchema } from "@prompt-reviews/contracts";
import type { ReviewVersionRead } from "@prompt-reviews/contracts";
import { asc, desc, eq, inArray, or } from "drizzle-orm";
import type { ReviewDatabase } from "../db/client.js";
import {
  agentReviewConcernAreas,
  agentReviews,
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewFiles,
  reviewVersions,
} from "../db/schema/index.js";

export type ReviewReadStore = {
  listReviewVersions: () => Promise<ReviewVersionRead[]>;
  getReviewVersion: (versionId: string) => Promise<ReviewVersionRead | null>;
};

export function createReviewReadStore(db: ReviewDatabase): ReviewReadStore {
  return {
    async listReviewVersions() {
      const versions = await db.select().from(reviewVersions).orderBy(desc(reviewVersions.createdAt));
      return composeVersions(db, versions);
    },

    async getReviewVersion(versionId) {
      const rows = await db.select().from(reviewVersions).where(eq(reviewVersions.id, versionId)).limit(1);
      const [version] = await composeVersions(db, rows);
      return ReviewVersionResponseSchema.parse({ version: version ?? null }).version;
    },
  };
}

type ReviewVersionRow = typeof reviewVersions.$inferSelect;

async function composeVersions(
  db: ReviewDatabase,
  versionRows: ReviewVersionRow[],
): Promise<ReviewVersionRead[]> {
  if (versionRows.length === 0) {
    return ReviewVersionsResponseSchema.parse({ versions: [] }).versions;
  }

  const versionIds = versionRows.map((version) => version.id);
  const commitRows = await db
    .select()
    .from(reviewCommits)
    .where(inArray(reviewCommits.versionId, versionIds))
    .orderBy(asc(reviewCommits.versionId), asc(reviewCommits.position));
  const commitIds = commitRows.map((commit) => commit.id);

  const concernRows =
    commitIds.length === 0
      ? []
      : await db
          .select()
          .from(commitConcernAreas)
          .where(inArray(commitConcernAreas.commitId, commitIds))
          .orderBy(asc(commitConcernAreas.commitId), asc(commitConcernAreas.position));
  const concernsByCommitId = groupBy(concernRows, (concern) => concern.commitId);

  const fileRows =
    commitIds.length === 0
      ? []
      : await db
          .select()
          .from(reviewFiles)
          .where(inArray(reviewFiles.commitId, commitIds))
          .orderBy(asc(reviewFiles.commitId), asc(reviewFiles.position));
  const fileIds = fileRows.map((file) => file.id);

  const agentReviewRows =
    commitIds.length === 0 && fileIds.length === 0
      ? []
      : await db
          .select()
          .from(agentReviews)
          .where(
            commitIds.length === 0
              ? inArray(agentReviews.fileId, fileIds)
              : fileIds.length === 0
                ? inArray(agentReviews.commitId, commitIds)
                : or(inArray(agentReviews.commitId, commitIds), inArray(agentReviews.fileId, fileIds)),
          )
          .orderBy(asc(agentReviews.createdAt), asc(agentReviews.id));
  const agentReviewIds = agentReviewRows.map((review) => review.id);
  const agentConcernRows =
    agentReviewIds.length === 0
      ? []
      : await db
          .select()
          .from(agentReviewConcernAreas)
          .where(inArray(agentReviewConcernAreas.agentReviewId, agentReviewIds))
          .orderBy(asc(agentReviewConcernAreas.agentReviewId), asc(agentReviewConcernAreas.position));
  const agentConcernsByReviewId = groupBy(agentConcernRows, (area) => area.agentReviewId);
  const agentReviewsByCommitId = groupBy(
    agentReviewRows.filter((review) => review.commitId !== null),
    (review) => review.commitId ?? "",
  );
  const agentReviewsByFileId = groupBy(
    agentReviewRows.filter((review) => review.fileId !== null),
    (review) => review.fileId ?? "",
  );

  const diffRows =
    fileIds.length === 0
      ? []
      : await db
          .select()
          .from(diffBlocks)
          .where(inArray(diffBlocks.fileId, fileIds))
          .orderBy(asc(diffBlocks.fileId), asc(diffBlocks.position));
  const diffsByFileId = groupBy(diffRows, (diff) => diff.fileId);
  const filesByCommitId = groupBy(fileRows, (file) => file.commitId);
  const commitsByVersionId = groupBy(commitRows, (commit) => commit.versionId);

  return ReviewVersionsResponseSchema.parse({
    versions: versionRows.map((version) => {
      const versionCommits = commitsByVersionId.get(version.id) ?? [];
      return {
        id: version.id,
        label: version.label,
        repositoryId: version.repositoryId,
        baseRef: version.baseRef,
        targetRef: version.targetRef,
        baseSha: version.baseSha,
        targetSha: version.targetSha,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
        commitCount: versionCommits.length,
        commits: versionCommits.map((commit) => ({
          id: commit.id,
          versionId: commit.versionId,
          sha: commit.sha,
          position: commit.position,
          title: commit.title,
          message: commit.message,
          authorName: commit.authorName,
          committedAt: commit.committedAt,
          reviewMark: commit.reviewMark,
          concernAreas: (concernsByCommitId.get(commit.id) ?? []).map((area) => area.concernAreaSlug),
          createdAt: commit.createdAt,
          updatedAt: commit.updatedAt,
          agentReviews: (agentReviewsByCommitId.get(commit.id) ?? []).map((review) => ({
            id: review.id,
            commitId: commit.id,
            reviewedMark: review.reviewedMark,
            reviewedConcernAreas: (agentConcernsByReviewId.get(review.id) ?? []).map(
              (area) => area.concernAreaSlug,
            ),
            notesMarkdown: review.notesMarkdown,
            reviewer: {
              type: review.reviewerActorType,
              id: review.reviewerActorId,
              displayName: review.reviewerActorDisplayName ?? undefined,
            },
            createdAt: review.createdAt,
          })),
          files: (filesByCommitId.get(commit.id) ?? []).map((file) => ({
            id: file.id,
            commitId: file.commitId,
            position: file.position,
            path: file.path,
            oldPath: file.oldPath,
            changeKind: file.changeKind,
            reviewMark: file.reviewMark,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            agentReviews: (agentReviewsByFileId.get(file.id) ?? []).map((review) => ({
              id: review.id,
              fileId: file.id,
              reviewedMark: review.reviewedMark,
              notesMarkdown: review.notesMarkdown,
              reviewer: {
                type: review.reviewerActorType,
                id: review.reviewerActorId,
                displayName: review.reviewerActorDisplayName ?? undefined,
              },
              createdAt: review.createdAt,
            })),
            diffBlocks: (diffsByFileId.get(file.id) ?? []).map((diff) => ({
              id: diff.id,
              fileId: diff.fileId,
              position: diff.position,
              heading: diff.heading,
              oldStartLine: diff.oldStartLine,
              oldEndLine: diff.oldEndLine,
              newStartLine: diff.newStartLine,
              newEndLine: diff.newEndLine,
              patch: diff.patch,
            })),
          })),
        })),
      };
    }),
  }).versions;
}

function groupBy<T>(values: T[], keyFor: (value: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const key = keyFor(value);
    const group = grouped.get(key);
    if (group === undefined) {
      grouped.set(key, [value]);
    } else {
      group.push(value);
    }
  }
  return grouped;
}
