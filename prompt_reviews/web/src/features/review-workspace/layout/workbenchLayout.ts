import type { LayoutStorage } from "react-resizable-panels";

export type WorkbenchCollapsedState = {
  left: boolean;
  right: boolean;
};

export const defaultWorkbenchCollapsedState: WorkbenchCollapsedState = {
  left: false,
  right: false,
};

export const workbenchLayoutStorageKeys = {
  collapsed: "prompt-reviews.workspace.collapsed.v1",
  outer: "prompt-reviews.workspace.outer.v1",
  center: "prompt-reviews.workspace.center.v1",
} as const;

type StoredCollapsedState = Partial<Record<keyof WorkbenchCollapsedState, unknown>>;

export function loadWorkbenchCollapsedState(storage: Pick<Storage, "getItem"> | undefined): WorkbenchCollapsedState {
  if (storage === undefined) {
    return defaultWorkbenchCollapsedState;
  }

  const raw = storage.getItem(workbenchLayoutStorageKeys.collapsed);
  if (raw === null) {
    return defaultWorkbenchCollapsedState;
  }

  try {
    const parsed = JSON.parse(raw) as StoredCollapsedState;
    if (parsed === null || typeof parsed !== "object") {
      return defaultWorkbenchCollapsedState;
    }
    return {
      left: typeof parsed.left === "boolean" ? parsed.left : defaultWorkbenchCollapsedState.left,
      right: typeof parsed.right === "boolean" ? parsed.right : defaultWorkbenchCollapsedState.right,
    };
  } catch {
    return defaultWorkbenchCollapsedState;
  }
}

export function saveWorkbenchCollapsedState(
  storage: Pick<Storage, "setItem"> | undefined,
  state: WorkbenchCollapsedState,
): void {
  storage?.setItem(workbenchLayoutStorageKeys.collapsed, JSON.stringify(state));
}

export function browserLayoutStorage(): LayoutStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
