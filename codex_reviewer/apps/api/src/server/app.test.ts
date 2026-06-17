import { describe, expect, it, vi } from "vitest";
import { createApiApp } from "./app.js";
import type { ApiDependencies } from "./types.js";

describe("createApiApp", () => {
  it("serves health through the shared response contract", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "codex-reviewer-api" });
  });

  it("returns metadata through the shared response contract", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/meta");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      appName: "Codex Reviewer",
      apiName: "codex-reviewer-api",
      contractsPackage: "@prompt-reviews/contracts",
      status: "ready",
      summary: "Contracts-first Hono and React workspace foundation.",
    });
  });

  it("rejects invalid query params through Hono and Zod", async () => {
    const app = createApiApp(testDependencies());

    const response = await app.request("/api/meta?view=everything");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "validation_failed",
        message: "Invalid API payload.",
      },
    });
  });

  it("returns contract-shaped errors", async () => {
    const app = createApiApp(testDependencies());

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

function testDependencies(): ApiDependencies {
  return {
    config: {
      host: "127.0.0.1",
      port: 0,
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    } as unknown as ApiDependencies["logger"],
  };
}
