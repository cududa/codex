import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";
import { expectValidationError } from "../test-support/http.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("metadata routes", () => {
  it("returns metadata through the shared response contract", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/meta");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      appName: "Codex Reviewer",
      apiName: "codex-reviewer-api",
      contractsPackage: "@prompt-reviews/contracts",
      status: "ready",
      summary: "Reviews upstream Codex changes before accepting them locally.",
    });
  });

  it("rejects invalid query params through Hono and Zod", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/api/meta?view=everything");

    await expectValidationError(response);
  });
});
