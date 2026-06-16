import { describe, expect, it } from "vitest";
import { diffSides } from "../enums.js";
import { SourceAnchorSchema } from "./scopes.js";

describe("scope schemas", () => {
  it("derive enum-like fields from domain enum arrays", () => {
    expect(SourceAnchorSchema.safeParse({ kind: "range", commitFileId: "cf1", side: diffSides[0], startLine: 1, endLine: 1 }).success).toBe(true);
    expect(SourceAnchorSchema.safeParse({ kind: "range", commitFileId: "cf1", side: "current", startLine: 1, endLine: 1 }).success).toBe(false);
  });
});
