import { FileCode2, MessageSquare, MoveRight } from "lucide-react";
import type { CommitFileDetail, CommitFileQueueItem } from "@/entities/review/types";
import { cn } from "@/shared/lib/cn";

type FileQueueProps = {
  files: CommitFileQueueItem[];
  selectedFileId: string | null;
  selectedFile: CommitFileDetail | undefined;
  missingDecisionIds: Set<string>;
  isLoading: boolean;
  error?: string;
  onSelect: (fileId: string) => void;
};

export function FileQueue({
  files,
  selectedFileId,
  selectedFile,
  missingDecisionIds,
  isLoading,
  error,
  onSelect,
}: FileQueueProps) {
  return (
    <section className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Files</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <div className="p-3 text-sm text-slate-500">Loading files...</div> : null}
        {error === undefined ? null : <div className="p-3 text-sm text-red-700">{error}</div>}
        {!isLoading && error === undefined && files.length === 0 ? (
          <div className="p-3 text-sm text-slate-500">Select a commit to see changed files.</div>
        ) : null}
        {files.map((file) => {
          const selected = file.id === selectedFileId;
          const unresolvedComments =
            selected && selectedFile !== undefined
              ? selectedFile.review.comments.filter((comment) => comment.status === "open").length
              : 0;
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
                <Chip label={file.changeType.replaceAll("_", " ")} />
                <Chip label={file.status.replaceAll("_", " ")} />
                <Chip label={file.primaryTagSlug ?? "untagged"} />
                {missingDecisionIds.has(file.id) ? <Chip tone="warn" label="missing decision" /> : null}
                {unresolvedComments > 0 ? <Chip icon label={`${unresolvedComments} comments`} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ icon = false, label, tone = "neutral" }: { icon?: boolean; label: string; tone?: "neutral" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
        tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-slate-100",
      )}
    >
      {icon ? <MessageSquare className="size-3" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
