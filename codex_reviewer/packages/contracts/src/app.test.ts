import { describe, expect, it } from "vitest";
import { ApiErrorResponseSchema, AppMetadataResponseSchema, HealthResponseSchema } from "./index.js";

describe("neutral app contracts", () => {
  it("rejects extra fields in health responses", () => {
    expect(() =>
      HealthResponseSchema.parse({
        ok: true,
        service: "codex-reviewer-api",
        extra: "not allowed",
      }),
    ).toThrow();
  });

  it("parses metadata through the shared schema", () => {
    expect(
      AppMetadataResponseSchema.parse({
        appName: "Codex Reviewer",
        apiName: "codex-reviewer-api",
        contractsPackage: "@prompt-reviews/contracts",
        status: "ready",
        summary: "Contracts-first Hono and React workspace foundation.",
      }),
    ).toEqual({
      appName: "Codex Reviewer",
      apiName: "codex-reviewer-api",
      contractsPackage: "@prompt-reviews/contracts",
      status: "ready",
      summary: "Contracts-first Hono and React workspace foundation.",
    });
  });

  it("keeps API errors contract-shaped", () => {
    expect(
      ApiErrorResponseSchema.parse({
        error: {
          code: "not_found",
          message: "Route not found.",
        },
      }),
    ).toEqual({
      error: {
        code: "not_found",
        message: "Route not found.",
      },
    });
  });
});
