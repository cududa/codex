import { ReviewBootstrapResponseSchema } from "@prompt-reviews/contracts";
import { requestJson } from "@/shared/api/http";

export function getReviewBootstrap() {
  return requestJson(ReviewBootstrapResponseSchema, "/api/review/bootstrap");
}
