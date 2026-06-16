import { z } from "zod";
import { ApiValidationError } from "./errors.js";

export function validateInput<T>(schema: z.ZodType<T>, value: unknown, part: string): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new ApiValidationError(`Invalid ${part}.`, {
    part,
    issues: parsed.error.issues,
  });
}

export function validateResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export function booleanQueryParam(defaultValue = false): z.ZodType<boolean> {
  return z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return defaultValue;
      }
      return value === true || value === "true";
    });
}

export function numericQueryParam(): z.ZodType<number | undefined> {
  return z
    .union([z.number(), z.string().trim().min(1)])
    .optional()
    .transform((value, context) => {
      if (value === undefined || typeof value === "number") {
        return value;
      }
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0) {
        context.addIssue({
          code: "custom",
          message: "Expected a nonnegative integer.",
        });
        return z.NEVER;
      }
      return parsed;
    });
}
