import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const NextActionSchema = z
  .object({
    tool: z.string().trim().min(1).optional(),
    resource: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1),
  })
  .strict()
  .refine((action) => action.tool !== undefined || action.resource !== undefined, {
    message: "nextAction must include a tool or resource",
  });

export type NextAction = z.infer<typeof NextActionSchema>;

export function withNextAction<T extends z.ZodRawShape>(shape: T): z.ZodObject<T & { nextAction: typeof NextActionSchema }> {
  return z.object({ ...shape, nextAction: NextActionSchema }).strict();
}

export function toolResult<T>(payload: T): CallToolResult {
  const text = JSON.stringify(payload, null, 2);
  return {
    structuredContent: payload as Record<string, unknown>,
    content: [{ type: "text", text }],
  };
}

export function resourceJson(uri: URL, payload: unknown) {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function errorToolResult(error: unknown): CallToolResult {
  const payload = {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}
