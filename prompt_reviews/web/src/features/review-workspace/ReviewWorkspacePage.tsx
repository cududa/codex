import { useEffect, useMemo } from "react";
import { FileCode2, GitCommit } from "lucide-react";
import { ClassificationPanel } from "./components/ClassificationPanel";
import { CommentsPanel } from "./components/CommentsPanel";
import { CommitQueue } from "./components/CommitQueue";
import { DecisionPanel } from "./components/DecisionPanel";
import { FileQueue } from "./components/FileQueue";
import { FileReviewPane } from "./components/FileReviewPane";
import { PlansPanel } from "./components/PlansPanel";
import { VersionHeader } from "./components/VersionHeader";
import { VersionRail } from "./components/VersionRail";
import type { CommentDetail, CommentLocation, CommitDetail, CommitFileDetail, CommitQueueItem } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import {
  scopeForSelection,
  useAddCommentMutation,
  useClassifyCommitMutation,
  useClassifyFileMutation,
  useCommitDetailQuery,
  useCommitFileDetailQuery,
  useCommitFilesQuery,
  useCompletePlanMutation,
  useConcernTagsQuery,
  useCreatePlanItemMutation,
  useCreatePlanMutation,
  useFinalizeDecisionMutation,
  useMissingDecisionsQuery,
  useProposeDecisionMutation,
  useRemainingWorkQuery,
  useReopenCommentMutation,
  useResolveCommentMutation,
  useUpdatePlanItemMutation,
  useUpdatePlanMutation,
  useVersionCommentsQuery,
  useVersionCommitsQuery,
  useVersionsQuery,
} from "./hooks/reviewQueries";
import { useReviewWorkspaceStore } from "./model/reviewWorkspaceStore";
import type { ReviewFocus } from "./model/reviewWorkspaceStore";
import type { ReviewCommentTarget } from "./model/commentTargets";

