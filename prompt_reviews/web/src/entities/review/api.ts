import { requestJson } from "@/shared/api/http";
import type { ReviewComment, ReviewFile, ReviewNote, ReviewSummary } from "./types";

export async function listReviews(): Promise<ReviewSummary[]> {
  const payload = await requestJson<{ reviews: ReviewSummary[] }>("/api/reviews");
  return payload.reviews;
}

export async function readReviewFile(path: string): Promise<ReviewFile> {
  return requestJson<ReviewFile>(`/api/file?path=${encodeURIComponent(path)}`);
}

export async function listReviewComments(filePath: string): Promise<{
  comments: ReviewComment[];
  notes: ReviewNote[];
}> {
  return requestJson<{ comments: ReviewComment[]; notes: ReviewNote[] }>(
    `/api/comments?filePath=${encodeURIComponent(filePath)}`,
  );
}

export async function addReviewComment(input: {
  reviewPath: string;
  selectedText: string;
  startLine: number;
  comment: string;
  author?: string;
}): Promise<ReviewComment> {
  return requestJson<ReviewComment>("/api/comments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
