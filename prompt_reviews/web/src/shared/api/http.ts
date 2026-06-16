export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body === undefined ? {} : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (text.length === 0) {
    return `Request failed with ${response.status}.`;
  }

  try {
    const payload = JSON.parse(text) as { error?: unknown; reason?: unknown };
    if (typeof payload.error === "string") {
      return payload.error;
    }
    if (typeof payload.reason === "string") {
      return payload.reason;
    }
  } catch {
    return text;
  }

  return text;
}
