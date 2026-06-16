import { MessageSquarePlus, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CommentDetail,
  CommentSummary,
  CommitDetail,
  CommitFileDetail,
  ReviewEntityScope,
  SourceAnchor,
  SourceRangeDraft,
  VersionSummary,
} from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/TextArea";

type CommentsPanelProps = {
  version: VersionSummary | undefined;
  commit: CommitDetail | undefined;
  file: CommitFileDetail | undefined;
  versionComments: CommentDetail[];
  selectedDiffBlockId: string | null;
  sourceRange: SourceRangeDraft | null;
  isSubmitting: boolean;
  actionError?: string;
  onAddComment: (input: { scope: ReviewEntityScope; anchor: SourceAnchor; body: string }) => Promise<unknown>;
  onResolve: (commentId: string, resolution: string) => Promise<unknown>;
  onReopen: (commentId: string, reason: string) => Promise<unknown>;
};

export function CommentsPanel({
  version,
  commit,
  file,
  versionComments,
  selectedDiffBlockId,
  sourceRange,
  isSubmitting,
  actionError,
  onAddComment,
  onResolve,
  onReopen,
}: CommentsPanelProps) {
  const [body, setBody] = useState("");
  const [resolution, setResolution] = useState("Resolved by human review.");
  const comments: CommentSummary[] = useMemo(
    () => uniqueComments([...(file?.review.comments ?? []), ...(commit?.comments ?? []), ...versionComments]),
    [commit?.comments, file?.review.comments, versionComments],
  );
  const target = commentTarget({ versionId: version?.id, commitId: commit?.id, fileId: file?.id, selectedDiffBlockId, sourceRange });
  const canSubmit = target !== null && body.trim().length > 0 && !isSubmitting;

  return (
    <section className="grid gap-3 border-b border-slate-200 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">Comments</h2>
        <p className="text-xs text-slate-500">
          {comments.filter((comment) => comment.status === "open").length} unresolved / {comments.length} total
        </p>
      </div>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit || target === null) {
            return;
          }
          void onAddComment({ ...target, body: body.trim() }).then(() => setBody(""));
        }}
      >
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          Anchor: {anchorLabel(target)}
        </div>
        <TextArea
          className="min-h-20"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a structured comment"
          value={body}
        />
        <Button disabled={!canSubmit} type="submit">
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          Add comment
        </Button>
      </form>
      <label className="grid gap-1 text-xs font-medium text-slate-600">
        Resolution note
        <input
          className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-950"
          onChange={(event) => setResolution(event.target.value)}
          value={resolution}
        />
      </label>
      {actionError === undefined ? null : <div className="text-sm text-red-700">{actionError}</div>}
      <div className="grid gap-2">
        {comments.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            No comments in the selected scope.
          </div>
        ) : (
          comments.map((comment) => (
            <article className="rounded-md border border-slate-200 p-3" key={comment.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{actorLabel(comment.author)}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{comment.status}</span>
              </div>
              <p className="mb-2 whitespace-pre-wrap text-sm text-slate-950">{comment.body}</p>
              {comment.status === "open" ? (
                <Button
                  className="h-8"
                  onClick={() => onResolve(comment.id, resolution.trim() || "Resolved by human review.")}
                  type="button"
                  variant="secondary"
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Resolve
                </Button>
              ) : (
                <Button
                  className="h-8"
                  onClick={() => onReopen(comment.id, "Reopened by human reviewer.")}
                  type="button"
                  variant="secondary"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reopen
                </Button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function commentTarget(input: {
  versionId: string | undefined;
  commitId: string | undefined;
  fileId: string | undefined;
  selectedDiffBlockId: string | null;
  sourceRange: SourceRangeDraft | null;
}): { scope: ReviewEntityScope; anchor: SourceAnchor } | null {
  if (input.fileId !== undefined && input.sourceRange !== null) {
    return {
      scope: { type: "commit_file", commitFileId: input.fileId },
      anchor: {
        kind: "range",
        commitFileId: input.fileId,
        side: input.sourceRange.side,
        startLine: input.sourceRange.startLine,
        endLine: input.sourceRange.endLine,
        selectedText: input.sourceRange.selectedText || undefined,
      },
    };
  }
  if (input.selectedDiffBlockId !== null) {
    return {
      scope: { type: "diff_block", diffBlockId: input.selectedDiffBlockId },
      anchor: { kind: "block", diffBlockId: input.selectedDiffBlockId },
    };
  }
  if (input.fileId !== undefined) {
    return { scope: { type: "commit_file", commitFileId: input.fileId }, anchor: { kind: "scope" } };
  }
  if (input.commitId !== undefined) {
    return { scope: { type: "commit", commitId: input.commitId }, anchor: { kind: "scope" } };
  }
  if (input.versionId !== undefined) {
    return { scope: { type: "version", versionId: input.versionId }, anchor: { kind: "scope" } };
  }
  return null;
}

function uniqueComments(comments: CommentSummary[]): CommentSummary[] {
  return [...new Map(comments.map((comment) => [comment.id, comment])).values()].sort(
    (left, right) => left.createdAt - right.createdAt,
  );
}

function actorLabel(actor: CommentSummary["author"]): string {
  return actor.displayName ?? actor.id ?? actor.type;
}

function anchorLabel(target: { anchor: SourceAnchor } | null): string {
  if (target === null) {
    return "select a version, commit, or file";
  }
  if (target.anchor.kind === "range") {
    return `${target.anchor.side} lines ${target.anchor.startLine}-${target.anchor.endLine}`;
  }
  if (target.anchor.kind === "block") {
    return "selected diff block";
  }
  return "selected scope";
}
