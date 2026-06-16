import { Clock, GitCommitHorizontal } from "lucide-react";
import type { CommitDetail, VersionSummary } from "@/entities/review/types";

type VersionHeaderProps = {
  version: VersionSummary | undefined;
  commit: CommitDetail | undefined;
};

export function VersionHeader({ version, commit }: VersionHeaderProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-950">
          {version === undefined ? "Select a version" : version.label}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <GitCommitHorizontal className="size-3.5" aria-hidden="true" />
            {commit === undefined ? "No commit selected" : shortSha(commit.sha)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{commit?.title ?? "Pick a remaining commit to inspect files"}</span>
          </span>
        </div>
      </div>
      {version === undefined ? null : (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <Metric label="commits" value={`${version.progress.reviewedCommits}/${version.progress.totalCommits}`} />
          <Metric label="files" value={`${version.progress.reviewedFiles}/${version.progress.totalFiles}`} />
          <Metric label="comments" value={version.progress.unresolvedComments} />
          <Metric label="plans" value={version.progress.incompletePlans} />
        </div>
      )}
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="min-w-16 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
      <span className="block font-semibold text-slate-950">{value}</span>
      <span className="block text-slate-500">{label}</span>
    </span>
  );
}

function shortSha(sha: string): string {
  return sha.slice(0, 8);
}
