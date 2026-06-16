import { z } from "zod";
import {
  DecisionScopeSchema,
  ReviewEntityScopeSchema,
  type DecisionScope,
  type ReviewEntityScope,
} from "../schemas/scopes.js";

export type DomainParseResult<T> = { success: true; data: T } | { success: false; error: z.ZodError };

export function validateReviewEntityScope(input: unknown): DomainParseResult<ReviewEntityScope> {
  return ReviewEntityScopeSchema.safeParse(input);
}

export function validateDecisionScope(input: unknown): DomainParseResult<DecisionScope> {
  return DecisionScopeSchema.safeParse(input);
}
