import { CheckCircle2, ClipboardList, FileCode2, GitBranch } from "lucide-react";
import type {
  ConcernArea,
  ReviewCommitRead,
  ReviewFileRead,
  ReviewMarkDefinition,
  ReviewVersionRead,
} from "@/entities/review/types";
import { Panel } from "@/shared/ui/Panel";
import { concernAreaSummary } from "../model/workbenchView";
import { ReviewMarkPill } from "./ReviewMarkPill";

type ReviewPanelProps = {
  version: ReviewVersionRead | undefined;
  commit: ReviewCommitRead | undefined;
  file: ReviewFileRead | undefined;
  concernAreas: ConcernArea[];
  reviewMarks: ReviewMarkDefinition[];
};

export function ReviewPanel({ commit, concernAreas, file, reviewMarks, version }: ReviewPanelProps) {
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
          <div className="mt-3">
            <ReviewMarkPill definitions={reviewMarks} mark={commit?.reviewMark ?? null} />
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
            {concernAreas.map((area) => (
              <label className="flex items-start gap-2 text-sm" key={area.slug}>
                <input
                  checked={commit?.concernAreas.includes(area.slug) ?? false}
                  className="mt-1"
                  readOnly
                  type="checkbox"
                />
                <span>
                  <span className="block font-medium text-slate-900">{area.label}</span>
                  <span className="block text-xs leading-5 text-slate-500">{area.description}</span>
                </span>
              </label>
            ))}
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
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{file.changeKind}</span>
              <span>{file.diffBlocks.length} diff blocks</span>
              <ReviewMarkPill compact definitions={reviewMarks} mark={file.reviewMark} />
            </div>
          )}
        </Panel>
      </div>
    </aside>
  );
}
