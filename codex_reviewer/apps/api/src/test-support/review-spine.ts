import {
  diffBlockFixture,
  reviewCommitFixture,
  reviewFileFixture,
  reviewTestConcernAreas,
  reviewVersionFixture,
} from "@prompt-reviews/review-test-support";
import type { ReviewDatabaseConnection } from "../db/client.js";
import {
  commitConcernAreas,
  diffBlocks,
  reviewCommits,
  reviewFiles,
  reviewVersions,
} from "../db/schema/index.js";

export async function seedReviewSpine(connection: ReviewDatabaseConnection): Promise<void> {
  await connection.db.insert(reviewVersions).values(reviewVersionFixture());
  await connection.db.insert(reviewCommits).values(reviewCommitFixture());
  await connection.db.insert(commitConcernAreas).values({
    commitId: reviewCommitFixture().id,
    concernAreaSlug: reviewTestConcernAreas.primary,
    position: 0,
  });
  await connection.db.insert(reviewFiles).values(reviewFileFixture());
  await connection.db.insert(diffBlocks).values(diffBlockFixture());
}

export async function seedReviewSpineWithTwoConcernAreas(
  connection: ReviewDatabaseConnection,
): Promise<void> {
  await connection.db.insert(reviewVersions).values(reviewVersionFixture());
  await connection.db.insert(reviewCommits).values(reviewCommitFixture());
  await connection.db.insert(commitConcernAreas).values([
    {
      commitId: reviewCommitFixture().id,
      concernAreaSlug: reviewTestConcernAreas.primary,
      position: 0,
    },
    {
      commitId: reviewCommitFixture().id,
      concernAreaSlug: reviewTestConcernAreas.secondary,
      position: 1,
    },
  ]);
  await connection.db.insert(reviewFiles).values(reviewFileFixture());
  await connection.db.insert(diffBlocks).values(diffBlockFixture());
}
