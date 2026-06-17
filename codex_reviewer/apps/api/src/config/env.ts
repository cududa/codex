import { z } from "zod";

export const ApiConfigSchema = z
  .object({
    host: z.string().trim().min(1).default("127.0.0.1"),
    port: z.coerce.number().int().positive().default(4188),
  })
  .strict();

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return ApiConfigSchema.parse({
    host: env.CODEX_REVIEWER_HOST,
    port: env.CODEX_REVIEWER_PORT,
  });
}
