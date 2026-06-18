import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { concernAreas as canonicalConcernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import { setCommitConcernAreas, setCommitReviewMark, setFileReviewMark } from "@/entities/review/api";
import type {
  ConcernAreaSlug,
  ExplicitFileReviewMark,
  ReviewCommitRead,
  ReviewFileRead,
  ReviewMark,
  ReviewVersionRead,
} from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { CommitQueue } from "./components/CommitQueue";
import { DiffReviewPane } from "./components/DiffReviewPane";
import { FileQueue } from "./components/FileQueue";
import { ResizableWorkbench } from "./components/ResizableWorkbench";
import { ReviewPanel } from "./components/ReviewPanel";
import { StatusPanel } from "./components/StatusPanel";
import { VersionRail } from "./components/VersionRail";
import { useWorkbenchData } from "./hooks/appData";

export function WorkbenchPage() {
  const queryClient = useQueryClient();
  const { health, metadata, reviewBootstrap, reviewVersions } = useWorkbenchData();
  const versions = reviewVersions.data?.versions ?? [];
  const [selectedVersionId, setSelectedVersionId] = useState<ReviewVersionRead["id"] | null>(null);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null;
  const commits = selectedVersion?.commits ?? [];
  const [selectedCommitId, setSelectedCommitId] = useState<ReviewCommitRead["id"] | null>(null);
  const selectedCommit = commits.find((commit) => commit.id === selectedCommitId) ?? commits[0] ?? null;
  const files = selectedCommit?.files ?? [];
  const [selectedFileId, setSelectedFileId] = useState<ReviewFileRead["id"] | null>(null);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0] ?? null;
  const diffBlocks = selectedFile?.diffBlocks ?? [];
  const concernAreas = reviewBootstrap.data?.concernAreas ?? canonicalConcernAreas;
  const marks = reviewBootstrap.data?.reviewMarks ?? reviewMarkDefinitions;
  const invalidateReviewVersions = () =>
    queryClient.invalidateQueries({
      queryKey: ["review", "versions"],
    });
  const commitMarkMutation = useMutation({
    mutationFn: setCommitReviewMark,
    onSuccess: invalidateReviewVersions,
  });
  const fileMarkMutation = useMutation({
    mutationFn: setFileReviewMark,
    onSuccess: invalidateReviewVersions,
  });
  const concernAreasMutation = useMutation({
    mutationFn: setCommitConcernAreas,
    onSuccess: invalidateReviewVersions,
  });
  const error =
    health.error?.message ??
    metadata.error?.message ??
    reviewBootstrap.error?.message ??
    reviewVersions.error?.message ??
    commitMarkMutation.error?.message ??
    fileMarkMutation.error?.message ??
    concernAreasMutation.error?.message;
  const reviewStatePending =
    commitMarkMutation.isPending || fileMarkMutation.isPending || concernAreasMutation.isPending;

  useEffect(() => {
    setSelectedVersionId((current) =>
      current !== null && versions.some((version) => version.id === current)
        ? current
        : (versions[0]?.id ?? null),
    );
  }, [versions]);

  useEffect(() => {
    setSelectedCommitId((current) =>
      current !== null && commits.some((commit) => commit.id === current)
        ? current
        : (commits[0]?.id ?? null),
    );
  }, [commits]);

  useEffect(() => {
    setSelectedFileId((current) =>
      current !== null && files.some((file) => file.id === current) ? current : (files[0]?.id ?? null),
    );
  }, [files]);

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] bg-slate-100 text-slate-950">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div>
          <h1 className="text-base font-semibold text-slate-950">Codex Reviewer</h1>
          <p className="text-xs text-slate-500">
            Review upstream Codex changes before accepting them locally
          </p>
        </div>
        <Button
          onClick={() => {
            void health.refetch();
            void metadata.refetch();
            void reviewBootstrap.refetch();
            void reviewVersions.refetch();
          }}
          type="button"
          variant="secondary"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </header>
      <section className="min-h-0">
        {error === undefined ? null : (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <StatusPanel health={health.data} metadata={metadata.data} />
          </div>
          <ResizableWorkbench
            versionRail={
              <VersionRail
                onSelect={setSelectedVersionId}
                selectedVersionId={selectedVersion?.id ?? null}
                versions={versions}
              />
            }
            commitQueue={
              <CommitQueue
                commits={commits}
                concernAreas={concernAreas}
                onSelect={setSelectedCommitId}
                reviewMarks={marks}
                selectedCommitId={selectedCommit?.id ?? null}
              />
            }
            fileQueue={
              <FileQueue
                files={files}
                onSelect={setSelectedFileId}
                reviewMarks={marks}
                selectedFileId={selectedFile?.id ?? null}
              />
            }
            diffReview={<DiffReviewPane diffBlocks={diffBlocks} file={selectedFile ?? undefined} />}
            reviewPanel={
              <ReviewPanel
                commit={selectedCommit ?? undefined}
                concernAreas={concernAreas}
                file={selectedFile ?? undefined}
                onCommitConcernAreasChange={(nextConcernAreas: ConcernAreaSlug[]) => {
                  if (selectedCommit === null) {
                    return;
                  }
                  concernAreasMutation.mutate({
                    commitId: selectedCommit.id,
                    concernAreas: nextConcernAreas,
                  });
                }}
                onCommitReviewMarkChange={(reviewMark: ReviewMark) => {
                  if (selectedCommit === null) {
                    return;
                  }
                  commitMarkMutation.mutate({
                    commitId: selectedCommit.id,
                    reviewMark,
                  });
                }}
                onFileReviewMarkChange={(reviewMark: ExplicitFileReviewMark) => {
                  if (selectedFile === null) {
                    return;
                  }
                  fileMarkMutation.mutate({
                    fileId: selectedFile.id,
                    reviewMark,
                  });
                }}
                pending={reviewStatePending}
                reviewMarks={marks}
                version={selectedVersion ?? undefined}
              />
            }
          />
        </div>
      </section>
    </main>
  );
}
