import { AlertCircle, CheckCircle2, GitCommitHorizontal, MessageSquare } from "lucide-react";
import type { CommitDetail, CommitQueueItem } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { DetectorSummaryChips } from "./detector/DetectorFindings";

type CommitQueueProps = {
  commits: CommitQueueItem[];
  selectedCommitId: string | null;
  selectedCommit: CommitDetail | undefined;
  missingDecisionIds: Set<string>;
  isLoading: boolean;
  error?: string;
  onSelect: (commitId: string) => void;
};

export function CommitQueue({
  commits,
  selectedCommitId,
  selectedCommit,
  missingDecisionIds,
  isLoading,
  error,
  onSelect,
}: CommitQueueProps) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Commit Queue</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <div className="p-3 text-sm text-slate-500">Loading commits...</div> : null}
        {error === undefined ? null : <div className="p-3 text-sm text-red-700">{error}</div>}
        {!isLoading && error === undefined && commits.length === 0 ? (
          <div className="p-3 text-sm text-slate-500">No remaining commits.</div>
        ) : null}
        {commits.map((commit) => {
          const selected = commit.id === selectedCommitId;
          const unresolvedComments =
            selected && selectedCommit !== undefined
              ? selectedCommit.comments.filter((comment) => comment.status === "open").length
              : 0;
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
                <span className="font-mono text-xs text-slate-600">{commit.sha.slice(0, 8)}</span>
                <StatusPill status={commit.status} />
              </span>
              <span className="line-clamp-2 text-sm font-medium text-slate-950">{commit.title}</span>
              <span className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                <Indicator label={commit.primaryTagSlug ?? "untagged"} />
                {missingDecisionIds.has(commit.id) ? <Indicator icon="alert" label="missing decision" /> : null}
                {unresolvedComments > 0 ? <Indicator icon="comment" label={`${unresolvedComments} comments`} /> : null}
                <Indicator label={`${commit.fileCount} files`} />
                <DetectorSummaryChips summaries={commit.detectorFindingSummaries} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="ml-auto rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-600">
      {status.replaceAll("_", " ")}
    </span>
  );
}

function Indicator({ icon, label }: { icon?: "alert" | "comment"; label: string }) {
  const Icon = icon === "alert" ? AlertCircle : icon === "comment" ? MessageSquare : CheckCircle2;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5">
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}
