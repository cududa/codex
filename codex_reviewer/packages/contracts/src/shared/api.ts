import { z } from "zod";
import { NonEmptyStringSchema } from "./primitives.js";

export const ApiErrorCodeSchema = z.enum([
  "bad_request",
  "not_found",
  "state_conflict",
  "validation_failed",
  "unexpected_error",
]);

export const ApiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: ApiErrorCodeSchema,
        message: NonEmptyStringSchema,
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .strict(),
  })
  .strict();

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
