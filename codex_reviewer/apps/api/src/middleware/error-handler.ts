import { ApiErrorResponseSchema } from "@prompt-reviews/contracts";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ApiBindings } from "../server/types.js";

export function handleApiError(error: Error, c: Context<ApiBindings>) {
  const mapped = mapError(error);
  if (mapped.status === 500) {
    c.get("context").logger.error({ err: error }, "Unhandled API error");
  }
  return c.json(ApiErrorResponseSchema.parse(mapped.body), mapped.status);
}

function mapError(error: Error) {
  if (error instanceof HTTPException) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.status === 404 ? "not_found" : "bad_request",
          message: error.message,
        },
      },
    } as const;
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "validation_failed",
          message: "Invalid API payload.",
          details: { issues: error.issues },
        },
      },
    } as const;
  }

  return {
    status: 500,
    body: {
      error: {
        code: "unexpected_error",
        message: "Unexpected API error.",
      },
    },
  } as const;
}
