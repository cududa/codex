import { describe, expect, it } from "vitest";
import { createApiApp } from "./app.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("API error handling", () => {
  it("returns contract-shaped errors", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "not_found",
        message: "Not Found",
      },
    });
  });
});
