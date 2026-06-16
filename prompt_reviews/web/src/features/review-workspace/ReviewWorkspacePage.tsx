import { useEffect, useMemo } from "react";
import { ClassificationPanel } from "./components/ClassificationPanel";
import { CommentsPanel } from "./components/CommentsPanel";
import { CommitQueue } from "./components/CommitQueue";
import { DecisionPanel } from "./components/DecisionPanel";
import { FileQueue } from "./components/FileQueue";
import { FileReviewPane } from "./components/FileReviewPane";
import { PlansPanel } from "./components/PlansPanel";
import { VersionHeader } from "./components/VersionHeader";
import { VersionRail } from "./components/VersionRail";
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
  useVersionDetailQuery,
  useVersionsQuery,
} from "./hooks/reviewQueries";
import { useReviewWorkspaceStore } from "./model/reviewWorkspaceStore";

export function ReviewWorkspacePage() {
  const selectedVersionId = useReviewWorkspaceStore((state) => state.selectedVersionId);
  const selectedCommitId = useReviewWorkspaceStore((state) => state.selectedCommitId);
  const selectedFileId = useReviewWorkspaceStore((state) => state.selectedFileId);
  const selectedDiffBlockId = useReviewWorkspaceStore((state) => state.selectedDiffBlockId);
  const sourceRange = useReviewWorkspaceStore((state) => state.sourceRange);
  const setSelectedVersionId = useReviewWorkspaceStore((state) => state.setSelectedVersionId);
  const setSelectedCommitId = useReviewWorkspaceStore((state) => state.setSelectedCommitId);
  const setSelectedFileId = useReviewWorkspaceStore((state) => state.setSelectedFileId);
  const setSelectedDiffBlockId = useReviewWorkspaceStore((state) => state.setSelectedDiffBlockId);
  const setSourceRange = useReviewWorkspaceStore((state) => state.setSourceRange);

  const versionsQuery = useVersionsQuery();
  const versionQuery = useVersionDetailQuery(selectedVersionId);
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
      setSelectedFileId(firstFile.id);
    }
  }, [filesQuery.data, selectedFileId, setSelectedFileId]);

  const selectedVersion = versionQuery.data ?? versionsQuery.data?.find((version) => version.id === selectedVersionId);
  const missingCommitIds = useMemo(
    () => new Set(missingCommitDecisionsQuery.data?.target === "commit" ? missingCommitDecisionsQuery.data.data.map((commit) => commit.id) : []),
    [missingCommitDecisionsQuery.data],
  );
  const missingFileIds = useMemo(
    () => new Set(missingFileDecisionsQuery.data?.target === "file" ? missingFileDecisionsQuery.data.data.map((file) => file.id) : []),
    [missingFileDecisionsQuery.data],
  );
  const currentScope = scopeForSelection({
    versionId: selectedVersionId,
    commitId: selectedCommitId,
    fileId: selectedFileId,
  });

  return (
    <main className="grid h-screen min-h-[760px] grid-cols-[300px_minmax(0,1fr)_390px] bg-slate-100 text-slate-950">
      <VersionRail
        error={versionsQuery.error?.message}
        isLoading={versionsQuery.isLoading}
        onRefresh={() => void versionsQuery.refetch()}
        onSelect={setSelectedVersionId}
        remainingWork={remainingWorkQuery.data ?? versionQuery.data?.remainingWork ?? []}
        selectedVersionId={selectedVersionId}
        versions={versionsQuery.data ?? []}
      />

      <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <VersionHeader commit={commitQuery.data} version={selectedVersion} />
        <div className="grid min-h-0 grid-cols-[280px_300px_minmax(0,1fr)]">
          <CommitQueue
            commits={commitsQuery.data?.data ?? versionQuery.data?.commits ?? []}
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
            error={fileQuery.error?.message}
            file={fileQuery.data}
            isLoading={fileQuery.isLoading}
            onSelectDiffBlock={setSelectedDiffBlockId}
            onSourceRangeChange={setSourceRange}
            selectedDiffBlockId={selectedDiffBlockId}
            sourceRange={sourceRange}
          />
        </div>
      </section>

      <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white">
        <ClassificationPanel
          commit={commitQuery.data}
          error={classifyCommitMutation.error?.message ?? classifyFileMutation.error?.message}
          file={fileQuery.data}
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
          file={fileQuery.data}
          isSubmitting={addCommentMutation.isPending}
          onAddComment={(input) => addCommentMutation.mutateAsync(input)}
          onReopen={(commentId, reason) => reopenCommentMutation.mutateAsync({ commentId, reason })}
          onResolve={(commentId, resolution) => resolveCommentMutation.mutateAsync({ commentId, resolution })}
          selectedDiffBlockId={selectedDiffBlockId}
          sourceRange={sourceRange}
          version={selectedVersion}
          versionComments={commentsQuery.data ?? []}
        />
        <DecisionPanel
          commit={commitQuery.data}
          error={proposeDecisionMutation.error?.message ?? finalizeDecisionMutation.error?.message}
          file={fileQuery.data}
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
          file={fileQuery.data}
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
