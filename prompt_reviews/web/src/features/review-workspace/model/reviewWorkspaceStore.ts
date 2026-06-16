import { create } from "zustand";
import type { TextSelection } from "@/entities/review/types";

type ReviewWorkspaceState = {
  selectedReviewPath: string | null;
  selection: TextSelection | null;
  setSelectedReviewPath: (reviewPath: string) => void;
  setSelection: (selection: TextSelection | null) => void;
};

export const useReviewWorkspaceStore = create<ReviewWorkspaceState>((set) => ({
  selectedReviewPath: null,
  selection: null,
  setSelectedReviewPath: (selectedReviewPath) =>
    set({ selectedReviewPath, selection: null }),
  setSelection: (selection) => set({ selection }),
}));
