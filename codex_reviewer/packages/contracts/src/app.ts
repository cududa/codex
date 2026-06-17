import { z } from "zod";
import { NonEmptyStringSchema } from "./shared/primitives.js";

export const HealthResponseSchema = z
  .object({
    ok: z.literal(true),
    service: z.literal("codex-reviewer-api"),
  })
  .strict();

export const AppMetadataResponseSchema = z
  .object({
    appName: z.literal("Codex Reviewer"),
    apiName: z.literal("codex-reviewer-api"),
    contractsPackage: z.literal("@prompt-reviews/contracts"),
    status: z.enum(["ready"]),
    summary: NonEmptyStringSchema,
  })
  .strict();

export const AppMetadataQuerySchema = z
  .object({
    view: z.enum(["summary"]).optional(),
  })
  .strict();

export type AppMetadataQuery = z.infer<typeof AppMetadataQuerySchema>;
export type AppMetadataResponse = z.infer<typeof AppMetadataResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
