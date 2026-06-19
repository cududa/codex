import { concernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("review bootstrap routes", () => {
  it("serves review bootstrap data from shared contracts", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/review/bootstrap");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      concernAreas,
      reviewMarks: reviewMarkDefinitions,
    });
  });
});
