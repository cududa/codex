import { AppMetadataResponseSchema } from "@prompt-reviews/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, requestJson } from "./http";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses successful payloads through the provided schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(validMetadata()), { status: 200 })),
    );

    await expect(requestJson(AppMetadataResponseSchema, "/api/meta")).resolves.toEqual(validMetadata());
  });

  it("surfaces contract-shaped error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "not_found",
                message: "Nope.",
              },
            }),
            { status: 404 },
          ),
      ),
    );

    await expect(requestJson(AppMetadataResponseSchema, "/api/meta")).rejects.toThrow(ApiError);
    await expect(requestJson(AppMetadataResponseSchema, "/api/meta")).rejects.toThrow("Nope.");
  });
});

function validMetadata() {
  return {
    appName: "Codex Reviewer",
    apiName: "codex-reviewer-api",
    contractsPackage: "@prompt-reviews/contracts",
    status: "ready",
    summary: "Contracts-first Hono and React workspace foundation.",
  };
}
