import type { ApiErrorCode } from "@prompt-reviews/contracts";

export class ReviewStoreError extends Error {
  constructor(
    readonly code: Extract<ApiErrorCode, "not_found" | "state_conflict">,
    message: string,
  ) {
    super(message);
    this.name = "ReviewStoreError";
  }
}

export function notFound(message: string): ReviewStoreError {
  return new ReviewStoreError("not_found", message);
}

export function stateConflict(message: string): ReviewStoreError {
  return new ReviewStoreError("state_conflict", message);
}
