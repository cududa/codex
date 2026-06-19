import { reviewTestActors, reviewTestConcernAreas, reviewTestIds } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";
import { expectNotFoundError, expectValidationError } from "../test-support/http.js";
import { seedReviewSpine } from "../test-support/review-spine.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("review state write routes", () => {
  it("persists commit review mark writes and returns the updated review version", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const response = await app.request(`/api/review/commits/${reviewTestIds.commit}/review-mark`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.human,
        reviewMark: "PASS",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      version: {
        id: reviewTestIds.version,
        commits: [{ id: reviewTestIds.commit, reviewMark: "PASS" }],
      },
    });
  });

  it("persists file review mark writes and concern-area writes through canonical routes", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const fileResponse = await app.request(`/api/review/files/${reviewTestIds.file}/review-mark`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        reviewMark: "MODIFY",
      }),
    });
    const concernResponse = await app.request(`/api/review/commits/${reviewTestIds.commit}/concern-areas`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: { type: "human", id: "human-1" },
        concernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
      }),
    });

    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.json()).toMatchObject({
      version: {
        commits: [{ files: [{ id: reviewTestIds.file, reviewMark: "MODIFY" }] }],
      },
    });
    expect(concernResponse.status).toBe(200);
    expect(await concernResponse.json()).toMatchObject({
      version: {
        commits: [
          {
            id: reviewTestIds.commit,
            concernAreas: [reviewTestConcernAreas.alternate, reviewTestConcernAreas.followUp],
          },
        ],
      },
    });
  });

  it("rejects invalid write payloads with contract-shaped validation errors", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const response = await app.request(`/api/review/commits/${reviewTestIds.commit}/review-mark`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.human,
        reviewMark: "INVALID_REVIEW_MARK",
      }),
    });

    await expectValidationError(response);
  });

  it("maps missing review records and workflow conflicts to contract-shaped errors", async () => {
    const { connection, dependencies } = await createTestRuntime();
    await seedReviewSpine(connection);
    const app = createApiApp(dependencies);

    const missingResponse = await app.request("/api/review/files/missing/review-mark", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.human,
        reviewMark: "FLAG",
      }),
    });
    await app.request(`/api/review/files/${reviewTestIds.file}/review-mark`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.human,
        reviewMark: "FLAG",
      }),
    });
    const conflictResponse = await app.request(`/api/review/commits/${reviewTestIds.commit}/review-mark`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor: reviewTestActors.human,
        reviewMark: "PASS",
      }),
    });

    await expectNotFoundError(missingResponse);
    expect(conflictResponse.status).toBe(409);
    expect(await conflictResponse.json()).toMatchObject({
      error: { code: "state_conflict" },
    });
  });
});
