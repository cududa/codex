import { GitBranch, ShieldCheck } from "lucide-react";
import type { ReviewVersionRead } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type VersionRailProps = {
  versions: ReviewVersionRead[];
  selectedVersionId: ReviewVersionRead["id"] | null;
  onSelect: (versionId: ReviewVersionRead["id"]) => void;
};

export function VersionRail({ onSelect, selectedVersionId, versions }: VersionRailProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600">
          <GitBranch className="size-4" aria-hidden="true" />
          Versions
        </div>
        <div className="mt-2 text-sm font-semibold text-slate-950">Upstream reviews</div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="p-3 text-sm text-slate-500">No persisted review versions.</div>
        ) : null}
        {versions.map((version) => {
          const selected = version.id === selectedVersionId;
          const flagged = version.commits.filter((commit) => commit.reviewMark === "FLAG").length;
          const modifications = version.commits.filter((commit) => commit.reviewMark === "MODIFY").length;
          return (
            <button
              className={cn(
                "grid w-full gap-2 border-b border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50",
                selected && "bg-slate-100 shadow-[inset_3px_0_0_#334155]",
              )}
              key={version.id}
              onClick={() => onSelect(version.id)}
              type="button"
            >
              <span className="text-sm font-semibold text-slate-950">{version.label}</span>
              <span className="font-mono text-xs text-slate-500">{version.repositoryId}</span>
              <span className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                <Metric label="commits" value={version.commitCount.toString()} />
                <Metric label="flags" value={flagged.toString()} tone={flagged > 0 ? "warn" : "neutral"} />
                <Metric label="modify" value={modifications.toString()} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Ledger generation completes a version.
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "warn";
  value: string;
}) {
  return (
    <span
      className={cn("rounded bg-slate-100 px-1.5 py-0.5", tone === "warn" && "bg-amber-100 text-amber-800")}
    >
      {value} {label}
    </span>
  );
}
