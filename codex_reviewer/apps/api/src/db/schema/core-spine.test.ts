import {
  diffBlockFixture,
  reviewCommitFixture,
  reviewFileFixture,
  reviewTestConcernAreas,
  reviewTestIds,
  reviewTestNow,
  reviewVersionFixture,
} from "@prompt-reviews/review-test-support";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestDatabases, migratedTestConnection } from "../../test-support/db.js";
import { seedReviewSpineWithTwoConcernAreas } from "../../test-support/review-spine.js";
import { commitConcernAreas, diffBlocks, reviewCommits, reviewFiles, reviewVersions } from "./index.js";

afterEach(cleanupTestDatabases);

describe("review spine persistence schema", () => {
  it("stores review versions, commits, files, ordered concern areas, and diff blocks directly", async () => {
    const connection = await migratedTestConnection();
    await seedReviewSpineWithTwoConcernAreas(connection);

    await expect(connection.db.select().from(reviewVersions)).resolves.toEqual([reviewVersionFixture()]);
    await expect(connection.db.select().from(reviewCommits)).resolves.toEqual([reviewCommitFixture()]);
    await expect(connection.db.select().from(commitConcernAreas)).resolves.toEqual([
      {
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.primary,
        position: 0,
      },
      {
        commitId: reviewTestIds.commit,
        concernAreaSlug: reviewTestConcernAreas.secondary,
        position: 1,
      },
    ]);
    await expect(connection.db.select().from(reviewFiles)).resolves.toEqual([reviewFileFixture()]);
    await expect(connection.db.select().from(diffBlocks)).resolves.toEqual([diffBlockFixture()]);
  });

  it("rejects review marks outside PASS, FLAG, and MODIFY", async () => {
    const connection = await migratedTestConnection();

    await connection.db.insert(reviewVersions).values(reviewVersionFixture());
    await expect(
      connection.client.execute({
        sql: `
          INSERT INTO review_commits
            (id, version_id, sha, position, title, review_mark, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `,
        args: ["commit-bad-mark", reviewTestIds.version, "abcdef2", 1, "Bad mark", "DONE", reviewTestNow],
      }),
    ).rejects.toThrow();
  });
});
