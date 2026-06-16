import { describe, expect, it } from "vitest";
import {
  defaultWorkbenchCollapsedState,
  loadWorkbenchCollapsedState,
  saveWorkbenchCollapsedState,
  workbenchLayoutStorageKeys,
} from "./workbenchLayout";

describe("workbenchLayout", () => {
  it("loads defaults when storage is unavailable or empty", () => {
    expect(loadWorkbenchCollapsedState(undefined)).toEqual(defaultWorkbenchCollapsedState);
    expect(loadWorkbenchCollapsedState(memoryStorage())).toEqual(defaultWorkbenchCollapsedState);
  });

  it("round-trips collapsed state through storage", () => {
    const storage = memoryStorage();

    saveWorkbenchCollapsedState(storage, { left: true, right: false });

    expect(loadWorkbenchCollapsedState(storage)).toEqual({ left: true, right: false });
  });

  it("ignores malformed persisted state", () => {
    const storage = memoryStorage();
    storage.setItem(workbenchLayoutStorageKeys.collapsed, "{\"left\":\"yes\"}");

    expect(loadWorkbenchCollapsedState(storage)).toEqual(defaultWorkbenchCollapsedState);
  });
});

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
