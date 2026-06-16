import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { CommentComposer } from "./components/CommentComposer";
import { CommentThread } from "./components/CommentThread";
import { ReviewEditor } from "./components/ReviewEditor";
import { ReviewList } from "./components/ReviewList";
import {
  useAddReviewCommentMutation,
  useReviewCommentsQuery,
  useReviewFileQuery,
  useReviewsQuery,
} from "./hooks/reviewQueries";
import { useReviewWorkspaceStore } from "./model/reviewWorkspaceStore";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";

export function ReviewWorkspacePage() {
  const selectedReviewPath = useReviewWorkspaceStore((state) => state.selectedReviewPath);
  const selection = useReviewWorkspaceStore((state) => state.selection);
  const setSelectedReviewPath = useReviewWorkspaceStore((state) => state.setSelectedReviewPath);
  const setSelection = useReviewWorkspaceStore((state) => state.setSelection);

  const reviewsQuery = useReviewsQuery();
  const fileQuery = useReviewFileQuery(selectedReviewPath);
  const commentsQuery = useReviewCommentsQuery(selectedReviewPath);
  const addCommentMutation = useAddReviewCommentMutation(selectedReviewPath);

  useEffect(() => {
    if (selectedReviewPath !== null || reviewsQuery.data === undefined) {
      return;
    }
    const firstReview = reviewsQuery.data[0];
    if (firstReview !== undefined) {
      setSelectedReviewPath(firstReview.reviewPath);
    }
  }, [reviewsQuery.data, selectedReviewPath, setSelectedReviewPath]);

  const selectedReview = reviewsQuery.data?.find(
    (review) => review.reviewPath === selectedReviewPath,
  );

  return (
    <main className="grid h-screen min-h-[720px] grid-cols-[320px_minmax(0,1fr)_390px] bg-slate-100 text-slate-950">
      <Panel className="flex min-h-0 flex-col border-y-0 border-l-0">
        <header className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold">Prompt Reviews</h1>
              <p className="text-xs text-slate-500">Generated prompt diffs and anchored comments</p>
            </div>
            <Button
              aria-label="Refresh reviews"
              className="size-9 px-0"
              onClick={() => void reviewsQuery.refetch()}
              title="Refresh reviews"
              type="button"
              variant="ghost"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </header>
        {reviewsQuery.isLoading ? (
          <div className="p-4 text-sm text-slate-500">Loading reviews...</div>
        ) : reviewsQuery.isError ? (
          <div className="p-4 text-sm text-red-700">{reviewsQuery.error.message}</div>
        ) : (
          <ReviewList
            reviews={reviewsQuery.data ?? []}
            selectedReviewPath={selectedReviewPath}
            onSelect={setSelectedReviewPath}
          />
        )}
      </Panel>

      <section className="flex min-w-0 flex-col">
        <header className="border-b border-slate-200 bg-white px-5 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {selectedReview?.bundle ?? "default bundle"}
          </div>
          <div className="truncate text-sm font-semibold">
            {selectedReviewPath ?? "No review selected"}
          </div>
        </header>
        <div className="min-h-0 flex-1 bg-white">
          {fileQuery.isLoading ? (
            <div className="p-5 text-sm text-slate-500">Loading review file...</div>
          ) : fileQuery.isError ? (
            <div className="p-5 text-sm text-red-700">{fileQuery.error.message}</div>
          ) : fileQuery.data === undefined ? (
            <div className="p-5 text-sm text-slate-500">Select a review to begin.</div>
          ) : (
            <ReviewEditor text={fileQuery.data.text} onSelectionChange={setSelection} />
          )}
        </div>
      </section>

      <Panel className="flex min-h-0 flex-col border-y-0 border-r-0">
        <header className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Comments</h2>
          <p className="text-xs text-slate-500">
            {commentsQuery.data?.comments.length ?? 0} anchored comments
          </p>
        </header>
        <div className="grid gap-4 overflow-y-auto p-4">
          <CommentComposer
            isSubmitting={addCommentMutation.isPending}
            selection={selection}
            onSubmit={async (body) => {
              if (selection === null) {
                return;
              }
              await addCommentMutation.mutateAsync({
                selectedText: selection.text,
                startLine: selection.startLine,
                comment: body,
              });
              setSelection(null);
            }}
          />
          {addCommentMutation.isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {addCommentMutation.error.message}
            </div>
          ) : null}
          {commentsQuery.isLoading ? (
            <div className="text-sm text-slate-500">Loading comments...</div>
          ) : commentsQuery.isError ? (
            <div className="text-sm text-red-700">{commentsQuery.error.message}</div>
          ) : (
            <CommentThread comments={commentsQuery.data?.comments ?? []} />
          )}
        </div>
      </Panel>
    </main>
  );
}
