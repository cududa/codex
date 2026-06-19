import {
  ReviewBootstrapResponseSchema,
  ReviewMarkWriteResponseSchema,
  ReviewVersionsResponseSchema,
  RecordAgentReviewResponseSchema,
  RecordCommitAgentReviewRequestSchema,
  RecordFileAgentReviewRequestSchema,
  SetCommitConcernAreasRequestSchema,
  SetCommitReviewMarkRequestSchema,
  SetFileReviewMarkRequestSchema,
  AgentActorRefSchema,
  ActorRefSchema,
} from "@prompt-reviews/contracts";
import { requestJson } from "@/shared/api/http";
import type { ActorRef, AgentActorRef, ConcernAreaSlug, ExplicitFileReviewMark, ReviewMark } from "./types";

export const localHumanActor: ActorRef = ActorRefSchema.parse({
  type: "human",
  id: "local-human",
  displayName: "Local Human",
});

export const localAgentActor: AgentActorRef = AgentActorRefSchema.parse({
  type: "agent",
  id: "local-agent",
  displayName: "Local Agent",
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

export function recordCommitAgentReview(input: {
  commitId: string;
  reviewedMark: ReviewMark;
  reviewedConcernAreas: ConcernAreaSlug[];
  notesMarkdown: string | null;
  actor?: AgentActorRef;
}) {
  const payload = RecordCommitAgentReviewRequestSchema.parse({
    actor: input.actor ?? localAgentActor,
    reviewedMark: input.reviewedMark,
    reviewedConcernAreas: input.reviewedConcernAreas,
    notesMarkdown: input.notesMarkdown,
  });
  return requestJson(
    RecordAgentReviewResponseSchema,
    `/api/review/commits/${encodeURIComponent(input.commitId)}/agent-reviews`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function recordFileAgentReview(input: {
  fileId: string;
  reviewedMark: ReviewMark;
  notesMarkdown: string | null;
  actor?: AgentActorRef;
}) {
  const payload = RecordFileAgentReviewRequestSchema.parse({
    actor: input.actor ?? localAgentActor,
    reviewedMark: input.reviewedMark,
    notesMarkdown: input.notesMarkdown,
  });
  return requestJson(
    RecordAgentReviewResponseSchema,
    `/api/review/files/${encodeURIComponent(input.fileId)}/agent-reviews`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
