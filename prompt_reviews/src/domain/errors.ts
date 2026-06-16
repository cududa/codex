import { z } from "zod";

export const DomainErrorSchema = z
  .object({
    code: z.string().trim().min(1),
    message: z.string().trim().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type DomainError = z.infer<typeof DomainErrorSchema>;
