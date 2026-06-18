import { FileDiff } from "lucide-react";
import type { DiffBlockRead, ReviewFileRead } from "@/entities/review/types";

type DiffReviewPaneProps = {
  file: ReviewFileRead | undefined;
  diffBlocks: DiffBlockRead[];
};

export function DiffReviewPane({ diffBlocks, file }: DiffReviewPaneProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileDiff className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-950">{file?.path ?? "Diff Review"}</h2>
            <p className="text-xs text-slate-500">{diffBlocks.length} diff blocks</p>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {file === undefined ? <EmptyState>Select a file to inspect changes.</EmptyState> : null}
        {file !== undefined && diffBlocks.length === 0 ? (
          <EmptyState>This file has no structured diff blocks.</EmptyState>
        ) : null}
        <div className="grid gap-4">
          {diffBlocks.map((block, index) => (
            <DiffBlockCard block={block} index={index} key={block.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">{children}</div>
  );
}

function DiffBlockCard({ block, index }: { block: DiffBlockRead; index: number }) {
  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <div className="min-w-0 text-sm font-semibold text-slate-900">
          {block.heading ?? `Block ${index + 1}`}
        </div>
        <div className="shrink-0 font-mono text-xs text-slate-500">
          -{lineRange(block.oldStartLine, block.oldEndLine)} / +
          {lineRange(block.newStartLine, block.newEndLine)}
        </div>
      </div>
      <pre className="max-h-[520px] overflow-auto bg-slate-950 p-3 text-xs leading-5 text-slate-100">
        {patchRows(block).map(({ key, line }) => (
          <code className={lineClassName(line)} key={key}>
            {line}
            {"\n"}
          </code>
        ))}
      </pre>
    </article>
  );
}

function patchRows(block: DiffBlockRead): Array<{ key: string; line: string }> {
  const occurrences = new Map<string, number>();
  return block.patch.split("\n").map((line) => {
    const count = occurrences.get(line) ?? 0;
    occurrences.set(line, count + 1);
    return { key: `${block.id}:${count}:${line}`, line };
  });
}

function lineRange(start: number | null, end: number | null): string {
  if (start === null || end === null) {
    return "?";
  }
  return start === end ? start.toString() : `${start}-${end}`;
}

function lineClassName(line: string): string {
  if (line.startsWith("+")) {
    return "block text-emerald-300";
  }
  if (line.startsWith("-")) {
    return "block text-red-300";
  }
  if (line.startsWith("@@")) {
    return "block text-sky-300";
  }
  return "block text-slate-300";
}
