import { ReviewBootstrapResponseSchema, ReviewVersionsResponseSchema } from "@prompt-reviews/contracts";
import { requestJson } from "@/shared/api/http";

export function getReviewBootstrap() {
  return requestJson(ReviewBootstrapResponseSchema, "/api/review/bootstrap");
}

export function getReviewVersions() {
  return requestJson(ReviewVersionsResponseSchema, "/api/review/versions");
}
