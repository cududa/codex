import { agentReviewConcernAreas, agentReviews, reviewCommits, reviewFiles } from "../db/schema/index.js";
import { createApiApp } from "../server/app.js";
import { expectNotFoundError, expectValidationError } from "../test-support/http.js";
import { seedReviewSpine } from "../test-support/review-spine.js";
import { createTestRuntime } from "../test-support/runtime.js";
import { reviewTestActors, reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";

describe("review agent review routes", () => {
  it("records commit and file agent review evidence through dedicated routes", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const commitResponse = await app.request(`/api/review/commits/${reviewTestIds.commit}/agent-reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.agent,
        reviewedMark: "MODIFY",
        reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
        notesMarkdown: "The evidence challenges the current mark.",
      }),
    });
    const fileResponse = await app.request(`/api/review/files/${reviewTestIds.file}/agent-reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        notesMarkdown: null,
      }),
    });

    expect(commitResponse.status).toBe(200);
    expect(await commitResponse.json()).toMatchObject({
      version: {
        commits: [
          {
            id: reviewTestIds.commit,
            reviewMark: "FLAG",
            concernAreas: [reviewTestConcernAreas.primary],
            agentReviews: [
              {
                reviewedMark: "MODIFY",
                reviewedConcernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
                notesMarkdown: "The evidence challenges the current mark.",
              },
            ],
          },
        ],
      },
    });
    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.json()).toMatchObject({
      version: {
        commits: [
          {
            files: [
              {
                id: reviewTestIds.file,
                reviewMark: null,
                agentReviews: [{ reviewedMark: "PASS", notesMarkdown: null }],
              },
            ],
          },
        ],
      },
    });
    await expect(connection.db.select().from(agentReviews)).resolves.toHaveLength(2);
    await expect(connection.db.select().from(agentReviewConcernAreas)).resolves.toHaveLength(2);
    await expect(connection.db.select().from(reviewCommits)).resolves.toMatchObject([
      { id: reviewTestIds.commit, reviewMark: "FLAG" },
    ]);
    await expect(connection.db.select().from(reviewFiles)).resolves.toMatchObject([
      { id: reviewTestIds.file, reviewMark: null },
    ]);
  });

  it("rejects invalid agent review route payloads", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const humanActorResponse = await app.request(
      `/api/review/commits/${reviewTestIds.commit}/agent-reviews`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor: reviewTestActors.human,
          reviewedMark: "PASS",
          reviewedConcernAreas: [],
          notesMarkdown: null,
        }),
      },
    );
    const fileConcernResponse = await app.request(`/api/review/files/${reviewTestIds.file}/agent-reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        reviewedConcernAreas: [reviewTestConcernAreas.alternate],
        notesMarkdown: null,
      }),
    });
    const missingResponse = await app.request("/api/review/commits/missing/agent-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.agent,
        reviewedMark: "PASS",
        reviewedConcernAreas: [],
        notesMarkdown: null,
      }),
    });

    await expectValidationError(humanActorResponse);
    await expectValidationError(fileConcernResponse);
    await expectNotFoundError(missingResponse);
    await expect(connection.db.select().from(agentReviews)).resolves.toEqual([]);
  });
});