export function ReviewWorkspacePage() {
  const selectedVersionId = useReviewWorkspaceStore((state) => state.selectedVersionId);
  const selectedCommitId = useReviewWorkspaceStore((state) => state.selectedCommitId);
  const selectedFileId = useReviewWorkspaceStore((state) => state.selectedFileId);
  const commentTarget = useReviewWorkspaceStore((state) => state.commentTarget);
  const reviewFocus = useReviewWorkspaceStore((state) => state.reviewFocus);
  const setSelectedVersionId = useReviewWorkspaceStore((state) => state.setSelectedVersionId);
  const setSelectedCommitId = useReviewWorkspaceStore((state) => state.setSelectedCommitId);
  const setSelectedFileId = useReviewWorkspaceStore((state) => state.setSelectedFileId);
  const setCommentTarget = useReviewWorkspaceStore((state) => state.setCommentTarget);
  const setReviewFocus = useReviewWorkspaceStore((state) => state.setReviewFocus);

  const versionsQuery = useVersionsQuery();
  const commitsQuery = useVersionCommitsQuery(selectedVersionId);
  const commitQuery = useCommitDetailQuery(selectedCommitId);
  const filesQuery = useCommitFilesQuery(selectedCommitId);
  const fileQuery = useCommitFileDetailQuery(selectedFileId);
  const tagsQuery = useConcernTagsQuery();
  const commentsQuery = useVersionCommentsQuery(selectedVersionId);
  const missingCommitDecisionsQuery = useMissingDecisionsQuery(selectedVersionId, "commit");
  const missingFileDecisionsQuery = useMissingDecisionsQuery(selectedVersionId, "file");
  const remainingWorkQuery = useRemainingWorkQuery(selectedVersionId);

  const classifyCommitMutation = useClassifyCommitMutation(selectedVersionId, selectedCommitId);
  const classifyFileMutation = useClassifyFileMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const addCommentMutation = useAddCommentMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const resolveCommentMutation = useResolveCommentMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const reopenCommentMutation = useReopenCommentMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const proposeDecisionMutation = useProposeDecisionMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const finalizeDecisionMutation = useFinalizeDecisionMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const createPlanMutation = useCreatePlanMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const updatePlanMutation = useUpdatePlanMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const createPlanItemMutation = useCreatePlanItemMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const updatePlanItemMutation = useUpdatePlanItemMutation(selectedVersionId, selectedCommitId, selectedFileId);
  const completePlanMutation = useCompletePlanMutation(selectedVersionId, selectedCommitId, selectedFileId);

  useEffect(() => {
    if (selectedVersionId !== null || versionsQuery.data === undefined) {
      return;
    }
    const firstVersion = versionsQuery.data[0];
    if (firstVersion !== undefined) {
      setSelectedVersionId(firstVersion.id);
    }
  }, [selectedVersionId, setSelectedVersionId, versionsQuery.data]);

  useEffect(() => {
    if (selectedCommitId !== null || commitsQuery.data === undefined) {
      return;
    }
    const firstCommit = commitsQuery.data.data[0];
    if (firstCommit !== undefined) {
      setSelectedCommitId(firstCommit.id);
    }
  }, [commitsQuery.data, selectedCommitId, setSelectedCommitId]);

  useEffect(() => {
    if (selectedFileId !== null || filesQuery.data === undefined) {
      return;
    }
    const firstFile = filesQuery.data.data[0];
    if (firstFile !== undefined) {
      setSelectedFileId(firstFile.id, { focus: false });
    }
  }, [filesQuery.data, selectedFileId, setSelectedFileId]);

  const selectedVersion = versionsQuery.data?.find((version) => version.id === selectedVersionId);
  const missingCommitIds = useMemo(
    () => new Set(missingCommitDecisionsQuery.data?.target === "commit" ? missingCommitDecisionsQuery.data.data.map((commit) => commit.id) : []),
    [missingCommitDecisionsQuery.data],
  );
  const missingFileIds = useMemo(
    () => new Set(missingFileDecisionsQuery.data?.target === "file" ? missingFileDecisionsQuery.data.data.map((file) => file.id) : []),
    [missingFileDecisionsQuery.data],
  );
  const visibleCommits = useMemo(
    () => ensureSelectedCommitVisible(commitsQuery.data?.data ?? [], commitQuery.data),
    [commitQuery.data, commitsQuery.data?.data],
  );
  const focusedFile = reviewFocus === "file" ? fileQuery.data : undefined;
  const focusedCommentTarget = reviewFocus === "file" ? commentTarget : null;
  const currentScope = scopeForSelection({
    versionId: selectedVersionId,
    commitId: selectedCommitId,
    fileId: reviewFocus === "file" ? selectedFileId : null,
  });
  const locateComment = (comment: CommentDetail) => {
    const location = comment.location;
    if (location === undefined) {
      return;
    }
    if (location.commit !== undefined) {
      setSelectedCommitId(location.commit.id);
    }
    if (location.file !== undefined) {
      setSelectedFileId(location.file.id);
    }
    setReviewFocus(location.file === undefined ? "commit" : "file");
    setCommentTarget(commentToTarget(comment, location));
  };
  const setFileCommentTarget = (target: ReviewCommentTarget | null) => {
    setCommentTarget(target);
    if (target !== null) {
      setReviewFocus("file");
    }
  };

  return (
    <main className="grid h-screen min-h-[760px] grid-cols-[300px_minmax(0,1fr)_390px] bg-slate-100 text-slate-950">
      <VersionRail
        error={versionsQuery.error?.message}
        isLoading={versionsQuery.isLoading}
        onRefresh={() => void versionsQuery.refetch()}
        onSelect={setSelectedVersionId}
        remainingWork={remainingWorkQuery.data ?? []}
        selectedVersionId={selectedVersionId}
        versions={versionsQuery.data ?? []}
      />

      <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <VersionHeader commit={commitQuery.data} version={selectedVersion} />
        <div className="grid min-h-0 grid-cols-[280px_300px_minmax(0,1fr)]">
          <CommitQueue
            commits={visibleCommits}
            error={commitsQuery.error?.message}
            isLoading={commitsQuery.isLoading}
            missingDecisionIds={missingCommitIds}
            onSelect={setSelectedCommitId}
            selectedCommit={commitQuery.data}
            selectedCommitId={selectedCommitId}
          />
          <FileQueue
            error={filesQuery.error?.message}
            files={filesQuery.data?.data ?? commitQuery.data?.queuedFiles ?? []}
            isLoading={filesQuery.isLoading}
            missingDecisionIds={missingFileIds}
            onSelect={setSelectedFileId}
            selectedFile={fileQuery.data}
            selectedFileId={selectedFileId}
          />
          <FileReviewPane
            actionError={
              addCommentMutation.error?.message ??
              resolveCommentMutation.error?.message ??
              reopenCommentMutation.error?.message
            }
            commentTarget={commentTarget}
            error={fileQuery.error?.message}
            file={fileQuery.data}
            isLoading={fileQuery.isLoading}
            isSubmittingComment={addCommentMutation.isPending}
            onAddComment={(input) => addCommentMutation.mutateAsync(input)}
            onCommentTargetChange={setFileCommentTarget}
          />
        </div>
      </section>

      <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white">
        <ReviewFocusHeader
          commit={commitQuery.data}
          file={fileQuery.data}
          focus={reviewFocus}
          onFocusCommit={() => setReviewFocus("commit")}
          onFocusFile={() => setReviewFocus("file")}
        />
        <ClassificationPanel
          commit={commitQuery.data}
          error={classifyCommitMutation.error?.message ?? classifyFileMutation.error?.message}
          file={focusedFile}
          isSubmitting={classifyCommitMutation.isPending || classifyFileMutation.isPending}
          onClassifyCommit={(input) => classifyCommitMutation.mutateAsync(input)}
          onClassifyFile={(input) => classifyFileMutation.mutateAsync(input)}
          tags={tagsQuery.data ?? []}
        />
        <CommentsPanel
          actionError={
            addCommentMutation.error?.message ??
            resolveCommentMutation.error?.message ??
            reopenCommentMutation.error?.message
          }
          commit={commitQuery.data}
          file={focusedFile}
          isSubmitting={addCommentMutation.isPending}
          onAddComment={(input) => addCommentMutation.mutateAsync(input)}
          onLocateComment={locateComment}
          onReopen={(commentId, reason) => reopenCommentMutation.mutateAsync({ commentId, reason })}
          onResolve={(commentId, resolution) => resolveCommentMutation.mutateAsync({ commentId, resolution })}
          commentTarget={focusedCommentTarget}
          version={selectedVersion}
          versionComments={commentsQuery.data ?? []}
        />
        <DecisionPanel
          commit={commitQuery.data}
          error={proposeDecisionMutation.error?.message ?? finalizeDecisionMutation.error?.message}
          file={focusedFile}
          isSubmitting={proposeDecisionMutation.isPending || finalizeDecisionMutation.isPending}
          onFinalize={(input) => finalizeDecisionMutation.mutateAsync(input)}
          onPropose={(input) => proposeDecisionMutation.mutateAsync(input)}
          scope={currentScope}
        />
        <PlansPanel
          commit={commitQuery.data}
          error={
            createPlanMutation.error?.message ??
            updatePlanMutation.error?.message ??
            createPlanItemMutation.error?.message ??
            updatePlanItemMutation.error?.message ??
            completePlanMutation.error?.message
          }
          file={focusedFile}
          isSubmitting={
            createPlanMutation.isPending ||
            updatePlanMutation.isPending ||
            createPlanItemMutation.isPending ||
            updatePlanItemMutation.isPending ||
            completePlanMutation.isPending
          }
          onCompletePlan={(input) => completePlanMutation.mutateAsync(input)}
          onCreateItem={(input) => createPlanItemMutation.mutateAsync(input)}
          onCreatePlan={(input) => createPlanMutation.mutateAsync(input)}
          onUpdateItem={(input) => updatePlanItemMutation.mutateAsync(input)}
          onUpdatePlan={(input) => updatePlanMutation.mutateAsync(input)}
          remainingWork={remainingWorkQuery.data ?? []}
          scope={currentScope}
        />
      </aside>
    </main>
  );
}

