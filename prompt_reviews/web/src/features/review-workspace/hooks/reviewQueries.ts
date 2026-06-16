import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReviewComment,
  listReviewComments,
  listReviews,
  readReviewFile,
} from "@/entities/review/api";

export const reviewKeys = {
  all: ["reviews"] as const,
  file: (reviewPath: string | null) => ["review-file", reviewPath] as const,
  comments: (reviewPath: string | null) => ["review-comments", reviewPath] as const,
};

export function useReviewsQuery() {
  return useQuery({
    queryKey: reviewKeys.all,
    queryFn: listReviews,
  });
}

export function useReviewFileQuery(reviewPath: string | null) {
  return useQuery({
    queryKey: reviewKeys.file(reviewPath),
    queryFn: () => readReviewFile(assertPath(reviewPath)),
    enabled: reviewPath !== null,
  });
}

export function useReviewCommentsQuery(reviewPath: string | null) {
  return useQuery({
    queryKey: reviewKeys.comments(reviewPath),
    queryFn: () => listReviewComments(assertPath(reviewPath)),
    enabled: reviewPath !== null,
  });
}

export function useAddReviewCommentMutation(reviewPath: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { selectedText: string; startLine: number; comment: string }) =>
      addReviewComment({
        reviewPath: assertPath(reviewPath),
        ...input,
        author: "user",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.all }),
        queryClient.invalidateQueries({ queryKey: reviewKeys.comments(reviewPath) }),
      ]);
    },
  });
}

function assertPath(reviewPath: string | null): string {
  if (reviewPath === null) {
    throw new Error("No review selected.");
  }
  return reviewPath;
}
