import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import type { TextSelection } from "@/entities/review/types";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/TextArea";

type CommentComposerProps = {
  selection: TextSelection | null;
  isSubmitting: boolean;
  onSubmit: (body: string) => Promise<void>;
};

export function CommentComposer({ selection, isSubmitting, onSubmit }: CommentComposerProps) {
  const [body, setBody] = useState("");
  const canSubmit = selection !== null && body.trim().length > 0 && !isSubmitting;

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        void onSubmit(body.trim()).then(() => setBody(""));
      }}
    >
      <div className="grid gap-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Selected anchor
        </div>
        <div className="min-h-16 rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-700">
          {selection === null ? (
            <span className="font-sans text-slate-400">Select review text to anchor a comment.</span>
          ) : (
            <span className="line-clamp-4 whitespace-pre-wrap">{selection.text}</span>
          )}
        </div>
      </div>
      <TextArea
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a review note anchored to the selected text..."
        value={body}
      />
      <Button className="justify-self-end" disabled={!canSubmit} type="submit">
        <MessageSquarePlus className="size-4" aria-hidden="true" />
        Add comment
      </Button>
    </form>
  );
}
