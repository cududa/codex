import { GitCommitHorizontal, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";
import type { ConcernArea, ReviewCommit, ReviewMarkDefinition } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { concernAreaSummary } from "../model/workbenchView";
import { ReviewMarkPill } from "./ReviewMarkPill";

type CommitQueueProps = {
  commits: ReviewCommit[];
  concernAreas: ConcernArea[];
  reviewMarks: ReviewMarkDefinition[];
  selectedCommitId: ReviewCommit["id"] | null;
  onSelect: (commitId: ReviewCommit["id"]) => void;
};

export function CommitQueue({ commits, concernAreas, onSelect, reviewMarks, selectedCommitId }: CommitQueueProps) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase text-slate-600">Commit Queue</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {commits.map((commit) => {
          const selected = commit.id === selectedCommitId;
          return (
            <button
              className={cn(
                "grid w-full gap-2 border-b border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50",
                selected && "bg-slate-100 shadow-[inset_3px_0_0_#334155]",
              )}
              key={commit.id}
              onClick={() => onSelect(commit.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <GitCommitHorizontal className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="font-mono text-xs text-slate-600">{commit.sha.slice(0, 10)}</span>
                <span className="ml-auto">
                  <ReviewMarkPill compact definitions={reviewMarks} mark={commit.reviewMark} />
                </span>
              </span>
              <span className="line-clamp-2 text-sm font-medium text-slate-950">{commit.title}</span>
              <span className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                <Chip label={concernAreaSummary(commit.concernAreas, concernAreas)} />
                <Chip label={`${commit.fileCount} files`} />
                {commit.unresolvedCommentCount > 0 ? (
                  <Chip icon={<MessageSquare className="size-3" aria-hidden="true" />} label={`${commit.unresolvedCommentCount} open`} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5">
      {icon}
      {label}
    </span>
  );
}
