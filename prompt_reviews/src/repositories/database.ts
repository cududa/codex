import type { PromptReviewsDatabase } from "../db/client.js";

export type PromptReviewsTransaction = Parameters<Parameters<PromptReviewsDatabase["transaction"]>[0]>[0];
export type RepositoryDatabase = PromptReviewsDatabase | PromptReviewsTransaction;

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type CursorLimit = {
  cursor?: string | null;
  limit?: number;
};

export function withRepositoryTransaction<T>(
  db: PromptReviewsDatabase,
  work: (tx: PromptReviewsTransaction) => T,
): T {
  return db.transaction(work);
}

export function normalizeLimit(limit: number | undefined, fallback = 50, maximum = 100): number {
  if (limit === undefined) {
    return fallback;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Pagination limit must be a positive integer.");
  }
  return Math.min(limit, maximum);
}

export function encodeCursor(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeCursor<T>(cursor: string | null | undefined): T | null {
  if (cursor === undefined || cursor === null) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as T;
  } catch (error) {
    throw new Error("Invalid pagination cursor.", { cause: error });
  }
}
