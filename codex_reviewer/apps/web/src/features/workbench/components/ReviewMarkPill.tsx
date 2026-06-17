import type { ReviewMark, ReviewMarkDefinition } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { reviewMarkLabel, reviewMarkTone } from "../model/workbenchView";

type ReviewMarkPillProps = {
  mark: ReviewMark | null;
  definitions: ReviewMarkDefinition[];
  compact?: boolean;
};

export function ReviewMarkPill({ compact = false, definitions, mark }: ReviewMarkPillProps) {
  const tone = reviewMarkTone(mark);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-semibold",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        tone === "pass" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "done" && "border-sky-200 bg-sky-50 text-sky-800",
        tone === "flag" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "modify" && "border-rose-200 bg-rose-50 text-rose-800",
        tone === "unset" && "border-slate-200 bg-slate-50 text-slate-500",
      )}
    >
      {reviewMarkLabel(mark, definitions)}
    </span>
  );
}
