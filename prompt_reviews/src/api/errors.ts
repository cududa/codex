import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import { PromptReviewServiceError } from "../services/errors.js";

export const HttpErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string().trim().min(1),
        message: z.string().trim().min(1),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .strict(),
  })
  .strict();

export class ApiValidationError extends Error {
  readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown>) {
    super(message);
    this.name = "ApiValidationError";
    this.details = details;
  }
}

export function sendHttpError(error: unknown, request: FastifyRequest, reply: FastifyReply): void {
  const mapped = mapHttpError(error);
  if (mapped.statusCode === 500) {
    request.log.error({ err: error }, "Unhandled API error");
  }
  void reply.status(mapped.statusCode).send(HttpErrorResponseSchema.parse(mapped.body));
}

function mapHttpError(error: unknown): {
  statusCode: number;
  body: z.infer<typeof HttpErrorResponseSchema>;
} {
  if (error instanceof ApiValidationError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "validation_failed",
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "validation_failed",
          message: "Invalid API payload.",
          details: { issues: error.issues },
        },
      },
    };
  }

  if (error instanceof PromptReviewServiceError) {
    return {
      statusCode: statusCodeForServiceError(error),
      body: {
        error: {
          code: errorCodeForServiceError(error),
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  const fastifyError = asFastifyError(error);
  if (fastifyError?.validation !== undefined) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "validation_failed",
          message: fastifyError.message,
          details: { validation: fastifyError.validation },
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "unexpected_error",
        message: "Unexpected API error.",
      },
    },
  };
}

function statusCodeForServiceError(error: PromptReviewServiceError): number {
  if (isActorAuthorityFailure(error)) {
    return 403;
  }
  if (error.code === "validation_failed") {
    return 400;
  }
  if (error.code === "not_found") {
    return 404;
  }
  if (error.code === "invariant_failed" || error.code === "unsupported_operation") {
    return 409;
  }
  return 500;
}

function errorCodeForServiceError(error: PromptReviewServiceError): string {
  if (isActorAuthorityFailure(error)) {
    return "actor_authority_failed";
  }
  if (error.code === "invariant_failed") {
    return "state_conflict";
  }
  return error.code;
}

function isActorAuthorityFailure(error: PromptReviewServiceError): boolean {
  return error.message.toLowerCase().includes("only human actors");
}

function asFastifyError(error: unknown): FastifyError | undefined {
  if (error !== null && typeof error === "object" && "validation" in error) {
    return error as FastifyError;
  }
  return undefined;
}
