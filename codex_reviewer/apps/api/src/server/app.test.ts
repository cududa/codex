import { describe, expect, it } from "vitest";
import { createApiApp } from "./app.js";
import { createTestRuntime } from "../test-support/runtime.js";

describe("createApiApp", () => {
  it("serves health through the shared response contract", async () => {
    const { dependencies } = await createTestRuntime();
    const app = createApiApp(dependencies);

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "codex-reviewer-api" });
  });
});
