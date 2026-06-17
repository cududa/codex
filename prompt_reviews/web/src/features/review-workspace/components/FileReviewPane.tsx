import { MousePointerSquareDashed } from "lucide-react";
import type { CommitFileDetail, ReviewEntityScope, SourceAnchor } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { DetectorFindingPanel } from "./detector/DetectorFindings";
import { DiffBlockViewer } from "./DiffBlockViewer";
import type { ReviewCommentTarget } from "../model/commentTargets";

type FileReviewPaneProps = {
  file: CommitFileDetail | undefined;
  commentTarget: ReviewCommentTarget | null;
  isLoading: boolean;
  isSubmittingComment: boolean;
  error?: string;
  actionError?: string;
  onAddComment: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => Promise<unknown>;
  onCommentTargetChange: (target: ReviewCommentTarget | null) => void;
};

export function FileReviewPane({
  file,
  commentTarget,
  isLoading,
  isSubmittingComment,
  error,
  actionError,
  onAddComment,
  onCommentTargetChange,
}: FileReviewPaneProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
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
          disabled={commentTarget === null}
          onClick={() => onCommentTargetChange(null)}
          type="button"
          variant="secondary"
        >
          <MousePointerSquareDashed className="size-4" aria-hidden="true" />
          Clear selection
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
        {isLoading ? <div className="text-sm text-slate-500">Loading diff blocks...</div> : null}
        {error === undefined ? null : <div className="text-sm text-red-700">{error}</div>}
        {!isLoading && error === undefined && file === undefined ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Choose a commit file from the queue.
          </div>
        ) : null}
        {file === undefined ? null : (
          <div className="grid gap-4">
            <DetectorFindingPanel findings={file.detectorFindings} title="File detector findings" />
            <DiffBlockViewer
              actionError={actionError}
              commentTarget={commentTarget}
              file={file}
              isSubmitting={isSubmittingComment}
              onAddComment={onAddComment}
              onCommentTargetChange={onCommentTargetChange}
            />
          </div>
        )}
      </div>
    </section>
  );
}
