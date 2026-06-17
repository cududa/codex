import { AppMetadataResponseSchema, HealthResponseSchema } from "@prompt-reviews/contracts";
import { requestJson } from "@/shared/api/http";

export function getHealth() {
  return requestJson(HealthResponseSchema, "/health");
}

export function getAppMetadata() {
  return requestJson(AppMetadataResponseSchema, "/api/meta");
}
