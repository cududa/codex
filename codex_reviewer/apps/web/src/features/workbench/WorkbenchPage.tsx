import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { concernAreas as canonicalConcernAreas, reviewMarkDefinitions } from "@prompt-reviews/contracts";
import type { ReviewCommit } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { CommitQueue } from "./components/CommitQueue";
import { DiffReviewPane } from "./components/DiffReviewPane";
import { FileQueue } from "./components/FileQueue";
import { ResizableWorkbench } from "./components/ResizableWorkbench";
import { ReviewActionsPanel } from "./components/ReviewActionsPanel";
import { StatusPanel } from "./components/StatusPanel";
import { VersionRail } from "./components/VersionRail";
import { useWorkbenchData } from "./hooks/appData";
import {
  previewComments,
  previewCommits,
  previewDiffBlocksByFileId,
  previewFilesByCommitId,
  previewPlan,
} from "./model/previewReview";

export function WorkbenchPage() {
  const { health, metadata, reviewBootstrap } = useWorkbenchData();
  const [selectedCommitId, setSelectedCommitId] = useState<ReviewCommit["id"] | null>(previewCommits[0]?.id ?? null);
  const selectedCommit = previewCommits.find((commit) => commit.id === selectedCommitId) ?? previewCommits[0];
  const files = selectedCommit === undefined ? [] : (previewFilesByCommitId.get(selectedCommit.id) ?? []);
  const [selectedFileId, setSelectedFileId] = useState(files[0]?.id ?? null);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];
  const diffBlocks = selectedFile === undefined ? [] : (previewDiffBlocksByFileId.get(selectedFile.id) ?? []);
  const concernAreas = reviewBootstrap.data?.concernAreas ?? canonicalConcernAreas;
  const marks = reviewBootstrap.data?.reviewMarks ?? reviewMarkDefinitions;
  const visibleComments = useMemo(
    () =>
      previewComments.filter((comment) => {
        if (selectedFile !== undefined && comment.scope.type === "file" && comment.scope.fileId === selectedFile.id) {
          return true;
        }
        return selectedCommit !== undefined && comment.scope.type === "commit" && comment.scope.commitId === selectedCommit.id;
      }),
    [selectedCommit, selectedFile],
  );
  const error = health.error?.message ?? metadata.error?.message ?? reviewBootstrap.error?.message;

  useEffect(() => {
    setSelectedFileId(files[0]?.id ?? null);
  }, [files]);

  return (
    <main className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] bg-slate-100 text-slate-950">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div>
          <h1 className="text-base font-semibold text-slate-950">Codex Reviewer</h1>
          <p className="text-xs text-slate-500">Contracts-first workspace foundation</p>
        </div>
        <Button
          onClick={() => {
            void health.refetch();
            void metadata.refetch();
            void reviewBootstrap.refetch();
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
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <StatusPanel health={health.data} metadata={metadata.data} />
          </div>
          <ResizableWorkbench
            versionRail={<VersionRail commits={previewCommits} />}
            commitQueue={
              <CommitQueue
                commits={previewCommits}
                concernAreas={concernAreas}
                onSelect={setSelectedCommitId}
                reviewMarks={marks}
                selectedCommitId={selectedCommit?.id ?? null}
              />
            }
            fileQueue={
              <FileQueue files={files} onSelect={setSelectedFileId} reviewMarks={marks} selectedFileId={selectedFile?.id ?? null} />
            }
            diffReview={<DiffReviewPane diffBlocks={diffBlocks} file={selectedFile} />}
            reviewActions={
              <ReviewActionsPanel
                comments={visibleComments}
                commit={selectedCommit}
                concernAreas={concernAreas}
                plan={previewPlan}
                reviewMarks={marks}
              />
            }
          />
        </div>
      </section>
    </main>
  );
}
