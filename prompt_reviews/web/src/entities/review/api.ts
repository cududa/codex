import {
  ClassificationViewSchema,
  CommentDetailSchema,
  CommitDetailSchema,
  CommitFileDetailSchema,
  CommitFileQueueItemSchema,
  CommitQueueItemSchema,
  ConcernTagViewSchema,
  DecisionDetailSchema,
  PlanDetailSchema,
  PlanItemDetailSchema,
  RemainingWorkSchema,
  VersionDetailSchema,
  VersionSummarySchema,
  paginatedResponseSchema,
} from "@domain/schemas";
import { z } from "zod";
import { requestJson } from "@/shared/api/http";
import type {
  ActorRef,
  AddCommentParams,
  ClassifyCommitParams,
  ClassifyFileParams,
  CommentDetail,
  CommitDetail,
  CommitFileDetail,
  CommitFileQueueItem,
  CommitQueueItem,
  ConcernTagView,
  DecisionDetail,
  DecisionScope,
  FinalizeDecisionParams,
  MissingDecisionsResponse,
  PaginatedResult,
  PlanDetail,
  PlanItemDetail,
  RemainingWork,
  SourceAnchor,
  VersionDetail,
  VersionSummary,
} from "./types";

const VersionListResponseSchema = z.object({ versions: z.array(VersionSummarySchema) }).strict();
const ConcernTagsResponseSchema = z.object({ tags: z.array(ConcernTagViewSchema) }).strict();
const CommentsResponseSchema = z.object({ comments: z.array(CommentDetailSchema) }).strict();
const RemainingWorkResponseSchema = z.object({ remainingWork: z.array(RemainingWorkSchema) }).strict();
const CommitPageSchema = paginatedResponseSchema(CommitQueueItemSchema);
const FilePageSchema = paginatedResponseSchema(CommitFileQueueItemSchema);
const MissingCommitDecisionsResponseSchema = z
  .object({ target: z.literal("commit"), data: z.array(CommitQueueItemSchema) })
  .strict();
const MissingFileDecisionsResponseSchema = z
  .object({ target: z.literal("file"), data: z.array(CommitFileQueueItemSchema) })
  .strict();
const MissingDecisionsResponseSchema = z.union([
  MissingCommitDecisionsResponseSchema,
  MissingFileDecisionsResponseSchema,
]);

export const humanUserActor: ActorRef = {
  type: "human",
  id: "local-user",
  displayName: "Human reviewer",
};

export const agentUserActor: ActorRef = {
  type: "agent",
  id: "frontend-workbench",
  displayName: "Frontend workbench",
};

export async function listVersions(status: "open" | "closed" | "all" = "open"): Promise<VersionSummary[]> {
  const payload = await requestJson<unknown>(`/api/versions?status=${encodeURIComponent(status)}`);
  return VersionListResponseSchema.parse(payload).versions;
}

export async function listActiveVersions(): Promise<VersionSummary[]> {
  const versions = await listVersions("all");
  return versions.filter((version) => version.status !== "closed" && version.status !== "archived");
}

export async function getVersionDetail(versionId: string): Promise<VersionDetail> {
  const payload = await requestJson<unknown>(`/api/versions/${encodeURIComponent(versionId)}`);
  return VersionDetailSchema.parse(payload);
}

export async function listVersionCommits(
  versionId: string,
  remaining = true,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<PaginatedResult<CommitQueueItem>> {
  const query = new URLSearchParams({ remaining: String(remaining) });
  if (options.cursor !== undefined && options.cursor !== null) {
    query.set("cursor", options.cursor);
  }
  if (options.limit !== undefined) {
    query.set("limit", String(options.limit));
  }
  const payload = await requestJson<unknown>(`/api/versions/${encodeURIComponent(versionId)}/commits?${query}`);
  return CommitPageSchema.parse(payload);
}

export async function getCommitDetail(commitId: string): Promise<CommitDetail> {
  const payload = await requestJson<unknown>(`/api/commits/${encodeURIComponent(commitId)}`);
  return CommitDetailSchema.parse(payload);
}

export async function listCommitFiles(
  commitId: string,
  remaining = false,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<PaginatedResult<CommitFileQueueItem>> {
  const query = new URLSearchParams({ remaining: String(remaining) });
  if (options.cursor !== undefined && options.cursor !== null) {
    query.set("cursor", options.cursor);
  }
  if (options.limit !== undefined) {
    query.set("limit", String(options.limit));
  }
  const payload = await requestJson<unknown>(`/api/commits/${encodeURIComponent(commitId)}/files?${query}`);
  return FilePageSchema.parse(payload);
}

export async function getCommitFileDetail(commitFileId: string): Promise<CommitFileDetail> {
  const payload = await requestJson<unknown>(`/api/commit-files/${encodeURIComponent(commitFileId)}`);
  return CommitFileDetailSchema.parse(payload);
}

export async function listConcernTags(): Promise<ConcernTagView[]> {
  const payload = await requestJson<unknown>("/api/concern-tags");
  return ConcernTagsResponseSchema.parse(payload).tags;
}

export async function listComments(filter: {
  versionId?: string;
  commitId?: string;
  commitFileId?: string;
  status?: "open" | "resolved" | "wont_fix" | "superseded";
}): Promise<CommentDetail[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined) {
      query.set(key, value);
    }
  }
  const suffix = query.size === 0 ? "" : `?${query}`;
  const payload = await requestJson<unknown>(`/api/comments${suffix}`);
  return CommentsResponseSchema.parse(payload).comments;
}

