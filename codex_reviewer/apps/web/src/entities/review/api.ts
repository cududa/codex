import {
  ReviewBootstrapResponseSchema,
  ReviewMarkWriteResponseSchema,
  ReviewVersionsResponseSchema,
  SetCommitConcernAreasRequestSchema,
  SetCommitReviewMarkRequestSchema,
  SetFileReviewMarkRequestSchema,
  ActorRefSchema,
} from "@prompt-reviews/contracts";
import { requestJson } from "@/shared/api/http";
import type { ActorRef, ConcernAreaSlug, ExplicitFileReviewMark, ReviewMark } from "./types";

export const localHumanActor: ActorRef = ActorRefSchema.parse({
  type: "human",
  id: "local-human",
  displayName: "Local Human",
});

export function getReviewBootstrap() {
  return requestJson(ReviewBootstrapResponseSchema, "/api/review/bootstrap");
}

export function getReviewVersions() {
  return requestJson(ReviewVersionsResponseSchema, "/api/review/versions");
}

export function setCommitReviewMark(input: { commitId: string; reviewMark: ReviewMark; actor?: ActorRef }) {
  const payload = SetCommitReviewMarkRequestSchema.parse({
    actor: input.actor ?? localHumanActor,
    reviewMark: input.reviewMark,
  });
  return requestJson(
    ReviewMarkWriteResponseSchema,
    `/api/review/commits/${encodeURIComponent(input.commitId)}/review-mark`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function setFileReviewMark(input: {
  fileId: string;
  reviewMark: ExplicitFileReviewMark;
  actor?: ActorRef;
}) {
  const payload = SetFileReviewMarkRequestSchema.parse({
    actor: input.actor ?? localHumanActor,
    reviewMark: input.reviewMark,
  });
  return requestJson(
    ReviewMarkWriteResponseSchema,
    `/api/review/files/${encodeURIComponent(input.fileId)}/review-mark`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function setCommitConcernAreas(input: {
  commitId: string;
  concernAreas: ConcernAreaSlug[];
  actor?: ActorRef;
}) {
  const payload = SetCommitConcernAreasRequestSchema.parse({
    actor: input.actor ?? localHumanActor,
    concernAreas: input.concernAreas,
  });
  return requestJson(
    ReviewMarkWriteResponseSchema,
    `/api/review/commits/${encodeURIComponent(input.commitId)}/concern-areas`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
