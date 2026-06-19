import { deterministicConcernMapVersion } from "../review/ingest-service.js";
import { createApiApp } from "../server/app.js";
import { expectValidationError } from "../test-support/http.js";
import { createTestRuntime } from "../test-support/runtime.js";
import { reviewTestRange } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";

describe("review ingest routes", () => {
  it("validates ingest requests and returns the ingest response contract", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryId: reviewTestRange.repositoryId,
        baseRefOrSha: reviewTestRange.baseRef,
        targetRefOrSha: reviewTestRange.targetRef,
        source: "system-ingest",
        concernMapVersion: deterministicConcernMapVersion,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      created: true,
      version: {
        repositoryId: reviewTestRange.repositoryId,
        baseRef: reviewTestRange.baseRef,
        targetRef: reviewTestRange.targetRef,
        baseSha: reviewTestRange.baseSha,
        targetSha: reviewTestRange.targetSha,
        commits: [
          {
            reviewMark: "FLAG",
            concernAreas: ["harness-prompts"],
            files: [
              {
                reviewMark: null,
                diffBlocks: [{ position: 0, heading: "prompt" }],
              },
            ],
          },
        ],
      },
    });
  });

  it("rejects invalid ingest payloads with contract-shaped validation errors", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/versions/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repositoryId: reviewTestRange.repositoryId,
        baseRefOrSha: reviewTestRange.baseRef,
        targetRefOrSha: reviewTestRange.targetRef,
        source: "system-ingest",
      }),
    });

    await expectValidationError(response);
  });
});