export async function listMissingDecisions(
  versionId: string,
  target: "commit" | "file",
): Promise<MissingDecisionsResponse> {
  const query = new URLSearchParams({ target });
  const payload = await requestJson<unknown>(
    `/api/versions/${encodeURIComponent(versionId)}/missing-decisions?${query}`,
  );
  return MissingDecisionsResponseSchema.parse(payload);
}

export async function getRemainingWork(versionId: string): Promise<RemainingWork[]> {
  const payload = await requestJson<unknown>(`/api/versions/${encodeURIComponent(versionId)}/remaining-work`);
  return RemainingWorkResponseSchema.parse(payload).remainingWork;
}

export async function classifyCommit(
  commitId: string,
  input: Omit<ClassifyCommitParams, "commitId">,
) {
  const payload = await requestJson<unknown>(`/api/commits/${encodeURIComponent(commitId)}/classification`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return ClassificationViewSchema.parse(payload);
}

export async function classifyFile(
  commitFileId: string,
  input: Omit<ClassifyFileParams, "commitFileId">,
) {
  const payload = await requestJson<unknown>(`/api/commit-files/${encodeURIComponent(commitFileId)}/classification`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return ClassificationViewSchema.parse(payload);
}

export async function addComment(input: {
  scope: AddCommentParams["scope"];
  anchor: SourceAnchor;
  body: string;
}): Promise<CommentDetail> {
  const payload = await requestJson<unknown>("/api/comments", {
    method: "POST",
    body: JSON.stringify({ ...input, author: humanUserActor }),
  });
  return CommentDetailSchema.parse(payload);
}

export async function resolveComment(commentId: string): Promise<CommentDetail> {
  const payload = await requestJson<unknown>(`/api/comments/${encodeURIComponent(commentId)}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "resolved",
      actor: humanUserActor,
    }),
  });
  return CommentDetailSchema.parse(payload);
}

export async function reopenComment(commentId: string): Promise<CommentDetail> {
  const payload = await requestJson<unknown>(`/api/comments/${encodeURIComponent(commentId)}/reopen`, {
    method: "PATCH",
    body: JSON.stringify({
      actor: humanUserActor,
    }),
  });
  return CommentDetailSchema.parse(payload);
}

export async function proposeDecision(input: {
  scope: DecisionScope;
  outcome:
    | "accept"
    | "accept_with_watch"
    | "patch_required"
    | "reject_for_local_build"
      | "needs_tests"
      | "needs_policy_decision"
      | "blocked_on_context";
}): Promise<DecisionDetail> {
  const payload = await requestJson<unknown>("/api/decisions", {
    method: "POST",
    body: JSON.stringify({ ...input, proposedBy: humanUserActor }),
  });
  return DecisionDetailSchema.parse(payload);
}

export async function finalizeDecision(
  decisionId: string,
  input: Omit<FinalizeDecisionParams, "decisionId" | "finalizer">,
): Promise<DecisionDetail> {
  const payload = await requestJson<unknown>(`/api/decisions/${encodeURIComponent(decisionId)}/finalize`, {
    method: "POST",
    body: JSON.stringify({ ...input, finalizer: humanUserActor }),
  });
  return DecisionDetailSchema.parse(payload);
}

export async function createPlan(input: {
  scope: DecisionScope;
  title: string;
  summary?: string;
  commentIds?: string[];
  decisionIds?: string[];
  diffBlockIds?: string[];
}): Promise<PlanDetail> {
  const payload = await requestJson<unknown>("/api/plans", {
    method: "POST",
    body: JSON.stringify({ ...input, proposedBy: humanUserActor }),
  });
  return PlanDetailSchema.parse(payload);
}

export async function updatePlan(
  planId: string,
  input: {
    title?: string;
    summary?: string;
    status?: "draft" | "proposed" | "accepted" | "in_progress" | "complete" | "abandoned" | "superseded";
    commentIds?: string[];
    decisionIds?: string[];
    diffBlockIds?: string[];
  },
): Promise<PlanDetail> {
  const payload = await requestJson<unknown>(`/api/plans/${encodeURIComponent(planId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, actor: humanUserActor }),
  });
  return PlanDetailSchema.parse(payload);
}

export async function createPlanItem(
  planId: string,
  input: { title: string; description?: string; commitFileId?: string; decisionId?: string },
): Promise<PlanItemDetail> {
  const payload = await requestJson<unknown>(`/api/plans/${encodeURIComponent(planId)}/items`, {
    method: "POST",
    body: JSON.stringify({ ...input, actor: humanUserActor }),
  });
  return PlanItemDetailSchema.parse(payload);
}

export async function updatePlanItem(
  planItemId: string,
  input: {
    title?: string;
    description?: string;
    status?: "todo" | "in_progress" | "blocked" | "complete" | "abandoned";
    blockingReason?: string;
    commitFileId?: string;
    decisionId?: string;
  },
): Promise<PlanItemDetail> {
  const payload = await requestJson<unknown>(`/api/plan-items/${encodeURIComponent(planItemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, actor: humanUserActor }),
  });
  return PlanItemDetailSchema.parse(payload);
}

export async function completePlan(planId: string, completionNote?: string): Promise<PlanDetail> {
  const payload = await requestJson<unknown>(`/api/plans/${encodeURIComponent(planId)}/complete`, {
    method: "POST",
    body: JSON.stringify({
      completedBy: humanUserActor,
      completionNote: completionNote?.trim() === "" ? undefined : completionNote,
    }),
  });
  return PlanDetailSchema.parse(payload);
}
