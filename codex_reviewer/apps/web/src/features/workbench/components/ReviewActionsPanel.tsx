import { CheckCircle2, ClipboardList, MessageSquare, NotebookText } from "lucide-react";
import type {
  ConcernArea,
  ReviewCommit,
  ReviewMarkDefinition,
  ReviewPlan,
  ThreadedComment,
} from "@/entities/review/types";
import { Panel } from "@/shared/ui/Panel";
import { concernAreaSummary } from "../model/workbenchView";
import { ReviewMarkPill } from "./ReviewMarkPill";

type ReviewActionsPanelProps = {
  commit: ReviewCommit | undefined;
  concernAreas: ConcernArea[];
  comments: ThreadedComment[];
  plan: ReviewPlan;
  reviewMarks: ReviewMarkDefinition[];
};

export function ReviewActionsPanel({
  comments,
  commit,
  concernAreas,
  plan,
  reviewMarks,
}: ReviewActionsPanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 py-3 pl-12 pr-4">
        <h2 className="text-xs font-semibold uppercase text-slate-600">Review</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <CheckCircle2 className="size-4 text-slate-500" aria-hidden="true" />
            Mark
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
            <MessageSquare className="size-4 text-slate-500" aria-hidden="true" />
            Comments
          </div>
          <div className="mt-3 grid gap-2">
            {comments.length === 0 ? <div className="text-sm text-slate-500">No open threads.</div> : null}
            {comments.map((comment) => (
              <article className="rounded-md bg-slate-50 p-2 text-sm" key={comment.id}>
                <div className="text-xs font-medium text-slate-500">
                  {comment.author.displayName ?? comment.author.id}
                </div>
                <div className="mt-1 leading-5 text-slate-800">{comment.bodyMarkdown}</div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <NotebookText className="size-4 text-slate-500" aria-hidden="true" />
            Plan
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {plan.bodyMarkdown}
          </pre>
        </Panel>
      </div>
    </aside>
  );
}
