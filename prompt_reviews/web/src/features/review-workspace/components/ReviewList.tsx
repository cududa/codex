import { FileText } from "lucide-react";
import type { ReviewSummary } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type ReviewListProps = {
  reviews: ReviewSummary[];
  selectedReviewPath: string | null;
  onSelect: (reviewPath: string) => void;
};

export function ReviewList({ reviews, selectedReviewPath, onSelect }: ReviewListProps) {
  return (
    <nav aria-label="Prompt reviews" className="flex min-h-0 flex-col overflow-y-auto">
      {reviews.map((review) => {
        const selected = review.reviewPath === selectedReviewPath;
        return (
          <button
            className={cn(
              "grid gap-1 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-100",
              selected && "bg-slate-100 shadow-[inset_3px_0_0_#0f172a]",
            )}
            key={review.reviewPath}
            onClick={() => onSelect(review.reviewPath)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-950">
              <FileText className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="truncate">{labelFor(review.reviewPath)}</span>
            </span>
            <span className="truncate text-xs text-slate-500">
              {review.bundle === undefined ? review.commit : `${review.bundle} / ${review.commit}`}
            </span>
            <span className="text-xs text-slate-500">
              {review.commentCount} comments · {formatBytes(review.bytes)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function labelFor(reviewPath: string): string {
  return reviewPath.split("/").at(-1)?.replace(".prompt-review.md", "") ?? reviewPath;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}
