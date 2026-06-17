import { FileCode2, MessageSquare, MoveRight } from "lucide-react";
import type { ReviewFile, ReviewMarkDefinition } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";
import { changeSymbol, changeTone } from "../model/workbenchView";
import { ReviewMarkPill } from "./ReviewMarkPill";

type FileQueueProps = {
  files: ReviewFile[];
  reviewMarks: ReviewMarkDefinition[];
  selectedFileId: ReviewFile["id"] | null;
  onSelect: (fileId: ReviewFile["id"]) => void;
};

export function FileQueue({ files, onSelect, reviewMarks, selectedFileId }: FileQueueProps) {
  return (
    <section className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase text-slate-600">Files</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {files.length === 0 ? <div className="p-3 text-sm text-slate-500">Select a commit to see files.</div> : null}
        {files.map((file) => {
          const selected = file.id === selectedFileId;
          return (
            <button
              className={cn(
                "grid w-full gap-2 border-b border-slate-200 px-3 py-3 text-left transition hover:bg-slate-50",
                selected && "bg-slate-100 shadow-[inset_3px_0_0_#475569]",
              )}
              key={file.id}
              onClick={() => onSelect(file.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileCode2 className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate text-sm font-medium text-slate-950">{file.path}</span>
              </span>
              {file.oldPath === undefined ? null : (
                <span className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                  <span className="truncate">{file.oldPath}</span>
                  <MoveRight className="size-3 shrink-0" aria-hidden="true" />
                </span>
              )}
              <span className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                <ChangeBadge changeKind={file.changeKind} />
                <ReviewMarkPill compact definitions={reviewMarks} mark={file.reviewMark} />
                {file.unresolvedCommentCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5">
                    <MessageSquare className="size-3" aria-hidden="true" />
                    {file.unresolvedCommentCount} open
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChangeBadge({ changeKind }: { changeKind: string }) {
  const tone = changeTone(changeKind);
  return (
    <span
      className={cn(
        "inline-flex min-w-6 justify-center rounded px-1.5 py-0.5 font-mono font-semibold",
        tone === "add" && "bg-emerald-100 text-emerald-700",
        tone === "modify" && "bg-green-950 text-green-100",
        tone === "delete" && "bg-red-100 text-red-700",
      )}
      title={changeKind}
    >
      {changeSymbol(changeKind)}
    </span>
  );
}
