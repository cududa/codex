import { Bot, CheckCircle2, ClipboardList, FileCode2, GitBranch } from "lucide-react";
import { maxSelectedConcernAreas } from "@prompt-reviews/contracts";
import type {
  ConcernArea,
  ConcernAreaSlug,
  ExplicitFileReviewMark,
  ReviewCommitRead,
  ReviewFileRead,
  ReviewMark,
  ReviewMarkDefinition,
  ReviewVersionRead,
} from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { concernAreaSummary, toggleConcernAreaSelection } from "../model/workbenchView";
import { ReviewMarkPill } from "./ReviewMarkPill";

type ReviewPanelProps = {
  version: ReviewVersionRead | undefined;
  commit: ReviewCommitRead | undefined;
  file: ReviewFileRead | undefined;
  concernAreas: ConcernArea[];
  reviewMarks: ReviewMarkDefinition[];
  pending: boolean;
  onCommitReviewMarkChange: (reviewMark: ReviewMark) => void;
  onFileReviewMarkChange: (reviewMark: ExplicitFileReviewMark) => void;
  onCommitConcernAreasChange: (concernAreas: ConcernAreaSlug[]) => void;
};

export function ReviewPanel({
  commit,
  concernAreas,
  file,
  onCommitConcernAreasChange,
  onCommitReviewMarkChange,
  onFileReviewMarkChange,
  pending,
  reviewMarks,
  version,
}: ReviewPanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 py-3 pl-12 pr-4">
        <h2 className="text-xs font-semibold uppercase text-slate-600">Review</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <GitBranch className="size-4 text-slate-500" aria-hidden="true" />
            Version
          </div>
          <div className="mt-3 text-sm text-slate-700">
            {version === undefined ? "No review version selected" : version.label}
          </div>
          {version === undefined ? null : (
            <div className="mt-2 font-mono text-xs text-slate-500">
              {version.baseRef ?? version.baseSha ?? "unknown"} {"->"}{" "}
              {version.targetRef ?? version.targetSha ?? "unknown"}
            </div>
          )}
        </Panel>

        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <CheckCircle2 className="size-4 text-slate-500" aria-hidden="true" />
            Review Mark
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ReviewMarkPill definitions={reviewMarks} mark={commit?.reviewMark ?? null} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {reviewMarks.map((definition) => (
              <button
                className={cn(
                  "h-8 rounded border px-2 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-50",
                  commit?.reviewMark === definition.mark
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                )}
                disabled={commit === undefined || pending}
                key={definition.mark}
                onClick={() => onCommitReviewMarkChange(definition.mark)}
                type="button"
              >
                {definition.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ClipboardList className="size-4 text-slate-500" aria-hidden="true" />
            Concern Areas
          </div>
          <div className="mt-3 text-sm text-slate-700">
            {commit === undefined ? "Select a commit" : concernAreaSummary(commit.concernAreas, concernAreas)}
          </div>
          <div className="mt-3 grid gap-2">
            {concernAreas.map((area) => {
              const checked = commit?.concernAreas.includes(area.slug) ?? false;
              const maxReached =
                commit !== undefined && !checked && commit.concernAreas.length >= maxSelectedConcernAreas;
              return (
                <label
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    (commit === undefined || pending || maxReached) && "opacity-60",
                  )}
                  key={area.slug}
                >
                  <input
                    checked={checked}
                    className="mt-1"
                    disabled={commit === undefined || pending || maxReached}
                    onChange={(event) => {
                      if (commit === undefined) {
                        return;
                      }
                      onCommitConcernAreasChange(
                        toggleConcernAreaSelection(commit.concernAreas, area.slug, event.target.checked),
                      );
                    }}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{area.label}</span>
                    <span className="block text-xs leading-5 text-slate-500">{area.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <FileCode2 className="size-4 text-slate-500" aria-hidden="true" />
            Selected File
          </div>
          <div className="mt-3 text-sm text-slate-700">
            {file === undefined ? "Select a file" : file.path}
          </div>
          {file === undefined ? null : (
            <>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>{file.changeKind}</span>
                <span>{file.diffBlocks.length} diff blocks</span>
                <ReviewMarkPill compact definitions={reviewMarks} mark={file.reviewMark} />
              </div>
              <label className="mt-3 grid gap-1 text-xs font-semibold text-slate-600">
                Review Mark
                <select
                  className="h-9 rounded border border-slate-300 bg-white px-2 text-sm font-normal text-slate-900 disabled:opacity-50"
                  disabled={pending}
                  onChange={(event) => {
                    const value = event.target.value;
                    onFileReviewMarkChange(value === "" ? null : (value as ReviewMark));
                  }}
                  value={file.reviewMark ?? ""}
                >
                  <option value="">No file mark</option>
                  {reviewMarks.map((definition) => (
                    <option key={definition.mark} value={definition.mark}>
                      {definition.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </Panel>

        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Bot className="size-4 text-slate-500" aria-hidden="true" />
            Agent Reviews
          </div>
          <div className="mt-3 grid gap-2">
            {commit === undefined && file === undefined ? (
              <div className="text-sm text-slate-700">Select a commit or file</div>
            ) : null}
            {commit?.agentReviews.map((review) => (
              <div className="rounded border border-slate-200 bg-slate-50 p-2" key={review.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-slate-700">
                    {review.reviewer.displayName ?? review.reviewer.id}
                  </span>
                  <ReviewMarkPill compact definitions={reviewMarks} mark={review.reviewedMark} />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {concernAreaSummary(review.reviewedConcernAreas, concernAreas)}
                </div>
                {review.notesMarkdown === null ? null : (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                    {review.notesMarkdown}
                  </p>
                )}
              </div>
            ))}
            {file?.agentReviews.map((review) => (
              <div className="rounded border border-slate-200 bg-slate-50 p-2" key={review.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-slate-700">
                    {review.reviewer.displayName ?? review.reviewer.id}
                  </span>
                  <ReviewMarkPill compact definitions={reviewMarks} mark={review.reviewedMark} />
                </div>
                {review.notesMarkdown === null ? null : (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                    {review.notesMarkdown}
                  </p>
                )}
              </div>
            ))}
            {commit !== undefined && file === undefined && commit.agentReviews.length === 0 ? (
              <div className="text-sm text-slate-700">No commit agent reviews</div>
            ) : null}
            {file !== undefined && file.agentReviews.length === 0 ? (
              <div className="text-sm text-slate-700">No file agent reviews</div>
            ) : null}
          </div>
        </Panel>
      </div>
    </aside>
  );
}
