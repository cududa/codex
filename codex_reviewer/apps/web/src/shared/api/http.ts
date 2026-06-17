import { ApiErrorResponseSchema } from "@prompt-reviews/contracts";
import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<TSchema extends z.ZodType>(
  schema: TSchema,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<z.infer<TSchema>> {
  const response = await fetch(withApiBaseUrl(input), {
    ...init,
    headers: {
      ...(init?.body === undefined ? {} : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const error = ApiErrorResponseSchema.safeParse(payload);
    throw new ApiError(error.success ? error.data.error.message : `Request failed with ${response.status}.`, response.status);
  }

  return schema.parse(payload);
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }
  return JSON.parse(text) as unknown;
}

function withApiBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== "string" || !input.startsWith("/")) {
    return input;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    return input;
  }
  return new URL(input, baseUrl);
}
