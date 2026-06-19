import { reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";
import { seedReviewSpine } from "../test-support/review-spine.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("review read routes", () => {
  it("serves persisted review versions through the read API", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      versions: [
        {
          id: reviewTestIds.version,
          commitCount: 1,
          commits: [
            {
              id: reviewTestIds.commit,
              reviewMark: "FLAG",
              concernAreas: [reviewTestConcernAreas.primary],
              agentReviews: [],
              files: [
                {
                  id: reviewTestIds.file,
                  reviewMark: null,
                  agentReviews: [],
                  diffBlocks: [{ id: reviewTestIds.diffBlock }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("returns one persisted review version by id", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const response = await app.request(`/api/review/versions/${reviewTestIds.version}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      version: {
        id: reviewTestIds.version,
        commits: [{ id: reviewTestIds.commit, files: [{ id: reviewTestIds.file }] }],
      },
    });
  });
});
