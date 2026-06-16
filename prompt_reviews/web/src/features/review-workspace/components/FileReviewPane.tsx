import { MousePointerSquareDashed } from "lucide-react";
import type { CommitFileDetail, SourceRangeDraft } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { DiffBlockViewer } from "./DiffBlockViewer";
import { SourceRangeSelector } from "./SourceRangeSelector";

type FileReviewPaneProps = {
  file: CommitFileDetail | undefined;
  selectedDiffBlockId: string | null;
  sourceRange: SourceRangeDraft | null;
  isLoading: boolean;
  error?: string;
  onSelectDiffBlock: (diffBlockId: string | null) => void;
  onSourceRangeChange: (range: SourceRangeDraft | null) => void;
};

export function FileReviewPane({
  file,
  selectedDiffBlockId,
  sourceRange,
  isLoading,
  error,
  onSelectDiffBlock,
  onSourceRangeChange,
}: FileReviewPaneProps) {
  return (
    <section className="flex min-h-0 flex-col bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-950">
            {file === undefined ? "Structured Diff" : file.path}
          </h2>
          <p className="text-xs text-slate-500">
            {file === undefined ? "Select a file to review diff blocks." : `${file.diffBlocks.length} diff blocks`}
          </p>
        </div>
        <Button
          disabled={selectedDiffBlockId === null && sourceRange === null}
          onClick={() => {
            onSelectDiffBlock(null);
            onSourceRangeChange(null);
          }}
          type="button"
          variant="secondary"
        >
          <MousePointerSquareDashed className="size-4" aria-hidden="true" />
          Clear anchor
        </Button>
      </header>

      <SourceRangeSelector
        disabled={file === undefined}
        sourceRange={sourceRange}
        onChange={onSourceRangeChange}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
        {isLoading ? <div className="text-sm text-slate-500">Loading diff blocks...</div> : null}
        {error === undefined ? null : <div className="text-sm text-red-700">{error}</div>}
        {!isLoading && error === undefined && file === undefined ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Choose a commit file from the queue.
          </div>
        ) : null}
        {file === undefined ? null : (
          <DiffBlockViewer
            file={file}
            selectedDiffBlockId={selectedDiffBlockId}
            onSelectDiffBlock={onSelectDiffBlock}
          />
        )}
      </div>
    </section>
  );
}
