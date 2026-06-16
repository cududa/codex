import { create } from "zustand";
import type { SourceRangeDraft } from "@/entities/review/types";

export type ReviewFocus = "commit" | "file";

type ReviewWorkspaceState = {
  selectedVersionId: string | null;
  selectedCommitId: string | null;
  selectedFileId: string | null;
  selectedDiffBlockId: string | null;
  reviewFocus: ReviewFocus;
  sourceRange: SourceRangeDraft | null;
  setSelectedVersionId: (versionId: string) => void;
  setSelectedCommitId: (commitId: string) => void;
  setSelectedFileId: (fileId: string, options?: { focus?: boolean }) => void;
  setSelectedDiffBlockId: (diffBlockId: string | null) => void;
  setReviewFocus: (reviewFocus: ReviewFocus) => void;
  setSourceRange: (sourceRange: SourceRangeDraft | null) => void;
};

export const useReviewWorkspaceStore = create<ReviewWorkspaceState>((set) => ({
  selectedVersionId: null,
  selectedCommitId: null,
  selectedFileId: null,
  selectedDiffBlockId: null,
  reviewFocus: "commit",
  sourceRange: null,
  setSelectedVersionId: (selectedVersionId) =>
    set({
      selectedVersionId,
      selectedCommitId: null,
      selectedFileId: null,
      selectedDiffBlockId: null,
      reviewFocus: "commit",
      sourceRange: null,
    }),
  setSelectedCommitId: (selectedCommitId) =>
    set({
      selectedCommitId,
      selectedFileId: null,
      selectedDiffBlockId: null,
      reviewFocus: "commit",
      sourceRange: null,
    }),
  setSelectedFileId: (selectedFileId, options = {}) =>
    set((state) => ({
      selectedFileId,
      selectedDiffBlockId: null,
      reviewFocus: options.focus === false ? state.reviewFocus : "file",
      sourceRange: null,
    })),
  setSelectedDiffBlockId: (selectedDiffBlockId) => set({ selectedDiffBlockId, sourceRange: null }),
  setReviewFocus: (reviewFocus) =>
    set((state) => ({
      reviewFocus,
      selectedDiffBlockId: reviewFocus === "commit" ? null : state.selectedDiffBlockId,
      sourceRange: null,
    })),
  setSourceRange: (sourceRange) => set({ sourceRange }),
}));
