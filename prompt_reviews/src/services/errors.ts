export type ServiceErrorCode =
  | "not_found"
  | "validation_failed"
  | "invariant_failed"
  | "unsupported_operation";

export class PromptReviewServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ServiceErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "PromptReviewServiceError";
    this.code = code;
    this.details = details;
  }
}

export function notFound(entity: string, id: string): PromptReviewServiceError {
  return new PromptReviewServiceError("not_found", `${entity} not found.`, { entity, id });
}

export function invariantFailed(message: string, details?: Record<string, unknown>): PromptReviewServiceError {
  return new PromptReviewServiceError("invariant_failed", message, details);
}

export function validationFailed(message: string, details?: Record<string, unknown>): PromptReviewServiceError {
  return new PromptReviewServiceError("validation_failed", message, details);
}

export function unsupportedOperation(message: string, details?: Record<string, unknown>): PromptReviewServiceError {
  return new PromptReviewServiceError("unsupported_operation", message, details);
}
