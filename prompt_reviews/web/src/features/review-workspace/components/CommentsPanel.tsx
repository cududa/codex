import { FileCode2, FileDiff, GitCommit, LocateFixed, MessageSquarePlus, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CommentDetail,
  CommentLocation,
  CommentSummary,
  CommitDetail,
  CommitFileDetail,
  ReviewEntityScope,
  SourceAnchor,
  VersionSummary,
} from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/TextArea";
import type { ReviewCommentTarget } from "../model/commentTargets";
import { targetLabel, targetToCommentInput } from "../model/commentTargets";

type CommentsPanelProps = {
  version: VersionSummary | undefined;
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  versionComments: CommentDetail[];
  commentTarget: ReviewCommentTarget | null;
  isSubmitting: boolean;
  actionError?: string;
  onAddComment: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => Promise<unknown>;
  onLocateComment: (comment: CommentDetail) => void;
  onResolve: (commentId: string) => Promise<unknown>;
  onReopen: (commentId: string) => Promise<unknown>;
};

type CommentDisplay = CommentSummary & Partial<Pick<CommentDetail, "anchor" | "location" | "updatedAt">>;
type CommentFilter = "selection" | "version";

export function CommentsPanel({
  version,
  commit,
  file,
  versionComments,
  commentTarget,
  isSubmitting,
  actionError,
  onAddComment,
  onLocateComment,
  onResolve,
  onReopen,
}: CommentsPanelProps) {
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState<CommentFilter>("selection");
  const comments: CommentDisplay[] = useMemo(
    () => uniqueComments([...(file?.review.comments ?? []), ...(commit?.comments ?? []), ...versionComments]),
    [commit?.comments, file?.review.comments, versionComments],
  );
  const broadTarget = broadCommentTarget({ versionId: version?.id, commitId: commit?.id, fileId: file?.id });
  const submissionTarget = broadTarget === null ? null : targetToCommentInput(broadTarget);
  const canSubmit = submissionTarget !== null && body.trim().length > 0 && !isSubmitting;
  const selectionLabel = commentTarget === null ? focusLabel({ version, commit, file }) : targetLabel(commentTarget);
  const selectionComments = useMemo(
    () =>
      comments.filter((comment) =>
        isInSelectedContext(comment, {
          commitId: commit?.id,
          commentTarget,
          fileId: file?.id,
          versionId: version?.id,
        }),
      ),
    [comments, commit?.id, commentTarget, file?.id, version?.id],
  );
  const visibleComments = filter === "selection" ? selectionComments : comments;

  return (
    <section className="grid gap-3 border-b border-slate-200 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">Comments</h2>
        <p className="text-xs text-slate-500">
          {visibleComments.filter((comment) => comment.status === "open").length} unresolved / {visibleComments.length} shown
        </p>
      </div>
      <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
        <button className={filterButtonClass(filter === "selection")} onClick={() => setFilter("selection")} type="button">
          {selectionLabel} ({selectionComments.length})
        </button>
        <button className={filterButtonClass(filter === "version")} onClick={() => setFilter("version")} type="button">
          All version ({comments.length})
        </button>
      </div>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit || submissionTarget === null) {
            return;
          }
          void onAddComment({ ...submissionTarget, body: body.trim() }).then(() => setBody(""));
        }}
      >
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          {broadTarget === null ? "Select a version, commit, or file" : `Add ${targetLabel(broadTarget).toLowerCase()}`}
        </div>
        <TextArea
          className="min-h-20"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a general comment"
          value={body}
        />
        <Button disabled={!canSubmit} type="submit">
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          Add comment
        </Button>
      </form>
      {actionError === undefined ? null : <div className="text-sm text-red-700">{actionError}</div>}
      <div className="grid gap-2">
        {visibleComments.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            No comments in the selected scope.
          </div>
        ) : (
          visibleComments.map((comment) => (
            <article className="overflow-hidden rounded-md border border-slate-200 bg-white" key={comment.id}>
              <button
                className="grid w-full gap-2 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-white"
                disabled={comment.location === undefined}
                onClick={() => onLocateComment(comment as CommentDetail)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700">
                      {comment.location === undefined ? null : (
                        <LocateFixed className="size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                      )}
                      <span className="truncate">{commentTitle(comment)}</span>
                    </div>
                    <div className="mt-1 grid gap-1 text-[11px] text-slate-500">{commentLocationRows(comment)}</div>
                  </div>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {comment.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-950">{comment.body}</p>
              </button>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-xs text-slate-500">{actorLabel(comment.author)}</span>
                {comment.status === "open" ? (
                  <Button
                    className="h-8"
                    onClick={() => onResolve(comment.id)}
                    type="button"
                    variant="secondary"
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Resolve
                  </Button>
                ) : (
                  <Button
                    className="h-8"
                    onClick={() => onReopen(comment.id)}
                    type="button"
                    variant="secondary"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Reopen
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function broadCommentTarget(input: {
  versionId: string | undefined;
  commitId: string | undefined;
  fileId: string | undefined;
}): ReviewCommentTarget | null {
  if (input.fileId !== undefined) {
    return { kind: "file", commitFileId: input.fileId };
  }
  if (input.commitId !== undefined) {
    return { kind: "commit", commitId: input.commitId };
  }
  if (input.versionId !== undefined) {
    return { kind: "version", versionId: input.versionId };
  }
  return null;
}

function uniqueComments(comments: CommentDisplay[]): CommentDisplay[] {
  return [...new Map(comments.map((comment) => [comment.id, comment])).values()].sort(
    (left, right) => left.createdAt - right.createdAt,
  );
}

function actorLabel(actor: CommentDisplay["author"]): string {
  return actor.displayName ?? actor.id ?? actor.type;
}

function filterButtonClass(selected: boolean): string {
  return selected
    ? "rounded bg-white px-2 py-1 text-slate-950 shadow-sm"
    : "rounded px-2 py-1 text-slate-500 hover:text-slate-800";
}

function isInSelectedContext(
  comment: CommentDisplay,
  selection: {
    versionId: string | undefined;
    commitId: string | undefined;
    fileId: string | undefined;
    commentTarget: ReviewCommentTarget | null;
  },
): boolean {
  if (selection.commentTarget?.kind === "block") {
    return (
      comment.location?.diffBlock?.id === selection.commentTarget.diffBlockId ||
      (comment.scope.type === "diff_block" && comment.scope.diffBlockId === selection.commentTarget.diffBlockId)
    );
  }
  if (selection.commentTarget?.kind === "line" || selection.commentTarget?.kind === "range") {
    if (comment.anchor?.kind !== "range") {
      return false;
    }
    const targetStart = selection.commentTarget.kind === "line" ? selection.commentTarget.line : selection.commentTarget.startLine;
    const targetEnd = selection.commentTarget.kind === "line" ? selection.commentTarget.line : selection.commentTarget.endLine;
    return (
      comment.anchor.commitFileId === selection.commentTarget.commitFileId &&
      comment.anchor.side === selection.commentTarget.side &&
      comment.anchor.startLine <= targetEnd &&
      comment.anchor.endLine >= targetStart
    );
  }
  if (selection.fileId !== undefined) {
    return (
      comment.location?.file?.id === selection.fileId ||
      (comment.scope.type === "commit_file" && comment.scope.commitFileId === selection.fileId)
    );
  }
  if (selection.commitId !== undefined) {
    return (
      comment.location?.commit?.id === selection.commitId ||
      (comment.scope.type === "commit" && comment.scope.commitId === selection.commitId)
    );
  }
  return comment.scope.type === "version" && comment.scope.versionId === selection.versionId;
}

function commentTitle(comment: CommentDisplay): string {
  if (comment.location?.file !== undefined) {
    return comment.location.file.path;
  }
  if (comment.location?.commit !== undefined) {
    return shortSha(comment.location.commit.sha);
  }
  return scopeLabel(comment.scope);
}

function commentLocationRows(comment: CommentDisplay) {
  const location = comment.location;
  if (location === undefined) {
    return <span>{scopeLabel(comment.scope)}</span>;
  }
  return (
    <>
      {location.commit === undefined ? null : (
        <span className="flex min-w-0 items-center gap-1">
          <GitCommit className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {shortSha(location.commit.sha)} · {location.commit.title}
          </span>
        </span>
      )}
      {location.file === undefined ? null : (
        <span className="flex min-w-0 items-center gap-1">
          <FileCode2 className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{location.file.path}</span>
        </span>
      )}
      {location.diffBlock === undefined ? null : (
        <span className="flex min-w-0 items-center gap-1">
          <FileDiff className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {location.diffBlock.heading ?? "Diff block"} ·{" "}
            {lineRange(location.diffBlock.oldStartLine, location.diffBlock.oldEndLine, "-")} /{" "}
            {lineRange(location.diffBlock.newStartLine, location.diffBlock.newEndLine, "+")}
          </span>
        </span>
      )}
      {comment.anchor?.kind === "range" ? (
        <span>
          {comment.anchor.side === "old" ? "Old" : "New"} lines {comment.anchor.startLine}-{comment.anchor.endLine}
        </span>
      ) : null}
    </>
  );
}

function focusLabel(input: {
  version: VersionSummary | undefined;
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
}): string {
  if (input.file !== undefined) {
    return "File";
  }
  if (input.commit !== undefined) {
    return "Commit";
  }
  if (input.version !== undefined) {
    return "Version";
  }
  return "Selection";
}

function scopeLabel(scope: CommentDisplay["scope"]): string {
  return scope.type.replaceAll("_", " ");
}

function shortSha(sha: string): string {
  return sha.slice(0, 10);
}

function lineRange(start: number | undefined, end: number | undefined, prefix: string): string {
  if (start === undefined || end === undefined) {
    return `${prefix}?`;
  }
  return start === end ? `${prefix}${start}` : `${prefix}${start}-${end}`;
}
