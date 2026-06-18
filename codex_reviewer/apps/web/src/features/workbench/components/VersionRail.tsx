import { GitBranch, ShieldCheck } from "lucide-react";
import type { ReviewCommitRead } from "@/entities/review/types";

type VersionRailProps = {
  commits: ReviewCommitRead[];
};

export function VersionRail({ commits }: VersionRailProps) {
  const flagged = commits.filter((commit) => commit.reviewMark === "FLAG").length;
  const adaptations = commits.filter(
    (commit) => commit.reviewMark === "MODIFY" || commit.reviewMark === "DONE",
  ).length;

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600">
          <GitBranch className="size-4" aria-hidden="true" />
          Version
        </div>
        <div className="mt-2 text-sm font-semibold text-slate-950">Upstream review</div>
        <div className="mt-1 font-mono text-xs text-slate-500">feature-reviewer</div>
      </header>
      <div className="grid gap-2 p-3 text-sm">
        <Metric label="Commits" value={commits.length.toString()} />
        <Metric label="Open flags" value={flagged.toString()} tone={flagged > 0 ? "warn" : "neutral"} />
        <Metric label="Local work" value={adaptations.toString()} />
      </div>
      <div className="mt-auto border-t border-slate-200 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Human approval required before final ledger.
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={
          tone === "warn" ? "text-lg font-semibold text-amber-700" : "text-lg font-semibold text-slate-950"
        }
      >
        {value}
      </div>
    </div>
  );
}
