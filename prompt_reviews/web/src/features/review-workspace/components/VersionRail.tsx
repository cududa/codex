import { GitBranch, RefreshCw } from "lucide-react";
import type { RemainingWork, VersionSummary } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { RemainingWorkDashboard } from "./RemainingWorkDashboard";

type VersionRailProps = {
  versions: VersionSummary[];
  selectedVersionId: string | null;
  remainingWork: RemainingWork[];
  isLoading: boolean;
  error?: string;
  onRefresh: () => void;
  onSelect: (versionId: string) => void;
};

export function VersionRail({
  versions,
  selectedVersionId,
  remainingWork,
  isLoading,
  error,
  onRefresh,
  onSelect,
}: VersionRailProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold">Review Workbench</h1>
            <p className="text-xs text-slate-500">Open versions and unresolved workflow state</p>
          </div>
          <Button
            aria-label="Refresh versions"
            className="size-9 px-0"
            onClick={onRefresh}
            title="Refresh versions"
            type="button"
            variant="ghost"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <div className="p-4 text-sm text-slate-500">Loading versions...</div> : null}
        {error === undefined ? null : <div className="p-4 text-sm text-red-700">{error}</div>}
        {!isLoading && error === undefined && versions.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No open versions.</div>
        ) : null}
        <nav aria-label="Open versions">
          {versions.map((version) => {
            const selected = version.id === selectedVersionId;
            return (
              <button
                className={cn(
                  "grid w-full gap-2 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50",
                  selected && "bg-slate-100 shadow-[inset_3px_0_0_#0f172a]",
                )}
                key={version.id}
                onClick={() => onSelect(version.id)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GitBranch className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="truncate text-sm font-semibold text-slate-950">{version.label}</span>
                  <span className="ml-auto shrink-0 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {version.status}
                  </span>
                </span>
                <ProgressMeter
                  reviewed={version.progress.reviewedCommits}
                  total={version.progress.totalCommits}
                  label="commits"
                />
                <ProgressMeter
                  reviewed={version.progress.reviewedFiles}
                  total={version.progress.totalFiles}
                  label="files"
                />
                <span className="grid grid-cols-3 gap-1 text-[11px] text-slate-600">
                  <Metric label="comments" value={version.progress.unresolvedComments} />
                  <Metric label="decisions" value={version.progress.pendingDecisions} />
                  <Metric label="plans" value={version.progress.incompletePlans} />
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <RemainingWorkDashboard remainingWork={remainingWork} />
    </aside>
  );
}

function ProgressMeter({ reviewed, total, label }: { reviewed: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((reviewed / total) * 100);
  return (
    <span>
      <span className="mb-1 flex justify-between text-[11px] text-slate-600">
        <span>{label}</span>
        <span>
          {reviewed}/{total}
        </span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
        <span className="block h-full bg-slate-700" style={{ width: `${percent}%` }} />
      </span>
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded border border-slate-200 bg-white px-1.5 py-1 text-center">
      <span className="block font-semibold text-slate-900">{value}</span>
      <span className="block truncate">{label}</span>
    </span>
  );
}
