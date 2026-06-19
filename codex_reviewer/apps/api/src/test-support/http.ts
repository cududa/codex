import { expect } from "vitest";

export async function expectValidationError(response: Response): Promise<void> {
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: {
      code: "validation_failed",
      message: "Invalid API payload.",
    },
  });
}

export async function expectNotFoundError(response: Response): Promise<void> {
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({
    error: { code: "not_found" },
  });
}
