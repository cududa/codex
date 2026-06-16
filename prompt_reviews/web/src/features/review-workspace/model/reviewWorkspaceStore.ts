import { create } from "zustand";
import type { SourceRangeDraft } from "@/entities/review/types";

type ReviewWorkspaceState = {
  selectedVersionId: string | null;
  selectedCommitId: string | null;
  selectedFileId: string | null;
  selectedDiffBlockId: string | null;
  sourceRange: SourceRangeDraft | null;
  setSelectedVersionId: (versionId: string) => void;
  setSelectedCommitId: (commitId: string) => void;
  setSelectedFileId: (fileId: string) => void;
  setSelectedDiffBlockId: (diffBlockId: string | null) => void;
  setSourceRange: (sourceRange: SourceRangeDraft | null) => void;
};

export const useReviewWorkspaceStore = create<ReviewWorkspaceState>((set) => ({
  selectedVersionId: null,
  selectedCommitId: null,
  selectedFileId: null,
  selectedDiffBlockId: null,
  sourceRange: null,
  setSelectedVersionId: (selectedVersionId) =>
    set({
      selectedVersionId,
      selectedCommitId: null,
      selectedFileId: null,
      selectedDiffBlockId: null,
      sourceRange: null,
    }),
  setSelectedCommitId: (selectedCommitId) =>
    set({
      selectedCommitId,
      selectedFileId: null,
      selectedDiffBlockId: null,
      sourceRange: null,
    }),
  setSelectedFileId: (selectedFileId) =>
    set({
      selectedFileId,
      selectedDiffBlockId: null,
      sourceRange: null,
    }),
  setSelectedDiffBlockId: (selectedDiffBlockId) => set({ selectedDiffBlockId, sourceRange: null }),
  setSourceRange: (sourceRange) => set({ sourceRange }),
}));
