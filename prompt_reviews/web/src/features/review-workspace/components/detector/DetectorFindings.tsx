import { AlertTriangle, CircleAlert, FileSearch } from "lucide-react";
import type { ReactNode } from "react";
import type { DetectorFinding, DetectorFindingSummary } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type DetectorSummaryChipsProps = {
  summaries: readonly DetectorFindingSummary[];
};

type DetectorFindingPanelProps = {
  findings: readonly DetectorFinding[];
  title: string;
  variant?: "panel" | "band";
};

export function DetectorSummaryChips({ summaries }: DetectorSummaryChipsProps) {
  if (summaries.length === 0) {
    return null;
  }

  const totalCount = summaries.reduce((total, summary) => total + summary.count, 0);
  const concernSlugs = unique(summaries.map((summary) => summary.concernSlug));
  const evidenceSummary = summaries.flatMap((summary) => summary.evidenceSummaries)[0];

  return (
    <>
      <SignalChip tone="detector" icon={<AlertTriangle className="size-3" aria-hidden="true" />}>
        {totalCount} {totalCount === 1 ? "finding" : "findings"}
      </SignalChip>
      <SignalChip>{compactConcernList(concernSlugs)}</SignalChip>
      {evidenceSummary === undefined ? null : <SignalChip>{evidenceSummary}</SignalChip>}
    </>
  );
}

export function DetectorFindingPanel({ findings, title, variant = "panel" }: DetectorFindingPanelProps) {
  if (findings.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        variant === "panel"
          ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
          : "border-b border-amber-200 bg-amber-50 px-3 py-2",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-950">
        <CircleAlert className="size-3.5" aria-hidden="true" />
        <span>{title}</span>
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900">
          {findings.length} {findings.length === 1 ? "finding" : "findings"}
        </span>
      </div>
      <ul className="grid gap-2">
        {findings.map((finding) => (
          <li className="grid gap-1 border-t border-amber-200 pt-2 first:border-t-0 first:pt-0" key={finding.findingKey}>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-amber-950">
              <SignalChip tone="detector">{finding.concernSlug}</SignalChip>
              <SignalChip>{finding.evidenceKind.replaceAll("_", " ")}</SignalChip>
              {lineLabel(finding) === undefined ? null : <SignalChip>{lineLabel(finding)}</SignalChip>}
            </div>
            <p className="text-xs font-medium text-slate-950">{finding.summary}</p>
            <FindingMetadata finding={finding} />
            <FindingEvidence finding={finding} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FindingMetadata({ finding }: { finding: DetectorFinding }) {
  const metadata = [
    ["path", finding.path],
    ["symbol", finding.symbol],
    ["marker", finding.marker],
    ["node", finding.graphNodeKey],
  ].filter((item): item is [string, string] => item[1] !== null && item[1] !== undefined);

  if (metadata.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
      <FileSearch className="size-3 text-slate-500" aria-hidden="true" />
      {metadata.map(([label, value]) => (
        <span className="max-w-full truncate rounded bg-white/80 px-1.5 py-0.5" key={`${label}:${value}`}>
          {label}: {value}
        </span>
      ))}
    </div>
  );
}

function FindingEvidence({ finding }: { finding: DetectorFinding }) {
  const evidence = finding.evidence.slice(0, 2);
  if (evidence.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-1 text-[11px] leading-4 text-slate-600">
      {evidence.map((item) => (
        <li key={`${item.nodeKey ?? item.path ?? item.symbol ?? item.marker ?? "evidence"}`}>
          {item.symbol === undefined ? null : item.symbol}
          {item.marker === undefined ? null : ` · ${item.marker}`}
          {item.path === undefined ? null : ` · ${item.path}`}
        </li>
      ))}
    </ul>
  );
}

function SignalChip({
  children,
  icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "detector" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5",
        tone === "detector" && "bg-amber-100 text-amber-900",
        tone === "warn" && "bg-red-100 text-red-800",
        tone === "neutral" && "bg-slate-100 text-slate-700",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function compactConcernList(concernSlugs: readonly string[]): string {
  if (concernSlugs.length <= 2) {
    return concernSlugs.join(", ");
  }
  return `${concernSlugs.slice(0, 2).join(", ")} +${concernSlugs.length - 2}`;
}

function lineLabel(finding: DetectorFinding): string | undefined {
  if (finding.side === null || finding.startLine === null || finding.endLine === null) {
    return undefined;
  }
  const prefix = finding.side === "old" ? "-" : "+";
  return finding.startLine === finding.endLine
    ? `${prefix}${finding.startLine}`
    : `${prefix}${finding.startLine}-${finding.endLine}`;
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}
