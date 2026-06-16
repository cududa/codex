import { FileDiff } from "lucide-react";
import type { CommitFileDetail } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type DiffBlockViewerProps = {
  file: CommitFileDetail;
  selectedDiffBlockId: string | null;
  onSelectDiffBlock: (diffBlockId: string) => void;
};

export function DiffBlockViewer({ file, selectedDiffBlockId, onSelectDiffBlock }: DiffBlockViewerProps) {
  if (file.diffBlocks.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
        This file has no structured diff blocks.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {file.diffBlocks.map((block, index) => {
        const selected = block.id === selectedDiffBlockId;
        return (
          <article
            className={cn(
              "overflow-hidden rounded-md border bg-white",
              selected ? "border-slate-700 shadow-[0_0_0_2px_rgba(51,65,85,0.18)]" : "border-slate-200",
            )}
            key={block.id}
          >
            <button
              className="flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => onSelectDiffBlock(block.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileDiff className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate text-sm font-semibold text-slate-900">
                  {block.heading ?? `Block ${index + 1}`}
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {lineRange(block.oldStartLine, block.oldEndLine, "-")} /{" "}
                {lineRange(block.newStartLine, block.newEndLine, "+")}
              </span>
            </button>
            <pre className="overflow-x-auto p-0 font-mono text-xs leading-5">
              {block.patch.split("\n").map((line, lineIndex) => (
                <div
                  className={cn(
                    "min-w-max px-3",
                    line.startsWith("+") && "bg-emerald-50 text-emerald-900",
                    line.startsWith("-") && "bg-red-50 text-red-900",
                    line.startsWith("@") && "bg-slate-100 text-slate-700",
                  )}
                  key={`${block.id}-${lineIndex}`}
                >
                  {line.length === 0 ? " " : line}
                </div>
              ))}
            </pre>
          </article>
        );
      })}
    </div>
  );
}

function lineRange(start: number | undefined, end: number | undefined, prefix: string): string {
  if (start === undefined || end === undefined) {
    return `${prefix}?`;
  }
  return start === end ? `${prefix}${start}` : `${prefix}${start}-${end}`;
}
