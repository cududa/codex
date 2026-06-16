import { create } from "zustand";
import type { ReviewCommentTarget } from "./commentTargets";

export type ReviewFocus = "commit" | "file";

type ReviewSelectionState = {
  selectedVersionId: string | null;
  selectedCommitId: string | null;
  selectedFileId: string | null;
  commentTarget: ReviewCommentTarget | null;
  reviewFocus: ReviewFocus;
  setSelectedVersionId: (versionId: string) => void;
  setSelectedCommitId: (commitId: string) => void;
  setSelectedFileId: (fileId: string, options?: { focus?: boolean }) => void;
  setCommentTarget: (commentTarget: ReviewCommentTarget | null) => void;
  setReviewFocus: (reviewFocus: ReviewFocus) => void;
};

export const useReviewSelectionStore = create<ReviewSelectionState>((set) => ({
  selectedVersionId: null,
  selectedCommitId: null,
  selectedFileId: null,
  commentTarget: null,
  reviewFocus: "commit",
  setSelectedVersionId: (selectedVersionId) =>
    set({
      selectedVersionId,
      selectedCommitId: null,
      selectedFileId: null,
      commentTarget: null,
      reviewFocus: "commit",
    }),
  setSelectedCommitId: (selectedCommitId) =>
    set({
      selectedCommitId,
      selectedFileId: null,
      commentTarget: null,
      reviewFocus: "commit",
    }),
  setSelectedFileId: (selectedFileId, options = {}) =>
    set((state) => ({
      selectedFileId,
      commentTarget: null,
      reviewFocus: options.focus === false ? state.reviewFocus : "file",
    })),
  setCommentTarget: (commentTarget) =>
    set((state) => (sameCommentTarget(state.commentTarget, commentTarget) ? state : { commentTarget })),
  setReviewFocus: (reviewFocus) =>
    set((state) => ({
      reviewFocus,
      commentTarget: reviewFocus === "commit" ? null : state.commentTarget,
    })),
}));

function sameCommentTarget(left: ReviewCommentTarget | null, right: ReviewCommentTarget | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  if (left.kind !== right.kind) {
    return false;
  }
  switch (left.kind) {
    case "version":
      return right.kind === "version" && left.versionId === right.versionId;
    case "commit":
      return right.kind === "commit" && left.commitId === right.commitId;
    case "file":
      return right.kind === "file" && left.commitFileId === right.commitFileId;
    case "block":
      return right.kind === "block" && left.diffBlockId === right.diffBlockId;
    case "line":
      if (right.kind !== "line") {
        return false;
      }
      return (
        left.commitFileId === right.commitFileId &&
        left.side === right.side &&
        left.line === right.line &&
        left.text === right.text
      );
    case "range":
      if (right.kind !== "range") {
        return false;
      }
      return (
        left.commitFileId === right.commitFileId &&
        left.side === right.side &&
        left.startLine === right.startLine &&
        left.endLine === right.endLine &&
        left.startColumn === right.startColumn &&
        left.endColumn === right.endColumn &&
        left.selectedText === right.selectedText
      );
  }
}
