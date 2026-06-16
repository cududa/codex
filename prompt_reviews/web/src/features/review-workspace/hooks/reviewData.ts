import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  classifyCommit,
  classifyFile,
  completePlan,
  createPlan,
  createPlanItem,
  finalizeDecision,
  getCommitDetail,
  getCommitFileDetail,
  getRemainingWork,
  getVersionDetail,
  listComments,
  listActiveVersions,
  listCommitFiles,
  listVersionCommits,
  listConcernTags,
  listMissingDecisions,
  proposeDecision,
  reopenComment,
  resolveComment,
  updatePlan,
  updatePlanItem,
} from "@/entities/review/api";
import type {
  ClassifyCommitParams,
  ClassifyFileParams,
  DecisionScope,
  ReviewEntityScope,
  SourceAnchor,
} from "@/entities/review/types";

export const reviewKeys = {
  versions: ["review-workbench", "versions"] as const,
  version: (versionId: string | null) => ["review-workbench", "version", versionId] as const,
  commits: (versionId: string | null) => ["review-workbench", "commits", versionId] as const,
  commit: (commitId: string | null) => ["review-workbench", "commit", commitId] as const,
  files: (commitId: string | null) => ["review-workbench", "files", commitId] as const,
  file: (fileId: string | null) => ["review-workbench", "file", fileId] as const,
  comments: (versionId: string | null) => ["review-workbench", "comments", versionId] as const,
  tags: ["review-workbench", "concern-tags"] as const,
  missing: (versionId: string | null, target: "commit" | "file") =>
    ["review-workbench", "missing-decisions", versionId, target] as const,
  remainingWork: (versionId: string | null) => ["review-workbench", "remaining-work", versionId] as const,
};

export function useVersionsQuery() {
  return useQuery({
    queryKey: reviewKeys.versions,
    queryFn: listActiveVersions,
  });
}

export function useVersionDetailQuery(versionId: string | null) {
  return useQuery({
    queryKey: reviewKeys.version(versionId),
    queryFn: () => getVersionDetail(assertId(versionId, "No version selected.")),
    enabled: versionId !== null,
  });
}

export function useVersionCommitsQuery(versionId: string | null) {
  return useQuery({
    queryKey: reviewKeys.commits(versionId),
    queryFn: () => listVersionCommits(assertId(versionId, "No version selected."), true),
    enabled: versionId !== null,
  });
}

export function useCommitDetailQuery(commitId: string | null) {
  return useQuery({
    queryKey: reviewKeys.commit(commitId),
    queryFn: () => getCommitDetail(assertId(commitId, "No commit selected.")),
    enabled: commitId !== null,
  });
}

export function useCommitFilesQuery(commitId: string | null) {
  return useQuery({
    queryKey: reviewKeys.files(commitId),
    queryFn: () => listCommitFiles(assertId(commitId, "No commit selected."), false),
    enabled: commitId !== null,
  });
}

export function useCommitFileDetailQuery(fileId: string | null) {
  return useQuery({
    queryKey: reviewKeys.file(fileId),
    queryFn: () => getCommitFileDetail(assertId(fileId, "No file selected.")),
    enabled: fileId !== null,
  });
}

export function useConcernTagsQuery() {
  return useQuery({
    queryKey: reviewKeys.tags,
    queryFn: listConcernTags,
    staleTime: 60_000,
  });
}

export function useVersionCommentsQuery(versionId: string | null) {
  return useQuery({
    queryKey: reviewKeys.comments(versionId),
    queryFn: () => listComments({ versionId: assertId(versionId, "No version selected.") }),
    enabled: versionId !== null,
  });
}

export function useMissingDecisionsQuery(versionId: string | null, target: "commit" | "file") {
  return useQuery({
    queryKey: reviewKeys.missing(versionId, target),
    queryFn: () => listMissingDecisions(assertId(versionId, "No version selected."), target),
    enabled: versionId !== null,
  });
}

export function useRemainingWorkQuery(versionId: string | null) {
  return useQuery({
    queryKey: reviewKeys.remainingWork(versionId),
    queryFn: () => getRemainingWork(assertId(versionId, "No version selected.")),
    enabled: versionId !== null,
  });
}

export function useClassifyCommitMutation(versionId: string | null, commitId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ClassifyCommitParams, "commitId">) =>
      classifyCommit(assertId(commitId, "No commit selected."), input),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId }),
  });
}

export function useClassifyFileMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ClassifyFileParams, "commitFileId">) =>
      classifyFile(assertId(fileId, "No file selected."), input),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useAddCommentMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => addComment(input),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useResolveCommentMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { commentId: string; resolution: string }) =>
      resolveComment(input.commentId, input.resolution),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useReopenCommentMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { commentId: string; reason: string }) => reopenComment(input.commentId, input.reason),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useProposeDecisionMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: proposeDecision,
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useFinalizeDecisionMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      decisionId: string;
      status: "accepted" | "rejected" | "superseded";
      rationale?: string;
    }) => finalizeDecision(input.decisionId, { status: input.status, rationale: input.rationale }),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useCreatePlanMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useUpdatePlanMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updatePlan>[1] & { planId: string }) => {
      const { planId, ...body } = input;
      return updatePlan(planId, body);
    },
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useCreatePlanItemMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createPlanItem>[1] & { planId: string }) => {
      const { planId, ...body } = input;
      return createPlanItem(planId, body);
    },
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useUpdatePlanItemMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updatePlanItem>[1] & { planItemId: string }) => {
      const { planItemId, ...body } = input;
      return updatePlanItem(planItemId, body);
    },
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function useCompletePlanMutation(versionId: string | null, commitId: string | null, fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string; completionNote?: string }) =>
      completePlan(input.planId, input.completionNote),
    onSuccess: async () => invalidateReviewQueries(queryClient, { versionId, commitId, fileId }),
  });
}

export function scopeForSelection(input: {
  versionId: string | null;
  commitId: string | null;
  fileId: string | null;
}): DecisionScope | null {
  if (input.fileId !== null) {
    return { type: "commit_file", commitFileId: input.fileId };
  }
  if (input.commitId !== null) {
    return { type: "commit", commitId: input.commitId };
  }
  if (input.versionId !== null) {
    return { type: "version", versionId: input.versionId };
  }
  return null;
}

async function invalidateReviewQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  input: { versionId: string | null; commitId?: string | null; fileId?: string | null },
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: reviewKeys.versions }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.version(input.versionId) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.commits(input.versionId) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.comments(input.versionId) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.remainingWork(input.versionId) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.missing(input.versionId, "commit") }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.missing(input.versionId, "file") }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.commit(input.commitId ?? null) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.files(input.commitId ?? null) }),
    queryClient.invalidateQueries({ queryKey: reviewKeys.file(input.fileId ?? null) }),
  ]);
}

function assertId(value: string | null, message: string): string {
  if (value === null) {
    throw new Error(message);
  }
  return value;
}
