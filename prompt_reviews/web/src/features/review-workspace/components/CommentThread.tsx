import { MessageSquareText } from "lucide-react";
import type { ReviewComment } from "@/entities/review/types";

type CommentThreadProps = {
  comments: ReviewComment[];
};

export function CommentThread({ comments }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        No comments yet for this review.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {comments.map((comment) => (
        <article className="rounded-md border border-slate-200 bg-white p-3" key={comment.id}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <MessageSquareText className="size-4" aria-hidden="true" />
            <span className="font-medium text-slate-700">{comment.author}</span>
            <span>
              line {comment.anchor.startLine}
              {comment.blockId === undefined ? "" : ` · ${comment.blockId}`}
            </span>
          </div>
          <p className="mb-2 whitespace-pre-wrap text-sm text-slate-950">{comment.body}</p>
          <pre className="max-h-36 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-600">
            {comment.anchor.selectedText}
          </pre>
        </article>
      ))}
    </div>
  );
}