function commentToTarget(comment: CommentDetail, location: CommentLocation): ReviewCommentTarget | null {
  if (comment.anchor.kind === "range") {
    return {
      kind: "range",
      commitFileId: comment.anchor.commitFileId,
      side: comment.anchor.side,
      startLine: comment.anchor.startLine,
      endLine: comment.anchor.endLine,
      startColumn: comment.anchor.startColumn ?? 1,
      endColumn: comment.anchor.endColumn ?? 1,
      selectedText: comment.anchor.selectedText ?? "",
    };
  }
  if (comment.anchor.kind === "block") {
    return { kind: "block", diffBlockId: comment.anchor.diffBlockId };
  }
  if (location.file !== undefined) {
    return { kind: "file", commitFileId: location.file.id };
  }
  if (location.commit !== undefined) {
    return { kind: "commit", commitId: location.commit.id };
  }
  return null;
}

type ReviewFocusHeaderProps = {
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  focus: ReviewFocus;
  onFocusCommit: () => void;
  onFocusFile: () => void;
};

function ReviewFocusHeader({ commit, file, focus, onFocusCommit, onFocusFile }: ReviewFocusHeaderProps) {
  const effectiveFocus = focus === "file" && file !== undefined ? "file" : "commit";

  return (
    <section className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Review focus</h2>
        <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium">
          <button
            className={focusButtonClass(effectiveFocus === "commit")}
            disabled={commit === undefined}
            onClick={onFocusCommit}
            type="button"
          >
            <GitCommit className="size-3.5" aria-hidden="true" />
            Commit
          </button>
          <button
            className={focusButtonClass(effectiveFocus === "file")}
            disabled={file === undefined}
            onClick={onFocusFile}
            type="button"
          >
            <FileCode2 className="size-3.5" aria-hidden="true" />
            File
          </button>
        </div>
      </div>
      <div className="grid gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-950">
          {effectiveFocus === "file" ? (
            <FileCode2 className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          ) : (
            <GitCommit className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          )}
          <span className="truncate">{focusTitle(effectiveFocus, commit, file)}</span>
        </div>
        <div className="truncate text-xs text-slate-500">{focusSubtitle(effectiveFocus, commit, file)}</div>
      </div>
    </section>
  );
}

function focusButtonClass(selected: boolean): string {
  return cn(
    "inline-flex h-7 items-center justify-center gap-1.5 rounded px-2 transition disabled:pointer-events-none disabled:opacity-40",
    selected ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
  );
}

function focusTitle(focus: ReviewFocus, commit: CommitDetail | undefined, file: CommitFileDetail | undefined): string {
  if (focus === "file") {
    return file?.path ?? "No file selected";
  }
  return commit === undefined ? "No commit selected" : shortSha(commit.sha);
}

function focusSubtitle(focus: ReviewFocus, commit: CommitDetail | undefined, file: CommitFileDetail | undefined): string {
  if (focus === "file") {
    return commit === undefined ? "File actions" : `${shortSha(commit.sha)} · file actions`;
  }
  return commit?.title ?? "Commit actions";
}

function shortSha(sha: string): string {
  return sha.slice(0, 8);
}

function ensureSelectedCommitVisible(
  commits: CommitQueueItem[],
  selectedCommit: CommitDetail | undefined,
): CommitQueueItem[] {
  if (selectedCommit === undefined || commits.some((commit) => commit.id === selectedCommit.id)) {
    return commits;
  }
  return [selectedCommit, ...commits];
}
